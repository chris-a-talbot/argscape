import { GraphNode, GraphEdge } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';
import { TreeInterval } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

export interface OpacityCalculationParams {
    temporalRange?: [number, number] | null;
    temporalDimOpacity: number;
    genomicRange?: [number, number] | null;
    genomicDimOpacity: number;
    treeRange?: [number, number] | null;
    treeIntervals?: TreeInterval[];
    treeDimOpacity: number;
    nodes: GraphNode[];
    edges: GraphEdge[];
}

// Helper function to check if an edge overlaps with genomic range
export const edgeOverlapsGenomicRange = (edge: GraphEdge, genomicRange?: [number, number] | null): boolean => {
    if (!genomicRange || edge.left === undefined || edge.right === undefined) return true;
    const [genomicLeft, genomicRight] = genomicRange;
    return edge.left < genomicRight && edge.right > genomicLeft;
};

// Helper function to check if a node has any edges in the genomic range
export const nodeHasEdgesInGenomicRange = (node: GraphNode, edges: GraphEdge[], genomicRange?: [number, number] | null): boolean => {
    if (!genomicRange) return true;
    const nodeId = node.id;
    return edges.some(edge => {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        return (sourceId === nodeId || targetId === nodeId) && edgeOverlapsGenomicRange(edge, genomicRange);
    });
};

// Helper function to check if an edge overlaps with any selected tree intervals
export const edgeOverlapsTreeRange = (edge: GraphEdge, treeRange?: [number, number] | null, treeIntervals?: TreeInterval[]): boolean => {
    if (!treeRange || !treeIntervals || edge.left === undefined || edge.right === undefined) return true;
    const [treeStartIdx, treeEndIdx] = treeRange;

    const selectedIntervals = treeIntervals.filter(interval =>
        interval.index >= treeStartIdx && interval.index <= treeEndIdx
    );

    return selectedIntervals.some(interval => {
        return edge.left < interval.right && edge.right > interval.left;
    });
};

// Helper function to check if a node has any edges in the tree range
export const nodeHasEdgesInTreeRange = (node: GraphNode, edges: GraphEdge[], treeRange?: [number, number] | null, treeIntervals?: TreeInterval[]): boolean => {
    if (!treeRange || !treeIntervals) return true;
    const nodeId = node.id;
    return edges.some(edge => {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        return (sourceId === nodeId || targetId === nodeId) && edgeOverlapsTreeRange(edge, treeRange, treeIntervals);
    });
};

// Helper function to calculate opacity based on temporal range
export const getTemporalNodeOpacity = (node: GraphNode, temporalRange?: [number, number] | null, temporalDimOpacity?: number): number => {
    if (!temporalRange) return 1;
    const [minTime, maxTime] = temporalRange;
    if (node.time >= minTime && node.time <= maxTime) {
        return 1;
    }
    return Math.max(0, Math.min(0.99, temporalDimOpacity || 0.05));
};

// Helper function to calculate opacity based on genomic range
export const getGenomicNodeOpacity = (node: GraphNode, edges: GraphEdge[], genomicRange?: [number, number] | null, genomicDimOpacity?: number): number => {
    if (!genomicRange) return 1;
    if (nodeHasEdgesInGenomicRange(node, edges, genomicRange)) {
        return 1;
    }
    return Math.max(0, Math.min(0.99, genomicDimOpacity || 0.05));
};

// Helper function to calculate opacity based on tree range
export const getTreeNodeOpacity = (node: GraphNode, edges: GraphEdge[], treeRange?: [number, number] | null, treeIntervals?: TreeInterval[], treeDimOpacity?: number): number => {
    if (!treeRange || !treeIntervals) return 1;
    if (nodeHasEdgesInTreeRange(node, edges, treeRange, treeIntervals)) {
        return 1;
    }
    return Math.max(0, Math.min(0.99, treeDimOpacity || 0.30));
};

// Combined node opacity (temporal, genomic, and tree)
export const getNodeOpacity = (node: GraphNode, params: OpacityCalculationParams): number => {
    const temporal = getTemporalNodeOpacity(node, params.temporalRange, params.temporalDimOpacity);
    const genomic = getGenomicNodeOpacity(node, params.edges, params.genomicRange, params.genomicDimOpacity);
    const tree = getTreeNodeOpacity(node, params.edges, params.treeRange, params.treeIntervals, params.treeDimOpacity);
    return Math.min(temporal, genomic, tree);
};

// Helper function to calculate edge opacity based on temporal range
export const getTemporalEdgeOpacity = (edge: GraphEdge, nodes: GraphNode[], temporalRange?: [number, number] | null, temporalDimOpacity?: number): number => {
    if (!temporalRange) return 1; // Return full opacity, will be scaled by edgeOpacity in caller
    const sourceNode = typeof edge.source === 'number' ?
        nodes.find(n => n.id === edge.source) : edge.source as GraphNode;
    const targetNode = typeof edge.target === 'number' ?
        nodes.find(n => n.id === edge.target) : edge.target as GraphNode;

    if (sourceNode && targetNode) {
        const sourceVisible = getTemporalNodeOpacity(sourceNode, temporalRange, temporalDimOpacity) > 0.5;
        const targetVisible = getTemporalNodeOpacity(targetNode, temporalRange, temporalDimOpacity) > 0.5;
        if (sourceVisible && targetVisible) {
            return 1; // Return full opacity, will be scaled by edgeOpacity in caller
        }
    }
    return Math.max(0, Math.min(0.99, temporalDimOpacity || 0.05));
};

// Helper function to calculate edge opacity based on genomic range
export const getGenomicEdgeOpacity = (edge: GraphEdge, genomicRange?: [number, number] | null, genomicDimOpacity?: number): number => {
    if (!genomicRange) return 1; // Return full opacity, will be scaled by edgeOpacity in caller
    if (edgeOverlapsGenomicRange(edge, genomicRange)) {
        return 1; // Return full opacity, will be scaled by edgeOpacity in caller
    }
    return Math.max(0, Math.min(0.99, genomicDimOpacity || 0.05));
};

// Helper function to calculate edge opacity based on tree range
export const getTreeEdgeOpacity = (edge: GraphEdge, treeRange?: [number, number] | null, treeIntervals?: TreeInterval[], treeDimOpacity?: number): number => {
    if (!treeRange || !treeIntervals) return 1; // Return full opacity, will be scaled by edgeOpacity in caller
    if (edgeOverlapsTreeRange(edge, treeRange, treeIntervals)) {
        return 1; // Return full opacity, will be scaled by edgeOpacity in caller
    }
    return Math.max(0, Math.min(0.99, treeDimOpacity || 0.30));
};

// Combined edge opacity (temporal, genomic, and tree)
export const getEdgeOpacity = (edge: GraphEdge, nodes: GraphNode[], params: OpacityCalculationParams): number => {
    const temporal = getTemporalEdgeOpacity(edge, nodes, params.temporalRange, params.temporalDimOpacity);
    const genomic = getGenomicEdgeOpacity(edge, params.genomicRange, params.genomicDimOpacity);
    const tree = getTreeEdgeOpacity(edge, params.treeRange, params.treeIntervals, params.treeDimOpacity);
    return Math.min(temporal, genomic, tree);
};
