import { useState } from 'react';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';

type SimulationParams = {
  num_samples: number;
  num_local_trees: number;
  max_time: number;
  population_size?: number;
  random_seed?: number;
  model: string;
  filename_prefix: string;
  crs?: string;
  ploidy: number;
};

type TreeSequenceSimulatorProps = {
  onSimulationComplete?: (result: any) => void;
  setLoading: (isLoading: boolean) => void;
};

const DEFAULT_PARAMS: SimulationParams = {
  num_samples: 50,
  num_local_trees: 10,
  max_time: 20,
  model: 'dtwf',
  filename_prefix: 'simulated',
  crs: 'EPSG:4326',
  ploidy: 2
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
  const modelAbbr = getModelAbbreviation(params.model);
  const crsAbbr = getCRSAbbreviation(params.crs || 'EPSG:4326');
  
  // Generate a 3-digit random seed if not provided
  const seed = customSeed ?? Math.floor(Math.random() * 1000);
  const seedPart = `r${seed}`;
  
  let filename = `s${params.num_samples}_m${modelAbbr}_t${params.num_local_trees}_g${params.max_time}_p${params.ploidy}_c${crsAbbr}_${seedPart}`;
  
  // Only add timestamp when actually simulating
  if (includeTimestamp) {
    const now = new Date();
    const dateStr = formatDateShort(now);
    filename += `_d${dateStr}`;
  }
  
  return filename;
};

