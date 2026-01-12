/**
 * Style Panel Type Definitions
 * 
 * Defines TypeScript interfaces for the Style tab panel components,
 * which control appearance settings like node size, edge thickness, colors, and theme.
 */

import { ColorTheme } from '../../../../context/ColorThemeContext';

/**
 * Visual slider configuration with real-time preview
 */
export interface SliderConfig {
  /** Slider label */
  label: string;
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step?: number;
  /** Unit label (e.g., "px", "%") */
  unit?: string;
  /** onChange handler */
  onChange: (value: number) => void;
  /** Optional disabled state */
  disabled?: boolean;
  /** Optional description */
  description?: string;
  /** Optional preview icon/visual */
  previewIcon?: React.ReactNode;
}

/**
 * Color-by mode options
 */
export type ColorByMode = 'time' | 'population' | 'type' | 'none';

/**
 * Color-by selector configuration
 */
export interface ColorBySelectorProps {
  /** Current selected mode */
  value: ColorByMode;
  /** Handler when mode changes */
  onChange: (mode: ColorByMode) => void;
  /** Optional: disable specific modes based on data availability */
  disabledModes?: ColorByMode[];
  /** Optional: show population mode even if no population data */
  showAllModes?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Theme toggle configuration
 */
export interface ThemeToggleProps {
  /** Current theme */
  value: ColorTheme;
  /** Handler when theme changes */
  onChange: (theme: ColorTheme) => void;
  /** Optional: show only specific themes */
  availableThemes?: ColorTheme[];
  /** Optional: compact mode (icons only) */
  compact?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Unified slider with visual feedback
 */
export interface UnifiedSliderProps extends Omit<SliderConfig, 'onChange'> {
  /** Value change handler */
  onChange: (value: number) => void;
  /** Optional: show value badge */
  showValue?: boolean;
  /** Optional: visual preview component */
  preview?: React.ReactNode;
  /** Optional className */
  className?: string;
  /** Compact mode for tighter layouts */
  compact?: boolean;
}

/**
 * Node size settings for different node types
 */
export interface NodeSizeSettings {
  sample: number;
  root: number;
  other: number;
}

/**
 * Node ID display settings
 */
export interface NodeIdSettings {
  showSampleIds: boolean;
  showRootIds: boolean;
  showInternalIds: boolean;
}

/**
 * Edge label settings
 */
export interface EdgeLabelSettings {
  showEdgeLabels: boolean;
  labelFontSize: number;
}

/**
 * Edge mutation marker settings
 */
export interface EdgeMutationSettings {
  showMutationMarkers: boolean;
  markerSize: number;
}

/**
 * Style panel props - aggregates all appearance controls
 */
export interface StylePanelProps {
  // Basic node appearance (single size for all)
  nodeSize?: number;
  onNodeSizeChange?: (size: number) => void;
  nodeSizeMin?: number;
  nodeSizeMax?: number;

  // Advanced node sizes (per type)
  nodeSizes?: NodeSizeSettings;
  onNodeSizesChange?: (sizes: NodeSizeSettings) => void;

  // Node ID visibility
  nodeIdSettings?: NodeIdSettings;
  onNodeIdSettingsChange?: (settings: NodeIdSettings) => void;

  // Node combining options
  combineInternalNodes?: boolean;
  onCombineInternalNodesChange?: (enabled: boolean) => void;
  combineSampleNodes?: boolean;
  onCombineSampleNodesChange?: (enabled: boolean) => void;

  // Edge appearance
  edgeThickness?: number;
  onEdgeThicknessChange?: (thickness: number) => void;
  edgeThicknessMin?: number;
  edgeThicknessMax?: number;

  edgeOpacity?: number;
  onEdgeOpacityChange?: (opacity: number) => void;

  // Edge labels
  edgeLabelSettings?: EdgeLabelSettings;
  onEdgeLabelSettingsChange?: (settings: EdgeLabelSettings) => void;

  // Mutation markers
  edgeMutationSettings?: EdgeMutationSettings;
  onEdgeMutationSettingsChange?: (settings: EdgeMutationSettings) => void;

  // Color mode
  colorBy?: ColorByMode;
  onColorByChange?: (mode: ColorByMode) => void;
  availableColorModes?: ColorByMode[];

  // Theme
  theme?: ColorTheme;
  onThemeChange?: (theme: ColorTheme) => void;
  availableThemes?: ColorTheme[];

  // Optional className
  className?: string;

  // Optional: additional custom controls
  children?: React.ReactNode;
}

/**
 * Visual preview size indicators for sliders
 */
export interface SizePreviewProps {
  /** Size value (relative) */
  size: number;
  /** Preview type */
  type: 'node' | 'edge';
  /** Optional className */
  className?: string;
}





