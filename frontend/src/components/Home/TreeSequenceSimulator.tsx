import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';
import { isRailway, RAILWAY_MAX_FILE_SIZE_BYTES, RAILWAY_LIMITS } from '../../config/constants';

const RAILWAY_MAX_NODES = RAILWAY_LIMITS.MAX_NODES;
import './TreeSequenceSimulator.css';
import { Tooltip } from '../ui/tooltip';
import AlertModal from '../ui/AlertModal';

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

// Validation constants for parameter ranges
export const PARAM_RANGES = {
  num_samples: { min: 1, max: 500, name: 'Sample individuals' },
  ploidy: { min: 1, max: 10, name: 'Ploidy' },
  max_time: { min: 1, max: 1000, name: 'Max generations' },
  sequence_length: { min: 1, max: 1_000_000_000, name: 'Sequence length' },
  population_size: { min: 1, max: 1_000_000, name: 'Effective population size' },
  mutation_rate: { min: 0, max: 1, name: 'Mutation rate' },
  recombination_rate: { min: 0, max: 1, name: 'Recombination rate' },
} as const;

type TreeSequenceSimulatorProps = {
  onSimulationComplete?: (result: any) => void;
  setLoading: (isLoading: boolean) => void;
};

type ValidationError = {
  param: string;
  value: number;
  min: number;
  max: number;
  name: string;
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

// Validation function
const validateParams = (params: SimulationParams): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Check each parameter that has a range
  const paramsToValidate: Array<keyof typeof PARAM_RANGES> = [
    'num_samples', 'ploidy', 'max_time', 'sequence_length'
  ];
  
  for (const param of paramsToValidate) {
    const value = params[param];
    const range = PARAM_RANGES[param];
    
    if (value !== undefined && (value < range.min || value > range.max)) {
      errors.push({
        param,
        value,
        min: range.min,
        max: range.max,
        name: range.name
      });
    }
  }
  
  // Check optional parameters if they exist
  if (params.population_size !== undefined) {
    const range = PARAM_RANGES.population_size;
    if (params.population_size < range.min || params.population_size > range.max) {
      errors.push({
        param: 'population_size',
        value: params.population_size,
        min: range.min,
        max: range.max,
        name: range.name
      });
    }
  }
  
  if (params.mutation_rate !== undefined) {
    const range = PARAM_RANGES.mutation_rate;
    if (params.mutation_rate < range.min || params.mutation_rate > range.max) {
      errors.push({
        param: 'mutation_rate',
        value: params.mutation_rate,
        min: range.min,
        max: range.max,
        name: range.name
      });
    }
  }
  
  if (params.recombination_rate !== undefined) {
    const range = PARAM_RANGES.recombination_rate;
    if (params.recombination_rate < range.min || params.recombination_rate > range.max) {
      errors.push({
        param: 'recombination_rate',
        value: params.recombination_rate,
        min: range.min,
        max: range.max,
        name: range.name
      });
    }
  }
  
  return errors;
};

