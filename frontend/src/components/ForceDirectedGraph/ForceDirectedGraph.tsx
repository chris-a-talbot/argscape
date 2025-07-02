import { useEffect, forwardRef, ForwardedRef, useMemo, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import * as dagre from 'dagre';
import { ForceDirectedGraphProps, GraphNode, GraphEdge, NodeSizeSettings, TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, EdgeMutationSettings } from './ForceDirectedGraph.types';
import { useColorTheme } from '../../context/ColorThemeContext';
import { 
  combineGenealogyIdenticalNodes, 
  analyzeNodeCombining 
} from '../../utils/nodeCombining';
import { 
  groupEdgesByPairs, 
  expandEdgeSpansForCombinedNodes,
  EdgeGroupWithSpans 
} from '../../utils/genomicSpanUtils';

// Default node sizes - these will be overridden by props
const DEFAULT_NODE_SIZES: NodeSizeSettings = {
    sample: 8,
    root: 6,
    other: 5
};

// Default node ID settings - these will be overridden by props
const DEFAULT_NODE_ID_SETTINGS: NodeIdSettings = {
    showSampleIds: true,
    showRootIds: false,
    showInternalIds: false
};

// Default edge label settings - these will be overridden by props
const DEFAULT_EDGE_LABEL_SETTINGS: EdgeLabelSettings = {
    showEdgeLabels: false,
    labelFontSize: 14 // Changed from 12 to 14 for better readability
};

// Helper function to get node radius based on type and settings
function getNodeRadius(node: Node, nodeSizes: NodeSizeSettings, nodes: Node[], edges: GraphEdge[]): number {
    if (node.is_sample || isRootNode(node, nodes, edges)) {
        return node.is_sample ? nodeSizes.sample : nodeSizes.root;
    }
    return nodeSizes.other;
}

// Constants for graph layout and styling
const GRAPH_CONSTANTS = {
    ROOT_NODE_STROKE_WIDTH: 2,
    SAMPLE_NODE_STROKE_WIDTH: 1,
    EDGE_STROKE_WIDTH: 1,
    COLLISION_RADIUS: 15,
    TOOLTIP_OFFSET: 10,
    BASE_FONT_SIZE: 10, // Base font size in pixels
    TOOLTIP_FONT_SIZE: '12px',
    PADDING_RATIO: 0.1,
    AVAILABLE_WIDTH_RATIO: 0.8,
    MAX_SIBLING_DISTANCE: 50,
    FORCE_STRENGTH: {
        LINK_SIBLING: 0.9,
        LINK_SAMPLE: 0.8,
        LINK_DEFAULT: 0.3,
        CHARGE: -20,
        X_POSITION: 0.15,
        Y_POSITION: 1,
        ALPHA_START: 0.8,
        ALPHA_DECAY: 0.05,
        VELOCITY_DECAY: 0.7
    },
    ZOOM: {
        MIN_SCALE: 0.1,
        MAX_SCALE: 4,
        FOCUS_SCALE: 1.5,
        GRAPH_FIT_SCALE_MIN: 0.2,
        GRAPH_FIT_SCALE_MAX: 1.5,
        TRANSITION_DURATION: 750,
        ALPHA_TARGET: 0.3
    },
    LAYOUT: {
        BOTTOM_MARGIN_RATIO: 0.15 // Reserve 15% of height for footer/bottom margin
    },
    DAGRE: {
        NODE_SEPARATION: 80,        // Horizontal spacing between nodes at same rank (increased for less crossings)
        RANK_SEPARATION: 100,       // Vertical spacing between ranks/layers (increased for clarity)
        MARGIN_X: 60,              // Left/right margins (increased)
        MARGIN_Y: 40,              // Top/bottom margins
        MAX_SCALE: 1.0,            // Maximum scale factor (reduced to prevent overcrowding)
        MIN_SCALE: 0.2,            // Minimum scale factor for dagre layout
        NODE_SIZE_MULTIPLIER: 6    // Multiplier for node size (increased for better spacing)
    },
    PERFORMANCE: {
        TICK_SKIP_DESCENDANT: 3,
        TICK_SKIP_CROSSING: 5,
        MAX_NODES_TO_CHECK: 10,
        ALPHA_THRESHOLD: 0.1
    }
};

interface Node extends d3.SimulationNodeDatum {
    id: number;
    time: number;
    is_sample: boolean;
    individual: number;  // Added from GraphNode
    location?: {         // Added spatial location from GraphNode
        x: number;
        y: number;
        z?: number;
    };
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
    timeIndex?: number;
    layer?: number;  // For layered layout
    degree?: number; // For connectivity-based positioning
    order_position?: number; // For sample ordering from backend
    // Properties for combined nodes
    is_combined?: boolean;
    combined_nodes?: number[]; // Array of original node IDs that were combined
    label?: string; // Node label (for combined nodes, shows "id1/id2/id3")
    dagreX?: number; // For dagre-based ordering within layers
    // Properties for spacing preservation
    originalX?: number; // Store original position for spacing calculations
    originalY?: number; // Store original position for spacing calculations
}

// Helper function to get source and target nodes from edge
function getEdgeNodes(edge: GraphEdge, nodes: Node[]): { source: Node | null; target: Node | null } {
    const source = typeof edge.source === 'number' 
        ? nodes.find(n => n.id === edge.source) || null
        : edge.source as Node;
    const target = typeof edge.target === 'number' 
        ? nodes.find(n => n.id === edge.target) || null
        : edge.target as Node;
    return { source, target };
}

// Helper function to get all descendant samples of a node
function getDescendantSamples(node: Node, nodes: Node[], edges: GraphEdge[]): Node[] {
    const descendants = new Set<Node>();
    const visited = new Set<number>();
    const queue: Node[] = [node];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id)) continue;
        visited.add(current.id);
        
        const outgoingEdges = edges.filter(e => {
            const { source, target } = getEdgeNodes(e, nodes);
            return source?.id === current.id && 
                   target && 
                   target.timeIndex! > current.timeIndex!;
        });
        
        outgoingEdges.forEach(e => {
            const { target } = getEdgeNodes(e, nodes);
            if (!target) return;
            
            if (target.is_sample) {
                descendants.add(target);
            } else if (!visited.has(target.id)) {
                queue.push(target);
            }
        });
    }
    
    return Array.from(descendants);
}

// Helper function to get x-axis range of descendant samples
function getDescendantSampleRange(node: Node, nodes: Node[], edges: GraphEdge[]): { min: number; max: number } | null {
    const descendantSamples = getDescendantSamples(node, nodes, edges);
    if (descendantSamples.length === 0) return null;
    
    const xValues = descendantSamples.map(n => n.x!);
    return {
        min: Math.min(...xValues),
        max: Math.max(...xValues)
    };
}

// Helper function to find descendants of a node that are in a specific layer
function getDescendantsInLayer(node: Node, allNodes: Node[], edges: GraphEdge[], layerNodeIds: Set<number>): Node[] {
    const descendants: Node[] = [];
    const visited = new Set<number>();
    const queue: Node[] = [node];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id)) continue;
        visited.add(current.id);
        
        const children = edges
            .filter(e => {
                const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
                return sourceId === current.id;
            })
            .map(e => {
                const targetId = typeof e.target === 'number' ? e.target : e.target.id;
                return allNodes.find(n => n.id === targetId);
            })
            .filter(n => n !== undefined) as Node[];
        
        children.forEach(child => {
            if (layerNodeIds.has(child.id)) {
                descendants.push(child);
            } else if (!visited.has(child.id)) {
                queue.push(child);
            }
        });
    }
    
    return descendants;
}

// Helper function to find ancestors of a node that are in a specific layer
function getAncestorsInLayer(node: Node, allNodes: Node[], edges: GraphEdge[], layerNodeIds: Set<number>): Node[] {
    const ancestors: Node[] = [];
    const visited = new Set<number>();
    const queue: Node[] = [node];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id)) continue;
        visited.add(current.id);
        
        const parents = edges
            .filter(e => {
                const targetId = typeof e.target === 'number' ? e.target : e.target.id;
                return targetId === current.id;
            })
            .map(e => {
                const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
                return allNodes.find(n => n.id === sourceId);
            })
            .filter(n => n !== undefined) as Node[];
        
        parents.forEach(parent => {
            if (layerNodeIds.has(parent.id)) {
                ancestors.push(parent);
            } else if (!visited.has(parent.id)) {
                queue.push(parent);
            }
        });
    }
    
    return ancestors;
}

// Helper function to calculate the ancestral path length for a sample node
function calculateAncestralPathLength(sampleNode: Node, allNodes: Node[], edges: GraphEdge[]): number {
    const visited = new Set<number>();
    const queue: { node: Node; depth: number }[] = [{ node: sampleNode, depth: 0 }];
    let maxDepth = 0;
    
    while (queue.length > 0) {
        const { node: current, depth } = queue.shift()!;
        if (visited.has(current.id)) continue;
        visited.add(current.id);
        
        maxDepth = Math.max(maxDepth, depth);
        
        // Find all parent nodes (nodes that point to this node)
        const parents = edges
            .filter(e => {
                const targetId = typeof e.target === 'number' ? e.target : e.target.id;
                return targetId === current.id;
            })
            .map(e => {
                const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
                return allNodes.find(n => n.id === sourceId);
            })
            .filter(n => n !== undefined) as Node[];
        
        // Add parents to queue with increased depth
        parents.forEach(parent => {
            if (!visited.has(parent.id)) {
                queue.push({ node: parent, depth: depth + 1 });
            }
        });
    }
    
    return maxDepth;
}

// Helper function to arrange samples by ancestral path length with parent grouping
function arrangeSamplesByAncestralPath(sampleNodes: Node[], allNodes: Node[], edges: GraphEdge[]): Node[] {
    // Calculate ancestral path length and parents for each sample
    const samplesWithData = sampleNodes.map(node => ({
        node,
        pathLength: calculateAncestralPathLength(node, allNodes, edges),
        parents: getImmediateParents(node, allNodes, edges)
    }));
    
    // Group samples by ancestral path length
    const pathGroups = new Map<number, typeof samplesWithData>();
    samplesWithData.forEach(sample => {
        const length = sample.pathLength;
        if (!pathGroups.has(length)) {
            pathGroups.set(length, []);
        }
        pathGroups.get(length)!.push(sample);
    });
    
    // Sort path lengths in descending order
    const sortedPathLengths = Array.from(pathGroups.keys()).sort((a, b) => b - a);
    
    const result: Node[] = [];
    
    // Process each path length group
    sortedPathLengths.forEach(pathLength => {
        const group = pathGroups.get(pathLength)!;
        
        if (group.length === 1) {
            // Single sample, just add it
            result.push(group[0].node);
        } else {
            // Multiple samples with same path length - group by shared parents
            const parentGroups = groupSamplesBySharedParents(group);
            
            // Arrange parent groups by MRCA coalescence depth (outside-in)
            const arrangedParentGroups = arrangeParentGroupsByMRCADepth(parentGroups, allNodes, edges);
            
            // Add all parent groups to result
            arrangedParentGroups.forEach(parentGroup => {
                // Sort within parent group by node ID for consistency
                parentGroup.sort((a, b) => a.node.id - b.node.id);
                parentGroup.forEach(sample => result.push(sample.node));
            });
        }
    });
    
    return result;
}

// Helper function to calculate time to coalescence for a sample node
function calculateTimeToCoalescence(sampleNode: Node, allNodes: Node[], edges: GraphEdge[]): number {
    // Find the most recent parent (direct parent with the smallest time difference)
    const parents = edges
        .filter(e => {
            const targetId = typeof e.target === 'number' ? e.target : e.target.id;
            return targetId === sampleNode.id;
        })
        .map(e => {
            const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
            return allNodes.find(n => n.id === sourceId);
        })
        .filter(n => n !== undefined) as Node[];
    
    if (parents.length === 0) {
        // If no parents, return 0 (no coalescence)
        return 0;
    }
    
    // Find the most recent parent (parent with the smallest time, closest to the sample)
    const mostRecentParent = parents.reduce((closest, parent) => {
        return parent.time < closest.time ? parent : closest;
    });
    
    // Return the time difference (coalescence time)
    return mostRecentParent.time - sampleNode.time;
}

// Helper function to get all immediate parents of a sample node
function getImmediateParents(sampleNode: Node, allNodes: Node[], edges: GraphEdge[]): Node[] {
    const parents = edges
        .filter(e => {
            const targetId = typeof e.target === 'number' ? e.target : e.target.id;
            return targetId === sampleNode.id;
        })
        .map(e => {
            const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
            return allNodes.find(n => n.id === sourceId);
        })
        .filter(n => n !== undefined) as Node[];
    
    return parents;
}

