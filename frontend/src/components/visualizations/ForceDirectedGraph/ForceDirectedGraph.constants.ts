import { NodeSizeSettings, NodeIdSettings, EdgeLabelSettings, GraphNode, GraphEdge, TemporalSpacingMode } from "./ForceDirectedGraph.types";
import { arrangeSamplesByAncestralPath, arrangeSamplesByCoalescence } from "./ForceDirectedGraph.utils";
import { calculateYPosition, getOptimalXPosition, getDescendantSampleRange } from "./ForceDirectedGraph.utils";
import * as dagre from 'dagre';


// Default node sizes - these will be overridden by props
export const DEFAULT_NODE_SIZES: NodeSizeSettings = {
    sample: 8,
    root: 6,
    other: 5
};

// Default node ID settings - these will be overridden by props
export const DEFAULT_NODE_ID_SETTINGS: NodeIdSettings = {
    showSampleIds: true,
    showRootIds: false,
    showInternalIds: false
};

// Default edge label settings - these will be overridden by props
export const DEFAULT_EDGE_LABEL_SETTINGS: EdgeLabelSettings = {
    showEdgeLabels: false,
    labelFontSize: 14 // Changed from 12 to 14 for better readability
};

// Constants for graph layout and styling
export const GRAPH_CONSTANTS = {
    ROOT_NODE_STROKE_WIDTH: 2,
    SAMPLE_NODE_STROKE_WIDTH: 1,
    EDGE_STROKE_WIDTH: 1,
    COLLISION_RADIUS: 15,
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
    },
    EDGE_CROSSING: {
        SAMPLE_RATE: 0.3,          // Check 30% of edges each tick for performance
        REPULSION_STRENGTH: 0.8,   // How strongly to push nodes apart when crossings detected
        MIN_ANGLE: 15,             // Minimum angle (degrees) between edges from same node
        CHECK_INTERVAL: 3          // Only check crossings every N ticks for performance
    }
};