export default function TreeSequenceSimulator({ onSimulationComplete, setLoading }: TreeSequenceSimulatorProps) {
  const [params, setParams] = useState<SimulationParams>({
    ...DEFAULT_PARAMS,
    filename_prefix: generateAutoFilename(DEFAULT_PARAMS)
  });
  const [useCustomSeed, setUseCustomSeed] = useState(false);
  const [useAutoFilename, setUseAutoFilename] = useState(true);
  const [showFilenameExplanation, setShowFilenameExplanation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const isRailwayDemo = useMemo(() => {
    // Prefer explicit env flag when provided (set on Railway)
    const envFlag = (import.meta.env as any)?.VITE_IS_RAILWAY;
    const fromEnv = typeof envFlag === 'string' ? envFlag.toLowerCase() === 'true' : !!envFlag;
    if (fromEnv) return true;
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname.toLowerCase();
    return host.includes('railway.app') || host.includes('railway');
  }, []);
  const isUnsafeToggleAllowed = import.meta.env.DEV || (!isRailwayDemo);
  const [unsafeRangesEnabled, setUnsafeRangesEnabled] = useState(false);
  
  const hasClampedParamsRef = useRef(false);
  
  // Force unsafe mode to false when Railway is detected (useEffect to handle dynamic changes)
  useEffect(() => {
    if (isRailwayDemo && unsafeRangesEnabled) {
      setUnsafeRangesEnabled(false);
    }
  }, [isRailwayDemo, unsafeRangesEnabled]);
  
  // Clamp parameters to Railway limits when Railway mode is first detected
  useEffect(() => {
    if (isRailwayDemo && !hasClampedParamsRef.current) {
      let updated = false;
      const newParams = { ...params };
      
      if (params.num_samples > RAILWAY_LIMITS.MAX_SAMPLES) {
        newParams.num_samples = RAILWAY_LIMITS.MAX_SAMPLES;
        updateInputValue('num_samples', RAILWAY_LIMITS.MAX_SAMPLES.toString());
        updated = true;
      }
      if (params.sequence_length > RAILWAY_LIMITS.MAX_SEQUENCE_LENGTH) {
        newParams.sequence_length = RAILWAY_LIMITS.MAX_SEQUENCE_LENGTH;
        updateInputValue('sequence_length', formatSequenceLength(RAILWAY_LIMITS.MAX_SEQUENCE_LENGTH));
        updated = true;
      }
      if (params.max_time > RAILWAY_LIMITS.MAX_TIME) {
        newParams.max_time = RAILWAY_LIMITS.MAX_TIME;
        updateInputValue('max_time', RAILWAY_LIMITS.MAX_TIME.toString());
        updated = true;
      }
      
      if (updated) {
        setParams(newParams);
        hasClampedParamsRef.current = true;
      }
    }
    
    // Reset flag if Railway mode is disabled
    if (!isRailwayDemo) {
      hasClampedParamsRef.current = false;
    }
  }, [isRailwayDemo, params.num_samples, params.sequence_length, params.max_time]);
  
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
  
  const handleNumberInput = (key: keyof SimulationParams, value: string, min: number, max: number, _defaultValue: number) => {
    // Allow empty string temporarily
    if (value === '') {
      updateInputValue(key as keyof typeof inputValues, value);
      return;
    }
    
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Determine effective bounds
      let effectiveMin = unsafeRangesEnabled && !isRailwayDemo ? 1 : min;
      let effectiveMax = unsafeRangesEnabled && !isRailwayDemo ? Number.MAX_SAFE_INTEGER : max;
      
      // Apply Railway limits if on Railway
      if (isRailwayDemo) {
        if (key === 'num_samples') {
          effectiveMax = Math.min(effectiveMax, RAILWAY_LIMITS.MAX_SAMPLES);
        } else if (key === 'max_time') {
          effectiveMax = Math.min(effectiveMax, RAILWAY_LIMITS.MAX_TIME);
        }
      }
      
      // Clamp value to effective min/max range
      const clampedValue = Math.max(effectiveMin, Math.min(effectiveMax, numValue));
      updateParam(key, clampedValue);
      updateInputValue(key as keyof typeof inputValues, clampedValue.toString());
    }
  };
  
  const handleNumberBlur = (key: keyof SimulationParams, value: string, min: number, max: number, defaultValue: number) => {
    const numValue = parseInt(value);
    let finalValue = defaultValue;
    
    if (!isNaN(numValue)) {
      let effectiveMin = unsafeRangesEnabled && !isRailwayDemo ? 1 : min;
      let effectiveMax = unsafeRangesEnabled && !isRailwayDemo ? Number.MAX_SAFE_INTEGER : max;
      
      // Apply Railway limits if on Railway
      if (isRailwayDemo) {
        if (key === 'num_samples') {
          effectiveMax = Math.min(effectiveMax, RAILWAY_LIMITS.MAX_SAMPLES);
        } else if (key === 'max_time') {
          effectiveMax = Math.min(effectiveMax, RAILWAY_LIMITS.MAX_TIME);
        }
      }
      
      // Clamp to effective min/max range
      finalValue = Math.max(effectiveMin, Math.min(effectiveMax, numValue));
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
        // Apply Railway limit if on Railway
        const maxLength = isRailwayDemo 
          ? Math.min(RAILWAY_LIMITS.MAX_SEQUENCE_LENGTH, unsafeRangesEnabled ? Number.MAX_SAFE_INTEGER : PARAM_RANGES.sequence_length.max)
          : (unsafeRangesEnabled ? Number.MAX_SAFE_INTEGER : PARAM_RANGES.sequence_length.max);
        const clampedLength = Math.min(parsedLength, maxLength);
        setParams(prev => ({ ...prev, sequence_length: clampedLength }));
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
        // Apply Railway limit if on Railway
        const maxLength = isRailwayDemo 
          ? Math.min(RAILWAY_LIMITS.MAX_SEQUENCE_LENGTH, unsafeRangesEnabled ? Number.MAX_SAFE_INTEGER : PARAM_RANGES.sequence_length.max)
          : (unsafeRangesEnabled ? Number.MAX_SAFE_INTEGER : PARAM_RANGES.sequence_length.max);
        const clampedLength = Math.min(parsedLength, maxLength);
        // Format the value nicely
        setInputValues(prev => ({ ...prev, sequence_length: formatSequenceLength(clampedLength) }));
        setParams(prev => ({ ...prev, sequence_length: clampedLength }));
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

  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [showSizeLimitModal, setShowSizeLimitModal] = useState(false);
  const [showParameterLimitModal, setShowParameterLimitModal] = useState(false);
  const [showNodeLimitModal, setShowNodeLimitModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [parameterLimitMessage, setParameterLimitMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const navigate = useNavigate();
  
  // Debug: Log when modal state changes
  useEffect(() => {
    console.log('showParameterLimitModal changed to:', showParameterLimitModal);
    if (showParameterLimitModal) {
      console.log('Parameter limit modal is now OPEN - modal should render');
    }
  }, [showParameterLimitModal]);
  
  // Debug: Log component mount/unmount
  useEffect(() => {
    console.log('TreeSequenceSimulator MOUNTED');
    return () => {
      console.log('TreeSequenceSimulator UNMOUNTED - this would clear modal state!');
    };
  }, []);

  const handleSimulate = async () => {
    // Prevent multiple simultaneous simulations
    if (isSimulating) {
      return;
    }
    // Validate parameters before simulating
    const errors = unsafeRangesEnabled ? (() => {
      const errs: ValidationError[] = [];
      // Only enforce positivity (>0) for numeric fields when unsafe is enabled
      const positiveIntFields: Array<keyof SimulationParams> = ['num_samples', 'ploidy', 'max_time', 'sequence_length'];
      positiveIntFields.forEach((field) => {
        const v = params[field] as unknown as number | undefined;
        if (v !== undefined && (!Number.isFinite(v) || v <= 0)) {
          errs.push({ param: String(field), value: v as number, min: 1, max: Number.MAX_SAFE_INTEGER, name: String(field) });
        }
      });
      if (params.population_size !== undefined && (!Number.isFinite(params.population_size) || params.population_size <= 0)) {
        errs.push({ param: 'population_size', value: params.population_size, min: 1, max: Number.MAX_SAFE_INTEGER, name: 'Effective population size' });
      }
      if (params.mutation_rate !== undefined && (!Number.isFinite(params.mutation_rate) || params.mutation_rate <= 0)) {
        errs.push({ param: 'mutation_rate', value: params.mutation_rate, min: Number.MIN_VALUE, max: Number.MAX_VALUE, name: 'Mutation rate' });
      }
      if (params.recombination_rate !== undefined && (!Number.isFinite(params.recombination_rate) || params.recombination_rate <= 0)) {
        errs.push({ param: 'recombination_rate', value: params.recombination_rate, min: Number.MIN_VALUE, max: Number.MAX_VALUE, name: 'Recombination rate' });
      }
      return errs;
    })() : validateParams(params);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }
    
    // Additional Railway-specific validation (backend also enforces, but catch early)
    if (isRailwayDemo) {
      const railwayErrors: ValidationError[] = [];
      if (params.num_samples > RAILWAY_LIMITS.MAX_SAMPLES) {
        railwayErrors.push({
          param: 'num_samples',
          value: params.num_samples,
          min: 1,
          max: RAILWAY_LIMITS.MAX_SAMPLES,
          name: 'Sample individuals'
        });
      }
      if (params.sequence_length > RAILWAY_LIMITS.MAX_SEQUENCE_LENGTH) {
        railwayErrors.push({
          param: 'sequence_length',
          value: params.sequence_length,
          min: 1,
          max: RAILWAY_LIMITS.MAX_SEQUENCE_LENGTH,
          name: 'Sequence length'
        });
      }
      if (params.max_time > RAILWAY_LIMITS.MAX_TIME) {
        railwayErrors.push({
          param: 'max_time',
          value: params.max_time,
          min: 1,
          max: RAILWAY_LIMITS.MAX_TIME,
          name: 'Max generations'
        });
      }
      const calculatedPopSize = params.num_samples * (params.ploidy ?? 2);
      if (calculatedPopSize > RAILWAY_LIMITS.MAX_POPULATION_SIZE) {
        railwayErrors.push({
          param: 'population_size',
          value: calculatedPopSize,
          min: 1,
          max: RAILWAY_LIMITS.MAX_POPULATION_SIZE,
          name: 'Effective population size'
        });
      }
      
      if (railwayErrors.length > 0) {
        setValidationErrors(railwayErrors);
        setShowValidationModal(true);
        return;
      }
    }
    
    setIsSimulating(true);
    setLoading(true);
    setShowTimeoutModal(false);
    setShowSizeLimitModal(false);
    setShowParameterLimitModal(false);
    setShowNodeLimitModal(false);
    setShowErrorModal(false);
    
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
      const result = await api.simulateTreeSequence(simulationParams) as any;
      
      // Check for timeout error (504 status or timeout in message)
      if (result.status === 504 || (result.data as any)?.detail?.includes('timed out')) {
        setIsSimulating(false);
        setShowTimeoutModal(true);
        // Don't set loading to false - keep component mounted
        return;
      }
      
      // Check file size and node count on Railway
      if (isRailway() && result.data) {
        const fileSizeBytes = (result.data as any).file_size_bytes;
        const numNodes = (result.data as any).num_nodes;
        
        // Check file size first
        if (fileSizeBytes && fileSizeBytes > RAILWAY_MAX_FILE_SIZE_BYTES) {
          // Delete the file immediately
          try {
            await api.deleteTreeSequence(result.data.filename);
            log.info('Deleted oversized simulation file on Railway', {
              component: 'TreeSequenceSimulator',
              data: { filename: result.data.filename, size: fileSizeBytes }
            });
          } catch (deleteErr) {
            log.error('Failed to delete oversized file', {
              component: 'TreeSequenceSimulator',
              error: deleteErr instanceof Error ? deleteErr : new Error(String(deleteErr))
            });
          }
          
          setIsSimulating(false);
          setShowSizeLimitModal(true);
          // Don't set loading to false - keep component mounted
          return;
        }
        
        // Check node count
        if (numNodes && numNodes > RAILWAY_MAX_NODES) {
          // Delete the file immediately
          try {
            await api.deleteTreeSequence(result.data.filename);
            log.info('Deleted tree sequence exceeding node limit on Railway', {
              component: 'TreeSequenceSimulator',
              data: { filename: result.data.filename, numNodes }
            });
          } catch (deleteErr) {
            log.error('Failed to delete file exceeding node limit', {
              component: 'TreeSequenceSimulator',
              error: deleteErr instanceof Error ? deleteErr : new Error(String(deleteErr))
            });
          }
          
          setIsSimulating(false);
          setShowNodeLimitModal(true);
          // Don't set loading to false - keep component mounted
          return;
        }
      }
      
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
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      log.error('Tree sequence simulation failed', {
        component: 'TreeSequenceSimulator',
        error: err instanceof Error ? err : new Error(String(err)),
        data: { params, errorMessage }
      });
      
      // Debug logging for Railway mode
      if (isRailwayDemo) {
        console.log('Railway error detected:', errorMessage);
        console.log('Error message length:', errorMessage.length);
        console.log('Is Railway demo?', isRailwayDemo);
      }
      
      const lowerErrorMessage = errorMessage.toLowerCase();
      console.log('Lowercase error message:', lowerErrorMessage);
      
      // Check if this is a timeout error
      if (lowerErrorMessage.includes('timed out') || lowerErrorMessage.includes('504') || lowerErrorMessage.includes('timeout')) {
        console.log('Detected timeout error');
        setIsSimulating(false);
        setShowTimeoutModal(true);
        // Don't set loading to false - keep component mounted
        return;
      }
      
      // Check if this is a Railway parameter limit error
      // Look for various patterns: "exceeds Railway limit", "exceed Railway limits", "Railway limit"
      const hasRailwayLimit = lowerErrorMessage.includes('railway limit');
      const hasExceedsRailway = lowerErrorMessage.includes('exceeds railway');
      const hasExceedRailwayLimits = lowerErrorMessage.includes('exceed railway limits');
      const hasSimulationParametersExceed = lowerErrorMessage.includes('simulation parameters exceed');
      
      console.log('Railway limit check:', {
        isRailwayDemo,
        hasRailwayLimit,
        hasExceedsRailway,
        hasExceedRailwayLimits,
        hasSimulationParametersExceed
      });
      
      // Show modal if error message contains Railway limit indicators
      // Check error message content (backend might be in Railway mode even if frontend flag isn't set)
      if (hasRailwayLimit || hasExceedsRailway || hasExceedRailwayLimits || hasSimulationParametersExceed) {
        // Check if it's a node limit error specifically
        if (lowerErrorMessage.includes('nodes') && lowerErrorMessage.includes('railway limit')) {
          setIsSimulating(false);
          setShowNodeLimitModal(true);
          // Don't set loading to false - keep component mounted
          return;
        }
        
        // Otherwise it's a parameter limit error
        console.log('Setting parameter limit modal to show');
        console.log('Current showParameterLimitModal state:', showParameterLimitModal);
        
        // IMPORTANT: Don't set loading to false yet - this would cause parent to unmount this component
        // Keep loading true so parent doesn't remount us and lose modal state
        setParameterLimitMessage(errorMessage);
        setShowParameterLimitModal(true);
        setIsSimulating(false);
        // Keep setLoading(false) in finally block - but we'll handle it differently
        
        console.log('Modal state set - keeping loading true to prevent unmount');
        return;
      }
      
      // Show error message to user with styled modal
      setIsSimulating(false);
      setErrorMessage(errorMessage);
      setShowErrorModal(true);
      // Don't set loading to false for error modals - keep component mounted
    } finally {
      // Only set loading to false if we're not showing any modal
      // This prevents the parent from unmounting us while modals are showing
      if (!showTimeoutModal && !showSizeLimitModal && !showParameterLimitModal && 
          !showNodeLimitModal && !showErrorModal) {
        setLoading(false);
      }
      setIsSimulating(false);
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
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-sp-white">Simulation Parameters</h3>
            <div className="relative group">
              <div className="w-5 h-5 bg-sp-pale-green/20 rounded-full flex items-center justify-center cursor-help">
                <svg className="w-3 h-3 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="hidden group-hover:block absolute left-0 top-full mt-2 w-80 p-3 bg-sp-very-dark-blue border border-sp-pale-green/30 rounded-lg shadow-xl z-50 text-xs text-sp-white/90">
                <div className="font-semibold text-sp-pale-green mb-2">Valid Parameter Ranges:</div>
                <div className="space-y-1">
                  <div><span className="text-sp-white/70">Sample individuals:</span> <span className="font-mono text-sp-pale-green">1-500</span></div>
                  <div><span className="text-sp-white/70">Ploidy:</span> <span className="font-mono text-sp-pale-green">1-10</span></div>
                  <div><span className="text-sp-white/70">Max generations:</span> <span className="font-mono text-sp-pale-green">1-1000</span></div>
                  <div><span className="text-sp-white/70">Sequence length:</span> <span className="font-mono text-sp-pale-green">1bp-1Gb</span></div>
                  <div><span className="text-sp-white/70">Effective pop. size:</span> <span className="font-mono text-sp-pale-green">1-1,000,000</span></div>
                  <div><span className="text-sp-white/70">Mutation rate:</span> <span className="font-mono text-sp-pale-green">0-1</span></div>
                  <div><span className="text-sp-white/70">Recombination rate:</span> <span className="font-mono text-sp-pale-green">0-1</span></div>
                </div>
              </div>
            </div>
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
              min="1"
              max="500"
              value={inputValues.num_samples}
              onChange={(e) => handleNumberInput('num_samples', e.target.value, 1, 500, 1)}
              onBlur={(e) => handleNumberBlur('num_samples', e.target.value, 1, 500, 1)}
              onKeyDown={handleKeyDown}
              className="px-3 py-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green focus:border-transparent transition-all duration-200 text-sm"
            />
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
          </div>

          {/* Sequence Length */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-sp-white mb-1">
              Sequence Length (e.g. 1bp, 1kb, 1Mb)
            </label>
            <input
              type="text"
              value={inputValues.sequence_length}
              onChange={(e) => handleSequenceLengthInput(e.target.value)}
              onBlur={(e) => handleSequenceLengthBlur(e.target.value)}
              className="px-3 py-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green focus:border-transparent transition-all duration-200 text-sm"
            />
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
            {/* Unsafe range toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label htmlFor="unsafe-range-toggle" className="text-sm font-medium text-sp-white">
                    Disable safe parameter ranges
                  </label>
                  {isRailwayDemo && (
                    <Tooltip
                      content={
                        'To run larger simulations, download and run ARGscape locally (Python package) or use the development setup. This feature is disabled on the hosted demo.'
                      }
                    />
                  )}
                </div>
                <input
                  id="unsafe-range-toggle"
                  type="checkbox"
                  checked={unsafeRangesEnabled && isUnsafeToggleAllowed}
                  onChange={(e) => {
                    if (!isUnsafeToggleAllowed) return;
                    setUnsafeRangesEnabled(e.target.checked);
                  }}
                  disabled={!isUnsafeToggleAllowed}
                  className="w-4 h-4 text-sp-pale-green bg-sp-very-dark-blue border-sp-pale-green/30 rounded focus:ring-sp-pale-green focus:ring-2 disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-sp-white/60">
                When enabled, numeric parameters accept any positive value; use with caution.
              </p>
            </div>
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
                Effective Population Size (Nₑ)
              </label>
              <input
                type="number"
                id="population-size"
                min="1"
                max="1000000"
                value={inputValues.population_size}
                onChange={(e) => handleNumberInput('population_size', e.target.value, 1, 1000000, 1000)}
                onBlur={(e) => handleNumberBlur('population_size', e.target.value, 1, 1000000, 1000)}
                onKeyDown={handleKeyDown}
                className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green"
                placeholder="1000"
              />
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
                  if (!isNaN(rate) && rate >= 0 && rate <= 1) {
                    setParams(prev => ({ ...prev, mutation_rate: rate }));
                  }
                }}
                onBlur={(e) => {
                  const rate = parseFloat(e.target.value);
                  if (isNaN(rate) || rate < 0 || rate > 1) {
                    setInputValues(prev => ({ ...prev, mutation_rate: formatScientificNotation(DEFAULT_PARAMS.mutation_rate!) }));
                    setParams(prev => ({ ...prev, mutation_rate: DEFAULT_PARAMS.mutation_rate }));
                  } else {
                    setInputValues(prev => ({ ...prev, mutation_rate: formatScientificNotation(rate) }));
                    setParams(prev => ({ ...prev, mutation_rate: rate }));
                  }
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green font-mono"
                placeholder="1e-8"
              />
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
                  if (!isNaN(rate) && rate >= 0 && rate <= 1) {
                    setParams(prev => ({ ...prev, recombination_rate: rate }));
                  }
                }}
                onBlur={(e) => {
                  const rate = parseFloat(e.target.value);
                  if (isNaN(rate) || rate < 0 || rate > 1) {
                    setInputValues(prev => ({ ...prev, recombination_rate: formatScientificNotation(DEFAULT_PARAMS.recombination_rate!) }));
                    setParams(prev => ({ ...prev, recombination_rate: DEFAULT_PARAMS.recombination_rate }));
                  } else {
                    setInputValues(prev => ({ ...prev, recombination_rate: formatScientificNotation(rate) }));
                    setParams(prev => ({ ...prev, recombination_rate: rate }));
                  }
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green font-mono"
                placeholder="1e-8"
              />
            </div>
          </div>
        </details>
      </div>

      {/* Simulate Button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={handleSimulate}
          disabled={isSimulating}
          className={`font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 ${
            isSimulating
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue transform hover:scale-105 hover:shadow-lg'
          }`}
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

      {/* Validation Error Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-sp-very-dark-blue border border-red-500/50 rounded-xl p-5 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-sp-white">Invalid Parameters</h3>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-sp-white/60 hover:text-sp-white transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-sp-white">
              <p className="text-sp-white/80 mb-3">
                The following parameters are outside their valid ranges:
              </p>
              
              <div className="space-y-2">
                {validationErrors.map((error, index) => (
                  <div key={index} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="font-semibold text-red-400 mb-1">{error.name}</div>
                    <div className="text-sp-white/80 text-xs">
                      Current value: <span className="font-mono font-bold text-red-300">{error.value}</span>
                    </div>
                    <div className="text-sp-white/80 text-xs">
                      Supported range: <span className="font-mono text-sp-pale-green">{error.min}</span> to <span className="font-mono text-sp-pale-green">{error.max}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-sp-white/60 text-xs mt-3">
                Please adjust the parameters to be within the supported ranges and try again.
              </p>
            </div>
            
            <button
              onClick={() => setShowValidationModal(false)}
              className="w-full mt-4 bg-red-500/20 hover:bg-red-500 hover:text-white text-red-400 font-medium py-2.5 rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Timeout Modal */}
      <AlertModal
        isOpen={showTimeoutModal}
        title="Simulation Timeout"
        message="This simulation took longer than 60 seconds and was cancelled. For larger simulations, please install ARGscape locally via Python."
        buttonText="Install Locally"
        type="error"
        onClose={() => {
          setShowTimeoutModal(false);
          setLoading(false); // Now safe to set loading to false
          navigate('/install');
        }}
      />

      {/* Size Limit Modal */}
      <AlertModal
        isOpen={showSizeLimitModal}
        title="File Size Limit Exceeded"
        message="The simulated ARG exceeds 50MB and has been deleted. For larger simulations, please install ARGscape locally via Python."
        buttonText="Install Locally"
        type="error"
        onClose={() => {
          setShowSizeLimitModal(false);
          setLoading(false); // Now safe to set loading to false
          navigate('/install');
        }}
      />

      {/* Parameter Limit Modal */}
      <AlertModal
        isOpen={showParameterLimitModal}
        title="Parameter Limit Exceeded"
        message={parameterLimitMessage ? (parameterLimitMessage + '\n\nFor larger simulations, please install ARGscape locally via Python.') : 'For larger simulations, please install ARGscape locally via Python.'}
        buttonText="Install Locally"
        type="error"
        onClose={() => {
          setShowParameterLimitModal(false);
          setLoading(false); // Now safe to set loading to false
          navigate('/install');
        }}
      />

      {/* Node Limit Modal */}
      <AlertModal
        isOpen={showNodeLimitModal}
        title="Node Limit Exceeded"
        message={`The tree sequence has more than ${RAILWAY_MAX_NODES} nodes and has been deleted. For larger ARGs, please install ARGscape locally via Python.`}
        buttonText="Install Locally"
        type="error"
        onClose={() => {
          setShowNodeLimitModal(false);
          setLoading(false); // Now safe to set loading to false
          navigate('/install');
        }}
      />

      {/* General Error Modal */}
      <AlertModal
        isOpen={showErrorModal}
        title="Simulation Failed"
        message={errorMessage}
        buttonText="OK"
        type="error"
        onClose={() => {
          setShowErrorModal(false);
          setLoading(false); // Now safe to set loading to false
        }}
      />
    </div>
  );
} 