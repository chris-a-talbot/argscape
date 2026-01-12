/**
 * SpatialArgDiffControls Component
 *
 * Main QuickActionsBar integration for the diff visualizer.
 * Provides 9 tabs for comprehensive control of the diff visualization:
 * - Diff: View mode, error bars, distance metrics
 * - Filter: Genomic/temporal range filtering
 * - Nodes: Color, sizes, labels, combining
 * - Edges: Width, opacity, labels
 * - Mutations: Marker visibility and size
 * - Stats: Node/edge counts for both datasets, performance
 * - Export: PNG, SVG, data export
 * - Camera: Presets, auto-rotation
 * - Spatial: Geographic mode, spacing, heatmap
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  QuickActionsBar,
  useKeyboardShortcutContext,
  ShortcutHelpDialog,
} from '@/components/ui/QuickActionsBar';
import type {
  TabConfig,
  PanelConfig,
  QuickActionTab,
  KeyboardShortcut,
} from '@/components/ui/QuickActionsBar';
import {
  FilterPanel,
  NodesPanel,
  EdgesPanel,
  MutationsPanel,
  DiffExportPanel,
  CameraPanel,
  SpatialPanel,
  DiffPanel,
  DiffStatsPanel,
  CAMERA_PRESETS,
} from '@/components/ui/QuickActionsBar/panels';
import type {
  CameraPreset,
  GeographicMode,
  TemporalSpacingMode,
  HeatmapSettings,
  NodeEdgeStats,
  SequenceStats,
  PerformanceStats,
  FilterSummary,
  ExportFormat,
  GenomicFilterConfig,
  TreeFilterConfig,
  TemporalFilterConfig,
  FilterMode,
  FilterType,
  TemporalFilterMode,
  DiffViewMode,
  DiffStats,
} from '@/components/ui/QuickActionsBar/panels';

// Types for node sizes
interface NodeSizes {
  sample: number;
  root: number;
  other: number;
}

// Types for node ID display settings
interface NodeIdSettings {
  showSampleIds: boolean;
  showRootIds: boolean;
  showInternalIds: boolean;
}

// ColorBy mode for 3D visualizer
type ColorByMode = 'none' | 'time' | 'population' | 'type';

/**
 * Props for SpatialArgDiffControls
 */
export interface SpatialArgDiffControlsProps {
  // Diff-specific props
  diffViewMode?: DiffViewMode;
  onDiffViewModeChange?: (mode: DiffViewMode) => void;
  showErrorBars?: boolean;
  onShowErrorBarsChange?: (show: boolean) => void;
  errorBarThickness?: number;
  onErrorBarThicknessChange?: (thickness: number) => void;
  diffStats?: DiffStats;

  // Filter props
  genomicFilter?: GenomicFilterConfig;
  treeFilter?: TreeFilterConfig;
  temporalFilter?: TemporalFilterConfig;
  filterType?: FilterType;
  onFilterTypeChange?: (type: FilterType) => void;
  spatialFilterEnabled?: boolean;
  onSpatialFilterToggle?: (enabled: boolean) => void;
  temporalFilterEnabled?: boolean;
  onTemporalFilterToggle?: (enabled: boolean) => void;
  filterMode?: FilterMode;
  onFilterModeChange?: (mode: FilterMode) => void;
  dimOpacity?: number;
  onDimOpacityChange?: (opacity: number) => void;
  temporalFilterMode?: TemporalFilterMode;
  onTemporalFilterModeChange?: (mode: TemporalFilterMode) => void;
  temporalDimOpacity?: number;
  onTemporalDimOpacityChange?: (opacity: number) => void;

  // Nodes props
  colorBy?: ColorByMode;
  onColorByChange?: (mode: ColorByMode) => void;
  availableColorModes?: ColorByMode[];
  nodeSizes?: NodeSizes;
  onNodeSizesChange?: (sizes: NodeSizes) => void;
  nodeIdSettings?: NodeIdSettings;
  onNodeIdSettingsChange?: (settings: NodeIdSettings) => void;
  combineInternalNodes?: boolean;
  onCombineInternalNodesChange?: (combine: boolean) => void;
  combineSampleNodes?: boolean;
  onCombineSampleNodesChange?: (combine: boolean) => void;

