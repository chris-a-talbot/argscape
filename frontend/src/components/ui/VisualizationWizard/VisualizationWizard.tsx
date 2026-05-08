import React, { useEffect, useMemo, useRef } from 'react';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { WizardStep, OptionCard, CheckboxOption, SliderInput } from './WizardStep';
import { WizardSummary } from './WizardSummary';
import { useWizardState, PreConfiguredSettings } from './useWizardState';
import {
  VisualizationType,
  TreeSequenceStats,
  WizardSettings,
  WIZARD_THRESHOLDS,
} from './wizardConfig';

interface VisualizationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (settings: WizardSettings) => void;
  onSettingsChange?: (settings: WizardSettings) => void;
  showSummaryOnly: boolean;
  vizType: VisualizationType;
  stats: TreeSequenceStats;
  preConfigured: PreConfiguredSettings | null;
}

export function VisualizationWizard({
  isOpen,
  onClose,
  onLaunch,
  onSettingsChange,
  showSummaryOnly,
  vizType,
  stats,
  preConfigured,
}: VisualizationWizardProps) {
  const { colors } = useColorTheme();
  const { modalGlassStyle, modalOverlayStyle } = useThemeStyles();
  const hasSkippedInitialSyncRef = useRef(false);

  const wizardState = useWizardState(vizType, stats, preConfigured, showSummaryOnly);

  // ESC key handling
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Viz type labels
  const vizTypeLabels: Record<VisualizationType, { title: string; icon: React.ReactNode }> = {
    '2d': {
      title: '2D ARG',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" strokeWidth={2} />
          <circle cx="6" cy="15" r="2" strokeWidth={2} />
          <circle cx="18" cy="15" r="2" strokeWidth={2} />
          <line x1="12" y1="7" x2="6" y2="13" strokeWidth={2} strokeLinecap="round" />
          <line x1="12" y1="7" x2="18" y2="13" strokeWidth={2} strokeLinecap="round" />
        </svg>
      ),
    },
    '3d': {
      title: '3D Spatial',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    'diff': {
      title: 'Spatial Diff',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  };

  // Suggestions based on data size (edge-based for performance)
  const scopeSuggestion = useMemo(() => {
    if (stats.numEdges > WIZARD_THRESHOLDS.EDGE_MODERATE_PERFORMANCE) {
      return {
        type: 'warning' as const,
        message: `Your ARG has ${stats.numEdges.toLocaleString()} edges. We strongly recommend using a sample subset or enabling clustering for better performance.`,
      };
    }
    if (stats.numEdges > WIZARD_THRESHOLDS.EDGE_GOOD_PERFORMANCE) {
      return {
        type: 'recommendation' as const,
        message: `With ${stats.numEdges.toLocaleString()} edges, consider subsetting samples or filtering by region for smoother performance.`,
      };
    }
    if (stats.numSamples > WIZARD_THRESHOLDS.LARGE_SAMPLE_COUNT) {
      return {
        type: 'recommendation' as const,
        message: `With ${stats.numSamples.toLocaleString()} samples, subsetting to ${WIZARD_THRESHOLDS.RECOMMENDED_MAX_SAMPLES} samples is recommended.`,
      };
    }
    return undefined;
  }, [stats]);

  const regionSuggestion = useMemo(() => {
    if (stats.numTrees > WIZARD_THRESHOLDS.TREE_FILTER_RECOMMENDED) {
      return {
        type: 'info' as const,
        message: `Your sequence has ${stats.numTrees.toLocaleString()} trees. Filtering to a region can improve responsiveness.`,
      };
    }
    return undefined;
  }, [stats]);

  const performanceSuggestion = useMemo(() => {
    if (wizardState.complexity.level === 'poor') {
      return {
        type: 'warning' as const,
        message: 'The current settings will produce a large visualization. Consider enabling optimizations.',
      };
    }
    if (wizardState.complexity.estimatedNodes > WIZARD_THRESHOLDS.CLUSTERING_RECOMMENDED) {
      return {
        type: 'recommendation' as const,
        message: `With ~${wizardState.complexity.estimatedNodes.toLocaleString()} estimated nodes, clustering is recommended.`,
      };
    }
    return undefined;
  }, [wizardState.complexity]);

  useEffect(() => {
    if (!isOpen || !onSettingsChange) return;
    if (!hasSkippedInitialSyncRef.current) {
      hasSkippedInitialSyncRef.current = true;
      return;
    }
    onSettingsChange(wizardState.settings);
  }, [isOpen, onSettingsChange, wizardState.settings]);

  useEffect(() => {
    if (isOpen) return;
    hasSkippedInitialSyncRef.current = false;
  }, [isOpen]);

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (wizardState.currentStep) {
      case 'scope':
        return (
          <WizardStep
            title="Data Scope"
            description="Choose how much of the ARG to visualize"
            suggestion={scopeSuggestion}
          >
            <div className="space-y-3">
              {/* Full ARG Option */}
              <OptionCard
                selected={wizardState.settings.dataScope === 'full'}
                onClick={() => wizardState.setDataScope('full')}
                title="Full ARG"
                description={`Visualize all ${stats.numSamples.toLocaleString()} samples`}
                recommended={stats.numNodes <= WIZARD_THRESHOLDS.CLUSTERING_RECOMMENDED}
              />

              {/* Sample Subset Option */}
              <OptionCard
                selected={wizardState.settings.dataScope === 'subset'}
                onClick={() => wizardState.setDataScope('subset')}
                title="Sample Subset"
                description="Select a portion of samples for faster rendering"
                recommended={stats.numSamples > WIZARD_THRESHOLDS.LARGE_SAMPLE_COUNT}
              >
                <div className="space-y-4">
                  {/* Subset Method Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => wizardState.setSubsetMethod('even')}
                      className="py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: wizardState.settings.subsetMethod === 'even'
                          ? colors.accentPrimary
                          : colors.containerBackground,
                        color: wizardState.settings.subsetMethod === 'even'
                          ? colors.buttonText
                          : colors.text,
                        border: `1px solid ${wizardState.settings.subsetMethod === 'even' ? colors.accentPrimary : colors.border}`,
                      }}
                    >
                      Even
                    </button>
                    <button
                      type="button"
                      onClick={() => wizardState.setSubsetMethod('random')}
                      className="py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: wizardState.settings.subsetMethod === 'random'
                          ? colors.accentPrimary
                          : colors.containerBackground,
                        color: wizardState.settings.subsetMethod === 'random'
                          ? colors.buttonText
                          : colors.text,
                        border: `1px solid ${wizardState.settings.subsetMethod === 'random' ? colors.accentPrimary : colors.border}`,
                      }}
                    >
                      Random
                    </button>
                    <button
                      type="button"
                      onClick={() => wizardState.setSubsetMethod('range')}
                      className="py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: wizardState.settings.subsetMethod === 'range'
                          ? colors.accentPrimary
                          : colors.containerBackground,
                        color: wizardState.settings.subsetMethod === 'range'
                          ? colors.buttonText
                          : colors.text,
                        border: `1px solid ${wizardState.settings.subsetMethod === 'range' ? colors.accentPrimary : colors.border}`,
                      }}
                    >
                      Range
                    </button>
                    <button
                      type="button"
                      onClick={() => wizardState.setSubsetMethod('specific')}
                      className="py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: wizardState.settings.subsetMethod === 'specific'
                          ? colors.accentPrimary
                          : colors.containerBackground,
                        color: wizardState.settings.subsetMethod === 'specific'
                          ? colors.buttonText
                          : colors.text,
                        border: `1px solid ${wizardState.settings.subsetMethod === 'specific' ? colors.accentPrimary : colors.border}`,
                      }}
                    >
                      Specific
                    </button>
                    {((stats.numPopulations ?? 0) > 1) && (
                      <button
                        type="button"
                        onClick={() => wizardState.setSubsetMethod('population')}
                        className="py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: wizardState.settings.subsetMethod === 'population'
                            ? colors.accentPrimary
                            : colors.containerBackground,
                          color: wizardState.settings.subsetMethod === 'population'
                            ? colors.buttonText
                            : colors.text,
                          border: `1px solid ${wizardState.settings.subsetMethod === 'population' ? colors.accentPrimary : colors.border}`,
                        }}
                      >
                        Population
                      </button>
                    )}
                  </div>

                  {/* Count-based method input */}
                  {(wizardState.settings.subsetMethod === 'even' || wizardState.settings.subsetMethod === 'random') && (
                    <SliderInput
                      label={wizardState.settings.subsetMethod === 'even' ? 'Number of evenly spaced samples' : 'Number of random samples'}
                      value={wizardState.settings.sampleCount}
                      min={WIZARD_THRESHOLDS.MIN_SAMPLES}
                      max={stats.numSamples}
                      onChange={wizardState.setSampleCount}
                    />
                  )}

                  {/* Range Method Input */}
                  {wizardState.settings.subsetMethod === 'range' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs block mb-1" style={{ color: colors.textSecondary }}>Start ID</label>
                        <input
                          type="number"
                          min={0}
                          max={stats.numSamples - 1}
                          value={wizardState.settings.sampleRangeStart}
                          onChange={(e) => {
                            const start = parseInt(e.target.value) || 0;
                            wizardState.setSampleRange(start, wizardState.settings.sampleRangeEnd);
                          }}
                          className="w-full rounded px-3 py-2 text-sm"
                          style={{
                            backgroundColor: colors.containerBackground,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: colors.textSecondary }}>End ID</label>
                        <input
                          type="number"
                          min={0}
                          max={stats.numSamples - 1}
                          value={wizardState.settings.sampleRangeEnd}
                          onChange={(e) => {
                            const end = parseInt(e.target.value) || stats.numSamples - 1;
                            wizardState.setSampleRange(wizardState.settings.sampleRangeStart, end);
                          }}
                          className="w-full rounded px-3 py-2 text-sm"
                          style={{
                            backgroundColor: colors.containerBackground,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                      </div>
                      <p className="col-span-2 text-xs" style={{ color: colors.textSecondary }}>
                        {Math.max(0, wizardState.settings.sampleRangeEnd - wizardState.settings.sampleRangeStart + 1)} samples selected (IDs 0-{stats.numSamples - 1} available)
                      </p>
                    </div>
                  )}

                  {/* Specific Method Input */}
                  {wizardState.settings.subsetMethod === 'specific' && (
                    <SampleIdsInput
                      value={wizardState.settings.sampleIds}
                      onChange={wizardState.setSampleIds}
                      maxSampleId={stats.numSamples - 1}
                      colors={colors}
                    />
                  )}

                  {/* Population Method Input */}
                  {wizardState.settings.subsetMethod === 'population' && (stats.numPopulations ?? 0) > 1 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          Choose populations to include
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const allPopulations = Array.from(
                              { length: stats.numPopulations ?? 0 },
                              (_, index) => index
                            );
                            wizardState.setSelectedPopulations(
                              wizardState.settings.selectedPopulations.length === allPopulations.length
                                ? []
                                : allPopulations
                            );
                          }}
                          className="text-xs font-medium"
                          style={{ color: colors.accentPrimary }}
                        >
                          {wizardState.settings.selectedPopulations.length === (stats.numPopulations ?? 0)
                            ? 'Clear'
                            : 'Select all'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: stats.numPopulations ?? 0 }, (_, index) => {
                          const checked = wizardState.settings.selectedPopulations.includes(index);
                          return (
                            <label
                              key={index}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                              style={{
                                backgroundColor: checked ? `${colors.accentPrimary}15` : colors.containerBackground,
                                border: `1px solid ${checked ? colors.accentPrimary : colors.border}`,
                                color: colors.text,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  const nextPopulations = event.target.checked
                                    ? [...wizardState.settings.selectedPopulations, index]
                                    : wizardState.settings.selectedPopulations.filter(population => population !== index);
                                  wizardState.setSelectedPopulations(nextPopulations);
                                }}
                                style={{ accentColor: colors.accentPrimary }}
                              />
                              <span>Population {index}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </OptionCard>

              {/* Focal Node Option */}
              <OptionCard
                selected={wizardState.settings.dataScope === 'focal'}
                onClick={() => wizardState.setDataScope('focal')}
                title="Focal Node"
                description="View subgraph from a specific node or ancestors of a sample"
              >
                <div className="space-y-4">
                  {/* Focal Mode Selection */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => wizardState.setFocalMode('subgraph')}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: wizardState.settings.focalMode === 'subgraph'
                          ? colors.accentPrimary
                          : colors.containerBackground,
                        color: wizardState.settings.focalMode === 'subgraph'
                          ? colors.buttonText
                          : colors.text,
                        border: `1px solid ${wizardState.settings.focalMode === 'subgraph' ? colors.accentPrimary : colors.border}`,
                      }}
                    >
                      Subgraph (descendants)
                    </button>
                    <button
                      type="button"
                      onClick={() => wizardState.setFocalMode('ancestors')}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: wizardState.settings.focalMode === 'ancestors'
                          ? colors.accentPrimary
                          : colors.containerBackground,
                        color: wizardState.settings.focalMode === 'ancestors'
                          ? colors.buttonText
                          : colors.text,
                        border: `1px solid ${wizardState.settings.focalMode === 'ancestors' ? colors.accentPrimary : colors.border}`,
                      }}
                    >
                      Ancestors (parent ARG)
                    </button>
                  </div>

                  {/* Node ID Input */}
                  <div>
                    <label className="text-xs block mb-1" style={{ color: colors.textSecondary }}>
                      {wizardState.settings.focalMode === 'subgraph' ? 'Root Node ID' : 'Sample Node ID'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={wizardState.settings.focalMode === 'subgraph' ? stats.numNodes - 1 : stats.numSamples - 1}
                      value={wizardState.settings.focalNodeId ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        wizardState.setFocalNodeId(value === '' ? null : parseInt(value) || 0);
                      }}
                      placeholder={wizardState.settings.focalMode === 'subgraph' ? `Enter node ID (0-${stats.numNodes - 1})` : `Enter sample ID (0-${stats.numSamples - 1})`}
                      className="w-full rounded px-3 py-2 text-sm"
                      style={{
                        backgroundColor: colors.containerBackground,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {wizardState.settings.focalMode === 'subgraph'
                        ? 'Shows all descendants of the specified root node'
                        : 'Shows all ancestors leading to the specified sample'}
                    </p>
                  </div>
                </div>
              </OptionCard>
            </div>
          </WizardStep>
        );

      case 'region':
        return (
          <WizardStep
            title="Genomic Region"
            description="Focus on a specific region or visualize the entire sequence"
            suggestion={regionSuggestion}
          >
            <div className="space-y-3">
              <OptionCard
                selected={wizardState.settings.regionFilter === 'full'}
                onClick={() => wizardState.setRegionFilter('full')}
                title="Entire Sequence"
                description={`All ${stats.sequenceLength.toLocaleString()} bp across ${stats.numTrees.toLocaleString()} trees`}
              />
              <OptionCard
                selected={wizardState.settings.regionFilter === 'filtered'}
                onClick={() => wizardState.setRegionFilter('filtered')}
                title="Specific Region"
                description="Filter to a genomic range or tree interval"
              >
                <div className="space-y-4">
                  {/* Filter Mode Toggle */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => wizardState.setFilterMode('base_pairs')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors`}
                      style={{
                        backgroundColor: wizardState.settings.filterMode === 'base_pairs'
                          ? colors.accentPrimary
                          : colors.containerBackground,
                        color: wizardState.settings.filterMode === 'base_pairs'
                          ? colors.buttonText
                          : colors.text,
                        border: `1px solid ${wizardState.settings.filterMode === 'base_pairs' ? colors.accentPrimary : colors.border}`,
                      }}
                    >
                      Base Pairs
                    </button>
                    <button
                      type="button"
                      onClick={() => wizardState.setFilterMode('tree_indices')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors`}
                      style={{
                        backgroundColor: wizardState.settings.filterMode === 'tree_indices'
                          ? colors.accentPrimary
                          : colors.containerBackground,
                        color: wizardState.settings.filterMode === 'tree_indices'
                          ? colors.buttonText
                          : colors.text,
                        border: `1px solid ${wizardState.settings.filterMode === 'tree_indices' ? colors.accentPrimary : colors.border}`,
                      }}
                    >
                      Tree Indices
                    </button>
                  </div>

                  {/* Range Inputs */}
                  {wizardState.settings.filterMode === 'base_pairs' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs block mb-1" style={{ color: colors.textSecondary }}>Start (bp)</label>
                        <input
                          type="number"
                          min={0}
                          max={stats.sequenceLength}
                          value={wizardState.settings.genomicRange?.[0] ?? 0}
                          onChange={(e) => {
                            const start = parseInt(e.target.value) || 0;
                            const end = wizardState.settings.genomicRange?.[1] ?? stats.sequenceLength;
                            wizardState.setGenomicRange([start, end]);
                          }}
                          className="w-full rounded px-3 py-2 text-sm"
                          style={{
                            backgroundColor: colors.containerBackground,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: colors.textSecondary }}>End (bp)</label>
                        <input
                          type="number"
                          min={0}
                          max={stats.sequenceLength}
                          value={wizardState.settings.genomicRange?.[1] ?? stats.sequenceLength}
                          onChange={(e) => {
                            const start = wizardState.settings.genomicRange?.[0] ?? 0;
                            const end = parseInt(e.target.value) || stats.sequenceLength;
                            wizardState.setGenomicRange([start, end]);
                          }}
                          className="w-full rounded px-3 py-2 text-sm"
                          style={{
                            backgroundColor: colors.containerBackground,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs block mb-1" style={{ color: colors.textSecondary }}>Start Tree</label>
                        <input
                          type="number"
                          min={0}
                          max={stats.numTrees - 1}
                          value={wizardState.settings.treeRange?.[0] ?? 0}
                          onChange={(e) => {
                            const start = parseInt(e.target.value) || 0;
                            const end = wizardState.settings.treeRange?.[1] ?? stats.numTrees - 1;
                            wizardState.setTreeRange([start, end]);
                          }}
                          className="w-full rounded px-3 py-2 text-sm"
                          style={{
                            backgroundColor: colors.containerBackground,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: colors.textSecondary }}>End Tree</label>
                        <input
                          type="number"
                          min={0}
                          max={stats.numTrees - 1}
                          value={wizardState.settings.treeRange?.[1] ?? stats.numTrees - 1}
                          onChange={(e) => {
                            const start = wizardState.settings.treeRange?.[0] ?? 0;
                            const end = parseInt(e.target.value) || stats.numTrees - 1;
                            wizardState.setTreeRange([start, end]);
                          }}
                          className="w-full rounded px-3 py-2 text-sm"
                          style={{
                            backgroundColor: colors.containerBackground,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </OptionCard>
            </div>
          </WizardStep>
        );

      case 'performance':
        return (
          <WizardStep
            title="Performance Options"
            description="Enable optimizations for smoother visualization"
            suggestion={performanceSuggestion}
          >
            <div className="space-y-2">
              {/* 2D only: show clustering option */}
              {vizType === '2d' && (
                <CheckboxOption
                  checked={wizardState.settings.enableClustering}
                  onChange={wizardState.setEnableClustering}
                  label="Node Clustering"
                  description="Groups dense subtrees into expandable clusters. Click to expand."
                  recommended={wizardState.complexity.estimatedNodes > WIZARD_THRESHOLDS.CLUSTERING_RECOMMENDED}
                />
              )}
              {/* 3D only: show heatmap option */}
              {vizType === '3d' && (
                <CheckboxOption
                  checked={wizardState.settings.enableHeatmap}
                  onChange={wizardState.setEnableHeatmap}
                  label="Heatmap Mode"
                  description="Shows ancestry as a heatmap overlay. Hides individual nodes initially."
                  recommended={wizardState.complexity.estimatedNodes > WIZARD_THRESHOLDS.HEATMAP_RECOMMENDED}
                />
              )}
            </div>
          </WizardStep>
        );

      case 'summary':
        return (
          <WizardSummary
            vizType={vizType}
            settings={wizardState.settings}
            stats={stats}
            complexity={wizardState.complexity}
            onAdjustSettings={() => wizardState.goToStep(0)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[10002]">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={modalOverlayStyle}
        onClick={onClose}
      />

      {/* Modal content container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Modal */}
        <div
          className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          style={modalGlassStyle}
        >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.accentPrimary}20`, color: colors.accentPrimary }}
            >
              {vizTypeLabels[vizType].icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                {vizTypeLabels[vizType].title}
              </h2>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {wizardState.steps.length > 1
                  ? `Step ${wizardState.currentStepIndex + 1} of ${wizardState.steps.length}`
                  : 'Confirm settings'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Skip to visualization button */}
            <button
              type="button"
              onClick={() => onLaunch(wizardState.settings)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                color: colors.textSecondary,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.accentPrimary;
                e.currentTarget.style.color = colors.accentPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.color = colors.textSecondary;
              }}
              title="Skip wizard and launch with current/default settings"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
              style={{ color: colors.textSecondary }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <button
            type="button"
            onClick={wizardState.canGoBack ? wizardState.goBack : onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              color: colors.text,
              backgroundColor: colors.containerBackground,
              border: `1px solid ${colors.border}`,
            }}
          >
            {wizardState.canGoBack ? 'Back' : 'Cancel'}
          </button>

          {/* Step indicators */}
          {wizardState.steps.length > 1 && (
            <div className="flex items-center gap-1.5">
              {wizardState.steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= wizardState.currentStepIndex ? 'scale-100' : 'scale-75 opacity-50'
                  }`}
                  style={{
                    backgroundColor: index <= wizardState.currentStepIndex
                      ? colors.accentPrimary
                      : colors.border,
                  }}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (wizardState.isLastStep) {
                onLaunch(wizardState.settings);
              } else {
                wizardState.goForward();
              }
            }}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor: colors.accentPrimary,
              color: colors.buttonText,
            }}
          >
            {wizardState.isLastStep
              ? vizType === 'diff'
                ? 'Select Second File'
                : 'Launch'
              : 'Continue'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for comma-separated sample ID input
interface SampleIdsInputProps {
  value: number[];
  onChange: (ids: number[]) => void;
  maxSampleId: number;
  colors: {
    containerBackground: string;
    border: string;
    text: string;
    textSecondary: string;
    accentPrimary: string;
  };
}

function SampleIdsInput({ value, onChange, maxSampleId, colors }: SampleIdsInputProps) {
  const [inputValue, setInputValue] = useState(value.join(', '));
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    const input = inputValue.trim();
    if (!input) {
      onChange([]);
      setError(null);
      return;
    }

    try {
      const ids = input.split(',').map(s => {
        const num = parseInt(s.trim());
        if (isNaN(num)) throw new Error(`Invalid ID: ${s.trim()}`);
        if (num < 0 || num > maxSampleId) {
          throw new Error(`ID ${num} out of range (0-${maxSampleId})`);
        }
        return num;
      });
      const uniqueIds = [...new Set(ids)];
      onChange(uniqueIds);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs" style={{ color: colors.textSecondary }}>
          Sample IDs (comma-separated)
        </label>
        <span className="text-xs" style={{ color: colors.textSecondary }}>
          Valid: 0-{maxSampleId}
        </span>
      </div>
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="e.g., 0, 5, 10, 25, 42"
        rows={2}
        className="w-full rounded px-3 py-2 text-sm resize-none"
        style={{
          backgroundColor: colors.containerBackground,
          border: `1px solid ${error ? '#ef4444' : colors.border}`,
          color: colors.text,
        }}
      />
      {error ? (
        <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
      ) : value.length > 0 ? (
        <p className="text-xs" style={{ color: colors.accentPrimary }}>
          {value.length} valid sample{value.length !== 1 ? 's' : ''} selected
        </p>
      ) : null}
    </div>
  );
}
