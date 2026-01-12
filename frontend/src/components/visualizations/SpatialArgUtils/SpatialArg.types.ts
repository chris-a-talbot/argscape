import { GraphNode } from "../ForceDirectedGraph/ForceDirectedGraph.types";

export interface Node3D extends GraphNode {
    position: [number, number, number];
    color: [number, number, number, number];
    size: number;
    is_combined?: boolean;
    combined_nodes?: number[];
  }
  
export interface AncestorLocation {
    x: number;
    y: number;
    generation: number; // How many generations back
}

export interface HeatmapCell {
    x: number;
    y: number;
    density: number;
    normalizedDensity: number; // 0 to 1
}

export interface HeatmapGrid {
    cells: HeatmapCell[];
    gridSize: number;
    bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
}

export type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';

export interface EdgeLabel3D {
    position: [number, number, number];
    text: string;
    color: [number, number, number, number];
    size: number;
    sourceId: number;
    targetId: number;
}
  
export interface MutationDetail {
    id: string;
    mutation_tskit_id: number;
    site: number;
    position: number;
    node: number;
    time: number | null;
    ancestral_state: string;
    previous_state: string;
    derived_state: string;
    parent_mutation: number;
}

export interface MutationMarker3D {
    position: [number, number, number];
    text: string;
    color: [number, number, number, number];
    size: number;
    sourceId: number;
    targetId: number;
    mutation?: MutationDetail; // Detailed mutation information
}