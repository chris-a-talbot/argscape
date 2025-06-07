import { useEffect, forwardRef, ForwardedRef, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { ForceDirectedGraphProps, GraphNode, GraphEdge, NodeSizeSettings } from './ForceDirectedGraph.types';
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

// Helper function to optimize node positions within a layer
function optimizeLayerPositions(nodes: Node[], edges: GraphEdge[], layer: number, width: number): void {
    const layerNodes = nodes.filter(n => n.layer === layer);
    if (layerNodes.length <= 1) return;

    const parentGroups = groupNodesByParent(layerNodes, nodes, edges);
    const sortedGroups = sortParentGroups(parentGroups, nodes);
    positionNodesInGroups(sortedGroups, width, nodes, edges);
}

// Helper function to group nodes by their parent
function groupNodesByParent(layerNodes: Node[], nodes: Node[], edges: GraphEdge[]): Map<number, Node[]> {
    const parentGroups = new Map<number, Node[]>();
    
    layerNodes.forEach(node => {
        const parent = getParent(node, nodes, edges);
        const parentId = parent?.id ?? -1;
        
        if (!parentGroups.has(parentId)) {
            parentGroups.set(parentId, []);
        }
        parentGroups.get(parentId)!.push(node);
    });

    // Sort nodes within each group by descendant sample count
    parentGroups.forEach(group => {
        group.sort((a, b) => {
            const aSampleCount = getDescendantSamples(a, nodes, edges).length;
            const bSampleCount = getDescendantSamples(b, nodes, edges).length;
            return bSampleCount - aSampleCount;
        });
    });

    return parentGroups;
}

// Helper function to sort parent groups by parent position
function sortParentGroups(parentGroups: Map<number, Node[]>, nodes: Node[]): Array<[number, Node[]]> {
    return Array.from(parentGroups.entries()).sort(([parentIdA], [parentIdB]) => {
        if (parentIdA === -1) return -1;
        if (parentIdB === -1) return 1;
        
        const parentA = nodes.find(n => n.id === parentIdA);
        const parentB = nodes.find(n => n.id === parentIdB);
        return (parentA?.x ?? 0) - (parentB?.x ?? 0);
    });
}

// Helper function to position nodes within their groups
function positionNodesInGroups(
    sortedGroups: Array<[number, Node[]]>, 
    width: number, 
    nodes: Node[], 
    edges: GraphEdge[]
): void {
    const xPadding = width * GRAPH_CONSTANTS.PADDING_RATIO;
    const availableWidth = width - (2 * xPadding);
    let currentX = xPadding;

    sortedGroups.forEach(([, group]) => {
        const groupWidth = (availableWidth * GRAPH_CONSTANTS.AVAILABLE_WIDTH_RATIO) / sortedGroups.length;
        const nodeSpacing = groupWidth / (group.length + 1);

        group.forEach((node, index) => {
            if (!node.is_sample) {
                const groupX = currentX + (index + 1) * nodeSpacing;
                const descendantRange = getDescendantSampleRange(node, nodes, edges);
                
                node.x = descendantRange
                    ? Math.max(descendantRange.min, Math.min(descendantRange.max, groupX))
                    : groupX;
            }
        });

        currentX += groupWidth;
    });
}

// Helper function to assign layers based on time and calculate degrees
function assignLayers(nodes: Node[], edges: GraphEdge[]): void {
    const timeLayers = new Map<number, number>();
    
    // Assign layers based on unique time points
    nodes.forEach(node => {
        if (!timeLayers.has(node.time)) {
            timeLayers.set(node.time, timeLayers.size);
        }
        node.layer = timeLayers.get(node.time)!;
    });

    // Calculate node connectivity degrees
    nodes.forEach(node => {
        node.degree = getConnectedEdges(node, edges).length;
    });
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

// Helper function to setup initial node positions
function setupInitialNodePositions(combinedNodes: Node[], actualWidth: number, actualHeight: number) {
    const uniqueTimes = Array.from(new Set(combinedNodes.map(n => n.time))).sort((a, b) => a - b);
    const timeToIndex = new Map(uniqueTimes.map((time, index) => [time, index]));
    const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
    const timeSpacing = availableHeight / (uniqueTimes.length - 1 || 1);
    
    // Add timeIndex to each node
    combinedNodes.forEach(node => {
        node.timeIndex = timeToIndex.get(node.time) ?? 0;
    });

    // Position sample nodes
    const sampleNodes = combinedNodes.filter(n => n.is_sample);
    const xPadding = actualWidth * GRAPH_CONSTANTS.PADDING_RATIO;
    const availableWidth = actualWidth - (2 * xPadding);
    const sampleSpacing = availableWidth / (sampleNodes.length - 1 || 1);

    // Sort sample nodes by order position or degree
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
    });

    return { timeSpacing, uniqueTimes };
}