  // Edges props
  edgeThickness?: number;
  onEdgeThicknessChange?: (thickness: number) => void;
  edgeOpacity?: number;
  onEdgeOpacityChange?: (opacity: number) => void;
  showEdgeLabels?: boolean;
  onShowEdgeLabelsChange?: (show: boolean) => void;
  edgeLabelFontSize?: number;
  onEdgeLabelFontSizeChange?: (size: number) => void;

  // Mutations props
  showMutationMarkers?: boolean;
  onShowMutationMarkersChange?: (show: boolean) => void;
  mutationMarkerSize?: number;
  onMutationMarkerSizeChange?: (size: number) => void;

  // Stats props (diff-specific: two datasets)
  firstDatasetStats?: {
    nodeEdgeStats?: NodeEdgeStats;
    sequenceStats?: SequenceStats;
    label: string;
  };
  secondDatasetStats?: {
    nodeEdgeStats?: NodeEdgeStats;
    sequenceStats?: SequenceStats;
    label: string;
  };
  performanceStats?: PerformanceStats;
  filterSummary?: FilterSummary;
  onStatsExport?: (format: ExportFormat) => void;

  // Export props
  onDownloadPNG?: () => void;
  firstFilename?: string;
  secondFilename?: string;
  pngAvailable?: boolean;
  isDownloading?: boolean;
  onExportError?: (error: Error) => void;

  // Camera props
  currentRotationX?: number;
  currentRotationOrbit?: number;
  currentZoom?: number;
  onPresetSelect?: (preset: CameraPreset) => void;
  onCenterView?: () => void;
  autoRotationEnabled?: boolean;
  onAutoRotationEnabledChange?: (enabled: boolean) => void;
  autoRotationRate?: number;
  onAutoRotationRateChange?: (rate: number) => void;

  // Spatial props
  geographicMode?: GeographicMode;
  onGeographicModeChange?: (mode: GeographicMode) => void;
  customShapeFile?: File | null;
  onCustomShapeFileChange?: (file: File | null) => void;
  geographicShapeOpacity?: number;
  onGeographicShapeOpacityChange?: (opacity: number) => void;
  isLoadingGeographic?: boolean;
  temporalSpacing?: number;
  onTemporalSpacingChange?: (value: number) => void;
  temporalSpacingMode?: TemporalSpacingMode;
  onTemporalSpacingModeChange?: (mode: TemporalSpacingMode) => void;
  spatialSpacing?: number;
  onSpatialSpacingChange?: (value: number) => void;
  temporalGridOpacity?: number;
  onTemporalGridOpacityChange?: (value: number) => void;
  heatmapSettings?: HeatmapSettings;
  onHeatmapSettingsChange?: (settings: HeatmapSettings) => void;
  isTemporalFilterActive?: boolean;
  unaryRetentionPercent?: number;
  onUnaryRetentionPercentChange?: (value: number) => void;

  // UI control props
  floating?: boolean;
  compact?: boolean;
  className?: string;
  enableKeyboardShortcuts?: boolean;
  showShortcutHints?: boolean;
}

/**
 * SpatialArgDiffControls - Main controls component for diff visualizer
 */
