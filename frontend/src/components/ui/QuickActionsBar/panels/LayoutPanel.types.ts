/**
 * LayoutPanel Type Definitions
 *
 * Defines TypeScript interfaces for the Layout tab panel,
 * which consolidates all layout-related settings:
 * - Arrangement (sample order, temporal spacing mode)
 * - Spacing (vertical, horizontal)
 * - Simulation/Physics (force tuning, pause, reset, unpin)
 */

/**
 * Temporal spacing mode for layouts
 */
export type TemporalSpacingMode = 'equal' | 'linear' | 'log';

/**
 * Sample order type for layout
 */
export type SampleOrderType =
  | 'numeric'
  | 'first_minlex'
  | 'center_minlex'
  | 'consensus_minlex'
  | 'ancestral_path'
  | 'coalescence'
  | 'dagre';

/**
 * Force simulation tuning parameters
 */
export interface ForceTuningSettings {
  chargeScale: number;
  linkStrengthScale: number;
  xStrengthScale: number;
  yStrengthScale: number;
  collisionRadiusScale: number;
  collisionStrength: number;
  edgeCrossingScale: number;
  edgeBundlingScale: number;
  descendantRangeScale: number;
}

/**
 * Props for LayoutPanel component
 */
export interface LayoutPanelProps {
  // Sample order
  sampleOrder?: SampleOrderType;
  onSampleOrderChange?: (order: SampleOrderType) => void;
  edgeCrossings?: number | null;
  isCalculatingEdgeCrossings?: boolean;

  // Temporal spacing mode
  temporalSpacingMode?: TemporalSpacingMode;
  onTemporalSpacingModeChange?: (mode: TemporalSpacingMode) => void;

  // Spacing controls
  temporalSpacing?: number;
  sampleSpacing?: number;
  onTemporalSpacingChange?: (spacing: number) => void;
  onSampleSpacingChange?: (spacing: number) => void;

  // Force tuning
  forceTuning?: ForceTuningSettings;
  onForceTuningChange?: (settings: ForceTuningSettings) => void;

  // Simulation controls
  simulationPaused?: boolean;
  onSimulationPausedChange?: (paused: boolean) => void;
  onResetSimulation?: () => void;
  onUnpinAllNodes?: () => void;

  // Optional className
  className?: string;
}