export const ForceDirectedGraph = forwardRef<SVGSVGElement, ForceDirectedGraphProps>(({ 
    data, 
    width, 
    height,
    onNodeClick,
    onNodeRightClick,
    onEdgeClick,
    focalNode,
    nodeSizes = DEFAULT_NODE_SIZES
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

        const { nodes: combinedNodes, edges: combinedEdges } = combineIdenticalNodes(stableData.nodes, stableData.edges);

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
        const { timeSpacing } = setupInitialNodePositions(combinedNodes, actualWidth, actualHeight);

        assignLayers(combinedNodes, combinedEdges);

        const layers = Array.from(new Set(combinedNodes.map(n => n.layer!))).sort((a, b) => a - b);

        layers.forEach(layer => {
            optimizeLayerPositions(combinedNodes, combinedEdges, layer, actualWidth);
        });

        if (focalNode) {
            focusOnNode(focalNode, combinedNodes, combinedEdges);
        }

        const simulation = d3.forceSimulation<Node>(combinedNodes)
            .alpha(GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_START)
            .alphaDecay(GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_DECAY)
            .velocityDecay(GRAPH_CONSTANTS.FORCE_STRENGTH.VELOCITY_DECAY)
            .force("link", d3.forceLink<Node, GraphEdge>(combinedEdges)
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
            .force("charge", d3.forceManyBody().strength(GRAPH_CONSTANTS.FORCE_STRENGTH.CHARGE))
            .force("x", d3.forceX((d: Node) => {
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
            .force("y", d3.forceY((d: Node) => {
                const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
                return d.fx === null ? availableHeight - (d.timeIndex! * timeSpacing) : d.y!;
            }).strength(GRAPH_CONSTANTS.FORCE_STRENGTH.Y_POSITION))
            .force("collision", d3.forceCollide().radius(GRAPH_CONSTANTS.COLLISION_RADIUS))
            .force("descendantRange", () => {
                let tickCount = 0;
                return () => {
                    tickCount++;
                    if (tickCount % GRAPH_CONSTANTS.PERFORMANCE.TICK_SKIP_DESCENDANT !== 0) return;
                    
                    if (!stableData) return;
                    combinedNodes.forEach(node => {
                        if (!node.is_sample) {
                            enforceDescendantRange(node, combinedNodes, combinedEdges);
                        }
                    });
                };
            })
            .force("edgeCrossing", () => {
                let tickCount = 0;
                return (alpha: number) => {
                    tickCount++;
                    if (tickCount % GRAPH_CONSTANTS.PERFORMANCE.TICK_SKIP_CROSSING !== 0 || alpha < GRAPH_CONSTANTS.PERFORMANCE.ALPHA_THRESHOLD) return;
                    
                    if (!stableData) return;
                    
                    const nonSampleNodes = combinedNodes.filter(n => !n.is_sample);
                    const nodesToCheck = nonSampleNodes.slice(0, Math.min(GRAPH_CONSTANTS.PERFORMANCE.MAX_NODES_TO_CHECK, nonSampleNodes.length));
                    
                    nodesToCheck.forEach(node => {
                        const descendantRange = getDescendantSampleRange(node, combinedNodes, combinedEdges);
                        const connectedEdges = combinedEdges.filter(e => {
                            const source = typeof e.source === 'number' ? combinedNodes.find(n => n.id === e.source) : e.source as Node;
                            const target = typeof e.target === 'number' ? combinedNodes.find(n => n.id === e.target) : e.target as Node;
                            return source?.id === node.id || target?.id === node.id;
                        });
                        
                        if (connectedEdges.length > 0) {
                            const avgX = connectedEdges.reduce((sum, e) => {
                                const source = typeof e.source === 'number' ? combinedNodes.find(n => n.id === e.source) : e.source as Node;
                                const target = typeof e.target === 'number' ? combinedNodes.find(n => n.id === e.target) : e.target as Node;
                                const otherNode = source?.id === node.id ? target : source;
                                return sum + (otherNode?.x ?? 0);
                            }, 0) / connectedEdges.length;
                            
                            let newX = node.x! + (avgX - node.x!) * alpha * 0.3;
                            if (descendantRange) {
                                newX = Math.max(descendantRange.min, Math.min(descendantRange.max, newX));
                            }
                            node.x! = newX;
                        }
                    });
                };
            });

        const edges = g.append("g")
            .selectAll<SVGLineElement, GraphEdge>("line")
            .data(combinedEdges)
            .join("line")
            .attr("stroke", `rgb(${colors.edgeDefault[0]}, ${colors.edgeDefault[1]}, ${colors.edgeDefault[2]})`)
            .attr("stroke-opacity", colors.edgeDefault[3] / 255)
            .attr("stroke-width", GRAPH_CONSTANTS.EDGE_STROKE_WIDTH)
            .attr("x1", d => {
                const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                return source?.x ?? 0;
            })
            .attr("y1", d => {
                const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
                return availableHeight - (source?.timeIndex! * timeSpacing);
            })
            .attr("x2", d => {
                const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                return target?.x ?? 0;
            })
            .attr("y2", d => {
                const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
                return availableHeight - (target?.timeIndex! * timeSpacing);
            })
            .on("click", (event, d) => onEdgeClick?.(d));

        const tooltipBg = colors.background === '#ffffff' ? 'white' : 'rgba(5, 62, 78, 0.95)';
        const tooltipBorder = colors.border;
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", tooltipBg)
            .style("color", colors.text)
            .style("border", `1px solid ${tooltipBorder}`)
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-size", GRAPH_CONSTANTS.TOOLTIP_FONT_SIZE)
            .style("pointer-events", "none");

        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(GRAPH_CONSTANTS.ZOOM.ALPHA_TARGET).restart();
            event.subject.fx = event.subject.x;
            const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
            event.subject.fy = availableHeight - (event.subject.timeIndex! * timeSpacing);
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
            const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
            event.subject.fy = availableHeight - (event.subject.timeIndex! * timeSpacing);
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
            const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
            event.subject.fy = availableHeight - (event.subject.timeIndex! * timeSpacing);
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

            const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
            
            edges
                .attr("x1", d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                    return source?.x ?? 0;
                })
                .attr("y1", d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                    return availableHeight - (source?.timeIndex! * timeSpacing);
                })
                .attr("x2", d => {
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    return target?.x ?? 0;
                })
                .attr("y2", d => {
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    return availableHeight - (target?.timeIndex! * timeSpacing);
                });

            nodes
                .attr("cx", d => d.x ?? 0)
                .attr("cy", d => availableHeight - (d.timeIndex! * timeSpacing));

            labels
                .attr("x", d => d.x ?? 0)
                .attr("y", d => availableHeight - (d.timeIndex! * timeSpacing));
        });

        return () => {
            simulation.stop();
            tooltip.remove();
        };
    }, [stableData, width, height, onNodeClick, onNodeRightClick, onEdgeClick, focalNode, nodeSizes, ref]);

    return (
        <div className="w-full h-full">
            <svg ref={ref} className="w-full h-full" />
        </div>
    );
}); 