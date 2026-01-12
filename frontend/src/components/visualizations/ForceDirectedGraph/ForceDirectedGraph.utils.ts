import { isRootNode } from '@/utils/graphTraversal';
import { Node, GraphEdge, NodeSizeSettings, GraphNode, EdgeLabelSettings, TemporalSpacingMode } from './ForceDirectedGraph.types';
import * as d3 from 'd3';
import { GRAPH_CONSTANTS, DEFAULT_NODE_SIZES } from './ForceDirectedGraph.constants';
import { EdgeGroupWithSpans } from '../../../utils/genomicSpanUtils';

// Add helper function to get children of a node
// Optimized version that can use pre-built edge maps if provided
export function getChildren(
    node: GraphNode, 
    nodes: GraphNode[], 
    edges: GraphEdge[],
    outgoingEdgesMap?: Map<number, GraphEdge[]>,
    nodeMap?: Map<number, GraphNode>
): GraphNode[] {
    const children: GraphNode[] = [];
    
    // Use pre-built maps if provided (much faster for large graphs)
    const edgesToCheck = outgoingEdgesMap?.get(node.id) || 
        edges.filter(e => {
            const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
            return sourceId === node.id;
        });
    
    const nodeIdSet = nodeMap ? new Set(nodeMap.keys()) : new Set(nodes.map(n => n.id));
    const nodeGetter = nodeMap || new Map(nodes.map(n => [n.id, n]));
    
    for (const e of edgesToCheck) {
        const targetId = typeof e.target === 'number' ? e.target : e.target.id;
        
        // Check if target exists in nodes array
        if (!nodeIdSet.has(targetId)) {
            console.warn(`getChildren: Node ${node.id} has edge to non-existent node ${targetId}. This indicates an edge remapping issue during clustering.`);
            continue;
        }
        
        const childNode = nodeGetter instanceof Map ? nodeGetter.get(targetId) : nodes.find(n => n.id === targetId);
        if (childNode) {
            children.push(childNode);
        }
    }
    
    return children;
}

// Helper function to get node radius based on type and settings
export function getNodeRadius(node: Node, nodeSizes: NodeSizeSettings, nodes: Node[], edges: GraphEdge[]): number {
    if (node.is_sample || isRootNode(node, nodes, edges)) {
        return node.is_sample ? nodeSizes.sample : nodeSizes.root;
    }
    return nodeSizes.other;
}

// Helper function to get source and target nodes from edge
export function getEdgeNodes(edge: GraphEdge, nodes: Node[]): { source: Node | null; target: Node | null } {
    const source = typeof edge.source === 'number' 
        ? nodes.find(n => n.id === edge.source) || null
        : edge.source as Node;
    const target = typeof edge.target === 'number' 
        ? nodes.find(n => n.id === edge.target) || null
        : edge.target as Node;
    return { source, target };
}

