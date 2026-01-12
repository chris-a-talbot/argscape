/**
 * NodesPanel Type Definitions
 *
 * Defines TypeScript interfaces for the Nodes tab panel,
 * which consolidates all node-related settings:
 * - Appearance (color by, sizes)
 * - Labels (show IDs)
 * - Behavior (combining, clustering)
 */

/**
 * Color-by mode options
 */
export type ColorByMode = 'time' | 'population' | 'type' | 'none';

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
 * Props for NodesPanel component
 */
export interface NodesPanelProps {
  // Color mode
  colorBy?: ColorByMode;
  onColorByChange?: (mode: ColorByMode) => void;
  availableColorModes?: ColorByMode[];

  // Node sizes (per type)
  nodeSizes?: NodeSizeSettings;
  onNodeSizesChange?: (sizes: NodeSizeSettings) => void;

  // Basic node size (single slider, alternative to per-type)
  nodeSize?: number;
  onNodeSizeChange?: (size: number) => void;
  nodeSizeMin?: number;
  nodeSizeMax?: number;

  // Node ID visibility
  nodeIdSettings?: NodeIdSettings;
  onNodeIdSettingsChange?: (settings: NodeIdSettings) => void;

  // Node combining options
  combineInternalNodes?: boolean;
  onCombineInternalNodesChange?: (enabled: boolean) => void;
  combineSampleNodes?: boolean;
  onCombineSampleNodesChange?: (enabled: boolean) => void;

  // Clustering/Performance
  clusteringEnabled?: boolean;
  onClusteringEnabledChange?: (enabled: boolean) => void;

  // Optional className
  className?: string;
}
