import { GraphEdge, GraphNode } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

export interface GenomicSpan {
    left: number;
    right: number;
}

export interface EdgeGroupWithSpans {
    sourceId: number;
    targetId: number;
    spans: GenomicSpan[];
    formattedSpans: string;
    totalLength: number;
}

/**
 * Merge overlapping or adjacent genomic spans
 */
export function mergeGenomicSpans(spans: GenomicSpan[]): GenomicSpan[] {
    if (spans.length <= 1) return spans;
    
    // Sort spans by left coordinate
    const sortedSpans = [...spans].sort((a, b) => a.left - b.left);
    const merged: GenomicSpan[] = [];
    
    let current = sortedSpans[0];
    
    for (let i = 1; i < sortedSpans.length; i++) {
        const next = sortedSpans[i];
        
        // Check if spans overlap or are adjacent
        if (next.left <= current.right + 1) {
            // Merge spans
            current = {
                left: current.left,
                right: Math.max(current.right, next.right)
            };
        } else {
            // Add completed span and start new one
            merged.push(current);
            current = next;
        }
    }
    
    // Add the last span
    merged.push(current);
    
    return merged;
}

/**
 * Formats genomic spans for display with [Inclusive, Exclusive) notation.
 * Handles M/K notation for large numbers and marks full sequences with *.
 */
export function formatGenomicSpans(spans: GenomicSpan[], sequenceLength?: number): string {
    if (spans.length === 0) return '';
    
    const formatPosition = (pos: number): string => {
        if (pos >= 1000000) {
            return `${(pos / 1000000).toFixed(1)}M`;
        } else if (pos >= 1000) {
            return `${(pos / 1000).toFixed(1)}K`;
        }
        return pos.toString();
    };
    
    const formatSpan = (span: GenomicSpan): string => {
        const leftStr = formatPosition(span.left);
        const rightStr = formatPosition(span.right);
        
        // Check if this span covers the entire sequence and mark with asterisk
        const isFullSequence = sequenceLength && span.left === 0 && span.right === sequenceLength;
        const asterisk = isFullSequence ? '*' : '';
        
        return `[${leftStr}, ${rightStr})${asterisk}`;
    };
    
    return spans.map(formatSpan).join(', ');
}

/**
 * Calculate the total length of genomic spans
 */
export function calculateTotalSpanLength(spans: GenomicSpan[]): number {
    return spans.reduce((total, span) => total + (span.right - span.left), 0);
}

/**
 * Group edges by source-target pairs and calculate their genomic spans
 */
export function groupEdgesByPairs(edges: GraphEdge[], _nodes: GraphNode[], sequenceLength?: number): EdgeGroupWithSpans[] {
    const edgeGroups = new Map<string, { sourceId: number; targetId: number; spans: GenomicSpan[] }>();
    
    let edgesWithoutSpans = 0;
    
    edges.forEach((edge, index) => {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        
        // Check if edge has genomic span data
        if (edge.left === undefined || edge.right === undefined) {
            edgesWithoutSpans++;
            if (edgesWithoutSpans <= 3) { // Only warn for first few missing edges
                console.warn(`Edge ${index} (${sourceId} -> ${targetId}) missing genomic span data:`, {
                    left: edge.left,
                    right: edge.right,
                    hasLeft: edge.left !== undefined,
                    hasRight: edge.right !== undefined
                });
            }
            return; // Skip edges without genomic span data
        }
        
        // Create a consistent key for the edge pair
        const key = `${sourceId}-${targetId}`;
        
        if (!edgeGroups.has(key)) {
            edgeGroups.set(key, {
                sourceId,
                targetId,
                spans: []
            });
        }
        
        // Add this edge's span
        edgeGroups.get(key)!.spans.push({
            left: edge.left,
            right: edge.right
        });
    });
    
    if (edgesWithoutSpans > 0) {
        console.warn(`Found ${edgesWithoutSpans} edges without span data out of ${edges.length} total edges`);
    }
    
    // Process each group to merge spans and format them
    const result: EdgeGroupWithSpans[] = [];
    
    edgeGroups.forEach((group) => {
        const mergedSpans = mergeGenomicSpans(group.spans);
        const formattedSpans = formatGenomicSpans(mergedSpans, sequenceLength);
        const totalLength = calculateTotalSpanLength(mergedSpans);
        
        result.push({
            sourceId: group.sourceId,
            targetId: group.targetId,
            spans: mergedSpans,
            formattedSpans,
            totalLength
        });
    });
    
    return result;
}

/**
 * Handle combined nodes by expanding their genomic spans
 * This accounts for the fact that combined nodes represent multiple original nodes
 */
export function expandEdgeSpansForCombinedNodes(
    edgeGroups: EdgeGroupWithSpans[],
    nodes: GraphNode[],
    originalEdges: GraphEdge[],
    sequenceLength?: number
): EdgeGroupWithSpans[] {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    return edgeGroups.map(group => {
        const sourceNode = nodeMap.get(group.sourceId);
        const targetNode = nodeMap.get(group.targetId);
        
        // If neither node is combined, return as is
        if (!sourceNode?.is_combined && !targetNode?.is_combined) {
            return group;
        }
        
        // Collect all possible edge spans involving the combined nodes
        const allSpans: GenomicSpan[] = [...group.spans];
        
        // Get all original node IDs that might be involved
        const sourceIds = sourceNode?.is_combined && sourceNode.combined_nodes ? 
            sourceNode.combined_nodes : [group.sourceId];
        const targetIds = targetNode?.is_combined && targetNode.combined_nodes ? 
            targetNode.combined_nodes : [group.targetId];
        
        // Find all edges between any combination of these nodes
        originalEdges.forEach(edge => {
            const edgeSourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const edgeTargetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            
            if (sourceIds.includes(edgeSourceId) && targetIds.includes(edgeTargetId)) {
                allSpans.push({
                    left: edge.left,
                    right: edge.right
                });
            }
        });
        
        // Merge all spans and recalculate
        const mergedSpans = mergeGenomicSpans(allSpans);
        const formattedSpans = formatGenomicSpans(mergedSpans, sequenceLength);
        const totalLength = calculateTotalSpanLength(mergedSpans);
        
        return {
            ...group,
            spans: mergedSpans,
            formattedSpans,
            totalLength
        };
    });
} 