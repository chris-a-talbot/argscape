/**
 * ForceDirectedGraphControls Component
 *
 * QuickActionsBar integration for the Force-Directed Graph visualizer.
 * Uses the new object-based panel architecture.
 *
 * Tabs (text-only, no icons):
 * - Filter: Genomic/tree/temporal filtering with subset/highlight modes
 * - Nodes: Color by, sizes, labels, combining, clustering
 * - Edges: Width, opacity, labels
 * - Mutations: Marker size, labels
 * - Layout: Sample order, spacing, force tuning, simulation controls
 * - Stats: Node/edge counts, sequence stats
 * - Export: PNG/SVG, tree sequence, statistics, locations
 */

import React, { useState, useCallback } from 'react';
import { QuickActionsBar } from '@/components/ui/QuickActionsBar/QuickActionsBar';
import { FilterPanel } from '@/components/ui/QuickActionsBar/panels/FilterPanel';
import { NodesPanel } from '@/components/ui/QuickActionsBar/panels/NodesPanel';
import { EdgesPanel } from '@/components/ui/QuickActionsBar/panels/EdgesPanel';
import { MutationsPanel } from '@/components/ui/QuickActionsBar/panels/MutationsPanel';
import { LayoutPanel } from '@/components/ui/QuickActionsBar/panels/LayoutPanel';
import { StatsPanel } from '@/components/ui/QuickActionsBar/panels/StatsPanel';
import { ExportPanel } from '@/components/ui/QuickActionsBar/panels/ExportPanel';
import { ShortcutHelpDialog } from '@/components/ui/QuickActionsBar/ShortcutHelpDialog';
import type { TabConfig, PanelConfig, QuickActionTab } from '@/components/ui/QuickActionsBar/QuickActionsBar.types';
import type { FilterMode } from '@/components/ui/QuickActionsBar/panels/FilterPanel.types';
import type { ColorByMode, NodeSizeSettings, NodeIdSettings, EdgeLabelSettings, EdgeMutationSettings } from '@/components/ui/QuickActionsBar/panels/StylePanel.types';
import type { TemporalSpacingMode, SampleOrderType, ForceTuningSettings } from '@/components/ui/QuickActionsBar/panels/ViewPanel.types';
import type { NodeEdgeStats, SequenceStats, PerformanceStats, FilterSummary, PopGenStats } from '@/components/ui/QuickActionsBar/panels/StatsPanel.types';

export interface ForceDirectedGraphControlsProps {
  // Filtering
  sequenceLength: number;
  treeIntervals: Array<{ index: number; left: number; right: number }>;
  genomicRange: [number, number];
  treeRange: [number, number];
  onGenomicRangeChange: (range: [number, number]) => void;
  onTreeRangeChange: (range: [number, number]) => void;
  filterMode: 'genomic' | 'tree';
  onFilterModeChange: (mode: 'genomic' | 'tree') => void;
  genomicFilterMode: FilterMode;
  treeFilterMode: FilterMode;
  onGenomicFilterModeChange: (mode: FilterMode) => void;
  onTreeFilterModeChange: (mode: FilterMode) => void;
  genomicDimOpacity: number;
  treeDimOpacity: number;
  onGenomicDimOpacityChange: (opacity: number) => void;
  onTreeDimOpacityChange: (opacity: number) => void;
  isFilterActive: boolean;

  // Filter toggles (controls whether sliders appear alongside viz)
  spatialFilterEnabled?: boolean;
  onSpatialFilterToggle?: (enabled: boolean) => void;
  temporalFilterEnabled?: boolean;
  onTemporalFilterToggle?: (enabled: boolean) => void;

  // Temporal filtering (advanced)
  temporalState?: {
    isActive: boolean;
    range: [number, number];
    minTime: number;
    maxTime: number;
  };
  onTemporalRangeChange?: (range: [number, number]) => void;
  temporalFilterMode?: FilterMode;
  onTemporalFilterModeChange?: (mode: FilterMode) => void;
  temporalDimOpacity?: number;
  onTemporalDimOpacityChange?: (opacity: number) => void;

