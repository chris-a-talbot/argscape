// Unified node type that works for both API data and D3 force simulation
// Extends d3.SimulationNodeDatum to add vx, vy, and index properties for D3 compatibility
export interface GraphNode extends d3.SimulationNodeDatum {
    id: number;
    time: number;
    is_sample: boolean;
    individual: number;
    population?: number | null; // Population ID from tskit
    population_inferred?: boolean; // Whether population was inferred for internal node
    timeIndex?: number;
    layer?: number;  // For layered layout
    degree?: number; // For connectivity-based positioning
    order_position?: number; // For sample ordering from backend
    location?: {
        x: number;
        y: number;
        z?: number;  // Optional Z coordinate for 3D locations
    };
    // D3 force simulation properties (from SimulationNodeDatum: vx, vy, index are inherited)
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
    // New properties for combined nodes
    is_combined?: boolean;
    combined_nodes?: number[]; // Array of original node IDs that were combined
    spatial_combine_only?: boolean; // True if combined only for spatial visualization (type 3)
    // Clustering properties
    is_cluster?: boolean; // True if this is a cluster node representing multiple nodes
    is_sample_cluster?: boolean; // True if this is a cluster of consecutive sample nodes
    cluster_nodes?: number[]; // Array of node IDs contained in this cluster
    cluster_size?: number; // Number of nodes in the cluster
    cluster_depth?: number; // Maximum depth of the subtree in this cluster
    cluster_samples?: number; // Number of sample nodes descended from this cluster
    // tskit-compatible properties
    ts_flags?: number; // msprime node flags (e.g., NODE_IS_RE_EVENT)
    is_recombination?: boolean; // Whether this is a recombination node
    label?: string; // Node label (for combined nodes, shows "id1/id2/id3")
    // Runtime properties for D3 simulation and layout algorithms
    dagreX?: number; // For dagre-based ordering within layers
    // Properties for spacing preservation
    originalX?: number; // Store original position for spacing calculations
    originalY?: number; // Store original position for spacing calculations
    // Properties for simulation pinning tracking
    __autoPinnedX?: boolean;
    __autoPinnedY?: boolean;
}

// Backward compatibility: Node is now an alias for GraphNode
export type Node = GraphNode;

export interface MutationDetail {
    id: string; // Format: <previous_state><position><new_state>
    mutation_tskit_id: number;
    site: number;
    position: number;
    node: number;
    time: number | null;
    ancestral_state: string;
    previous_state: string;
    derived_state: string;
    parent_mutation: number; // -1 if no parent
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
    mutations?: MutationDetail[]; // Detailed mutation information
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
        // Population metadata
        has_populations?: boolean;
        populations?: number[];
        // Additional sequence statistics
        num_mutations?: number;
        num_individuals?: number;
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
    markerSize: number;
}

export type TemporalSpacingMode = 'equal' | 'log' | 'linear';

export type SampleOrderType = 'ancestral_path' | 'center_minlex' | 'first_minlex' | 'consensus_minlex' | 'numeric' | 'dagre' | 'coalescence';

