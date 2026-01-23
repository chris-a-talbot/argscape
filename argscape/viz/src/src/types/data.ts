export interface GraphNode {
  id: number
  original_id: number  // Original node ID before subsetting (same as id if no subset)
  time: number
  is_sample: boolean
  is_root: boolean
  population: number | null
  location: [number, number] | [number, number, number] | null
  order_position: number | null
  // Original coordinates before normalization (for tooltip display)
  original_location?: [number, number] | [number, number, number] | null
}

export interface MutationData {
  id: string
  site: number
  position: number
  node: number
  time: number | null
  ancestral_state: string
  previous_state: string
  derived_state: string
}

export interface GraphEdge {
  source: number
  target: number
  left: number
  right: number
  has_mutations: boolean
  mutations: MutationData[] | null
}

export interface TreeInterval {
  index: number
  left: number
  right: number
}

export interface PopGenStats {
  nucleotide_diversity?: number | null
  wattersons_theta?: number | null
  tajimas_d?: number | null
  segregating_sites?: number | null
  tmrca?: number | null
  mean_tree_height?: number | null
  median_tree_height?: number | null
  mean_tree_length?: number | null
  median_tree_length?: number | null
  ne_watterson?: number | null
  ne_pi?: number | null
  estimated_recombination_rate?: number | null
}

export interface GraphMetadata {
  num_nodes: number
  num_edges: number
  num_samples: number
  num_trees: number
  num_mutations: number
  sequence_length: number
  is_subset: boolean
  sample_order: string
  original_num_samples?: number
  original_num_nodes?: number
  // Pre-computed sample orderings for all algorithms
  // Maps ordering name (e.g., "consensus_minlex") to {sampleId: position}
  // Note: JSON keys are always strings, so sampleId is string not number
  sample_orderings?: Record<string, Record<string, number>>
  // Filter metadata
  tree_intervals: TreeInterval[]
  min_time: number
  max_time: number
  // Population genetics statistics
  popgen_stats?: PopGenStats
  // Geographic/CRS metadata
  location_crs?: string | null
  location_bounds?: [number, number, number, number] | null
  // Population data
  has_populations?: boolean
  populations?: number[]
}

// Geographic shape for 3D visualization overlays
export interface GeographicGeometry {
  type: string
  coordinates: number[][] | number[][][] | number[][][][]
}

export interface GeographicShape {
  type: string
  name?: string
  bounds: [number, number, number, number]  // [minX, minY, maxX, maxY]
  crs?: string | null
  geometries?: GeographicGeometry[]
  coordinates?: number[][] | number[][][] | number[][][][]
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  metadata: GraphMetadata
  geographic_shape?: GeographicShape | null
}