  // Styling - basic
  colorByPopulation: boolean;
  onColorByPopulationChange: (enabled: boolean) => void;
  hasPopulations?: boolean;
  edgeThickness: number;
  onEdgeThicknessChange: (thickness: number) => void;
  edgeOpacity: number;
  onEdgeOpacityChange: (opacity: number) => void;

  // Styling - advanced node sizes
  nodeSizes?: NodeSizeSettings;
  onNodeSizesChange?: (sizes: NodeSizeSettings) => void;

  // Styling - node IDs
  nodeIdSettings?: NodeIdSettings;
  onNodeIdSettingsChange?: (settings: NodeIdSettings) => void;

  // Styling - node combining
  combineInternalNodes?: boolean;
  onCombineInternalNodesChange?: (enabled: boolean) => void;
  combineSampleNodes?: boolean;
  onCombineSampleNodesChange?: (enabled: boolean) => void;

  // Styling - edge labels
  edgeLabelSettings?: EdgeLabelSettings;
  onEdgeLabelSettingsChange?: (settings: EdgeLabelSettings) => void;

  // Styling - mutation markers
  edgeMutationSettings?: EdgeMutationSettings;
  onEdgeMutationSettingsChange?: (settings: EdgeMutationSettings) => void;

  // Layout / Sample Order
  sampleOrder?: SampleOrderType;
  onSampleOrderChange?: (order: SampleOrderType) => void;
  layoutPreset: string;
  onLayoutPresetChange: (preset: string) => void;
  edgeCrossings?: number | null;
  isCalculatingEdgeCrossings?: boolean;

  // Spacing
  temporalSpacing: number;
  sampleSpacing: number;
  temporalSpacingMode?: TemporalSpacingMode;
  onTemporalSpacingChange: (spacing: number) => void;
  onSampleSpacingChange: (spacing: number) => void;
  onTemporalSpacingModeChange?: (mode: TemporalSpacingMode) => void;

  // Force Tuning
  forceTuning?: ForceTuningSettings;
  onForceTuningChange?: (settings: ForceTuningSettings) => void;

  // Simulation
  simulationPaused: boolean;
  onSimulationPausedChange: (paused: boolean) => void;
  onResetSimulation: () => void;
  onUnpinAllNodes: () => void;

  // Animation
  layerRevealEnabled?: boolean;
  layerRevealRate?: number;
  onLayerRevealPlay?: () => void;
  onLayerRevealPause?: () => void;
  onLayerRevealReset?: () => void;
  onLayerRevealRateChange?: (rate: number) => void;

  // Stats
  nodeEdgeStats?: NodeEdgeStats;
  sequenceStats?: SequenceStats;
  popGenStats?: PopGenStats | null;
  windowPopGenStats?: PopGenStats | null;
  windowStatsLoading?: boolean;
  isGenomicFilterActive?: boolean;
  performanceStats?: PerformanceStats;
  filterSummary?: FilterSummary;

  // Clustering/Performance
  clusteringEnabled?: boolean;
  onClusteringEnabledChange?: (enabled: boolean) => void;

  // Export
  filename?: string;
  onDownloadPNG?: () => void;
  onDownloadSVG?: () => void;
  onError?: (error: Error) => void;

  // Layout
  floating?: boolean;
}

