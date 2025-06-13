import { useEffect, forwardRef, ForwardedRef, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import * as dagre from 'dagre';
import { ForceDirectedGraphProps, GraphNode, GraphEdge, NodeSizeSettings, TemporalSpacingMode } from './ForceDirectedGraph.types';
import { useColorTheme } from '../../context/ColorThemeContext';

// Default node sizes - these will be overridden by props
const DEFAULT_NODE_SIZES: NodeSizeSettings = {
    sample: 8,
    root: 6,
    other: 5
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
    dagreX?: number; // For dagre-based ordering within layers
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
    const connectedNodes1 = getConnectedNodeIds(node1, edges);
    const connectedNodes2 = getConnectedNodeIds(node2, edges);
    
    if (connectedNodes1.size !== connectedNodes2.size) return false;
    
    for (const id of connectedNodes1) {
        if (!connectedNodes2.has(id)) return false;
    }
    return true;
}

// Helper function to get connected node IDs for a given node
function getConnectedNodeIds(node: Node, edges: GraphEdge[]): Set<number> {
    const connectedIds = new Set<number>();
    
    getConnectedEdges(node, edges).forEach(edge => {
        const sourceId = typeof edge.source === 'number' ? edge.source : (edge.source as Node).id;
        const targetId = typeof edge.target === 'number' ? edge.target : (edge.target as Node).id;
        
        if (sourceId !== node.id) connectedIds.add(sourceId);
        if (targetId !== node.id) connectedIds.add(targetId);
    });
    
    return connectedIds;
}

// Helper function to combine nodes with identical time and relationships
function combineIdenticalNodes(nodes: Node[], edges: GraphEdge[]): { nodes: Node[], edges: GraphEdge[] } {
    const processedNodes = new Set<number>();
    const newNodes: Node[] = [];
    const nodeMap = new Map<number, number>();
    
    for (let i = 0; i < nodes.length; i++) {
        if (processedNodes.has(nodes[i].id)) continue;
        
        const currentNode = nodes[i];
        
        // Sample nodes are never combined
        if (currentNode.is_sample) {
            newNodes.push(currentNode);
            nodeMap.set(currentNode.id, currentNode.id);
            processedNodes.add(currentNode.id);
            continue;
        }
        
        const identicalNodes = findIdenticalNodes(currentNode, nodes, edges, processedNodes, i);
        const combinedNode = createCombinedNode(currentNode, identicalNodes);
        
        newNodes.push(combinedNode);
        identicalNodes.forEach(node => {
            nodeMap.set(node.id, combinedNode.id);
            processedNodes.add(node.id);
        });
    }
    
    const updatedEdges = updateEdgesWithNewNodeIds(edges, nodeMap);
    return { nodes: newNodes, edges: updatedEdges };
}

// Helper function to find nodes with identical relationships
function findIdenticalNodes(
    targetNode: Node, 
    allNodes: Node[], 
    edges: GraphEdge[], 
    processedNodes: Set<number>, 
    startIndex: number
): Node[] {
    const identicalNodes: Node[] = [targetNode];
    
    for (let j = startIndex + 1; j < allNodes.length; j++) {
        const candidateNode = allNodes[j];
        
        if (processedNodes.has(candidateNode.id) || candidateNode.is_sample) continue;
        
        if (targetNode.time === candidateNode.time && 
            haveIdenticalRelationships(targetNode, candidateNode, edges)) {
            identicalNodes.push(candidateNode);
        }
    }
    
    return identicalNodes;
}

// Helper function to create a combined node or return the original
function createCombinedNode(originalNode: Node, identicalNodes: Node[]): Node {
    if (identicalNodes.length === 1) {
        return originalNode;
    }
    
    return {
        ...originalNode,
        is_combined: true,
        combined_nodes: identicalNodes.map(node => node.id)
    };
}

// Helper function to update edges with new node IDs
function updateEdgesWithNewNodeIds(edges: GraphEdge[], nodeMap: Map<number, number>): GraphEdge[] {
    const updatedEdges: GraphEdge[] = [];
    
    edges.forEach(edge => {
        const sourceId = typeof edge.source === 'number' ? edge.source : (edge.source as Node).id;
        const targetId = typeof edge.target === 'number' ? edge.target : (edge.target as Node).id;
        
        const newSourceId = nodeMap.get(sourceId);
        const newTargetId = nodeMap.get(targetId);
        
        if (newSourceId !== undefined && newTargetId !== undefined) {
            updatedEdges.push({
                ...edge,
                source: newSourceId,
                target: newTargetId
            });
        }
    });
    
    return updatedEdges;
}

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
    return (node: GraphNode, combinedNodes: Node[], combinedEdges: GraphEdge[]) => {
        if (!node) return;
        
        if (combinedEdges.length === 0) {
            // Single node focus
            const targetNode = combinedNodes.find(n => n.id === node.id);
            if (!targetNode) return;

            const nodeX = targetNode.x ?? 0;
            const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
            const nodeY = availableHeight - (targetNode.timeIndex! * timeSpacing);

            const transform = d3.zoomIdentity
                .translate(actualWidth / 2, actualHeight / 2)
                .scale(GRAPH_CONSTANTS.ZOOM.FOCUS_SCALE)
                .translate(-nodeX, -nodeY);

            svg.transition()
                .duration(GRAPH_CONSTANTS.ZOOM.TRANSITION_DURATION)
                .call(zoom.transform, transform);
        } else {
            // Fit entire graph
            const positionedNodes = combinedNodes.filter(n => n.x !== undefined && n.timeIndex !== undefined);
            if (positionedNodes.length === 0) return;

            const bounds = calculateGraphBounds(positionedNodes, actualHeight, timeSpacing);
            const transform = calculateFitTransform(bounds, actualWidth, actualHeight);

            svg.transition()
                .duration(GRAPH_CONSTANTS.ZOOM.TRANSITION_DURATION)
                .call(zoom.transform, transform);
        }
    };
}