// Update setupInitialNodePositions
export const setupInitialNodePositions = (
    combinedNodes: GraphNode[], 
    combinedEdges: GraphEdge[], 
    actualWidth: number, 
    actualHeight: number, 
    sampleOrder?: string,
    nodeSizes?: NodeSizeSettings,
    temporalSpacingMode: TemporalSpacingMode = 'equal',
    temporalSpacing: number = 12,
    sampleSpacing: number = 20,
    originalNodes?: GraphNode[] // Original nodes before sample clustering (used to calculate cluster positions)
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
        // Separate regular samples from sample clusters
        const regularSamples = combinedNodes.filter(n => n.is_sample && !n.is_sample_cluster);
        const sampleClusters = combinedNodes.filter(n => n.is_sample_cluster);
        
        // Use sampleSpacing directly as the distance between samples (not as a multiplier)
        // This makes the graph wider for more samples, maintaining constant spacing per sample
        const adjustedSampleSpacing = sampleSpacing;

        // Reconstruct all samples (regular + constituent samples from clusters) for sorting
        const allSamplesForSorting: GraphNode[] = [...regularSamples];
        
        // If we have original nodes and sample clusters, reconstruct constituent samples
        if (originalNodes && sampleClusters.length > 0) {
            const originalNodesMap = new Map(originalNodes.map(n => [n.id, n]));
            
            for (const cluster of sampleClusters) {
                if (cluster.cluster_nodes) {
                    // Look up original sample nodes from cluster_nodes IDs
                    for (const sampleId of cluster.cluster_nodes) {
                        const originalSample = originalNodesMap.get(sampleId);
                        if (originalSample && originalSample.is_sample) {
                            allSamplesForSorting.push(originalSample);
                        }
                    }
                }
            }
        } else {
            // Fallback: if no original nodes, just use what we have
            allSamplesForSorting.push(...sampleClusters);
        }

        // Sort ALL samples (regular + constituent samples from clusters) based on sample order
        // Use originalNodes for graph traversal if available (otherwise use combinedNodes)
        const nodesForTraversal = originalNodes || combinedNodes;
        let sortedAllSamples: GraphNode[];
        switch (sampleOrder) {
            case 'ancestral_path':
                sortedAllSamples = arrangeSamplesByAncestralPath(
                    allSamplesForSorting,
                    nodesForTraversal,
                    combinedEdges
                );
                break;
            case 'coalescence':
                sortedAllSamples = arrangeSamplesByCoalescence(
                    allSamplesForSorting,
                    nodesForTraversal,
                    combinedEdges
                );
                break;
            case 'numeric':
                sortedAllSamples = [...allSamplesForSorting].sort((a, b) => a.id - b.id);
                break;
            default:
                // For other modes (center_minlex, first_tree, custom), use backend order_position if available
                sortedAllSamples = [...allSamplesForSorting].sort((a, b) => {
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

        // Create a map: sample ID -> position index in sorted order
        const sampleIdToPosition = new Map<number, number>();
        sortedAllSamples.forEach((sample, index) => {
            sampleIdToPosition.set(sample.id, index);
        });

        // Calculate x-positions for all samples in sorted order
        const totalSamples = sortedAllSamples.length;
        const totalWidth = (totalSamples - 1) * adjustedSampleSpacing;
        const centerOffset = (actualWidth - totalWidth) / 2;

        // Map: sample ID -> x position
        const sampleIdToXPosition = new Map<number, number>();
        sortedAllSamples.forEach((sample, index) => {
            sampleIdToXPosition.set(sample.id, centerOffset + (index * adjustedSampleSpacing));
        });

        // Position regular samples
        regularSamples.forEach(sample => {
            const xPos = sampleIdToXPosition.get(sample.id);
            if (xPos !== undefined) {
                sample.x = xPos;
                sample.fx = sample.x;
                sample.y = calculateYPosition(sample.time, uniqueTimes, availableHeight, temporalSpacingMode, temporalSpacing);
                sample.fy = sample.y;
            }
        });

        // Position sample clusters at average/consensus position in the sorted order
        // (not average x-coordinate, but average index position)
        sampleClusters.forEach(cluster => {
            if (!cluster.cluster_nodes || cluster.cluster_nodes.length === 0) {
                // Fallback: treat as regular sample (shouldn't happen)
                const xPos = sampleIdToXPosition.get(cluster.id);
                if (xPos !== undefined) {
                    cluster.x = xPos;
                    cluster.fx = cluster.x;
                } else {
                    // Last resort: sequential positioning
                    const index = combinedNodes.filter(n => n.is_sample).indexOf(cluster);
                    cluster.x = centerOffset + (index * adjustedSampleSpacing);
                    cluster.fx = cluster.x;
                }
                cluster.y = calculateYPosition(cluster.time, uniqueTimes, availableHeight, temporalSpacingMode, temporalSpacing);
                cluster.fy = cluster.y;
                return;
            }

            // Get position indices (in sorted order) of all constituent samples
            const constituentIndices: number[] = [];
            for (const sampleId of cluster.cluster_nodes) {
                const positionIndex = sampleIdToPosition.get(sampleId);
                if (positionIndex !== undefined) {
                    constituentIndices.push(positionIndex);
                }
            }

            if (constituentIndices.length > 0) {
                // Calculate average/consensus index position in the sorted order
                const avgIndex = Math.round(
                    constituentIndices.reduce((sum, idx) => sum + idx, 0) / constituentIndices.length
                );
                
                // Ensure the index is within bounds
                const clusterPositionIndex = Math.max(0, Math.min(avgIndex, totalSamples - 1));
                
                // Calculate x-position based on this consensus index
                cluster.x = centerOffset + (clusterPositionIndex * adjustedSampleSpacing);
                cluster.fx = cluster.x;
                cluster.y = calculateYPosition(cluster.time, uniqueTimes, availableHeight, temporalSpacingMode, temporalSpacing);
                cluster.fy = cluster.y;
            } else {
                // Fallback if we can't find constituent positions
                const index = combinedNodes.filter(n => n.is_sample).indexOf(cluster);
                cluster.x = centerOffset + (index * adjustedSampleSpacing);
                cluster.fx = cluster.x;
                cluster.y = calculateYPosition(cluster.time, uniqueTimes, availableHeight, temporalSpacingMode, temporalSpacing);
                cluster.fy = cluster.y;
            }
        });

        // Initialize non-sample nodes from bottom to top
        // IMPORTANT: This must happen AFTER sample nodes are positioned so that
        // getOptimalXPosition and getDescendantSampleRange use the correct sample positions
        // Get all sample-level nodes (for range calculations)
        const allSampleLevelNodes = [...regularSamples, ...sampleClusters];
        
        const nonSampleNodes = combinedNodes.filter(n => !n.is_sample)
            .sort((a, b) => b.timeIndex! - a.timeIndex!); // Sort by time, bottom to top

        // Recalculate internal node positions now that samples are positioned
        nonSampleNodes.forEach(node => {
            // Cluster nodes should preserve the root node's y position but recalculate x
            if (node.is_cluster && !node.is_sample_cluster) {
                // Recalculate x position based on children (optimal positioning)
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
                    const sampleMinX = Math.min(...allSampleLevelNodes.map((n: GraphNode) => n.x!));
                    const sampleMaxX = Math.max(...allSampleLevelNodes.map((n: GraphNode) => n.x!));
                    const centerX = (sampleMinX + sampleMaxX) / 2;
                    const maxOffset = (sampleMaxX - sampleMinX) * 0.3; // Stay within 30% of sample range
                    const randomOffset = (Math.random() - 0.5) * maxOffset;
                    node.x = centerX + randomOffset;
                }
                
                node.fx = null; // Allow x position to be adjusted by forces
                // Preserve y position from root (already set during clustering, don't recalculate)
                // node.y and node.fy are already set to root's values, so we don't change them
                return;
            }
            
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
                const sampleMinX = Math.min(...allSampleLevelNodes.map((n: GraphNode) => n.x!));
                const sampleMaxX = Math.max(...allSampleLevelNodes.map((n: GraphNode) => n.x!));
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