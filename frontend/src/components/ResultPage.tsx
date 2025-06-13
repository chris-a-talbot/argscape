import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTreeSequence } from '../context/TreeSequenceContext';
import { api } from '../lib/api';
import { log } from '../lib/logger';
import { SAMPLE_LIMITS } from '../config/constants';
import ClickableLogo from './ui/ClickableLogo';
import AlertModal from './ui/AlertModal';
import { DownloadDropdown } from './ui/DownloadDropdown';
import { TreeSequenceSelectorModal } from './ui/TreeSequenceSelectorModal';

// Use the TreeSequenceData type from the context
type TreeSequence = NonNullable<ReturnType<typeof useTreeSequence>['treeSequence']>;

// Add these type definitions at the top of the file
type LocationInferenceMethod = {
  id: string;
  name: string;
  description: string;
  reference: string;
  github: string;
  github2: string;
  speed: number;
  enabled: boolean;
  isReInference?: boolean;
};

const locationInferenceMethods: LocationInferenceMethod[] = [
  {
    id: 'sparg',
    name: 'sparg',
    description: 'Spatial inference using Brownian motion on the full ancestral recombination graph. Modified to include node ID tracking. Best for small ARGs.',
    reference: 'https://www.biorxiv.org/content/10.1101/2024.04.10.588900v2',
    github: 'https://github.com/osmond-lab/sparg',
    github2: '',
    speed: 1,
    enabled: true
  },
  {
    id: 'spacetrees',
    name: 'spacetrees',
    description: 'Spatial inference using genome-wide genealogies. Coming Soon!',
    reference: 'https://elifesciences.org/articles/72177',
    github: 'https://github.com/osmond-lab/spacetrees',
    github2: '',
    speed: 2,
    enabled: false
  },
  {
    id: 'gaia_quadratic',
    name: 'gaia quadratic',
    description: 'High-accuracy spatial inference using quadratic parsimony. Best for small to medium ARGs.',
    reference: 'https://www.science.org/doi/10.1126/science.adp4642',
    github: 'https://github.com/chris-a-talbot/fastgaia',
    github2: 'https://github.com/chris-a-talbot/gaiapy',
    speed: 3,
    enabled: true
  },
  {
    id: 'gaia_linear',
    name: 'gaia linear',
    description: 'High-accuracy spatial inference using linear parsimony. Best for small to medium ARGs.',
    reference: 'https://www.science.org/doi/10.1126/science.adp4642',
    github: 'https://github.com/chris-a-talbot/fastgaia',
    github2: 'https://github.com/chris-a-talbot/gaiapy',
    speed: 3,
    enabled: true
  },
  {
    id: 'fastgaia',
    name: 'fastgaia',
    description: 'Fast spatial inference using a greedy algorithm. Best for large ARGs where GAIA is too slow.',
    reference: '',
    github: 'https://github.com/chris-a-talbot/fastgaia',
    github2: 'https://github.com/blueraleigh/gaia',
    speed: 4,
    enabled: true
  },
  {
    id: 'midpoint',
    name: 'Wohns midpoint',
    description: 'Weighted midpoint-based spatial inference. Simple and fast for ARGs of all sizes.',
    reference: 'https://doi.org/10.1126/science.abi8264',
    github: 'https://github.com/awohns/unified_genealogy_paper/',
    github2: '',
    speed: 5,
    enabled: true
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
    .map(method => ({
      ...method,
      isReInference: data?.spatial_status === "all"
    }));

  // Find the first enabled method as default
  const defaultMethod = availableMethods.find(m => m.enabled);
  const selectedMethodData = availableMethods.find(m => m.id === selectedMethod) || defaultMethod || availableMethods[0];

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
                  className={`w-full px-4 py-2 text-left transition-colors duration-200 ${
                    !method.enabled ? 'text-sp-white/50 cursor-not-allowed' :
                    selectedMethod === method.id ? 'bg-sp-pale-green/10 hover:bg-sp-pale-green hover:text-sp-very-dark-blue' :
                    'hover:bg-sp-pale-green hover:text-sp-very-dark-blue'
                  }`}
                  onClick={() => {
                    if (method.enabled) {
                      onMethodSelect(method);
                      setIsOpen(false);
                    }
                  }}
                  disabled={isInferring || !method.enabled}
                >
                  <div className="font-medium flex items-center justify-between">
                    <span>{method.name}</span>
                    {!method.enabled && <span className="text-xs text-sp-pale-green/50">Coming Soon</span>}
                  </div>
                </button>
                {/* Tooltip */}
                {tooltipMethod?.id === method.id && (
                  <div 
                    data-tooltip-id={method.id}
                    className="fixed z-50 w-72 p-4 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-xl shadow-xl"
                    style={{
                      left: 'var(--tooltip-x, 0)',
                      top: 'var(--tooltip-y, 0)'
                    }}
                    ref={(el) => {
                      if (el) {
                        const rect = el.parentElement?.getBoundingClientRect();
                        if (rect) {
                          const spaceBelow = window.innerHeight - rect.bottom;
                          const spaceAbove = rect.top;
                          const tooltipHeight = el.offsetHeight;
                          
                          // Position horizontally to the left of the menu
                          const left = rect.left - el.offsetWidth - 8;
                          
                          // Determine vertical position
                          let top;
                          if (spaceBelow >= tooltipHeight) {
                            // Enough space below - align with top of menu item
                            top = rect.top;
                          } else if (spaceAbove >= tooltipHeight) {
                            // Not enough space below, but enough above - align with bottom of menu item
                            top = rect.bottom - tooltipHeight;
                          } else {
                            // Not enough space either way - center in available space
                            top = Math.max(8, Math.min(
                              window.innerHeight - tooltipHeight - 8,
                              rect.top - (tooltipHeight - rect.height) / 2
                            ));
                          }
                          
                          el.style.setProperty('--tooltip-x', `${left}px`);
                          el.style.setProperty('--tooltip-y', `${top}px`);
                        }
                      }
                    }}
                    onMouseEnter={() => setTooltipMethod(method)}
                    onMouseLeave={() => setTooltipMethod(null)}
                  >
                    <h4 className="font-bold text-sp-pale-green mb-2">{tooltipMethod.name}</h4>
                    <p className="text-sm text-sp-white/80 mb-2">{tooltipMethod.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-sp-white/80">Speed:</span>
                      <div className="flex items-center gap-[2px]">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-5 rounded-sm transition-all ${
                              i < tooltipMethod.speed
                                ? i === 0
                                  ? 'bg-yellow-400'
                                  : i === 1
                                  ? 'bg-yellow-500'
                                  : i === 2
                                  ? 'bg-lime-500'
                                  : i === 3
                                  ? 'bg-green-400'
                                  : 'bg-green-500'
                                : 'bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {tooltipMethod.reference && (
                        <a
                          href={tooltipMethod.reference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sp-pale-green hover:text-sp-pale-green/80 underline"
                        >
                          View reference
                        </a>
                      )}
                      {tooltipMethod.id === 'gaia_quadratic' || tooltipMethod.id === 'gaia_linear' ? (
                        <>
                          <a
                            href={tooltipMethod.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sp-pale-green hover:text-sp-pale-green/80 underline"
                          >
                            View gaia on GitHub
                          </a>
                          <a
                            href={tooltipMethod.github2}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sp-pale-green hover:text-sp-pale-green/80 underline"
                          >
                            View gaiapy on GitHub
                          </a>
                        </>
                      ) : tooltipMethod.id === 'fastgaia' ? (
                        <>
                          <a
                            href={tooltipMethod.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sp-pale-green hover:text-sp-pale-green/80 underline"
                          >
                            View fastgaia on GitHub
                          </a>
                          <a
                            href={tooltipMethod.github2}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sp-pale-green hover:text-sp-pale-green/80 underline"
                          >
                            View gaia on GitHub
                          </a>
                        </>
                      ) : tooltipMethod.github && (
                        <a
                          href={tooltipMethod.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sp-pale-green hover:text-sp-pale-green/80 underline"
                        >
                          View on GitHub
                        </a>
                      )}
                    </div>
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

// Add this helper function near the top of the file
const formatScientificNotation = (value: number): string => {
  return value.toExponential(8);  // Format with 8 decimal places
};

// Add mutation rate modal component
function MutationRateModal({
  isOpen,
  onClose,
  onConfirm,
  defaultRate = 1e-8
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    rate: number,
    preprocess: boolean,
    removeTelomeres: boolean,
    minimumGap: number | undefined,
    splitDisjoint: boolean,
    filterPopulations: boolean,
    filterIndividuals: boolean,
    filterSites: boolean
  ) => void;
  defaultRate?: number;
}) {
  const [mutationRate, setMutationRate] = useState(formatScientificNotation(defaultRate));
  const [preprocess, setPreprocess] = useState(true);
  const [removeTelomeres, setRemoveTelomeres] = useState(false);
  const [minimumGap, setMinimumGap] = useState<string>("1000000");  // Default from tsdate docs
  const [splitDisjoint, setSplitDisjoint] = useState(true);
  const [filterPopulations, setFilterPopulations] = useState(false);
  const [filterIndividuals, setFilterIndividuals] = useState(false);
  const [filterSites, setFilterSites] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(mutationRate);
    const minGap = minimumGap ? parseFloat(minimumGap) : undefined;
    if (!isNaN(rate) && rate > 0) {
      onConfirm(
        rate,
        preprocess,
        removeTelomeres,
        minGap,
        splitDisjoint,
        filterPopulations,
        filterIndividuals,
        filterSites
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-sp-white mb-4">Set Mutation Rate</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="mutation-rate" className="block text-sm font-medium text-sp-white/80 mb-2">
              Mutation Rate (per base pair per generation)
            </label>
            <input
              type="text"
              id="mutation-rate"
              value={mutationRate}
              onChange={(e) => {
                const value = e.target.value;
                setMutationRate(value);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                const parsed = parseFloat(value);
                if (isNaN(parsed) || parsed <= 0) {
                  // Reset to default if invalid
                  setMutationRate(formatScientificNotation(defaultRate));
                } else {
                  // Format the value nicely
                  setMutationRate(formatScientificNotation(parsed));
                }
              }}
              className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green font-mono"
              placeholder="1e-8"
            />
            <p className="mt-1 text-xs text-sp-white/60">
              Default: 1e-8 (0.00000001)
            </p>
          </div>

          {/* Preprocessing Options */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="preprocess"
                checked={preprocess}
                onChange={(e) => setPreprocess(e.target.checked)}
                className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
              />
              <label htmlFor="preprocess" className="ml-2 block text-sm text-sp-white/80">
                Preprocess tree sequence
              </label>
            </div>

            {/* Advanced preprocessing options - only shown if preprocess is enabled */}
            {preprocess && (
              <div className="ml-6 space-y-3 border-l-2 border-sp-pale-green/20 pl-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remove-telomeres"
                    checked={removeTelomeres}
                    onChange={(e) => setRemoveTelomeres(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="remove-telomeres" className="ml-2 block text-sm text-sp-white/80">
                    Remove telomeres (flanking regions)
                  </label>
                </div>

                <div>
                  <label htmlFor="minimum-gap" className="block text-sm text-sp-white/80 mb-1">
                    Minimum gap between sites (bp)
                  </label>
                  <input
                    type="text"
                    id="minimum-gap"
                    value={minimumGap}
                    onChange={(e) => setMinimumGap(e.target.value)}
                    onBlur={(e) => {
                      const value = e.target.value;
                      const parsed = parseFloat(value);
                      if (isNaN(parsed) || parsed < 0) {
                        setMinimumGap("1000000");  // Reset to default
                      }
                    }}
                    className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green font-mono"
                    placeholder="1000000"
                  />
                  <p className="mt-1 text-xs text-sp-white/60">
                    Default: 1,000,000 bp
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="split-disjoint"
                    checked={splitDisjoint}
                    onChange={(e) => setSplitDisjoint(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="split-disjoint" className="ml-2 block text-sm text-sp-white/80">
                    Split disjoint nodes
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-populations"
                    checked={filterPopulations}
                    onChange={(e) => setFilterPopulations(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="filter-populations" className="ml-2 block text-sm text-sp-white/80">
                    Filter populations
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-individuals"
                    checked={filterIndividuals}
                    onChange={(e) => setFilterIndividuals(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="filter-individuals" className="ml-2 block text-sm text-sp-white/80">
                    Filter individuals
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-sites"
                    checked={filterSites}
                    onChange={(e) => setFilterSites(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="filter-sites" className="ml-2 block text-sm text-sp-white/80">
                    Filter sites
                  </label>
                </div>

                <p className="text-xs text-sp-white/60">
                  Preprocessing simplifies the tree sequence by removing unary nodes and splitting disjoint nodes.
                  Telomeres are flanking regions that may contain missing data.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sp-white/80 hover:text-sp-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Run tsdate
            </button>
          </div>
        </form>
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
  const [isInferringLocationsGaiaLinear, setIsInferringLocationsGaiaLinear] = useState(false);
  const [isInferringLocationsMidpoint, setIsInferringLocationsMidpoint] = useState(false);
  const [isInferringLocationsSparg, setIsInferringLocationsSparg] = useState(false);
  const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);
  const [inputValue, setInputValue] = useState(maxSamples.toString());
  const [selectedInferenceMethod, setSelectedInferenceMethod] = useState<string>('gaia_quadratic');
  const [showMutationRateModal, setShowMutationRateModal] = useState(false);
  const [isInferringTimes, setIsInferringTimes] = useState(false);
  const [showSecondTreeSequenceSelector, setShowSecondTreeSequenceSelector] = useState(false);
  const [selectedSecondTreeSequence, setSelectedSecondTreeSequence] = useState<TreeSequence | null>(null);

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
  const visualizeSpatialDiffEnabled = visualizeSpatialArgEnabled; // Same requirements as spatial ARG

  // Add mutation data status check
  const hasMutations = data?.num_mutations !== undefined && data.num_mutations > 0;

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
      case 'gaia_linear':
        if (isInferringLocationsGaiaLinear) return;
        setIsInferringLocationsGaiaLinear(true);
        try {
          log.user.action('gaia-linear-inference-start', { filename: data.filename }, 'ResultPage');

          const result = await api.inferLocationsGaiaLinear({
            filename: data.filename,
          });

          log.info('GAIA linear inference completed successfully', {
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
            message: `GAIA linear inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.\nNew file: ${resultData.new_filename}`,
            type: 'success'
          });
        } catch (error) {
          log.error('GAIA linear inference failed', {
            component: 'ResultPage',
            error: error instanceof Error ? error : new Error(String(error)),
            data: { filename: data.filename }
          });
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: `GAIA linear inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
        } finally {
          setIsInferringLocationsGaiaLinear(false);
        }
        break;
      case 'sparg':
        if (isInferringLocationsSparg) return;
        setIsInferringLocationsSparg(true);
        try {
          log.user.action('sparg-inference-start', { filename: data.filename }, 'ResultPage');

          const result = await api.inferLocationsSparg({
            filename: data.filename,
          });

          log.info('sparg inference completed successfully', {
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
            message: `sparg inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.\nNew file: ${resultData.new_filename}`,
            type: 'success'
          });
        } catch (error) {
          log.error('sparg inference failed', {
            component: 'ResultPage',
            error: error instanceof Error ? error : new Error(String(error)),
            data: { filename: data.filename }
          });
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: `sparg inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
        } finally {
          setIsInferringLocationsSparg(false);
        }
        break;
      case 'midpoint':
        if (isInferringLocationsMidpoint) return;
        setIsInferringLocationsMidpoint(true);
        try {
          log.user.action('midpoint-inference-start', { filename: data.filename }, 'ResultPage');

          const result = await api.inferLocationsMidpoint({
            filename: data.filename,
          });

          log.info('Midpoint inference completed successfully', {
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
            message: `Midpoint inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.\nNew file: ${resultData.new_filename}`,
            type: 'success'
          });
        } catch (error) {
          log.error('Midpoint inference failed', {
            component: 'ResultPage',
            error: error instanceof Error ? error : new Error(String(error)),
            data: { filename: data.filename }
          });
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: `Midpoint inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
        } finally {
          setIsInferringLocationsMidpoint(false);
        }
        break;
      default:
        setAlertModal({
          isOpen: true,
          title: 'Not Implemented',
          message: `The ${method.name} inference method is not yet implemented.`,
          type: 'info'
        });
    }
  };

  // Update isInferring check in LocationInferenceDropdown
  const isInferring = isInferringLocationsFast || 
                     isInferringLocationsGaiaQuadratic || 
                     isInferringLocationsGaiaLinear ||
                     isInferringLocationsMidpoint || 
                     isInferringLocationsSparg;

  // Add tsdate inference handler
  const handleTsdateInference = async (
    mutationRate: number,
    preprocess: boolean,
    removeTelomeres: boolean,
    minimumGap: number | undefined,
    splitDisjoint: boolean,
    filterPopulations: boolean,
    filterIndividuals: boolean,
    filterSites: boolean
  ) => {
    if (!data?.filename || isInferringTimes) return;

    setIsInferringTimes(true);
    setShowMutationRateModal(false);

    try {
      log.user.action('tsdate-inference-start', { 
        filename: data.filename, 
        mutationRate,
        preprocess,
        removeTelomeres,
        minimumGap,
        splitDisjoint,
        filterPopulations,
        filterIndividuals,
        filterSites
      }, 'ResultPage');

      const result = await api.inferTimesTsdate({
        filename: data.filename,
        mutation_rate: mutationRate,
        preprocess,
        remove_telomeres: removeTelomeres,
        minimum_gap: minimumGap,
        split_disjoint: splitDisjoint,
        filter_populations: filterPopulations,
        filter_individuals: filterIndividuals,
        filter_sites: filterSites
      });

      log.info('tsdate inference completed successfully', {
        component: 'ResultPage',
        data: { filename: data.filename, result: result.data }
      });

      // Update the tree sequence context with the new filename and temporal info
      const resultData = result.data as any;
      const updatedData = {
        ...data,
        filename: resultData.new_filename,
        has_temporal: resultData.has_temporal,
      };

      setTreeSequence(updatedData);

      // Include preprocessing info in success message
      const preprocessingInfo = resultData.preprocessing.preprocessed 
        ? `\nPreprocessing: ${[
            resultData.preprocessing.remove_telomeres ? 'with telomere removal' : 'without telomere removal',
            resultData.preprocessing.minimum_gap ? `minimum gap ${resultData.preprocessing.minimum_gap}bp` : null,
            resultData.preprocessing.split_disjoint ? 'split disjoint nodes' : null,
            resultData.preprocessing.filter_populations ? 'filtered populations' : null,
            resultData.preprocessing.filter_individuals ? 'filtered individuals' : null,
            resultData.preprocessing.filter_sites ? 'filtered sites' : null
          ].filter(Boolean).join(', ')}`
        : '\nNo preprocessing applied';

      setAlertModal({
        isOpen: true,
        title: 'Success!',
        message: `tsdate inference completed successfully!${preprocessingInfo}\nInferred times for ${resultData.num_inferred_times} nodes.\nNew file: ${resultData.new_filename}`,
        type: 'success'
      });

    } catch (error) {
      log.error('tsdate inference failed', {
        component: 'ResultPage',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename: data.filename }
      });
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: `tsdate inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsInferringTimes(false);
    }
  };

  const handleSpatialDiffClick = () => {
    if (!visualizeSpatialDiffEnabled) return;
    setShowSecondTreeSequenceSelector(true);
  };

  const handleSecondTreeSequenceSelect = (treeSequence: TreeSequence) => {
    if (!data) return;
    if (!treeSequence.has_temporal || !treeSequence.has_all_spatial || treeSequence.filename === data.filename) {
      setAlertModal({
        isOpen: true,
        title: 'Invalid Selection',
        message: 'The selected tree sequence must have temporal and spatial data, and must be different from the current tree sequence.',
        type: 'error'
      });
      return;
    }
    setSelectedSecondTreeSequence(treeSequence);
    setShowSecondTreeSequenceSelector(false);
    navigate(`/visualize-spatial-diff/${encodeURIComponent(data.filename)}?second=${encodeURIComponent(treeSequence.filename)}`);
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
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  hasMutations ? 'bg-sp-dark-blue text-sp-white border border-sp-pale-green/20' : 'bg-transparent text-sp-white/70'
                }`}>
                  <span className={`inline-block ${hasMutations ? 'text-sp-white' : 'text-red-400'}`}>
                    {hasMutations ? '✔️' : '✖️'}
                  </span>
                  Mutations
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
                <DownloadDropdown 
                  filename={data.filename}
                  onError={(error) => {
                    setAlertModal({
                      isOpen: true,
                      title: 'Download Failed',
                      message: `Failed to download tree sequence: ${error.message}`,
                      type: 'error'
                    });
                  }}
                />
              </div>
            </div>
            
            {/* Tree Sequence Selector Modal */}
            <TreeSequenceSelectorModal
              isOpen={showTreeSequenceSelector}
              onClose={() => setShowTreeSequenceSelector(false)}
              onSelect={handleTreeSequenceSelect}
            />

            {/* Data Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-sp-pale-green">{data.num_mutations ?? 0}</div>
                <div className="text-xs text-sp-white/70">Mutations</div>
              </div>
            </div>
            
            {/* Analysis Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                className={`bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 ${!hasMutations && 'opacity-50 cursor-not-allowed hover:transform-none'}`}
                disabled={!hasMutations || isInferringTimes}
                onClick={() => setShowMutationRateModal(true)}
              >
                {isInferringTimes && (
                  <div className="animate-spin rounded-full h-4 w-4 border border-sp-pale-green border-t-transparent"></div>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {isInferringTimes ? 'Inferring...' : 'Infer ages (tsdate)'}
                </span>
              </button>
              <LocationInferenceDropdown
                selectedMethod={selectedInferenceMethod}
                onMethodSelect={(method) => {
                  setSelectedInferenceMethod(method.id);
                  handleLocationInference(method);
                }}
                disabled={!fastLocationInferenceEnabled}
                isInferring={isInferring}
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
                className={`bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue font-bold py-5 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex flex-col items-center gap-2 ${!visualizeSpatialDiffEnabled && 'opacity-50 cursor-not-allowed hover:transform-none'}`}
                disabled={!visualizeSpatialDiffEnabled}
                onClick={handleSpatialDiffClick}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <div className="text-center">
                  <span className="text-base font-bold">Spatial Diff</span>
                  <span className="text-sm opacity-80 block">Compare locations</span>
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
            </div>

          </div>
        </div>
      </div>

      {/* Mutation Rate Modal */}
      <MutationRateModal
        isOpen={showMutationRateModal}
        onClose={() => setShowMutationRateModal(false)}
        onConfirm={handleTsdateInference}
      />

      {/* Tree Sequence Selector Modal for Diff */}
      {showSecondTreeSequenceSelector && data && (
        <TreeSequenceSelectorModal
          isOpen={showSecondTreeSequenceSelector}
          onClose={() => setShowSecondTreeSequenceSelector(false)}
          onSelect={handleSecondTreeSequenceSelect}
        />
      )}

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