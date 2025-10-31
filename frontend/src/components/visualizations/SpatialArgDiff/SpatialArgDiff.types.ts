import { GraphNode } from "../ForceDirectedGraph/ForceDirectedGraph.types";

export type DiffViewMode = 'diff' | 'first' | 'second';

export interface NodeDiff3D extends GraphNode {
    position: [number, number, number];  // Centroid position
    firstPosition: [number, number, number];  // Original position in first tree sequence
    secondPosition: [number, number, number];  // Position in second tree sequence
    color: [number, number, number, number];
    size: number;
    distance: number;  // Euclidean distance between positions
}
  
export interface EdgeDiff3D {
    source: [number, number, number];
    target: [number, number, number];
    color: [number, number, number, number];
    width: number;
}
  
export interface DiffEdge {
    source: [number, number, number];
    target: [number, number, number];
    color: [number, number, number, number];
    width: number;
}
  
  
export interface TransformResult {
    nodes3D: NodeDiff3D[];
    diffEdges: DiffEdge[];
}
  
export interface EdgeTransformResult {
    source: [number, number, number];
    target: [number, number, number];
    color: [number, number, number, number];
}
  
export interface NodeLabel3D {
    position: [number, number, number];
    text: string;
    color: [number, number, number, number];
    size: number;
    labelId: string;
}