// Helper function to calculate graph bounds
function calculateGraphBounds(nodes: Node[], height: number, timeSpacing: number) {
    const xValues = nodes.map(n => n.x!);
    const availableHeight = height * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
    const yValues = nodes.map(n => availableHeight - (n.timeIndex! * timeSpacing));
    
    return {
        minX: Math.min(...xValues),
        maxX: Math.max(...xValues),
        minY: Math.min(...yValues),
        maxY: Math.max(...yValues)
    };
}

// Helper function to calculate transform for fitting graph
function calculateFitTransform(bounds: any, width: number, height: number) {
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const graphWidth = bounds.maxX - bounds.minX;
    const graphHeight = bounds.maxY - bounds.minY;
    const padding = 50;
    
    const scaleX = (width - 2 * padding) / (graphWidth || 1);
    const scaleY = (height - 2 * padding) / (graphHeight || 1);
    const scale = Math.min(
        Math.max(GRAPH_CONSTANTS.ZOOM.GRAPH_FIT_SCALE_MIN, Math.min(scaleX, scaleY)), 
        GRAPH_CONSTANTS.ZOOM.GRAPH_FIT_SCALE_MAX
    );

    return d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-centerX, -centerY);
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
    temporalSpacingMode: TemporalSpacingMode
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

    return availableHeight - (normalizedTime * availableHeight);
}

