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