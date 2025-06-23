import { useState } from 'react';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';

export type SimulationParams = {
  num_samples: number;
  sequence_length: number;  // in base pairs
  max_time: number;
  population_size?: number;
  random_seed?: number;
  model?: string;
  filename_prefix: string;
  crs?: string;
  ploidy?: number;
  mutation_rate?: number;
  recombination_rate?: number;  // per base pair per generation
};

export const DEFAULT_PARAMS: SimulationParams = {
  num_samples: 25,  // 25 individuals
  sequence_length: 1_000_000,  // 1.0Mb
  max_time: 100,  // 100 generations
  model: "dtwf",  // Discrete Time Wright-Fisher model
  filename_prefix: "simulated",
  crs: "EPSG:4326",  // WGS84
  ploidy: 2,  // Diploid
  mutation_rate: 1e-8,  // Per base pair per generation
  recombination_rate: 1e-8  // Per base pair per generation
};

type TreeSequenceSimulatorProps = {
  onSimulationComplete?: (result: any) => void;
  setLoading: (isLoading: boolean) => void;
};

type SimulationResult = {
  data: {
    message: string;
    filename: string;
    num_samples: number;
    num_trees: number;
    num_mutations: number;
    sequence_length: number;
    crs: string;
  }
};

type TreeSequenceMetadata = {
  data: {
    filename: string;
    num_nodes: number;
    num_edges: number;
    num_samples: number;
    num_trees: number;
    num_mutations: number;
    sequence_length: number;
    has_temporal: boolean;
    has_sample_spatial: boolean;
    has_all_spatial: boolean;
    spatial_status: string;
    is_simulated?: boolean;
  }
};

// Helper function to get model abbreviation for filename
const getModelAbbreviation = (model: string): string => {
  switch (model) {
    case 'dtwf': return 'dtwf';
    case 'hudson': return 'hud';
    case 'smc': return 'smc';
    case 'smc_prime': return 'smcp';
    default: return model.slice(0, 4);
  }
};

// Helper function to get CRS abbreviation for filename
const getCRSAbbreviation = (crs: string): string => {
  switch (crs) {
    case 'EPSG:4326': return '4326';
    case 'unit_grid': return 'ug';
    case 'EPSG:3857': return '3857';
    default: return crs.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4);
  }
};

