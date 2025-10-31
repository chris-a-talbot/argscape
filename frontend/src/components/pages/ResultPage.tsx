import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';
import { SAMPLE_LIMITS } from '../../config/constants';
import AlertModal from '../ui/AlertModal';
import { DownloadDropdown } from '../ui/DownloadDropdown';
import { TreeSequenceSelectorModal } from '../ui/TreeSequenceSelectorModal';
import Navbar from '../layout/Navbar';
import ParticleBackground from '../ui/ParticleBackground';
import Footer from '../layout/Footer';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { RangeSlider } from '../ui/range-slider';
import { Tooltip } from '../ui/tooltip';

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
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Filter and sort methods
  const availableMethods = locationInferenceMethods
    .map(method => ({
      ...method,
      isReInference: data?.spatial_status === "all"
    }));

  // Find the first enabled method as default
  const defaultMethod = availableMethods.find(m => m.enabled);
  const selectedMethodData = availableMethods.find(m => m.id === selectedMethod) || defaultMethod || availableMethods[0];

  // Check if there's enough space below
  const handleToggle = () => {
    if (!disabled && !isInferring) {
      const newIsOpen = !isOpen;
      if (newIsOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const menuHeight = 400; // Approximate height of dropdown menu
        setOpenUpward(spaceBelow < menuHeight);
      }
      setIsOpen(newIsOpen);
    }
  };

  return (
    <div className="relative group">
      <button
        ref={buttonRef}
        className={`bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 w-full ${
          disabled && 'opacity-50 cursor-not-allowed hover:transform-none'
        } ${isInferring && 'opacity-75 cursor-not-allowed hover:transform-none'}`}
        onClick={handleToggle}
        disabled={disabled || isInferring}
        title={disabled ? "Requires sample spatial data" : ""}
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

      {/* Hover Tooltip */}
      {!isOpen && (
        <div className="hidden group-hover:block absolute z-[300] left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl pointer-events-none">
          <p className="text-xs text-sp-white/80">
            Infer ancestral locations for nodes in the ARG using spatial inference methods. Choose from multiple algorithms optimized for different scenarios and ARG sizes.
          </p>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute z-[500] w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded-xl shadow-xl ${
            openUpward ? 'bottom-full mb-2' : 'mt-2'
          }`}
        >
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
                {tooltipMethod?.id === method.id ? (() => {
                  const methodIndex = availableMethods.findIndex(m => m.id === method.id);
                  let positioning = {};
                  
                  if (methodIndex <= 1) {
                    // Top 2 methods: align tooltip top with entry top
                    positioning = { top: '0' };
                  } else if (methodIndex <= 3) {
                    // Middle 2 methods: center tooltip with entry
                    positioning = { top: '50%', transform: 'translateY(-50%)' };
                  } else {
                    // Bottom 2 methods: align tooltip bottom with entry bottom
                    positioning = { bottom: '0' };
                  }
                  
                  return (
                    <div 
                      className="absolute z-[600] w-72 p-4 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-xl shadow-xl"
                      style={{
                        right: '100%',
                        marginRight: '8px',
                        ...positioning
                      }}
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
                  );
                })() : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add this helper function near the top of the file
const formatScientificNotation = (value: number): string => {
  return value.toExponential(8);  // Format with 8 decimal places
};

// Add advanced subsetting modal component
function AdvancedSubsettingModal({
  isOpen,
  onClose,
  onConfirm,
  totalSamples
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: {
    filename: string;
    samples?: number[];
    map_nodes?: boolean;
    reduce_to_site_topology?: boolean;
    filter_populations?: boolean;
    filter_individuals?: boolean;
    filter_sites?: boolean;
    filter_nodes?: boolean;
    update_sample_flags?: boolean;
    keep_unary?: boolean;
    keep_unary_in_individuals?: boolean;
    keep_input_roots?: boolean;
    record_provenance?: boolean;
  }) => void;
  totalSamples: number;
}) {
  const [sampleInput, setSampleInput] = useState('');
  const [sampleInputType, setSampleInputType] = useState<'comma' | 'range' | 'file'>('comma');
  const [rangeStart, setRangeStart] = useState('0');
  const [rangeEnd, setRangeEnd] = useState(totalSamples.toString());
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mapNodes, setMapNodes] = useState(false);
  const [reduceToSiteTopology, setReduceToSiteTopology] = useState(false);
  const [filterPopulations, setFilterPopulations] = useState(false);
  const [filterIndividuals, setFilterIndividuals] = useState(false);
  const [filterSites, setFilterSites] = useState(false);
  const [filterNodes, setFilterNodes] = useState(false);
  const [updateSampleFlags, setUpdateSampleFlags] = useState(false);
  const [keepUnary, setKeepUnary] = useState(false);
  const [keepUnaryInIndividuals, setKeepUnaryInIndividuals] = useState(false);
  const [keepInputRoots, setKeepInputRoots] = useState(false);
  const [recordProvenance, setRecordProvenance] = useState(true);
  const [samplePreviews, setSamplePreviews] = useState<number[]>([]);

  const parseSamples = async (): Promise<number[]> => {
    switch (sampleInputType) {
      case 'comma':
        if (!sampleInput.trim()) return [];
        return sampleInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      
      case 'range':
        const start = parseInt(rangeStart);
        const end = parseInt(rangeEnd);
        if (isNaN(start) || isNaN(end) || start > end) return [];
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      
      case 'file':
        if (!uploadedFile) return [];
        const text = await uploadedFile.text();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const samples = [];
        for (const line of lines) {
          // Try comma-separated values first
          const values = line.split(',').map(v => v.trim());
          for (const value of values) {
            const num = parseInt(value);
            if (!isNaN(num)) samples.push(num);
          }
        }
        return samples;
      
      default:
        return [];
    }
  };

  const updatePreview = async () => {
    try {
      const samples = await parseSamples();
      setSamplePreviews(samples.slice(0, 10)); // Preview first 10 samples
    } catch (error) {
      setSamplePreviews([]);
    }
  };

  useEffect(() => {
    updatePreview();
  }, [sampleInput, sampleInputType, rangeStart, rangeEnd, uploadedFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const samples = await parseSamples();
      onConfirm({
        filename: '', // Will be set by the calling component
        samples: samples.length > 0 ? samples : undefined,
        map_nodes: mapNodes,
        reduce_to_site_topology: reduceToSiteTopology,
        filter_populations: filterPopulations || undefined,
        filter_individuals: filterIndividuals || undefined,
        filter_sites: filterSites || undefined,
        filter_nodes: filterNodes || undefined,
        update_sample_flags: updateSampleFlags || undefined,
        keep_unary: keepUnary,
        keep_unary_in_individuals: keepUnaryInIndividuals || undefined,
        keep_input_roots: keepInputRoots,
        record_provenance: recordProvenance
      });
    } catch (error) {
      console.error('Error parsing samples:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-sp-white mb-4">Advanced Subsetting</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Sample Selection */}
          <div>
            <label className="block text-sm font-medium text-sp-white/80 mb-2">
              Sample Selection Method
            </label>
            <select
              value={sampleInputType}
              onChange={(e) => setSampleInputType(e.target.value as 'comma' | 'range' | 'file')}
              className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green"
            >
              <option value="comma">Comma-separated list</option>
              <option value="range">Range</option>
              <option value="file">Upload file</option>
            </select>
          </div>

          {/* Sample Input Based on Type */}
          {sampleInputType === 'comma' && (
            <div>
              <label className="block text-sm font-medium text-sp-white/80 mb-2">
                Sample IDs (comma-separated)
              </label>
              <textarea
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                placeholder="0, 1, 2, 5, 10, 15"
                className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green font-mono"
                rows={3}
              />
            </div>
          )}

          {sampleInputType === 'range' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sp-white/80 mb-2">
                  Start Sample ID
                </label>
                <input
                  type="number"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  min="0"
                  max={totalSamples - 1}
                  className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sp-white/80 mb-2">
                  End Sample ID
                </label>
                <input
                  type="number"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  min="0"
                  max={totalSamples - 1}
                  className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green font-mono"
                />
              </div>
            </div>
          )}

          {sampleInputType === 'file' && (
            <div>
              <label className="block text-sm font-medium text-sp-white/80 mb-2">
                Upload CSV/TSV File
              </label>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="w-full bg-sp-dark-blue border border-sp-pale-green/20 rounded px-3 py-2 text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green"
              />
              <p className="text-xs text-sp-white/60 mt-1">
                Upload a CSV or TSV file with sample IDs in a single column or row
              </p>
            </div>
          )}

          {/* Sample Preview */}
          {samplePreviews.length > 0 && (
            <div className="bg-sp-dark-blue/50 border border-sp-pale-green/20 rounded p-3">
              <p className="text-sm text-sp-white/80 mb-2">
                Sample Preview ({samplePreviews.length} samples{samplePreviews.length === 10 ? '+' : ''}):
              </p>
              <p className="text-xs text-sp-white/60 font-mono">
                {samplePreviews.join(', ')}{samplePreviews.length === 10 ? '...' : ''}
              </p>
            </div>
          )}

          {/* Simplify Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-sp-white/80">Simplification Options</h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="map-nodes"
                    checked={mapNodes}
                    onChange={(e) => setMapNodes(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="map-nodes" className="ml-2 text-sm text-sp-white/80">
                    Map nodes
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Return a mapping array showing how node IDs have changed in the simplified tree sequence.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reduce-to-site-topology"
                    checked={reduceToSiteTopology}
                    onChange={(e) => setReduceToSiteTopology(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="reduce-to-site-topology" className="ml-2 text-sm text-sp-white/80">
                    Reduce to site topology
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Only keep topology necessary to represent trees containing sites. Removes all trees without sites.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-populations"
                    checked={filterPopulations}
                    onChange={(e) => setFilterPopulations(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="filter-populations" className="ml-2 text-sm text-sp-white/80">
                    Filter populations
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Remove populations that are not referenced by any nodes after simplification. Population IDs may change.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-individuals"
                    checked={filterIndividuals}
                    onChange={(e) => setFilterIndividuals(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="filter-individuals" className="ml-2 text-sm text-sp-white/80">
                    Filter individuals
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Remove individuals that are not referenced by any nodes after simplification. Individual IDs may change.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-sites"
                    checked={filterSites}
                    onChange={(e) => setFilterSites(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="filter-sites" className="ml-2 text-sm text-sp-white/80">
                    Filter sites
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Remove sites that are not referenced by any mutations after simplification. Site IDs may change.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-nodes"
                    checked={filterNodes}
                    onChange={(e) => setFilterNodes(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="filter-nodes" className="ml-2 text-sm text-sp-white/80">
                    Filter nodes
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Remove nodes that are not referenced by any edges after simplification. This is the standard behavior.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="update-sample-flags"
                    checked={updateSampleFlags}
                    onChange={(e) => setUpdateSampleFlags(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="update-sample-flags" className="ml-2 text-sm text-sp-white/80">
                    Update sample flags
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Update node flags so that only the specified samples have the IS_SAMPLE flag set.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="keep-unary"
                    checked={keepUnary}
                    onChange={(e) => setKeepUnary(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="keep-unary" className="ml-2 text-sm text-sp-white/80">
                    Keep unary nodes
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Preserve nodes with exactly one child that exist on the path from samples to root.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="keep-unary-in-individuals"
                    checked={keepUnaryInIndividuals}
                    onChange={(e) => setKeepUnaryInIndividuals(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="keep-unary-in-individuals" className="ml-2 text-sm text-sp-white/80">
                    Keep unary in individuals
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Keep unary nodes only if they are associated with an individual in the individuals table.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="keep-input-roots"
                    checked={keepInputRoots}
                    onChange={(e) => setKeepInputRoots(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="keep-input-roots" className="ml-2 text-sm text-sp-white/80">
                    Keep input roots
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Retain history ancestral to the MRCA of the samples. Preserves the original tree roots.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="record-provenance"
                    checked={recordProvenance}
                    onChange={(e) => setRecordProvenance(e.target.checked)}
                    className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                  />
                  <label htmlFor="record-provenance" className="ml-2 text-sm text-sp-white/80">
                    Record provenance
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                    Record details of this simplification operation in the tree sequence's provenance information.
                  </div>
                </div>
              </div>
            </div>
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
              Simplify Tree Sequence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  const { 
    treeSequence: data, 
    maxSamples, 
    setMaxSamples, 
    setTreeSequence,
    temporalRange,
    setTemporalRange,
    genomicRange,
    setGenomicRange,
    genomicMode,
    setGenomicMode
  } = useTreeSequence();
  const [totalSamples, setTotalSamples] = useState<number | null>(null);
  const [isInferringLocationsFast, setIsInferringLocationsFast] = useState(false);
  const [isInferringLocationsGaiaQuadratic, setIsInferringLocationsGaiaQuadratic] = useState(false);
  const [isInferringLocationsGaiaLinear, setIsInferringLocationsGaiaLinear] = useState(false);
  const [isInferringLocationsMidpoint, setIsInferringLocationsMidpoint] = useState(false);
  const [isInferringLocationsSparg, setIsInferringLocationsSparg] = useState(false);
  const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);
  const [, setInputValue] = useState(maxSamples.toString());
  const [selectedInferenceMethod, setSelectedInferenceMethod] = useState<string>('gaia_quadratic');
  const [showMutationRateModal, setShowMutationRateModal] = useState(false);
  const [isInferringTimes, setIsInferringTimes] = useState(false);
  const [showSecondTreeSequenceSelector, setShowSecondTreeSequenceSelector] = useState(false);
  const [, setSelectedSecondTreeSequence] = useState<TreeSequence | null>(null);
  const [showAdvancedSubsettingModal, setShowAdvancedSubsettingModal] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [heatmapOnlyMode, setHeatmapOnlyMode] = useState(false);
  
  // Clustering control for ARG visualization
  const [enableClustering, setEnableClustering] = useState(false);
  
  // Temporal range input states
  const [temporalStartInput, setTemporalStartInput] = useState('');
  const [temporalEndInput, setTemporalEndInput] = useState('');
  
  // Genomic range input states  
  const [genomicStartInput, setGenomicStartInput] = useState('');
  const [genomicEndInput, setGenomicEndInput] = useState('');
  
  const [searchParams] = useSearchParams();

  // Effect to initialize ranges from URL parameters
  useEffect(() => {
    const temporalStart = searchParams.get('temporal_start');
    const temporalEnd = searchParams.get('temporal_end');
    const genomicStart = searchParams.get('genomic_start');
    const genomicEnd = searchParams.get('genomic_end');
    const treeStartIdx = searchParams.get('tree_start_idx');
    const treeEndIdx = searchParams.get('tree_end_idx');

    if (temporalStart && temporalEnd) {
      const start = parseFloat(temporalStart);
      const end = parseFloat(temporalEnd);
      if (!isNaN(start) && !isNaN(end)) {
        setTemporalRange([start, end]);
      }
    }

    if (genomicStart && genomicEnd) {
      const start = parseInt(genomicStart);
      const end = parseInt(genomicEnd);
      if (!isNaN(start) && !isNaN(end)) {
        setGenomicMode('base_pairs');
        setGenomicRange([start, end]);
      }
    } else if (treeStartIdx && treeEndIdx) {
      const start = parseInt(treeStartIdx);
      const end = parseInt(treeEndIdx);
      if (!isNaN(start) && !isNaN(end)) {
        setGenomicMode('tree_indices');
        setGenomicRange([start, end]);
      }
    }
  }, [searchParams, setTemporalRange, setGenomicRange, setGenomicMode]);

  // Effect to update temporal input fields when range changes
  useEffect(() => {
    if (temporalRange) {
      setTemporalStartInput(temporalRange[0].toString());
      setTemporalEndInput(temporalRange[1].toString());
    }
  }, [temporalRange]);

  // Effect to update genomic input fields when range changes
  useEffect(() => {
    if (genomicRange) {
      setGenomicStartInput(genomicRange[0].toString());
      setGenomicEndInput(genomicRange[1].toString());
    }
  }, [genomicRange]);

  // Modal states
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    buttonText?: string;
    onClose?: () => void;
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

  // Calculate actual range values from the tree sequence data
  const getTemporalRange = () => {
    if (data?.temporal_range) {
      return {
        min: data.temporal_range.min_time,
        max: data.temporal_range.max_time
      };
    }
    return { min: 0, max: 100 }; // Default fallback
  };

  const getGenomicRange = () => {
    return {
      min: 0,
      max: data?.sequence_length || 1000000
    };
  };

  const getTreeIndexRange = () => {
    return {
      min: 0,
      max: Math.max(0, (data?.num_trees || 1) - 1)
    };
  };

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const lowerErrorMessage = errorMessage.toLowerCase();
      const isTimeout = lowerErrorMessage.includes('timed out') || lowerErrorMessage.includes('504') || lowerErrorMessage.includes('timeout');
      setAlertModal({
        isOpen: true,
        title: isTimeout ? 'Inference Timeout' : 'Error',
        message: isTimeout 
          ? 'Spatial inference took longer than 90 seconds and was cancelled. For larger ARGs, please install ARGscape locally via Python.'
          : `Fast location inference failed: ${errorMessage}`,
        type: 'error',
        buttonText: isTimeout ? 'Install Locally' : undefined,
        onClose: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
          navigate('/install');
        } : undefined
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const lowerErrorMessage = errorMessage.toLowerCase();
      const isTimeout = lowerErrorMessage.includes('timed out') || lowerErrorMessage.includes('504') || lowerErrorMessage.includes('timeout');
      setAlertModal({
        isOpen: true,
        title: isTimeout ? 'Inference Timeout' : 'Error',
        message: isTimeout 
          ? 'Spatial inference took longer than 90 seconds and was cancelled. For larger ARGs, please install ARGscape locally via Python.'
          : `GAIA quadratic inference failed: ${errorMessage}`,
        type: 'error',
        buttonText: isTimeout ? 'Install Locally' : undefined,
        onClose: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
          navigate('/install');
        } : undefined
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
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isTimeout = errorMessage.includes('timed out') || errorMessage.includes('504');
          setAlertModal({
            isOpen: true,
            title: isTimeout ? 'Inference Timeout' : 'Error',
            message: isTimeout 
              ? 'Spatial inference took longer than 90 seconds and was cancelled. For larger ARGs, please install ARGscape locally via Python.'
              : `GAIA linear inference failed: ${errorMessage}`,
            type: 'error',
            buttonText: isTimeout ? 'Install Locally' : undefined,
            onClose: isTimeout ? () => {
              setAlertModal({ ...alertModal, isOpen: false });
              navigate('/install');
            } : undefined
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
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isTimeout = errorMessage.includes('timed out') || errorMessage.includes('504');
          setAlertModal({
            isOpen: true,
            title: isTimeout ? 'Inference Timeout' : 'Error',
            message: isTimeout 
              ? 'Spatial inference took longer than 90 seconds and was cancelled. For larger ARGs, please install ARGscape locally via Python.'
              : `sparg inference failed: ${errorMessage}`,
            type: 'error',
            buttonText: isTimeout ? 'Install Locally' : undefined,
            onClose: isTimeout ? () => {
              setAlertModal({ ...alertModal, isOpen: false });
              navigate('/install');
            } : undefined
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
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isTimeout = errorMessage.includes('timed out') || errorMessage.includes('504');
          setAlertModal({
            isOpen: true,
            title: isTimeout ? 'Inference Timeout' : 'Error',
            message: isTimeout 
              ? 'Spatial inference took longer than 90 seconds and was cancelled. For larger ARGs, please install ARGscape locally via Python.'
              : `Midpoint inference failed: ${errorMessage}`,
            type: 'error',
            buttonText: isTimeout ? 'Install Locally' : undefined,
            onClose: isTimeout ? () => {
              setAlertModal({ ...alertModal, isOpen: false });
              navigate('/install');
            } : undefined
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
      
      // Extract error message from API error
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract message from error object
        errorMessage = (error as any).message || (error as any).detail || String(error);
      } else {
        errorMessage = String(error);
      }
      
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
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
    const params = new URLSearchParams();
    params.append('second', encodeURIComponent(treeSequence.filename));
    if (heatmapOnlyMode) {
      params.append('heatmap_mode', 'true');
    }
    navigate(`/spatial-diff/${encodeURIComponent(data.filename)}?${params.toString()}`);
  };

  // Add advanced subsetting handler
  const handleAdvancedSubsetting = async (params: Parameters<typeof api.simplifyTreeSequence>[0]) => {
    if (!data?.filename || isSimplifying) return;

    setIsSimplifying(true);
    setShowAdvancedSubsettingModal(false);

    try {
      log.user.action('advanced-subsetting-start', { 
        filename: data.filename,
        numSamples: params.samples?.length || 'all',
        options: params
      }, 'ResultPage');

      const result = await api.simplifyTreeSequence({
        ...params,
        filename: data.filename
      });

      log.info('Advanced subsetting completed successfully', {
        component: 'ResultPage',
        data: { filename: data.filename, result: result.data }
      });

      // Update the tree sequence context with the new simplified tree sequence
      const resultData = result.data as any;
      const updatedData = {
        ...data, // Preserve existing data properties like size, content_type, status
        filename: resultData.new_filename,
        num_samples: resultData.num_samples,
        num_nodes: resultData.num_nodes,
        num_edges: resultData.num_edges,
        num_trees: resultData.num_trees,
        num_mutations: resultData.num_mutations,
        has_temporal: resultData.has_temporal,
        has_sample_spatial: resultData.has_sample_spatial,
        has_all_spatial: resultData.has_all_spatial,
        spatial_status: resultData.spatial_status
      };

      setTreeSequence(updatedData);

      setAlertModal({
        isOpen: true,
        title: 'Success!',
        message: `Tree sequence simplified successfully!\nReduced from ${resultData.original_samples} to ${resultData.samples_simplified} samples.\nNew file: ${resultData.new_filename}`,
        type: 'success'
      });

    } catch (error) {
      log.error('Advanced subsetting failed', {
        component: 'ResultPage',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename: data.filename }
      });
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).message || (error as any).detail || String(error);
      } else {
        errorMessage = String(error);
      }
      
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: `Advanced subsetting failed: ${errorMessage}`,
        type: 'error'
      });
    } finally {
      setIsSimplifying(false);
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
    <div className="min-h-screen bg-sp-very-dark-blue relative">
      <ParticleBackground />
      <div className="bg-sp-very-dark-blue text-sp-white min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow px-4 pt-24 pb-32">
          {/* Header with logo and back button */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Tree Sequence Analysis</h1>
              <p className="text-sp-white/70 text-lg font-mono break-all">{data.filename}</p>
            </div>
          </div>

          {/* Main content area */}
          <div className="max-w-7xl mx-auto">
            <div className="bg-sp-very-dark-blue/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sp-dark-blue overflow-visible">
              <div className="p-8 space-y-6">
                {/* Quick Actions Bar */}
                <div className="flex justify-between items-center gap-3 flex-wrap">
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

                {/* Data Overview - Always Visible, Compact */}
                <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-xl p-4">
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    {/* Statistics - Compact inline */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sp-white/60">Samples:</span>
                        <span className="font-mono font-bold text-sp-pale-green">{data.num_samples.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sp-white/60">Nodes:</span>
                        <span className="font-mono font-bold text-sp-pale-green">{data.num_nodes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sp-white/60">Edges:</span>
                        <span className="font-mono font-bold text-sp-pale-green">{data.num_edges.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sp-white/60">Trees:</span>
                        <span className="font-mono font-bold text-sp-pale-green">{data.num_trees.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sp-white/60">Mutations:</span>
                        <span className="font-mono font-bold text-sp-pale-green">{(data.num_mutations ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Data Attributes - Compact badges */}
                    <div className="flex flex-wrap gap-2">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                        data.has_temporal ? 'bg-sp-pale-green/10 text-sp-pale-green' : 'text-sp-white/30'
                      }`} title={data.has_temporal ? "Node times available" : "No temporal data"}>
                        <span className="text-[10px]">{data.has_temporal ? '✔️' : '✖️'}</span>
                        Temporal
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                        data.has_sample_spatial ? 'bg-sp-pale-green/10 text-sp-pale-green' : 'text-sp-white/30'
                      }`} title={data.has_sample_spatial ? "Sample coordinates available" : "No sample coordinates"}>
                        <span className="text-[10px]">{data.has_sample_spatial ? '✔️' : '✖️'}</span>
                        Samples
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                        data.has_all_spatial ? 'bg-sp-pale-green/10 text-sp-pale-green' : 'text-sp-white/30'
                      }`} title={data.has_all_spatial ? "All node coordinates available" : "Not all nodes have coordinates"}>
                        <span className="text-[10px]">{data.has_all_spatial ? '✔️' : '✖️'}</span>
                        All
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tree Sequence Modification Section */}
                <CollapsibleSection
                  title="Tree Sequence Modification"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  subtitle="Simplify tree sequences or infer spatiotemporal info"
                  defaultOpen={false}
                >
                  <div className="space-y-3">
                    {/* Simplify Button - At Top */}
                    <div className="relative group">
                      <button
                        onClick={() => setShowAdvancedSubsettingModal(true)}
                        disabled={isSimplifying}
                        className={`bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 w-full justify-center ${
                          isSimplifying ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                        }`}
                      >
                        {isSimplifying && (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-sp-pale-green border-t-transparent"></div>
                        )}
                        {isSimplifying ? 'Processing...' : 'Simplify Tree Sequence'}
                      </button>
                      {/* Hover Tooltip */}
                      <div className="hidden group-hover:block absolute z-[300] left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl pointer-events-none">
                        <p className="text-xs text-sp-white/80">
                          Simplify the tree sequence by retaining only specific samples or nodes using tskit simplify.
                        </p>
                      </div>
                    </div>

                    {/* Inference Tools */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative group">
                        <button
                          className={`bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 w-full ${
                            !hasMutations ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                          }`}
                          disabled={!hasMutations || isInferringTimes}
                          onClick={() => setShowMutationRateModal(true)}
                          title={!hasMutations ? "Requires mutations" : ""}
                        >
                          {isInferringTimes && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-sp-pale-green border-t-transparent"></div>
                          )}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {isInferringTimes ? 'Inferring...' : 'Infer Ages (tsdate)'}
                        </button>
                        {/* Hover Tooltip */}
                        <div className="hidden group-hover:block absolute z-[300] left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl pointer-events-none">
                          <p className="text-xs text-sp-white/80">
                            {!hasMutations 
                              ? "Requires mutations in the tree sequence to infer ages." 
                              : "Infer node ages using tsdate, a Bayesian method that estimates times of ancestral nodes based on mutation patterns."}
                          </p>
                        </div>
                      </div>
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
                  </div>
                </CollapsibleSection>

                {/* Visualization Section - Combined Settings and Launch */}
                <CollapsibleSection
                  title="Visualization"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  }
                  subtitle="Configure display settings and launch visualizations"
                  defaultOpen={true}
                >

                  {/* Sample Subsetting */}
                  <div className="mb-6">
                    <h4 className="font-medium text-sp-white text-sm mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      Sample Subsetting
                      <Tooltip content="Cuts the number of samples (and thereby total edges and nodes) displayed in the visualization to improve performance. A similar reduction can be accomplished by limiting the temporal or genomic range instead (or in addition)." />
                      <span className="text-xs text-sp-white/60 font-normal ml-auto">
                        Total: {totalSamples?.toLocaleString() || '?'} samples
                      </span>
                    </h4>
                    <RangeSlider
                      min={2}
                      max={totalSamples || SAMPLE_LIMITS.DEFAULT_MAX_SAMPLES}
                      value={[2, Math.max(maxSamples, 2)]}
                      onChange={([_, max]) => {
                        setMaxSamples(max);
                        setInputValue(max.toString());
                      }}
                      formatValue={(v) => v.toLocaleString()}
                      step={1}
                    />
                  </div>

                  {/* Range Filtering - Combined Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Temporal Range Filtering */}
                    <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 bg-sp-pale-green/10 rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-sp-white text-sm" title="Filter nodes and edges by time">Temporal Range</h4>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-sp-white/60">
                          {(() => {
                            const tempRange = getTemporalRange();
                            return data?.has_temporal ? 
                              `Available: ${tempRange.min.toFixed(2)} - ${tempRange.max.toFixed(2)} time units` :
                              'No temporal data available';
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={temporalStartInput}
                          onChange={(e) => {
                            setTemporalStartInput(e.target.value);
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              const tempRange = getTemporalRange();
                              setTemporalRange([value, temporalRange?.[1] ?? tempRange.max]);
                            }
                          }}
                          placeholder={`Min: ${getTemporalRange().min.toFixed(2)}`}
                          disabled={!data?.has_temporal}
                          className="flex-1 bg-sp-dark-blue border border-sp-pale-green/20 rounded px-2 py-1 text-sm text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green disabled:opacity-50"
                          title="Minimum time value"
                        />
                        <span className="text-sp-white/70 text-sm">to</span>
                        <input
                          type="number"
                          value={temporalEndInput}
                          onChange={(e) => {
                            setTemporalEndInput(e.target.value);
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              const tempRange = getTemporalRange();
                              setTemporalRange([temporalRange?.[0] ?? tempRange.min, value]);
                            }
                          }}
                          placeholder={`Max: ${getTemporalRange().max.toFixed(2)}`}
                          disabled={!data?.has_temporal}
                          className="flex-1 bg-sp-dark-blue border border-sp-pale-green/20 rounded px-2 py-1 text-sm text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green disabled:opacity-50"
                          title="Maximum time value"
                        />
                        <button
                          onClick={() => {
                            setTemporalRange(null);
                            setTemporalStartInput('');
                            setTemporalEndInput('');
                          }}
                          disabled={!data?.has_temporal}
                          className="text-sp-pale-green hover:text-sp-very-pale-green disabled:opacity-50 disabled:hover:text-sp-pale-green text-sm px-2"
                          title="Reset to full range"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Genomic Range Filtering */}
                    <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 bg-sp-pale-green/10 rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-sp-white text-sm" title="Filter by genomic position or tree index">Genomic Range</h4>
                        <select
                          value={genomicMode}
                          onChange={(e) => {
                            setGenomicMode(e.target.value as 'base_pairs' | 'tree_indices');
                            setGenomicRange(null);
                            setGenomicStartInput('');
                            setGenomicEndInput('');
                          }}
                          className="bg-sp-dark-blue border border-sp-pale-green/20 rounded px-2 py-1 text-xs text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green ml-auto"
                          title="Choose between base pair positions or tree indices"
                        >
                          <option value="base_pairs">Base Pairs</option>
                          <option value="tree_indices">Tree Indices</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-sp-white/60">
                          {(() => {
                            if (genomicMode === 'base_pairs') {
                              const genomicRange = getGenomicRange();
                              return `Available: ${genomicRange.min.toLocaleString()} - ${genomicRange.max.toLocaleString()} bp`;
                            } else {
                              const treeRange = getTreeIndexRange();
                              return `Available: ${treeRange.min} - ${treeRange.max} trees`;
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={genomicStartInput}
                          onChange={(e) => {
                            setGenomicStartInput(e.target.value);
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              const maxValue = genomicMode === 'base_pairs' ? getGenomicRange().max : getTreeIndexRange().max;
                              setGenomicRange([value, genomicRange?.[1] ?? maxValue]);
                            }
                          }}
                          min={0}
                          max={genomicMode === 'base_pairs' ? getGenomicRange().max : getTreeIndexRange().max}
                          placeholder={genomicMode === 'base_pairs' ? `Min: ${getGenomicRange().min}` : `Min: ${getTreeIndexRange().min}`}
                          className="flex-1 bg-sp-dark-blue border border-sp-pale-green/20 rounded px-2 py-1 text-sm text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green"
                          title={genomicMode === 'base_pairs' ? "Minimum base pair position" : "Starting tree index"}
                        />
                        <span className="text-sp-white/70 text-sm">to</span>
                        <input
                          type="number"
                          value={genomicEndInput}
                          onChange={(e) => {
                            setGenomicEndInput(e.target.value);
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              setGenomicRange([genomicRange?.[0] ?? 0, value]);
                            }
                          }}
                          min={0}
                          max={genomicMode === 'base_pairs' ? getGenomicRange().max : getTreeIndexRange().max}
                          placeholder={genomicMode === 'base_pairs' ? `Max: ${getGenomicRange().max.toLocaleString()}` : `Max: ${getTreeIndexRange().max}`}
                          className="flex-1 bg-sp-dark-blue border border-sp-pale-green/20 rounded px-2 py-1 text-sm text-sp-white focus:outline-none focus:ring-2 focus:ring-sp-pale-green"
                          title={genomicMode === 'base_pairs' ? "Maximum base pair position" : "Ending tree index"}
                        />
                        <button
                          onClick={() => {
                            setGenomicRange(null);
                            setGenomicStartInput('');
                            setGenomicEndInput('');
                          }}
                          className="text-sp-pale-green hover:text-sp-very-pale-green text-sm px-2"
                          title="Reset to full range"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-sp-pale-green/20 my-4"></div>

                  {/* Performance Options */}
                  <div className="space-y-3 mb-4">
                    {/* Enable Clustering for ARG visualization */}
                    <div className="flex items-center justify-between p-3 bg-sp-dark-blue/50 border border-sp-pale-green/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="enable-clustering"
                          checked={enableClustering}
                          onChange={(e) => setEnableClustering(e.target.checked)}
                          className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                        />
                        <label htmlFor="enable-clustering" className="text-sm text-sp-white font-medium cursor-pointer">
                          Enable Clustering (ARG Performance)
                        </label>
                      </div>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-72 p-3 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                          <strong className="text-sp-pale-green">⚠️ Beta Feature</strong><br/>
                          Condense dense subtrees into cluster nodes for better performance with large ARGs. Auto-enabled for graphs with &gt;250 nodes. Click cluster nodes to expand and explore details.<br/><br/>
                          <em className="text-sp-white/60">Note: This is a testing feature and may cause unexpected results.</em>
                        </div>
                      </div>
                    </div>

                    {/* Heatmap Mode Option for Spatial */}
                    {visualizeSpatialArgEnabled && (
                      <div className="flex items-center justify-between p-3 bg-sp-dark-blue/50 border border-sp-pale-green/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heatmap-only-mode"
                            checked={heatmapOnlyMode}
                            onChange={(e) => setHeatmapOnlyMode(e.target.checked)}
                            className="h-4 w-4 text-sp-pale-green focus:ring-sp-pale-green border-sp-pale-green/20 rounded bg-sp-dark-blue"
                          />
                          <label htmlFor="heatmap-only-mode" className="text-sm text-sp-white font-medium cursor-pointer">
                            Start in Heatmap-Only Mode
                          </label>
                        </div>
                        <div className="group relative">
                          <svg className="w-4 h-4 text-sp-pale-green/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-72 p-3 bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-lg shadow-xl text-xs text-sp-white/80 z-50">
                            Load spatial visualizations with only the heatmap visible. Nodes and edges remain hidden to improve performance for large ARGs. You can enable them later from the sidebar if needed.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Launch Buttons */}
                  <h4 className="font-medium text-sp-white text-sm mb-3">Launch Visualization</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    className={`bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue font-bold py-5 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex flex-col items-center gap-2 ${!visualizeArgEnabled && 'opacity-50 cursor-not-allowed hover:transform-none'}`}
                    disabled={!visualizeArgEnabled}
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (temporalRange) {
                        params.append('temporal_start', temporalRange[0].toString());
                        params.append('temporal_end', temporalRange[1].toString());
                      }
                      if (genomicRange) {
                        if (genomicMode === 'base_pairs') {
                          params.append('genomic_start', genomicRange[0].toString());
                          params.append('genomic_end', genomicRange[1].toString());
                        } else {
                          params.append('tree_start_idx', genomicRange[0].toString());
                          params.append('tree_end_idx', genomicRange[1].toString());
                        }
                      }
                      if (enableClustering) {
                        params.append('clustering', 'true');
                      }
                      const queryString = params.toString();
                      navigate(`/graph/${encodeURIComponent(data.filename)}${queryString ? `?${queryString}` : ''}`);
                    }}
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
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (temporalRange) {
                        params.append('temporal_start', temporalRange[0].toString());
                        params.append('temporal_end', temporalRange[1].toString());
                      }
                      if (genomicRange) {
                        if (genomicMode === 'base_pairs') {
                          params.append('genomic_start', genomicRange[0].toString());
                          params.append('genomic_end', genomicRange[1].toString());
                        } else {
                          params.append('tree_start_idx', genomicRange[0].toString());
                          params.append('tree_end_idx', genomicRange[1].toString());
                        }
                      }
                      if (heatmapOnlyMode) {
                        params.append('heatmap_mode', 'true');
                      }
                      const queryString = params.toString();
                      navigate(`/spatial/${encodeURIComponent(data.filename)}${queryString ? `?${queryString}` : ''}`);
                    }}
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
                  </div>
                </CollapsibleSection>

              </div>
            </div>
          </div>

          {/* Mutation Rate Modal */}
          <MutationRateModal
            isOpen={showMutationRateModal}
            onClose={() => setShowMutationRateModal(false)}
            onConfirm={handleTsdateInference}
          />

          {/* Advanced Subsetting Modal */}
          <AdvancedSubsettingModal
            isOpen={showAdvancedSubsettingModal}
            onClose={() => setShowAdvancedSubsettingModal(false)}
            onConfirm={handleAdvancedSubsetting}
            totalSamples={totalSamples || 0}
          />



          {/* Alert Modal */}
          <AlertModal
            isOpen={alertModal.isOpen}
            title={alertModal.title}
            message={alertModal.message}
            type={alertModal.type}
            onClose={alertModal.onClose || (() => setAlertModal({ ...alertModal, isOpen: false }))}
            buttonText={alertModal.buttonText}
          />
        </div>
      </div>

      {/* Tree Sequence Selector Modal - Main */}
      <TreeSequenceSelectorModal
        isOpen={showTreeSequenceSelector}
        onClose={() => setShowTreeSequenceSelector(false)}
        onSelect={handleTreeSequenceSelect}
      />

      {/* Tree Sequence Selector Modal - For Diff */}
      {showSecondTreeSequenceSelector && data && (
        <TreeSequenceSelectorModal
          isOpen={showSecondTreeSequenceSelector}
          onClose={() => setShowSecondTreeSequenceSelector(false)}
          onSelect={handleSecondTreeSequenceSelect}
        />
      )}
      <Footer />
    </div>
  );
} 