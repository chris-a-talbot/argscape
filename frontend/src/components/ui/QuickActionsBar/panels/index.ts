/**
 * Quick Actions Bar Panels
 *
 * Central export point for all panel components.
 * Panels use progressive disclosure to show essential controls by default,
 * with advanced options revealed on demand via MoreOptionsExpander.
 *
 * Object-based panel architecture:
 * - Filter: Genomic/temporal range filtering
 * - Nodes: Color by, sizes, labels, combining, clustering
 * - Edges: Width, opacity, labels
 * - Mutations: Marker size, labels
 * - Layout: Sample order, spacing, force tuning, simulation
 * - Stats: Node/edge counts, sequence stats, performance
 * - Export: PNG, SVG, tree sequence, statistics, locations
 */

// Filter Panel
export { FilterPanel } from './FilterPanel';
export { FilterGroup } from './FilterGroup';
export { FilterModeToggle } from './FilterModeToggle';
export { OpacitySlider } from './OpacitySlider';

// Nodes Panel (new object-based panel)
export { NodesPanel } from './NodesPanel';
export { ColorBySelector } from './ColorBySelector';
export { ThemeToggle } from './ThemeToggle';
export { UnifiedSlider, SizePreview } from './UnifiedSlider';

// Edges Panel (new object-based panel)
export { EdgesPanel } from './EdgesPanel';

// Mutations Panel (new object-based panel)
export { MutationsPanel } from './MutationsPanel';

// Layout Panel (new object-based panel)
export { LayoutPanel } from './LayoutPanel';

// Camera Panel (3D visualizer camera controls)
export { CameraPanel } from './CameraPanel';
export { CAMERA_PRESETS } from './CameraPanel.types';

// Spatial Panel (3D visualizer geographic, spacing, and heatmap controls)
export { SpatialPanel } from './SpatialPanel';

// Export Panel (enhanced with DownloadDropdown functionality)
export { ExportPanel } from './ExportPanel';
export { DiffExportPanel } from './DiffExportPanel';

// Stats Panel (for advanced information display)
export { StatsPanel } from './StatsPanel';
export { NodeEdgeCountDisplay } from './NodeEdgeCountDisplay';
export { SequenceStatsDisplay } from './SequenceStatsDisplay';
export { PerformanceStatsDisplay } from './PerformanceStatsDisplay';
export { FilterSummaryDisplay } from './FilterSummaryDisplay';
export { DiffStatsPanel } from './DiffStatsPanel';
export type { DiffStatsPanelProps } from './DiffStatsPanel';

// Diff Panel (diff visualizer controls)
export { DiffPanel } from './DiffPanel';

// Legacy panels (kept for backwards compatibility, use new panels for new code)
export { StylePanel } from './StylePanel';
export { ViewPanel } from './ViewPanel';
export { CameraPresetPicker, DEFAULT_CAMERA_PRESETS } from './CameraPresetPicker';
export { LayoutPresetPicker, DEFAULT_LAYOUT_PRESETS } from './LayoutPresetPicker';
export { ViewModeToggles } from './ViewModeToggles';
export { AnimationControls } from './AnimationControls';

// Types - Export from original type files (StylePanel and ViewPanel) for backwards compatibility
// New panel types re-export some of the same types, so we use explicit exports to avoid conflicts
export type * from './FilterPanel.types';
export type * from './StylePanel.types';
export type * from './ViewPanel.types';
export type * from './StatsPanel.types';
export type { ExportPanelProps } from './ExportPanel';
export type { DiffExportPanelProps } from './DiffExportPanel';

// New panel props types (avoiding duplicate type exports)
export type { NodesPanelProps } from './NodesPanel.types';
export type { EdgesPanelProps } from './EdgesPanel.types';
export type { MutationsPanelProps } from './MutationsPanel.types';
export type { LayoutPanelProps } from './LayoutPanel.types';
export type { CameraPanelProps, CameraPreset } from './CameraPanel.types';
export type {
  SpatialPanelProps,
  GeographicMode,
  TemporalSpacingMode,
  HeatmapSettings,
  HeatmapNodeVisibility,
} from './SpatialPanel.types';
export type { DiffPanelProps, DiffViewMode, DiffStats } from './DiffPanel';
