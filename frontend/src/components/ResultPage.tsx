import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTreeSequence } from '../context/TreeSequenceContext';
import TreeSequenceSelector from './TreeSequenceSelector';
import { api } from '../lib/api';
import { log } from '../lib/logger';
import { SAMPLE_LIMITS } from '../config/constants';
import ClickableLogo from './ui/ClickableLogo';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { treeSequence: data, maxSamples, setMaxSamples, setTreeSequence } = useTreeSequence();
  const [totalSamples, setTotalSamples] = useState<number | null>(null);
  const [isInferringLocationsFast, setIsInferringLocationsFast] = useState(false);
  const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);
  const [inputValue, setInputValue] = useState(maxSamples.toString());

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

      alert(`Fast location inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.\nNew file: ${resultData.new_filename}`);

    } catch (error) {
      log.error('Fast location inference failed', {
        component: 'ResultPage',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename: data.filename }
      });
      alert(`Fast location inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInferringLocationsFast(false);
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
          return '< Back to Upload';
        case 'simulate':
          return '< Back to Simulate';
        case 'load':
          return '< Back to options';
        default:
          return '< Back';
      }
    }
    return '< Back';
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
    <div className="min-h-screen flex flex-col items-center bg-sp-very-dark-blue text-sp-white px-4 pt-12 pb-24">
      {/* Title - consistent with homepage */}
      <div className="mb-8 text-center">
        <ClickableLogo size="large" />
      </div>
      
      <div className="w-full max-w-2xl bg-sp-very-dark-blue rounded-2xl shadow-xl border border-sp-dark-blue p-8 flex flex-col items-center my-auto">
        <div className="w-full flex justify-between items-center mb-4">
          <button className="text-sp-pale-green hover:text-sp-white text-lg font-medium px-2 py-1 rounded transition-colors" onClick={handleBackNavigation}>{getBackButtonText()}</button>
          <div className="flex gap-2">
            <button 
              className="bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-medium px-4 py-2 rounded-lg text-base transition-colors"
              onClick={() => setShowTreeSequenceSelector(!showTreeSequenceSelector)}
            >
              {showTreeSequenceSelector ? 'Cancel' : 'Switch Tree Sequence'}
            </button>
            <button className="bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-medium px-4 py-2 rounded-lg text-base" onClick={async () => {
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
              }
            }}>Download .tsz</button>
          </div>
        </div>
        
        {/* Tree Sequence Selector */}
        {showTreeSequenceSelector && (
          <div className="w-full mb-6 p-4 bg-sp-dark-blue rounded-lg border border-sp-pale-green">
            <TreeSequenceSelector onSelect={handleTreeSequenceSelect} />
          </div>
        )}
        
        {/* File Info - Compact Header */}
        <div className="w-full mb-6">
          <div className="text-xl font-semibold text-center mb-4">
            <span className="font-mono text-sp-pale-green break-all">{data.filename}</span>
          </div>
          
          {/* Data Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-sp-dark-blue rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-sp-pale-green">{data.num_samples}</div>
              <div className="text-xs text-sp-white">Samples</div>
            </div>
            <div className="bg-sp-dark-blue rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-sp-pale-green">{data.num_nodes}</div>
              <div className="text-xs text-sp-white">Nodes</div>
            </div>
            <div className="bg-sp-dark-blue rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-sp-pale-green">{data.num_edges}</div>
              <div className="text-xs text-sp-white">Edges</div>
            </div>
            <div className="bg-sp-dark-blue rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-sp-pale-green">{data.num_trees}</div>
              <div className="text-xs text-sp-white">Local Trees</div>
            </div>
          </div>
          
          {/* Additional Stats - Compact Row */}
          <div className="flex flex-wrap gap-2 justify-center">
            {data.num_mutations !== undefined && (
              <span className="bg-sp-dark-blue text-sp-white px-3 py-1 rounded-full text-sm">
                {data.num_mutations} mutations
              </span>
            )}
            {data.num_sites !== undefined && data.num_sites > 0 && (
              <span className="bg-sp-dark-blue text-sp-white px-3 py-1 rounded-full text-sm">
                {data.num_sites} sites
              </span>
            )}
            {data.num_recombination_nodes !== undefined && data.num_recombination_nodes > 0 && (
              <span className="bg-sp-dark-blue text-sp-white px-3 py-1 rounded-full text-sm">
                {data.num_recombination_nodes} recombination nodes
              </span>
            )}
          </div>
          
          {/* Status Badges - Compact Row */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              data.has_temporal ? 'bg-sp-pale-green text-sp-very-dark-blue' : 'bg-sp-dark-blue text-sp-white'
            }`}>
              <span className={`inline-block ${data.has_temporal ? 'text-sp-very-dark-blue' : 'text-green-400'}`}>
                {data.has_temporal ? '✔️' : '✖️'}
              </span>
              Temporal
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              data.has_sample_spatial ? 'bg-sp-pale-green text-sp-very-dark-blue' : 'bg-sp-dark-blue text-sp-white'
            }`}>
              <span className={`inline-block ${data.has_sample_spatial ? 'text-sp-very-dark-blue' : 'text-green-400'}`}>
                {data.has_sample_spatial ? '✔️' : '✖️'}
              </span>
              Sample Coords
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              data.has_all_spatial ? 'bg-sp-pale-green text-sp-very-dark-blue' : 'bg-sp-dark-blue text-sp-white'
            }`}>
              <span className={`inline-block ${data.has_all_spatial ? 'text-sp-very-dark-blue' : 'text-green-400'}`}>
                {data.has_all_spatial ? '✔️' : '✖️'}
              </span>
              All Coords
            </div>
          </div>
        </div>
        
        <div className="w-full flex flex-col gap-4 mb-6">
          <button
            className={`bg-sp-dark-blue text-sp-white font-medium px-4 py-2 rounded-lg text-base ${!inferTimesEnabled && 'opacity-50 cursor-not-allowed'}`}
            disabled={!inferTimesEnabled}
            onClick={() => log.user.action('infer-times-clicked', { filename: data.filename }, 'ResultPage')}
          >
            Infer times (tsdate)
          </button>
          <button
            className={`bg-sp-dark-blue text-sp-white font-medium px-4 py-2 rounded-lg text-base ${!fastLocationInferenceEnabled && 'opacity-50 cursor-not-allowed'} ${isInferringLocationsFast && 'opacity-75 cursor-not-allowed'}`}
            disabled={!fastLocationInferenceEnabled || isInferringLocationsFast}
            onClick={handleFastLocationInference}
          >
            <div className="flex items-center justify-center gap-2">
              {isInferringLocationsFast && (
                <div className="animate-spin rounded-full h-4 w-4 border border-sp-pale-green border-t-transparent"></div>
              )}
              <span>
                {isInferringLocationsFast ? 'Inferring...' : getFastInferenceButtonText()}
              </span>
            </div>
          </button>
        </div>

        <div className="w-full flex flex-col gap-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              className={`flex-1 min-w-[200px] bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-bold py-4 rounded-lg text-lg transition-colors shadow-md ${!visualizeArgEnabled && 'opacity-50 cursor-not-allowed'}`}
              disabled={!visualizeArgEnabled}
              onClick={() => navigate(`/visualize/${encodeURIComponent(data.filename)}`)}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">Visualize ARG</span>
                <span className="text-xs mt-1 opacity-80">Interactive D3-based visualization</span>
              </div>
            </button>
            <button
              className={`flex-1 min-w-[200px] bg-sp-dark-blue text-sp-white font-bold py-4 rounded-lg text-lg transition-colors shadow-md opacity-50 cursor-not-allowed`}
              disabled={true}
              title="Large ARG visualization temporarily disabled"
            >
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">Large ARG</span>
                <span className="text-xs mt-1 opacity-80">Coming soon</span>
              </div>
            </button>
            <button
              className={`flex-1 min-w-[200px] bg-sp-dark-blue text-sp-white font-bold py-4 rounded-lg text-lg transition-colors shadow-md opacity-50 cursor-not-allowed`}
              disabled={true}
              title="Pretty ARG visualization temporarily disabled"
            >
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">Pretty ARG</span>
                <span className="text-xs mt-1 opacity-80">Coming soon</span>
              </div>
            </button>
            <button
              className={`flex-1 min-w-[200px] bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-bold py-4 rounded-lg text-lg transition-colors shadow-md ${!visualizeSpatialArgEnabled && 'opacity-50 cursor-not-allowed'}`}
              disabled={!visualizeSpatialArgEnabled}
              onClick={() => navigate(`/visualize-spatial/${encodeURIComponent(data.filename)}`)}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">Spatial ARG</span>
                <span className="text-xs mt-1 opacity-80">3D visualization with coordinates</span>
              </div>
            </button>
          </div>
        </div>

        {/* Sample count slider */}
        <div className="w-full p-4 bg-sp-dark-blue rounded-lg mb-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="sample-slider" className="text-sm font-medium">
              Number of samples to display in visualization:
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                id="sample-slider"
                min="2"
                max={totalSamples || SAMPLE_LIMITS.DEFAULT_MAX_SAMPLES}
                value={Math.max(maxSamples, 2)}
                onChange={(e) => setMaxSamples(parseInt(e.target.value))}
                className="flex-1 h-2 bg-sp-very-dark-blue rounded-lg appearance-none cursor-pointer accent-sp-pale-green"
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
                  className="w-20 bg-sp-very-dark-blue border border-sp-dark-blue rounded px-2 py-1 text-sm text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green"
                />
                <span className="text-sm font-mono text-right">
                  / {totalSamples || '?'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-sp-white">
                Adjust this before visualizing to control the number of samples shown in the ARG (minimum: 2)
              </p>
              {totalSamples && totalSamples > SAMPLE_LIMITS.WARNING_THRESHOLD && (
                <p className="text-xs text-sp-white">
                  Note: Large sample numbers may affect visualization performance
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 