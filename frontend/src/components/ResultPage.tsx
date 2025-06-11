import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTreeSequence } from '../context/TreeSequenceContext';
import TreeSequenceSelector from './TreeSequenceSelector';
import { api } from '../lib/api';
import { log } from '../lib/logger';
import { SAMPLE_LIMITS } from '../config/constants';
import ClickableLogo from './ui/ClickableLogo';
import AlertModal from './ui/AlertModal';

// Add these type definitions at the top of the file
type LocationInferenceMethod = {
  id: string;
  name: string;
  description: string;
  reference: string;
  enabled: boolean;
  isReInference?: boolean;
};

const locationInferenceMethods: LocationInferenceMethod[] = [
  {
    id: 'fastgaia',
    name: 'fastGAIA',
    description: 'Fast spatial inference using a linear-time algorithm. Best for large ARGs.',
    reference: 'https://doi.org/10.1101/2023.10.11.561938',
    enabled: true
  },
  {
    id: 'gaia_quadratic',
    name: 'GAIA quadratic',
    description: 'High-accuracy spatial inference using quadratic parsimony. Best for small to medium ARGs.',
    reference: 'https://doi.org/10.1101/2023.10.11.561938',
    enabled: true
  },
  {
    id: 'gaia_linear',
    name: 'GAIA linear',
    description: 'Linear-time spatial inference using GAIA. Good balance between speed and accuracy.',
    reference: 'https://doi.org/10.1101/2023.10.11.561938',
    enabled: false
  },
  {
    id: 'spacetrees',
    name: 'SpaceTrees',
    description: 'Bayesian spatial inference using MCMC. Best for detailed uncertainty quantification.',
    reference: 'https://doi.org/10.1093/molbev/msac017',
    enabled: false
  },
  {
    id: 'spargviz',
    name: 'SpARGviz',
    description: 'Force-directed layout for ARG visualization. Best for quick visual exploration.',
    reference: 'https://doi.org/10.1093/bioinformatics/btac429',
    enabled: false
  },
  {
    id: 'wohns',
    name: 'Wohns et al.',
    description: 'Geographic location inference using human genetic data. Best for human ancestry studies.',
    reference: 'https://doi.org/10.1126/science.abi8264',
    enabled: false
  }
];