// Helper function to get all descendant samples of a node
export function getDescendantSamples(node: Node, nodes: Node[], edges: GraphEdge[]): Node[] {
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
export function getDescendantSampleRange(node: Node, nodes: Node[], edges: GraphEdge[]): { min: number; max: number } | null {
    const descendantSamples = getDescendantSamples(node, nodes, edges);
    if (descendantSamples.length === 0) return null;
    
    const xValues = descendantSamples.map(n => n.x!);
    return {
        min: Math.min(...xValues),
        max: Math.max(...xValues)
    };
}

// Helper function to calculate the ancestral path length for a sample node
export function calculateAncestralPathLength(sampleNode: Node, allNodes: Node[], edges: GraphEdge[]): number {
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

// Helper function to compute a tree-based ordering key for a sample
// This creates a consistent ordering based on the tree structure
function getTreeOrderingKey(sampleNode: Node, allNodes: Node[], edges: GraphEdge[]): number {
    // Build a key based on the ancestral path to the root
    // We'll use a combination of ancestor times and IDs to create a stable ordering
    
    const path: { node: Node; minTime: number }[] = [];
    let current: Node | null = sampleNode;
    const visited = new Set<number>();
    
    // Walk up the tree to the root, collecting ancestor information
    while (current && !visited.has(current.id)) {
        visited.add(current.id);
        
        const parents = getImmediateParents(current, allNodes, edges);
        if (parents.length > 0) {
            // For ordering, use the parent with the smallest time (most recent)
            const earliestParent = parents.reduce((earliest, p) => p.time < earliest.time ? p : earliest);
            path.push({ node: current, minTime: earliestParent.time });
            current = earliestParent;
        } else {
            // Reached root
            path.push({ node: current, minTime: current.time });
            break;
        }
    }
    
    // Create ordering key: weight earlier ancestors (closer to root) more heavily
    // This ensures samples with different root paths are properly ordered
    let orderingKey = 0;
    for (let i = 0; i < path.length; i++) {
        const weight = Math.pow(1000, path.length - 1 - i);
        // Use a combination of node ID and time for the key
        orderingKey += path[i].node.id * weight + path[i].minTime * weight * 0.001;
    }
    
    return orderingKey;
}

// Helper function to arrange samples by ancestral path length with tree-based ordering
export function arrangeSamplesByAncestralPath(sampleNodes: Node[], allNodes: Node[], edges: GraphEdge[]): Node[] {
    // Calculate ancestral path length for each sample
    const samplesWithData = sampleNodes.map(node => ({
        node,
        pathLength: calculateAncestralPathLength(node, allNodes, edges)
    }));
    
    // Sort by path length (descending), then by tree position using postorder-like ordering
    samplesWithData.sort((a, b) => {
        // First by path length (descending - longer paths first)
        if (a.pathLength !== b.pathLength) {
            return b.pathLength - a.pathLength;
        }
        // Then by tree position (using tree-based ordering)
        const aOrder = getTreeOrderingKey(a.node, allNodes, edges);
        const bOrder = getTreeOrderingKey(b.node, allNodes, edges);
        if (aOrder !== bOrder) {
            return aOrder - bOrder;
        }
        // Final tiebreaker: node ID
        return a.node.id - b.node.id;
    });
    
    return samplesWithData.map(s => s.node);
}

// Helper function to calculate time to coalescence for a sample node
export function calculateTimeToCoalescence(sampleNode: Node, allNodes: Node[], edges: GraphEdge[]): number {
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
export function getImmediateParents(sampleNode: Node, allNodes: Node[], edges: GraphEdge[]): Node[] {
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

// Helper function to arrange samples by coalescence time with tree-based ordering
export function arrangeSamplesByCoalescence(sampleNodes: Node[], allNodes: Node[], edges: GraphEdge[]): Node[] {
    // Calculate coalescence time for each sample
    const samplesWithData = sampleNodes.map(node => ({
        node,
        coalescenceTime: calculateTimeToCoalescence(node, allNodes, edges)
    }));
    
    // Sort by coalescence time (descending - larger times first), then by tree position
    samplesWithData.sort((a, b) => {
        // First by coalescence time (descending - longer times first)
        if (a.coalescenceTime !== b.coalescenceTime) {
            return b.coalescenceTime - a.coalescenceTime;
        }
        // Then by tree position (using tree-based ordering)
        const aOrder = getTreeOrderingKey(a.node, allNodes, edges);
        const bOrder = getTreeOrderingKey(b.node, allNodes, edges);
        if (aOrder !== bOrder) {
            return aOrder - bOrder;
        }
        // Final tiebreaker: node ID
        return a.node.id - b.node.id;
    });
    
    return samplesWithData.map(s => s.node);
}

// Helper function to find the Most Recent Common Ancestor (MRCA) of a group of nodes
export function findMRCA(nodes: Node[], allNodes: Node[], edges: GraphEdge[]): Node | null {
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
export function calculateMRCACoalescenceDepth(nodes: Node[], allNodes: Node[], edges: GraphEdge[], depth: number = 0): number {
    const mrca = findMRCA(nodes, allNodes, edges);
    if (!mrca) return depth; // No MRCA found, return current depth
    
    // Find MRCA's parents for recursive calculation
    const mrcaParents = getImmediateParents(mrca, allNodes, edges);
    if (mrcaParents.length === 0) return depth + mrca.time; // MRCA is root, return depth + its time
    
    // Recursively calculate depth including MRCA's coalescence
    return mrca.time + calculateMRCACoalescenceDepth([mrca], allNodes, edges, depth + 1);
}

// Generic helper function to group samples by shared parents
export function groupSamplesBySharedParents<T extends {node: Node, parents: Node[]}>(samples: T[]): T[][] {
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
export function arrangeParentGroupsByMRCADepth<T extends {node: Node, parents: Node[]}>(
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
export function enforceDescendantRange(node: Node, nodes: Node[], edges: GraphEdge[]): void {
    const range = getDescendantSampleRange(node, nodes, edges);
    if (range && node.x !== undefined) {
        node.x = Math.max(range.min, Math.min(range.max, node.x));
    }
}

// Helper function to get immediate parent of a node
export function getParent(node: Node, nodes: Node[], edges: GraphEdge[]): Node | null {
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
export function getSiblings(node: Node, nodes: Node[], edges: GraphEdge[]): Node[] {
    const parent = getParent(node, nodes, edges);
    if (!parent) return [];

    return nodes.filter(n => {
        if (n.id === node.id || n.timeIndex! <= parent.timeIndex!) return false;
        const nodeParent = getParent(n, nodes, edges);
        return nodeParent?.id === parent.id;
    });
}

// Helper function to focus on a node or fit the entire graph
export function createFocusFunction(
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

        svg.transition()
            .duration(GRAPH_CONSTANTS.ZOOM.TRANSITION_DURATION)
            .call(zoom.transform, transform);
    };
}

// Helper function to calculate the true bounding box of the entire ARG structure
export function calculateGraphBounds(nodes: Node[], screenHeight: number, timeSpacing: number) {
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
export function calculateFitTransform(bounds: any, screenWidth: number, screenHeight: number) {
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

    // Create transform that:
    // 1. Moves to screen center
    // 2. Applies scale
    // 3. Moves graph center to origin (so scaling happens around graph center)
    return d3.zoomIdentity
        .translate(screenWidth / 2, screenHeight / 2)  // Move to screen center
        .scale(scale)                                   // Apply calculated scale
        .translate(-graphCenterX, -graphCenterY);      // Center graph at origin
}

// Helper function to calculate y position based on temporal spacing mode
export function calculateYPosition(
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
export function findOptimalLabelPosition(
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
export function distanceFromPointToLineSegment(
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

// Helper function to check if two line segments intersect
export function doLineSegmentsIntersect(
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
): boolean {
    // Calculate the direction of the lines
    const denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    
    // Lines are parallel if denominator is 0
    if (denom === 0) return false;
    
    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denom;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denom;
    
    // Check if the intersection point lies on both line segments
    return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
}

// Helper function to calculate total edge crossings
export function calculateEdgeCrossings(nodes: Node[], edges: GraphEdge[]): number {
    if (edges.length < 2) return 0;
    
    let crossingCount = 0;
    
    // For each pair of edges, check if they intersect
    for (let i = 0; i < edges.length; i++) {
        const edge1 = edges[i];
        const source1 = typeof edge1.source === 'number' ? nodes.find(n => n.id === edge1.source) : edge1.source as Node;
        const target1 = typeof edge1.target === 'number' ? nodes.find(n => n.id === edge1.target) : edge1.target as Node;
        
        if (!source1 || !target1 || source1.x === undefined || source1.y === undefined || 
            target1.x === undefined || target1.y === undefined) continue;
        
        for (let j = i + 1; j < edges.length; j++) {
            const edge2 = edges[j];
            const source2 = typeof edge2.source === 'number' ? nodes.find(n => n.id === edge2.source) : edge2.source as Node;
            const target2 = typeof edge2.target === 'number' ? nodes.find(n => n.id === edge2.target) : edge2.target as Node;
            
            if (!source2 || !target2 || source2.x === undefined || source2.y === undefined || 
                target2.x === undefined || target2.y === undefined) continue;
            
            // Skip if edges share a node (they can't cross if they're connected)
            if (source1.id === source2.id || source1.id === target2.id || 
                target1.id === source2.id || target1.id === target2.id) continue;
            
            // Check if the two line segments intersect
            if (doLineSegmentsIntersect(
                source1.x, source1.y, target1.x, target1.y,
                source2.x, source2.y, target2.x, target2.y
            )) {
                crossingCount++;
            }
        }
    }
    
    return crossingCount;
}

// New custom force to constrain internal nodes within their descendant sample ranges
// Helper function to detect if we're in a "parent ARG" situation where nodes need more horizontal freedom
export function isLikelyParentARG(nodes: GraphNode[], edges: GraphEdge[]): boolean {
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

// Helper function to check if two line segments intersect
export function doEdgesIntersect(
    edge1: { source: GraphNode; target: GraphNode },
    edge2: { source: GraphNode; target: GraphNode }
): boolean {
    const { source: s1, target: t1 } = edge1;
    const { source: s2, target: t2 } = edge2;
    
    // Skip if any coordinates are undefined
    if (s1.x === undefined || s1.y === undefined || t1.x === undefined || t1.y === undefined ||
        s2.x === undefined || s2.y === undefined || t2.x === undefined || t2.y === undefined) {
        return false;
    }
    
    // Skip if edges share a node
    if (s1.id === s2.id || s1.id === t2.id || t1.id === s2.id || t1.id === t2.id) {
        return false;
    }
    
    // Line segment intersection check using cross products
    const ccw = (a: GraphNode, b: GraphNode, c: GraphNode) => {
        return (c.y! - a.y!) * (b.x! - a.x!) > (b.y! - a.y!) * (c.x! - a.x!);
    };
    
    return ccw(s1, s2, t2) !== ccw(t1, s2, t2) && ccw(s1, t1, s2) !== ccw(s1, t1, t2);
}

// Helper function to calculate angle between two edges
function getEdgeAngle(edge: { source: GraphNode; target: GraphNode }): number {
    const dx = edge.target.x! - edge.source.x!;
    const dy = edge.target.y! - edge.source.y!;
    return Math.atan2(dy, dx) * 180 / Math.PI;
}

// Create a force to reduce edge crossings
export function createEdgeCrossingReductionForce(nodes: GraphNode[], edges: GraphEdge[], getScale: () => number) {
    let tickCount = 0;
    
    return function force(alpha: number) {
        tickCount++;
        
        // Only check crossings every N ticks for performance
        if (tickCount % GRAPH_CONSTANTS.EDGE_CROSSING.CHECK_INTERVAL !== 0) return;
        
        // Skip if alpha is very low (simulation has mostly settled)
        if (alpha < 0.05) return;
        
        // Sample a subset of edges for performance
        const sampleSize = Math.ceil(edges.length * GRAPH_CONSTANTS.EDGE_CROSSING.SAMPLE_RATE);
        const sampledEdges = edges.slice(0, sampleSize);
        
        // Check for crossings and apply gentle repulsion
        for (let i = 0; i < sampledEdges.length; i++) {
            const e1 = sampledEdges[i];
            const s1 = typeof e1.source === 'number' ? nodes.find(n => n.id === e1.source) : e1.source as GraphNode;
            const t1 = typeof e1.target === 'number' ? nodes.find(n => n.id === e1.target) : e1.target as GraphNode;
            
            if (!s1 || !t1 || s1.x === undefined || t1.x === undefined) continue;
            
            for (let j = i + 1; j < sampledEdges.length; j++) {
                const e2 = sampledEdges[j];
                const s2 = typeof e2.source === 'number' ? nodes.find(n => n.id === e2.source) : e2.source as GraphNode;
                const t2 = typeof e2.target === 'number' ? nodes.find(n => n.id === e2.target) : e2.target as GraphNode;
                
                if (!s2 || !t2 || s2.x === undefined || t2.x === undefined) continue;
                
                // Check if edges cross
        if (doEdgesIntersect({ source: s1, target: t1 }, { source: s2, target: t2 })) {
                    // Apply gentle repulsion to non-sample nodes involved in the crossing
                    const strength = GRAPH_CONSTANTS.EDGE_CROSSING.REPULSION_STRENGTH * alpha * getScale();
                    
                    // Calculate repulsion direction perpendicular to edges
                    const angle1 = getEdgeAngle({ source: s1, target: t1 });
                    const angle2 = getEdgeAngle({ source: s2, target: t2 });
                    
                    // Push nodes perpendicular to their edge direction
                    if (!s1.is_sample && s1.vx !== undefined) {
                        const perpAngle = (angle1 + 90) * Math.PI / 180;
                        s1.vx! += Math.cos(perpAngle) * strength * 0.5;
                        s1.vy! += Math.sin(perpAngle) * strength * 0.5;
                    }
                    if (!t1.is_sample && t1.vx !== undefined) {
                        const perpAngle = (angle1 - 90) * Math.PI / 180;
                        t1.vx! += Math.cos(perpAngle) * strength * 0.5;
                        t1.vy! += Math.sin(perpAngle) * strength * 0.5;
                    }
                    if (!s2.is_sample && s2.vx !== undefined) {
                        const perpAngle = (angle2 - 90) * Math.PI / 180;
                        s2.vx! += Math.cos(perpAngle) * strength * 0.5;
                        s2.vy! += Math.sin(perpAngle) * strength * 0.5;
                    }
                    if (!t2.is_sample && t2.vx !== undefined) {
                        const perpAngle = (angle2 + 90) * Math.PI / 180;
                        t2.vx! += Math.cos(perpAngle) * strength * 0.5;
                        t2.vy! += Math.sin(perpAngle) * strength * 0.5;
                    }
                }
            }
        }
    };
}

// Create a force to bundle edges from the same parent (reduce edge spread)
export function createEdgeBundlingForce(nodes: GraphNode[], edges: GraphEdge[], getScale: () => number) {
    return function force(alpha: number) {
        // Skip if alpha is very low
        if (alpha < 0.05) return;
        
        nodes.forEach(parent => {
            if (parent.x === undefined || parent.y === undefined) return;
            
            // Get all children of this node
            const children = getChildren(parent, nodes, edges);
            if (children.length < 2) return; // Need at least 2 children to bundle
            
            // Calculate the average direction to all children
            let avgDx = 0, avgDy = 0;
            let validChildren = 0;
            
            children.forEach(child => {
                if (child.x !== undefined && child.y !== undefined) {
                    avgDx += child.x - parent.x!;
                    avgDy += child.y - parent.y!;
                    validChildren++;
                }
            });
            
            if (validChildren < 2) return;
            
            avgDx /= validChildren;
            avgDy /= validChildren;
            const avgAngle = Math.atan2(avgDy, avgDx);
            
            // Gently pull children toward the average direction
            const bundleStrength = 0.3 * alpha * getScale();
            
            children.forEach(child => {
                if (child.is_sample || child.x === undefined || child.y === undefined) return;
                if (child.vx === undefined || child.vy === undefined) return;
                
                // Calculate desired angle
                const currentDx = child.x - parent.x!;
                const currentDy = child.y - parent.y!;
                const currentAngle = Math.atan2(currentDy, currentDx);
                const angleDiff = avgAngle - currentAngle;
                
                // Apply small force to rotate toward average angle
                const dist = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
                if (dist > 0) {
                    child.vx! += Math.sin(angleDiff) * bundleStrength * 2;
                    // Don't push vertically for bundling - keep temporal layers intact
                }
            });
        });
    };
}

export function createDescendantRangeForce(nodes: GraphNode[], edges: GraphEdge[], getScale: () => number) {
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
                    node.x += (expandedMin - node.x) * 0.1 * getScale();
                    node.vx = (node.vx || 0) * (0.8 + 0.2 * (1 - Math.min(1, getScale())));
                } else if (node.x > expandedMax + 50) {
                    node.x += (expandedMax - node.x) * 0.1 * getScale();
                    node.vx = (node.vx || 0) * (0.8 + 0.2 * (1 - Math.min(1, getScale())));
                }
            } else {
                // For parent ARGs or nodes without descendants, allow much more freedom
                const centerX = (sampleMinX + sampleMaxX) / 2;
                const allowedMin = centerX - desiredSpread / 2;
                const allowedMax = centerX + desiredSpread / 2;
                
                // Only apply very loose constraints
                if (node.x < allowedMin - 100) {
                    node.x += (allowedMin - node.x) * 0.05 * getScale();
                } else if (node.x > allowedMax + 100) {
                    node.x += (allowedMax - node.x) * 0.05 * getScale();
                }
            }
        });
    };
}

// Improved function to get the optimal x position for a node based on its children
export function getOptimalXPosition(node: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): number | null {
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