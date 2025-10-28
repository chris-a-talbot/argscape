export type TemporalSpacingMode = 'equal' | 'log' | 'linear';

export interface NodeSizeSettings {
    sample: number;
    root: number;
    other: number;
}

export interface NodeIdSettings {
    showSampleIds: boolean;
    showRootIds: boolean;
    showInternalIds: boolean;
}

export interface EdgeLabelSettings {
    showEdgeLabels: boolean;
    labelFontSize: number;
}

export interface EdgeMutationSettings {
    showMutationMarkers: boolean;
    markerSize: number;
}

export interface AncestryHeatmapSettings {
    enabled: boolean;
    timeDepth: number; // Time units to look back (as percentage of max time, 0-100) - DEPRECATED, use timeRangeMin/Max
    timeRangeMin: number; // Min time for heatmap (as percentage, 0-100)
    timeRangeMax: number; // Max time for heatmap (as percentage, 0-100)
    opacity: number; // Heatmap opacity (0-100)
    resolution: number; // Grid resolution for heatmap
    nodeVisibility: 'all' | 'samples' | 'none'; // Which nodes to show when heatmap is enabled
    weightByTime: boolean; // Down-weight older nodes (higher time/z) as less spatially informative than newer ones
}

export interface LabelConnectingLine3D {
    source: [number, number, number];
    target: [number, number, number];
    color: [number, number, number, number];
    width: number;
    labelId: string; // Unique identifier for the label this line connects to
    nodeId: number; // ID of the node this line connects to
}

export interface LabelPositionResult {
    position: [number, number, number];
    needsLine: boolean;
    connectionDistance: number; // Distance from label to node for line styling
} 