// Helper function to arrange samples by coalescence time with parent grouping
function arrangeSamplesByCoalescence(sampleNodes: Node[], allNodes: Node[], edges: GraphEdge[]): Node[] {
    // Calculate coalescence time and parents for each sample
    const samplesWithData = sampleNodes.map(node => ({
        node,
        coalescenceTime: calculateTimeToCoalescence(node, allNodes, edges),
        parents: getImmediateParents(node, allNodes, edges)
    }));
    
    // Group samples by coalescence time
    const coalescenceGroups = new Map<number, typeof samplesWithData>();
    samplesWithData.forEach(sample => {
        const time = sample.coalescenceTime;
        if (!coalescenceGroups.has(time)) {
            coalescenceGroups.set(time, []);
        }
        coalescenceGroups.get(time)!.push(sample);
    });
    
    // Sort coalescence times in descending order
    const sortedCoalescenceTimes = Array.from(coalescenceGroups.keys()).sort((a, b) => b - a);
    
    const result: Node[] = [];
    
    // Process each coalescence time group
    sortedCoalescenceTimes.forEach(coalescenceTime => {
        const group = coalescenceGroups.get(coalescenceTime)!;
        
        if (group.length === 1) {
            // Single sample, just add it
            result.push(group[0].node);
                 } else {
             // Multiple samples with same coalescence time - group by shared parents
             const parentGroups = groupSamplesBySharedParents(group);
             
             // Arrange parent groups by MRCA coalescence depth (outside-in)
             const arrangedParentGroups = arrangeParentGroupsByMRCADepth(parentGroups, allNodes, edges);
             
             // Add all parent groups to result
             arrangedParentGroups.forEach(parentGroup => {
                 // Sort within parent group by node ID for consistency
                 parentGroup.sort((a, b) => a.node.id - b.node.id);
                 parentGroup.forEach(sample => result.push(sample.node));
             });
         }
    });
    
    return result;
}

// Helper function to find the Most Recent Common Ancestor (MRCA) of a group of nodes
function findMRCA(nodes: Node[], allNodes: Node[], edges: GraphEdge[]): Node | null {
    if (nodes.length === 0) return null;
    if (nodes.length === 1) {
        // For a single node, find its immediate parent as "MRCA"
        const parents = getImmediateParents(nodes[0], allNodes, edges);
        return parents.length > 0 ? parents[0] : null;
    }
    
    // Get all ancestors for each node
    const ancestorSets = nodes.map(node => {
        const ancestors = new Set<number>();
        const queue = [node];
        const visited = new Set<number>();
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current.id)) continue;
            visited.add(current.id);
            
            const parents = getImmediateParents(current, allNodes, edges);
            parents.forEach(parent => {
                ancestors.add(parent.id);
                if (!visited.has(parent.id)) {
                    queue.push(parent);
                }
            });
        }
        
        return ancestors;
    });
    
    // Find common ancestors
    const commonAncestors = ancestorSets.reduce((common, current) => {
        return new Set([...common].filter(x => current.has(x)));
    });
    
    if (commonAncestors.size === 0) return null;
    
    // Among common ancestors, find the most recent (smallest time, closest to samples)
    const commonAncestorNodes = Array.from(commonAncestors)
        .map(id => allNodes.find(n => n.id === id))
        .filter(n => n !== undefined) as Node[];
    
    return commonAncestorNodes.reduce((mrca, ancestor) => {
        return ancestor.time < mrca.time ? ancestor : mrca;
    });
}

// Helper function to calculate MRCA coalescence depth (recursively)
function calculateMRCACoalescenceDepth(nodes: Node[], allNodes: Node[], edges: GraphEdge[], depth: number = 0): number {
    const mrca = findMRCA(nodes, allNodes, edges);
    if (!mrca) return depth; // No MRCA found, return current depth
    
    // Find MRCA's parents for recursive calculation
    const mrcaParents = getImmediateParents(mrca, allNodes, edges);
    if (mrcaParents.length === 0) return depth + mrca.time; // MRCA is root, return depth + its time
    
    // Recursively calculate depth including MRCA's coalescence
    return mrca.time + calculateMRCACoalescenceDepth([mrca], allNodes, edges, depth + 1);
}

// Generic helper function to group samples by shared parents
function groupSamplesBySharedParents<T extends {node: Node, parents: Node[]}>(samples: T[]): T[][] {
    const groups: T[][] = [];
    const processed = new Set<number>();
    
    samples.forEach(sample => {
        if (processed.has(sample.node.id)) return;
        
        // Find all samples that share at least one parent with this sample
        const parentGroup = [sample];
        processed.add(sample.node.id);
        
        // Get parent IDs for this sample
        const sampleParentIds = new Set(sample.parents.map(p => p.id));
        
        // Find other samples that share at least one parent
        samples.forEach(otherSample => {
            if (processed.has(otherSample.node.id)) return;
            
            const otherParentIds = new Set(otherSample.parents.map(p => p.id));
            const hasSharedParent = Array.from(sampleParentIds).some(id => otherParentIds.has(id));
            
            if (hasSharedParent) {
                parentGroup.push(otherSample);
                processed.add(otherSample.node.id);
            }
        });
        
        groups.push(parentGroup);
    });
    
    return groups;
}

// Generic helper function to arrange parent groups by MRCA coalescence depth (outside-in placement)
function arrangeParentGroupsByMRCADepth<T extends {node: Node, parents: Node[]}>(
    parentGroups: T[][],
    allNodes: Node[],
    edges: GraphEdge[]
): T[][] {
    
    // Calculate MRCA coalescence depth for each parent group
    const groupsWithDepth = parentGroups.map(group => ({
        group,
        mrcaDepth: calculateMRCACoalescenceDepth(group.map(s => s.node), allNodes, edges)
    }));
    
    // Sort by MRCA depth (descending - deeper coalescence first)
    groupsWithDepth.sort((a, b) => b.mrcaDepth - a.mrcaDepth);
    
    // Arrange groups from outside-in: deepest groups towards edges, shallowest towards center
    const result: T[][] = [];
    let leftSide: T[][] = [];
    let rightSide: T[][] = [];
    
    groupsWithDepth.forEach((groupWithDepth, index) => {
        if (index % 2 === 0) {
            // Even indices go to the left side (deepest first)
            leftSide.push(groupWithDepth.group);
        } else {
            // Odd indices go to the right side
            rightSide.unshift(groupWithDepth.group); // unshift to reverse order for right side
        }
    });
    
    // Combine: left side + right side = outside-in arrangement
    return [...leftSide, ...rightSide];
}

// Helper function to enforce x position within descendant range
function enforceDescendantRange(node: Node, nodes: Node[], edges: GraphEdge[]): void {
    const range = getDescendantSampleRange(node, nodes, edges);
    if (range && node.x !== undefined) {
        node.x = Math.max(range.min, Math.min(range.max, node.x));
    }
}

// Helper function to get immediate parent of a node
function getParent(node: Node, nodes: Node[], edges: GraphEdge[]): Node | null {
    const parentEdge = edges.find(e => {
        const { source, target } = getEdgeNodes(e, nodes);
        return target?.id === node.id && 
               source && 
               source.timeIndex! < node.timeIndex!;
    });

    if (!parentEdge) return null;
    const { source } = getEdgeNodes(parentEdge, nodes);
    return source;
}

// Helper function to get siblings (nodes with same parent)
function getSiblings(node: Node, nodes: Node[], edges: GraphEdge[]): Node[] {
    const parent = getParent(node, nodes, edges);
    if (!parent) return [];

    return nodes.filter(n => {
        if (n.id === node.id || n.timeIndex! <= parent.timeIndex!) return false;
        const nodeParent = getParent(n, nodes, edges);
        return nodeParent?.id === parent.id;
    });
}

// Helper function to check if a point lies on a line segment
function isPointOnLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number = 5): boolean {
    // Calculate distances
    const d1 = Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    const d2 = Math.sqrt((px - x2) ** 2 + (py - y2) ** 2);
    const lineLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    
    // Check if point is within tolerance of the line segment
    return Math.abs(d1 + d2 - lineLen) <= tolerance;
}

// Helper function to find a new position for a node that overlaps with edges
function findNonOverlappingPosition(
    node: Node,
    edges: GraphEdge[],
    nodes: Node[],
    nodeRadius: number,
    minX: number,
    maxX: number,
    nodeSizes: NodeSizeSettings
): { x: number; y: number } {
    const connectedEdgeIds = new Set(edges
        .filter(e => {
            const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
            const targetId = typeof e.target === 'number' ? e.target : e.target.id;
            return sourceId === node.id || targetId === node.id;
        })
        .map(e => `${typeof e.source === 'number' ? e.source : e.source.id}-${typeof e.target === 'number' ? e.target : e.target.id}`));

    const overlappingEdges = edges.filter(edge => {
        // Skip edges connected to this node
        const edgeId = `${typeof edge.source === 'number' ? edge.source : edge.source.id}-${typeof edge.target === 'number' ? edge.target : edge.target.id}`;
        if (connectedEdgeIds.has(edgeId)) return false;

        const sourceNode = typeof edge.source === 'number' 
            ? nodes.find(n => n.id === edge.source) 
            : edge.source as Node;
        const targetNode = typeof edge.target === 'number' 
            ? nodes.find(n => n.id === edge.target) 
            : edge.target as Node;

        if (!sourceNode || !targetNode) return false;

        // Check if node overlaps with this edge
        return isPointOnLineSegment(
            node.x!,
            node.y!,
            sourceNode.x!,
            sourceNode.y!,
            targetNode.x!,
            targetNode.y!,
            nodeRadius * 2 // Use double the node radius as tolerance
        );
    });

    if (overlappingEdges.length === 0) {
        return { x: node.x!, y: node.y! };
    }

    // Try positions slightly to the left and right until we find a non-overlapping spot
    const maxOffset = 30; // Maximum distance to move node
    const step = 5; // Step size for each attempt

    for (let offset = step; offset <= maxOffset; offset += step) {
        // Try right first
        const rightX = Math.min(node.x! + offset, maxX);
        let overlapsRight = false;
        for (const edge of overlappingEdges) {
            const sourceNode = typeof edge.source === 'number' 
                ? nodes.find(n => n.id === edge.source) 
                : edge.source as Node;
            const targetNode = typeof edge.target === 'number' 
                ? nodes.find(n => n.id === edge.target) 
                : edge.target as Node;
            
            if (isPointOnLineSegment(
                rightX,
                node.y!,
                sourceNode!.x!,
                sourceNode!.y!,
                targetNode!.x!,
                targetNode!.y!,
                nodeRadius * 2
            )) {
                overlapsRight = true;
                break;
            }
        }
        if (!overlapsRight) {
            return { x: rightX, y: node.y! };
        }

        // Try left
        const leftX = Math.max(node.x! - offset, minX);
        let overlapsLeft = false;
        for (const edge of overlappingEdges) {
            const sourceNode = typeof edge.source === 'number' 
                ? nodes.find(n => n.id === edge.source) 
                : edge.source as Node;
            const targetNode = typeof edge.target === 'number' 
                ? nodes.find(n => n.id === edge.target) 
                : edge.target as Node;
            
            if (isPointOnLineSegment(
                leftX,
                node.y!,
                sourceNode!.x!,
                sourceNode!.y!,
                targetNode!.x!,
                targetNode!.y!,
                nodeRadius * 2
            )) {
                overlapsLeft = true;
                break;
            }
        }
        if (!overlapsLeft) {
            return { x: leftX, y: node.y! };
        }
    }

    // If we couldn't find a non-overlapping position, return original
    return { x: node.x!, y: node.y! };
}

