import { useState, useCallback, useMemo } from 'react';
import {
  WizardSettings,
  WizardStep,
  TreeSequenceStats,
  VisualizationType,
  DataScopeOption,
  SubsetMethod,
  FocalMode,
  getDefaultSettings,
  getWizardSteps,
  estimateComplexity,
  ComplexityEstimate,
  WIZARD_THRESHOLDS,
  isFullSampleRange,
} from './wizardConfig';

export interface PreConfiguredSettings {
  temporalRange: [number, number] | null;
  genomicRange: [number, number] | null;
  genomicMode: 'base_pairs' | 'tree_indices';
  sampleSubsetMode: 'even' | 'random' | 'ids' | 'range' | 'population';
  maxSamples: number;
  sampleIds: number[];
  sampleRange: [number, number] | null;
  selectedPopulations: number[];
  enableClustering: boolean;
  heatmapOnlyMode: boolean;
  focusMode: 'none' | 'root' | 'sample';
  focusNodeId: number | null;
}

export interface UseWizardStateResult {
  // Current state
  currentStepIndex: number;
  currentStep: WizardStep;
  steps: WizardStep[];
  settings: WizardSettings;
  complexity: ComplexityEstimate;

  // Navigation
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  goToStep: (index: number) => void;

  // Settings updates - Data scope
  setDataScope: (scope: DataScopeOption) => void;

  // Subset options
  setSubsetMethod: (method: SubsetMethod) => void;
  setSampleCount: (count: number) => void;
  setSampleRange: (start: number, end: number) => void;
  setSampleIds: (ids: number[]) => void;
  setSelectedPopulations: (populations: number[]) => void;

  // Focal options
  setFocalMode: (mode: FocalMode) => void;
  setFocalNodeId: (id: number | null) => void;

  // Region filter
  setRegionFilter: (filter: 'full' | 'filtered') => void;
  setGenomicRange: (range: [number, number] | null) => void;
  setTreeRange: (range: [number, number] | null) => void;
  setFilterMode: (mode: 'base_pairs' | 'tree_indices') => void;

  // Performance
  setEnableClustering: (enabled: boolean) => void;
  setEnableHeatmap: (enabled: boolean) => void;

  // Utility
  isLastStep: boolean;
  hasPerformanceWarnings: boolean;
}