export default function TreeSequenceSimulator({ onSimulationComplete, setLoading }: TreeSequenceSimulatorProps) {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [useCustomSeed, setUseCustomSeed] = useState(false);
  const [useAutoFilename, setUseAutoFilename] = useState(true);
  const [showFilenameExplanation, setShowFilenameExplanation] = useState(false);
  
  // Separate display state for inputs to allow temporary empty values
  const [inputValues, setInputValues] = useState({
    num_samples: DEFAULT_PARAMS.num_samples.toString(),
    num_local_trees: DEFAULT_PARAMS.num_local_trees.toString(),
    max_time: DEFAULT_PARAMS.max_time.toString(),
    ploidy: DEFAULT_PARAMS.ploidy.toString(),
    random_seed: DEFAULT_PARAMS.random_seed?.toString() || '42'
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
      const simulationParams = {
        ...params,
        // Calculate population size from samples and ploidy
        population_size: params.num_samples * params.ploidy,
        random_seed: useCustomSeed ? params.random_seed : undefined,
        filename_prefix: useAutoFilename ? generateAutoFilename(params, useCustomSeed ? params.random_seed : undefined, true) : params.filename_prefix,
      };
      
      const result = await api.simulateTreeSequence(simulationParams);
      
      log.info('Tree sequence simulation completed successfully', {
        component: 'TreeSequenceSimulator',
        data: { params: simulationParams, result }
      });
      
      if (onSimulationComplete) {
        onSimulationComplete(result.data);
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
    <div className="w-full flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            className="px-3 py-2 bg-sp-dark-blue border border-sp-dark-blue rounded-md text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green text-sm"
          />
          <span className="text-xs text-sp-very-pale-green mt-0.5">2-500 individuals</span>
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
            className="px-3 py-2 bg-sp-dark-blue border border-sp-dark-blue rounded-md text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green text-sm"
          />
          <span className="text-xs text-sp-very-pale-green mt-0.5">1-10 (2=diploid)</span>
        </div>

        {/* Number of local trees */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-sp-white mb-1">
            Local trees
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={inputValues.num_local_trees}
            onChange={(e) => handleNumberInput('num_local_trees', e.target.value, 1, 1000, 1)}
            onBlur={(e) => handleNumberBlur('num_local_trees', e.target.value, 1, 1000, 1)}
            className="px-3 py-2 bg-sp-dark-blue border border-sp-dark-blue rounded-md text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green text-sm"
          />
          <span className="text-xs text-sp-very-pale-green mt-0.5">1-1000</span>
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
            className="px-3 py-2 bg-sp-dark-blue border border-sp-dark-blue rounded-md text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green text-sm"
          />
          <span className="text-xs text-sp-very-pale-green mt-0.5">1-1000</span>
        </div>

        {/* Model */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-sp-white mb-1">
            Model
          </label>
          <select
            value={params.model}
            onChange={(e) => updateParam('model', e.target.value)}
            className="px-3 py-2 bg-sp-dark-blue border border-sp-dark-blue rounded-md text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green text-sm"
          >
            <option value="dtwf">Discrete WF</option>
            <option value="hudson">Hudson</option>
            <option value="smc">SMC</option>
            <option value="smc_prime">SMC'</option>
          </select>
        </div>

        {/* Coordinate System */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-sp-white mb-1">
            Coordinate System
          </label>
          <select
            value={params.crs || 'EPSG:4326'}
            onChange={(e) => updateParam('crs', e.target.value)}
            className="px-3 py-2 bg-sp-dark-blue border border-sp-dark-blue rounded-md text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green text-sm"
          >
            <option value="EPSG:4326">WGS84 Geographic</option>
            <option value="unit_grid">Unit Grid (0-1)</option>
            <option value="EPSG:3857">Web Mercator</option>
          </select>
          <span className="text-xs text-sp-very-pale-green mt-0.5">
            Coordinate system for spatial locations
          </span>
        </div>
      </div>

      {/* Population size display */}
      <div className="p-3 rounded-md" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
        <div className="text-sm text-sp-white">
          <strong>Total haplotypes:</strong> {params.num_samples * params.ploidy} 
          <span className="text-xs text-sp-very-pale-green ml-2">
            ({params.num_samples} individuals × {params.ploidy} ploidy)
          </span>
        </div>
      </div>

      {/* Filename preview */}
      <div className="p-3 rounded-md" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div className="text-sm text-sp-white">
          <strong>Filename:</strong> {getDisplayFilename()}
          <span className="text-xs text-sp-very-pale-green block mt-1">
            {useAutoFilename ? (
              <button
                onClick={() => setShowFilenameExplanation(true)}
                className="underline hover:text-sp-pale-green transition-colors cursor-pointer"
              >
                Auto-generated based on parameters
              </button>
            ) : (
              'Custom filename'
            )}
          </span>
        </div>
      </div>

      {/* Advanced options - Collapsible */}
      <details className="border-t border-sp-dark-blue pt-3">
        <summary className="text-sm font-medium text-sp-white mb-2 cursor-pointer hover:text-sp-pale-green">
          Advanced Options
        </summary>
        
        <div className="space-y-3 mt-2">
          {/* Filename options */}
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="useAutoFilename"
                checked={useAutoFilename}
                onChange={(e) => setUseAutoFilename(e.target.checked)}
                className="mr-2 accent-sp-pale-green"
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
                  className="px-3 py-2 bg-sp-dark-blue border border-sp-dark-blue rounded-md text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green text-sm w-full"
                  placeholder="simulated"
                />
              </div>
            )}
          </div>

          {/* Custom random seed */}
          <div className="flex flex-col">
            <div className="flex items-center mb-1">
              <input
                type="checkbox"
                id="useCustomSeed"
                checked={useCustomSeed}
                onChange={(e) => setUseCustomSeed(e.target.checked)}
                className="mr-2 accent-sp-pale-green"
              />
              <label htmlFor="useCustomSeed" className="text-sm font-medium text-sp-white">
                Custom seed
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
                  className="px-3 py-2 bg-sp-dark-blue border border-sp-dark-blue rounded-md text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green text-sm w-full"
                />
              </div>
            ) : (
              <span className="text-xs text-sp-very-pale-green ml-6">Random</span>
            )}
          </div>
        </div>
      </details>

      {/* Simulate button */}
      <button
        type="button"
        onClick={handleSimulate}
        className="w-full mt-3 bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-bold py-2.5 rounded-lg transition-colors shadow-md"
      >
        Simulate Tree Sequence
      </button>

      {/* Filename Explanation Modal */}
      {showFilenameExplanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-sp-very-dark-blue border border-sp-dark-blue rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-sp-white">Filename Format Explained</h3>
              <button
                onClick={() => setShowFilenameExplanation(false)}
                className="text-sp-very-pale-green hover:text-sp-white transition-colors text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-sp-white">
              <div className="font-mono text-xs text-sp-pale-green mb-3">
                {getDisplayFilename()}
              </div>
              
              <div className="space-y-2">
                <div><strong>s{params.num_samples}</strong> - Sample individuals (integer: 2-500)</div>
                <div><strong>m{getModelAbbreviation(params.model)}</strong> - Model (dtwf, hud, smc, smcp)</div>
                <div><strong>t{params.num_local_trees}</strong> - Local trees (integer: 1-1000)</div>
                <div><strong>g{params.max_time}</strong> - Max generations (integer: 1-1000)</div>
                <div><strong>p{params.ploidy}</strong> - Ploidy (integer: 1-10)</div>
                <div><strong>c{getCRSAbbreviation(params.crs || 'EPSG:4326')}</strong> - Coordinate system (4326, ug, 3857)</div>
                <div><strong>r###</strong> - Random seed (0-999)</div>
                <div><strong>d##########</strong> - Timestamp (MMDDYYHHMM format)</div>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilenameExplanation(false)}
              className="w-full mt-4 bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-medium py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 