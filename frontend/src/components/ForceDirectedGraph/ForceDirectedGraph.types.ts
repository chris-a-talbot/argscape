export interface GraphNode {
    id: number;
    time: number;
    is_sample: boolean;
    individual: number;
    timeIndex?: number;
    layer?: number;  // For layered layout
    degree?: number; // For connectivity-based positioning
    order_position?: number; // For sample ordering from backend
    location?: {
        x: number;
        y: number;
        z?: number;  // Optional Z coordinate for 3D locations
    };
    // D3 force simulation will add these properties
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
    // New properties for combined nodes
    is_combined?: boolean;
    combined_nodes?: number[]; // Array of original node IDs that were combined
    spatial_combine_only?: boolean; // True if combined only for spatial visualization (type 3)
    // tskit-compatible properties
    ts_flags?: number; // msprime node flags (e.g., NODE_IS_RE_EVENT)
    is_recombination?: boolean; // Whether this is a recombination node
    label?: string; // Node label (for combined nodes, shows "id1/id2/id3")
}

export interface GraphEdge {
    source: number | GraphNode;
    target: number | GraphNode;
    left: number;
    right: number;
    // tskit-compatible properties
    bounds?: string; // String representation of regions like "0-1 5-8 9-10"
    region_fraction?: number; // Fraction of chromosome covered by this edge
    has_mutations?: boolean; // Whether this edge has mutations within its genomic span
}

export interface TreeInterval {
    index: number;
    left: number;
    right: number;
}

export interface GeographicShape {
    type: string;
    coordinates: number[] | number[][] | number[][][] | number[][][][];
    name: string;
    bounds: [number, number, number, number];
    geometries?: Array<{
        type: string;
        coordinates: number[][];
    }>;
}

export interface CoordinateReferenceSystem {
    name: string;
    crs_string: string;
    bounds?: [number, number, number, number];
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    metadata: {
        num_nodes: number;
        num_edges: number;
        num_samples: number;
        sequence_length: number;
        is_subset: boolean;
        original_num_nodes: number;
        original_num_edges: number;
        genomic_start?: number;
        genomic_end?: number;
        num_local_trees?: number;
        tree_intervals?: TreeInterval[];
        expected_tree_count?: number;
        tree_count_mismatch?: boolean;
        sample_order?: string;
        // Geographic metadata
        coordinate_system?: string;
        geographic_shape?: GeographicShape;
        spatial_bounds?: [number, number, number, number];
        coordinate_system_detection?: {
            likely_crs: string;
            confidence: number;
            reasoning: string;
            bounds: [number, number, number, number] | null;
            coordinate_count: number;
            land_points: number;
            land_percentage: number;
            suggested_geographic_mode: string;
        };
        suggested_geographic_mode?: string;
    };
}

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

export type TemporalSpacingMode = 'equal' | 'log' | 'linear';

export type SampleOrderType = 'ancestral_path' | 'center_minlex' | 'first_tree' | 'custom' | 'numeric' | 'dagre' | 'coalescence';

export interface ForceDirectedGraphProps {
    data: GraphData | null;
    width?: number;
    height?: number;
    onNodeClick?: (node: GraphNode) => void;
    onNodeRightClick?: (node: GraphNode) => void;  // Right click handler for nodes
    onEdgeClick?: (edge: GraphEdge) => void;
    focalNode?: GraphNode | null;  // The node to focus on, if any
    nodeSizes?: NodeSizeSettings;  // Node size settings
    nodeIdSettings?: NodeIdSettings;  // Node ID visibility settings
    edgeLabelSettings?: EdgeLabelSettings;  // Edge label settings
    edgeMutationSettings?: EdgeMutationSettings;  // Edge mutation marker settings
    sampleOrder?: string;  // The ordering method for sample nodes
    edgeThickness?: number;  // Edge thickness setting
    edgeOpacity?: number;  // Edge opacity setting (0-100)
    temporalSpacingMode?: TemporalSpacingMode;
    temporalSpacing?: number;  // Temporal spacing factor for layer separation
    sampleSpacing?: number;  // Sample spacing factor for horizontal sample separation
} 