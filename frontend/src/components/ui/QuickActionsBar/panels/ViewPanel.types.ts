/**
 * ViewPanel Type Definitions
 * 
 * Defines TypeScript interfaces for the View tab panel components,
 * which handle camera presets, layout controls, and animation settings
 * for both 2D and 3D visualizers.
 */

import { ReactNode } from 'react';

/**
 * Visualizer type determines which controls to show
 */
export type VisualizerType = '2d' | '3d' | 'diff';

/**
 * Camera preset options for 3D visualizers
 */
export type CameraPreset = 'fit' | 'medium' | 'far' | 'top' | 'side' | 'isometric' | 'custom';

/**
 * Layout preset options for 2D force-directed graph
 */
export type LayoutPreset = 
  | 'numeric'
  | 'first-tree'
  | 'center-tree'
  | 'consensus'
  | 'ancestral-path'
  | 'coalescence'
  | 'dagre';

/**
 * Temporal spacing mode for layouts
 */
export type TemporalSpacingMode = 'equal' | 'linear' | 'log';

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
 * Sample order type for layout
 */
export type SampleOrderType =
  | 'numeric'
  | 'first_minlex'
  | 'center_minlex'
  | 'consensus_minlex'
  | 'ancestral_path'
  | 'coalescence_minlex'
  | 'dagre';

/**
 * Layer reveal animation mode
 */
export type LayerRevealMode = 'hide' | 'glide' | 'root-to-samples';

/**
 * Camera preset configuration
 */
export interface CameraPresetConfig {
  /** Preset identifier */
  id: CameraPreset;
  /** Display label */
  label: string;
  /** Icon or emoji representation */
  icon: string;
  /** Description for tooltip */
  description: string;
  /** Camera settings to apply */
  settings: {
    zoom?: number;
    rotationX?: number;
    rotationOrbit?: number;
    target?: [number, number, number];
  };
}

/**
 * Layout preset configuration
 */
export interface LayoutPresetConfig {
  /** Preset identifier */
  id: LayoutPreset;
  /** Display label */
  label: string;
  /** Icon or emoji representation */
  icon: string;
  /** Description for tooltip */
  description: string;
  /** Whether this preset requires computation time */
  computeIntensive?: boolean;
}

/**
 * View mode toggle option (for show/hide elements)
 */
export interface ViewModeToggle {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Current state */
  enabled: boolean;
  /** Icon (optional) */
  icon?: ReactNode;
  /** Tooltip description */
  tooltip?: string;
  /** Whether toggle is disabled */
  disabled?: boolean;
}

/**
 * Animation control state
 */
export interface AnimationState {
  /** Whether animation is enabled */
  enabled: boolean;
  /** Whether animation is currently playing */
  isPlaying: boolean;
  /** Animation speed (0.1 to 10.0) */
  rate: number;
  /** Current progress (0 to 1) */
  progress: number;
  /** Animation mode */
  mode: LayerRevealMode;
}

/**
 * Props for ViewPanel component
 */
export interface ViewPanelProps {
  /** Type of visualizer (determines which controls to show) */
  visualizerType: VisualizerType;
  
  /** Current camera preset (3D only) */
  cameraPreset?: CameraPreset;
  /** Handler for camera preset change */
  onCameraPresetChange?: (preset: CameraPreset) => void;
  /** Current camera state (for preview) */
  cameraState?: {
    zoom: number;
    rotationX: number;
    rotationOrbit: number;
    target: [number, number, number];
  };
  
  /** Current layout preset (2D only) */
  layoutPreset?: LayoutPreset;
  /** Handler for layout preset change */
  onLayoutPresetChange?: (preset: LayoutPreset) => void;
  /** Edge crossing count (2D quality metric) */
  edgeCrossings?: number | null;
  /** Whether edge crossings are being calculated */
  isCalculatingEdgeCrossings?: boolean;
  
  /** View mode toggles (show/hide elements) */
  viewModeToggles?: ViewModeToggle[];
  /** Handler for toggle change */
  onViewModeToggleChange?: (toggleId: string, enabled: boolean) => void;
  
  /** Animation state */
  animationState?: AnimationState;
  /** Handler for animation control actions */
  onAnimationPlay?: () => void;
  onAnimationPause?: () => void;
  onAnimationReset?: () => void;
  onAnimationRateChange?: (rate: number) => void;
  onAnimationModeChange?: (mode: LayerRevealMode) => void;
  
  /** Auto-rotation state (3D only) */
  autoRotationEnabled?: boolean;
  autoRotationRate?: number;
  onAutoRotationToggle?: (enabled: boolean) => void;
  onAutoRotationRateChange?: (rate: number) => void;
  