export function useWizardState(
  vizType: VisualizationType,
  stats: TreeSequenceStats,
  preConfigured: PreConfiguredSettings | null,
  showSummaryOnly = false
): UseWizardStateResult {
  // Get wizard steps based on viz type and pre-config state
  const steps = useMemo(
    () => getWizardSteps(vizType, stats, showSummaryOnly),
    [vizType, stats, showSummaryOnly]
  );

  // Initialize settings from pre-configured or defaults
  const initialSettings = useMemo((): WizardSettings => {
    const defaults = getDefaultSettings(stats);

    if (preConfigured) {
      // Determine data scope from pre-configured settings
      let dataScope: DataScopeOption = 'full';
      let subsetMethod: SubsetMethod = 'random';

      const hasFocusedSelection =
        preConfigured.focusMode !== 'none' && preConfigured.focusNodeId !== null;
      const hasRangeSubset =
        preConfigured.sampleSubsetMode === 'range' &&
        preConfigured.sampleRange !== null &&
        !isFullSampleRange(preConfigured.sampleRange, stats.numSamples);
      const hasCountSubset =
        (preConfigured.sampleSubsetMode === 'even' || preConfigured.sampleSubsetMode === 'random') &&
        preConfigured.maxSamples < stats.numSamples;
      const hasIdSubset =
        preConfigured.sampleSubsetMode === 'ids' &&
        preConfigured.sampleIds.length > 0;
      const hasPopulationSubset =
        preConfigured.sampleSubsetMode === 'population' &&
        preConfigured.selectedPopulations.length > 0;

      if (hasFocusedSelection) {
        dataScope = 'focal';
      } else if (hasRangeSubset || hasCountSubset || hasIdSubset || hasPopulationSubset) {
        dataScope = 'subset';
        // Map sample subset mode to wizard subset method
        if (preConfigured.sampleSubsetMode === 'even') {
          subsetMethod = 'even';
        } else if (preConfigured.sampleSubsetMode === 'random') {
          subsetMethod = 'random';
        } else if (preConfigured.sampleSubsetMode === 'range') {
          subsetMethod = 'range';
        } else if (preConfigured.sampleSubsetMode === 'ids') {
          subsetMethod = 'specific';
        } else if (preConfigured.sampleSubsetMode === 'population') {
          subsetMethod = 'population';
        }
      }

      return {
        ...defaults,
        // Data scope
        dataScope,

        // Subset options
        subsetMethod,
        sampleCount: preConfigured.maxSamples,
        sampleRangeStart: preConfigured.sampleRange?.[0] ?? defaults.sampleRangeStart,
        sampleRangeEnd: preConfigured.sampleRange?.[1] ?? defaults.sampleRangeEnd,
        sampleIds: preConfigured.sampleIds,
        selectedPopulations: preConfigured.selectedPopulations,

        // Focal options
        focalMode: preConfigured.focusMode === 'sample' ? 'ancestors' : 'subgraph',
        focalNodeId: preConfigured.focusNodeId,

        // Region filter
        regionFilter: preConfigured.genomicRange ? 'filtered' : 'full',
        genomicRange: preConfigured.genomicMode === 'base_pairs' ? preConfigured.genomicRange : null,
        treeRange: preConfigured.genomicMode === 'tree_indices' ? preConfigured.genomicRange : null,
        filterMode: preConfigured.genomicMode,

        // Performance
        enableClustering: preConfigured.enableClustering,
        enableHeatmap: preConfigured.heatmapOnlyMode,

        // Pass through temporal range
        temporalRange: preConfigured.temporalRange,
      };
    }

    return defaults;
  }, [stats, preConfigured]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [settings, setSettings] = useState<WizardSettings>(initialSettings);

  // Calculate complexity based on current settings
  const complexity = useMemo(
    () => estimateComplexity(stats, settings),
    [stats, settings]
  );

  // Navigation
  const currentStep = steps[currentStepIndex];
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < steps.length - 1;
  const isLastStep = currentStepIndex === steps.length - 1;

  const goBack = useCallback(() => {
    if (canGoBack) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [canGoForward]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  }, [steps.length]);

  // Settings updaters - Data scope
  const setDataScope = useCallback((scope: DataScopeOption) => {
    setSettings(prev => ({
      ...prev,
      dataScope: scope,
    }));
  }, []);

  // Subset options
  const setSubsetMethod = useCallback((method: SubsetMethod) => {
    setSettings(prev => ({
      ...prev,
      subsetMethod: method,
    }));
  }, []);

  const setSampleCount = useCallback((count: number) => {
    setSettings(prev => ({
      ...prev,
      sampleCount: Math.max(WIZARD_THRESHOLDS.MIN_SAMPLES, Math.min(count, stats.numSamples)),
    }));
  }, [stats.numSamples]);

  const setSampleRange = useCallback((start: number, end: number) => {
    setSettings(prev => ({
      ...prev,
      sampleRangeStart: Math.max(0, Math.min(start, stats.numSamples - 1)),
      sampleRangeEnd: Math.max(0, Math.min(end, stats.numSamples - 1)),
    }));
  }, [stats.numSamples]);

  const setSampleIds = useCallback((ids: number[]) => {
    // Filter to valid sample IDs
    const validIds = ids.filter(id => id >= 0 && id < stats.numSamples);
    setSettings(prev => ({
      ...prev,
      sampleIds: validIds,
    }));
  }, [stats.numSamples]);

  const setSelectedPopulations = useCallback((populations: number[]) => {
    const maxPopulations = stats.numPopulations ?? 0;
    const validPopulations = populations
      .filter(population => population >= 0 && population < maxPopulations)
      .filter((population, index, all) => all.indexOf(population) === index);

    setSettings(prev => ({
      ...prev,
      selectedPopulations: validPopulations,
    }));
  }, [stats.numPopulations]);

  // Focal options
  const setFocalMode = useCallback((mode: FocalMode) => {
    setSettings(prev => ({
      ...prev,
      focalMode: mode,
    }));
  }, []);

  const setFocalNodeId = useCallback((id: number | null) => {
    setSettings(prev => ({
      ...prev,
      focalNodeId: id,
    }));
  }, []);

  const setRegionFilter = useCallback((filter: 'full' | 'filtered') => {
    setSettings(prev => ({
      ...prev,
      regionFilter: filter,
      genomicRange: filter === 'full' ? null : prev.genomicRange,
      treeRange: filter === 'full' ? null : prev.treeRange,
    }));
  }, []);

  const setGenomicRange = useCallback((range: [number, number] | null) => {
    setSettings(prev => ({
      ...prev,
      genomicRange: range,
      filterMode: 'base_pairs',
    }));
  }, []);

  const setTreeRange = useCallback((range: [number, number] | null) => {
    setSettings(prev => ({
      ...prev,
      treeRange: range,
      filterMode: 'tree_indices',
    }));
  }, []);

  const setFilterMode = useCallback((mode: 'base_pairs' | 'tree_indices') => {
    setSettings(prev => ({
      ...prev,
      filterMode: mode,
    }));
  }, []);

  const setEnableClustering = useCallback((enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      enableClustering: enabled,
    }));
  }, []);

  const setEnableHeatmap = useCallback((enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      enableHeatmap: enabled,
    }));
  }, []);

  return {
    currentStepIndex,
    currentStep,
    steps,
    settings,
    complexity,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    goToStep,
    // Data scope
    setDataScope,
    // Subset options
    setSubsetMethod,
    setSampleCount,
    setSampleRange,
    setSampleIds,
    setSelectedPopulations,
    // Focal options
    setFocalMode,
    setFocalNodeId,
    // Region filter
    setRegionFilter,
    setGenomicRange,
    setTreeRange,
    setFilterMode,
    // Performance
    setEnableClustering,
    setEnableHeatmap,
    isLastStep,
    hasPerformanceWarnings: complexity.warnings.length > 0,
  };
}