export const ForceDirectedGraphControls: React.FC<ForceDirectedGraphControlsProps> = ({
  // Filtering
  sequenceLength,
  treeIntervals,
  genomicRange,
  treeRange,
  onGenomicRangeChange,
  onTreeRangeChange,
  filterMode,
  onFilterModeChange,
  genomicFilterMode,
  treeFilterMode,
  onGenomicFilterModeChange,
  onTreeFilterModeChange,
  genomicDimOpacity,
  treeDimOpacity,
  onGenomicDimOpacityChange,
  onTreeDimOpacityChange,
  isFilterActive,

  // Filter toggles
  spatialFilterEnabled = false,
  onSpatialFilterToggle,
  temporalFilterEnabled = false,
  onTemporalFilterToggle,

  // Temporal
  temporalState,
  onTemporalRangeChange,
  temporalFilterMode = 'highlight',
  onTemporalFilterModeChange,
  temporalDimOpacity = 0.05,
  onTemporalDimOpacityChange,

  // Styling - basic
  colorByPopulation,
  onColorByPopulationChange,
  hasPopulations,
  edgeThickness,
  onEdgeThicknessChange,
  edgeOpacity,
  onEdgeOpacityChange,

  // Styling - advanced
  nodeSizes,
  onNodeSizesChange,
  nodeIdSettings,
  onNodeIdSettingsChange,
  combineInternalNodes,
  onCombineInternalNodesChange,
  combineSampleNodes,
  onCombineSampleNodesChange,
  edgeLabelSettings,
  onEdgeLabelSettingsChange,
  edgeMutationSettings,
  onEdgeMutationSettingsChange,

  // Layout / Sample Order
  sampleOrder = 'consensus_minlex',
  onSampleOrderChange,
  edgeCrossings,
  isCalculatingEdgeCrossings,

  // Spacing
  temporalSpacing,
  sampleSpacing,
  temporalSpacingMode = 'equal',
  onTemporalSpacingChange,
  onSampleSpacingChange,
  onTemporalSpacingModeChange,

  // Force Tuning
  forceTuning,
  onForceTuningChange,

  // Simulation
  simulationPaused,
  onSimulationPausedChange,
  onResetSimulation,
  onUnpinAllNodes,

  // Stats
  nodeEdgeStats,
  sequenceStats,
  popGenStats,
  windowPopGenStats,
  windowStatsLoading = false,
  isGenomicFilterActive = false,
  performanceStats,
  filterSummary,

  // Clustering
  clusteringEnabled = false,
  onClusteringEnabledChange,

  // Export
  filename,
  onDownloadPNG,
  onDownloadSVG,
  onError,

  // Layout
  floating = false,
}) => {
  const [activeTab, setActiveTab] = useState<QuickActionTab | null>(null);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Format genomic position
  const formatGenomicPosition = useCallback((value: number): string => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}Mb`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}kb`;
    return `${value}bp`;
  }, []);

  // Determine current filter mode for the FilterPanel
  const currentFilterMode: FilterMode =
    filterMode === 'genomic' ? genomicFilterMode : treeFilterMode;
  const currentDimOpacity = filterMode === 'genomic' ? genomicDimOpacity : treeDimOpacity;

  const handleFilterModeChange = useCallback(
    (mode: FilterMode) => {
      if (filterMode === 'genomic') {
        onGenomicFilterModeChange(mode);
      } else {
        onTreeFilterModeChange(mode);
      }
    },
    [filterMode, onGenomicFilterModeChange, onTreeFilterModeChange]
  );

  const handleDimOpacityChange = useCallback(
    (opacity: number) => {
      if (filterMode === 'genomic') {
        onGenomicDimOpacityChange(opacity);
      } else {
        onTreeDimOpacityChange(opacity);
      }
    },
    [filterMode, onGenomicDimOpacityChange, onTreeDimOpacityChange]
  );

  // Color-by mode conversion
  const colorByMode: ColorByMode = colorByPopulation ? 'population' : 'type';
  const handleColorByChange = useCallback(
    (mode: ColorByMode) => {
      onColorByPopulationChange(mode === 'population');
    },
    [onColorByPopulationChange]
  );

  // Tab configurations (text-only, no icons)
  const tabs: TabConfig[] = [
    {
      id: 'filter',
      label: 'Filter',
      shortcut: 'f',
      ariaLabel: 'Filter controls',
      badge: isFilterActive ? 1 : undefined,
    },
    {
      id: 'nodes',
      label: 'Nodes',
      shortcut: 'n',
      ariaLabel: 'Node controls',
    },
    {
      id: 'edges',
      label: 'Edges',
      shortcut: 'e',
      ariaLabel: 'Edge controls',
    },
    {
      id: 'mutations',
      label: 'Mutations',
      shortcut: 'm',
      ariaLabel: 'Mutation controls',
    },
    {
      id: 'layout',
      label: 'Layout',
      shortcut: 'l',
      ariaLabel: 'Layout controls',
    },
    {
      id: 'stats',
      label: 'Stats',
      shortcut: 'i',
      ariaLabel: 'Statistics',
    },
    {
      id: 'export',
      label: 'Export',
      shortcut: 'x',
      ariaLabel: 'Export options',
    },
  ];

  // Panel configurations
  const panels: PanelConfig[] = [
    {
      tabId: 'filter',
      content: (
        <FilterPanel
          genomicFilter={
            sequenceLength > 0
              ? {
                  enabled: true,
                  sequenceLength,
                  value: genomicRange,
                  onChange: onGenomicRangeChange,
                  formatValue: formatGenomicPosition,
                }
              : undefined
          }
          treeFilter={
            treeIntervals.length > 0
              ? {
                  enabled: true,
                  treeIntervals,
                  value: treeRange,
                  onChange: onTreeRangeChange,
                }
              : undefined
          }
          temporalFilter={
            temporalState && temporalState.maxTime > temporalState.minTime
              ? {
                  enabled: true,
                  min: temporalState.minTime,
                  max: temporalState.maxTime,
                  value: temporalState.range,
                  onChange: onTemporalRangeChange || (() => {}),
                  formatValue: (v) => v.toFixed(0),
                }
              : undefined
          }
          filterType={filterMode}
          onFilterTypeChange={onFilterModeChange}
          spatialFilterEnabled={spatialFilterEnabled}
          onSpatialFilterToggle={onSpatialFilterToggle}
          temporalFilterEnabled={temporalFilterEnabled}
          onTemporalFilterToggle={onTemporalFilterToggle}
          filterMode={currentFilterMode}
          onFilterModeChange={handleFilterModeChange}
          dimOpacity={currentDimOpacity}
          onDimOpacityChange={handleDimOpacityChange}
          temporalFilterMode={temporalFilterMode}
          onTemporalFilterModeChange={onTemporalFilterModeChange}
          temporalDimOpacity={temporalDimOpacity}
          onTemporalDimOpacityChange={onTemporalDimOpacityChange}
        />
      ),
      defaultHeight: 350,
    },
    {
      tabId: 'nodes',
      content: (
        <NodesPanel
          colorBy={colorByMode}
          onColorByChange={handleColorByChange}
          availableColorModes={hasPopulations ? ['time', 'population', 'type'] : ['time', 'type']}
          nodeSizes={nodeSizes}
          onNodeSizesChange={onNodeSizesChange}
          nodeIdSettings={nodeIdSettings}
          onNodeIdSettingsChange={onNodeIdSettingsChange}
          combineInternalNodes={combineInternalNodes}
          onCombineInternalNodesChange={onCombineInternalNodesChange}
          combineSampleNodes={combineSampleNodes}
          onCombineSampleNodesChange={onCombineSampleNodesChange}
          clusteringEnabled={clusteringEnabled}
          onClusteringEnabledChange={onClusteringEnabledChange}
        />
      ),
      defaultHeight: 400,
    },
    {
      tabId: 'edges',
      content: (
        <EdgesPanel
          edgeThickness={edgeThickness}
          onEdgeThicknessChange={onEdgeThicknessChange}
          edgeOpacity={edgeOpacity}
          onEdgeOpacityChange={onEdgeOpacityChange}
          showEdgeLabels={edgeLabelSettings?.showEdgeLabels}
          onShowEdgeLabelsChange={
            edgeLabelSettings && onEdgeLabelSettingsChange
              ? (show) => onEdgeLabelSettingsChange({ ...edgeLabelSettings, showEdgeLabels: show })
              : undefined
          }
          edgeLabelFontSize={edgeLabelSettings?.labelFontSize}
          onEdgeLabelFontSizeChange={
            edgeLabelSettings && onEdgeLabelSettingsChange
              ? (size) => onEdgeLabelSettingsChange({ ...edgeLabelSettings, labelFontSize: size })
              : undefined
          }
        />
      ),
      defaultHeight: 250,
    },
    {
      tabId: 'mutations',
      content: (
        <MutationsPanel
          showMutationMarkers={edgeMutationSettings?.showMutationMarkers}
          onShowMutationMarkersChange={
            edgeMutationSettings && onEdgeMutationSettingsChange
              ? (show) =>
                  onEdgeMutationSettingsChange({
                    ...edgeMutationSettings,
                    showMutationMarkers: show,
                  })
              : undefined
          }
          mutationMarkerSize={edgeMutationSettings?.markerSize}
          onMutationMarkerSizeChange={
            edgeMutationSettings && onEdgeMutationSettingsChange
              ? (size) =>
                  onEdgeMutationSettingsChange({ ...edgeMutationSettings, markerSize: size })
              : undefined
          }
        />
      ),
      defaultHeight: 200,
    },
    {
      tabId: 'layout',
      content: (
        <LayoutPanel
          sampleOrder={sampleOrder}
          onSampleOrderChange={onSampleOrderChange}
          edgeCrossings={edgeCrossings}
          isCalculatingEdgeCrossings={isCalculatingEdgeCrossings}
          temporalSpacingMode={temporalSpacingMode}
          onTemporalSpacingModeChange={onTemporalSpacingModeChange}
          temporalSpacing={temporalSpacing}
          sampleSpacing={sampleSpacing}
          onTemporalSpacingChange={onTemporalSpacingChange}
          onSampleSpacingChange={onSampleSpacingChange}
          forceTuning={forceTuning}
          onForceTuningChange={onForceTuningChange}
          simulationPaused={simulationPaused}
          onSimulationPausedChange={onSimulationPausedChange}
          onResetSimulation={onResetSimulation}
          onUnpinAllNodes={onUnpinAllNodes}
        />
      ),
      defaultHeight: 450,
    },
    {
      tabId: 'stats',
      content:
        nodeEdgeStats && sequenceStats ? (
          <StatsPanel
            nodeEdgeStats={nodeEdgeStats}
            sequenceStats={sequenceStats}
            popGenStats={popGenStats}
            windowPopGenStats={windowPopGenStats}
            windowStatsLoading={windowStatsLoading}
            isGenomicFilterActive={isGenomicFilterActive}
            performanceStats={performanceStats}
            filterSummary={filterSummary}
            showExport={false}
            showPerformance={false}
          />
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
            Loading statistics...
          </div>
        ),
      defaultHeight: 400,
      defaultWidth: 340,
    },
    {
      tabId: 'export',
      content: (
        <ExportPanel
          filename={filename}
          onDownloadPNG={onDownloadPNG}
          onDownloadSVG={onDownloadSVG}
          pngAvailable={!!onDownloadPNG}
          svgAvailable={!!onDownloadSVG}
          onError={onError}
        />
      ),
      defaultHeight: 450,
    },
  ];

  return (
    <>
      <QuickActionsBar
        tabs={tabs}
        panels={panels}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        enableKeyboardShortcuts={true}
        showShortcutHints={false}
        showHelpButton={!floating}
        onHelpClick={() => setShowHelpDialog(true)}
        floating={floating}
      />
      <ShortcutHelpDialog isOpen={showHelpDialog} onClose={() => setShowHelpDialog(false)} />
    </>
  );
};

export default ForceDirectedGraphControls;