// Helper function to setup initial node positions
function setupInitialNodePositions(
    combinedNodes: Node[], 
    combinedEdges: GraphEdge[], 
    actualWidth: number, 
    actualHeight: number, 
    sampleOrder?: string,
    nodeSizes?: NodeSizeSettings,
    temporalSpacingMode: TemporalSpacingMode = 'equal'
) {
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
        console.log('Setting up dagre layout...');
        
        // Create a full graph layout
        const g = new dagre.graphlib.Graph();
        g.setGraph({
            rankdir: 'TB',     // Top to bottom layout
            nodesep: 50,       // Horizontal space between nodes (increased for better edge routing)
            ranksep: 75,       // Vertical space between ranks (increased for better edge routing)
            marginx: xPadding,
            marginy: 20,
            ranker: 'network-simplex', // Best for minimizing edge crossings
            acyclicer: 'greedy',  // Help handle cycles in the graph
            align: 'UL'        // Align nodes upper-left within ranks
        });
        g.setDefaultEdgeLabel(() => ({}));

        // Add all nodes to the graph
        combinedNodes.forEach(node => {
            g.setNode(node.id.toString(), {
                width: 20,
                height: 20,
                // Optional: Add padding around nodes for better edge routing
                paddingLeft: 5,
                paddingRight: 5,
                paddingTop: 5,
                paddingBottom: 5
            });
        });

        // Add edges with weights based on relationship type
        combinedEdges.forEach(edge => {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            const sourceNode = combinedNodes.find(n => n.id === sourceId);
            const targetNode = combinedNodes.find(n => n.id === targetId);
            
            // Calculate edge weight based on node types
            let weight = 1;
            if (sourceNode && targetNode) {
                // Prioritize sample-connected edges
                if (sourceNode.is_sample || targetNode.is_sample) {
                    weight = 3;
                }
                // Give higher weight to edges between nodes in adjacent time layers
                if (Math.abs(sourceNode.time - targetNode.time) === 1) {
                    weight += 1;
                }
            }
            
            g.setEdge(sourceId.toString(), targetId.toString(), { weight });
        });

        // Run the dagre layout
        dagre.layout(g);

        // First pass: Get the range of x-coordinates for samples
    const sampleNodes = combinedNodes.filter(n => n.is_sample);
        let minSampleX = Infinity;
        let maxSampleX = -Infinity;
        
        sampleNodes.forEach(node => {
            const dagreNode = g.node(node.id.toString());
            if (dagreNode) {
                minSampleX = Math.min(minSampleX, dagreNode.x);
                maxSampleX = Math.max(maxSampleX, dagreNode.x);
            }
        });

        // Calculate the desired sample spacing
        const maxSampleSpacing = 100; // Maximum allowed space between samples
        const sampleRange = maxSampleX - minSampleX;
        const desiredRange = Math.min(sampleRange, maxSampleSpacing * (sampleNodes.length - 1));
        const xScale = desiredRange / sampleRange;

        // Apply positions with scaling
        combinedNodes.forEach(node => {
            const dagreNode = g.node(node.id.toString());
            if (dagreNode) {
                // Scale x positions to limit sample spacing
                const scaledX = ((dagreNode.x - minSampleX) * xScale) + minSampleX;
                node.x = scaledX;
                node.y = dagreNode.y;
                // Fix positions to prevent d3-force from moving them
                node.fx = node.x;
                node.fy = node.y;
            }
        });

        // Apply jitter to vertically aligned nodes
        applyVerticalAlignmentJitter(combinedNodes, combinedEdges, minSampleX, maxSampleX);

        // After applying scaled positions, check and resolve node-edge overlaps
        const processedNodes = new Set<number>();
        let hasChanges = true;
        const maxIterations = 3; // Limit the number of iterations to prevent infinite loops
        let iteration = 0;

        while (hasChanges && iteration < maxIterations) {
            hasChanges = false;
            iteration++;

            // Process nodes in order of degree (higher degree nodes get priority)
            const unprocessedNodes = combinedNodes
                .filter(n => !processedNodes.has(n.id))
                .sort((a, b) => {
                    const degreeA = combinedEdges.filter(e => {
                        const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
                        const targetId = typeof e.target === 'number' ? e.target : e.target.id;
                        return sourceId === a.id || targetId === a.id;
                    }).length;
                    const degreeB = combinedEdges.filter(e => {
                        const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
                        const targetId = typeof e.target === 'number' ? e.target : e.target.id;
                        return sourceId === b.id || targetId === b.id;
                    }).length;
                    return degreeB - degreeA;
                });

            for (const node of unprocessedNodes) {
                if (node.is_sample) {
                    processedNodes.add(node.id);
                    continue; // Skip sample nodes - keep them fixed
                }

                const nodeRadius = nodeSizes ? getNodeRadius(node, nodeSizes, combinedNodes, combinedEdges) : 5;
                const newPos = findNonOverlappingPosition(
                    node,
                    combinedEdges,
                    combinedNodes,
                    nodeRadius,
                    minSampleX,
                    maxSampleX,
                    nodeSizes || DEFAULT_NODE_SIZES
                );

                if (newPos.x !== node.x || newPos.y !== node.y) {
                    node.x = newPos.x;
                    node.fx = newPos.x;
                    node.y = newPos.y;
                    node.fy = newPos.y;
                    hasChanges = true;
                }

                processedNodes.add(node.id);
            }
        }

        console.log('Dagre layout complete. Node count:', combinedNodes.length);
    } else {
        // Original positioning logic for other ordering methods
        const sampleNodes = combinedNodes.filter(n => n.is_sample);
    const sampleSpacing = availableWidth / (sampleNodes.length - 1 || 1);

    sampleNodes.sort((a, b) => {
        if (a.order_position !== undefined && b.order_position !== undefined) {
            return a.order_position - b.order_position;
        }
        if (a.order_position !== undefined) return -1;
        if (b.order_position !== undefined) return 1;
        return (b.degree ?? 0) - (a.degree ?? 0);
    });

    // Position sample nodes
    sampleNodes.forEach((node, index) => {
        node.x = xPadding + (index * sampleSpacing);
        node.fx = node.x;
            node.y = calculateYPosition(node.time, uniqueTimes, availableHeight, temporalSpacingMode);
            node.fy = node.y;
        });

        // Reset any fixed positions for non-sample nodes
        combinedNodes.filter(n => !n.is_sample).forEach(node => {
            node.fx = null;
            node.fy = null;
            node.y = calculateYPosition(node.time, uniqueTimes, availableHeight, temporalSpacingMode);
    });
    }

    return { timeSpacing, uniqueTimes };
}