export const SpatialArgDiffControls: React.FC<SpatialArgDiffControlsProps> = ({
  // Diff-specific props
  diffViewMode = 'diff',
  onDiffViewModeChange,
  showErrorBars = true,
  onShowErrorBarsChange,
  errorBarThickness = 2,
  onErrorBarThicknessChange,
  diffStats,

  // Filter props
  genomicFilter,
  treeFilter,
  temporalFilter,
  filterType = 'genomic',
  onFilterTypeChange,
  spatialFilterEnabled = false,
  onSpatialFilterToggle,
  temporalFilterEnabled = false,
  onTemporalFilterToggle,
  filterMode = 'subset',
  onFilterModeChange,
  dimOpacity = 0.05,
  onDimOpacityChange,
  temporalFilterMode = 'planes',
  onTemporalFilterModeChange,
  temporalDimOpacity = 0.05,
  onTemporalDimOpacityChange,

  // Nodes props
  colorBy = 'type',
  onColorByChange,
  availableColorModes,
  nodeSizes,
  onNodeSizesChange,
  nodeIdSettings,
  onNodeIdSettingsChange,
  combineInternalNodes,
  onCombineInternalNodesChange,
  combineSampleNodes,
  onCombineSampleNodesChange,

  // Edges props
  edgeThickness = 1.5,
  onEdgeThicknessChange,
  edgeOpacity = 95,
  onEdgeOpacityChange,
  showEdgeLabels = false,
  onShowEdgeLabelsChange,
  edgeLabelFontSize = 12,
  onEdgeLabelFontSizeChange,

  // Mutations props
  showMutationMarkers = false,
  onShowMutationMarkersChange,
  mutationMarkerSize = 8,
  onMutationMarkerSizeChange,

  // Stats props
  firstDatasetStats,
  secondDatasetStats,
  performanceStats,
  filterSummary,
  onStatsExport,

  // Export props
  onDownloadPNG,
  firstFilename,
  secondFilename,
  pngAvailable = true,
  isDownloading = false,
  onExportError,

  // Camera props
  currentRotationX,
  currentRotationOrbit,
  currentZoom,
  onPresetSelect,
  onCenterView,
  autoRotationEnabled = false,
  onAutoRotationEnabledChange,
  autoRotationRate = 10,
  onAutoRotationRateChange,

  // Spatial props
  geographicMode = 'unit_grid',
  onGeographicModeChange,
  customShapeFile,
  onCustomShapeFileChange,
  geographicShapeOpacity = 80,
  onGeographicShapeOpacityChange,
  isLoadingGeographic = false,
  temporalSpacing = 10,
  onTemporalSpacingChange,
  temporalSpacingMode = 'equal',
  onTemporalSpacingModeChange,
  spatialSpacing = 100,
  onSpatialSpacingChange,
  temporalGridOpacity = 50,
  onTemporalGridOpacityChange,
  heatmapSettings,
  onHeatmapSettingsChange,
  isTemporalFilterActive = false,
  unaryRetentionPercent,
  onUnaryRetentionPercentChange,

  // UI props
  floating = true,
  compact = false,
  className = '',
  enableKeyboardShortcuts = true,
  showShortcutHints = false,
}) => {
  // State for active tab and help dialog
  const [activeTab, setActiveTab] = useState<QuickActionTab | null>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Access keyboard shortcut context
  const { registerShortcut } = useKeyboardShortcutContext();

  // Tab configuration (9 tabs including Diff)
  const tabs: TabConfig[] = useMemo(
    () => [
      { id: 'diff', label: 'Diff', shortcut: 'd', ariaLabel: 'Toggle diff panel' },
      { id: 'filter', label: 'Filter', shortcut: 'f', ariaLabel: 'Toggle filter panel' },
      { id: 'nodes', label: 'Nodes', shortcut: 'n', ariaLabel: 'Toggle nodes panel' },
      { id: 'edges', label: 'Edges', shortcut: 'e', ariaLabel: 'Toggle edges panel' },
      { id: 'mutations', label: 'Mutations', shortcut: 'm', ariaLabel: 'Toggle mutations panel' },
      { id: 'stats', label: 'Stats', shortcut: 'i', ariaLabel: 'Toggle statistics panel' },
      { id: 'export', label: 'Export', shortcut: 'x', ariaLabel: 'Toggle export panel' },
      { id: 'camera', label: 'Camera', shortcut: 'c', ariaLabel: 'Toggle camera panel' },
      { id: 'spatial', label: 'Spatial', shortcut: 's', ariaLabel: 'Toggle spatial panel' },
    ],
    []
  );

  // Panel configuration
  const panels: PanelConfig[] = useMemo(() => {
    const panelConfigs: PanelConfig[] = [];

    // Diff Panel (first panel, unique to diff visualizer)
    panelConfigs.push({
      tabId: 'diff',
      content: (
        <DiffPanel
          viewMode={diffViewMode}
          onViewModeChange={onDiffViewModeChange}
          showErrorBars={showErrorBars}
          onShowErrorBarsChange={onShowErrorBarsChange}
          errorBarThickness={errorBarThickness}
          onErrorBarThicknessChange={onErrorBarThicknessChange}
          diffStats={diffStats}
        />
      ),
      defaultHeight: 280,
    });

    // Filter Panel
    panelConfigs.push({
      tabId: 'filter',
      content: (
        <FilterPanel
          genomicFilter={genomicFilter}
          treeFilter={treeFilter}
          temporalFilter={temporalFilter}
          filterType={filterType}
          onFilterTypeChange={onFilterTypeChange}
          spatialFilterEnabled={spatialFilterEnabled}
          onSpatialFilterToggle={onSpatialFilterToggle}
          temporalFilterEnabled={temporalFilterEnabled}
          onTemporalFilterToggle={onTemporalFilterToggle}
          filterMode={filterMode}
          onFilterModeChange={onFilterModeChange!}
          dimOpacity={dimOpacity}
          onDimOpacityChange={onDimOpacityChange!}
          temporalFilterMode={temporalFilterMode}
          onTemporalFilterModeChange={onTemporalFilterModeChange}
          temporalDimOpacity={temporalDimOpacity}
          onTemporalDimOpacityChange={onTemporalDimOpacityChange}
        />
      ),
      defaultHeight: 200,
    });

    // Nodes Panel
    panelConfigs.push({
      tabId: 'nodes',
      content: (
        <NodesPanel
          colorBy={colorBy}
          onColorByChange={onColorByChange}
          availableColorModes={availableColorModes}
          nodeSizes={nodeSizes}
          onNodeSizesChange={onNodeSizesChange}
          nodeIdSettings={nodeIdSettings}
          onNodeIdSettingsChange={onNodeIdSettingsChange}
          combineInternalNodes={combineInternalNodes}
          onCombineInternalNodesChange={onCombineInternalNodesChange}
          combineSampleNodes={combineSampleNodes}
          onCombineSampleNodesChange={onCombineSampleNodesChange}
        />
      ),
      defaultHeight: 350,
    });

    // Edges Panel
    panelConfigs.push({
      tabId: 'edges',
      content: (
        <EdgesPanel
          edgeThickness={edgeThickness}
          onEdgeThicknessChange={onEdgeThicknessChange}
          edgeOpacity={edgeOpacity}
          onEdgeOpacityChange={onEdgeOpacityChange}
          showEdgeLabels={showEdgeLabels}
          onShowEdgeLabelsChange={onShowEdgeLabelsChange}
          edgeLabelFontSize={edgeLabelFontSize}
          onEdgeLabelFontSizeChange={onEdgeLabelFontSizeChange}
        />
      ),
      defaultHeight: 200,
    });

    // Mutations Panel
    panelConfigs.push({
      tabId: 'mutations',
      content: (
        <MutationsPanel
          showMutationMarkers={showMutationMarkers}
          onShowMutationMarkersChange={onShowMutationMarkersChange}
          mutationMarkerSize={mutationMarkerSize}
          onMutationMarkerSizeChange={onMutationMarkerSizeChange}
        />
      ),
      defaultHeight: 180,
    });

    // Stats Panel (uses DiffStatsPanel for diff visualizer)
    if (firstDatasetStats && secondDatasetStats) {
      panelConfigs.push({
        tabId: 'stats',
        content: (
          <DiffStatsPanel
            firstDatasetStats={firstDatasetStats}
            secondDatasetStats={secondDatasetStats}
            performanceStats={performanceStats}
            showPerformance={!!performanceStats}
          />
        ),
        defaultHeight: 450,
        defaultWidth: 340,
      });
    }

    // Export Panel (uses DiffExportPanel for diff-specific exports)
    panelConfigs.push({
      tabId: 'export',
      content: (
        <DiffExportPanel
          firstFilename={firstFilename}
          secondFilename={secondFilename}
          onDownloadPNG={onDownloadPNG}
          pngAvailable={pngAvailable}
          isDownloading={isDownloading}
          onError={onExportError}
        />
      ),
      defaultHeight: 400,
    });

    // Camera Panel
    panelConfigs.push({
      tabId: 'camera',
      content: (
        <CameraPanel
          currentRotationX={currentRotationX}
          currentRotationOrbit={currentRotationOrbit}
          currentZoom={currentZoom}
          onPresetSelect={onPresetSelect}
          onCenterView={onCenterView}
          autoRotationEnabled={autoRotationEnabled}
          onAutoRotationEnabledChange={onAutoRotationEnabledChange}
          autoRotationRate={autoRotationRate}
          onAutoRotationRateChange={onAutoRotationRateChange}
        />
      ),
      defaultHeight: 300,
    });

    // Spatial Panel
    panelConfigs.push({
      tabId: 'spatial',
      content: (
        <SpatialPanel
          geographicMode={geographicMode}
          onGeographicModeChange={onGeographicModeChange}
          customShapeFile={customShapeFile}
          onCustomShapeFileChange={onCustomShapeFileChange}
          geographicShapeOpacity={geographicShapeOpacity}
          onGeographicShapeOpacityChange={onGeographicShapeOpacityChange}
          isLoadingGeographic={isLoadingGeographic}
          temporalSpacing={temporalSpacing}
          onTemporalSpacingChange={onTemporalSpacingChange}
          temporalSpacingMode={temporalSpacingMode}
          onTemporalSpacingModeChange={onTemporalSpacingModeChange}
          spatialSpacing={spatialSpacing}
          onSpatialSpacingChange={onSpatialSpacingChange}
          temporalGridOpacity={temporalGridOpacity}
          onTemporalGridOpacityChange={onTemporalGridOpacityChange}
          heatmapSettings={heatmapSettings}
          onHeatmapSettingsChange={onHeatmapSettingsChange}
          isTemporalFilterActive={isTemporalFilterActive}
          unaryRetentionPercent={unaryRetentionPercent}
          onUnaryRetentionPercentChange={onUnaryRetentionPercentChange}
        />
      ),
      defaultHeight: 450,
    });

    return panelConfigs;
  }, [
    // Diff deps
    diffViewMode,
    onDiffViewModeChange,
    showErrorBars,
    onShowErrorBarsChange,
    errorBarThickness,
    onErrorBarThicknessChange,
    diffStats,
    // Filter deps
    genomicFilter,
    treeFilter,
    temporalFilter,
    filterType,
    onFilterTypeChange,
    spatialFilterEnabled,
    onSpatialFilterToggle,
    temporalFilterEnabled,
    onTemporalFilterToggle,
    filterMode,
    onFilterModeChange,
    dimOpacity,
    onDimOpacityChange,
    temporalFilterMode,
    onTemporalFilterModeChange,
    temporalDimOpacity,
    onTemporalDimOpacityChange,
    // Nodes deps
    colorBy,
    onColorByChange,
    availableColorModes,
    nodeSizes,
    onNodeSizesChange,
    nodeIdSettings,
    onNodeIdSettingsChange,
    combineInternalNodes,
    onCombineInternalNodesChange,
    combineSampleNodes,
    onCombineSampleNodesChange,
    // Edges deps
    edgeThickness,
    onEdgeThicknessChange,
    edgeOpacity,
    onEdgeOpacityChange,
    showEdgeLabels,
    onShowEdgeLabelsChange,
    edgeLabelFontSize,
    onEdgeLabelFontSizeChange,
    // Mutations deps
    showMutationMarkers,
    onShowMutationMarkersChange,
    mutationMarkerSize,
    onMutationMarkerSizeChange,
    // Stats deps
    firstDatasetStats,
    secondDatasetStats,
    performanceStats,
    filterSummary,
    onStatsExport,
    // Export deps
    onDownloadPNG,
    firstFilename,
    secondFilename,
    pngAvailable,
    isDownloading,
    onExportError,
    // Camera deps
    currentRotationX,
    currentRotationOrbit,
    currentZoom,
    onPresetSelect,
    onCenterView,
    autoRotationEnabled,
    onAutoRotationEnabledChange,
    autoRotationRate,
    onAutoRotationRateChange,
    // Spatial deps
    geographicMode,
    onGeographicModeChange,
    customShapeFile,
    onCustomShapeFileChange,
    geographicShapeOpacity,
    onGeographicShapeOpacityChange,
    isLoadingGeographic,
    temporalSpacing,
    onTemporalSpacingChange,
    temporalSpacingMode,
    onTemporalSpacingModeChange,
    spatialSpacing,
    onSpatialSpacingChange,
    temporalGridOpacity,
    onTemporalGridOpacityChange,
    heatmapSettings,
    onHeatmapSettingsChange,
    isTemporalFilterActive,
    unaryRetentionPercent,
    onUnaryRetentionPercentChange,
  ]);

  // Register 3D-specific keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    // Camera preset shortcuts (1-4)
    CAMERA_PRESETS.forEach((preset) => {
      if (preset.shortcut && onPresetSelect) {
        registerShortcut({
          key: preset.shortcut,
          action: () => onPresetSelect(preset),
          description: `Camera: ${preset.label} view`,
        });
      }
    });

    // Center view (0)
    if (onCenterView) {
      registerShortcut({
        key: '0',
        action: onCenterView,
        description: 'Center ARG in view',
      });
    }

    // Toggle auto-rotation (R)
    if (onAutoRotationEnabledChange) {
      registerShortcut({
        key: 'r',
        action: () => onAutoRotationEnabledChange(!autoRotationEnabled),
        description: 'Toggle auto-rotation',
      });
    }
  }, [
    enableKeyboardShortcuts,
    registerShortcut,
    onPresetSelect,
    onCenterView,
    onAutoRotationEnabledChange,
    autoRotationEnabled,
  ]);

  // Handle tab change
  const handleTabChange = useCallback((tabId: QuickActionTab | null) => {
    setActiveTab(tabId);
  }, []);

  // Handle help click
  const handleHelpClick = useCallback(() => {
    setHelpDialogOpen(true);
  }, []);

  // Handle help close
  const handleHelpClose = useCallback(() => {
    setHelpDialogOpen(false);
  }, []);

  // Custom shortcuts for help dialog (3D-specific ones that aren't auto-registered by QuickActionsBar)
  const customShortcuts: KeyboardShortcut[] = useMemo(() => {
    const shortcuts: KeyboardShortcut[] = [];

    // Camera preset shortcuts
    CAMERA_PRESETS.forEach((preset) => {
      if (preset.shortcut) {
        shortcuts.push({
          key: preset.shortcut,
          action: () => {},
          description: `Camera: ${preset.label} view`,
        });
      }
    });

    // Center view
    shortcuts.push({
      key: '0',
      action: () => {},
      description: 'Center ARG in view',
    });

    // Auto-rotation
    shortcuts.push({
      key: 'r',
      action: () => {},
      description: 'Toggle auto-rotation',
    });

    // Animation play/pause
    shortcuts.push({
      key: ' ',
      action: () => {},
      description: 'Play/Pause animation',
    });

    return shortcuts;
  }, []);

  return (
    <>
      <QuickActionsBar
        tabs={tabs}
        panels={panels}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        enableKeyboardShortcuts={enableKeyboardShortcuts}
        showShortcutHints={showShortcutHints}
        showHelpButton={true}
        onHelpClick={handleHelpClick}
        compact={compact}
        floating={floating}
        className={className}
      />
      <ShortcutHelpDialog
        open={helpDialogOpen}
        onClose={handleHelpClose}
        customShortcuts={customShortcuts}
      />
    </>
  );
};

export default SpatialArgDiffControls;
