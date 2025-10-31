import { GraphNode } from "../ForceDirectedGraph/ForceDirectedGraph.types";

export interface Node3D extends GraphNode {
    position: [number, number, number];
    color: [number, number, number, number];
    size: number;
    // Properties for combined nodes
    is_combined?: boolean;
    combined_nodes?: number[];
  }
  
export interface Edge3D {
    source: [number, number, number];
    target: [number, number, number];
    color: [number, number, number, number];
  }
  
export interface NodeLabel3D {
    position: [number, number, number];
    text: string;
    color: [number, number, number, number];
    size: number;
    nodeIds: number[];
    needsLine: boolean;
    nodePosition?: [number, number, number]; // Position of the representative node for line connection
    labelId: string; // Unique identifier for this label
  }