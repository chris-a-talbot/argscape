import { useEffect, forwardRef, ForwardedRef, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { ForceDirectedGraphProps, GraphNode, GraphEdge } from './ForceDirectedGraph.types';
import { useColorTheme } from '../../context/ColorThemeContext';

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

// Helper function to count edge crossings between two time layers
function countEdgeCrossingsBetweenLayers(nodes: Node[], edges: GraphEdge[], layer1: number, layer2: number): number {
    let crossings = 0;
    const layer1Nodes = nodes.filter(n => n.layer === layer1);
    const layer2Nodes = nodes.filter(n => n.layer === layer2);
    
    // Get all edges between these two layers
    const layerEdges = edges.filter(e => {
        const source = typeof e.source === 'number' ? nodes.find(n => n.id === e.source) : e.source as Node;
        const target = typeof e.target === 'number' ? nodes.find(n => n.id === e.target) : e.target as Node;
        return (source?.layer === layer1 && target?.layer === layer2) || 
               (source?.layer === layer2 && target?.layer === layer1);
    });

    // Count crossings between edges
    for (let i = 0; i < layerEdges.length; i++) {
        for (let j = i + 1; j < layerEdges.length; j++) {
            const e1 = layerEdges[i];
            const e2 = layerEdges[j];
            
            const source1 = typeof e1.source === 'number' ? nodes.find(n => n.id === e1.source) : e1.source as Node;
            const target1 = typeof e1.target === 'number' ? nodes.find(n => n.id === e1.target) : e1.target as Node;
            const source2 = typeof e2.source === 'number' ? nodes.find(n => n.id === e2.source) : e2.source as Node;
            const target2 = typeof e2.target === 'number' ? nodes.find(n => n.id === e2.target) : e2.target as Node;

            if (!source1 || !target1 || !source2 || !target2) continue;

            // Get the x-coordinates in order of layer
            const x1 = source1.layer === layer1 ? source1.x! : target1.x!;
            const x2 = source2.layer === layer1 ? source2.x! : target2.x!;
            const x3 = source1.layer === layer2 ? source1.x! : target1.x!;
            const x4 = source2.layer === layer2 ? source2.x! : target2.x!;

            // Check if edges cross
            if ((x1 < x2 && x3 > x4) || (x1 > x2 && x3 < x4)) {
                crossings++;
            }
        }
    }
    return crossings;
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
        
        // Find all edges where current node is the source
        const outgoingEdges = edges.filter(e => {
            const source = typeof e.source === 'number' ? nodes.find(n => n.id === e.source) : e.source as Node;
            const target = typeof e.target === 'number' ? nodes.find(n => n.id === e.target) : e.target as Node;
            // Only consider edges where source is earlier in time than target
            return source?.id === current.id && target && target.timeIndex! > current.timeIndex!;
        });
        
        // Add target nodes to queue if they're not samples
        outgoingEdges.forEach(e => {
            const target = typeof e.target === 'number' ? nodes.find(n => n.id === e.target) : e.target as Node;
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
    const range = {
        min: Math.min(...xValues),
        max: Math.max(...xValues)
    };

    // Debug log for nodes outside their range
    if (node.x! < range.min || node.x! > range.max) {
        console.warn(`Node ${node.id} at x=${node.x} is outside its descendant range [${range.min}, ${range.max}]`, {
            node,
            descendantSamples: descendantSamples.map(s => ({ id: s.id, x: s.x, time: s.time }))
        });
    }

    return range;
}

// Helper function to enforce x position within descendant range
function enforceDescendantRange(node: Node, nodes: Node[], edges: GraphEdge[]): void {
    const range = getDescendantSampleRange(node, nodes, edges);
    if (range) {
        const oldX = node.x!;
        node.x = Math.max(range.min, Math.min(range.max, node.x!));
        if (oldX !== node.x) {
            console.log(`Adjusted node ${node.id} from x=${oldX} to x=${node.x} to stay within range [${range.min}, ${range.max}]`);
        }
    }
}

// Helper function to get immediate parent of a node
function getParent(node: Node, nodes: Node[], edges: GraphEdge[]): Node | null {
    const incomingEdges = edges.filter(e => {
        const source = typeof e.source === 'number' ? nodes.find(n => n.id === e.source) : e.source as Node;
        const target = typeof e.target === 'number' ? nodes.find(n => n.id === e.target) : e.target as Node;
        return target?.id === node.id && source && source.timeIndex! < node.timeIndex!;
    });

    if (incomingEdges.length === 0) return null;
    const parent = typeof incomingEdges[0].source === 'number' 
        ? nodes.find(n => n.id === incomingEdges[0].source) 
        : incomingEdges[0].source as Node;
    return parent || null;
}

// Helper function to get siblings (nodes with same parent)
function getSiblings(node: Node, nodes: Node[], edges: GraphEdge[]): Node[] {
    const parent = getParent(node, nodes, edges);
    if (!parent) return [];

    return nodes.filter(n => {
        if (n.id === node.id || n.timeIndex! <= parent.timeIndex!) return false;
        const nParent = getParent(n, nodes, edges);
        return nParent?.id === parent.id;
    });
}

// Helper function to get all nodes in the same generation with same ancestor
function getCousins(node: Node, nodes: Node[], edges: GraphEdge[], ancestorDistance: number = 1): Node[] {
    const parent = getParent(node, nodes, edges);
    if (!parent) return [];

    // Get all nodes that share the same ancestor at the specified distance
    return nodes.filter(n => {
        if (n.id === node.id || n.timeIndex! <= node.timeIndex!) return false;
        
        let currentNode: Node | null = n;
        let currentParent: Node | null = parent;
        let distance = 0;

        while (currentNode && currentParent && distance < ancestorDistance) {
            const nParent = getParent(currentNode, nodes, edges);
            const pParent = getParent(currentParent, nodes, edges);
            if (!nParent || !pParent || nParent.id !== pParent.id) return false;
            currentNode = nParent;
            currentParent = pParent;
            distance++;
        }

        return distance === ancestorDistance;
    });
}

// Helper function to optimize node positions within a layer
function optimizeLayerPositions(nodes: Node[], edges: GraphEdge[], layer: number, width: number): void {
    const layerNodes = nodes.filter(n => n.layer === layer);
    if (layerNodes.length <= 1) return;

    // Group nodes by their immediate parent
    const parentGroups = new Map<number, Node[]>();
    layerNodes.forEach(node => {
        const parent = getParent(node, nodes, edges);
        const parentId = parent?.id ?? -1; // -1 for nodes without parents
        if (!parentGroups.has(parentId)) {
            parentGroups.set(parentId, []);
        }
        parentGroups.get(parentId)!.push(node);
    });

    // Sort nodes within each parent group by their connectivity to samples
    parentGroups.forEach(group => {
        group.sort((a, b) => {
            const aSamples = getDescendantSamples(a, nodes, edges).length;
            const bSamples = getDescendantSamples(b, nodes, edges).length;
            return bSamples - aSamples;
        });
    });

    // Convert parent groups to array and sort by average x position of their parent
    const sortedGroups = Array.from(parentGroups.entries()).sort(([parentIdA, groupA], [parentIdB, groupB]) => {
        if (parentIdA === -1) return -1;
        if (parentIdB === -1) return 1;
        const parentA = nodes.find(n => n.id === parentIdA);
        const parentB = nodes.find(n => n.id === parentIdB);
        return (parentA?.x ?? 0) - (parentB?.x ?? 0);
    });

    // Calculate positions for each group
    const xPadding = width * 0.1;
    const availableWidth = width - (2 * xPadding);
    let currentX = xPadding;

    sortedGroups.forEach(([parentId, group]) => {
        // Calculate group width based on number of nodes
        const groupWidth = (availableWidth * 0.8) / sortedGroups.length; // Use 80% of width for groups
        const nodeSpacing = groupWidth / (group.length + 1);

        // Position nodes within the group
        group.forEach((node, index) => {
            if (!node.is_sample) {
                const descendantRange = getDescendantSampleRange(node, nodes, edges);
                if (descendantRange) {
                    // Position within group while respecting descendant range
                    const groupX = currentX + (index + 1) * nodeSpacing;
                    node.x = Math.max(descendantRange.min, 
                        Math.min(descendantRange.max, 
                            groupX));
                } else {
                    node.x = currentX + (index + 1) * nodeSpacing;
                }
            }
        });

        currentX += groupWidth;
    });
}

// Helper function to assign layers based on time and connectivity
function assignLayers(nodes: Node[], edges: GraphEdge[]): void {
    // First, assign layers based on time
    const timeLayers = new Map<number, number>();
    nodes.forEach(node => {
        if (!timeLayers.has(node.time)) {
            timeLayers.set(node.time, timeLayers.size);
        }
        node.layer = timeLayers.get(node.time)!;
    });

    // Calculate node degrees
    nodes.forEach(node => {
        node.degree = edges.filter(e => {
            const source = typeof e.source === 'number' ? nodes.find(n => n.id === e.source) : e.source as Node;
            const target = typeof e.target === 'number' ? nodes.find(n => n.id === e.target) : e.target as Node;
            return source?.id === node.id || target?.id === node.id;
        }).length;
    });
}

// Helper function to get all edges connected to a node
function getConnectedEdges(node: Node, edges: GraphEdge[]): GraphEdge[] {
    return edges.filter(e => {
        const source = typeof e.source === 'number' ? e.source : (e.source as Node).id;
        const target = typeof e.target === 'number' ? e.target : (e.target as Node).id;
        return source === node.id || target === node.id;
    });
}

// Helper function to check if two nodes have identical relationships
function haveIdenticalRelationships(node1: Node, node2: Node, edges: GraphEdge[]): boolean {
    const edges1 = getConnectedEdges(node1, edges);
    const edges2 = getConnectedEdges(node2, edges);
    
    if (edges1.length !== edges2.length) return false;
    
    // Create sets of connected node IDs for both nodes
    const connectedNodes1 = new Set<number>();
    const connectedNodes2 = new Set<number>();
    
    edges1.forEach(e => {
        const source = typeof e.source === 'number' ? e.source : (e.source as Node).id;
        const target = typeof e.target === 'number' ? e.target : (e.target as Node).id;
        if (source !== node1.id) connectedNodes1.add(source);
        if (target !== node1.id) connectedNodes1.add(target);
    });
    
    edges2.forEach(e => {
        const source = typeof e.source === 'number' ? e.source : (e.source as Node).id;
        const target = typeof e.target === 'number' ? e.target : (e.target as Node).id;
        if (source !== node2.id) connectedNodes2.add(source);
        if (target !== node2.id) connectedNodes2.add(target);
    });
    
    // Check if the sets are identical
    if (connectedNodes1.size !== connectedNodes2.size) return false;
    for (const id of connectedNodes1) {
        if (!connectedNodes2.has(id)) return false;
    }
    return true;
}

// Helper function to combine nodes with identical time and relationships
function combineIdenticalNodes(nodes: Node[], edges: GraphEdge[]): { nodes: Node[], edges: GraphEdge[] } {
    const processedNodes = new Set<number>();
    const newNodes: Node[] = [];
    const newEdges: GraphEdge[] = [];
    const nodeMap = new Map<number, number>(); // Maps old node IDs to new combined node IDs
    
    // First pass: identify nodes to combine
    for (let i = 0; i < nodes.length; i++) {
        if (processedNodes.has(nodes[i].id)) continue;
        
        const node1 = nodes[i];
        const identicalNodes: Node[] = [node1];
        
        // NEVER combine sample nodes - they represent actual samples and should always be distinct
        if (node1.is_sample) {
            newNodes.push(node1);
            nodeMap.set(node1.id, node1.id);
            processedNodes.add(node1.id);
            continue;
        }
        
        // Find all nodes with identical time and relationships (only for non-sample nodes)
        for (let j = i + 1; j < nodes.length; j++) {
            const node2 = nodes[j];
            if (processedNodes.has(node2.id)) continue;
            
            // Skip if either node is a sample node - samples should never be combined
            if (node2.is_sample) continue;
            
            if (node1.time === node2.time && 
                node1.is_sample === node2.is_sample && 
                haveIdenticalRelationships(node1, node2, edges)) {
                identicalNodes.push(node2);
                processedNodes.add(node2.id);
            }
        }
        
        if (identicalNodes.length > 1) {
            // Create a combined node
            const combinedNode: Node = {
                ...node1,
                id: node1.id, // Use the first node's ID
                is_combined: true,
                combined_nodes: identicalNodes.map(n => n.id)
            };
            newNodes.push(combinedNode);
            
            // Map all combined node IDs to the new combined node ID
            identicalNodes.forEach(n => nodeMap.set(n.id, combinedNode.id));
        } else {
            newNodes.push(node1);
            nodeMap.set(node1.id, node1.id);
        }
        
        processedNodes.add(node1.id);
    }
    
    // Second pass: update edges to use new node IDs
    edges.forEach(edge => {
        const source = typeof edge.source === 'number' ? edge.source : (edge.source as Node).id;
        const target = typeof edge.target === 'number' ? edge.target : (edge.target as Node).id;
        
        const newSource = nodeMap.get(source);
        const newTarget = nodeMap.get(target);
        
        if (newSource !== undefined && newTarget !== undefined) {
            newEdges.push({
                ...edge,
                source: newSource,
                target: newTarget
            });
        }
    });
    
    return { nodes: newNodes, edges: newEdges };
}

// Helper function to check if a node is a root node (has children but no parents)
function isRootNode(node: Node, nodes: Node[], edges: GraphEdge[]): boolean {
    // Check for incoming edges (parents)
    const hasParents = edges.some(e => {
        const target = typeof e.target === 'number' ? nodes.find(n => n.id === e.target) : e.target as Node;
        return target?.id === node.id;
    });

    // Check for outgoing edges (children)
    const hasChildren = edges.some(e => {
        const source = typeof e.source === 'number' ? nodes.find(n => n.id === e.source) : e.source as Node;
        return source?.id === node.id;
    });

    // A root node has children but no parents
    return !hasParents && hasChildren;
}

export const ForceDirectedGraph = forwardRef<SVGSVGElement, ForceDirectedGraphProps>(({ 
    data, 
    width, 
    height,
    onNodeClick,
    onNodeRightClick,
    onEdgeClick,
    focalNode
}, ref: ForwardedRef<SVGSVGElement>) => {
    const { colors } = useColorTheme();
    
    // Memoize data key to prevent unnecessary simulation restarts
    const dataKey = useMemo(() => {
        if (!data) return null;
        return `${data.nodes.length}-${data.edges.length}-${data.metadata.genomic_start || 0}-${data.metadata.genomic_end || data.metadata.sequence_length}`;
    }, [data?.nodes.length, data?.edges.length, data?.metadata.genomic_start, data?.metadata.genomic_end, data?.metadata.sequence_length]);

    // Store previous data and key to avoid unnecessary simulation restarts
    const prevDataRef = useRef<{ data: typeof data; key: string | null }>({ data: null, key: null });
    
    const stableData = useMemo(() => {
        if (!data || !dataKey) return null;
        
        // If the key is the same as before, return the previous data reference
        if (prevDataRef.current.key === dataKey && prevDataRef.current.data) {
            return prevDataRef.current.data;
        }
        
        // Key changed, store new data and return it
        prevDataRef.current = { data, key: dataKey };
        return data;
    }, [data, dataKey]);

    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current || !stableData) return;

        // Get actual container dimensions if width/height not provided
        const containerRect = ref.current.getBoundingClientRect();
        const actualWidth = width || containerRect.width || 800;
        const actualHeight = height || containerRect.height || 600;

        // Combine identical nodes before visualization
        const { nodes: combinedNodes, edges: combinedEdges } = combineIdenticalNodes(stableData.nodes, stableData.edges);
        
        // Log information about combined nodes
        const combinedNodeCount = combinedNodes.filter(n => n.is_combined).length;
        if (combinedNodeCount > 0) {
            console.log(`Combined ${stableData.nodes.length - combinedNodes.length} nodes into ${combinedNodeCount} combined nodes`);
            combinedNodes.filter(n => n.is_combined).forEach(n => {
                console.log(`Combined node ${n.id} contains nodes:`, n.combined_nodes);
            });
        }

        // Debug log to verify data structure
        console.log('Graph data structure:', {
            nodeCount: combinedNodes.length,
            edgeCount: combinedEdges.length,
            firstNode: combinedNodes[0],
            firstEdge: combinedEdges[0]
        });

        // Clear any existing SVG content
        d3.select(ref.current).selectAll("*").remove();

        // Create the SVG container
        const svg = d3.select(ref.current)
            .attr("width", actualWidth)
            .attr("height", actualHeight)
            .attr("viewBox", [0, 0, actualWidth, actualHeight])
            .attr("style", "max-width: 100%; height: auto;");

        // Create a group for zooming
        const g = svg.append("g");

        // Add zoom behavior with transition
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Function to center and zoom on a node or the entire graph structure
        const focusOnNode = (node: GraphNode) => {
            if (!node) return;
            
            // Check if there are any edges in the current graph
            if (combinedEdges.length === 0) {
                // No edges - just center on the single node
                const targetNode = combinedNodes.find(n => n.id === node.id);
                if (!targetNode) return;

                const nodeX = targetNode.x ?? 0;
                const nodeY = actualHeight - (targetNode.timeIndex! * timeSpacing);

                const transform = d3.zoomIdentity
                    .translate(actualWidth / 2, actualHeight / 2)
                    .scale(1.5)  // Nice zoom for single node
                    .translate(-nodeX, -nodeY);

                svg.transition()
                    .duration(750)
                    .call(zoom.transform, transform);
            } else {
                // There are edges - center the entire graph structure
                const allNodes = combinedNodes.filter(n => n.x !== undefined && n.timeIndex !== undefined);
                if (allNodes.length === 0) return;

                // Calculate bounding box of all nodes
                const xValues = allNodes.map(n => n.x!);
                const yValues = allNodes.map(n => actualHeight - (n.timeIndex! * timeSpacing));
                
                const minX = Math.min(...xValues);
                const maxX = Math.max(...xValues);
                const minY = Math.min(...yValues);
                const maxY = Math.max(...yValues);

                // Calculate center of the bounding box
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                // Calculate appropriate scale to fit the graph with some padding
                const graphWidth = maxX - minX;
                const graphHeight = maxY - minY;
                const padding = 50; // Padding around the graph
                
                const scaleX = (actualWidth - 2 * padding) / (graphWidth || 1);
                const scaleY = (actualHeight - 2 * padding) / (graphHeight || 1);
                const scale = Math.min(Math.max(0.3, Math.min(scaleX, scaleY)), 2.0); // Constrain scale

                const transform = d3.zoomIdentity
                    .translate(actualWidth / 2, actualHeight / 2)
                    .scale(scale)
                    .translate(-centerX, -centerY);

                svg.transition()
                    .duration(750)
                    .call(zoom.transform, transform);
            }
        };

        // Get unique time points and create a mapping
        const uniqueTimes = Array.from(new Set(combinedNodes.map(n => n.time))).sort((a, b) => a - b);
        const timeToIndex = new Map(uniqueTimes.map((time, index) => [time, index]));
        
        // Add timeIndex to each node
        combinedNodes.forEach(node => {
            node.timeIndex = timeToIndex.get(node.time) ?? 0;
        });

        // Calculate the spacing between time points
        const timeSpacing = actualHeight / (uniqueTimes.length - 1 || 1);

        // Assign layers and calculate degrees
        assignLayers(combinedNodes, combinedEdges);

        // Get unique layers
        const layers = Array.from(new Set(combinedNodes.map(n => n.layer!))).sort((a, b) => a - b);

        // First position sample nodes
        const sampleNodes = combinedNodes.filter(n => n.is_sample);
        const xPadding = actualWidth * 0.1;
        const availableWidth = actualWidth - (2 * xPadding);
        const sampleSpacing = availableWidth / (sampleNodes.length - 1 || 1);

        // Sort sample nodes by their order position from backend (if available), otherwise by degree
        sampleNodes.sort((a, b) => {
            // If both nodes have order_position, use that
            if (a.order_position !== undefined && b.order_position !== undefined) {
                return a.order_position - b.order_position;
            }
            // If only one has order_position, prioritize it
            if (a.order_position !== undefined) return -1;
            if (b.order_position !== undefined) return 1;
            // Fallback to degree-based sorting
            return (b.degree ?? 0) - (a.degree ?? 0);
        });

        // Initial positioning of sample nodes
        sampleNodes.forEach((node, index) => {
            node.x = xPadding + (index * sampleSpacing);
            node.fx = node.x;
        });

        // Optimize positions for each layer
        layers.forEach(layer => {
            optimizeLayerPositions(combinedNodes, combinedEdges, layer, actualWidth);
        });

        // Focus on the focal node immediately after positioning
        if (focalNode) {
            focusOnNode(focalNode);
        }

        // Create the force simulation with enhanced crossing minimization and descendant range constraints
        const simulation = d3.forceSimulation<Node>(combinedNodes)
            .alpha(0.8) // Start with lower alpha for faster convergence
            .alphaDecay(0.05) // Faster decay to settle quickly
            .velocityDecay(0.7) // Higher velocity decay for stability
            .force("link", d3.forceLink<Node, GraphEdge>(combinedEdges)
                .id(d => d.id)
                .distance(50)
                .strength(d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    // Stronger links between siblings
                    const sourceParent = getParent(source!, combinedNodes, combinedEdges);
                    const targetParent = getParent(target!, combinedNodes, combinedEdges);
                    if (sourceParent && targetParent && sourceParent.id === targetParent.id) {
                        return 0.9; // Strong force between siblings
                    }
                    return (source?.is_sample || target?.is_sample) ? 0.8 : 0.3;
                }))
            .force("charge", d3.forceManyBody().strength(-20)) // Reduced from -30 for performance
            .force("x", d3.forceX((d: Node) => {
                if (d.is_sample) return d.x!;
                
                // For non-sample nodes, try to maintain their optimized position
                // while respecting descendant sample ranges and sibling relationships
                const descendantRange = getDescendantSampleRange(d, combinedNodes, combinedEdges);
                const siblings = getSiblings(d, combinedNodes, combinedEdges);
                
                if (siblings.length > 0) {
                    // Calculate average position of siblings
                    const siblingAvgX = siblings.reduce((sum, s) => sum + (s.x ?? 0), 0) / siblings.length;
                    if (descendantRange) {
                        // Try to stay near siblings while respecting descendant range
                        const targetX = (siblingAvgX + (descendantRange.min + descendantRange.max) / 2) / 2;
                        return Math.max(descendantRange.min, Math.min(descendantRange.max, targetX));
                    }
                    return siblingAvgX;
                }
                
                if (descendantRange) {
                    return (descendantRange.min + descendantRange.max) / 2;
                }
                return d.x ?? actualWidth / 2;
            }).strength(0.15)) // Reduced from 0.2 for performance
            .force("y", d3.forceY((d: Node) => {
                return d.fx === null ? actualHeight - (d.timeIndex! * timeSpacing) : d.y!;
            }).strength(1))
            .force("collision", d3.forceCollide().radius(15)) // Reduced from 20 for performance
            .force("descendantRange", () => {
                // Custom force to strictly enforce descendant ranges - run less frequently
                let tickCount = 0;
                return () => {
                    tickCount++;
                    // Only run every 3rd tick for performance
                    if (tickCount % 3 !== 0) return;
                    
                    if (!stableData) return;
                    combinedNodes.forEach(node => {
                        if (!node.is_sample) {
                            enforceDescendantRange(node, combinedNodes, combinedEdges);
                        }
                    });
                };
            })
            .force("edgeCrossing", () => {
                // Enhanced custom force to minimize edge crossings - simplified for performance
                let tickCount = 0;
                return (alpha: number) => {
                    tickCount++;
                    // Only run every 5th tick and only when alpha is high enough
                    if (tickCount % 5 !== 0 || alpha < 0.1) return;
                    
                    if (!stableData) return;
                    
                    // Simplified crossing minimization - only check a subset of nodes
                    const nonSampleNodes = combinedNodes.filter(n => !n.is_sample);
                    const nodesToCheck = nonSampleNodes.slice(0, Math.min(10, nonSampleNodes.length)); // Limit to 10 nodes max
                    
                    nodesToCheck.forEach(node => {
                        const descendantRange = getDescendantSampleRange(node, combinedNodes, combinedEdges);
                        const connectedEdges = combinedEdges.filter(e => {
                            const source = typeof e.source === 'number' ? combinedNodes.find(n => n.id === e.source) : e.source as Node;
                            const target = typeof e.target === 'number' ? combinedNodes.find(n => n.id === e.target) : e.target as Node;
                            return source?.id === node.id || target?.id === node.id;
                        });
                        
                        if (connectedEdges.length > 0) {
                            // Move node towards the average position of its connected nodes
                            const avgX = connectedEdges.reduce((sum, e) => {
                                const source = typeof e.source === 'number' ? combinedNodes.find(n => n.id === e.source) : e.source as Node;
                                const target = typeof e.target === 'number' ? combinedNodes.find(n => n.id === e.target) : e.target as Node;
                                const otherNode = source?.id === node.id ? target : source;
                                return sum + (otherNode?.x ?? 0);
                            }, 0) / connectedEdges.length;
                            
                            // Calculate new position while respecting descendant range
                            let newX = node.x! + (avgX - node.x!) * alpha * 0.3; // Reduced from 0.5
                            if (descendantRange) {
                                newX = Math.max(descendantRange.min, Math.min(descendantRange.max, newX));
                            }
                            node.x! = newX;
                        }
                    });
                };
            });

        // Draw edges as straight lines
        const edges = g.append("g")
            .selectAll<SVGLineElement, GraphEdge>("line")
            .data(combinedEdges)
            .join("line")
            .attr("stroke", `rgb(${colors.edgeDefault[0]}, ${colors.edgeDefault[1]}, ${colors.edgeDefault[2]})`)
            .attr("stroke-opacity", colors.edgeDefault[3] / 255)
            .attr("stroke-width", 1)
            .attr("x1", d => {
                const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                return source?.x ?? 0;
            })
            .attr("y1", d => {
                const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as Node;
                return actualHeight - (source?.timeIndex! * timeSpacing);
            })
            .attr("x2", d => {
                const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                return target?.x ?? 0;
            })
            .attr("y2", d => {
                const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                return actualHeight - (target?.timeIndex! * timeSpacing);
            })
            .on("click", (event, d) => onEdgeClick?.(d));

        // Add tooltip div
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
            .style("font-size", "12px")
            .style("pointer-events", "none");

        // Define drag functions before they are used
        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = actualHeight - (event.subject.timeIndex! * timeSpacing);
        }

        function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!stableData) return;
            const descendantRange = getDescendantSampleRange(event.subject, combinedNodes, combinedEdges);
            const siblings = getSiblings(event.subject, combinedNodes, combinedEdges);
            let x = event.x;
            
            if (descendantRange) {
                x = Math.max(descendantRange.min, Math.min(descendantRange.max, x));
            } else {
                x = Math.max(xPadding, Math.min(actualWidth - xPadding, x));
            }
            
            // If there are siblings, try to keep them together
            if (siblings.length > 0) {
                const siblingAvgX = siblings.reduce((sum, s) => sum + (s.x ?? 0), 0) / siblings.length;
                const maxSiblingDistance = 50; // Maximum distance between siblings
                x = Math.max(siblingAvgX - maxSiblingDistance, 
                    Math.min(siblingAvgX + maxSiblingDistance, x));
            }
            
            event.subject.fx = x;
            event.subject.fy = actualHeight - (event.subject.timeIndex! * timeSpacing);
        }

        function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            
            // Y position is controlled by time layer - reset to time-based position
            const descendantRange = getDescendantSampleRange(event.subject, combinedNodes, combinedEdges);
            
            // Enforce X position within descendant range constraints
            let x = event.subject.x ?? 0;
            if (descendantRange) {
                x = Math.max(descendantRange.min, Math.min(descendantRange.max, x));
            } else {
                x = Math.max(xPadding, Math.min(actualWidth - xPadding, x));
            }
            
            event.subject.x = x;
            event.subject.fy = actualHeight - (event.subject.timeIndex! * timeSpacing);
        }

        // Draw nodes with tooltip for all node types
        const nodes = g.append("g")
            .selectAll<SVGCircleElement, Node>("circle")
            .data(combinedNodes)
            .join("circle")
            .attr("r", d => {
                // Make sample nodes and root nodes larger
                if (d.is_sample || isRootNode(d, combinedNodes, combinedEdges)) return 5;
                return 3;  // Smaller size for regular nodes and combined nodes
            })
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
                if (isRootNode(d, combinedNodes, combinedEdges)) return 2;  // Thicker outline for root nodes
                if (d.is_sample) return 1;  // Thin outline for sample nodes
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
                    // Get unique children for root node
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
                        .sort((a, b) => a - b); // Sort for consistent display

                    // Get descendant samples
                    const descendantSamples = getDescendantSamples(d, combinedNodes, combinedEdges)
                        .map(sample => sample.id)
                        .sort((a, b) => a - b); // Sort for consistent display

                    tooltipContent = `Root node ${d.id}<br>Time: ${d.time}`;
                    if (children.length > 0) {
                        tooltipContent += `<br>Children: ${children.join(", ")}`;
                    }
                    if (descendantSamples.length > 0) {
                        tooltipContent += `<br>Descendant samples: ${descendantSamples.join(", ")}`;
                    }
                } else {
                    // For internal nodes, show their unique connections
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
                        .sort((a, b) => a - b); // Sort for consistent display
                    
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
                        .sort((a, b) => a - b); // Sort for consistent display

                    tooltipContent = `Internal node ${d.id}<br>Time: ${d.time}`;
                    if (parents.length > 0) {
                        tooltipContent += `<br>Parents: ${parents.join(", ")}`;
                    }
                    if (children.length > 0) {
                        tooltipContent += `<br>Children: ${children.join(", ")}`;
                    }
                }

                // Add individual ID information if available
                if (d.individual !== undefined && d.individual !== -1) {
                    tooltipContent += `<br>Individual: ${d.individual}`;
                }

                // Add spatial location information if available
                if (d.location) {
                    const location = d.location;
                    // Check if coordinates appear to be geographic (WGS84 range)
                    const isGeographic = location.x >= -180 && location.x <= 180 && 
                                       location.y >= -90 && location.y <= 90 &&
                                       (location.x !== 0 || location.y !== 0); // Exclude (0,0) which is often a default
                    
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

        // Add node labels for sample nodes
        const labels = g.append("g")
            .selectAll<SVGTextElement, Node>("text")
            .data(combinedNodes.filter(d => d.is_sample))
            .join("text")
            .text(d => d.id.toString())
            .attr("font-size", "10px")
            .attr("fill", colors.text)
            .attr("dx", 12)
            .attr("dy", 4);

        // Update positions on each tick
        simulation.on("tick", () => {
            if (!stableData) return;
            
            // Only enforce descendant ranges every few ticks for performance
            const currentTick = simulation.alpha();
            if (currentTick > 0.1) { // Only during active simulation
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
                    return actualHeight - (source?.timeIndex! * timeSpacing);
                })
                .attr("x2", d => {
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    return target?.x ?? 0;
                })
                .attr("y2", d => {
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as Node;
                    return actualHeight - (target?.timeIndex! * timeSpacing);
                });

            nodes
                .attr("cx", d => d.x ?? 0)
                .attr("cy", d => actualHeight - (d.timeIndex! * timeSpacing));

            labels
                .attr("x", d => d.x ?? 0)
                .attr("y", d => actualHeight - (d.timeIndex! * timeSpacing));
        });

        // Cleanup
        return () => {
            simulation.stop();
            tooltip.remove();
        };
    }, [stableData, width, height, onNodeClick, onNodeRightClick, onEdgeClick, focalNode, ref]);

    return (
        <div className="w-full h-full">
            <svg ref={ref} className="w-full h-full" />
        </div>
    );
}); 