export interface ForceTuningSettings {
    chargeScale: number;            // Multiplier for many-body charge strength
    linkStrengthScale: number;      // Multiplier for link force strength
    xStrengthScale: number;         // Multiplier for x-positioning force strength
    yStrengthScale: number;         // Multiplier for y-positioning force strength
    collisionRadiusScale: number;   // Multiplier for collision radius
    collisionStrength: number;      // Absolute collision force strength (0..1)
    edgeCrossingScale: number;      // Multiplier for edge crossing repulsion
    edgeBundlingScale: number;      // Multiplier for edge bundling strength
    descendantRangeScale: number;   // Multiplier for descendant range nudging
}

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
    colorByPopulation?: boolean;  // Color nodes by population
    sampleOrder?: string;  // The ordering method for sample nodes
    edgeThickness?: number;  // Edge thickness setting
    edgeOpacity?: number;  // Edge opacity setting (0-100)
    temporalSpacingMode?: TemporalSpacingMode;
    temporalSpacing?: number;  // Temporal spacing factor for layer separation
    sampleSpacing?: number;  // Sample spacing factor for horizontal sample separation
    temporalRange?: [number, number];  // Optional temporal range filter [minTime, maxTime]
    // Opacity to use for visually dimmed (out-of-range) elements during temporal filtering (0.0 - 0.99)
    temporalDimOpacity?: number;
    genomicRange?: [number, number];  // Optional genomic range filter [left, right] for dimming mode
    // Opacity to use for visually dimmed (out-of-range) elements during genomic filtering (0.0 - 0.99)
    genomicDimOpacity?: number;
    treeRange?: [number, number];  // Optional tree range filter [startIdx, endIdx] for dimming mode
    treeIntervals?: TreeInterval[];  // Tree intervals for checking tree range overlap
    // Opacity to use for visually dimmed (out-of-range) elements during tree filtering (0.0 - 0.99)
    treeDimOpacity?: number;
    simulationPaused?: boolean;  // Pause the force simulation (e.g., during layer reveal)
    unpinTrigger?: number;  // Counter that triggers unpinning of all nodes when it changes
    onEdgeCrossingsChange?: (count: number) => void;  // Callback when edge crossings are calculated
    forceTuning?: ForceTuningSettings; // Optional runtime tuning of force strengths
    resetTrigger?: number; // Counter that triggers a full simulation reset without changing sample order
    clusteringEnabled?: boolean;  // Enable clustering of dense subtrees
    clusteringMinTreeSize?: number;  // Minimum subtree size to cluster (default: 3)
    clusteringRequireDensity?: boolean;  // Require density check (default: false)
    clusteringDensityIntensity?: number;  // Intensity of density requirement (0=no effect, 1=max effect, default 0.5)
    clusteringRequireTemporalCompactness?: boolean;  // Require temporal compactness check (default: true)
    clusteringTemporalIntensity?: number;  // Intensity of temporal compactness (0=no effect, 1=max effect, default 0.5)
    clusteringMaxSampleClusterSize?: number;  // Maximum number of samples per sample cluster (default: 25)
    combineInternalNodes?: boolean;  // Enable combining of internal nodes (default: false)
    combineSampleNodes?: boolean;  // Enable combining of sample nodes (default: true)
} 

// Add type for simulation
export type Simulation = d3.Simulation<GraphNode, undefined>;

// export interface Node extends d3.SimulationNodeDatum {
//     id: number;
//     time: number;
//     is_sample: boolean;
//     individual: number;  // Added from GraphNode
//     location?: {         // Added spatial location from GraphNode
//         x: number;
//         y: number;
//         z?: number;
//     };
//     x?: number;
//     y?: number;
//     fx?: number | null;
//     fy?: number | null;
//     timeIndex?: number;
//     layer?: number;  // For layered layout
//     degree?: number; // For connectivity-based positioning
//     order_position?: number; // For sample ordering from backend
//     // Properties for combined nodes
//     is_combined?: boolean;
//     combined_nodes?: number[]; // Array of original node IDs that were combined
//     label?: string; // Node label (for combined nodes, shows "id1/id2/id3")
//     dagreX?: number; // For dagre-based ordering within layers
//     // Properties for spacing preservation
//     originalX?: number; // Store original position for spacing calculations
//     originalY?: number; // Store original position for spacing calculations
//     // Properties for simulation pinning tracking
//     __autoPinnedX?: boolean;
//     __autoPinnedY?: boolean;
//     // Clustering properties
//     is_cluster?: boolean;
//     is_sample_cluster?: boolean;
//     cluster_nodes?: number[];
//     cluster_size?: number;
//     cluster_depth?: number;
//     cluster_samples?: number;
// }