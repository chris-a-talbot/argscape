/**
 * SpatialPanel Types
 *
 * Type definitions for the SpatialPanel component.
 * Provides geographic, spacing, and heatmap controls for 3D visualizers.
 */

export type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';
export type TemporalSpacingMode = 'equal' | 'log' | 'linear';
export type HeatmapNodeVisibility = 'all' | 'samples' | 'none';

export interface HeatmapSettings {
  enabled: boolean;
  timeDepth: number;
  timeRangeMin: number;
  timeRangeMax: number;
  opacity: number;
  resolution: number;
  nodeVisibility: HeatmapNodeVisibility;
  weightByTime: boolean;
}

export interface SpatialPanelProps {
  // Geographic settings
  geographicMode?: GeographicMode;
  onGeographicModeChange?: (mode: GeographicMode) => void;
  customShapeFile?: File | null;
  onCustomShapeFileChange?: (file: File | null) => void;
  geographicShapeOpacity?: number;
  onGeographicShapeOpacityChange?: (opacity: number) => void;
  isLoadingGeographic?: boolean;

  // Spacing settings
  temporalSpacing?: number;
  onTemporalSpacingChange?: (value: number) => void;
  temporalSpacingMode?: TemporalSpacingMode;
  onTemporalSpacingModeChange?: (mode: TemporalSpacingMode) => void;
  spatialSpacing?: number;
  onSpatialSpacingChange?: (value: number) => void;
  temporalGridOpacity?: number;
  onTemporalGridOpacityChange?: (value: number) => void;

  // Heatmap settings
  heatmapSettings?: HeatmapSettings;
  onHeatmapSettingsChange?: (settings: HeatmapSettings) => void;
  isTemporalFilterActive?: boolean;

  // Unary retention
  unaryRetentionPercent?: number;
  onUnaryRetentionPercentChange?: (value: number) => void;

  className?: string;
}