// Helper function to format date as MMDDYYHHMM
const formatDateShort = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}${day}${year}${hour}${minute}`;
};

// Helper function to generate auto filename
const generateAutoFilename = (params: SimulationParams, customSeed?: number, includeTimestamp = false): string => {
  const modelAbbr = getModelAbbreviation(params.model || 'dtwf');
  const crsAbbr = getCRSAbbreviation(params.crs || 'EPSG:4326');
  
  // Generate a 3-digit random seed if not provided
  const seed = customSeed ?? Math.floor(Math.random() * 1000);
  const seedPart = `r${seed}`;
  
  let filename = `s${params.num_samples}_m${modelAbbr}_t${params.sequence_length}_p${params.ploidy}_c${crsAbbr}_${seedPart}`;
  
  // Only add timestamp when actually simulating
  if (includeTimestamp) {
    const now = new Date();
    const dateStr = formatDateShort(now);
    filename += `_d${dateStr}`;
  }
  
  return filename;
};

// Add this helper function near the other helper functions
const formatScientificNotation = (value: number): string => {
  return value.toExponential(8);  // Format with 8 decimal places
};

// Helper function to format large numbers with units
const formatSequenceLength = (length: number): string => {
  if (length >= 1_000_000) {
    return `${(length / 1_000_000).toFixed(1)}Mb`;
  } else if (length >= 1_000) {
    return `${(length / 1_000).toFixed(1)}kb`;
  }
  return `${length}bp`;
};

// Helper function to parse sequence length input
const parseSequenceLength = (input: string): number => {
  const value = input.toLowerCase().trim();
  if (value.endsWith('mb')) {
    return Math.round(parseFloat(value.slice(0, -2)) * 1_000_000);
  } else if (value.endsWith('kb')) {
    return Math.round(parseFloat(value.slice(0, -2)) * 1_000);
  } else if (value.endsWith('bp')) {
    return Math.round(parseFloat(value.slice(0, -2)));
  }
  return Math.round(parseFloat(value));
};

export default function TreeSequenceSimulator({ onSimulationComplete, setLoading }: TreeSequenceSimulatorProps) {
  const [params, setParams] = useState<SimulationParams>({
    ...DEFAULT_PARAMS,
    filename_prefix: generateAutoFilename(DEFAULT_PARAMS)
  });
  const [useCustomSeed, setUseCustomSeed] = useState(false);
  const [useAutoFilename, setUseAutoFilename] = useState(true);
  const [showFilenameExplanation, setShowFilenameExplanation] = useState(false);
  
  // Separate display state for inputs to allow temporary empty values
  const [inputValues, setInputValues] = useState({
    num_samples: DEFAULT_PARAMS.num_samples.toString(),
    sequence_length: formatSequenceLength(DEFAULT_PARAMS.sequence_length),
    max_time: DEFAULT_PARAMS.max_time.toString(),
    ploidy: DEFAULT_PARAMS.ploidy?.toString() || '2',
    random_seed: DEFAULT_PARAMS.random_seed?.toString() || '42',
    population_size: DEFAULT_PARAMS.population_size?.toString() || '',
    mutation_rate: DEFAULT_PARAMS.mutation_rate?.toString() || formatScientificNotation(DEFAULT_PARAMS.mutation_rate!),
    recombination_rate: DEFAULT_PARAMS.recombination_rate?.toString() || formatScientificNotation(DEFAULT_PARAMS.recombination_rate!),
  });

  const updateParam = (key: keyof SimulationParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };
  
  const updateInputValue = (key: keyof typeof inputValues, value: string) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };
  
  const handleNumberInput = (key: keyof SimulationParams, value: string, min: number, max: number, defaultValue: number) => {
    updateInputValue(key as keyof typeof inputValues, value);
    
    if (value === '') {
      // Allow empty string temporarily
      return;
    }
    
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      updateParam(key, numValue);
    }
  };
  
  const handleNumberBlur = (key: keyof SimulationParams, value: string, min: number, max: number, defaultValue: number) => {
    const numValue = parseInt(value);
    let finalValue = defaultValue;
    
    if (!isNaN(numValue)) {
      finalValue = Math.max(min, Math.min(max, numValue));
    }
    
    updateParam(key, finalValue);
    updateInputValue(key as keyof typeof inputValues, finalValue.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSimulate();
    }
  };

  const handleSequenceLengthInput = (value: string) => {
    setInputValues(prev => ({ ...prev, sequence_length: value }));
    try {
      const parsedLength = parseSequenceLength(value);
      if (!isNaN(parsedLength) && parsedLength > 0) {
        setParams(prev => ({ ...prev, sequence_length: parsedLength }));
      }
    } catch (e) {
      // Invalid input, keep previous value
    }
  };

  const handleSequenceLengthBlur = (value: string) => {
    try {
      const parsedLength = parseSequenceLength(value);
      if (isNaN(parsedLength) || parsedLength <= 0) {
        // Reset to default if invalid
        setInputValues(prev => ({ ...prev, sequence_length: formatSequenceLength(DEFAULT_PARAMS.sequence_length) }));
        setParams(prev => ({ ...prev, sequence_length: DEFAULT_PARAMS.sequence_length }));
      } else {
        // Format the value nicely
        setInputValues(prev => ({ ...prev, sequence_length: formatSequenceLength(parsedLength) }));
        setParams(prev => ({ ...prev, sequence_length: parsedLength }));
      }
    } catch (e) {
      // Reset to default if parsing fails
      setInputValues(prev => ({ ...prev, sequence_length: formatSequenceLength(DEFAULT_PARAMS.sequence_length) }));
      setParams(prev => ({ ...prev, sequence_length: DEFAULT_PARAMS.sequence_length }));
    }
  };

  // Get the filename to display - auto-generated or custom
  const getDisplayFilename = (): string => {
    if (useAutoFilename) {
      return generateAutoFilename(params, useCustomSeed ? params.random_seed : undefined);
    }
    return params.filename_prefix;
  };

  const handleSimulate = async () => {
    setLoading(true);
    
    try {
      log.user.action('simulate-start', { params }, 'TreeSequenceSimulator');
      
      // Prepare simulation parameters
      const simulationParams: SimulationParams = {
        ...params,
        population_size: params.num_samples * (params.ploidy ?? 2),
        random_seed: useCustomSeed ? params.random_seed : undefined,
        filename_prefix: useAutoFilename ? generateAutoFilename(params, useCustomSeed ? params.random_seed : undefined, true) : params.filename_prefix,
      };
      
      // Simulate tree sequence
      const result = await api.simulateTreeSequence(simulationParams) as SimulationResult;
      
      // Fetch full metadata
      const metadata = await api.getTreeSequenceMetadata(result.data.filename) as TreeSequenceMetadata;
      
      // Merge mutation data from simulation response with metadata
      const mergedMetadata = {
        ...metadata.data,
        num_mutations: result.data.num_mutations,
        crs: result.data.crs
      };
      
      log.info('Tree sequence simulation completed successfully', {
        component: 'TreeSequenceSimulator',
        data: { params: simulationParams, result, metadata: mergedMetadata }
      });
      
      if (onSimulationComplete) {
        onSimulationComplete(mergedMetadata);
      }
    } catch (err) {
      log.error('Tree sequence simulation failed', {
        component: 'TreeSequenceSimulator',
        error: err instanceof Error ? err : new Error(String(err)),
        data: { params }
      });
      // Show error message to user
      alert(`Simulation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Main Parameter Configuration Card */}
      <div className="bg-sp-dark-blue border border-sp-pale-green/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-sp-pale-green/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-sp-white">Simulation Parameters</h3>
            <p className="text-sp-white/60 text-xs">Configure the tree sequence simulation settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Number of sample individuals */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-sp-white mb-1">
              Sample individuals
            </label>
            <input
              type="number"
              min="2"
              max="500"
              value={inputValues.num_samples}
              onChange={(e) => handleNumberInput('num_samples', e.target.value, 2, 500, 2)}
              onBlur={(e) => handleNumberBlur('num_samples', e.target.value, 2, 500, 2)}
              onKeyDown={handleKeyDown}
              className="px-3 py-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green focus:border-transparent transition-all duration-200 text-sm"
            />
            <span className="text-xs text-sp-white/60 mt-0.5">Range: 2-500</span>
          </div>

          {/* Ploidy */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-sp-white mb-1">
              Ploidy
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={inputValues.ploidy}
              onChange={(e) => handleNumberInput('ploidy', e.target.value, 1, 10, 2)}
              onBlur={(e) => handleNumberBlur('ploidy', e.target.value, 1, 10, 2)}
              onKeyDown={handleKeyDown}
              className="px-3 py-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green focus:border-transparent transition-all duration-200 text-sm"
            />
            <span className="text-xs text-sp-white/60 mt-0.5">1-10 (2=diploid)</span>
          </div>

          {/* Sequence Length */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-sp-white mb-1">
              Sequence Length (e.g., 1Mb, 100kb, 1000bp)
            </label>
            <input
              type="text"
              value={inputValues.sequence_length}
              onChange={(e) => handleSequenceLengthInput(e.target.value)}
              onBlur={(e) => handleSequenceLengthBlur(e.target.value)}
              className="px-3 py-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green focus:border-transparent transition-all duration-200 text-sm"
            />
            <span className="text-xs text-sp-white/60 mt-0.5">
              {formatSequenceLength(params.sequence_length)}
            </span>
          </div>

          {/* Maximum time */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-sp-white mb-1">
              Max generations
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={inputValues.max_time}
              onChange={(e) => handleNumberInput('max_time', e.target.value, 1, 1000, 1)}
              onBlur={(e) => handleNumberBlur('max_time', e.target.value, 1, 1000, 1)}
              onKeyDown={handleKeyDown}
              className="px-3 py-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green focus:border-transparent transition-all duration-200 text-sm"
            />
            <span className="text-xs text-sp-white/60 mt-0.5">1-1000</span>
          </div>

          {/* Model */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-sp-white mb-1">
              Model
            </label>
            <select
              value={params.model || 'dtwf'}
              onChange={(e) => updateParam('model', e.target.value)}
              onKeyDown={handleKeyDown}
              className="px-3 py-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green focus:border-transparent transition-all duration-200 text-sm"
            >
              <option value="dtwf">Discrete Wright-Fisher</option>
              <option value="hudson">Hudson</option>
              <option value="smc">SMC</option>
              <option value="smc_prime">SMC'</option>
            </select>
          </div>

          {/* Coordinate System */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-sp-white mb-1 flex items-center gap-1">
              Coordinate System
              <div className="relative group">
                <div className="w-4 h-4 bg-sp-pale-green/20 rounded-full flex items-center justify-center cursor-help">
                  <svg className="w-3 h-3 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="hidden group-hover:block absolute left-0 top-full mt-1 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl z-50 text-xs text-sp-white/80">
                  While samples will be assigned coordinates in the specified coordinate system, these locations are simulated separately from the coalescent simulation and may not reflect real-world evolutionary processes accurately.
                </div>
              </div>
            </label>
            <select
              value={params.crs || 'EPSG:4326'}
              onChange={(e) => updateParam('crs', e.target.value)}
              onKeyDown={handleKeyDown}
              className="px-3 py-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green focus:border-transparent transition-all duration-200 text-sm"
            >
              <option value="EPSG:4326">WGS84 Geographic</option>
              <option value="unit_grid">Unit Grid (0-1)</option>
              <option value="EPSG:3857">Web Mercator</option>
            </select>
            <span className="text-xs text-sp-white/60 mt-0.5">
              Spatial coordinate system
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Population Summary */}
        <div className="bg-sp-pale-green/10 border border-sp-pale-green/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-sp-pale-green/20 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="font-medium text-sp-white text-sm">Population Summary</h4>
          </div>
          <div className="text-sm text-sp-white">
            <div className="flex justify-between items-center">
              <span>Total haplotypes:</span>
              <span className="font-bold text-sp-pale-green">{params.num_samples * (params.ploidy ?? 2)}</span>
            </div>
            <div className="text-xs text-sp-white/60">
              {params.num_samples} individuals × {params.ploidy ?? 2} ploidy
            </div>
          </div>
        </div>

        {/* Filename Preview */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-medium text-sp-white text-sm">Output Filename</h4>
          </div>
          <div className="text-sm text-sp-white">
            <div className="font-mono text-sp-pale-green break-all text-xs">{getDisplayFilename()}</div>
            <div className="text-xs text-sp-white/60">
              {useAutoFilename ? (
                <button
                  onClick={() => setShowFilenameExplanation(true)}
                  className="underline hover:text-sp-pale-green transition-colors cursor-pointer"
                >
                  Auto-generated from parameters
                </button>
              ) : (
                'Custom filename'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="bg-sp-dark-blue border border-sp-pale-green/20 rounded-xl overflow-hidden">
        <details className="group">
          <summary className="px-5 py-3 cursor-pointer hover:bg-sp-pale-green/5 transition-colors duration-200 border-b border-sp-pale-green/10 group-open:border-b-0 list-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-sp-pale-green/10 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-sp-pale-green transition-transform duration-200 group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <span className="font-medium text-sp-white text-sm">Advanced Options</span>
              </div>
            </div>
          </summary>
          
          <div className="px-5 py-3 space-y-3 bg-sp-very-dark-blue/50">
            {/* Filename options */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useAutoFilename"
                  checked={useAutoFilename}
                  onChange={(e) => setUseAutoFilename(e.target.checked)}
                  onKeyDown={handleKeyDown}
                  className="mr-2 w-4 h-4 text-sp-pale-green bg-sp-very-dark-blue border-sp-pale-green/30 rounded focus:ring-sp-pale-green focus:ring-2"
                />
                <label htmlFor="useAutoFilename" className="text-sm font-medium text-sp-white">
                  Auto-generate filename
                </label>
              </div>
              {!useAutoFilename && (
                <div className="ml-6">
                  <label className="text-sm font-medium text-sp-white mb-1 block">
                    Custom filename prefix
                  </label>
                  <input
                    type="text"
                    value={params.filename_prefix}
                    onChange={(e) => updateParam('filename_prefix', e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="simulated"
                  />
                </div>
              )}
            </div>

            {/* Custom random seed */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useCustomSeed"
                  checked={useCustomSeed}
                  onChange={(e) => setUseCustomSeed(e.target.checked)}
                  onKeyDown={handleKeyDown}
                  className="mr-2 w-4 h-4 text-sp-pale-green bg-sp-very-dark-blue border-sp-pale-green/30 rounded focus:ring-sp-pale-green focus:ring-2"
                />
                <label htmlFor="useCustomSeed" className="text-sm font-medium text-sp-white">
                  Use custom random seed
                </label>
              </div>
              {useCustomSeed ? (
                <div className="ml-6">
                  <input
                    type="number"
                    value={inputValues.random_seed}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateInputValue('random_seed', value);
                      if (value !== '') {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue)) {
                          updateParam('random_seed', numValue);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value);
                      const finalValue = isNaN(value) ? 42 : value;
                      updateParam('random_seed', finalValue);
                      updateInputValue('random_seed', finalValue.toString());
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="42"
                  />
                </div>
              ) : (
                <div className="ml-6 text-xs text-sp-white/60">Random seed will be generated automatically</div>
              )}
            </div>

            {/* Population Size */}
            <div className="space-y-2">
              <label htmlFor="population-size" className="block text-sm font-medium text-sp-white/80">
                Population Size (optional)
              </label>
              <input
                type="number"
                id="population-size"
                value={inputValues.population_size}
                onChange={(e) => handleNumberInput('population_size', e.target.value, 1, 1000000, 1000)}
                onBlur={(e) => handleNumberBlur('population_size', e.target.value, 1, 1000000, 1000)}
                className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green"
                placeholder="1000"
              />
              <p className="text-xs text-sp-white/60">
                Default: 1000 (effective population size)
              </p>
            </div>

            {/* Mutation Rate */}
            <div className="space-y-2">
              <label htmlFor="mutation-rate" className="block text-sm font-medium text-sp-white/80">
                Mutation Rate (per base pair per generation)
              </label>
              <input
                type="text"
                id="mutation-rate"
                value={inputValues.mutation_rate}
                onChange={(e) => {
                  setInputValues(prev => ({ ...prev, mutation_rate: e.target.value }));
                  const rate = parseFloat(e.target.value);
                  if (!isNaN(rate) && rate > 0) {
                    setParams(prev => ({ ...prev, mutation_rate: rate }));
                  }
                }}
                onBlur={(e) => {
                  const rate = parseFloat(e.target.value);
                  if (isNaN(rate) || rate <= 0) {
                    setInputValues(prev => ({ ...prev, mutation_rate: formatScientificNotation(DEFAULT_PARAMS.mutation_rate!) }));
                    setParams(prev => ({ ...prev, mutation_rate: DEFAULT_PARAMS.mutation_rate }));
                  } else {
                    setInputValues(prev => ({ ...prev, mutation_rate: formatScientificNotation(rate) }));
                    setParams(prev => ({ ...prev, mutation_rate: rate }));
                  }
                }}
                className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green font-mono"
                placeholder="1e-8"
              />
              <p className="text-xs text-sp-white/60">
                Default: 1e-8 (0.00000001)
              </p>
            </div>

            {/* Recombination Rate */}
            <div className="space-y-2">
              <label htmlFor="recombination-rate" className="block text-sm font-medium text-sp-white/80">
                Recombination Rate (per base pair per generation)
              </label>
              <input
                type="text"
                id="recombination-rate"
                value={inputValues.recombination_rate}
                onChange={(e) => {
                  setInputValues(prev => ({ ...prev, recombination_rate: e.target.value }));
                  const rate = parseFloat(e.target.value);
                  if (!isNaN(rate) && rate > 0) {
                    setParams(prev => ({ ...prev, recombination_rate: rate }));
                  }
                }}
                onBlur={(e) => {
                  const rate = parseFloat(e.target.value);
                  if (isNaN(rate) || rate <= 0) {
                    setInputValues(prev => ({ ...prev, recombination_rate: formatScientificNotation(DEFAULT_PARAMS.recombination_rate!) }));
                    setParams(prev => ({ ...prev, recombination_rate: DEFAULT_PARAMS.recombination_rate }));
                  } else {
                    setInputValues(prev => ({ ...prev, recombination_rate: formatScientificNotation(rate) }));
                    setParams(prev => ({ ...prev, recombination_rate: rate }));
                  }
                }}
                className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green font-mono"
                placeholder="1e-8"
              />
              <p className="text-xs text-sp-white/60">
                Default: 1e-8 (0.00000001)
              </p>
            </div>
          </div>
        </details>
      </div>

      {/* Simulate Button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={handleSimulate}
          className="bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Simulate Tree Sequence
        </button>
      </div>

      {/* Filename Explanation Modal */}
      {showFilenameExplanation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-sp-very-dark-blue border border-sp-pale-green/30 rounded-xl p-5 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-sp-white">Filename Format Explained</h3>
              <button
                onClick={() => setShowFilenameExplanation(false)}
                className="text-sp-white/60 hover:text-sp-white transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-sp-white">
              <div className="font-mono text-sm text-sp-pale-green bg-sp-dark-blue rounded-lg p-3 break-all">
                {getDisplayFilename()}
              </div>
              
              <div className="space-y-1.5">
                <div><span className="font-bold text-sp-pale-green">s{params.num_samples}</span> - Sample individuals (2-500)</div>
                <div><span className="font-bold text-sp-pale-green">m{getModelAbbreviation(params.model || 'dtwf')}</span> - Model (dtwf, hud, smc, smcp)</div>
                <div><span className="font-bold text-sp-pale-green">t{params.sequence_length}</span> - Sequence Length ({formatSequenceLength(params.sequence_length)})</div>
                <div><span className="font-bold text-sp-pale-green">g{params.max_time}</span> - Max generations (1-1000)</div>
                <div><span className="font-bold text-sp-pale-green">p{params.ploidy ?? 2}</span> - Ploidy (1-4)</div>
                <div><span className="font-bold text-sp-pale-green">c{getCRSAbbreviation(params.crs || 'EPSG:4326')}</span> - Coordinate system</div>
                <div><span className="font-bold text-sp-pale-green">r###</span> - Random seed (0-999)</div>
                <div><span className="font-bold text-sp-pale-green">d##########</span> - Timestamp (MMDDYYHHMM)</div>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilenameExplanation(false)}
              className="w-full mt-4 bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white font-medium py-2.5 rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 