// Add the LocationInferenceDropdown component
function LocationInferenceDropdown({
  selectedMethod,
  onMethodSelect,
  disabled,
  isInferring,
  data
}: {
  selectedMethod: string | null;
  onMethodSelect: (method: LocationInferenceMethod) => void;
  disabled: boolean;
  isInferring: boolean;
  data: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipMethod, setTooltipMethod] = useState<LocationInferenceMethod | null>(null);

  // Filter and sort methods
  const availableMethods = locationInferenceMethods
    .filter(method => method.enabled)
    .map(method => ({
      ...method,
      isReInference: data?.spatial_status === "all"
    }));

  const selectedMethodData = availableMethods.find(m => m.id === selectedMethod) || availableMethods[0];

  return (
    <div className="relative">
      <button
        className={`bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 w-full ${
          disabled && 'opacity-50 cursor-not-allowed hover:transform-none'
        } ${isInferring && 'opacity-75 cursor-not-allowed hover:transform-none'}`}
        onClick={() => !disabled && !isInferring && setIsOpen(!isOpen)}
        disabled={disabled || isInferring}
      >
        {isInferring && (
          <div className="animate-spin rounded-full h-4 w-4 border border-sp-pale-green border-t-transparent"></div>
        )}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>
          {isInferring ? 'Inferring...' : `${selectedMethodData.isReInference ? 'Re-infer' : 'Infer'} locations (${selectedMethodData.name})`}
        </span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-sp-dark-blue border border-sp-pale-green/20 rounded-xl shadow-xl">
          <div className="py-2">
            {availableMethods.map((method) => (
              <div
                key={method.id}
                className="relative group"
                onMouseEnter={() => setTooltipMethod(method)}
                onMouseLeave={(e) => {
                  // Check if we're moving to the tooltip
                  const tooltip = document.querySelector(`[data-tooltip-id="${method.id}"]`);
                  if (tooltip && !tooltip.contains(e.relatedTarget as Node)) {
                    setTooltipMethod(null);
                  }
                }}
              >
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 ${
                    selectedMethod === method.id ? 'bg-sp-pale-green/10' : ''
                  }`}
                  onClick={() => {
                    onMethodSelect(method);
                    setIsOpen(false);
                  }}
                >
                  <div className="font-medium">{method.name}</div>
                </button>
                {/* Tooltip */}
                {tooltipMethod?.id === method.id && (
                  <div 
                    data-tooltip-id={method.id}
                    className="absolute z-50 w-72 p-4 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-xl shadow-xl right-full mr-2 top-0"
                    onMouseEnter={() => setTooltipMethod(method)}
                    onMouseLeave={() => setTooltipMethod(null)}
                  >
                    <h4 className="font-bold text-sp-pale-green mb-2">{tooltipMethod.name}</h4>
                    <p className="text-sm text-sp-white/80 mb-2">{tooltipMethod.description}</p>
                    <a
                      href={tooltipMethod.reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sp-pale-green hover:text-sp-pale-green/80 underline"
                    >
                      View reference
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Icon with General Tooltip */}
      <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 group">
        <div className="p-1 cursor-help">
          <svg className="w-4 h-4 text-sp-pale-green/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="hidden group-hover:block absolute right-full mr-2 w-64 p-3 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl">
          <p className="text-xs text-sp-white/80">
            Choose from different methods to infer ancestral locations in your ARG. Each method has its own strengths and is optimized for different scenarios.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { treeSequence: data, maxSamples, setMaxSamples, setTreeSequence } = useTreeSequence();
  const [totalSamples, setTotalSamples] = useState<number | null>(null);
  const [isInferringLocationsFast, setIsInferringLocationsFast] = useState(false);
  const [isInferringLocationsGaiaQuadratic, setIsInferringLocationsGaiaQuadratic] = useState(false);
  const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);
  const [inputValue, setInputValue] = useState(maxSamples.toString());
  const [selectedInferenceMethod, setSelectedInferenceMethod] = useState<string>('fastgaia');

  // Modal states
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Set total samples from the uploaded data
  useEffect(() => {
    if (data?.num_samples) {
      setTotalSamples(data.num_samples);
    }
  }, [data]);

  // Sync input value with maxSamples changes
  useEffect(() => {
    setInputValue(maxSamples.toString());
  }, [maxSamples]);

  // Determine button states based on backend data
  const inferTimesEnabled = !data?.has_temporal;
  
  // Fast location inference is available for:
  // 1. ARGs with spatial info for samples but not all nodes (sample_only)
  // 2. ARGs with spatial info for all nodes (all) - for re-inference
  const fastLocationInferenceEnabled = data?.spatial_status === "sample_only" || data?.spatial_status === "all";

  const visualizeArgEnabled = true; // Always available if data loaded
  const visualizeSpatialArgEnabled = !!(data?.has_temporal && data?.has_all_spatial);  // Require temporal and all spatial

  // Determine button text for fast inference based on spatial status
  const getFastInferenceButtonText = () => {
    if (data?.spatial_status === "all") {
      return "Re-infer locations (fastGAIA)";
    } else {
      return "Infer locations (fastGAIA)";
    }
  };

  // Determine button text for GAIA quadratic inference based on spatial status
  const getGaiaQuadraticInferenceButtonText = () => {
    if (data?.spatial_status === "all") {
      return "Re-infer locations (GAIA quadratic)";
    } else {
      return "Infer locations (GAIA quadratic)";
    }
  };

  const handleFastLocationInference = async () => {
    if (!data?.filename || isInferringLocationsFast) return;

    setIsInferringLocationsFast(true);

    try {
      log.user.action('fast-location-inference-start', { filename: data.filename }, 'ResultPage');

      const result = await api.inferLocationsFast({
        filename: data.filename,
        weight_span: true,
        weight_branch_length: true,
      });

      log.info('Fast location inference completed successfully', {
        component: 'ResultPage',
        data: { filename: data.filename, result: result.data }
      });

      // Update the tree sequence context with the new filename and spatial info
      const resultData = result.data as any;
      const updatedData = {
        ...data,
        filename: resultData.new_filename,
        has_sample_spatial: resultData.has_sample_spatial,
        has_all_spatial: resultData.has_all_spatial,
        spatial_status: resultData.spatial_status,
      };

      setTreeSequence(updatedData);

      setAlertModal({
        isOpen: true,
        title: 'Success!',
        message: `Fast location inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.\nNew file: ${resultData.new_filename}`,
        type: 'success'
      });

    } catch (error) {
      log.error('Fast location inference failed', {
        component: 'ResultPage',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename: data.filename }
      });
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: `Fast location inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsInferringLocationsFast(false);
    }
  };

  const handleGaiaQuadraticInference = async () => {
    if (!data?.filename || isInferringLocationsGaiaQuadratic) return;

    setIsInferringLocationsGaiaQuadratic(true);

    try {
      log.user.action('gaia-quadratic-inference-start', { filename: data.filename }, 'ResultPage');

      const result = await api.inferLocationsGaiaQuadratic({
        filename: data.filename,
      });

      log.info('GAIA quadratic inference completed successfully', {
        component: 'ResultPage',
        data: { filename: data.filename, result: result.data }
      });

      // Update the tree sequence context with the new filename and spatial info
      const resultData = result.data as any;
      const updatedData = {
        ...data,
        filename: resultData.new_filename,
        has_sample_spatial: resultData.has_sample_spatial,
        has_all_spatial: resultData.has_all_spatial,
        spatial_status: resultData.spatial_status,
      };

      setTreeSequence(updatedData);

      setAlertModal({
        isOpen: true,
        title: 'Success!',
        message: `GAIA quadratic inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.\nNew file: ${resultData.new_filename}`,
        type: 'success'
      });

    } catch (error) {
      log.error('GAIA quadratic inference failed', {
        component: 'ResultPage',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename: data.filename }
      });
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: `GAIA quadratic inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsInferringLocationsGaiaQuadratic(false);
    }
  };

  const handleTreeSequenceSelect = (treeSequence: any) => {
    log.user.action('switch-tree-sequence', { treeSequence }, 'ResultPage');
    setTreeSequence(treeSequence);
    setShowTreeSequenceSelector(false);
  };

  const handleBackNavigation = () => {
    const fromIntermediate = location.state?.fromIntermediate;
    if (fromIntermediate) {
      if (fromIntermediate === 'load') {
        // For load, go back to landing page instead of intermediate
        log.nav('result', 'landing');
        navigate('/', { state: { fromInternal: true } });
      } else {
        // Navigate back to the specific intermediate page for upload/simulate
        log.nav('result', 'intermediate');
        navigate('/', { state: { fromResult: true, selectedOption: fromIntermediate } });
      }
    } else {
      // Default to home landing page
      log.nav('result', 'landing');
      navigate('/', { state: { fromInternal: true } });
    }
  };

  const getBackButtonText = () => {
    const fromIntermediate = location.state?.fromIntermediate;
    if (fromIntermediate) {
      switch (fromIntermediate) {
        case 'upload':
          return 'Back to Upload';
        case 'simulate':
          return 'Back to Simulate';
        case 'load':
          return 'Back to options';
        default:
          return 'Back';
      }
    }
    return 'Back';
  };

  // Modify the Analysis Tools section to use the new dropdown
  const handleLocationInference = async (method: LocationInferenceMethod) => {
    if (!data?.filename) return;

    switch (method.id) {
      case 'fastgaia':
        await handleFastLocationInference();
        break;
      case 'gaia_quadratic':
        await handleGaiaQuadraticInference();
        break;
      // Add other methods as they become available
      default:
        setAlertModal({
          isOpen: true,
          title: 'Not Implemented',
          message: `The ${method.name} inference method is not yet implemented.`,
          type: 'info'
        });
    }
  };

  if (!data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-sp-very-dark-blue text-sp-white">
        <h1 className="text-3xl font-bold mb-4">No data loaded</h1>
        <button className="bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-bold py-2 px-6 rounded-lg mt-4" onClick={handleBackNavigation}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="bg-sp-very-dark-blue text-sp-white min-h-screen px-4 pt-8 pb-20 font-sans">
      {/* Header with logo and back button */}
      <div className="max-w-7xl mx-auto mb-8">
        {/* Logo and Back Button Row */}
        <div className="relative flex items-center justify-center mb-6">
          <button 
            className="absolute left-0 inline-flex items-center gap-2 text-sp-pale-green hover:text-sp-pale-green/80 transition-colors duration-200"
            onClick={handleBackNavigation}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {getBackButtonText()}
          </button>
          
          <ClickableLogo size="medium" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Tree Sequence Analysis</h1>
          <p className="text-sp-white/70 text-lg font-mono break-all">{data.filename}</p>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-sp-very-dark-blue rounded-2xl shadow-xl border border-sp-dark-blue overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Header Section - Data Attributes and Buttons */}
            <div className="flex justify-between items-center">
              {/* Data Attributes - Left Side */}
              <div className="flex flex-wrap gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  data.has_temporal ? 'bg-sp-dark-blue text-sp-white border border-sp-pale-green/20' : 'bg-transparent text-sp-white/70'
                }`}>
                  <span className={`inline-block ${data.has_temporal ? 'text-sp-white' : 'text-red-400'}`}>
                    {data.has_temporal ? '✔️' : '✖️'}
                  </span>
                  Temporal
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  data.has_sample_spatial ? 'bg-sp-dark-blue text-sp-white border border-sp-pale-green/20' : 'bg-transparent text-sp-white/70'
                }`}>
                  <span className={`inline-block ${data.has_sample_spatial ? 'text-sp-white' : 'text-red-400'}`}>
                    {data.has_sample_spatial ? '✔️' : '✖️'}
                  </span>
                  Sample Coords
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  data.has_all_spatial ? 'bg-sp-dark-blue text-sp-white border border-sp-pale-green/20' : 'bg-transparent text-sp-white/70'
                }`}>
                  <span className={`inline-block ${data.has_all_spatial ? 'text-sp-white' : 'text-red-400'}`}>
                    {data.has_all_spatial ? '✔️' : '✖️'}
                  </span>
                  All Coords
                </div>
              </div>
              
              {/* Action Buttons - Right Side */}
              <div className="flex gap-2">
                <button 
                  className="bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
                  onClick={() => setShowTreeSequenceSelector(!showTreeSequenceSelector)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  {showTreeSequenceSelector ? 'Cancel' : 'Switch Tree Sequence'}
                </button>
                <button 
                  className="bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-2" 
                  onClick={async () => {
                    try {
                      const blob = await api.downloadTreeSequence(data.filename);
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      const downloadFilename = data.filename.toLowerCase().endsWith('.trees') ? `${data.filename}.tsz` : data.filename;
                      link.setAttribute('download', downloadFilename);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      log.user.action('download-tree-sequence', { filename: data.filename }, 'ResultPage');
                    } catch (error) {
                      log.error('Download failed', {
                        component: 'ResultPage',
                        error: error instanceof Error ? error : new Error(String(error)),
                        data: { filename: data.filename }
                      });
                      setAlertModal({
                        isOpen: true,
                        title: 'Download Failed',
                        message: `Failed to download tree sequence: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        type: 'error'
                      });
                    }
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download .tsz
                </button>
              </div>
            </div>
            
            {/* Tree Sequence Selector */}
            {showTreeSequenceSelector && (
              <div className="p-4 bg-sp-dark-blue rounded-lg border border-sp-pale-green/20">
                <TreeSequenceSelector onSelect={handleTreeSequenceSelect} />
              </div>
            )}
            {/* Data Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-sp-pale-green">{data.num_samples}</div>
                <div className="text-xs text-sp-white/70">Samples</div>
              </div>
              <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-sp-pale-green">{data.num_nodes}</div>
                <div className="text-xs text-sp-white/70">Nodes</div>
              </div>
              <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-sp-pale-green">{data.num_edges}</div>
                <div className="text-xs text-sp-white/70">Edges</div>
              </div>
              <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-sp-pale-green">{data.num_trees}</div>
                <div className="text-xs text-sp-white/70">Local Trees</div>
              </div>
            </div>
            
            {/* Additional Stats */}
            {(data.num_mutations !== undefined || data.num_sites !== undefined || data.num_recombination_nodes !== undefined) && (
              <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg p-3">
                <h4 className="text-sm font-medium text-sp-white mb-2">Additional Statistics</h4>
                <div className="flex flex-wrap gap-2">
                  {data.num_mutations !== undefined && (
                    <span className="bg-sp-dark-blue text-sp-white px-2 py-1 rounded text-xs">
                      {data.num_mutations} mutations
                    </span>
                  )}
                  {data.num_sites !== undefined && data.num_sites > 0 && (
                    <span className="bg-sp-dark-blue text-sp-white px-2 py-1 rounded text-xs">
                      {data.num_sites} sites
                    </span>
                  )}
                  {data.num_recombination_nodes !== undefined && data.num_recombination_nodes > 0 && (
                    <span className="bg-sp-dark-blue text-sp-white px-2 py-1 rounded text-xs">
                      {data.num_recombination_nodes} recombination nodes
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Analysis Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                className={`bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 ${!inferTimesEnabled && 'opacity-50 cursor-not-allowed hover:transform-none'}`}
                disabled={!inferTimesEnabled}
                onClick={() => log.user.action('infer-times-clicked', { filename: data.filename }, 'ResultPage')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Infer times (tsdate)
              </button>
              <LocationInferenceDropdown
                selectedMethod={selectedInferenceMethod}
                onMethodSelect={(method) => {
                  setSelectedInferenceMethod(method.id);
                  handleLocationInference(method);
                }}
                disabled={!fastLocationInferenceEnabled}
                isInferring={isInferringLocationsFast || isInferringLocationsGaiaQuadratic}
                data={data}
              />
            </div>

            {/* Sample count slider */}
            <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-sp-pale-green/10 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h4 className="font-medium text-sp-white text-sm">Visualization Sample Count</h4>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="sample-slider"
                  min="2"
                  max={totalSamples || SAMPLE_LIMITS.DEFAULT_MAX_SAMPLES}
                  value={Math.max(maxSamples, 2)}
                  onChange={(e) => setMaxSamples(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-sp-dark-blue rounded-lg appearance-none cursor-pointer accent-sp-pale-green"
                />
                <div className="flex items-center gap-2 min-w-[8rem]">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInputValue(value);
                      if (value !== '') {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue)) {
                          setMaxSamples(numValue);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value);
                      let finalValue = 2; // default minimum
                      if (!isNaN(value)) {
                        finalValue = Math.max(2, Math.min(value, totalSamples || SAMPLE_LIMITS.DEFAULT_MAX_SAMPLES));
                      }
                      setMaxSamples(finalValue);
                      setInputValue(finalValue.toString());
                    }}
                    min="2"
                    max={totalSamples || SAMPLE_LIMITS.DEFAULT_MAX_SAMPLES}
                    className="w-20 bg-sp-dark-blue border border-sp-pale-green/20 rounded px-2 py-1 text-sm text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green"
                  />
                  <span className="text-sm font-mono text-sp-white/70">
                    / {totalSamples || '?'}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-sp-white/60">
                  Adjust before visualizing to control the number of samples shown (minimum: 2)
                </p>
                {totalSamples && totalSamples > SAMPLE_LIMITS.WARNING_THRESHOLD && (
                  <p className="text-xs text-sp-white/60 mt-1">
                    Note: Large sample numbers may affect visualization performance
                  </p>
                )}
              </div>
            </div>

            {/* Visualization Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                className={`bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue font-bold py-5 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex flex-col items-center gap-2 ${!visualizeArgEnabled && 'opacity-50 cursor-not-allowed hover:transform-none'}`}
                disabled={!visualizeArgEnabled}
                onClick={() => navigate(`/visualize/${encodeURIComponent(data.filename)}`)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="text-center">
                  <span className="text-base font-bold">Visualize ARG</span>
                  <span className="text-sm opacity-80 block">Interactive D3</span>
                </div>
              </button>
              <button
                className={`bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue font-bold py-5 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex flex-col items-center gap-2 ${!visualizeSpatialArgEnabled && 'opacity-50 cursor-not-allowed hover:transform-none'}`}
                disabled={!visualizeSpatialArgEnabled}
                onClick={() => navigate(`/visualize-spatial/${encodeURIComponent(data.filename)}`)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-center">
                  <span className="text-base font-bold">Spatial ARG</span>
                  <span className="text-sm opacity-80 block">3D coordinates</span>
                </div>
              </button>
              <button
                className="bg-sp-dark-blue text-sp-white/50 font-bold py-5 px-6 rounded-xl flex flex-col items-center gap-2 opacity-40 cursor-not-allowed"
                disabled={true}
                title="Pretty ARG visualization coming soon"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                <div className="text-center">
                  <span className="text-base font-bold">Pretty ARG</span>
                  <span className="text-sm opacity-60 block">Coming soon</span>
                </div>
              </button>
              <button
                className="bg-sp-dark-blue text-sp-white/50 font-bold py-5 px-6 rounded-xl flex flex-col items-center gap-2 opacity-40 cursor-not-allowed"
                disabled={true}
                title="Huge ARG visualization coming soon"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <div className="text-center">
                  <span className="text-base font-bold">Huge ARG</span>
                  <span className="text-sm opacity-60 block">Coming soon</span>
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />
    </div>
  );
} 