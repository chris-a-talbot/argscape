import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';
import { parseInferenceError, TIMEOUT_MESSAGE } from '../../lib/inferenceErrors';
import { SAMPLE_LIMITS } from '../../config/constants';
import AlertModal from '../ui/AlertModal';
import { DownloadDropdown } from '../ui/DownloadDropdown';
import { TreeSequenceSelectorModal } from '../ui/TreeSequenceSelectorModal';
import { SpatialDiffTreeSequenceSelectorModal } from '../ui/SpatialDiffTreeSequenceSelectorModal';
import Navbar from '../layout/Navbar';
import ParticleBackground from '../ui/ParticleBackground';
import Footer from '../layout/Footer';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { Tooltip, GroupTooltip } from '../ui/tooltip';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { LiquidButton } from '../ui/LiquidButton';
import {
  VisualizationWizard,
  VisualizationType,
  WizardSettings,
  TreeSequenceStats,
  WIZARD_THRESHOLDS,
  estimateComplexity,
  PreConfiguredSettings,
} from '../ui/VisualizationWizard';

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
  // Theme hooks
  const { colors } = useColorTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipMethod, setTooltipMethod] = useState<LocationInferenceMethod | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{left?: string, right?: string, top?: string, bottom?: string, transform?: string, marginLeft?: string, marginRight?: string}>({});
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const tooltipRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const mouseLeaveTimeoutRef = React.useRef<number | null>(null);

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

  // Cleanup timeout on unmount or when dropdown closes
  React.useEffect(() => {
    return () => {
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
      }
    };
  }, []);

  // Reset tooltip when dropdown closes
  React.useEffect(() => {
    if (!isOpen) {
      setTooltipMethod(null);
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
        mouseLeaveTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  // Calculate tooltip position with bounds checking
  React.useLayoutEffect(() => {
    if (!tooltipMethod || !isOpen) {
      setTooltipPosition({});
      return;
    }

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      const tooltipElement = tooltipRefs.current.get(tooltipMethod.id);
      const parentElement = tooltipElement?.parentElement;
      
      if (!tooltipElement || !parentElement) {
        // If we can't find the elements, use default positioning (to the left)
        setTooltipPosition({
          right: '100%',
          marginRight: '8px'
        });
        return;
      }

      const tooltipRect = tooltipElement.getBoundingClientRect();
      const parentRect = parentElement.getBoundingClientRect();
      
      const margin = 8;
      const gap = 8;
      
      // Default: try to position to the left
      const tooltipWidth = tooltipRect.width || 288; // w-72 = 18rem = 288px
      const leftPosition = parentRect.left - tooltipWidth - gap;
      
      // Check if tooltip would go off left edge
      if (leftPosition < margin) {
        // Position to the right instead
        setTooltipPosition({
          left: '100%',
          marginLeft: `${gap}px`
        });
      } else {
        // Position to the left (default)
        setTooltipPosition({
          right: '100%',
          marginRight: `${gap}px`
        });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [tooltipMethod, isOpen]);

  return (
    <div className="relative group">
      <button
        ref={buttonRef}
        className={`font-bold py-3 px-4 rounded-xl transition-all duration-200 transform flex items-center justify-center gap-2 w-full ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'
        } ${isInferring ? 'opacity-75 cursor-not-allowed' : ''}`}
        style={{
          backgroundColor: colors.accentPrimary,
          color: colors.buttonText,
          border: `1px solid ${colors.border}`
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isInferring) {
            e.currentTarget.style.backgroundColor = colors.accentSecondary;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isInferring) {
            e.currentTarget.style.backgroundColor = colors.accentPrimary;
          }
        }}
        onClick={handleToggle}
        disabled={disabled || isInferring}
        title={disabled ? "Requires sample spatial data" : ""}
      >
        {isInferring && (
          <div className="animate-spin rounded-full h-4 w-4 border border-t-transparent" style={{ borderColor: colors.accentPrimary, borderTopColor: 'transparent' }}></div>
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
        <GroupTooltip 
          content="Infer ancestral locations for nodes in the ARG using spatial inference methods. Choose from multiple algorithms optimized for different scenarios and ARG sizes."
          preferredPlacement="bottom"
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute z-[500] w-full ${
            openUpward ? 'bottom-full mb-2' : 'mt-2'
          }`}
          style={{
            backgroundColor: colors.containerBackground,
            border: `1px solid ${colors.border}`,
            borderRadius: '0.75rem',
            boxShadow: '0 8px 32px rgba(20, 226, 168, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <div className="py-2">
            {availableMethods.map((method) => (
              <div
                key={method.id}
                className="relative group"
                onMouseEnter={() => {
                  // Clear any pending hide timeout
                  if (mouseLeaveTimeoutRef.current) {
                    clearTimeout(mouseLeaveTimeoutRef.current);
                    mouseLeaveTimeoutRef.current = null;
                  }
                  setTooltipMethod(method);
                }}
                onMouseLeave={() => {
                  // Small delay to allow moving to tooltip
                  mouseLeaveTimeoutRef.current = window.setTimeout(() => {
                    const tooltip = tooltipRefs.current.get(method.id);
                    if (tooltip && !tooltip.matches(':hover')) {
                      setTooltipMethod(null);
                    }
                  }, 100);
                }}
              >
                <button
                  className="w-full px-4 py-2 text-left transition-colors duration-200"
                  style={{
                    color: !method.enabled ? colors.textSecondary : colors.text,
                    backgroundColor: selectedMethod === method.id ? `${colors.accentPrimary}20` : 'transparent',
                    cursor: !method.enabled ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (method.enabled) {
                      e.currentTarget.style.backgroundColor = colors.accentPrimary;
                      e.currentTarget.style.color = colors.buttonText;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (method.enabled) {
                      e.currentTarget.style.backgroundColor = selectedMethod === method.id ? `${colors.accentPrimary}20` : 'transparent';
                      e.currentTarget.style.color = colors.text;
                    }
                  }}
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
                    {!method.enabled && <span className="text-xs" style={{ color: `${colors.accentPrimary}80` }}>Coming Soon</span>}
                  </div>
                </button>
                {/* Tooltip */}
                {tooltipMethod?.id === method.id ? (() => {
                  const methodIndex = availableMethods.findIndex(m => m.id === method.id);
                  let verticalPositioning: { top?: string; bottom?: string; transform?: string } = {};
                  
                  if (methodIndex <= 1) {
                    // Top 2 methods: align tooltip top with entry top
                    verticalPositioning = { top: '0' };
                  } else if (methodIndex <= 3) {
                    // Middle 2 methods: center tooltip with entry
                    verticalPositioning = { top: '50%', transform: 'translateY(-50%)' };
                  } else {
                    // Bottom 2 methods: align tooltip bottom with entry bottom
                    verticalPositioning = { bottom: '0' };
                  }
                  
                  // Merge vertical positioning with horizontal positioning from bounds checking
                  const finalTransform = verticalPositioning.transform || tooltipPosition.transform || undefined;
                  
                  return (
                    <div 
                      ref={(el) => {
                        if (el) {
                          tooltipRefs.current.set(method.id, el);
                        } else {
                          tooltipRefs.current.delete(method.id);
                        }
                      }}
                      data-tooltip-id={method.id}
                      className="absolute z-[9999] w-72 p-4 rounded-xl shadow-xl pointer-events-auto"
                      style={{
                        backgroundColor: colors.tooltipBackground,
                        border: `1px solid ${colors.border}`,
                        right: tooltipPosition.right || '100%',
                        left: tooltipPosition.left,
                        ...verticalPositioning,
                        transform: finalTransform,
                        marginRight: tooltipPosition.marginRight || '8px',
                        marginLeft: tooltipPosition.marginLeft
                      }}
                      onMouseEnter={() => {
                        // Clear any pending hide timeout
                        if (mouseLeaveTimeoutRef.current) {
                          clearTimeout(mouseLeaveTimeoutRef.current);
                          mouseLeaveTimeoutRef.current = null;
                        }
                        setTooltipMethod(method);
                      }}
                      onMouseLeave={() => {
                        setTooltipMethod(null);
                      }}
                    >
                    <h4 className="font-bold mb-2" style={{ color: colors.accentPrimary }}>{tooltipMethod.name}</h4>
                    <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{tooltipMethod.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs" style={{ color: colors.textSecondary }}>Speed:</span>
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
                          className="text-xs underline"
                          style={{ color: colors.accentPrimary }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
                            className="text-xs underline"
                            style={{ color: colors.accentPrimary }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            View gaia on GitHub
                          </a>
                          <a
                            href={tooltipMethod.github2}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline"
                            style={{ color: colors.accentPrimary }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
                            className="text-xs underline"
                            style={{ color: colors.accentPrimary }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            View fastgaia on GitHub
                          </a>
                          <a
                            href={tooltipMethod.github2}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline"
                            style={{ color: colors.accentPrimary }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            View gaia on GitHub
                          </a>
                        </>
                      ) : tooltipMethod.github && (
                        <a
                          href={tooltipMethod.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline"
                          style={{ color: colors.accentPrimary }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
    random_sample_count?: number;
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
  // Theme hooks
  const { colors } = useColorTheme();
  
  const [sampleInput, setSampleInput] = useState('');
  const [sampleInputType, setSampleInputType] = useState<'comma' | 'range' | 'file' | 'random'>('comma');
  const [rangeStart, setRangeStart] = useState('0');
  const [rangeEnd, setRangeEnd] = useState(totalSamples.toString());
  const [randomSampleCount, setRandomSampleCount] = useState('');
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
      
      case 'random':
        // For random, we don't parse samples here - backend handles it
        return [];
      
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
    if (sampleInputType !== 'random') {
      updatePreview();
    } else {
      setSamplePreviews([]);
    }
  }, [sampleInput, sampleInputType, rangeStart, rangeEnd, uploadedFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (sampleInputType === 'random') {
        const count = parseInt(randomSampleCount);
        if (isNaN(count) || count < 1 || count > totalSamples) {
          alert(`Please enter a valid number between 1 and ${totalSamples}`);
          return;
        }
        onConfirm({
          filename: '', // Will be set by the calling component
          random_sample_count: count,
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
      } else {
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
      }
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
      <div className="rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: colors.headerText }}>Advanced Subsetting</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Sample Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Sample Selection Method
            </label>
            <select
              value={sampleInputType}
              onChange={(e) => setSampleInputType(e.target.value as 'comma' | 'range' | 'file' | 'random')}
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.containerBackground,
                border: `1px solid ${colors.border}`,
                color: colors.text
              }}
            >
              <option value="comma">Comma-separated list</option>
              <option value="range">Range</option>
              <option value="file">Upload file</option>
              <option value="random">Random selection</option>
            </select>
          </div>

          {/* Sample Input Based on Type */}
          {sampleInputType === 'comma' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Sample IDs (comma-separated)
              </label>
              <textarea
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                placeholder="0, 1, 2, 5, 10, 15"
                className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 font-mono"
                style={{
                  backgroundColor: colors.containerBackground,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
                rows={3}
              />
            </div>
          )}

          {sampleInputType === 'range' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Start Sample ID
                </label>
                <input
                  type="number"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  min="0"
                  max={totalSamples - 1}
                  className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 font-mono"
                style={{
                  backgroundColor: colors.containerBackground,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  End Sample ID
                </label>
                <input
                  type="number"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  min="0"
                  max={totalSamples - 1}
                  className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 font-mono"
                style={{
                  backgroundColor: colors.containerBackground,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
                />
              </div>
            </div>
          )}

          {sampleInputType === 'file' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Upload CSV/TSV File
              </label>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: colors.containerBackground,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
              />
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                Upload a CSV or TSV file with sample IDs in a single column or row
              </p>
            </div>
          )}

          {sampleInputType === 'random' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Number of Samples to Randomly Select
              </label>
              <input
                type="number"
                value={randomSampleCount}
                onChange={(e) => setRandomSampleCount(e.target.value)}
                min="1"
                max={totalSamples}
                placeholder={`Enter number between 1 and ${totalSamples}`}
                className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 font-mono"
                style={{
                  backgroundColor: colors.containerBackground,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
              />
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                Randomly select this many samples from the tree sequence
              </p>
            </div>
          )}

          {/* Sample Preview */}
          {samplePreviews.length > 0 && (
            <div className="rounded p-3" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                Sample Preview ({samplePreviews.length} samples{samplePreviews.length === 10 ? '+' : ''}):
              </p>
              <p className="text-xs font-mono" style={{ color: colors.textSecondary }}>
                {samplePreviews.join(', ')}{samplePreviews.length === 10 ? '...' : ''}
              </p>
            </div>
          )}

          {/* Simplify Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium" style={{ color: colors.textSecondary }}>Simplification Options</h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="map-nodes"
                    checked={mapNodes}
                    onChange={(e) => setMapNodes(e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="map-nodes" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Map nodes
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="reduce-to-site-topology" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Reduce to site topology
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="filter-populations" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Filter populations
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="filter-individuals" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Filter individuals
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="filter-sites" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Filter sites
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="filter-nodes" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Filter nodes
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="update-sample-flags" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Update sample flags
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="keep-unary" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Keep unary nodes
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="keep-unary-in-individuals" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Keep unary in individuals
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="keep-input-roots" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Keep input roots
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="record-provenance" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                    Record provenance
                  </label>
                </div>
                <div className="group relative">
                  <svg className="w-4 h-4 cursor-help" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 rounded-lg shadow-xl text-xs z-50" style={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.border}`, color: colors.tooltipText }}>
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
              className="px-4 py-2 transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="font-bold px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: colors.accentPrimary, color: colors.buttonText }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentSecondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentPrimary}
            >
              Simplify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Midpoint configuration modal component
function MidpointConfigModal({
  isOpen,
  onClose,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: {
    weight_by_span: boolean;
    weight_branch_length: boolean;
  }) => void;
}) {
  // Theme hooks
  const { colors } = useColorTheme();
  
  const [weightBySpan, setWeightBySpan] = useState(true);
  const [weightBranchLength, setWeightBranchLength] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      weight_by_span: weightBySpan,
      weight_branch_length: weightBranchLength
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: colors.headerText }}>Midpoint Inference Configuration</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Weighting Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium" style={{ color: colors.textSecondary }}>Weighting Options</h4>
            <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
              Choose how to weight child locations when calculating parent node locations. 
              You can use edge spans (genomic length), branch lengths (temporal), both (multiplied), or neither (equal weights).
            </p>
            
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center flex-1">
                <input
                  type="checkbox"
                  id="weight-by-span"
                  checked={weightBySpan}
                  onChange={(e) => setWeightBySpan(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: colors.accentPrimary }}
                />
                <label htmlFor="weight-by-span" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                  Weight by edge spans (genomic length)
                </label>
              </div>
              <Tooltip content="Weight child locations by the total genomic length (edge spans) inherited from each child. This reflects how much of the genome is contributed by each child. When a parent has multiple edges to the same child (common in ARGs with recombination), spans are summed. This is the default option and matches the approach used in average_population_ancestors_geography." />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center flex-1">
                <input
                  type="checkbox"
                  id="weight-branch-length"
                  checked={weightBranchLength}
                  onChange={(e) => setWeightBranchLength(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: colors.accentPrimary }}
                />
                <label htmlFor="weight-branch-length" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                  Weight by branch lengths (temporal)
                </label>
              </div>
              <Tooltip content="Weight child locations by the temporal difference (branch length) between parent and child nodes. Longer branches suggest more evolutionary time, which may reflect more opportunity for geographic movement. This matches the original Wohns et al. 2022 approach." />
            </div>
            
            {/* Info about combined weighting */}
            {weightBySpan && weightBranchLength && (
              <div className="ml-6 p-3 rounded-lg" style={{ backgroundColor: `${colors.accentPrimary}20`, border: `1px solid ${colors.accentPrimary}` }}>
                <p className="text-xs" style={{ color: colors.accentPrimary }}>
                  <strong>Combined weighting:</strong> When both options are enabled, weights are multiplied together 
                  (edge_span × branch_length). This gives more weight to children that contribute both more genomic 
                  material and have longer evolutionary branches.
                </p>
              </div>
            )}
            
            {/* Info about equal weighting */}
            {!weightBySpan && !weightBranchLength && (
              <div className="ml-6 p-3 rounded-lg" style={{ backgroundColor: '#78350f40', border: '1px solid #d97706' }}>
                <p className="text-xs" style={{ color: '#fef3c7' }}>
                  <strong>Equal weighting:</strong> When neither option is enabled, all children are weighted equally. 
                  This gives a simple unweighted average of child locations.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="font-bold px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: colors.accentPrimary, color: colors.buttonText }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentSecondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentPrimary}
            >
              Run Midpoint Inference
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add GAIA Quadratic configuration modal component
function GAIAQuadraticConfigModal({
  isOpen,
  onClose,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: {
    use_branch_lengths: boolean;
  }) => void;
}) {
  // Theme hooks
  const { colors } = useColorTheme();
  
  const [useBranchLengths, setUseBranchLengths] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      use_branch_lengths: useBranchLengths
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: colors.headerText }}>GAIA Quadratic Inference Configuration</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Branch Length Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium" style={{ color: colors.textSecondary }}>Parsimony Options</h4>
            <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
              Choose whether to use branch lengths (temporal distances) in the quadratic parsimony calculation.
            </p>
            
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center flex-1">
                <input
                  type="checkbox"
                  id="use-branch-lengths-gaia-quad"
                  checked={useBranchLengths}
                  onChange={(e) => setUseBranchLengths(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: colors.accentPrimary }}
                />
                <label htmlFor="use-branch-lengths-gaia-quad" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                  Use branch lengths in parsimony calculation
                </label>
              </div>
              <Tooltip content="When enabled, the quadratic parsimony algorithm uses temporal branch lengths (time differences between nodes) in the cost calculation. This accounts for the evolutionary time available for geographic movement along each branch. When disabled, the algorithm treats all branches equally regardless of their temporal length." />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="font-bold px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: colors.accentPrimary, color: colors.buttonText }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentSecondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentPrimary}
            >
              Run GAIA Quadratic Inference
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add GAIA Linear configuration modal component
function GAIALinearConfigModal({
  isOpen,
  onClose,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: {
    use_branch_lengths: boolean;
  }) => void;
}) {
  // Theme hooks
  const { colors } = useColorTheme();
  
  const [useBranchLengths, setUseBranchLengths] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      use_branch_lengths: useBranchLengths
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: colors.headerText }}>GAIA Linear Inference Configuration</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Branch Length Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium" style={{ color: colors.textSecondary }}>Parsimony Options</h4>
            <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
              Choose whether to use branch lengths (temporal distances) in the linear parsimony calculation.
            </p>
            
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center flex-1">
                <input
                  type="checkbox"
                  id="use-branch-lengths-gaia-linear"
                  checked={useBranchLengths}
                  onChange={(e) => setUseBranchLengths(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: colors.accentPrimary }}
                />
                <label htmlFor="use-branch-lengths-gaia-linear" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                  Use branch lengths in parsimony calculation
                </label>
              </div>
              <Tooltip content="When enabled, the linear parsimony algorithm uses temporal branch lengths (time differences between nodes) in the cost calculation. This accounts for the evolutionary time available for geographic movement along each branch. When disabled, the algorithm treats all branches equally regardless of their temporal length." />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="font-bold px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: colors.accentPrimary, color: colors.buttonText }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentSecondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentPrimary}
            >
              Run GAIA Linear Inference
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add FastGAIA configuration modal component
function FastGAIAConfigModal({
  isOpen,
  onClose,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: {
    weight_span: boolean;
    weight_branch_length: boolean;
  }) => void;
}) {
  // Theme hooks
  const { colors } = useColorTheme();
  
  const [weightSpan, setWeightSpan] = useState(true);
  const [weightBranchLength, setWeightBranchLength] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      weight_span: weightSpan,
      weight_branch_length: weightBranchLength
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: colors.headerText }}>FastGAIA Inference Configuration</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Weighting Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium" style={{ color: colors.textSecondary }}>Weighting Options</h4>
            <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
              Choose how to weight child locations when calculating parent node locations. 
              You can use edge spans (genomic length), branch lengths (temporal), both (multiplied), or neither (equal weights).
            </p>
            
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center flex-1">
                <input
                  type="checkbox"
                  id="weight-span-fastgaia"
                  checked={weightSpan}
                  onChange={(e) => setWeightSpan(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: colors.accentPrimary }}
                />
                <label htmlFor="weight-span-fastgaia" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                  Weight by edge spans (genomic length)
                </label>
              </div>
              <Tooltip content="Weight child locations by the total genomic length (edge spans) inherited from each child. This reflects how much of the genome is contributed by each child. When a parent has multiple edges to the same child (common in ARGs with recombination), spans are summed." />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center flex-1">
                <input
                  type="checkbox"
                  id="weight-branch-length-fastgaia"
                  checked={weightBranchLength}
                  onChange={(e) => setWeightBranchLength(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: colors.accentPrimary }}
                />
                <label htmlFor="weight-branch-length-fastgaia" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                  Weight by inverse branch lengths (temporal)
                </label>
              </div>
              <Tooltip content="Weight child locations by the inverse of the temporal difference (branch length) between parent and child nodes. Shorter branches (more recent ancestors) are given more weight. This is the default behavior in fastgaia." />
            </div>
            
            {/* Info about combined weighting */}
            {weightSpan && weightBranchLength && (
              <div className="ml-6 p-3 rounded-lg" style={{ backgroundColor: `${colors.accentPrimary}20`, border: `1px solid ${colors.accentPrimary}` }}>
                <p className="text-xs" style={{ color: colors.accentPrimary }}>
                  <strong>Combined weighting:</strong> When both options are enabled, weights are multiplied together 
                  (edge_span × inverse_branch_length). This gives more weight to children that contribute both more genomic 
                  material and are more recent ancestors.
                </p>
              </div>
            )}
            
            {/* Info about equal weighting */}
            {!weightSpan && !weightBranchLength && (
              <div className="ml-6 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                <p className="text-xs text-yellow-200">
                  <strong>Equal weighting:</strong> When neither option is enabled, all children are weighted equally. 
                  This gives a simple unweighted average of child locations.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="font-bold px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: colors.accentPrimary, color: colors.buttonText }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentSecondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentPrimary}
            >
              Run FastGAIA Inference
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  // Theme hooks
  const { colors } = useColorTheme();
  
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
      <div className="rounded-xl p-6 w-full max-w-md" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: colors.headerText }}>Set Mutation Rate</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="mutation-rate" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
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
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 font-mono"
              style={{
                backgroundColor: colors.containerBackground,
                border: `1px solid ${colors.border}`,
                color: colors.text
              }}
              placeholder="1e-8"
            />
            <p className="mt-1 text-xs" style={{ color: colors.textSecondary }}>
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
                className="h-4 w-4 rounded"
                style={{ accentColor: colors.accentPrimary }}
              />
              <label htmlFor="preprocess" className="ml-2 block text-sm" style={{ color: colors.textSecondary }}>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="remove-telomeres" className="ml-2 block text-sm" style={{ color: colors.textSecondary }}>
                    Remove telomeres (flanking regions)
                  </label>
                </div>

                <div>
                  <label htmlFor="minimum-gap" className="block text-sm mb-1" style={{ color: colors.textSecondary }}>
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
                    className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 font-mono"
                style={{
                  backgroundColor: colors.containerBackground,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
                    placeholder="1000000"
                  />
                  <p className="mt-1 text-xs" style={{ color: colors.textSecondary }}>
                    Default: 1,000,000 bp
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="split-disjoint"
                    checked={splitDisjoint}
                    onChange={(e) => setSplitDisjoint(e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="split-disjoint" className="ml-2 block text-sm" style={{ color: colors.textSecondary }}>
                    Split disjoint nodes
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-populations"
                    checked={filterPopulations}
                    onChange={(e) => setFilterPopulations(e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="filter-populations" className="ml-2 block text-sm" style={{ color: colors.textSecondary }}>
                    Filter populations
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-individuals"
                    checked={filterIndividuals}
                    onChange={(e) => setFilterIndividuals(e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="filter-individuals" className="ml-2 block text-sm" style={{ color: colors.textSecondary }}>
                    Filter individuals
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-sites"
                    checked={filterSites}
                    onChange={(e) => setFilterSites(e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: colors.accentPrimary }}
                  />
                  <label htmlFor="filter-sites" className="ml-2 block text-sm" style={{ color: colors.textSecondary }}>
                    Filter sites
                  </label>
                </div>

                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  Preprocessing simplifies the tree sequence by removing unary nodes and splitting disjoint nodes.
                  Telomeres are flanking regions that may contain missing data.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <LiquidButton
              variant="secondary"
              onClick={onClose}
              type="button"
            >
              Cancel
            </LiquidButton>
            <LiquidButton
              variant="primary"
              type="submit"
              className="font-bold"
            >
              Run tsdate
            </LiquidButton>
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
    setGenomicMode,
    // Sample subsetting
    sampleSubsetMode,
    setSampleSubsetMode,
    sampleIds,
    setSampleIds,
    sampleRange,
    setSampleRange,
    randomSeed,
    setRandomSeed,
    selectedPopulations,
    setSelectedPopulations,
  } = useTreeSequence();
  
  // Theme system hooks
  const { colors } = useColorTheme();
  const { pageStyle, glassPanelStyle } = useThemeStyles();
  
  const [totalSamples, setTotalSamples] = useState<number | null>(null);
  const [isInferringLocationsFast, setIsInferringLocationsFast] = useState(false);
  const [isInferringLocationsGaiaQuadratic, setIsInferringLocationsGaiaQuadratic] = useState(false);
  const [isInferringLocationsGaiaLinear, setIsInferringLocationsGaiaLinear] = useState(false);
  const [isInferringLocationsMidpoint, setIsInferringLocationsMidpoint] = useState(false);
  const [isInferringLocationsSparg, setIsInferringLocationsSparg] = useState(false);
  const [showMidpointConfigModal, setShowMidpointConfigModal] = useState(false);
  const [showGAIAQuadraticConfigModal, setShowGAIAQuadraticConfigModal] = useState(false);
  const [showGAIALinearConfigModal, setShowGAIALinearConfigModal] = useState(false);
  const [showFastGAIAConfigModal, setShowFastGAIAConfigModal] = useState(false);
  const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);
  const [, setInputValue] = useState(maxSamples.toString());
  const [selectedInferenceMethod, setSelectedInferenceMethod] = useState<string>('gaia_quadratic');
  // Sample subsetting input state
  const [sampleIdsInput, setSampleIdsInput] = useState('');
  const [sampleRangeStartInput, setSampleRangeStartInput] = useState('');
  const [sampleRangeEndInput, setSampleRangeEndInput] = useState('');
  const [randomSeedInput, setRandomSeedInput] = useState('');
  const [sampleIdsError, setSampleIdsError] = useState<string | null>(null);
  const [showMutationRateModal, setShowMutationRateModal] = useState(false);
  const [isInferringTimes, setIsInferringTimes] = useState(false);
  const [showSecondTreeSequenceSelector, setShowSecondTreeSequenceSelector] = useState(false);
  const [, setSelectedSecondTreeSequence] = useState<TreeSequence | null>(null);
  const [showAdvancedSubsettingModal, setShowAdvancedSubsettingModal] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [heatmapOnlyMode, setHeatmapOnlyMode] = useState(false);
  
  // Clustering control for ARG visualization
  const [enableClustering, setEnableClustering] = useState(false);

  // Node focus state (mutually exclusive with sample subsetting)
  const [focusMode, setFocusMode] = useState<'none' | 'root' | 'sample'>('none');
  const [focusNodeId, setFocusNodeId] = useState<number | null>(null);
  const [focusNodeInput, setFocusNodeInput] = useState('');
  const [focusNodeError, setFocusNodeError] = useState<string | null>(null);

  // Temporal range input states
  const [temporalStartInput, setTemporalStartInput] = useState('');
  const [temporalEndInput, setTemporalEndInput] = useState('');
  
  // Genomic range input states
  const [genomicStartInput, setGenomicStartInput] = useState('');
  const [genomicEndInput, setGenomicEndInput] = useState('');

  // Visualization wizard state
  const [showVisualizationWizard, setShowVisualizationWizard] = useState(false);
  const [wizardVisualizationType, setWizardVisualizationType] = useState<VisualizationType | null>(null);
  // Track whether user has explicitly interacted with Advanced Settings
  // This determines if wizard shows full steps or just confirmation
  const [hasInteractedWithAdvancedSettings, setHasInteractedWithAdvancedSettings] = useState(false);

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
    } else {
      setTemporalStartInput('');
      setTemporalEndInput('');
    }
  }, [temporalRange]);

  // Effect to update genomic input fields when range changes
  useEffect(() => {
    if (genomicRange) {
      setGenomicStartInput(genomicRange[0].toString());
      setGenomicEndInput(genomicRange[1].toString());
    } else {
      setGenomicStartInput('');
      setGenomicEndInput('');
    }
  }, [genomicRange]);

  // Modal states
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    buttonText?: string;
    secondaryButtonText?: string;
    onClose?: () => void;
    onSecondaryAction?: () => void;
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

  // Fetch statistics if they're missing
  useEffect(() => {
    const fetchStatistics = async () => {
      if (data?.filename && !data.statistics) {
        try {
          const response = await api.getTreeSequenceMetadata(data.filename);
          const metadata = response.data as any;
          if (metadata.statistics) {
            setTreeSequence({
              ...data,
              statistics: metadata.statistics
            });
          }
        } catch (error) {
          log.debug('Could not fetch statistics', {
            component: 'ResultPage',
            error: error instanceof Error ? error : new Error(String(error))
          });
        }
      }
    };
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.filename]);

  // Sync input value with maxSamples changes
  useEffect(() => {
    setInputValue(maxSamples.toString());
  }, [maxSamples]);

  // Sync sample range input fields with sampleRange state
  useEffect(() => {
    if (sampleRange) {
      setSampleRangeStartInput(sampleRange[0].toString());
      setSampleRangeEndInput(sampleRange[1].toString());
    } else {
      setSampleRangeStartInput('');
      setSampleRangeEndInput('');
    }
  }, [sampleRange]);

  useEffect(() => {
    setSampleIdsInput(sampleIds.join(', '));
    if (sampleIds.length === 0) {
      setSampleIdsError(null);
    }
  }, [sampleIds]);

  useEffect(() => {
    setRandomSeedInput(randomSeed !== null ? randomSeed.toString() : '');
  }, [randomSeed]);

  useEffect(() => {
    setFocusNodeInput(focusNodeId !== null ? focusNodeId.toString() : '');
    if (focusNodeId === null) {
      setFocusNodeError(null);
    }
  }, [focusNodeId]);

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

  const totalConfiguredSamples = totalSamples ?? data?.num_samples ?? 0;
  const fullSampleRange = useMemo<[number, number] | null>(
    () => (totalConfiguredSamples > 0 ? [0, totalConfiguredSamples - 1] : null),
    [totalConfiguredSamples]
  );

  // Build stats object for visualization wizard
  const getTreeSequenceStats = (): TreeSequenceStats => ({
    numNodes: data?.num_nodes || 0,
    numEdges: data?.num_edges || 0,
    numSamples: data?.num_samples || 0,
    numTrees: data?.num_trees || 1,
    sequenceLength: getGenomicRange().max, // Use same source as advanced settings
    hasTemporal: data?.has_temporal || false,
    hasAllSpatial: data?.has_all_spatial || false,
    numPopulations: data?.statistics?.num_populations ?? undefined,
    temporalRange: data?.temporal_range ? {
      min: data.temporal_range.min_time,
      max: data.temporal_range.max_time,
    } : undefined,
  });

  const buildWizardPreConfigured = useCallback((): PreConfiguredSettings => ({
    temporalRange,
    genomicRange,
    genomicMode,
    sampleSubsetMode,
    maxSamples,
    sampleIds,
    sampleRange,
    selectedPopulations,
    enableClustering,
    heatmapOnlyMode,
    focusMode,
    focusNodeId,
  }), [
    temporalRange,
    genomicRange,
    genomicMode,
    sampleSubsetMode,
    maxSamples,
    sampleIds,
    sampleRange,
    selectedPopulations,
    enableClustering,
    heatmapOnlyMode,
    focusMode,
    focusNodeId,
  ]);

  const hasConfiguredSampleSubset =
    (sampleSubsetMode === 'even' || sampleSubsetMode === 'random')
      ? maxSamples < totalConfiguredSamples
      : sampleSubsetMode === 'range'
        ? (
          sampleRange !== null &&
          (fullSampleRange === null ||
            sampleRange[0] !== fullSampleRange[0] ||
            sampleRange[1] !== fullSampleRange[1])
        )
        : sampleSubsetMode === 'ids'
          ? sampleIds.length > 0
          : sampleSubsetMode === 'population'
            ? selectedPopulations.length > 0
            : false;

  const hasPreConfig =
    hasInteractedWithAdvancedSettings ||
    temporalRange !== null ||
    genomicRange !== null ||
    hasConfiguredSampleSubset ||
    focusMode !== 'none' ||
    enableClustering ||
    heatmapOnlyMode;

  const syncWizardSettingsToAdvancedSettings = useCallback((settings: WizardSettings) => {
    setTemporalRange(settings.temporalRange);
    setGenomicMode(settings.filterMode);
    setGenomicRange(
      settings.regionFilter === 'filtered'
        ? settings.filterMode === 'base_pairs'
          ? settings.genomicRange
          : settings.treeRange
        : null
    );

    setEnableClustering(settings.enableClustering);
    setHeatmapOnlyMode(settings.enableHeatmap);

    if (settings.dataScope === 'subset') {
      setFocusMode('none');
      setFocusNodeId(null);

      switch (settings.subsetMethod) {
        case 'even':
          setSampleSubsetMode('even');
          setMaxSamples(settings.sampleCount);
          setSampleIds([]);
          setSampleRange(null);
          setSelectedPopulations([]);
          setRandomSeed(null);
          break;
        case 'random':
          setSampleSubsetMode('random');
          setMaxSamples(settings.sampleCount);
          setSampleIds([]);
          setSampleRange(null);
          setSelectedPopulations([]);
          break;
        case 'range':
          setSampleSubsetMode('range');
          setSampleRange([settings.sampleRangeStart, settings.sampleRangeEnd]);
          setSampleIds([]);
          setSelectedPopulations([]);
          setRandomSeed(null);
          break;
        case 'specific':
          setSampleSubsetMode('ids');
          setSampleIds(settings.sampleIds);
          setSampleRange(null);
          setSelectedPopulations([]);
          setRandomSeed(null);
          break;
        case 'population':
          setSampleSubsetMode('population');
          setSelectedPopulations(settings.selectedPopulations);
          setSampleIds([]);
          setSampleRange(null);
          setRandomSeed(null);
          break;
      }
      return;
    }

    setSampleSubsetMode('range');
    setSampleIds([]);
    setSampleRange(fullSampleRange);
    setSelectedPopulations([]);
    setRandomSeed(null);

    if (settings.dataScope === 'focal') {
      setFocusMode(settings.focalMode === 'subgraph' ? 'root' : 'sample');
      setFocusNodeId(settings.focalNodeId);
    } else {
      setFocusMode('none');
      setFocusNodeId(null);
    }
  }, [
    fullSampleRange,
    setTemporalRange,
    setGenomicMode,
    setGenomicRange,
    setMaxSamples,
    setSampleSubsetMode,
    setSampleIds,
    setSampleRange,
    setSelectedPopulations,
    setRandomSeed,
    setEnableClustering,
    setHeatmapOnlyMode,
    setFocusMode,
    setFocusNodeId,
  ]);

  // Handle wizard launch
  const handleWizardLaunch = (settings: WizardSettings) => {
    setShowVisualizationWizard(false);
    if (!wizardVisualizationType || !data?.filename) return;

    const params = new URLSearchParams();

    syncWizardSettingsToAdvancedSettings(settings);

    // Apply temporal range from advanced settings or wizard
    if (settings.temporalRange) {
      params.append('temporal_start', settings.temporalRange[0].toString());
      params.append('temporal_end', settings.temporalRange[1].toString());
    }

    // Apply genomic/tree range from wizard
    if (settings.regionFilter === 'filtered') {
      if (settings.filterMode === 'base_pairs' && settings.genomicRange) {
        params.append('genomic_start', settings.genomicRange[0].toString());
        params.append('genomic_end', settings.genomicRange[1].toString());
      } else if (settings.filterMode === 'tree_indices' && settings.treeRange) {
        params.append('tree_start_idx', settings.treeRange[0].toString());
        params.append('tree_end_idx', settings.treeRange[1].toString());
      }
    }

    // Apply performance options
    if (settings.enableClustering) {
      params.append('clustering', 'true');
    }
    if (settings.enableHeatmap && wizardVisualizationType === '3d') {
      params.append('heatmap_mode', 'true');
    }

    if (settings.dataScope === 'focal' && settings.focalNodeId !== null) {
      params.append(
        settings.focalMode === 'subgraph' ? 'focus_root' : 'focus_sample',
        settings.focalNodeId.toString()
      );
    }

    // Default to dagre-d3 layout for large graphs (150+ estimated nodes)
    if (wizardVisualizationType === '2d') {
      const complexity = estimateComplexity(getTreeSequenceStats(), settings);
      if (complexity.estimatedNodes >= WIZARD_THRESHOLDS.DAGRE_DEFAULT_NODES) {
        params.append('layout', 'dagre');
      }
    }

    // Mark that user has interacted with advanced settings (for wizard logic)
    setHasInteractedWithAdvancedSettings(true);

    const queryString = params.toString();
    const basePath = wizardVisualizationType === '2d' ? '/graph' :
      wizardVisualizationType === '3d' ? '/spatial' : '/spatial-diff';

    if (wizardVisualizationType === 'diff') {
      // For diff, we need to open the second tree sequence selector
      // Store the wizard settings and open the selector
      setShowSecondTreeSequenceSelector(true);
      // The second TS selector will handle navigation with these params
    } else {
      navigate(`${basePath}/${encodeURIComponent(data.filename)}${queryString ? `?${queryString}` : ''}`);
    }
  };

  // Open wizard for a visualization type
  const openWizard = (vizType: VisualizationType) => {
    setWizardVisualizationType(vizType);
    setShowVisualizationWizard(true);
  };

  // Fast location inference is available for:
  // 1. ARGs with spatial info for samples but not all nodes (sample_only)
  // 2. ARGs with spatial info for all nodes (all) - for re-inference
  const fastLocationInferenceEnabled = data?.spatial_status === "sample_only" || data?.spatial_status === "all";

  const visualizeArgEnabled = true; // Always available if data loaded
  const visualizeSpatialArgEnabled = !!(data?.has_temporal && data?.has_all_spatial);  // Require temporal and all spatial
  const visualizeSpatialDiffEnabled = visualizeSpatialArgEnabled; // Same requirements as spatial ARG

  // Add mutation data status check
  const hasMutations = data?.num_mutations !== undefined && data.num_mutations > 0;
  const formatInferenceCpuTime = (cpuTimeSeconds?: number | null): string => {
    if (cpuTimeSeconds === null || cpuTimeSeconds === undefined || !Number.isFinite(cpuTimeSeconds)) {
      return '';
    }

    const precision = cpuTimeSeconds >= 1 ? 2 : 3;
    return `\nCPU time: ${cpuTimeSeconds.toFixed(precision)}s`;
  };

  // Handle FastGAIA inference with configuration
  const handleFastGAIAInference = async (params: {
    weight_span: boolean;
    weight_branch_length: boolean;
  }) => {
    if (!data?.filename || isInferringLocationsFast) return;

    setIsInferringLocationsFast(true);
    setShowFastGAIAConfigModal(false);

    try {
      log.user.action('fast-location-inference-start', { filename: data.filename, params }, 'ResultPage');

      const result = await api.inferLocationsFast({
        filename: data.filename,
        weight_span: params.weight_span,
        weight_branch_length: params.weight_branch_length,
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
        message: `Fast location inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.${formatInferenceCpuTime(resultData.cpu_time_seconds)}\nNew file: ${resultData.new_filename}`,
        type: 'success'
      });

    } catch (error) {
      log.error('Fast location inference failed', {
        component: 'ResultPage',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename: data.filename }
      });
      const { title, message, isTimeout } = parseInferenceError(error);
      setAlertModal({
        isOpen: true,
        title,
        message: isTimeout ? TIMEOUT_MESSAGE : message,
        type: 'error',
        buttonText: isTimeout ? 'Install Locally' : undefined,
        secondaryButtonText: isTimeout ? 'Close' : undefined,
        onClose: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
          navigate('/install');
        } : undefined,
        onSecondaryAction: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
        } : undefined
      });
    } finally {
      setIsInferringLocationsFast(false);
    }
  };

  // Handle GAIA Quadratic inference with configuration
  const handleGaiaQuadraticInference = async (params: {
    use_branch_lengths: boolean;
  }) => {
    if (!data?.filename || isInferringLocationsGaiaQuadratic) return;

    setIsInferringLocationsGaiaQuadratic(true);
    setShowGAIAQuadraticConfigModal(false);

    try {
      log.user.action('gaia-quadratic-inference-start', { filename: data.filename, params }, 'ResultPage');

      const result = await api.inferLocationsGaiaQuadratic({
        filename: data.filename,
        use_branch_lengths: params.use_branch_lengths,
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
        message: `GAIA quadratic inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.${formatInferenceCpuTime(resultData.cpu_time_seconds)}\nNew file: ${resultData.new_filename}`,
        type: 'success'
      });

    } catch (error) {
      log.error('GAIA quadratic inference failed', {
        component: 'ResultPage',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename: data.filename }
      });
      const { title, message, isTimeout } = parseInferenceError(error);
      setAlertModal({
        isOpen: true,
        title,
        message: isTimeout ? TIMEOUT_MESSAGE : message,
        type: 'error',
        buttonText: isTimeout ? 'Install Locally' : undefined,
        secondaryButtonText: isTimeout ? 'Close' : undefined,
        onClose: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
          navigate('/install');
        } : undefined,
        onSecondaryAction: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
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

  // Modify the Analysis Tools section to use the new dropdown
  const handleLocationInference = async (method: LocationInferenceMethod) => {
    if (!data?.filename) return;

    switch (method.id) {
      case 'fastgaia':
        // Open configuration modal instead of running directly
        setShowFastGAIAConfigModal(true);
        break;
      case 'gaia_quadratic':
        // Open configuration modal instead of running directly
        setShowGAIAQuadraticConfigModal(true);
        break;
      case 'gaia_linear':
        // Open configuration modal instead of running directly
        setShowGAIALinearConfigModal(true);
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
            message: `sparg inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.${formatInferenceCpuTime(resultData.cpu_time_seconds)}\nNew file: ${resultData.new_filename}`,
            type: 'success'
          });
        } catch (error) {
          log.error('sparg inference failed', {
            component: 'ResultPage',
            error: error instanceof Error ? error : new Error(String(error)),
            data: { filename: data.filename }
          });
          const { title, message, isTimeout } = parseInferenceError(error);
          setAlertModal({
            isOpen: true,
            title,
            message: isTimeout ? TIMEOUT_MESSAGE : message,
            type: 'error',
            buttonText: isTimeout ? 'Install Locally' : undefined,
            secondaryButtonText: isTimeout ? 'Close' : undefined,
            onClose: isTimeout ? () => {
              setAlertModal({ ...alertModal, isOpen: false });
              navigate('/install');
            } : undefined,
            onSecondaryAction: isTimeout ? () => {
              setAlertModal({ ...alertModal, isOpen: false });
            } : undefined
          });
        } finally {
          setIsInferringLocationsSparg(false);
        }
        break;
      case 'midpoint':
        // Open configuration modal instead of running directly
        setShowMidpointConfigModal(true);
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

  // Handle GAIA Linear inference with configuration
  const handleGAIALinearInference = async (params: {
    use_branch_lengths: boolean;
  }) => {
    if (!data?.filename || isInferringLocationsGaiaLinear) return;

    setIsInferringLocationsGaiaLinear(true);
    setShowGAIALinearConfigModal(false);

    try {
      log.user.action('gaia-linear-inference-start', { filename: data.filename, params }, 'ResultPage');

      const result = await api.inferLocationsGaiaLinear({
        filename: data.filename,
        use_branch_lengths: params.use_branch_lengths,
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
        message: `GAIA linear inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.${formatInferenceCpuTime(resultData.cpu_time_seconds)}\nNew file: ${resultData.new_filename}`,
        type: 'success'
      });
    } catch (error) {
      log.error('GAIA linear inference failed', {
        component: 'ResultPage',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename: data.filename }
      });
      const { title, message, isTimeout } = parseInferenceError(error);
      setAlertModal({
        isOpen: true,
        title,
        message: isTimeout ? TIMEOUT_MESSAGE : message,
        type: 'error',
        buttonText: isTimeout ? 'Install Locally' : undefined,
        secondaryButtonText: isTimeout ? 'Close' : undefined,
        onClose: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
          navigate('/install');
        } : undefined,
        onSecondaryAction: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
        } : undefined
      });
    } finally {
      setIsInferringLocationsGaiaLinear(false);
    }
  };

  // Handle midpoint inference with configuration
  const handleMidpointInference = async (params: {
    weight_by_span: boolean;
    weight_branch_length: boolean;
  }) => {
    if (!data?.filename || isInferringLocationsMidpoint) return;
    
    setIsInferringLocationsMidpoint(true);
    setShowMidpointConfigModal(false);
    
    try {
      log.user.action('midpoint-inference-start', { filename: data.filename, params }, 'ResultPage');

      const result = await api.inferLocationsMidpoint({
        filename: data.filename,
        weight_by_span: params.weight_by_span,
        weight_branch_length: params.weight_branch_length,
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
        message: `Midpoint inference completed successfully!\nInferred locations for ${resultData.num_inferred_locations} nodes.${formatInferenceCpuTime(resultData.cpu_time_seconds)}\nNew file: ${resultData.new_filename}`,
        type: 'success'
      });
    } catch (error) {
      log.error('Midpoint inference failed', {
        component: 'ResultPage',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename: data.filename }
      });
      const { title, message, isTimeout } = parseInferenceError(error);
      setAlertModal({
        isOpen: true,
        title,
        message: isTimeout ? TIMEOUT_MESSAGE : message,
        type: 'error',
        buttonText: isTimeout ? 'Install Locally' : undefined,
        secondaryButtonText: isTimeout ? 'Close' : undefined,
        onClose: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
          navigate('/install');
        } : undefined,
        onSecondaryAction: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
        } : undefined
      });
    } finally {
      setIsInferringLocationsMidpoint(false);
    }
  };

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
      const preprocessingInfo = resultData.preprocessing?.enabled
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
        message: `tsdate inference completed successfully!${preprocessingInfo}\nInferred times for ${resultData.num_inferred_times} nodes.${formatInferenceCpuTime(resultData.cpu_time_seconds)}\nNew file: ${resultData.new_filename}`,
        type: 'success'
      });

    } catch (error) {
      log.error('tsdate inference failed', {
        component: 'ResultPage',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename: data.filename }
      });
      const { title, message, isTimeout } = parseInferenceError(error);
      setAlertModal({
        isOpen: true,
        title,
        message: isTimeout ? TIMEOUT_MESSAGE : message,
        type: 'error',
        buttonText: isTimeout ? 'Install Locally' : undefined,
        secondaryButtonText: isTimeout ? 'Close' : undefined,
        onClose: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
          navigate('/install');
        } : undefined,
        onSecondaryAction: isTimeout ? () => {
          setAlertModal({ ...alertModal, isOpen: false });
        } : undefined
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
        numSamples: params.random_sample_count 
          ? `random: ${params.random_sample_count}` 
          : params.samples?.length || 'all',
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
      <div className="h-screen flex flex-col items-center justify-center" style={pageStyle}>
        <h1 className="text-3xl font-bold mb-4" style={{ color: colors.text }}>No data loaded</h1>
        <button 
          className="font-bold py-2 px-6 rounded-lg mt-4"
          style={{ 
            backgroundColor: colors.accentPrimary,
            color: colors.buttonText 
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.accentSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.accentPrimary;
          }}
          onClick={handleBackNavigation}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={pageStyle}>
      <ParticleBackground />
      <div className="min-h-screen flex flex-col" style={{ color: colors.text }}>
        <Navbar />
        <div className="flex-grow px-4 pt-20 pb-24">
          {/* Header with logo and back button */}
          <div className="max-w-7xl mx-auto mb-4">
            <div className="mb-4">
              <span className="text-xs uppercase tracking-wider font-medium mb-1 block" style={{ color: colors.textSecondary }}>Active Tree Sequence</span>
              <div className="relative group">
                <p
                  className="text-lg font-mono mb-2 cursor-default"
                  style={{ color: colors.text }}
                >
                  {data.filename.length > 40
                    ? `${data.filename.slice(0, 18)}...${data.filename.slice(-18)}`
                    : data.filename}
                </p>
                {data.filename.length > 40 && (
                  <GroupTooltip content={data.filename} preferredPlacement="bottom" wide />
                )}
              </div>

              {/* Basic Statistics - Always Visible */}
              <div className="rounded-xl p-3 mt-2 inline-flex" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Statistics - Compact inline */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: colors.textSecondary }}>Samples:</span>
                      <span className="font-mono font-bold" style={{ color: colors.accentPrimary }}>{data.num_samples.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: colors.textSecondary }}>Nodes:</span>
                      <span className="font-mono font-bold" style={{ color: colors.accentPrimary }}>{data.num_nodes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: colors.textSecondary }}>Edges:</span>
                      <span className="font-mono font-bold" style={{ color: colors.accentPrimary }}>{data.num_edges.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: colors.textSecondary }}>Trees:</span>
                      <span className="font-mono font-bold" style={{ color: colors.accentPrimary }}>{data.num_trees.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: colors.textSecondary }}>Mutations:</span>
                      <span className="font-mono font-bold" style={{ color: colors.accentPrimary }}>{(data.num_mutations ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Data Attributes - Status Pills */}
                  <div className="flex flex-wrap gap-1.5 border-l pl-3" style={{ borderColor: colors.border }}>
                    <div className="relative group">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide cursor-default"
                        style={{
                          backgroundColor: data.has_temporal ? `${colors.accentPrimary}15` : `${colors.textSecondary}10`,
                          color: data.has_temporal ? colors.accentPrimary : colors.textSecondary
                        }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${data.has_temporal ? 'bg-current' : ''}`} style={{ backgroundColor: data.has_temporal ? undefined : colors.textSecondary, opacity: data.has_temporal ? 1 : 0.4 }} />
                        Temporal
                      </span>
                      <GroupTooltip content={data.has_temporal ? "Node ages available for temporal analysis" : "Node ages missing - use tsdate to infer"} preferredPlacement="bottom" />
                    </div>
                    <div className="relative group">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide cursor-default"
                        style={{
                          backgroundColor: data.has_sample_spatial ? `${colors.accentPrimary}15` : `${colors.textSecondary}10`,
                          color: data.has_sample_spatial ? colors.accentPrimary : colors.textSecondary
                        }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${data.has_sample_spatial ? 'bg-current' : ''}`} style={{ backgroundColor: data.has_sample_spatial ? undefined : colors.textSecondary, opacity: data.has_sample_spatial ? 1 : 0.4 }} />
                        Samples
                      </span>
                      <GroupTooltip content={data.has_sample_spatial ? "Sample spatial coordinates available" : "Sample coordinates missing"} preferredPlacement="bottom" />
                    </div>
                    <div className="relative group">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide cursor-default"
                        style={{
                          backgroundColor: data.has_all_spatial ? `${colors.accentPrimary}15` : `${colors.textSecondary}10`,
                          color: data.has_all_spatial ? colors.accentPrimary : colors.textSecondary
                        }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${data.has_all_spatial ? 'bg-current' : ''}`} style={{ backgroundColor: data.has_all_spatial ? undefined : colors.textSecondary, opacity: data.has_all_spatial ? 1 : 0.4 }} />
                        All Spatial
                      </span>
                      <GroupTooltip content={data.has_all_spatial ? "All node coordinates inferred" : "Not all nodes have spatial data - use inference"} preferredPlacement="bottom" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="max-w-7xl mx-auto">
            <div className="rounded-2xl shadow-xl overflow-visible" style={{ ...glassPanelStyle, borderColor: colors.border }}>
              <div className="p-5 space-y-4">
                {/* Quick Actions Bar */}
                <div className="flex justify-between items-center gap-3 flex-wrap">
                  <div className="relative group">
                    <LiquidButton
                      variant="secondary"
                      onClick={() => setShowTreeSequenceSelector(!showTreeSequenceSelector)}
                      className="font-bold flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      {showTreeSequenceSelector ? 'Cancel' : 'Switch File'}
                    </LiquidButton>
                    <GroupTooltip
                      content="Load a different tree sequence file from your current session."
                      preferredPlacement="bottom"
                    />
                  </div>
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

                {/* Large Tree Sequence Warning - Edge-based thresholds */}
                {data.num_edges >= 1000 && (
                  <div
                    className="rounded-xl p-4 border"
                    style={{
                      backgroundColor: data.num_edges >= 3000 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                      borderColor: data.num_edges >= 3000 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: data.num_edges >= 3000 ? '#ef4444' : '#ea580c' }}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2" style={{ color: data.num_edges >= 3000 ? '#ef4444' : '#ea580c' }}>
                          {data.num_edges >= 3000 ? 'High Complexity Warning' : 'Performance Notice'}
                        </h4>
                        <div className="text-sm space-y-1.5" style={{ color: colors.text }}>
                          <p>
                            <strong>Edges:</strong> {data.num_edges.toLocaleString()} edges detected.
                            {data.num_edges >= 3000
                              ? ' Consider filtering by genomic region or enabling node clustering.'
                              : ' Performance may vary depending on browser.'}
                          </p>
                          <p>
                            <strong>2D Viz:</strong> Optimal for &lt;1K edges; 1-3K moderate; &gt;3K may cause delays.
                          </p>
                          <p>
                            <strong>3D Viz:</strong> Better suited for larger datasets with heatmap mode.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit & Analyze Combined Section */}
                <CollapsibleSection
                  title="Edit & Analyze"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  defaultOpen={false}
                >
                  {/* Population Genetics Statistics */}
                  {data.statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {/* Diversity Statistics */}
                      <div className="rounded-lg p-3" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
                        <h5 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.accentPrimary, fontWeight: 600 }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                          Diversity
                        </h5>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>Nucleotide diversity (π):</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.nucleotide_diversity !== null && data.statistics.nucleotide_diversity !== undefined
                                ? data.statistics.nucleotide_diversity.toExponential(3)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>Watterson's θ:</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.wattersons_theta !== null && data.statistics.wattersons_theta !== undefined
                                ? data.statistics.wattersons_theta.toExponential(3)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>Tajima's D:</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.tajimas_d !== null && data.statistics.tajimas_d !== undefined
                                ? data.statistics.tajimas_d.toFixed(3)
                                : 'N/A'}
                            </span>
                          </div>
                          {data.statistics.segregating_sites !== null && data.statistics.segregating_sites !== undefined && (
                            <div className="flex justify-between">
                              <span style={{ color: colors.textSecondary }}>Segregating sites:</span>
                              <span className="font-mono" style={{ color: colors.text }}>{data.statistics.segregating_sites.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tree Topology Statistics */}
                      <div className="rounded-lg p-3" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
                        <h5 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.accentPrimary, fontWeight: 600 }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Topology
                        </h5>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>Mean tree height:</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.mean_tree_height !== null && data.statistics.mean_tree_height !== undefined
                                ? data.statistics.mean_tree_height.toFixed(2)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>Median tree height:</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.median_tree_height !== null && data.statistics.median_tree_height !== undefined
                                ? data.statistics.median_tree_height.toFixed(2)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>Mean tree length:</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.mean_tree_length !== null && data.statistics.mean_tree_length !== undefined
                                ? data.statistics.mean_tree_length.toFixed(2)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>Median tree length:</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.median_tree_length !== null && data.statistics.median_tree_length !== undefined
                                ? data.statistics.median_tree_length.toFixed(2)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>TMRCA:</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.tmrca !== null && data.statistics.tmrca !== undefined
                                ? data.statistics.tmrca.toFixed(2)
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Demographic & Recombination Statistics */}
                      <div className="rounded-lg p-3" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
                        <h5 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.accentPrimary, fontWeight: 600 }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Demographics
                        </h5>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>Ne (Watterson):</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.ne_watterson !== null && data.statistics.ne_watterson !== undefined
                                ? data.statistics.ne_watterson.toExponential(2)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>Ne (π):</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.ne_pi !== null && data.statistics.ne_pi !== undefined
                                ? data.statistics.ne_pi.toExponential(2)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: colors.textSecondary }}>Est. recomb. rate:</span>
                            <span className="font-mono" style={{ color: colors.text }}>
                              {data.statistics.estimated_recombination_rate !== null && data.statistics.estimated_recombination_rate !== undefined
                                ? data.statistics.estimated_recombination_rate.toExponential(3)
                                : 'N/A'}
                            </span>
                          </div>
                          {data.statistics.mean_ld_r2 !== null && data.statistics.mean_ld_r2 !== undefined && (
                            <>
                              <div className="flex justify-between">
                                <span style={{ color: colors.textSecondary }}>Mean LD (r²):</span>
                                <span className="font-mono" style={{ color: colors.text }}>{data.statistics.mean_ld_r2.toFixed(4)}</span>
                              </div>
                              {data.statistics.median_ld_r2 !== null && data.statistics.median_ld_r2 !== undefined && (
                                <div className="flex justify-between">
                                  <span style={{ color: colors.textSecondary }}>Median LD (r²):</span>
                                  <span className="font-mono" style={{ color: colors.text }}>{data.statistics.median_ld_r2.toFixed(4)}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Population Structure Statistics */}
                      {(data.statistics?.fst !== null && data.statistics?.fst !== undefined) || 
                       (data.statistics?.mean_divergence !== null && data.statistics?.mean_divergence !== undefined) ? (
                        <div className="rounded-lg p-3" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
                          <h5 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.accentPrimary, fontWeight: 600 }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Structure
                          </h5>
                          <div className="space-y-1.5 text-xs">
                            {data.statistics?.num_populations !== null && data.statistics?.num_populations !== undefined && data.statistics.num_populations > 0 && (
                              <div className="flex justify-between">
                                <span style={{ color: colors.textSecondary }}>Populations:</span>
                                <span className="font-mono" style={{ color: colors.text }}>{data.statistics.num_populations}</span>
                              </div>
                            )}
                            {data.statistics?.fst !== null && data.statistics?.fst !== undefined && (
                              <div className="flex justify-between">
                                <span style={{ color: colors.textSecondary }}>Fst:</span>
                                <span className="font-mono" style={{ color: colors.text }} title="Fixation index: measures population differentiation (0=no differentiation, 1=complete differentiation)">
                                  {data.statistics.fst.toFixed(4)}
                                </span>
                              </div>
                            )}
                            {data.statistics?.mean_divergence !== null && data.statistics?.mean_divergence !== undefined && (
                              <>
                                <div className="flex justify-between">
                                  <span style={{ color: colors.textSecondary }}>Mean divergence:</span>
                                  <span className="font-mono" style={{ color: colors.text }}>
                                    {data.statistics.mean_divergence.toExponential(3)}
                                  </span>
                                </div>
                                {data.statistics?.median_divergence !== null && data.statistics?.median_divergence !== undefined && (
                                  <div className="flex justify-between">
                                    <span style={{ color: colors.textSecondary }}>Median divergence:</span>
                                    <span className="font-mono" style={{ color: colors.text }}>
                                      {data.statistics.median_divergence.toExponential(3)}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Action Buttons in 3 Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Simplify Button */}
                    <div className="relative group">
                      <button
                        onClick={() => setShowAdvancedSubsettingModal(true)}
                        disabled={isSimplifying}
                        className={`font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 w-full justify-center ${
                          isSimplifying ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-md'
                        }`}
                        style={{
                          backgroundColor: colors.containerBackground,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => !isSimplifying && (e.currentTarget.style.backgroundColor = colors.accentPrimary, e.currentTarget.style.color = colors.buttonText)}
                        onMouseLeave={(e) => !isSimplifying && (e.currentTarget.style.backgroundColor = colors.containerBackground, e.currentTarget.style.color = colors.text)}
                      >
                        {isSimplifying && (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: colors.accentPrimary, borderTopColor: 'transparent' }}></div>
                        )}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        {isSimplifying ? 'Simplifying...' : 'Simplify'}
                      </button>
                      <GroupTooltip 
                        content="Reduce file size by retaining only selected samples. Supports multiple selection methods and advanced tskit simplify options."
                        preferredPlacement="bottom"
                      />
                    </div>

                    {/* Infer Ages Button */}
                    <div className="relative group">
                      <button
                        className={`font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 w-full ${
                          !hasMutations ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-md'
                        }`}
                        style={{
                          backgroundColor: colors.containerBackground,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => hasMutations && !isInferringTimes && (e.currentTarget.style.backgroundColor = colors.accentPrimary, e.currentTarget.style.color = colors.buttonText)}
                        onMouseLeave={(e) => hasMutations && !isInferringTimes && (e.currentTarget.style.backgroundColor = colors.containerBackground, e.currentTarget.style.color = colors.text)}
                        disabled={!hasMutations || isInferringTimes}
                        onClick={() => setShowMutationRateModal(true)}
                        title={!hasMutations ? "Requires mutations" : ""}
                      >
                        {isInferringTimes && (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: colors.accentPrimary, borderTopColor: 'transparent' }}></div>
                        )}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {isInferringTimes ? 'Inferring...' : 'Infer ages'}
                      </button>
                      <GroupTooltip 
                        content={!hasMutations 
                          ? "Requires mutations to infer node ages." 
                          : "Estimate ancestral node ages using tsdate's Bayesian inference based on mutation patterns and coalescent models."}
                        preferredPlacement="bottom"
                      />
                    </div>

                    {/* Location Inference Dropdown */}
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
                </CollapsibleSection>

                {/* Visualization Section - Combined Settings and Launch */}
                <CollapsibleSection
                  title="Visualize"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  }
                  defaultOpen={true}
                >

                  {/* Launch Buttons */}
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: colors.text, fontWeight: 500 }}>
                    Launch Visualization
                    <Tooltip content="Choose visualization mode: 2D ARG (interactive force-directed graph), 3D Spatial (geographic ancestry map), or Spatial Diff (compare two tree sequences)." />
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative group">
                    <button
                      className={`py-3.5 px-4 rounded-xl transition-all duration-200 transform flex flex-col items-center gap-1.5 w-full ${
                        !visualizeArgEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: colors.containerBackground,
                        color: colors.text,
                        border: `1px solid ${colors.border}`
                      }}
                      onMouseEnter={(e) => {
                        if (visualizeArgEnabled) {
                          e.currentTarget.style.borderColor = colors.accentPrimary;
                          e.currentTarget.style.backgroundColor = `${colors.accentPrimary}08`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (visualizeArgEnabled) {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.backgroundColor = colors.containerBackground;
                        }
                      }}
                      disabled={!visualizeArgEnabled}
                      onClick={() => openWizard('2d')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.accentPrimary }}>
                        <circle cx="12" cy="5" r="2" strokeWidth={2} />
                        <circle cx="6" cy="15" r="2" strokeWidth={2} />
                        <circle cx="18" cy="15" r="2" strokeWidth={2} />
                        <line x1="12" y1="7" x2="6" y2="13" strokeWidth={2} strokeLinecap="round" />
                        <line x1="12" y1="7" x2="18" y2="13" strokeWidth={2} strokeLinecap="round" />
                      </svg>
                      <div className="text-center">
                        <span className="text-sm font-semibold">2D ARG</span>
                      </div>
                    </button>
                    <GroupTooltip
                      content="Interactive force-directed graph visualization. Shows nodes, edges, and recombination events across the genome. Best for exploring ARG structure and relationships."
                      preferredPlacement="bottom"
                    />
                  </div>
                  <div className="relative group">
                    <button
                      className={`py-3.5 px-4 rounded-xl transition-all duration-200 transform flex flex-col items-center gap-1.5 w-full ${
                        !visualizeSpatialArgEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: colors.containerBackground,
                        color: colors.text,
                        border: `1px solid ${colors.border}`
                      }}
                      onMouseEnter={(e) => {
                        if (visualizeSpatialArgEnabled) {
                          e.currentTarget.style.borderColor = colors.accentPrimary;
                          e.currentTarget.style.backgroundColor = `${colors.accentPrimary}08`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (visualizeSpatialArgEnabled) {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.backgroundColor = colors.containerBackground;
                        }
                      }}
                      disabled={!visualizeSpatialArgEnabled}
                      onClick={() => openWizard('3d')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.accentPrimary }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-center">
                        <span className="text-sm font-semibold">3D Spatial</span>
                      </div>
                    </button>
                    <GroupTooltip
                      content="3D visualization with geographic coordinates and temporal depth. Maps ancestral locations through time. Requires temporal and spatial data."
                      preferredPlacement="bottom"
                    />
                  </div>
                  <div className="relative group">
                    <button
                      className={`py-3.5 px-4 rounded-xl transition-all duration-200 transform flex flex-col items-center gap-1.5 w-full ${
                        !visualizeSpatialDiffEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: colors.containerBackground,
                        color: colors.text,
                        border: `1px solid ${colors.border}`
                      }}
                      onMouseEnter={(e) => {
                        if (visualizeSpatialDiffEnabled) {
                          e.currentTarget.style.borderColor = colors.accentPrimary;
                          e.currentTarget.style.backgroundColor = `${colors.accentPrimary}08`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (visualizeSpatialDiffEnabled) {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.backgroundColor = colors.containerBackground;
                        }
                      }}
                      disabled={!visualizeSpatialDiffEnabled}
                      onClick={() => openWizard('diff')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.accentPrimary }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <div className="text-center">
                        <span className="text-sm font-semibold">Spatial Diff</span>
                      </div>
                    </button>
                    <GroupTooltip
                      content="Compare spatial coordinates between two tree sequences. Visualizes differences in inferred locations. Useful for evaluating inference methods."
                      preferredPlacement="bottom"
                    />
                  </div>
                  </div>

                  {/* Advanced Settings - Nested CollapsibleSection */}
                  <div className="mt-4">
                  <CollapsibleSection
                    title="Advanced Settings"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                    defaultOpen={false}
                    onOpen={() => setHasInteractedWithAdvancedSettings(true)}
                  >
                    <p className="text-xs mb-6" style={{ color: colors.textSecondary }}>
                      Configure detailed visualization settings. The wizard will guide you through common options.
                    </p>

                  {/* Data Selection Group */}
                  <div className="space-y-3 mb-6">
                    <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                      Data Selection
                    </h5>

                    {/* Sample Selection */}
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${colors.containerBackground}`, border: `1px solid ${colors.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        <h4 className="font-medium text-sm" style={{ color: colors.text, fontWeight: 500 }}>
                          Sample Selection
                        </h4>
                        <Tooltip content="Choose how to select samples for visualization. Different modes offer various selection strategies." />
                      <select
                        value={sampleSubsetMode}
                        onChange={(e) => {
                          const newMode = e.target.value as typeof sampleSubsetMode;
                          setSampleSubsetMode(newMode);
                          // Clear node focus when using sample subsetting (modes other than 'even')
                          if (newMode !== 'even') {
                            setFocusMode('none');
                            setFocusNodeId(null);
                            setFocusNodeInput('');
                            setFocusNodeError(null);
                          }
                          // Reset mode-specific state when switching
                          if (newMode !== 'ids') {
                            setSampleIds([]);
                            setSampleIdsInput('');
                            setSampleIdsError(null);
                          }
                          if (newMode !== 'range') {
                            setSampleRange(null);
                            setSampleRangeStartInput('');
                            setSampleRangeEndInput('');
                          }
                          if (newMode !== 'random') {
                            setRandomSeed(null);
                            setRandomSeedInput('');
                          }
                          if (newMode !== 'population') {
                            setSelectedPopulations([]);
                          }
                        }}
                        className="rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 ml-auto"
                        style={{
                          backgroundColor: colors.containerBackground,
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                        }}
                      >
                        <option value="range">By Range</option>
                        <option value="even">Even Distribution</option>
                        <option value="random">Random</option>
                        <option value="ids">By IDs</option>
                        {(data?.statistics?.num_populations ?? 0) > 1 && (
                          <option value="population">By Population</option>
                        )}
                      </select>
                      <span className="text-xs font-normal" style={{ color: colors.textSecondary }}>
                        Total: {totalSamples?.toLocaleString() || '?'}
                      </span>
                    </div>

                    {/* Even Distribution / Random Mode */}
                    {(sampleSubsetMode === 'even' || sampleSubsetMode === 'random') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            # Samples:
                          </span>
                          <input
                            type="number"
                            min={2}
                            max={totalSamples || SAMPLE_LIMITS.DEFAULT_MAX_SAMPLES}
                            value={maxSamples}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 2) {
                                setMaxSamples(Math.min(value, totalSamples || SAMPLE_LIMITS.DEFAULT_MAX_SAMPLES));
                              }
                            }}
                            className="w-24 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: colors.containerBackground,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                            }}
                          />
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            {sampleSubsetMode === 'even' ? '(evenly spaced)' : '(randomly selected)'}
                          </span>
                        </div>
                        {/* Random seed input for random mode */}
                        {sampleSubsetMode === 'random' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: colors.textSecondary }}>Seed (optional):</span>
                            <input
                              type="number"
                              value={randomSeedInput}
                              onChange={(e) => {
                                setRandomSeedInput(e.target.value);
                                const value = parseInt(e.target.value);
                                setRandomSeed(isNaN(value) ? null : value);
                              }}
                              placeholder="Leave empty for random"
                              className="w-32 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2"
                              style={{
                                backgroundColor: colors.containerBackground,
                                border: `1px solid ${colors.border}`,
                                color: colors.text,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* By IDs Mode */}
                    {sampleSubsetMode === 'ids' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            Enter sample IDs (comma-separated)
                          </span>
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            Valid range: 0-{(totalSamples || 1) - 1}
                          </span>
                        </div>
                        <textarea
                          value={sampleIdsInput}
                          onChange={(e) => setSampleIdsInput(e.target.value)}
                          onBlur={() => {
                            // Parse and validate IDs on blur
                            const input = sampleIdsInput.trim();
                            if (!input) {
                              setSampleIds([]);
                              setSampleIdsError(null);
                              return;
                            }
                            try {
                              const ids = input.split(',').map(s => {
                                const num = parseInt(s.trim());
                                if (isNaN(num)) throw new Error(`Invalid ID: ${s.trim()}`);
                                if (num < 0 || num >= (totalSamples || 0)) {
                                  throw new Error(`ID ${num} out of range`);
                                }
                                return num;
                              });
                              const uniqueIds = [...new Set(ids)];
                              setSampleIds(uniqueIds);
                              setSampleIdsError(null);
                            } catch (err) {
                              setSampleIdsError(err instanceof Error ? err.message : 'Invalid input');
                            }
                          }}
                          placeholder="e.g., 0, 5, 10, 25, 42"
                          rows={2}
                          className="w-full rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 resize-none"
                          style={{
                            backgroundColor: colors.containerBackground,
                            border: `1px solid ${sampleIdsError ? '#ef4444' : colors.border}`,
                            color: colors.text,
                          }}
                        />
                        {sampleIdsError ? (
                          <span className="text-xs" style={{ color: '#ef4444' }}>{sampleIdsError}</span>
                        ) : sampleIds.length > 0 ? (
                          <span className="text-xs" style={{ color: colors.accentPrimary }}>
                            {sampleIds.length} valid sample{sampleIds.length !== 1 ? 's' : ''} selected
                          </span>
                        ) : null}
                      </div>
                    )}

                    {/* By Range Mode */}
                    {sampleSubsetMode === 'range' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            Select contiguous sample range
                          </span>
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            Available: 0-{(totalSamples || 1) - 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={(totalSamples || 1) - 1}
                            value={sampleRangeStartInput}
                            onChange={(e) => {
                              setSampleRangeStartInput(e.target.value);
                              const start = parseInt(e.target.value);
                              const end = sampleRange?.[1] ?? (totalSamples || 1) - 1;
                              if (!isNaN(start) && start >= 0 && start <= end) {
                                setSampleRange([start, end]);
                              }
                            }}
                            placeholder="Start"
                            className="flex-1 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: colors.containerBackground,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                            }}
                          />
                          <span className="text-xs" style={{ color: colors.textSecondary }}>to</span>
                          <input
                            type="number"
                            min={0}
                            max={(totalSamples || 1) - 1}
                            value={sampleRangeEndInput}
                            onChange={(e) => {
                              setSampleRangeEndInput(e.target.value);
                              const end = parseInt(e.target.value);
                              const start = sampleRange?.[0] ?? 0;
                              if (!isNaN(end) && end >= start && end < (totalSamples || 1)) {
                                setSampleRange([start, end]);
                              }
                            }}
                            placeholder="End"
                            className="flex-1 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: colors.containerBackground,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                            }}
                          />
                          <button
                            onClick={() => {
                              setSampleRange(null);
                              setSampleRangeStartInput('');
                              setSampleRangeEndInput('');
                            }}
                            className="rounded px-1.5 py-1 text-xs hover:opacity-80 transition-opacity flex items-center justify-center"
                            style={{
                              backgroundColor: colors.containerBackground,
                              border: `1px solid ${colors.border}`,
                              color: colors.textSecondary,
                            }}
                            title="Reset to full range"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>
                        {sampleRange && (
                          <span className="text-xs" style={{ color: colors.accentPrimary }}>
                            {sampleRange[1] - sampleRange[0] + 1} samples selected (indices {sampleRange[0]}-{sampleRange[1]})
                          </span>
                        )}
                      </div>
                    )}

                    {/* By Population Mode */}
                    {sampleSubsetMode === 'population' && (data?.statistics?.num_populations ?? 0) > 1 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            Select populations to include
                          </span>
                          <button
                            onClick={() => {
                              const allPops = Array.from({ length: data?.statistics?.num_populations || 0 }, (_, i) => i);
                              setSelectedPopulations(selectedPopulations.length === allPops.length ? [] : allPops);
                            }}
                            className="text-xs hover:underline"
                            style={{ color: colors.accentPrimary }}
                          >
                            {selectedPopulations.length === (data?.statistics?.num_populations || 0) ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {Array.from({ length: data?.statistics?.num_populations || 0 }, (_, i) => (
                            <label
                              key={i}
                              className="flex items-center gap-2 rounded px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: selectedPopulations.includes(i) ? `${colors.accentPrimary}20` : colors.containerBackground,
                                border: `1px solid ${selectedPopulations.includes(i) ? colors.accentPrimary : colors.border}`,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPopulations.includes(i)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPopulations([...selectedPopulations, i]);
                                  } else {
                                    setSelectedPopulations(selectedPopulations.filter(p => p !== i));
                                  }
                                }}
                                className="rounded"
                                style={{ accentColor: colors.accentPrimary }}
                              />
                              <span className="text-xs" style={{ color: colors.text }}>
                                Population {i}
                              </span>
                            </label>
                          ))}
                        </div>
                        {selectedPopulations.length > 0 && (
                          <span className="text-xs" style={{ color: colors.accentPrimary }}>
                            {selectedPopulations.length} population{selectedPopulations.length !== 1 ? 's' : ''} selected
                          </span>
                        )}
                        {selectedPopulations.length === 0 && (
                          <span className="text-xs" style={{ color: '#ef4444' }}>
                            Select at least one population
                          </span>
                        )}
                      </div>
                    )}
                    </div>

                    {/* Node Focus */}
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${colors.containerBackground}`, border: `1px solid ${colors.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <h4 className="font-medium text-sm" style={{ color: colors.text, fontWeight: 500 }}>
                          Node Focus
                        </h4>
                        <Tooltip content="Focus on a specific node's subgraph (descendants from a root) or ancestors (parent ARG leading to a sample). Mutually exclusive with sample subsetting." />
                      <select
                        value={focusMode}
                        onChange={(e) => {
                          const newMode = e.target.value as 'none' | 'root' | 'sample';
                          setFocusMode(newMode);
                          if (newMode === 'none') {
                            setFocusNodeId(null);
                            setFocusNodeInput('');
                            setFocusNodeError(null);
                          } else {
                            // Clear sample subsetting when using node focus
                            setSampleSubsetMode('even');
                            setSampleIds([]);
                            setSampleIdsInput('');
                            setSampleIdsError(null);
                            setSampleRange(null);
                            setSampleRangeStartInput('');
                            setSampleRangeEndInput('');
                            setSelectedPopulations([]);
                          }
                        }}
                        className="rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 ml-auto"
                        style={{
                          backgroundColor: colors.containerBackground,
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                        }}
                      >
                        <option value="none">None</option>
                        <option value="root">Root (Descendants)</option>
                        <option value="sample">Sample (Ancestors)</option>
                      </select>
                    </div>
                    {focusMode !== 'none' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            {focusMode === 'root' ? 'Root Node ID:' : 'Sample Node ID:'}
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={focusNodeInput}
                            onChange={(e) => {
                              setFocusNodeInput(e.target.value);
                              const value = parseInt(e.target.value);
                              if (e.target.value === '') {
                                setFocusNodeId(null);
                                setFocusNodeError(null);
                              } else if (isNaN(value) || value < 0) {
                                setFocusNodeId(null);
                                setFocusNodeError('Invalid node ID');
                              } else {
                                setFocusNodeId(value);
                                setFocusNodeError(null);
                              }
                            }}
                            placeholder={focusMode === 'root' ? 'Enter root node ID' : 'Enter sample node ID'}
                            className="w-32 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: colors.containerBackground,
                              border: `1px solid ${focusNodeError ? '#ef4444' : colors.border}`,
                              color: colors.text,
                            }}
                          />
                          {focusNodeId !== null && (
                            <span className="text-xs" style={{ color: colors.accentPrimary }}>
                              {focusMode === 'root' ? `Subgraph from node ${focusNodeId}` : `Ancestors of node ${focusNodeId}`}
                            </span>
                          )}
                        </div>
                        {focusNodeError && (
                          <span className="text-xs" style={{ color: '#ef4444' }}>
                            {focusNodeError}
                          </span>
                        )}
                        <span className="text-xs block" style={{ color: colors.textSecondary }}>
                          {focusMode === 'root'
                            ? 'Shows all descendants of the specified root node.'
                            : 'Shows all ancestors leading to the specified sample node.'}
                        </span>
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Range Filters Group */}
                  <div className="space-y-3 mb-6">
                    <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                      Range Filters
                    </h5>

                    {/* Time Range */}
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${colors.containerBackground}`, border: `1px solid ${colors.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="font-medium text-sm" style={{ color: colors.text, fontWeight: 500 }}>
                          Time Range
                        </h4>
                        <Tooltip content="Filter by node age. Only nodes within the specified time range are displayed, improving performance on large ARGs." />
                      <span className="text-xs font-normal ml-auto" style={{ color: colors.textSecondary }}>
                        {(() => {
                          const tempRange = getTemporalRange();
                          return data?.has_temporal ?
                            `${tempRange.min.toFixed(2)} - ${tempRange.max.toFixed(2)} units` :
                            'No temporal data';
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
                        className="flex-1 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 disabled:opacity-50"
                        style={{
                          backgroundColor: colors.containerBackground,
                          border: `1px solid ${colors.border}`,
                          color: colors.text
                        }}
                        title="Minimum time value"
                      />
                      <span className="text-xs" style={{ color: colors.textSecondary }}>to</span>
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
                        className="flex-1 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 disabled:opacity-50"
                        style={{
                          backgroundColor: colors.containerBackground,
                          border: `1px solid ${colors.border}`,
                          color: colors.text
                        }}
                        title="Maximum time value"
                      />
                      <button
                        onClick={() => {
                          setTemporalRange(null);
                          setTemporalStartInput('');
                          setTemporalEndInput('');
                        }}
                        disabled={!data?.has_temporal}
                        className="text-xs px-1.5 disabled:opacity-50 flex items-center justify-center"
                        style={{ color: colors.accentPrimary }}
                        onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        title="Reset to full range"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      </div>
                    </div>

                    {/* Genomic Range */}
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${colors.containerBackground}`, border: `1px solid ${colors.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h4 className="font-medium text-sm" style={{ color: colors.text, fontWeight: 500 }}>
                          Genomic Range
                        </h4>
                        <Tooltip content="Filter by genomic position (base pairs) or tree index to focus on specific regions. Reduces trees displayed for better performance." />
                      <select
                        value={genomicMode}
                        onChange={(e) => {
                          setGenomicMode(e.target.value as 'base_pairs' | 'tree_indices');
                          setGenomicRange(null);
                          setGenomicStartInput('');
                          setGenomicEndInput('');
                        }}
                        className="rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 ml-auto"
                        style={{
                          backgroundColor: colors.containerBackground,
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                        }}
                        title="Select measurement unit"
                      >
                        <option value="base_pairs">Base Pairs</option>
                        <option value="tree_indices">Tree Indices</option>
                      </select>
                      <span className="text-xs font-normal" style={{ color: colors.textSecondary }}>
                        {(() => {
                          if (genomicMode === 'base_pairs') {
                            const genomicRange = getGenomicRange();
                            return `${genomicRange.min.toLocaleString()} - ${genomicRange.max.toLocaleString()} bp`;
                          } else {
                            const treeRange = getTreeIndexRange();
                            return `${treeRange.min} - ${treeRange.max} trees`;
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
                        className="flex-1 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: colors.containerBackground,
                          border: `1px solid ${colors.border}`,
                          color: colors.text
                        }}
                        title={genomicMode === 'base_pairs' ? "Minimum base pair position" : "Starting tree index"}
                      />
                      <span className="text-xs" style={{ color: colors.textSecondary }}>to</span>
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
                        className="flex-1 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: colors.containerBackground,
                          border: `1px solid ${colors.border}`,
                          color: colors.text
                        }}
                        title={genomicMode === 'base_pairs' ? "Maximum base pair position" : "Ending tree index"}
                      />
                      <button
                        onClick={() => {
                          setGenomicRange(null);
                          setGenomicStartInput('');
                          setGenomicEndInput('');
                        }}
                        className="text-xs px-1.5 flex items-center justify-center"
                        style={{ color: colors.accentPrimary }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        title="Reset to full range"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      </div>
                    </div>
                  </div>

                  {/* Performance Options Group */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                      Performance Options
                    </h5>
                    <div className={`${visualizeSpatialArgEnabled ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-3'}`}>
                    {/* Enable Clustering for ARG visualization */}
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="enable-clustering"
                          checked={enableClustering}
                          onChange={(e) => setEnableClustering(e.target.checked)}
                          className="h-4 w-4 rounded"
                          style={{ accentColor: colors.accentPrimary }}
                        />
                        <label htmlFor="enable-clustering" className="text-sm font-medium cursor-pointer flex items-center gap-1.5" style={{ color: colors.text, fontWeight: 500 }}>
                          Node Clustering
                          <Tooltip 
                            content={
                              <>
                                <strong style={{ color: colors.accentPrimary }}>⚠️ Beta</strong><br/>
                                Groups dense subtrees into expandable cluster nodes. Auto-enabled for &gt;250 nodes. Click clusters to expand.<br/><br/>
                                <em style={{ color: colors.textSecondary }}>Experimental feature - may behave unexpectedly.</em>
                              </>
                            }
                          />
                        </label>
                      </div>
                    </div>

                    {/* Heatmap Mode Option for Spatial */}
                    {visualizeSpatialArgEnabled && (
                      <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.containerBackground, border: `1px solid ${colors.border}` }}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heatmap-only-mode"
                            checked={heatmapOnlyMode}
                            onChange={(e) => setHeatmapOnlyMode(e.target.checked)}
                            className="h-4 w-4 rounded"
                            style={{ accentColor: colors.accentPrimary }}
                          />
                          <label htmlFor="heatmap-only-mode" className="text-sm font-medium cursor-pointer flex items-center gap-1.5" style={{ color: colors.text, fontWeight: 500 }}>
                            Heatmap-Only Mode
                            <Tooltip content="Load spatial view with only heatmap visible (nodes/edges hidden). Improves performance on large ARGs. Toggle nodes/edges later via sidebar." />
                          </label>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                  </CollapsibleSection>
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

          {/* Midpoint Configuration Modal */}
          <MidpointConfigModal
            isOpen={showMidpointConfigModal}
            onClose={() => setShowMidpointConfigModal(false)}
            onConfirm={handleMidpointInference}
          />

          {/* GAIA Quadratic Configuration Modal */}
          <GAIAQuadraticConfigModal
            isOpen={showGAIAQuadraticConfigModal}
            onClose={() => setShowGAIAQuadraticConfigModal(false)}
            onConfirm={handleGaiaQuadraticInference}
          />

          {/* GAIA Linear Configuration Modal */}
          <GAIALinearConfigModal
            isOpen={showGAIALinearConfigModal}
            onClose={() => setShowGAIALinearConfigModal(false)}
            onConfirm={handleGAIALinearInference}
          />

          {/* FastGAIA Configuration Modal */}
          <FastGAIAConfigModal
            isOpen={showFastGAIAConfigModal}
            onClose={() => setShowFastGAIAConfigModal(false)}
            onConfirm={handleFastGAIAInference}
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
            secondaryButtonText={alertModal.secondaryButtonText}
            onSecondaryAction={alertModal.onSecondaryAction}
          />

          {/* Visualization Wizard */}
          {data && wizardVisualizationType && (
            <VisualizationWizard
              isOpen={showVisualizationWizard}
              onClose={() => {
                setShowVisualizationWizard(false);
                setWizardVisualizationType(null);
              }}
              onLaunch={handleWizardLaunch}
              onSettingsChange={syncWizardSettingsToAdvancedSettings}
              showSummaryOnly={hasPreConfig}
              vizType={wizardVisualizationType}
              stats={getTreeSequenceStats()}
              preConfigured={buildWizardPreConfigured()}
            />
          )}
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
        <SpatialDiffTreeSequenceSelectorModal
          isOpen={showSecondTreeSequenceSelector}
          onClose={() => setShowSecondTreeSequenceSelector(false)}
          onSelect={handleSecondTreeSequenceSelect}
        />
      )}
      <Footer />
    </div>
  );
} 