  /** Spacing controls (2D only) */
  temporalSpacing?: number;
  sampleSpacing?: number;
  temporalSpacingMode?: TemporalSpacingMode;
  onTemporalSpacingChange?: (spacing: number) => void;
  onSampleSpacingChange?: (spacing: number) => void;
  onTemporalSpacingModeChange?: (mode: TemporalSpacingMode) => void;
  
  /** Simulation controls (2D only) */
  simulationPaused?: boolean;
  onSimulationPausedChange?: (paused: boolean) => void;
  onResetSimulation?: () => void;
  onUnpinAllNodes?: () => void;

  /** Sample order (2D only) */
  sampleOrder?: SampleOrderType;
  onSampleOrderChange?: (order: SampleOrderType) => void;

  /** Force tuning (2D only, advanced) */
  forceTuning?: ForceTuningSettings;
  onForceTuningChange?: (settings: ForceTuningSettings) => void;

  /** Clustering/Performance (2D only) */
  clusteringEnabled?: boolean;
  onClusteringEnabledChange?: (enabled: boolean) => void;

  /** Show Node IDs toggles (2D only) */
  nodeIdSettings?: {
    showSampleIds: boolean;
    showRootIds: boolean;
    showInternalIds: boolean;
  };
  onNodeIdSettingsChange?: (settings: { showSampleIds: boolean; showRootIds: boolean; showInternalIds: boolean }) => void;

  /** Show Edge Labels toggle (2D only) */
  showEdgeLabels?: boolean;
  onShowEdgeLabelsChange?: (show: boolean) => void;

  /** Show Mutation Markers toggle (2D only) */
  showMutationMarkers?: boolean;
  onShowMutationMarkersChange?: (show: boolean) => void;

  /** Custom className */
  className?: string;
}

/**
 * Props for CameraPresetPicker component
 */
export interface CameraPresetPickerProps {
  /** Available camera presets */
  presets: CameraPresetConfig[];
  /** Currently selected preset */
  currentPreset: CameraPreset;
  /** Handler for preset selection */
  onPresetSelect: (preset: CameraPreset) => void;
  /** Current camera state (for comparison) */
  currentState?: {
    zoom: number;
    rotationX: number;
    rotationOrbit: number;
  };
  /** Custom className */
  className?: string;
}

/**
 * Props for LayoutPresetPicker component
 */
export interface LayoutPresetPickerProps {
  /** Available layout presets */
  presets: LayoutPresetConfig[];
  /** Currently selected preset */
  currentPreset: LayoutPreset;
  /** Handler for preset selection */
  onPresetSelect: (preset: LayoutPreset) => void;
  /** Edge crossing count (quality metric) */
  edgeCrossings?: number | null;
  /** Whether edge crossings are being calculated */
  isCalculatingEdgeCrossings?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Props for ViewModeToggles component
 */
export interface ViewModeTogglesProps {
  /** Array of view mode toggles */
  toggles: ViewModeToggle[];
  /** Handler for toggle change */
  onToggleChange: (toggleId: string, enabled: boolean) => void;
  /** Whether to show as grid or list */
  layout?: 'grid' | 'list';
  /** Custom className */
  className?: string;
}

/**
 * Props for AnimationControls component
 */
export interface AnimationControlsProps {
  /** Animation state */
  state: AnimationState;
  /** Play/resume animation */
  onPlay: () => void;
  /** Pause animation */
  onPause: () => void;
  /** Reset animation to start */
  onReset: () => void;
  /** Change animation speed */
  onRateChange: (rate: number) => void;
  /** Change animation mode */
  onModeChange: (mode: LayerRevealMode) => void;
  /** Custom className */
  className?: string;
}

/**
 * Auto-rotation control props (3D only)
 */
export interface AutoRotationControlsProps {
  /** Whether auto-rotation is enabled */
  enabled: boolean;
  /** Rotation rate in degrees per second */
  rate: number;
  /** Handler for enable/disable */
  onToggle: (enabled: boolean) => void;
  /** Handler for rate change */
  onRateChange: (rate: number) => void;
  /** Custom className */
  className?: string;
}

/**
 * Spacing control props (2D only)
 */
export interface SpacingControlsProps {
  /** Temporal (vertical) spacing */
  temporalSpacing: number;
  /** Sample (horizontal) spacing */
  sampleSpacing: number;
  /** Temporal spacing mode */
  temporalSpacingMode: TemporalSpacingMode;
  /** Handlers */
  onTemporalSpacingChange: (spacing: number) => void;
  onSampleSpacingChange: (spacing: number) => void;
  onTemporalSpacingModeChange: (mode: TemporalSpacingMode) => void;
  /** Custom className */
  className?: string;
}