// Improved getDagreOrderedNodes function with better edge handling
function getDagreOrderedNodes(layerNodes: Node[], allNodes: Node[], edges: GraphEdge[]): Node[] {
    // Create a new dagre graph for this layer
    const g = new dagre.graphlib.Graph();
    g.setGraph({
        rankdir: 'TB', // Top to bottom for within-layer ordering
        nodesep: 30,   // Horizontal space between nodes
        ranksep: 50,   // Vertical space between ranks (not used much here)
        marginx: 10,
        marginy: 10,
        ranker: 'network-simplex' // Best for minimizing crossings
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Add all nodes in this layer
    layerNodes.forEach(node => {
        g.setNode(node.id.toString(), { 
            width: 20, 
            height: 20,
            label: node.id.toString()
        });
    });

    // Add edges that cross this layer (for proper ordering)
    const layerNodeIds = new Set(layerNodes.map(n => n.id));
    
    edges.forEach(edge => {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        const source = allNodes.find(n => n.id === sourceId);
        const target = allNodes.find(n => n.id === targetId);

        if (!source || !target) return;

        // Add edges that involve nodes in this layer
        // This includes edges within the layer and edges crossing through the layer
        const sourceInLayer = layerNodeIds.has(sourceId);
        const targetInLayer = layerNodeIds.has(targetId);
        
        if (sourceInLayer && targetInLayer) {
            // Edge within the layer
            g.setEdge(sourceId.toString(), targetId.toString());
        } else if (sourceInLayer || targetInLayer) {
            // Edge crossing the layer - add virtual connection for ordering
            if (sourceInLayer) {
                // Find target's descendants in this layer
                const descendants = getDescendantsInLayer(target, allNodes, edges, layerNodeIds);
                descendants.forEach(desc => {
                    g.setEdge(sourceId.toString(), desc.id.toString());
                });
            }
            if (targetInLayer) {
                // Find source's ancestors in this layer
                const ancestors = getAncestorsInLayer(source, allNodes, edges, layerNodeIds);
                ancestors.forEach(anc => {
                    g.setEdge(anc.id.toString(), targetId.toString());
                });
            }
        }
    });

    // Run the dagre layout
    dagre.layout(g);

    // Get nodes in the order determined by dagre
    const orderedNodes: Node[] = [];
    g.nodes().forEach(nodeId => {
        const node = layerNodes.find(n => n.id === parseInt(nodeId));
        if (node) {
            const dagreNode = g.node(nodeId);
            node.dagreX = dagreNode.x;
            orderedNodes.push(node);
        }
    });
    
    // Sort nodes by their dagre x position
    return orderedNodes.sort((a, b) => (a.dagreX ?? 0) - (b.dagreX ?? 0));
}

// Helper function to get all edges connected to a node
function getConnectedEdges(node: Node, edges: GraphEdge[]): GraphEdge[] {
    return edges.filter(e => {
        const sourceId = typeof e.source === 'number' ? e.source : (e.source as Node).id;
        const targetId = typeof e.target === 'number' ? e.target : (e.target as Node).id;
        return sourceId === node.id || targetId === node.id;
    });
}

// Helper function to check if two nodes have identical relationships
function haveIdenticalRelationships(node1: Node, node2: Node, edges: GraphEdge[]): boolean {
    // Get all parent and child relationships for both nodes
    const parents1 = new Set<number>();
    const parents2 = new Set<number>();
    const children1 = new Set<number>();
    const children2 = new Set<number>();
    
    edges.forEach(edge => {
        const sourceId = typeof edge.source === 'number' ? edge.source : (edge.source as Node).id;
        const targetId = typeof edge.target === 'number' ? edge.target : (edge.target as Node).id;
        
        // For node1
        if (targetId === node1.id) {
            parents1.add(sourceId);
        }
        if (sourceId === node1.id) {
            children1.add(targetId);
        }
        
        // For node2
        if (targetId === node2.id) {
            parents2.add(sourceId);
        }
        if (sourceId === node2.id) {
            children2.add(targetId);
        }
    });
    
    // Check if parent sets are identical
    if (parents1.size !== parents2.size) return false;
    for (const parentId of parents1) {
        if (!parents2.has(parentId)) return false;
    }
    
    // Check if children sets are identical
    if (children1.size !== children2.size) return false;
    for (const childId of children1) {
        if (!children2.has(childId)) return false;
    }
    
    return true;
}



// Helper function to determine if two nodes should be combined (conservative approach)
// Note: Removed duplicate combineIdenticalNodes implementation - now using shared version from utils/nodeCombining.ts



// Helper function to check if a node is a root node (has children but no parents)
function isRootNode(node: Node, nodes: Node[], edges: GraphEdge[]): boolean {
    const hasParents = edges.some(edge => {
        const { target } = getEdgeNodes(edge, nodes);
        return target?.id === node.id;
    });

    const hasChildren = edges.some(edge => {
        const { source } = getEdgeNodes(edge, nodes);
        return source?.id === node.id;
    });

    return !hasParents && hasChildren;
}

// Helper function to focus on a node or fit the entire graph
function createFocusFunction(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    zoom: d3.ZoomBehavior<SVGSVGElement, unknown>,
    actualWidth: number,
    actualHeight: number,
    timeSpacing: number
) {
    return (node: GraphNode | null | undefined, combinedNodes: Node[], combinedEdges: GraphEdge[], fitToGraph: boolean = false) => {
        // Always fit the entire graph structure - never focus on a single node
        // This ensures subARGs and parent ARGs are properly centered on the entire structure
        const positionedNodes = combinedNodes.filter(n => n.x !== undefined && n.y !== undefined);
        if (positionedNodes.length === 0) return;

        const bounds = calculateGraphBounds(positionedNodes, actualHeight, 0);
        const transform = calculateFitTransform(bounds, actualWidth, actualHeight);

        console.log('Focus function - fitting to entire graph:', {
            focalNode: node ? `node ${node.id}` : 'none',
            positionedNodes: positionedNodes.length,
            bounds: {
                center: [bounds.centerX, bounds.centerY],
                dimensions: [bounds.width, bounds.height]
            }
        });

        svg.transition()
            .duration(GRAPH_CONSTANTS.ZOOM.TRANSITION_DURATION)
            .call(zoom.transform, transform);
    };
}

// Helper function to calculate the true bounding box of the entire ARG structure
function calculateGraphBounds(nodes: Node[], screenHeight: number, timeSpacing: number) {
    // Filter nodes that have actual positions set
    const positionedNodes = nodes.filter(n => n.x !== undefined && n.y !== undefined);
    
    if (positionedNodes.length === 0) {
        console.warn('No positioned nodes found for bounds calculation');
    return {
            minX: 0,
            maxX: 100,
            minY: 0,
            maxY: 100,
            centerX: 50,
            centerY: 50,
            width: 100,
            height: 100,
            nodeCount: 0
        };
    }
    
    // Find the outermost nodes in all directions to create perfect bounding box
    const xValues = positionedNodes.map(n => n.x!);
    const yValues = positionedNodes.map(n => n.y!);
    
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    
    // Calculate true geometric center and dimensions
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const boundingHeight = maxY - minY;
    
    // Debug info to ensure we're capturing the full structure
    console.log('Graph bounds calculation:', {
        nodeCount: positionedNodes.length,
        xRange: [minX, maxX],
        yRange: [minY, maxY],
        center: [centerX, centerY],
        dimensions: [width, boundingHeight],
        sampleNodes: positionedNodes.filter(n => n.is_sample).length,
        internalNodes: positionedNodes.filter(n => !n.is_sample).length
    });
    
    return {
        minX,
        maxX,
        minY,
        maxY,
        centerX,
        centerY,
        width,
        height: boundingHeight,
        nodeCount: positionedNodes.length
    };
}

// Helper function to calculate transform for perfectly fitting and centering the graph
function calculateFitTransform(bounds: any, screenWidth: number, screenHeight: number) {
    // Use the pre-calculated center from bounds
    const graphCenterX = bounds.centerX;
    const graphCenterY = bounds.centerY;
    const graphWidth = bounds.width;
    const graphHeight = bounds.height;
    
    // Use more generous padding to account for sample labels below nodes
    const horizontalPadding = 30;  // Standard padding on sides
    const verticalPadding = 45;    // Extra padding on top/bottom for sample labels
    
    // Handle edge case where all nodes are in same position
    const effectiveGraphWidth = Math.max(graphWidth, 50);
    const effectiveGraphHeight = Math.max(graphHeight, 50);
    
    // Calculate scale to fit the entire bounding box with padding
    const scaleX = (screenWidth - 2 * horizontalPadding) / effectiveGraphWidth;
    const scaleY = (screenHeight - 2 * verticalPadding) / effectiveGraphHeight;
    
    // Use the smaller scale to ensure everything fits, but clamp to reasonable limits
    const scale = Math.min(
        Math.max(GRAPH_CONSTANTS.ZOOM.GRAPH_FIT_SCALE_MIN, Math.min(scaleX, scaleY)), 
        GRAPH_CONSTANTS.ZOOM.GRAPH_FIT_SCALE_MAX
    );

    console.log('Fit transform calculation:', {
        graphCenter: [graphCenterX, graphCenterY],
        graphDimensions: [graphWidth, graphHeight],
        screenDimensions: [screenWidth, screenHeight],
        padding: { horizontal: horizontalPadding, vertical: verticalPadding },
        scale,
        scaleX,
        scaleY,
        effectiveDimensions: [effectiveGraphWidth, effectiveGraphHeight]
    });

    // Create transform that:
    // 1. Moves to screen center
    // 2. Applies scale
    // 3. Moves graph center to origin (so scaling happens around graph center)
    return d3.zoomIdentity
        .translate(screenWidth / 2, screenHeight / 2)  // Move to screen center
        .scale(scale)                                   // Apply calculated scale
        .translate(-graphCenterX, -graphCenterY);      // Center graph at origin
}

// Helper function to apply jitter to vertically aligned nodes
function applyVerticalAlignmentJitter(nodes: Node[], edges: GraphEdge[], minX: number, maxX: number) {
    // Group nodes by x-coordinate
    const nodesByX = new Map<number, Node[]>();
    nodes.forEach(node => {
        if (!node.is_sample) { // Don't jitter sample nodes
            const x = Math.round(node.x! * 100) / 100; // Round to 2 decimal places to group "nearly same" x values
            const nodesAtX = nodesByX.get(x) || [];
            nodesAtX.push(node);
            nodesByX.set(x, nodesAtX);
        }
    });

    // For each group of nodes at the same x, apply jitter if needed
    nodesByX.forEach((nodesAtX, x) => {
        if (nodesAtX.length > 1) {
            // Sort nodes by y to process them in order
            nodesAtX.sort((a, b) => a.y! - b.y!);
            
            // For each pair of nodes, check if they're connected
            for (let i = 0; i < nodesAtX.length; i++) {
                for (let j = i + 1; j < nodesAtX.length; j++) {
                    const node1 = nodesAtX[i];
                    const node2 = nodesAtX[j];
                    
                    // Check if these nodes are directly connected
                    const areConnected = edges.some(edge => {
                        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
                        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
                        return (sourceId === node1.id && targetId === node2.id) ||
                               (sourceId === node2.id && targetId === node1.id);
                    });
                    
                    if (!areConnected) {
                        // Apply jitter to the second node
                        // Use a consistent jitter based on node IDs to maintain stability
                        const jitterSeed = (node2.id * 10000 + node1.id) % 1000 / 1000;
                        const jitterAmount = 15; // Maximum jitter amount
                        const jitter = (jitterSeed - 0.5) * jitterAmount;
                        
                        // Apply jitter while respecting bounds
                        const newX = Math.max(minX, Math.min(maxX, node2.x! + jitter));
                        node2.x = newX;
                        node2.fx = newX;
                    }
                }
            }
        }
    });
}

// Helper function to calculate y position based on temporal spacing mode
function calculateYPosition(
    time: number,
    uniqueTimes: number[],
    availableHeight: number,
    temporalSpacingMode: TemporalSpacingMode,
    temporalSpacing: number = 12
): number {
    if (uniqueTimes.length <= 1) return availableHeight / 2;

    const minTime = uniqueTimes[0];
    const maxTime = uniqueTimes[uniqueTimes.length - 1];
    const timeRange = maxTime - minTime;

    let normalizedTime: number;
    switch (temporalSpacingMode) {
        case 'log':
            // Avoid log(0) by using a small offset
            const minTimeOffset = minTime === 0 ? 0.1 : minTime;
            const timeOffset = time === 0 ? 0.1 : time;
            normalizedTime = (Math.log(timeOffset) - Math.log(minTimeOffset)) / 
                           (Math.log(maxTime) - Math.log(minTimeOffset));
            break;
        case 'linear':
            normalizedTime = (time - minTime) / timeRange;
            break;
        case 'equal':
        default:
            const timeIndex = uniqueTimes.indexOf(time);
            normalizedTime = timeIndex / (uniqueTimes.length - 1);
            break;
    }

    // Apply temporal spacing factor correctly based on the spacing mode
    const spacingMultiplier = temporalSpacing / 12; // Normalize to default value of 12
    
    // Use the calculated normalizedTime for positioning (works for all modes)
    const basePosition = normalizedTime * availableHeight * spacingMultiplier;
    
    // Center the layout vertically if spacing is very large or small
    const usedHeight = availableHeight * spacingMultiplier;
    const verticalOffset = Math.max(0, (availableHeight - usedHeight) / 2);
    
    // Position from bottom (time 0 at bottom, higher times at top)
    return availableHeight - basePosition - verticalOffset;
}

// Helper function to find optimal label position that avoids edges and nodes
function findOptimalLabelPosition(
    node: Node,
    nodes: Node[],
    edges: GraphEdge[],
    nodeRadius: number,
    labelWidth: number = 20,
    labelHeight: number = 12
): { dx: number; dy: number } {
    // Preferred positions in order: right, left, above, below
    const positions = [
        { dx: nodeRadius + 10, dy: 4 },     // Right (increased spacing)
        { dx: -(nodeRadius + labelWidth + 10), dy: 4 }, // Left (increased spacing)
        { dx: -(labelWidth / 2), dy: -(nodeRadius + labelHeight + 6) }, // Above (increased spacing)
        { dx: -(labelWidth / 2), dy: nodeRadius + labelHeight + 10 }     // Below (increased spacing)
    ];
    
    for (const pos of positions) {
        const labelX = (node.x || 0) + pos.dx;
        const labelY = (node.y || 0) + pos.dy;
        
        // Define label bounds for more accurate collision detection
        const labelBounds = {
            left: labelX - labelWidth / 2,
            right: labelX + labelWidth / 2,
            top: labelY - labelHeight / 2,
            bottom: labelY + labelHeight / 2
        };
        
        let hasConflict = false;
        
        // More thorough check against other nodes
        for (const otherNode of nodes) {
            if (otherNode.id === node.id || !otherNode.x || !otherNode.y) continue;
            
            const otherNodeRadius = getNodeRadius(otherNode, DEFAULT_NODE_SIZES, nodes, edges);
            const clearanceDistance = otherNodeRadius + 20; // Increased clearance
            
            // Check distance to node center
            const distanceToCenter = Math.sqrt(
                Math.pow(labelX - otherNode.x, 2) + 
                Math.pow(labelY - otherNode.y, 2)
            );
            
            if (distanceToCenter < clearanceDistance) {
                hasConflict = true;
                break;
            }
            
            // Also check if label bounds overlap with node circle
            const closestX = Math.max(labelBounds.left, Math.min(otherNode.x, labelBounds.right));
            const closestY = Math.max(labelBounds.top, Math.min(otherNode.y, labelBounds.bottom));
            const distanceToClosest = Math.sqrt(
                Math.pow(closestX - otherNode.x, 2) + 
                Math.pow(closestY - otherNode.y, 2)
            );
            
            if (distanceToClosest < otherNodeRadius + 5) { // 5px buffer
                hasConflict = true;
                break;
            }
        }
        
        // Improved edge conflict detection
        if (!hasConflict) {
            for (const edge of edges) {
                const sourceNode = typeof edge.source === 'number' 
                    ? nodes.find(n => n.id === edge.source) 
                    : edge.source as Node;
                const targetNode = typeof edge.target === 'number' 
                    ? nodes.find(n => n.id === edge.target) 
                    : edge.target as Node;
                    
                if (!sourceNode || !targetNode || !sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) continue;
                
                // Skip edges connected to this node
                if (sourceNode.id === node.id || targetNode.id === node.id) continue;
                
                // Check if label center is too close to the line segment
                const distanceToLine = distanceFromPointToLineSegment(
                    labelX, labelY,
                    sourceNode.x, sourceNode.y,
                    targetNode.x, targetNode.y
                );
                
                if (distanceToLine < 25) { // Increased clearance from edges
                    hasConflict = true;
                    break;
                }
            }
        }
        
        if (!hasConflict) {
            return pos;
        }
    }
    
    // If all positions have conflicts, use the first (right) position
    return positions[0];
}

// Helper function to calculate distance from point to line segment
function distanceFromPointToLineSegment(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
        // Line segment is a point
        return Math.sqrt(A * A + B * B);
    }
    
    let param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Update setupInitialNodePositions
const setupInitialNodePositions = (
    combinedNodes: Node[], 
    combinedEdges: GraphEdge[], 
    actualWidth: number, 
    actualHeight: number, 
    sampleOrder?: string,
    nodeSizes?: NodeSizeSettings,
    temporalSpacingMode: TemporalSpacingMode = 'equal',
    temporalSpacing: number = 12,
    sampleSpacing: number = 20
) => {
    const uniqueTimes = Array.from(new Set(combinedNodes.map(n => n.time))).sort((a, b) => a - b);
    const timeToIndex = new Map(uniqueTimes.map((time, index) => [time, index]));
    const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
    const timeSpacing = availableHeight / (uniqueTimes.length - 1 || 1);
    const xPadding = actualWidth * GRAPH_CONSTANTS.PADDING_RATIO;
    const availableWidth = actualWidth - (2 * xPadding);

    // Add timeIndex to each node
    combinedNodes.forEach(node => {
        node.timeIndex = timeToIndex.get(node.time) ?? 0;
    });

    if (sampleOrder === 'dagre') {
        // Create a CLEAN dagre implementation that properly minimizes crossings
        const g = new dagre.graphlib.Graph();
        
        // Use consistent base spacing for dagre - user preferences applied in post-processing
        const baseSampleSpacing = GRAPH_CONSTANTS.DAGRE.NODE_SEPARATION;
        const baseTemporalSpacing = GRAPH_CONSTANTS.DAGRE.RANK_SEPARATION;
        
        g.setGraph({
            rankdir: 'TB',
            nodesep: baseSampleSpacing,
            ranksep: baseTemporalSpacing,
            marginx: GRAPH_CONSTANTS.DAGRE.MARGIN_X,
            marginy: GRAPH_CONSTANTS.DAGRE.MARGIN_Y,
            ranker: 'network-simplex', // Most robust for crossing minimization
        });
        g.setDefaultEdgeLabel(() => ({}));

        // CRITICAL: Assign ranks based on time to ensure proper temporal layering
        // In ARGs: time=0 is usually present (samples), higher time = older (ancestors)
        // We want: samples at BOTTOM (highest rank), ancestors at TOP (lowest rank)
        const sortedTimes = uniqueTimes.slice().sort((a, b) => a - b); // Oldest to newest
        const maxRank = sortedTimes.length - 1;
        const timeToRank = new Map(sortedTimes.map((time, index) => [time, maxRank - index])); // Reverse so samples get highest rank
        
        const nodeRadius = nodeSizes?.sample ?? 8;
        
        // Add nodes to dagre graph
        combinedNodes.forEach(node => {
            g.setNode(node.id.toString(), {
                width: nodeRadius * GRAPH_CONSTANTS.DAGRE.NODE_SIZE_MULTIPLIER,
                height: nodeRadius * GRAPH_CONSTANTS.DAGRE.NODE_SIZE_MULTIPLIER,
                label: node.id.toString()
            });
        });

        // No dummy edges needed - let real edges enforce temporal structure

        // Add edges in CORRECT direction for ARGs (older -> younger based on time)
        combinedEdges.forEach(edge => {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            const sourceNode = combinedNodes.find(n => n.id === sourceId);
            const targetNode = combinedNodes.find(n => n.id === targetId);
            
            if (!sourceNode || !targetNode) return;
            
            // CRITICAL: Ensure edges always flow from ancestor (older/smaller time) to descendant (younger/larger time)
            if (sourceNode.time <= targetNode.time) {
                g.setEdge(sourceId.toString(), targetId.toString(), {
                    weight: 1,
                    minlen: Math.max(1, Math.abs(timeToRank.get(targetNode.time)! - timeToRank.get(sourceNode.time)!))
                });
            } else {
                g.setEdge(targetId.toString(), sourceId.toString(), {
                    weight: 1,
                    minlen: Math.max(1, Math.abs(timeToRank.get(sourceNode.time)! - timeToRank.get(targetNode.time)!))
                });
            }
        });

        // Run dagre layout
        dagre.layout(g);

        // Apply spacing-respecting scaling for dagre - preserve user spacing intent
        const dagreNodes = g.nodes().map(nodeId => g.node(nodeId));
        if (dagreNodes.length === 0) return { timeSpacing: 0, uniqueTimes: [] };

        const minX = Math.min(...dagreNodes.map(n => n.x - n.width / 2));
        const maxX = Math.max(...dagreNodes.map(n => n.x + n.width / 2));
        const minY = Math.min(...dagreNodes.map(n => n.y - n.height / 2));
        const maxY = Math.max(...dagreNodes.map(n => n.y + n.height / 2));
        
        const dagreWidth = maxX - minX;
        const dagreHeight = maxY - minY;

        // Calculate base scale to fit the standard layout, then apply user spacing multipliers
        const baseScaleX = Math.min(availableWidth / Math.max(dagreWidth, 1), 2.0);
        const baseScaleY = Math.min(availableHeight / Math.max(dagreHeight, 1), 2.0);
        
        // Apply user spacing preferences as multipliers to the base scale
        const userSampleMultiplier = sampleSpacing / 20; // Normalize to default
        const userTemporalMultiplier = temporalSpacing / 12; // Normalize to default
        
        // Final scales incorporate user spacing preferences
        const finalScaleX = baseScaleX;
        const finalScaleY = baseScaleY;
        
        // Apply base scaling first
        const baseScaledWidth = dagreWidth * finalScaleX;
        const baseScaledHeight = dagreHeight * finalScaleY;
        const baseOffsetX = (actualWidth - baseScaledWidth) / 2;
        const baseOffsetY = (actualHeight - baseScaledHeight) / 2;

        // Apply dagre positions with base scaling, then apply user spacing effects
        combinedNodes.forEach(node => {
            const dagreNode = g.node(node.id.toString());
            // Base scaled position
            const baseX = (dagreNode.x - minX) * finalScaleX + baseOffsetX;
            const baseY = baseOffsetY + baseScaledHeight - ((dagreNode.y - minY) * finalScaleY);
            
            // Store original positions for spacing calculations
            node.originalX = baseX;
            node.originalY = baseY;
            
            // Apply user spacing multipliers relative to center
            const centerX = actualWidth / 2;
            const centerY = actualHeight / 2;
            
            // Apply sample spacing to horizontal positioning
            const deltaX = baseX - centerX;
            node.x = centerX + (deltaX * userSampleMultiplier);
            
            // Apply temporal spacing to vertical positioning  
            const deltaY = baseY - centerY;
            node.y = centerY + (deltaY * userTemporalMultiplier);
            
            node.fx = node.x; // Fix positions completely
            node.fy = node.y; // Fix Y positions too - don't let simulation override
        });
    } else {
        // Position sample nodes first
        const sampleNodes = combinedNodes.filter(n => n.is_sample);
        
        // Apply sample spacing factor - normalize with more aggressive effects
        const baseSampleSpacing = availableWidth / (sampleNodes.length - 1 || 1);
        const adjustedSampleSpacing = baseSampleSpacing * (sampleSpacing / 15); // More aggressive: matches dagre implementation

        // Sort sample nodes based on the selected order mode
        switch (sampleOrder) {
            case 'ancestral_path':
                // Use ancestral path algorithm
                const arrangedSamples = arrangeSamplesByAncestralPath(sampleNodes, combinedNodes, combinedEdges);
                sampleNodes.splice(0, sampleNodes.length, ...arrangedSamples);
                break;
                
            case 'coalescence':
                // Use coalescence time algorithm
                const coalescenceSamples = arrangeSamplesByCoalescence(sampleNodes, combinedNodes, combinedEdges);
                sampleNodes.splice(0, sampleNodes.length, ...coalescenceSamples);
                break;
                
            case 'numeric':
                // Simple numeric order by node ID
                sampleNodes.sort((a, b) => a.id - b.id);
                break;
                
            default:
                // For other modes (center_minlex, first_tree, custom), use backend order_position if available
                sampleNodes.sort((a, b) => {
                    if (a.order_position !== undefined && b.order_position !== undefined) {
                        return a.order_position - b.order_position;
                    }
                    if (a.order_position !== undefined) return -1;
                    if (b.order_position !== undefined) return 1;
                    // Fallback to numeric if no order_position
                    return a.id - b.id;
                });
                break;
        }

        // Calculate center offset to position nodes in the middle
        const totalWidth = (sampleNodes.length - 1) * adjustedSampleSpacing;
        const centerOffset = (actualWidth - totalWidth) / 2;

        // Position sample nodes centered in the available space
        sampleNodes.forEach((node, index) => {
            node.x = centerOffset + (index * adjustedSampleSpacing);
            node.fx = node.x;
            node.y = calculateYPosition(node.time, uniqueTimes, availableHeight, temporalSpacingMode, temporalSpacing);
            node.fy = node.y;
        });

        // Initialize non-sample nodes from bottom to top
        const nonSampleNodes = combinedNodes.filter(n => !n.is_sample)
            .sort((a, b) => b.timeIndex! - a.timeIndex!); // Sort by time, bottom to top

        nonSampleNodes.forEach(node => {
            // Use the improved optimal positioning function
            const optimalX = getOptimalXPosition(node, combinedNodes, combinedEdges);
            
            if (optimalX !== null) {
                // Add small random offset to prevent perfect overlap
                const offset = (Math.random() - 0.5) * 15; // ±7.5px random offset
                node.x = optimalX + offset;
                
                // Ensure we stay within descendant range even with offset
                const descendantRange = getDescendantSampleRange(node, combinedNodes, combinedEdges);
                if (descendantRange) {
                    node.x = Math.max(descendantRange.min, Math.min(descendantRange.max, node.x));
                }
            } else {
                // Fallback to centered position within sample range
                const sampleMinX = Math.min(...sampleNodes.map(n => n.x!));
                const sampleMaxX = Math.max(...sampleNodes.map(n => n.x!));
                const centerX = (sampleMinX + sampleMaxX) / 2;
                const maxOffset = (sampleMaxX - sampleMinX) * 0.3; // Stay within 30% of sample range
                const randomOffset = (Math.random() - 0.5) * maxOffset;
                node.x = centerX + randomOffset;
            }
            
            node.fx = null; // Allow x position to be adjusted by forces
            node.y = calculateYPosition(node.time, uniqueTimes, availableHeight, temporalSpacingMode, temporalSpacing);
            node.fy = node.y;
        });
    }

    return { timeSpacing, uniqueTimes };
};

// Add type for simulation
type Simulation = d3.Simulation<Node, undefined>;

// Add helper function to get children of a node
function getChildren(node: Node, nodes: Node[], edges: GraphEdge[]): Node[] {
    return edges
        .filter(e => {
            const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
            return sourceId === node.id;
        })
        .map(e => {
            const targetId = typeof e.target === 'number' ? e.target : e.target.id;
            return nodes.find(n => n.id === targetId);
        })
        .filter((n): n is Node => n !== undefined);
}

// New custom force to constrain internal nodes within their descendant sample ranges
// Helper function to detect if we're in a "parent ARG" situation where nodes need more horizontal freedom
function isLikelyParentARG(nodes: Node[], edges: GraphEdge[]): boolean {
    const sampleNodes = nodes.filter(n => n.is_sample);
    const internalNodes = nodes.filter(n => !n.is_sample);
    
    // If we have very few samples (1-2) but many internal nodes, likely a parent ARG
    if (sampleNodes.length <= 2 && internalNodes.length > 3) {
        return true;
    }
    
    // If most nodes are connected to very few samples, likely a parent ARG
    const nodesWithFewDescendants = internalNodes.filter(node => {
        const descendants = getDescendantSamples(node, nodes, edges);
        return descendants.length <= 2;
    });
    
    return nodesWithFewDescendants.length > internalNodes.length * 0.7;
}

function createDescendantRangeForce(nodes: Node[], edges: GraphEdge[]) {
    return function force() {
        // Find sample nodes to get the overall range
        const sampleNodes = nodes.filter(n => n.is_sample && n.x !== undefined);
        if (sampleNodes.length === 0) return;
        
        const sampleMinX = Math.min(...sampleNodes.map(n => n.x!));
        const sampleMaxX = Math.max(...sampleNodes.map(n => n.x!));
        const sampleRange = sampleMaxX - sampleMinX;
        
        // Check if this is likely a parent ARG situation
        const isParentARG = isLikelyParentARG(nodes, edges);
        
        // Calculate a reasonable spread based on the number of nodes
        const internalNodes = nodes.filter(n => !n.is_sample);
        const desiredSpread = Math.max(sampleRange * 2, internalNodes.length * 30); // At least 30px per internal node
        
        nodes.forEach(node => {
            if (node.is_sample || node.x === undefined) return;
            
            // Get the range this node should be constrained to based on its descendants
            const descendantRange = getDescendantSampleRange(node, nodes, edges);
            
            if (descendantRange && !isParentARG) {
                // For normal ARGs, apply gentle constraints with expansion
                const rangeMidpoint = (descendantRange.min + descendantRange.max) / 2;
                const expandedRange = Math.max(descendantRange.max - descendantRange.min, 100); // Minimum 100px range
                const expandedMin = rangeMidpoint - expandedRange / 2;
                const expandedMax = rangeMidpoint + expandedRange / 2;
                
                // Apply soft constraints - only adjust if way outside the range
                if (node.x < expandedMin - 50) {
                    node.x += (expandedMin - node.x) * 0.1; // Gradual adjustment
                    node.vx = (node.vx || 0) * 0.8; // Gentle velocity damping
                } else if (node.x > expandedMax + 50) {
                    node.x += (expandedMax - node.x) * 0.1; // Gradual adjustment
                    node.vx = (node.vx || 0) * 0.8; // Gentle velocity damping
                }
            } else {
                // For parent ARGs or nodes without descendants, allow much more freedom
                const centerX = (sampleMinX + sampleMaxX) / 2;
                const allowedMin = centerX - desiredSpread / 2;
                const allowedMax = centerX + desiredSpread / 2;
                
                // Only apply very loose constraints
                if (node.x < allowedMin - 100) {
                    node.x += (allowedMin - node.x) * 0.05; // Very gentle adjustment
                } else if (node.x > allowedMax + 100) {
                    node.x += (allowedMax - node.x) * 0.05; // Very gentle adjustment
                }
            }
        });
    };
}

// Improved function to get the optimal x position for a node based on its children
function getOptimalXPosition(node: Node, nodes: Node[], edges: GraphEdge[]): number | null {
    if (node.is_sample) return node.x || null;
    
    // First try to get children's midpoint (direct children)
    const children = getChildren(node, nodes, edges);
    const childrenWithX = children.filter(c => c.x !== undefined);
    
    if (childrenWithX.length > 0) {
        const xValues = childrenWithX.map(c => c.x!);
        const midpoint = (Math.min(...xValues) + Math.max(...xValues)) / 2;
        
        // Verify this midpoint is within descendant sample range
        const descendantRange = getDescendantSampleRange(node, nodes, edges);
        if (descendantRange) {
            return Math.max(descendantRange.min, Math.min(descendantRange.max, midpoint));
        }
        return midpoint;
    }
    
    // Fallback to descendant sample range center
    const descendantRange = getDescendantSampleRange(node, nodes, edges);
    if (descendantRange) {
        return (descendantRange.min + descendantRange.max) / 2;
    }
    
    return null;
}

export const ForceDirectedGraph = forwardRef<SVGSVGElement, ForceDirectedGraphProps>(({ 
    data, 
    width, 
    height,
    onNodeClick,
    onNodeRightClick,
    onEdgeClick,
    focalNode,
    nodeSizes = DEFAULT_NODE_SIZES,
    nodeIdSettings = DEFAULT_NODE_ID_SETTINGS,
    edgeLabelSettings = DEFAULT_EDGE_LABEL_SETTINGS,
    edgeMutationSettings,
    sampleOrder = 'consensus',
    edgeThickness = GRAPH_CONSTANTS.EDGE_STROKE_WIDTH,
    edgeOpacity = 95,
    temporalSpacingMode = 'equal',
    temporalSpacing = 12,
    sampleSpacing = 20
}, ref: ForwardedRef<SVGSVGElement>) => {
    const { colors } = useColorTheme();
    
    // Store current visualization state to preserve user movements
    const visualStateRef = useRef<{
        nodes: Node[];
        edges: GraphEdge[];
        simulation: Simulation | null;
        svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
        zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null;
        userMovedNodes: Map<number, { x: number; y: number; fx: number | null; fy: number | null }>;
    }>({
        nodes: [],
        edges: [],
        simulation: null,
        svg: null,
        zoom: null,
        userMovedNodes: new Map()
    });

    // Memoize data key to prevent unnecessary simulation restarts
    const dataKey = useMemo(() => {
        if (!data) return null;
        return `${data.nodes.length}-${data.edges.length}-${data.metadata.genomic_start || 0}-${data.metadata.genomic_end || data.metadata.sequence_length}`;
    }, [data?.nodes.length, data?.edges.length, data?.metadata.genomic_start, data?.metadata.genomic_end, data?.metadata.sequence_length]);

    const prevDataRef = useRef<{ data: typeof data; key: string | null }>({ data: null, key: null });
    const prevFocalNodeRef = useRef<GraphNode | null>(null);
    const shouldAutoZoomRef = useRef<boolean>(false);
    
    const stableData = useMemo(() => {
        if (!data || !dataKey) return null;
        
        const isNewData = prevDataRef.current.key !== dataKey;
        if (isNewData || !prevDataRef.current.data) {
        prevDataRef.current = { data, key: dataKey };
            shouldAutoZoomRef.current = true; // Auto-zoom for new data
        return data;
        }
        
        return prevDataRef.current.data;
    }, [data, dataKey]);
    
    // Track focal node changes to determine when auto-zoom should happen
    // Auto-zoom should only occur for structural changes:
    // 1. New data is loaded (new ARG structure)
    // 2. Focal node changes (opening subARG, changing focus)
    // Auto-zoom should NOT occur for visual parameter changes:
    // 1. Adjusting temporal/sample spacing
    // 2. Changing node sizes, edge thickness
    // 3. Changing temporal spacing modes
    useEffect(() => {
        const focalNodeChanged = prevFocalNodeRef.current?.id !== focalNode?.id;
        if (focalNodeChanged) {
            console.log('Focal node changed:', prevFocalNodeRef.current?.id, '->', focalNode?.id);
            shouldAutoZoomRef.current = true; // Auto-zoom for focal node changes (including clearing focus)
        }
        prevFocalNodeRef.current = focalNode || null;
    }, [focalNode]);

    // Function to update spacing without full re-render
    const updateSpacing = useCallback((newTemporalSpacing: number, newSampleSpacing: number, newTemporalSpacingMode: TemporalSpacingMode) => {
        if (!visualStateRef.current.simulation || !visualStateRef.current.svg || !ref || typeof ref === 'function' || !ref.current) return;
        
        const containerRect = ref.current.getBoundingClientRect();
        const actualWidth = width || containerRect.width || 800;
        const actualHeight = height || containerRect.height || 600;
        const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
        
        const { nodes: currentNodes, simulation } = visualStateRef.current;
        const uniqueTimes = Array.from(new Set(currentNodes.map(n => n.time))).sort((a, b) => a - b);
        
        if (sampleOrder === 'dagre') {
            // For dagre mode, apply spacing multipliers directly to existing positions
            const userSampleMultiplier = newSampleSpacing / 20; // Normalize to default
            const userTemporalMultiplier = newTemporalSpacing / 12; // Normalize to default
            
            const centerX = actualWidth / 2;
            const centerY = actualHeight / 2;
            
            currentNodes.forEach(node => {
                // Only update if user hasn't manually moved this node
                if (!visualStateRef.current.userMovedNodes.has(node.id)) {
                    // Store original position if not already stored
                    if (!node.originalX) {
                        node.originalX = node.x || 0;
                        node.originalY = node.y || 0;
                    }
                    
                    // Apply spacing multipliers relative to center
                    const originalDeltaX = (node.originalX ?? node.x ?? 0) - centerX;
                    const originalDeltaY = (node.originalY ?? node.y ?? 0) - centerY;
                    
                    node.x = centerX + (originalDeltaX * userSampleMultiplier);
                    node.y = centerY + (originalDeltaY * userTemporalMultiplier);
                    node.fx = node.x;
                    node.fy = node.y;
                }
            });
            
        } else {
            // For non-dagre modes, update positions directly
            
            // Update sample node positions (x-axis)
            const sampleNodes = currentNodes.filter(n => n.is_sample);
            if (sampleNodes.length > 0) {
                const availableWidth = actualWidth - (2 * actualWidth * GRAPH_CONSTANTS.PADDING_RATIO);
                            const baseSampleSpacing = availableWidth / (sampleNodes.length - 1 || 1);
            const adjustedSampleSpacing = baseSampleSpacing * (newSampleSpacing / 15); // More aggressive: matches main implementation
                const totalWidth = (sampleNodes.length - 1) * adjustedSampleSpacing;
                const centerOffset = (actualWidth - totalWidth) / 2;
                
                sampleNodes.forEach((node, index) => {
                    // Only update if user hasn't manually moved this node
                    if (!visualStateRef.current.userMovedNodes.has(node.id)) {
                        const newX = centerOffset + (index * adjustedSampleSpacing);
                        node.x = newX;
                        node.fx = newX;
                    }
                });
            }
            
            // Update all node positions (y-axis) based on temporal spacing
            currentNodes.forEach(node => {
                // Only update if user hasn't manually moved this node
                if (!visualStateRef.current.userMovedNodes.has(node.id)) {
                    const newY = calculateYPosition(node.time, uniqueTimes, availableHeight, newTemporalSpacingMode, newTemporalSpacing);
                    node.y = newY;
                    node.fy = newY;
                }
            });
        }
        
        // Update the simulation forces with new positions
        simulation.alpha(0.1).restart();
        
    }, [width, height, nodeSizes, sampleOrder]);
    
    // Separate effect for spacing updates that don't require full re-render
    useEffect(() => {
        updateSpacing(temporalSpacing, sampleSpacing, temporalSpacingMode);
        // IMPORTANT: Do NOT trigger auto-zoom for spacing changes
        // shouldAutoZoomRef.current should remain false here
    }, [temporalSpacing, sampleSpacing, temporalSpacingMode, updateSpacing]);

    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current || !stableData) return;

        const containerRect = ref.current.getBoundingClientRect();
        const actualWidth = width || containerRect.width || 800;
        const actualHeight = height || containerRect.height || 600;
        const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);

        // Debug: Analyze node combining patterns
        analyzeNodeCombining(stableData.nodes, stableData.edges);
        
        const { nodes: combinedNodes, edges: combinedEdges } = combineGenealogyIdenticalNodes(stableData.nodes, stableData.edges);
        const uniqueTimes = Array.from(new Set(combinedNodes.map(n => n.time))).sort((a, b) => a - b);

        d3.select(ref.current).selectAll("*").remove();

        const svg = d3.select(ref.current)
            .attr("width", actualWidth)
            .attr("height", actualHeight)
            .attr("viewBox", [0, 0, actualWidth, actualHeight])
            .attr("style", "max-width: 100%; height: auto;");

        const g = svg.append("g");

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([GRAPH_CONSTANTS.ZOOM.MIN_SCALE, GRAPH_CONSTANTS.ZOOM.MAX_SCALE])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        const focusOnNode = createFocusFunction(svg, zoom, actualWidth, actualHeight, 0);
        const { timeSpacing, uniqueTimes: setupUniqueTimes } = setupInitialNodePositions(combinedNodes, combinedEdges, actualWidth, actualHeight, sampleOrder, nodeSizes, temporalSpacingMode, temporalSpacing, sampleSpacing);

        // Store visualization state for the updateSpacing function
        visualStateRef.current = {
            nodes: combinedNodes,
            edges: combinedEdges,
            simulation: null, // Will be set below
            svg,
            zoom,
            userMovedNodes: visualStateRef.current.userMovedNodes // Preserve user movements
        };

        // Only auto-zoom when there's a structural change, not for visual parameter adjustments
        if (shouldAutoZoomRef.current) {
            console.log('Auto-zoom triggered:', {
                focalNode: focalNode ? `node ${focalNode.id}` : 'none',
                action: focalNode ? 'focusing on specific node' : 'fitting entire graph to view',
                nodeCount: combinedNodes.length,
                edgeCount: combinedEdges.length
            });
            
            // Reset flag immediately to prevent multiple calls
            shouldAutoZoomRef.current = false;
            
            // Use a small delay to ensure nodes are positioned before zoom
            setTimeout(() => {
        if (focalNode) {
                    // Focus on specific node (subARG)
                    console.log('Executing focus on node:', focalNode.id);
                    focusOnNode(focalNode, combinedNodes, combinedEdges, false);
                } else {
                    // Fit entire graph to view using the enhanced bounds calculation
                    console.log('Executing fit to entire graph');
                    focusOnNode(null, combinedNodes, combinedEdges, true);
                }
            }, 100);
        }

        // Create tooltip outside of simulation
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", colors.tooltipBackground)
            .style("color", colors.tooltipText)
            .style("border", `1px solid ${colors.border}`)
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-size", GRAPH_CONSTANTS.TOOLTIP_FONT_SIZE)
            .style("pointer-events", "none");

        // Create simulation with proper typing
        const simulation: Simulation = d3.forceSimulation<Node>(combinedNodes)
            .alpha(sampleOrder === 'dagre' ? 0 : GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_START)
            .alphaDecay(sampleOrder === 'dagre' ? 1 : GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_DECAY)
            .velocityDecay(sampleOrder === 'dagre' ? 1 : 0.4) // Reduced from 0.7 to allow more movement
            .force("link", sampleOrder === 'dagre' ? null : d3.forceLink<Node, GraphEdge>(combinedEdges)
                .id(d => d.id)
                .distance(d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    if (!source || !target) return 100; // Default distance if nodes not found
                    // Slightly reduce vertical spacing between layers
                    const verticalDistance = Math.abs((source.timeIndex ?? 0) - (target.timeIndex ?? 0));
                    const baseDistance = (source.is_sample || target.is_sample) ? 110 : 90; // Reduced from 120/100
                    return baseDistance + verticalDistance * 20; // Reduced from 25px per layer
                })
                .strength(d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    if (!source || !target) return 0.5; // Default strength if nodes not found
                    const sourceParent = getParent(source, combinedNodes, combinedEdges);
                    const targetParent = getParent(target, combinedNodes, combinedEdges);
                    if (sourceParent && targetParent && sourceParent.id === targetParent.id) {
                        return GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_SIBLING * 1.2; // Reduced from 1.3
                    }
                    return (source.is_sample || target.is_sample) ? 
                        GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_SAMPLE * 1.2 : // Reduced from 1.3
                        GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_DEFAULT * 1.6; // Reduced from 1.8
                }))
            .force("charge", sampleOrder === 'dagre' ? null : d3.forceManyBody()
                .strength((d: d3.SimulationNodeDatum) => {
                    const node = d as Node;
                    const baseCharge = node.is_sample ? 
                        GRAPH_CONSTANTS.FORCE_STRENGTH.CHARGE * 2.7 : // Reduced from 3
                        GRAPH_CONSTANTS.FORCE_STRENGTH.CHARGE * 2.2; // Reduced from 2.5
                    // Slightly reduce per-connection bonus
                    const edges = combinedEdges.filter(e => {
                        const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
                        const targetId = typeof e.target === 'number' ? e.target : e.target.id;
                        return sourceId === node.id || targetId === node.id;
                    });
                    return baseCharge * (1 + edges.length * 0.12); // Reduced from 0.15
                }))
            .force("x", sampleOrder === 'dagre' ? null : d3.forceX((d: Node) => {
                if (d.is_sample) return d.x!;
                
                // Use the improved optimal positioning function
                const optimalX = getOptimalXPosition(d, combinedNodes, combinedEdges);
                if (optimalX !== null) {
                    return optimalX;
                }
                
                return d.x ?? actualWidth / 2;
            }).strength((d: Node) => {
                // Increase x-positioning strength for nodes with descendants to keep them close to children
                if (d.is_sample) return 1.0; // Keep samples fixed
                
                const descendantRange = getDescendantSampleRange(d, combinedNodes, combinedEdges);
                if (descendantRange) {
                    // Strong positioning for nodes with descendants
                    return GRAPH_CONSTANTS.FORCE_STRENGTH.X_POSITION * 2.5;
                }
                
                const hasChildren = getChildren(d, combinedNodes, combinedEdges).length > 0;
                return hasChildren ? 
                    GRAPH_CONSTANTS.FORCE_STRENGTH.X_POSITION * 2.0 : 
                    GRAPH_CONSTANTS.FORCE_STRENGTH.X_POSITION * 1.0;
            }))
            .force("y", d3.forceY((d: Node) => 
                calculateYPosition(d.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode, temporalSpacing)
            ).strength(sampleOrder === 'dagre' ? 1 : GRAPH_CONSTANTS.FORCE_STRENGTH.Y_POSITION * 1.2)) // Reduced from 1.3
            .force("collision", sampleOrder === 'dagre' ? null : d3.forceCollide()
                .radius((d: d3.SimulationNodeDatum) => {
                    const node = d as Node;
                    return node.is_sample ? 
                        GRAPH_CONSTANTS.COLLISION_RADIUS * 1.8 : // Reduced from 2
                        GRAPH_CONSTANTS.COLLISION_RADIUS * 1.5; // Reduced from 1.7
                })
                .strength(0.9)) // Reduced from 1 to allow more flexibility
            .force("descendantRange", sampleOrder === 'dagre' ? null : createDescendantRangeForce(combinedNodes, combinedEdges)); // Add custom force

        const edges = g.append("g")
            .selectAll<SVGLineElement, GraphEdge>("line")
            .data(combinedEdges)
            .join("line")
            .attr("stroke", `rgb(${colors.edgeDefault[0]}, ${colors.edgeDefault[1]}, ${colors.edgeDefault[2]})`)
            .attr("stroke-opacity", edgeOpacity / 100)
            .attr("stroke-width", edgeThickness)
            .attr("x1", d => {
                const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                return source?.x ?? 0;
            })
            .attr("y1", d => {
                const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                return sampleOrder === 'dagre' ? (source?.y ?? 0) : 
                    calculateYPosition(source?.time ?? 0, setupUniqueTimes, availableHeight, temporalSpacingMode, temporalSpacing);
            })
            .attr("x2", d => {
                const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                return target?.x ?? 0;
            })
            .attr("y2", d => {
                const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                return sampleOrder === 'dagre' ? (target?.y ?? 0) : 
                    calculateYPosition(target?.time ?? 0, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode, temporalSpacing);
            })
            .on("click", (event, d) => onEdgeClick?.(d));

        // Create mutation markers (red "x"s) on edges that have mutations  
        let mutationMarkers: d3.Selection<SVGTextElement, GraphEdge, SVGGElement, unknown> | null = null;
        
        if (edgeMutationSettings?.showMutationMarkers) {
            const edgesWithMutations = combinedEdges.filter(d => d.has_mutations);
            console.log('Force-directed mutation markers debug:', {
                totalEdges: combinedEdges.length,
                edgesWithMutations: edgesWithMutations.length,
                firstFewMutationEdges: edgesWithMutations.slice(0, 5).map(edge => ({
                    source: typeof edge.source === 'number' ? edge.source : (edge.source as any).id,
                    target: typeof edge.target === 'number' ? edge.target : (edge.target as any).id,
                    has_mutations: edge.has_mutations,
                    left: edge.left,
                    right: edge.right
                })),
                percentageWithMutations: `${Math.round((edgesWithMutations.length / combinedEdges.length) * 100)}%`,
                note: 'High percentage is normal - most edges span large genomic regions containing mutations'
            });
            
            mutationMarkers = g.append("g")
                .attr("class", "mutation-markers")
                .selectAll<SVGTextElement, GraphEdge>("text")
                .data(edgesWithMutations)
                .join("text")
                .text("×") // Use multiplication sign for a clean "x" appearance
                .attr("font-size", "14px") // Slightly larger for visibility
                .attr("fill", "#dc2626") // Red color for mutation markers
                .attr("stroke", colors.background) // Background stroke for visibility
                .attr("stroke-width", "2px") // Thicker stroke for better contrast
                .attr("paint-order", "stroke fill")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("font-weight", "bold")
                .attr("font-family", "monospace, Arial, sans-serif") // Monospace for better symbol rendering
                .style("pointer-events", "none")
                .style("user-select", "none");
        }

        // Calculate edge groups for labels (only if labels are enabled)
        let edgeGroups: EdgeGroupWithSpans[] = [];
        if (edgeLabelSettings.showEdgeLabels) {
            // Try with original edges first to see if we're missing edges in combined edges
            const originalEdgeGroups = groupEdgesByPairs(stableData.edges, stableData.nodes, stableData.metadata.sequence_length);
            
            // Then try with combined edges
            edgeGroups = groupEdgesByPairs(combinedEdges, combinedNodes, stableData.metadata.sequence_length);
            
            // Use original edges if we get more edge groups that way
            if (originalEdgeGroups.length > edgeGroups.length) {
                edgeGroups = originalEdgeGroups;
                
                // But we still need to expand for combined nodes if any exist
                edgeGroups = expandEdgeSpansForCombinedNodes(
                    edgeGroups, 
                    combinedNodes, 
                    stableData.edges,
                    stableData.metadata.sequence_length
                );
            } else {
                // Handle combined nodes by expanding their genomic spans
                edgeGroups = expandEdgeSpansForCombinedNodes(
                    edgeGroups, 
                    combinedNodes, 
                    stableData.edges, // Use original edges for combined node expansion
                    stableData.metadata.sequence_length
                );
            }
        }

        // Helper function to find optimal edge label position
        const findOptimalEdgeLabelPosition = (
            sourceNode: Node, 
            targetNode: Node, 
            edgeGroup: EdgeGroupWithSpans,
            allNodes: Node[],
            allEdgeGroups: EdgeGroupWithSpans[]
        ): { x: number; y: number } => {
            if (!sourceNode || !targetNode) {
                console.warn(`Edge label positioning: missing nodes for ${edgeGroup.sourceId}->${edgeGroup.targetId}`);
                return { x: 0, y: 0 };
            }

            // Check if nodes have valid positions
            if (sourceNode.x === undefined || sourceNode.y === undefined || 
                targetNode.x === undefined || targetNode.y === undefined) {
                console.warn(`Edge label positioning: invalid positions for ${edgeGroup.sourceId}->${edgeGroup.targetId}`, {
                    source: { id: sourceNode.id, x: sourceNode.x, y: sourceNode.y },
                    target: { id: targetNode.id, x: targetNode.x, y: targetNode.y }
                });
                
                // Try to use available coordinates, or fallback to screen center
                const sourceX = sourceNode.x ?? actualWidth / 2;
                const sourceY = sourceNode.y ?? actualHeight / 2;
                const targetX = targetNode.x ?? actualWidth / 2;
                const targetY = targetNode.y ?? actualHeight / 2;
                
                return {
                    x: (sourceX + targetX) / 2,
                    y: (sourceY + targetY) / 2
                };
            }

            // Calculate midpoint of edge
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;
            
            // Calculate edge direction and perpendicular offset
            const edgeLength = Math.sqrt(Math.pow(targetNode.x - sourceNode.x, 2) + Math.pow(targetNode.y - sourceNode.y, 2));
            if (edgeLength === 0) {
                // Nodes are at the same position, offset slightly
                return { x: midX + 15, y: midY };
            }
            
            const edgeDirectionX = (targetNode.x - sourceNode.x) / edgeLength;
            const edgeDirectionY = (targetNode.y - sourceNode.y) / edgeLength;
            
            // Perpendicular direction for label offset
            const perpX = -edgeDirectionY;
            const perpY = edgeDirectionX;
            
            // Much smaller base offset - keep labels very close to edges
            const baseOffset = Math.max(6, edgeLabelSettings.labelFontSize * 0.6); // Reduced significantly
            
            // Try different offset positions - prioritize closer positions
            const positions = [
                { x: midX + perpX * baseOffset, y: midY + perpY * baseOffset },        // Close above/right
                { x: midX - perpX * baseOffset, y: midY - perpY * baseOffset },        // Close below/left
                { x: midX + perpX * baseOffset * 1.5, y: midY + perpY * baseOffset * 1.5 }, // Slightly further above/right
                { x: midX - perpX * baseOffset * 1.5, y: midY - perpY * baseOffset * 1.5 }, // Slightly further below/left
                { x: midX, y: midY } // Fallback: directly on the edge
            ];
            
            // Check each position for conflicts with nodes
            for (const pos of positions) {
                let hasConflict = false;
                
                // Check distance to all nodes with smaller clearance since we want labels closer
                for (const node of allNodes) {
                    if (node.x !== undefined && node.y !== undefined) {
                        const nodeRadius = getNodeRadius(node, nodeSizes, combinedNodes, combinedEdges);
                        const distanceToNode = Math.sqrt(Math.pow(pos.x - node.x, 2) + Math.pow(pos.y - node.y, 2));
                        if (distanceToNode < nodeRadius + 8) { // Reduced clearance from 20px to 8px
                            hasConflict = true;
                            break;
                        }
                    }
                }
                
                if (!hasConflict) {
                    return pos;
                }
            }
            
            // If all positions have conflicts, use the closest position (first one)
            return positions[0];
        };

        // Create edge labels (only if enabled)
        const edgeLabels = edgeLabelSettings.showEdgeLabels ? g.append("g")
            .selectAll<SVGTextElement, EdgeGroupWithSpans>("text")
            .data(edgeGroups)
            .join("text")
            .text(d => d.formattedSpans)
            .attr("font-size", `${edgeLabelSettings.labelFontSize}px`)
            .attr("fill", colors.text) // Use theme text color directly
            .attr("stroke", colors.background) // Add background stroke for better contrast
            .attr("stroke-width", "2px")
            .attr("paint-order", "stroke fill") // Ensure stroke renders behind fill
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle") // Center vertically
            .attr("font-family", "monospace, 'Courier New', monospace") // Ensure monospace font
            .attr("font-weight", "500") // Slightly bold for better visibility over edges
            .style("pointer-events", "none")
            .style("user-select", "none")
            .each(function(d) {
                // Try to find nodes in combined nodes first, then fall back to original data
                let sourceNode = combinedNodes.find(n => n.id === d.sourceId);
                let targetNode = combinedNodes.find(n => n.id === d.targetId);
                
                // If not found in combined nodes, try to find in original nodes and map to combined
                if (!sourceNode) {
                    const originalSource = stableData.nodes.find(n => n.id === d.sourceId);
                    if (originalSource) {
                        // Find the combined node that contains this original node
                        sourceNode = combinedNodes.find(cn => 
                            cn.combined_nodes?.includes(d.sourceId) || cn.id === d.sourceId
                        );
                    }
                }
                
                if (!targetNode) {
                    const originalTarget = stableData.nodes.find(n => n.id === d.targetId);
                    if (originalTarget) {
                        // Find the combined node that contains this original node
                        targetNode = combinedNodes.find(cn => 
                            cn.combined_nodes?.includes(d.targetId) || cn.id === d.targetId
                        );
                    }
                }
                
                if (!sourceNode || !targetNode) {
                    console.warn(`Edge label: Could not find nodes for edge ${d.sourceId}->${d.targetId}`);
                    return;
                }
                
                const pos = findOptimalEdgeLabelPosition(sourceNode, targetNode, d, combinedNodes, edgeGroups);
                d3.select(this)
                    .attr("x", pos.x)
                    .attr("y", pos.y);
            }) : null;

        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(GRAPH_CONSTANTS.ZOOM.ALPHA_TARGET).restart();
            event.subject.fx = event.subject.x;
            // Don't force Y position in dragstart - let the simulation handle it or preserve current Y
            if (sampleOrder === 'dagre') {
                event.subject.fy = event.subject.y ?? null; // Keep current Y position in dagre mode
            } else {
                event.subject.fy = event.subject.y ?? null; // Keep current Y position for force-directed too
            }
            // Store initial drag position to detect if this is a real drag or just a click
            (event.subject as any).dragStartX = event.x;
            (event.subject as any).dragStartY = event.y;
            (event.subject as any).wasDragged = false;
        }

        function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!stableData) return;
            
            // Check if this is a real drag (moved more than threshold) to avoid interfering with clicks
            const dragStartX = (event.subject as any).dragStartX ?? event.x;
            const dragStartY = (event.subject as any).dragStartY ?? event.y;
            const dragDistance = Math.sqrt(Math.pow(event.x - dragStartX, 2) + Math.pow(event.y - dragStartY, 2));
            const dragThreshold = 5; // pixels
            
            if (dragDistance > dragThreshold) {
                (event.subject as any).wasDragged = true;
            }
            
            let x = event.x;
            
                        // Apply much more relaxed constraints for internal nodes
            if (!event.subject.is_sample) {
                const sampleNodes = combinedNodes.filter(n => n.is_sample && n.x !== undefined);
                const isParentARG = isLikelyParentARG(combinedNodes, combinedEdges);
                
                if (sampleNodes.length > 0) {
                    const sampleMinX = Math.min(...sampleNodes.map(n => n.x!));
                    const sampleMaxX = Math.max(...sampleNodes.map(n => n.x!));
                    const sampleRange = sampleMaxX - sampleMinX;
                    const centerX = (sampleMinX + sampleMaxX) / 2;
                    
                    if (isParentARG) {
                        // For parent ARGs, allow very wide spread
                        const allowedSpread = Math.max(sampleRange * 3, actualWidth * 0.6);
                        const allowedMin = centerX - allowedSpread / 2;
                        const allowedMax = centerX + allowedSpread / 2;
                        x = Math.max(allowedMin, Math.min(allowedMax, x));
                    } else {
                        // For normal ARGs, apply relaxed descendant range constraints
                        const descendantRange = getDescendantSampleRange(event.subject, combinedNodes, combinedEdges);
                        if (descendantRange) {
                            const expandedRange = Math.max(descendantRange.max - descendantRange.min, 150); // Minimum 150px range
                            const rangeMidpoint = (descendantRange.min + descendantRange.max) / 2;
                            const expandedMin = rangeMidpoint - expandedRange / 2;
                            const expandedMax = rangeMidpoint + expandedRange / 2;
                            x = Math.max(expandedMin, Math.min(expandedMax, x));
                        } else {
                            // If no descendants, allow reasonable spread around samples
                            const allowedSpread = Math.max(sampleRange * 1.5, 200);
                            const allowedMin = centerX - allowedSpread / 2;
                            const allowedMax = centerX + allowedSpread / 2;
                            x = Math.max(allowedMin, Math.min(allowedMax, x));
                        }
                    }
                } else {
                    // Fallback to basic padding constraints
                    const padding = actualWidth * GRAPH_CONSTANTS.PADDING_RATIO;
                    x = Math.max(padding, Math.min(actualWidth - padding, x));
                }
            } else {
                // For sample nodes, just apply basic padding constraints
                const padding = actualWidth * GRAPH_CONSTANTS.PADDING_RATIO;
                x = Math.max(padding, Math.min(actualWidth - padding, x));
            }
            
            // Apply sibling constraints with reduced effect to allow better positioning
            const siblings = getSiblings(event.subject, combinedNodes, combinedEdges);
            if (siblings.length > 0) {
                const siblingAvgX = siblings.reduce((sum, s) => sum + (s.x ?? 0), 0) / siblings.length;
                const maxDistance = GRAPH_CONSTANTS.MAX_SIBLING_DISTANCE * 1.5; // Increased tolerance
                x = Math.max(siblingAvgX - maxDistance, 
                    Math.min(siblingAvgX + maxDistance, x));
            }
            
            event.subject.fx = x;
            // Don't modify Y position during drag - this was causing the layer jumping
            event.subject.fy = event.subject.y ?? null;
        }

        function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0);
            
            let x = event.subject.x ?? 0;
            
                        // Apply the same relaxed X constraints as in dragged function
            if (!event.subject.is_sample) {
                const sampleNodes = combinedNodes.filter(n => n.is_sample && n.x !== undefined);
                const isParentARG = isLikelyParentARG(combinedNodes, combinedEdges);
                
                if (sampleNodes.length > 0) {
                    const sampleMinX = Math.min(...sampleNodes.map(n => n.x!));
                    const sampleMaxX = Math.max(...sampleNodes.map(n => n.x!));
                    const sampleRange = sampleMaxX - sampleMinX;
                    const centerX = (sampleMinX + sampleMaxX) / 2;
                    
                    if (isParentARG) {
                        // For parent ARGs, allow very wide spread
                        const allowedSpread = Math.max(sampleRange * 3, actualWidth * 0.6);
                        const allowedMin = centerX - allowedSpread / 2;
                        const allowedMax = centerX + allowedSpread / 2;
                        x = Math.max(allowedMin, Math.min(allowedMax, x));
                    } else {
                        // For normal ARGs, apply relaxed descendant range constraints
                        const descendantRange = getDescendantSampleRange(event.subject, combinedNodes, combinedEdges);
                        if (descendantRange) {
                            const expandedRange = Math.max(descendantRange.max - descendantRange.min, 150); // Minimum 150px range
                            const rangeMidpoint = (descendantRange.min + descendantRange.max) / 2;
                            const expandedMin = rangeMidpoint - expandedRange / 2;
                            const expandedMax = rangeMidpoint + expandedRange / 2;
                            x = Math.max(expandedMin, Math.min(expandedMax, x));
                        } else {
                            // If no descendants, allow reasonable spread around samples
                            const allowedSpread = Math.max(sampleRange * 1.5, 200);
                            const allowedMin = centerX - allowedSpread / 2;
                            const allowedMax = centerX + allowedSpread / 2;
                            x = Math.max(allowedMin, Math.min(allowedMax, x));
                        }
                    }
                } else {
                    // Fallback to basic padding constraints
                    const padding = actualWidth * GRAPH_CONSTANTS.PADDING_RATIO;
                    x = Math.max(padding, Math.min(actualWidth - padding, x));
                }
            } else {
                // For sample nodes, just apply basic padding constraints
                const padding = actualWidth * GRAPH_CONSTANTS.PADDING_RATIO;
                x = Math.max(padding, Math.min(actualWidth - padding, x));
            }
            
            event.subject.x = x;
            event.subject.fx = x; // Keep x fixed after drag
            // Don't force Y position recalculation - preserve the current Y position
            event.subject.fy = event.subject.y ?? null;
            
            // Track this as a user-moved node
            visualStateRef.current.userMovedNodes.set(event.subject.id, {
                x: event.subject.x,
                y: event.subject.y || 0,
                fx: event.subject.fx,
                fy: event.subject.fy
            });
            
            // Clean up drag tracking properties
            setTimeout(() => {
                (event.subject as any).wasDragged = false;
            }, 100); // Small delay to ensure click handler has time to check the flag
        }

        const nodes = g.append("g")
            .selectAll<SVGCircleElement, Node>("circle")
            .data(combinedNodes)
            .join("circle")
            .attr("r", d => getNodeRadius(d, nodeSizes, combinedNodes, combinedEdges))
            .attr("fill", d => {
                if (d.is_sample) return `rgb(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]})`;
                if (d.is_combined) return `rgb(${colors.nodeCombined[0]}, ${colors.nodeCombined[1]}, ${colors.nodeCombined[2]})`;
                if (isRootNode(d, combinedNodes, combinedEdges)) return `rgb(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]})`;
                return `rgb(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]})`;
            })
            .attr("stroke", d => {
                if (isRootNode(d, combinedNodes, combinedEdges)) return `rgb(${colors.nodeSelected[0]}, ${colors.nodeSelected[1]}, ${colors.nodeSelected[2]})`;
                if (d.is_sample) return colors.background;
                return "none";
            })
            .attr("stroke-width", d => {
                if (isRootNode(d, combinedNodes, combinedEdges)) return GRAPH_CONSTANTS.ROOT_NODE_STROKE_WIDTH;
                if (d.is_sample) return GRAPH_CONSTANTS.SAMPLE_NODE_STROKE_WIDTH;
                return 0;
            })
            .style("cursor", "pointer")
            .call(d3.drag<SVGCircleElement, Node>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended) as any)
            .on("click", (event, d) => {
                event.preventDefault();
                // Only fire click if the node wasn't dragged
                if (!(d as any).wasDragged) {
                onNodeClick?.(d);
                }
                // Reset drag state for next interaction
                (d as any).wasDragged = false;
            })
            .on("contextmenu", (event, d) => {
                event.preventDefault();
                onNodeRightClick?.(d);
            })
            .on("mouseover", (event, d) => {
                let tooltipContent = '';
                
                // Helper function to format node ID for display (tskit approach)
                const formatNodeId = (node: Node): string => {
                    // Use the label property if available (tskit format)
                    if (node.label) {
                        return node.label;
                    }
                    // Fallback to old format for backwards compatibility
                    if (node.is_combined && node.combined_nodes && node.combined_nodes.length > 1) {
                        return node.combined_nodes.join('/');
                    }
                    return node.id.toString();
                };
                
                if (d.is_sample) {
                    const nodeIdDisplay = formatNodeId(d);
                    tooltipContent = `Sample node ${nodeIdDisplay}<br>Time: ${d.time}`;
                } else if (d.is_combined) {
                    const nodeIdDisplay = formatNodeId(d);
                    tooltipContent = `Combined node ${nodeIdDisplay}<br>Time: ${d.time}`;
                } else if (isRootNode(d, combinedNodes, combinedEdges)) {
                    const children = [...new Set(combinedEdges
                        .filter(e => {
                            const source = typeof e.source === 'number' ? combinedNodes.find(n => n.id === e.source) : e.source as Node;
                            return source?.id === d.id;
                        })
                        .map(e => {
                            const target = typeof e.target === 'number' ? combinedNodes.find(n => n.id === e.target) : e.target as Node;
                            return target?.id;
                        })
                        .filter(id => id !== undefined))]
                        .sort((a, b) => a - b);

                    const descendantSamples = getDescendantSamples(d, combinedNodes, combinedEdges)
                        .map(sample => sample.id)
                        .sort((a, b) => a - b);

                    const nodeIdDisplay = formatNodeId(d);
                    tooltipContent = `Root node ${nodeIdDisplay}<br>Time: ${d.time}`;
                    if (children.length > 0) {
                        tooltipContent += `<br>Children: ${children.join(", ")}`;
                    }
                    if (descendantSamples.length > 0) {
                        tooltipContent += `<br>Descendant samples: ${descendantSamples.join(", ")}`;
                    }
                } else {
                    const parents = [...new Set(combinedEdges
                        .filter(e => {
                            const target = typeof e.target === 'number' ? combinedNodes.find(n => n.id === e.target) : e.target as Node;
                            return target?.id === d.id;
                        })
                        .map(e => {
                            const source = typeof e.source === 'number' ? combinedNodes.find(n => n.id === e.source) : e.source as Node;
                            return source?.id;
                        })
                        .filter(id => id !== undefined))]
                        .sort((a, b) => a - b);
                    
                    const children = [...new Set(combinedEdges
                        .filter(e => {
                            const source = typeof e.source === 'number' ? combinedNodes.find(n => n.id === e.source) : e.source as Node;
                            return source?.id === d.id;
                        })
                        .map(e => {
                            const target = typeof e.target === 'number' ? combinedNodes.find(n => n.id === e.target) : e.target as Node;
                            return target?.id;
                        })
                        .filter(id => id !== undefined))]
                        .sort((a, b) => a - b);

                    const nodeIdDisplay = formatNodeId(d);
                    tooltipContent = `Internal node ${nodeIdDisplay}<br>Time: ${d.time}`;
                    if (parents.length > 0) {
                        tooltipContent += `<br>Parents: ${parents.join(", ")}`;
                    }
                    if (children.length > 0) {
                        tooltipContent += `<br>Children: ${children.join(", ")}`;
                    }
                }

                if (d.individual !== undefined && d.individual !== -1) {
                    tooltipContent += `<br>Individual: ${d.individual}`;
                }

                if (d.location) {
                    const location = d.location;
                    const isGeographic = location.x >= -180 && location.x <= 180 && 
                                       location.y >= -90 && location.y <= 90 &&
                                       (location.x !== 0 || location.y !== 0);
                    
                    if (location.z !== undefined) {
                        if (isGeographic) {
                            tooltipContent += `<br>Location: Lat: ${location.y.toFixed(3)}°, Lon: ${location.x.toFixed(3)}°, Z: ${location.z.toFixed(2)}`;
                        } else {
                            tooltipContent += `<br>Location: (${location.x.toFixed(2)}, ${location.y.toFixed(2)}, ${location.z.toFixed(2)})`;
                        }
                    } else {
                        if (isGeographic) {
                            tooltipContent += `<br>Location: Lat: ${location.y.toFixed(3)}°, Lon: ${location.x.toFixed(3)}°`;
                        } else {
                            tooltipContent += `<br>Location: (${location.x.toFixed(2)}, ${location.y.toFixed(2)})`;
                        }
                    }
                }

                tooltip
                    .style("visibility", "visible")
                    .html(tooltipContent)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        const labels = g.append("g")
            .selectAll<SVGTextElement, Node>("text")
            .data(combinedNodes.filter(d => {
                if (d.is_sample) return nodeIdSettings.showSampleIds;
                if (isRootNode(d, combinedNodes, combinedEdges)) return nodeIdSettings.showRootIds;
                return nodeIdSettings.showInternalIds;
            }))
            .join("text")
            .text(d => {
                // Use the label property if available (tskit format)
                if (d.label) {
                    return d.label;
                }
                // Fallback to old format for backwards compatibility
                if (d.is_combined && d.combined_nodes && d.combined_nodes.length > 1) {
                    return d.combined_nodes.join('/');
                }
                return d.id.toString();
            })
            .attr("font-size", d => {
                const nodeRadius = getNodeRadius(d, nodeSizes, combinedNodes, combinedEdges);
                if (d.is_sample) {
                    return `${Math.max(8, nodeRadius * 1.2)}px`;
                } else {
                    // Make internal and root node labels larger
                    return `${Math.max(12, nodeRadius * 1.8)}px`;
                }
            })
            .attr("fill", colors.text)
            .attr("text-anchor", "middle")
            .attr("font-weight", d => {
                if (d.is_sample) return "normal";
                if (isRootNode(d, combinedNodes, combinedEdges)) return "bold";
                return "normal";
            })
            .style("pointer-events", "none")
            .each(function(d) {
                const textElement = this;
                const nodeRadius = getNodeRadius(d, nodeSizes, combinedNodes, combinedEdges);
                
                if (d.is_sample) {
                    // Sample nodes: position below as before
                    d3.select(textElement)
                        .attr("dx", 0)
                        .attr("dy", nodeRadius + 12);
                } else {
                    // Root and internal nodes: find optimal position
                    const textBox = textElement.getBBox();
                    const optimalPos = findOptimalLabelPosition(
                        d, 
                        combinedNodes, 
                        combinedEdges, 
                        nodeRadius,
                        textBox.width,
                        textBox.height
                    );
                    
                    d3.select(textElement)
                        .attr("dx", optimalPos.dx)
                        .attr("dy", optimalPos.dy)
                        .attr("text-anchor", optimalPos.dx > 0 ? "start" : optimalPos.dx < 0 ? "end" : "middle");
                }
            });

        simulation.on("tick", () => {
            if (!stableData) return;
            
            // For dagre layout, skip force-based adjustments
            if (sampleOrder !== 'dagre' && simulation.alpha() > GRAPH_CONSTANTS.PERFORMANCE.ALPHA_THRESHOLD) {
                combinedNodes.forEach(node => {
                    if (!node.is_sample) {
                        enforceDescendantRange(node, combinedNodes, combinedEdges);
                    }
                });
            }

            edges
                .attr("x1", d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                    return source?.x ?? 0;
                })
                .attr("y1", d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                    // For dagre, use actual node Y position; for others, use time-based calculation
                    return sampleOrder === 'dagre' ? (source?.y ?? 0) : 
                        calculateYPosition(source!.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode, temporalSpacing);
                })
                .attr("x2", d => {
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    return target?.x ?? 0;
                })
                .attr("y2", d => {
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    // For dagre, use actual node Y position; for others, use time-based calculation
                    return sampleOrder === 'dagre' ? (target?.y ?? 0) : 
                        calculateYPosition(target!.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode, temporalSpacing);
                });

            nodes
                .attr("cx", d => d.x ?? 0)
                .attr("cy", d => {
                    // For dagre, use the actual Y position from dagre; for others, use time-based calculation
                    return sampleOrder === 'dagre' ? (d.y ?? 0) : 
                        calculateYPosition(d.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode, temporalSpacing);
                });

            labels
                .attr("x", d => d.x ?? 0)
                .attr("y", d => {
                    // For dagre, use the actual Y position from dagre; for others, use time-based calculation
                    return sampleOrder === 'dagre' ? (d.y ?? 0) : 
                        calculateYPosition(d.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode, temporalSpacing);
                })
                .each(function(d) {
                    const textElement = this;
                    const nodeRadius = getNodeRadius(d, nodeSizes, combinedNodes, combinedEdges);
                    
                    if (d.is_sample) {
                        // Sample nodes: position below as before
                        d3.select(textElement)
                            .attr("dx", 0)
                            .attr("dy", nodeRadius + 12);
                    } else {
                        // Root and internal nodes: recalculate optimal position on each tick
                        // Get current text dimensions
                        const textBox = textElement.getBBox();
                        const optimalPos = findOptimalLabelPosition(
                            d, 
                            combinedNodes, 
                            combinedEdges, 
                            nodeRadius,
                            textBox.width || 20,
                            textBox.height || 12
                        );
                        
                        d3.select(textElement)
                            .attr("dx", optimalPos.dx)
                            .attr("dy", optimalPos.dy)
                            .attr("text-anchor", optimalPos.dx > 0 ? "start" : optimalPos.dx < 0 ? "end" : "middle");
                    }
                });

            // Update edge labels to follow their corresponding edges
            if (edgeLabels) {
                edgeLabels
                    .each(function(d) {
                        // Try to find nodes in combined nodes first, then fall back to original data
                        let sourceNode = combinedNodes.find(n => n.id === d.sourceId);
                        let targetNode = combinedNodes.find(n => n.id === d.targetId);
                        
                        // If not found in combined nodes, try to find in original nodes and map to combined
                        if (!sourceNode) {
                            const originalSource = stableData.nodes.find(n => n.id === d.sourceId);
                            if (originalSource) {
                                // Find the combined node that contains this original node
                                sourceNode = combinedNodes.find(cn => 
                                    cn.combined_nodes?.includes(d.sourceId) || cn.id === d.sourceId
                                );
                            }
                        }
                        
                        if (!targetNode) {
                            const originalTarget = stableData.nodes.find(n => n.id === d.targetId);
                            if (originalTarget) {
                                // Find the combined node that contains this original node
                                targetNode = combinedNodes.find(cn => 
                                    cn.combined_nodes?.includes(d.targetId) || cn.id === d.targetId
                                );
                            }
                        }
                        
                        if (sourceNode && targetNode) {
                            const pos = findOptimalEdgeLabelPosition(sourceNode, targetNode, d, combinedNodes, edgeGroups);
                            d3.select(this)
                                .attr("x", pos.x)
                                .attr("y", pos.y);
                        }
                    });
            }
            
            // Update mutation markers to follow their corresponding edges
            if (mutationMarkers) {
                mutationMarkers
                    .each(function(d) {
                        // Use the same node-finding logic as edge labels
                        let sourceNode = combinedNodes.find(n => n.id === (typeof d.source === 'number' ? d.source : (d.source as any).id));
                        let targetNode = combinedNodes.find(n => n.id === (typeof d.target === 'number' ? d.target : (d.target as any).id));
                        
                        // Fallback to original nodes if not found in combined nodes
                        if (!sourceNode) {
                            const sourceId = typeof d.source === 'number' ? d.source : (d.source as any).id;
                            const originalSource = stableData.nodes.find(n => n.id === sourceId);
                            if (originalSource) {
                                sourceNode = combinedNodes.find(cn => 
                                    cn.combined_nodes?.includes(sourceId) || cn.id === sourceId
                                );
                            }
                        }
                        
                        if (!targetNode) {
                            const targetId = typeof d.target === 'number' ? d.target : (d.target as any).id;
                            const originalTarget = stableData.nodes.find(n => n.id === targetId);
                            if (originalTarget) {
                                targetNode = combinedNodes.find(cn => 
                                    cn.combined_nodes?.includes(targetId) || cn.id === targetId
                                );
                            }
                        }
                        
                        if (sourceNode && targetNode) {
                            // Position at edge midpoint (simpler than edge labels which need offset)
                            const midX = ((sourceNode.x ?? 0) + (targetNode.x ?? 0)) / 2;
                            
                            // Calculate Y positions using the same logic as edges
                            const sourceY = sampleOrder === 'dagre' ? (sourceNode.y ?? 0) : 
                                calculateYPosition(sourceNode.time ?? 0, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode, temporalSpacing);
                            const targetY = sampleOrder === 'dagre' ? (targetNode.y ?? 0) : 
                                calculateYPosition(targetNode.time ?? 0, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode, temporalSpacing);
                            const midY = (sourceY + targetY) / 2;
                            
                            d3.select(this)
                                .attr("x", midX)
                                .attr("y", midY);
                        }
                    });
            }
        });

        // Store current state for spacing updates
        visualStateRef.current = {
            nodes: combinedNodes,
            edges: combinedEdges,
            simulation,
            svg,
            zoom,
            userMovedNodes: visualStateRef.current.userMovedNodes // Preserve existing user movements
        };

        return () => {
            if (simulation) simulation.stop();
            if (tooltip) tooltip.remove();
        };
    }, [stableData, width, height, onNodeClick, onNodeRightClick, onEdgeClick, focalNode, nodeSizes, ref, sampleOrder, edgeThickness, edgeOpacity, nodeIdSettings]);

    return (
        <div className="w-full h-full">
            <svg ref={ref} className="w-full h-full" />
        </div>
    );
}); 