// Add type for simulation
type Simulation = d3.Simulation<Node, undefined>;

export const ForceDirectedGraph = forwardRef<SVGSVGElement, ForceDirectedGraphProps>(({ 
    data, 
    width, 
    height,
    onNodeClick,
    onNodeRightClick,
    onEdgeClick,
    focalNode,
    nodeSizes = DEFAULT_NODE_SIZES,
    sampleOrder = 'degree',
    edgeThickness = GRAPH_CONSTANTS.EDGE_STROKE_WIDTH,
    temporalSpacingMode = 'equal'
}, ref: ForwardedRef<SVGSVGElement>) => {
    const { colors } = useColorTheme();
    
    // Memoize data key to prevent unnecessary simulation restarts
    const dataKey = useMemo(() => {
        if (!data) return null;
        return `${data.nodes.length}-${data.edges.length}-${data.metadata.genomic_start || 0}-${data.metadata.genomic_end || data.metadata.sequence_length}`;
    }, [data?.nodes.length, data?.edges.length, data?.metadata.genomic_start, data?.metadata.genomic_end, data?.metadata.sequence_length]);

    const prevDataRef = useRef<{ data: typeof data; key: string | null }>({ data: null, key: null });
    
    const stableData = useMemo(() => {
        if (!data || !dataKey) return null;
        
        if (prevDataRef.current.key === dataKey && prevDataRef.current.data) {
            return prevDataRef.current.data;
        }
        
        prevDataRef.current = { data, key: dataKey };
        return data;
    }, [data, dataKey]);

    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current || !stableData) return;

        const containerRect = ref.current.getBoundingClientRect();
        const actualWidth = width || containerRect.width || 800;
        const actualHeight = height || containerRect.height || 600;
        const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);

        const { nodes: combinedNodes, edges: combinedEdges } = combineIdenticalNodes(stableData.nodes, stableData.edges);
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
        const { timeSpacing, uniqueTimes: setupUniqueTimes } = setupInitialNodePositions(combinedNodes, combinedEdges, actualWidth, actualHeight, sampleOrder, nodeSizes, temporalSpacingMode);

        if (focalNode) {
            focusOnNode(focalNode, combinedNodes, combinedEdges);
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
            .alpha(sampleOrder === 'dagre' ? 0 : GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_START) // Start with 0 alpha for dagre
            .alphaDecay(sampleOrder === 'dagre' ? 1 : GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_DECAY) // Fast decay for dagre
            .velocityDecay(sampleOrder === 'dagre' ? 1 : GRAPH_CONSTANTS.FORCE_STRENGTH.VELOCITY_DECAY) // High decay for dagre
            .force("link", sampleOrder === 'dagre' ? null : d3.forceLink<Node, GraphEdge>(combinedEdges)
                .id(d => d.id)
                .distance(50)
                .strength(d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    const sourceParent = getParent(source!, combinedNodes, combinedEdges);
                    const targetParent = getParent(target!, combinedNodes, combinedEdges);
                    if (sourceParent && targetParent && sourceParent.id === targetParent.id) {
                        return GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_SIBLING;
                    }
                    return (source?.is_sample || target?.is_sample) ? GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_SAMPLE : GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_DEFAULT;
                }))
            .force("charge", sampleOrder === 'dagre' ? null : d3.forceManyBody().strength(GRAPH_CONSTANTS.FORCE_STRENGTH.CHARGE))
            .force("x", sampleOrder === 'dagre' ? null : d3.forceX((d: Node) => {
                if (d.is_sample) return d.x!;
                
                const descendantRange = getDescendantSampleRange(d, combinedNodes, combinedEdges);
                const siblings = getSiblings(d, combinedNodes, combinedEdges);
                
                if (siblings.length > 0) {
                    const siblingAvgX = siblings.reduce((sum, s) => sum + (s.x ?? 0), 0) / siblings.length;
                    if (descendantRange) {
                        const targetX = (siblingAvgX + (descendantRange.min + descendantRange.max) / 2) / 2;
                        return Math.max(descendantRange.min, Math.min(descendantRange.max, targetX));
                    }
                    return siblingAvgX;
                }
                
                if (descendantRange) {
                    return (descendantRange.min + descendantRange.max) / 2;
                }
                return d.x ?? actualWidth / 2;
            }).strength(GRAPH_CONSTANTS.FORCE_STRENGTH.X_POSITION))
            .force("y", d3.forceY((d: Node) => 
                calculateYPosition(d.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode)
            ).strength(sampleOrder === 'dagre' ? 1 : GRAPH_CONSTANTS.FORCE_STRENGTH.Y_POSITION))
            .force("collision", sampleOrder === 'dagre' ? null : d3.forceCollide().radius(GRAPH_CONSTANTS.COLLISION_RADIUS));

        const edges = g.append("g")
            .selectAll<SVGLineElement, GraphEdge>("line")
            .data(combinedEdges)
            .join("line")
            .attr("stroke", `rgb(${colors.edgeDefault[0]}, ${colors.edgeDefault[1]}, ${colors.edgeDefault[2]})`)
            .attr("stroke-opacity", colors.edgeDefault[3] / 255)
            .attr("stroke-width", edgeThickness)
            .attr("x1", d => {
                const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                return source?.x ?? 0;
            })
            .attr("y1", d => {
                const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                return calculateYPosition(source!.time, setupUniqueTimes, availableHeight, temporalSpacingMode);
            })
            .attr("x2", d => {
                const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                return target?.x ?? 0;
            })
            .attr("y2", d => {
                const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                return calculateYPosition(target!.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode);
            })
            .on("click", (event, d) => onEdgeClick?.(d));

        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(GRAPH_CONSTANTS.ZOOM.ALPHA_TARGET).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = calculateYPosition(event.subject.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode);
        }

        function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!stableData) return;
            const descendantRange = getDescendantSampleRange(event.subject, combinedNodes, combinedEdges);
            const siblings = getSiblings(event.subject, combinedNodes, combinedEdges);
            let x = event.x;
            
            if (descendantRange) {
                x = Math.max(descendantRange.min, Math.min(descendantRange.max, x));
            } else {
                const padding = actualWidth * GRAPH_CONSTANTS.PADDING_RATIO;
                x = Math.max(padding, Math.min(actualWidth - padding, x));
            }
            
            if (siblings.length > 0) {
                const siblingAvgX = siblings.reduce((sum, s) => sum + (s.x ?? 0), 0) / siblings.length;
                x = Math.max(siblingAvgX - GRAPH_CONSTANTS.MAX_SIBLING_DISTANCE, 
                    Math.min(siblingAvgX + GRAPH_CONSTANTS.MAX_SIBLING_DISTANCE, x));
            }
            
            event.subject.fx = x;
            event.subject.fy = calculateYPosition(event.subject.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode);
        }

        function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            
            const descendantRange = getDescendantSampleRange(event.subject, combinedNodes, combinedEdges);
            
            let x = event.subject.x ?? 0;
            if (descendantRange) {
                x = Math.max(descendantRange.min, Math.min(descendantRange.max, x));
            } else {
                const padding = actualWidth * GRAPH_CONSTANTS.PADDING_RATIO;
                x = Math.max(padding, Math.min(actualWidth - padding, x));
            }
            
            event.subject.x = x;
            event.subject.fy = calculateYPosition(event.subject.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode);
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
                onNodeClick?.(d);
            })
            .on("contextmenu", (event, d) => {
                event.preventDefault();
                onNodeRightClick?.(d);
            })
            .on("mouseover", (event, d) => {
                let tooltipContent = '';
                
                if (d.is_sample) {
                    tooltipContent = `Sample node ${d.id}<br>Time: ${d.time}`;
                } else if (d.is_combined) {
                    tooltipContent = `Combined node ${d.id}<br>Contains nodes: ${d.combined_nodes?.join(", ")}<br>Time: ${d.time}`;
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

                    tooltipContent = `Root node ${d.id}<br>Time: ${d.time}`;
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

                    tooltipContent = `Internal node ${d.id}<br>Time: ${d.time}`;
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
            .data(combinedNodes.filter(d => d.is_sample))
            .join("text")
            .text(d => d.id.toString())
            .attr("font-size", d => `${nodeSizes.sample * 1.2}px`)
            .attr("fill", colors.text)
            .attr("text-anchor", "middle")  // Center the text horizontally
            .attr("dx", 0)  // No horizontal offset (centered)
            .attr("dy", d => getNodeRadius(d, nodeSizes, combinedNodes, combinedEdges) + 12);  // Position below node

        simulation.on("tick", () => {
            if (!stableData) return;
            
            if (simulation.alpha() > GRAPH_CONSTANTS.PERFORMANCE.ALPHA_THRESHOLD) {
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
                    return calculateYPosition(source!.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode);
                })
                .attr("x2", d => {
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    return target?.x ?? 0;
                })
                .attr("y2", d => {
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    return calculateYPosition(target!.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode);
                });

            nodes
                .attr("cx", d => d.x ?? 0)
                .attr("cy", d => calculateYPosition(d.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode));

            labels
                .attr("x", d => d.x ?? 0)
                .attr("y", d => calculateYPosition(d.time, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode));
        });

        return () => {
            if (simulation) simulation.stop();
            if (tooltip) tooltip.remove();
        };
    }, [stableData, width, height, onNodeClick, onNodeRightClick, onEdgeClick, focalNode, nodeSizes, ref, sampleOrder, edgeThickness, temporalSpacingMode]);

    return (
        <div className="w-full h-full">
            <svg ref={ref} className="w-full h-full" />
        </div>
    );
}); 