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
}

export interface GraphEdge {
    source: number | GraphNode;
    target: number | GraphNode;
    left: number;
    right: number;
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

export type TemporalSpacingMode = 'equal' | 'log' | 'linear';

export interface ForceDirectedGraphProps {
    data: GraphData | null;
    width?: number;
    height?: number;
    onNodeClick?: (node: GraphNode) => void;
    onNodeRightClick?: (node: GraphNode) => void;  // Right click handler for nodes
    onEdgeClick?: (edge: GraphEdge) => void;
    focalNode?: GraphNode | null;  // The node to focus on, if any
    nodeSizes?: NodeSizeSettings;  // Node size settings
    sampleOrder?: string;  // The ordering method for sample nodes
    edgeThickness?: number;  // Edge thickness setting
    temporalSpacingMode?: TemporalSpacingMode;
} 