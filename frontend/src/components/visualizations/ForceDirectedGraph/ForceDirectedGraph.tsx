import { useEffect, forwardRef, ForwardedRef, useMemo, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { ForceDirectedGraphProps, GraphNode, GraphEdge, TemporalSpacingMode, Simulation } from './ForceDirectedGraph.types';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { 
  combineGenealogyIdenticalNodes, 
  analyzeNodeCombining 
} from '../../../utils/nodeCombining';
import { 
  groupEdgesByPairs, 
  expandEdgeSpansForCombinedNodes,
  EdgeGroupWithSpans 
} from '../../../utils/genomicSpanUtils';
import { isRootNode } from '../../../utils/graphTraversal';
import { DEFAULT_NODE_SIZES, DEFAULT_NODE_ID_SETTINGS, DEFAULT_EDGE_LABEL_SETTINGS, 
    GRAPH_CONSTANTS, setupInitialNodePositions } from './ForceDirectedGraph.constants';
import { createClusterNodes, createSampleClusters, getEdgeClusterInfo } from './ForceDirectedGraph.clustering';
import { getChildren, getDescendantSamples, getNodeRadius } from './ForceDirectedGraph.utils';
import { createFocusFunction, calculateEdgeCrossings, enforceDescendantRange, 
    calculateYPosition, getDescendantSampleRange, getParent, getSiblings, 
    findOptimalLabelPosition, createDescendantRangeForce, createEdgeCrossingReductionForce, 
    createEdgeBundlingForce, isLikelyParentARG, getOptimalXPosition } from './ForceDirectedGraph.utils';

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
    sampleSpacing = 20,
    temporalRange,
    temporalDimOpacity = 0.05,
    genomicRange,
    genomicDimOpacity = 0.05,
    treeRange,
    treeIntervals,
    treeDimOpacity = 0.30,
    simulationPaused = false,
    unpinTrigger = 0,
    onEdgeCrossingsChange,
    forceTuning,
    resetTrigger,
    clusteringEnabled = false,
    clusteringMinTreeSize = 3,
    clusteringRequireDensity = false,
    clusteringDensityIntensity = 0.5,
    clusteringRequireTemporalCompactness = true,
    clusteringTemporalIntensity = 0.5,
    clusteringMaxSampleClusterSize = 25
}, ref: ForwardedRef<SVGSVGElement>) => {
    const { colors } = useColorTheme();
    
    // Track if clustering is changing to prevent stale data usage
    const prevClusteringRef = useRef({ 
        enabled: clusteringEnabled, 
        minTreeSize: clusteringMinTreeSize,
        requireDensity: clusteringRequireDensity,
        densityIntensity: clusteringDensityIntensity,
        requireTemporalCompactness: clusteringRequireTemporalCompactness,
        temporalIntensity: clusteringTemporalIntensity
    });
    const isClusteringChanging = useRef(false);
    
    useEffect(() => {
        const prev = prevClusteringRef.current;
        const clusteringChanged = 
            prev.enabled !== clusteringEnabled ||
            prev.minTreeSize !== clusteringMinTreeSize ||
            prev.requireDensity !== clusteringRequireDensity ||
            prev.densityIntensity !== clusteringDensityIntensity ||
            prev.requireTemporalCompactness !== clusteringRequireTemporalCompactness ||
            prev.temporalIntensity !== clusteringTemporalIntensity;
        
        if (clusteringChanged) {
            isClusteringChanging.current = true;
            // Reset flag after main rendering effect has had time to complete
            setTimeout(() => { isClusteringChanging.current = false; }, 100);
        }
        
        prevClusteringRef.current = { 
            enabled: clusteringEnabled, 
            minTreeSize: clusteringMinTreeSize,
            requireDensity: clusteringRequireDensity,
            densityIntensity: clusteringDensityIntensity,
            requireTemporalCompactness: clusteringRequireTemporalCompactness,
            temporalIntensity: clusteringTemporalIntensity
        };
    }, [clusteringEnabled, clusteringMinTreeSize, clusteringRequireDensity, clusteringDensityIntensity, clusteringRequireTemporalCompactness, clusteringTemporalIntensity, clusteringMaxSampleClusterSize]);
    
    // Store current visualization state to preserve user movements and zoom
    const visualStateRef = useRef<{
        nodes: GraphNode[];
        edges: GraphEdge[];
        simulation: Simulation | null;
        svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
        zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null;
        userMovedNodes: Map<number, { x: number; y: number; fx: number | null; fy: number | null }>;
        currentTransform: d3.ZoomTransform | null;
    }>({
        nodes: [],
        edges: [],
        simulation: null,
        svg: null,
        zoom: null,
        userMovedNodes: new Map(),
        currentTransform: null
    });

    // Resolve runtime force tuning with defaults matching container
    const tuning = useMemo(() => ({
        chargeScale: forceTuning?.chargeScale ?? 1,
        linkStrengthScale: forceTuning?.linkStrengthScale ?? 0.4,
        xStrengthScale: forceTuning?.xStrengthScale ?? 4,
        yStrengthScale: forceTuning?.yStrengthScale ?? 1,
        collisionRadiusScale: forceTuning?.collisionRadiusScale ?? 1.1,
        collisionStrength: forceTuning?.collisionStrength ?? 0.7,
        edgeCrossingScale: forceTuning?.edgeCrossingScale ?? 1,
        edgeBundlingScale: forceTuning?.edgeBundlingScale ?? 1,
        descendantRangeScale: forceTuning?.descendantRangeScale ?? 1,
    }), [forceTuning]);

    // Apply tuning changes live to the existing simulation (including initial application)
    useEffect(() => {
        const sim = visualStateRef.current.simulation as d3.Simulation<GraphNode, GraphEdge> | null;
        const nodes = visualStateRef.current.nodes as GraphNode[];
        const edges = visualStateRef.current.edges as GraphEdge[];
        if (!sim || !nodes || !edges) return;
        
        // Debug logging only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Applying force tuning:', tuning);
        }

        // Update built-in forces
        const linkForce = sim.force("link") as d3.ForceLink<GraphNode, GraphEdge> | null;
        if (linkForce) {
            linkForce.strength((d) => {
                const source = typeof d.source === 'number' ? nodes.find(n => n.id === d.source) : d.source as GraphNode;
                const target = typeof d.target === 'number' ? nodes.find(n => n.id === d.target) : d.target as GraphNode;
                if (!source || !target) return 0.5;
                const sourceParent = getParent(source, nodes, edges);
                const targetParent = getParent(target, nodes, edges);
                if (sourceParent && targetParent && sourceParent.id === targetParent.id) {
                    return GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_SIBLING * 1.4 * tuning.linkStrengthScale;
                }
                if (!source.is_sample && !target.is_sample) {
                    return GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_DEFAULT * 2.0 * tuning.linkStrengthScale;
                }
                return ((source.is_sample || target.is_sample) ?
                    GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_SAMPLE * 1.3 :
                    GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_DEFAULT * 1.6) * tuning.linkStrengthScale;
            });
        }

        const chargeForce = sim.force("charge") as d3.ForceManyBody<GraphNode> | null;
        if (chargeForce) {
            chargeForce.strength((d) => {
                const node = d as GraphNode;
                const base = node.is_sample ? GRAPH_CONSTANTS.FORCE_STRENGTH.CHARGE * 2.7 : GRAPH_CONSTANTS.FORCE_STRENGTH.CHARGE * 2.2;
                const deg = edges.reduce((acc, e) => {
                    const s = typeof e.source === 'number' ? e.source : (e.source as GraphNode).id;
                    const t = typeof e.target === 'number' ? e.target : (e.target as GraphNode).id;
                    return acc + ((s === node.id || t === node.id) ? 1 : 0);
                }, 0);
                return base * (1 + deg * 0.12) * tuning.chargeScale;
            });
        }

        const xForce = sim.force("x") as d3.ForceX<GraphNode> | null;
        if (xForce) {
            xForce.strength((d: GraphNode) => {
                if (d.is_sample) return 1.0 * tuning.xStrengthScale;
                const descendantRange = getDescendantSampleRange(d, nodes, edges);
                if (descendantRange) return GRAPH_CONSTANTS.FORCE_STRENGTH.X_POSITION * 2.5 * tuning.xStrengthScale;
                const hasChildren = getChildren(d, nodes, edges).length > 0;
                return (hasChildren ? GRAPH_CONSTANTS.FORCE_STRENGTH.X_POSITION * 2.0 : GRAPH_CONSTANTS.FORCE_STRENGTH.X_POSITION * 1.0) * tuning.xStrengthScale;
            });
        }

        // No y spring anymore; we pin fy to enforce strict stratification

        const collideForce = sim.force("collision") as d3.ForceCollide<GraphNode> | null;
        if (collideForce) {
            collideForce
                .radius((d: GraphNode) => (d.is_sample ? GRAPH_CONSTANTS.COLLISION_RADIUS * 1.8 : GRAPH_CONSTANTS.COLLISION_RADIUS * 1.5) * tuning.collisionRadiusScale)
                .strength(Math.max(0, Math.min(1, tuning.collisionStrength)));
        }

        // Reattach custom forces with updated scales (only those still used)
        if (sampleOrder !== 'dagre') {
            sim.force("descendantRange", createDescendantRangeForce(nodes, edges, () => tuning.descendantRangeScale));
            sim.force("edgeCrossing", createEdgeCrossingReductionForce(nodes, edges, () => tuning.edgeCrossingScale));
            sim.force("edgeBundling", createEdgeBundlingForce(nodes, edges, () => tuning.edgeBundlingScale));
        }

        // Nudge simulation to apply changes with higher alpha for initial settling
        sim.alpha(0.5).alphaTarget(0.1).restart();
        // Drop target after settling - increased delay to allow more time for simulation
        setTimeout(() => {
            sim.alphaTarget(0);
        }, 2000);
    }, [tuning, sampleOrder, data]); // Add data dependency to trigger on initial load

    // Full simulation reset while retaining sample order and positions
    useEffect(() => {
        if (resetTrigger === 0) return;
        // Skip reset if clustering is currently changing - let main rendering effect handle it
        if (isClusteringChanging.current) {
            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
              console.log('Reset trigger skipped - clustering is changing, main effect will handle positioning');
            }
            return;
        }
        const sim = visualStateRef.current.simulation as d3.Simulation<GraphNode, GraphEdge> | null;
        const nodes = visualStateRef.current.nodes as GraphNode[];
        const svg = visualStateRef.current.svg;
        if (!sim || !nodes || !svg) return;
        
        // For dagre mode, skip manual reset - dagre positions are handled in main rendering effect
        if (sampleOrder === 'dagre') {
            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
              console.log('Reset trigger skipped for dagre mode - positions handled in main rendering effect');
            }
            return;
        }
        
        // Debug logging only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Reset trigger fired - recalculating horizontal and vertical spacing');
        }
        
        const containerRect = svg.node()?.getBoundingClientRect();
        if (!containerRect) return;
        
        const actualWidth = width || containerRect.width || 800;
        const actualHeight = height || containerRect.height || 600;
        const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
        
        // Recalculate vertical spacing (temporal layers) - treat as new graph
        // This is critical for subARG/parent ARG where unique times change
        const uniqueTimes = Array.from(new Set(nodes.map(n => n.time))).sort((a, b) => a - b);
        nodes.forEach((n) => {
            const y = calculateYPosition(n.time, uniqueTimes, availableHeight, temporalSpacingMode, temporalSpacing);
            n.y = y;
            n.fy = y; // Pin y position to maintain temporal layer
            n.vy = 0; // Reset velocity
        });
        
        // Recalculate horizontal spacing for sample-level nodes
        // This is needed when clustering settings change or subARG/parent ARG loads
        const sampleLevelNodes = nodes.filter(n => n.is_sample || n.is_sample_cluster);
        
        // Sort them by their current order (using order_position if available, else x position)
        sampleLevelNodes.sort((a, b) => {
            if (a.order_position !== undefined && b.order_position !== undefined) {
                return a.order_position - b.order_position;
            }
            // If no order_position, maintain current x order
            if (a.x !== undefined && b.x !== undefined) {
                return a.x - b.x;
            }
            return a.id - b.id;
        });
            
        // Recalculate horizontal spacing
        const totalWidth = (sampleLevelNodes.length - 1) * sampleSpacing;
        const centerOffset = (actualWidth - totalWidth) / 2;
        
        // Reposition all sample-level nodes with correct spacing
        sampleLevelNodes.forEach((node, index) => {
            node.x = centerOffset + (index * sampleSpacing);
            node.fx = node.x;
            node.vx = 0; // Reset velocity
        });
        
        // Debug logging only in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Repositioned ${sampleLevelNodes.length} sample-level nodes with spacing ${sampleSpacing}, ${uniqueTimes.length} temporal layers`);
        }
        
        // Reset velocities and unpin only NON-SAMPLE nodes; samples keep fx and fy
        nodes.forEach(n => {
            n.vx = 0;
            n.vy = 0;
            if (!n.is_sample && !n.is_sample_cluster) {
                n.fx = null; // Allow x movement but keep fy pinned (y positions)
            }
        });
        
        // Update the simulation nodes to ensure it has the latest positions
        sim.nodes(nodes);
        
        // Force a tick to update visual positions immediately
        sim.tick();
        
        // Update the DOM elements to reflect new positions
        if (svg.node()) {
            svg.selectAll<SVGCircleElement, GraphNode>('circle.node')
                .attr('cx', d => d.x ?? 0)
                .attr('cy', d => d.y ?? 0);
            
            svg.selectAll<SVGLineElement, GraphEdge>('line.edge')
                .attr('x1', d => {
                    const source = typeof d.source === 'number' ? nodes.find(n => n.id === d.source) : d.source as GraphNode;
                    return source?.x ?? 0;
                })
                .attr('y1', d => {
                    const source = typeof d.source === 'number' ? nodes.find(n => n.id === d.source) : d.source as GraphNode;
                    return source?.y ?? 0;
                })
                .attr('x2', d => {
                    const target = typeof d.target === 'number' ? nodes.find(n => n.id === d.target) : d.target as GraphNode;
                    return target?.x ?? 0;
                })
                .attr('y2', d => {
                    const target = typeof d.target === 'number' ? nodes.find(n => n.id === d.target) : d.target as GraphNode;
                    return target?.y ?? 0;
                });
        }
        
        // Restart the simulation with the updated positions
        sim.alpha(0.9).alphaTarget(0.3).restart();
        setTimeout(() => sim.alphaTarget(0), 2000); // Increased from 200ms to allow more settling time
    }, [resetTrigger, width, height, sampleSpacing, temporalSpacingMode, temporalSpacing, sampleOrder]);

    // Keep y pinned to layer when spacing/mode/height/temporalRange changes
    useEffect(() => {
        const sim = visualStateRef.current.simulation as d3.Simulation<GraphNode, GraphEdge> | null;
        const nodes = visualStateRef.current.nodes as GraphNode[];
        if (!sim || !nodes) return;

        // Skip Y recalculation for dagre - positions are rank-based, not time-based
        if (sampleOrder === 'dagre') return;

        const targetHeight = (visualStateRef.current.svg?.node()?.getBoundingClientRect().height ?? 0) * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
        const uniqueTimes = Array.from(new Set(nodes.map(n => n.time))).sort((a, b) => a - b);
        nodes.forEach((n) => {
            const y = calculateYPosition(n.time, uniqueTimes, targetHeight, temporalSpacingMode, temporalSpacing);
            n.fy = y;
            n.vy = 0;
        });
        // Also keep sample nodes pinned on x at their current x (respecting any manual movement)
        nodes.forEach((n) => {
            if (n.is_sample && typeof n.x === 'number') {
                n.fx = n.x;
                n.vx = 0;
            }
        });
        sim.alphaTarget(0.15).restart();
        setTimeout(() => sim.alphaTarget(0), 1500); // Increased from 120ms to allow more settling time
    }, [temporalSpacingMode, temporalSpacing, height, temporalRange]);

    // Memoize data key to prevent unnecessary simulation restarts
    const dataKey = useMemo(() => {
        if (!data) return null;
        return `${data.nodes.length}-${data.edges.length}-${data.metadata.genomic_start || 0}-${data.metadata.genomic_end || data.metadata.sequence_length}`;
    }, [data?.nodes.length, data?.edges.length, data?.metadata.genomic_start, data?.metadata.genomic_end, data?.metadata.sequence_length]);

    const prevDataRef = useRef<{ data: typeof data; key: string | null }>({ data: null, key: null });
    const prevSampleOrderRef = useRef<string | null>(null);
    const prevFocalNodeRef = useRef<GraphNode | null>(null);
    const shouldAutoZoomRef = useRef<boolean>(false);
    const prevNodeSetRef = useRef<Set<number>>(new Set()); 

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

    // Memoize combined nodes and edges to prevent redundant combining operations
    // This should only run when stableData changes, not on every effect
    const combinedData = useMemo(() => {
        if (!stableData) return null;
        
        // Debug: Analyze node combining patterns (only in development)
        if (process.env.NODE_ENV === 'development') {
          analyzeNodeCombining(stableData.nodes, stableData.edges);
        }
        
        const { nodes: combinedNodes, edges: combinedEdges } = combineGenealogyIdenticalNodes(stableData.nodes, stableData.edges);
        return { nodes: combinedNodes, edges: combinedEdges };
    }, [stableData]);

    // Apply clustering if enabled
    const clusteredData = useMemo(() => {
        if (!combinedData) return null;
        
        let currentData = combinedData;
        
        // Step 1: Apply regular subtree clustering if enabled
        let originalParentMap: Map<number, Set<number>> | undefined;
        if (clusteringEnabled) {
            const { nodes: clusteredNodes, edges: clusteredEdges, originalParentMap: parentMap } = createClusterNodes(
                currentData.nodes as GraphNode[],
                currentData.edges,
                clusteringMinTreeSize,
                clusteringRequireDensity,
                clusteringDensityIntensity,
                clusteringRequireTemporalCompactness,
                clusteringTemporalIntensity
            );
            
            console.log(`Subtree clustering: ${currentData.nodes.length} nodes -> ${clusteredNodes.length} nodes (${currentData.nodes.length - clusteredNodes.length} clustered)`);
            
            currentData = { nodes: clusteredNodes as GraphNode[], edges: clusteredEdges };
            originalParentMap = parentMap;
        }
        
        // Store nodes before sample clustering (for position calculation)
        const nodesBeforeSampleClustering = currentData.nodes;
        
        // Step 2: Apply sample clustering if enabled
        // Sample clustering reduces edge clutter by grouping samples connected to the same internal cluster node
        if (clusteringEnabled) {
            const { nodes: sampleClusteredNodes, edges: sampleClusteredEdges } = createSampleClusters(
                currentData.nodes as GraphNode[],
                currentData.edges,
                sampleOrder,  // Parameter kept for compatibility but ignored
                originalParentMap,  // Pass through original parent relationships
                clusteringMaxSampleClusterSize  // Maximum samples per cluster
            );
            
            currentData = { 
                nodes: sampleClusteredNodes as GraphNode[], 
                edges: sampleClusteredEdges,
            } as typeof currentData & { originalNodes: GraphNode[] };
            (currentData as any).originalNodes = nodesBeforeSampleClustering as GraphNode[]; // Store original nodes for position calculation
        } else {
            // If no sample clustering, originalNodes is same as current nodes
            (currentData as any).originalNodes = currentData.nodes as GraphNode[];
        }
        
        return currentData;
    }, [combinedData, clusteringEnabled, clusteringMinTreeSize, clusteringRequireDensity, clusteringDensityIntensity, clusteringRequireTemporalCompactness, clusteringTemporalIntensity, clusteringMaxSampleClusterSize, sampleOrder]);
    
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

            let toSkip = false;
            for (const node of currentNodes) {
                if (!node.originalX) {
                    toSkip = true;
                    break;
                }
            }

            if (toSkip) {
                return;
            }

            currentNodes.forEach(node => {

                // Only update if user hasn't manually moved this node
                if (!visualStateRef.current.userMovedNodes.has(node.id)) {
                    // Store original position if not already stored
                    if (!node.originalX) {
                        return;
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
                // IMPORTANT: Sort samples by current X position to preserve spatial order
                // This prevents resetting to numeric order when spacing changes
                const sortedSamples = [...sampleNodes].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
                
                const availableWidth = actualWidth - (2 * actualWidth * GRAPH_CONSTANTS.PADDING_RATIO);
                const baseSampleSpacing = availableWidth / (sortedSamples.length - 1 || 1);
                const adjustedSampleSpacing = baseSampleSpacing * (newSampleSpacing / 15); // More aggressive: matches main implementation
                const totalWidth = (sortedSamples.length - 1) * adjustedSampleSpacing;
                const centerOffset = (actualWidth - totalWidth) / 2;
                
                sortedSamples.forEach((node, index) => {
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
        
    }, [sampleOrder]); // Only sampleOrder affects the spacing logic, width/height are read from ref
    
    // Separate effect for spacing updates that don't require full re-render
    useEffect(() => {
        // Skip updateSpacing if clustering is changing - prevents stale data usage
        if (isClusteringChanging.current) return;
        updateSpacing(temporalSpacing, sampleSpacing, temporalSpacingMode);
        // IMPORTANT: Do NOT trigger auto-zoom for spacing changes
        // shouldAutoZoomRef.current should remain false here
    }, [temporalSpacing, sampleSpacing, temporalSpacingMode, updateSpacing]);

    // Ensure spacing/order updates immediately when sampleOrder changes
    useEffect(() => {
        // Skip updateSpacing if clustering is changing - prevents stale data usage
        if (isClusteringChanging.current) return;
        updateSpacing(temporalSpacing, sampleSpacing, temporalSpacingMode);
        // Keep auto-zoom disabled for order changes
    }, [sampleOrder, updateSpacing]);

    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current || !clusteredData || !stableData) return;
        const orderChanged = prevSampleOrderRef.current !== sampleOrder;

        const containerRect = ref.current.getBoundingClientRect();
        const actualWidth = width || containerRect.width || 800;
        const actualHeight = height || containerRect.height || 600;
        const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);

        const { nodes: combinedNodes, edges: combinedEdges } = clusteredData;
        const originalNodes = (clusteredData as any).originalNodes as GraphNode[] | undefined;
        const uniqueTimes = Array.from(new Set(combinedNodes.map(n => n.time))).sort((a, b) => a - b);

        d3.select(ref.current).selectAll("*").remove();

        const svg = d3.select(ref.current)
            .attr("viewBox", [0, 0, actualWidth, actualHeight])
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "100%");

        const g = svg.append("g");

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([GRAPH_CONSTANTS.ZOOM.MIN_SCALE, GRAPH_CONSTANTS.ZOOM.MAX_SCALE])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                // Store current transform for preservation
                visualStateRef.current.currentTransform = event.transform;
            });

        svg.call(zoom);
        
        // Restore previous zoom state if it exists (and we're not auto-zooming)
        if (visualStateRef.current.currentTransform && !shouldAutoZoomRef.current) {
            svg.call(zoom.transform, visualStateRef.current.currentTransform);
        }

        const focusOnNode = createFocusFunction(svg, zoom, actualWidth, actualHeight, 0);
        
        // Detect if node set has changed (BEFORE setupInitialNodePositions)
        const currentNodeIds = new Set(combinedNodes.map(n => n.id));
        const previousNodeCount = prevNodeSetRef.current.size; // Store for logging (used in Fix 4)
        const nodeSetChanged = 
            previousNodeCount !== currentNodeIds.size ||
            Array.from(currentNodeIds).some(id => !prevNodeSetRef.current.has(id));

        // Preserve previous node positions if simulation is restarting (but skip if nodes changed in dagre mode)
        const previousNodePositions = new Map<number, { x: number; y: number; fx: number | null; fy: number | null }>();
        if (visualStateRef.current.nodes.length > 0 && !(sampleOrder === 'dagre' && nodeSetChanged)) {
            // Store all current node positions, not just user-moved ones
            visualStateRef.current.nodes.forEach(node => {
                if (node.x !== undefined && node.y !== undefined) {
                    previousNodePositions.set(node.id, {
                        x: node.x,
                        y: node.y,
                        fx: node.fx ?? null,
                        fy: node.fy ?? null
                    });
                }
            });
        }

        // Update the ref for next comparison
        prevNodeSetRef.current = currentNodeIds;
        
        const { timeSpacing, uniqueTimes: setupUniqueTimes } = setupInitialNodePositions(combinedNodes, combinedEdges, actualWidth, actualHeight, sampleOrder, nodeSizes, temporalSpacingMode, temporalSpacing, sampleSpacing, originalNodes);

        // Detect if sample-level nodes have changed (due to clustering changes)
        const previousSampleLevelNodeIds = new Set(
            visualStateRef.current.nodes
                .filter(n => n.is_sample || n.is_sample_cluster)
                .map(n => n.id)
        );
        const currentSampleLevelNodeIds = new Set(
            combinedNodes
                .filter(n => n.is_sample || n.is_sample_cluster)
                .map(n => n.id)
        );
        const sampleLevelNodesChanged = 
            previousSampleLevelNodeIds.size !== currentSampleLevelNodeIds.size ||
            Array.from(currentSampleLevelNodeIds).some(id => !previousSampleLevelNodeIds.has(id));
        
        // Also check if sample order changed - this means samples were repositioned
        const sampleOrderChanged = prevSampleOrderRef.current !== sampleOrder;

        // If sample-level nodes changed OR sample order changed, recalculate internal node positions
        // since internal nodes depend on sample positions for their optimal x-positions
        if ((sampleLevelNodesChanged || sampleOrderChanged) && sampleOrder !== 'dagre') {
            // Only recalculate sample spacing if the set changed
            if (sampleLevelNodesChanged) {
                console.log('Sample-level nodes changed, recalculating horizontal spacing');
                
                // Get all sample-level nodes (samples and sample clusters)
                // Spacing should be based on the NEW visible set of nodes, not original samples
                const sampleLevelNodes = combinedNodes.filter(n => n.is_sample || n.is_sample_cluster);
                
                // Sort them by their current order (using order_position if available, else x position)
                sampleLevelNodes.sort((a, b) => {
                    if (a.order_position !== undefined && b.order_position !== undefined) {
                        return a.order_position - b.order_position;
                    }
                    // If no order_position, maintain current x order
                    if (a.x !== undefined && b.x !== undefined) {
                        return a.x - b.x;
                    }
                    return a.id - b.id;
                });
                
                // Calculate spacing based on visible nodes (samples + clusters), not original sample count
                const totalWidth = (sampleLevelNodes.length - 1) * sampleSpacing;
                const centerOffset = (actualWidth - totalWidth) / 2;
                
                // Reposition all sample-level nodes with correct spacing
                sampleLevelNodes.forEach((node, index) => {
                    node.x = centerOffset + (index * sampleSpacing);
                    node.fx = node.x;
                    // Y position is already set correctly from setupInitialNodePositions
                });
            }
            
            // IMPORTANT: After repositioning samples (either due to set change or order change),
            // recalculate internal node positions since they depend on sample positions for optimal x-positioning
            const internalNodes = combinedNodes.filter(n => !n.is_sample && !n.is_sample_cluster);
            const allSampleLevelNodes = combinedNodes.filter(n => n.is_sample || n.is_sample_cluster);
            
            console.log(`Recalculating ${internalNodes.length} internal node positions based on updated sample positions`);
            
            internalNodes.forEach(node => {
                // Recalculate optimal x position based on updated sample positions
                const optimalX = getOptimalXPosition(node, combinedNodes, combinedEdges);
                
                if (optimalX !== null) {
                    node.x = optimalX;
                    // Don't set fx - let forces handle it, but provide good initial position
                } else if (allSampleLevelNodes.length > 0) {
                    // Fallback to centered position within sample range
                    const sampleMinX = Math.min(...allSampleLevelNodes.map(n => n.x!).filter(x => x !== undefined));
                    const sampleMaxX = Math.max(...allSampleLevelNodes.map(n => n.x!).filter(x => x !== undefined));
                    if (sampleMinX !== undefined && sampleMaxX !== undefined) {
                        const centerX = (sampleMinX + sampleMaxX) / 2;
                        node.x = centerX;
                    }
                }
            });
        }

        // Restore previous positions after setup (if they exist and we're not forcing new layout)
        // BUT: don't restore sample-level positions if the set of sample-level nodes changed (due to clustering)
        if (previousNodePositions.size > 0 && !shouldAutoZoomRef.current && sampleOrder !== 'dagre') {
            combinedNodes.forEach(node => {
                const prevPos = previousNodePositions.get(node.id);
                if (prevPos) {
                    // Skip position restoration for sample-level nodes if clustering changed or the sample order changed
                    if ((sampleLevelNodesChanged || orderChanged) && (node.is_sample || node.is_sample_cluster)) {
                        // Keep the fresh positions from our recalculation above
                        return;
                    }
                    node.x = prevPos.x;
                    node.y = prevPos.y;
                    node.fx = prevPos.fx;
                    node.fy = prevPos.fy;
                }
            });
        }

        // Store visualization state for the updateSpacing function
        visualStateRef.current = {
            nodes: combinedNodes,
            edges: combinedEdges,
            simulation: null, // Will be set below
            svg,
            zoom,
            userMovedNodes: visualStateRef.current.userMovedNodes, // Preserve user movements
            currentTransform: visualStateRef.current.currentTransform // Preserve zoom state
        };

        // Track timeout for cleanup
        let autoZoomTimeout: NodeJS.Timeout | undefined;
        
        // Only auto-zoom when there's a structural change, not for visual parameter adjustments
        if (shouldAutoZoomRef.current) {
            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
              console.log('Auto-zoom triggered:', {
                focalNode: focalNode ? `node ${focalNode.id}` : 'none',
                action: focalNode ? 'focusing on specific node' : 'fitting entire graph to view',
                nodeCount: combinedNodes.length,
                edgeCount: combinedEdges.length
              });
            }
            
            // Reset flag immediately to prevent multiple calls
            shouldAutoZoomRef.current = false;
            
            // Use a small delay to ensure nodes are positioned before zoom
            autoZoomTimeout = setTimeout(() => {
        if (focalNode) {
                    // Focus on specific node (subARG)
                    // Debug logging only in development
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Executing focus on node:', focalNode.id);
                    }
                    focusOnNode(focalNode, combinedNodes, combinedEdges, false);
                } else {
                    // Fit entire graph to view using the enhanced bounds calculation
                    // Debug logging only in development
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Executing fit to entire graph');
                    }
                    focusOnNode(null, combinedNodes, combinedEdges, true);
                }
            }, 100);
        }

        // Create tooltip outside of simulation
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "fixed")
            .style("visibility", "hidden")
            .style("background-color", colors.tooltipBackground)
            .style("color", colors.tooltipText)
            .style("border", `1px solid ${colors.border}`)
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-size", GRAPH_CONSTANTS.TOOLTIP_FONT_SIZE)
            .style("pointer-events", "none")
            .style("z-index", "9999")
            .style("max-width", "300px");

        // Create simulation with proper typing
        const simulation: Simulation = d3.forceSimulation<GraphNode>(combinedNodes)
            .alpha(sampleOrder === 'dagre' ? 0 : GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_START)
            .alphaDecay(sampleOrder === 'dagre' ? 1 : GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_DECAY)
            .velocityDecay(sampleOrder === 'dagre' ? 1 : 0.4) // Reduced from 0.7 to allow more movement
            .force("link", sampleOrder === 'dagre' ? null : d3.forceLink<GraphNode, GraphEdge>(combinedEdges)
                .id(d => d.id)
                .distance(d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as GraphNode;
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as GraphNode;
                    if (!source || !target) return 100; // Default distance if nodes not found
                    
                    // Calculate vertical distance between layers
                    const verticalDistance = Math.abs((source.timeIndex ?? 0) - (target.timeIndex ?? 0));
                    
                    // Get number of siblings (children of same parent) to adjust spacing
                    const sourceChildren = getChildren(source, combinedNodes, combinedEdges);
                    const targetSiblings = sourceChildren.filter(child => {
                        const childParent = getParent(child, combinedNodes, combinedEdges);
                        return childParent?.id === source.id;
                    });
                    
                    // Base distance - shorter for internal nodes to help them untangle
                    let baseDistance = (source.is_sample || target.is_sample) ? 100 : 70;
                    
                    // Increase distance for nodes with many siblings to give them room
                    if (targetSiblings.length > 2) {
                        baseDistance += Math.min(targetSiblings.length * 8, 40);
                    }
                    
                    return baseDistance + verticalDistance * 18;
                })
                .strength(d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as GraphNode;
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as GraphNode;
                    if (!source || !target) return 0.5; // Default strength if nodes not found
                    
                    // Check if nodes are siblings (share same parent)
                    const sourceParent = getParent(source, combinedNodes, combinedEdges);
                    const targetParent = getParent(target, combinedNodes, combinedEdges);
                    if (sourceParent && targetParent && sourceParent.id === targetParent.id) {
                        // Stronger link for siblings to keep them together
                        return GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_SIBLING * 1.4 * tuning.linkStrengthScale;
                    }
                    
                    // Stronger links for internal-to-internal connections to help untangle
                    if (!source.is_sample && !target.is_sample) {
                        return GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_DEFAULT * 2.0 * tuning.linkStrengthScale;
                    }
                    
                    return ((source.is_sample || target.is_sample) ? 
                        GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_SAMPLE * 1.3 :
                        GRAPH_CONSTANTS.FORCE_STRENGTH.LINK_DEFAULT * 1.6) * tuning.linkStrengthScale;
                }))
            .force("charge", sampleOrder === 'dagre' ? null : d3.forceManyBody()
                .strength((d: d3.SimulationNodeDatum) => {
                    const node = d as GraphNode;
                    const baseCharge = node.is_sample ? 
                        GRAPH_CONSTANTS.FORCE_STRENGTH.CHARGE * 2.7 :
                        GRAPH_CONSTANTS.FORCE_STRENGTH.CHARGE * 2.2;
                    // Slightly reduce per-connection bonus
                    const edges = combinedEdges.filter(e => {
                        const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
                        const targetId = typeof e.target === 'number' ? e.target : e.target.id;
                        return sourceId === node.id || targetId === node.id;
                    });
                    return baseCharge * (1 + edges.length * 0.12) * tuning.chargeScale;
                }))
            .force("x", sampleOrder === 'dagre' ? null : d3.forceX((d: GraphNode) => {
                if (d.is_sample) return d.x!;
                
                // Use the improved optimal positioning function
                const optimalX = getOptimalXPosition(d, combinedNodes, combinedEdges);
                if (optimalX !== null) {
                    return optimalX;
                }
                
                return d.x ?? actualWidth / 2;
            }).strength((d: GraphNode) => {
                // Increase x-positioning strength for nodes with descendants to keep them close to children
                if (d.is_sample) return 1.0 * tuning.xStrengthScale; // Keep samples fixed
                
                const descendantRange = getDescendantSampleRange(d, combinedNodes, combinedEdges);
                if (descendantRange) {
                    // Strong positioning for nodes with descendants
                    return GRAPH_CONSTANTS.FORCE_STRENGTH.X_POSITION * 2.5 * tuning.xStrengthScale;
                }
                
                const hasChildren = getChildren(d, combinedNodes, combinedEdges).length > 0;
                return (hasChildren ? 
                    GRAPH_CONSTANTS.FORCE_STRENGTH.X_POSITION * 2.0 : 
                    GRAPH_CONSTANTS.FORCE_STRENGTH.X_POSITION * 1.0) * tuning.xStrengthScale;
            }))
            .force("collision", sampleOrder === 'dagre' ? null : d3.forceCollide()
                .radius((d: d3.SimulationNodeDatum) => {
                    const node = d as GraphNode;
                    return (node.is_sample ? 
                        GRAPH_CONSTANTS.COLLISION_RADIUS * 1.8 :
                        GRAPH_CONSTANTS.COLLISION_RADIUS * 1.5) * tuning.collisionRadiusScale;
                })
                .strength(Math.max(0, Math.min(1, tuning.collisionStrength))))
            .force("descendantRange", sampleOrder === 'dagre' ? null : createDescendantRangeForce(combinedNodes, combinedEdges, () => tuning.descendantRangeScale))
            .force("edgeCrossing", sampleOrder === 'dagre' ? null : createEdgeCrossingReductionForce(combinedNodes, combinedEdges, () => tuning.edgeCrossingScale))
            .force("edgeBundling", sampleOrder === 'dagre' ? null : createEdgeBundlingForce(combinedNodes, combinedEdges, () => tuning.edgeBundlingScale));

        if (sampleOrder !== 'dagre') {
            // Pin nodes to strict y-layers so collisions can never reorder layers
            const targetHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
            const uniqueTimesInit = Array.from(new Set(combinedNodes.map(n => n.time))).sort((a, b) => a - b);
            combinedNodes.forEach((n) => {
                const y = calculateYPosition(n.time, uniqueTimesInit, targetHeight, temporalSpacingMode, temporalSpacing);
                n.fy = y;
                if (n.is_sample && typeof n.x === 'number' && sampleOrder !== 'dagre') {
                        n.fx = n.x;
                    }
                });
        }

        // Helper function to check if an edge overlaps with genomic range
        const edgeOverlapsGenomicRange = (edge: GraphEdge): boolean => {
            if (!genomicRange || edge.left === undefined || edge.right === undefined) return true;
            const [genomicLeft, genomicRight] = genomicRange;
            // Check if edge overlaps with genomic range (edges use [left, right) notation)
            return edge.left < genomicRight && edge.right > genomicLeft;
        };

        // Helper function to check if a node has any edges in the genomic range
        const nodeHasEdgesInGenomicRange = (node: GraphNode): boolean => {
            if (!genomicRange) return true;
            const nodeId = node.id;
            // Check if this node has any edges that overlap with the genomic range
            return combinedEdges.some(edge => {
                const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
                const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
                return (sourceId === nodeId || targetId === nodeId) && edgeOverlapsGenomicRange(edge);
            });
        };

        // Helper function to check if an edge overlaps with any selected tree intervals
        const edgeOverlapsTreeRange = (edge: GraphEdge): boolean => {
            if (!treeRange || !treeIntervals || edge.left === undefined || edge.right === undefined) return true;
            const [treeStartIdx, treeEndIdx] = treeRange;
            
            // Find all tree intervals in the selected range
            const selectedIntervals = treeIntervals.filter(interval => 
                interval.index >= treeStartIdx && interval.index <= treeEndIdx
            );
            
            // Check if edge overlaps with any selected tree interval's genomic range
            return selectedIntervals.some(interval => {
                // Check if edge overlaps with this tree interval's genomic range
                return edge.left < interval.right && edge.right > interval.left;
            });
        };

        // Helper function to check if a node has any edges in the tree range
        const nodeHasEdgesInTreeRange = (node: GraphNode): boolean => {
            if (!treeRange || !treeIntervals) return true;
            const nodeId = node.id;
            // Check if this node has any edges that overlap with the tree range
            return combinedEdges.some(edge => {
                const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
                const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
                return (sourceId === nodeId || targetId === nodeId) && edgeOverlapsTreeRange(edge);
            });
        };

        // Helper function to calculate opacity based on temporal range
        const getTemporalNodeOpacity = (node: GraphNode): number => {
            if (!temporalRange) return 1;
            const [minTime, maxTime] = temporalRange;
            if (node.time >= minTime && node.time <= maxTime) {
                return 1;
            }
            return Math.max(0, Math.min(0.99, temporalDimOpacity));
        };

        // Helper function to calculate opacity based on genomic range
        const getGenomicNodeOpacity = (node: GraphNode): number => {
            if (!genomicRange) return 1;
            if (nodeHasEdgesInGenomicRange(node)) {
                return 1;
            }
            return Math.max(0, Math.min(0.99, genomicDimOpacity));
        };

        // Helper function to calculate opacity based on tree range
        const getTreeNodeOpacity = (node: GraphNode): number => {
            if (!treeRange || !treeIntervals) return 1;
            if (nodeHasEdgesInTreeRange(node)) {
                return 1;
            }
            return Math.max(0, Math.min(0.99, treeDimOpacity));
        };

        // Combined node opacity (temporal, genomic, and tree)
        const getNodeOpacity = (node: GraphNode): number => {
            const temporal = getTemporalNodeOpacity(node);
            const genomic = getGenomicNodeOpacity(node);
            const tree = getTreeNodeOpacity(node);
            // Use minimum so all filters apply
            return Math.min(temporal, genomic, tree);
        };

        // Helper function to calculate edge opacity based on temporal range
        const getTemporalEdgeOpacity = (edge: GraphEdge): number => {
            if (!temporalRange) return edgeOpacity / 100;
            const sourceNode = typeof edge.source === 'number' ? 
                combinedNodes.find(n => n.id === edge.source) : edge.source as GraphNode;
            const targetNode = typeof edge.target === 'number' ? 
                combinedNodes.find(n => n.id === edge.target) : edge.target as GraphNode;
            
            // Edge is visible if both nodes are visible
            if (sourceNode && targetNode) {
                const sourceVisible = getTemporalNodeOpacity(sourceNode) > 0.5;
                const targetVisible = getTemporalNodeOpacity(targetNode) > 0.5;
                if (sourceVisible && targetVisible) {
                    return edgeOpacity / 100;
                }
            }
            return Math.max(0, Math.min(0.99, temporalDimOpacity)) * (edgeOpacity / 100);
        };

        // Helper function to calculate edge opacity based on genomic range
        const getGenomicEdgeOpacity = (edge: GraphEdge): number => {
            if (!genomicRange) return edgeOpacity / 100;
            if (edgeOverlapsGenomicRange(edge)) {
                return edgeOpacity / 100;
            }
            return Math.max(0, Math.min(0.99, genomicDimOpacity)) * (edgeOpacity / 100);
        };

        // Helper function to calculate edge opacity based on tree range
        const getTreeEdgeOpacity = (edge: GraphEdge): number => {
            if (!treeRange || !treeIntervals) return edgeOpacity / 100;
            if (edgeOverlapsTreeRange(edge)) {
                return edgeOpacity / 100;
            }
            return Math.max(0, Math.min(0.99, treeDimOpacity)) * (edgeOpacity / 100);
        };

        // Combined edge opacity (temporal, genomic, and tree)
        const getEdgeOpacity = (edge: GraphEdge): number => {
            const temporal = getTemporalEdgeOpacity(edge);
            const genomic = getGenomicEdgeOpacity(edge);
            const tree = getTreeEdgeOpacity(edge);
            // Use minimum so all filters apply
            return Math.min(temporal, genomic, tree);
        };

        const edges = g.append("g")
            .selectAll<SVGLineElement, GraphEdge>("line")
            .data(combinedEdges)
            .join("line")
            .attr("stroke", d => {
                const { isSampleClusterEdge } = getEdgeClusterInfo(d, combinedNodes);
                if (isSampleClusterEdge) {
                    return `rgb(56, 189, 248)`; // Cyan to match sample cluster color
                } else {
                    return `rgb(${colors.edgeDefault[0]}, ${colors.edgeDefault[1]}, ${colors.edgeDefault[2]})`;
                }
            })
            .attr("stroke-opacity", d => getEdgeOpacity(d))
            .attr("stroke-width", d => {
                const { isSampleClusterEdge, clusterSize } = getEdgeClusterInfo(d, combinedNodes);
                if (isSampleClusterEdge) {
                    // Thicker edges for sample cluster connections (scale by cluster size)
                    return edgeThickness * Math.min(3, 1 + Math.log10(clusterSize) * 0.8);
                }
                return edgeThickness;
            })
            .attr("x1", d => {
                const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as GraphNode;
                return source?.x ?? 0;
            })
            .attr("y1", d => {
                const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as GraphNode;
                return sampleOrder === 'dagre' ? (source?.y ?? 0) : 
                    calculateYPosition(source?.time ?? 0, setupUniqueTimes, availableHeight, temporalSpacingMode, temporalSpacing);
            })
            .attr("x2", d => {
                const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as GraphNode;
                return target?.x ?? 0;
            })
            .attr("y2", d => {
                const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as GraphNode;
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
                .attr("font-size", `${edgeMutationSettings.markerSize || 14}px`)
                .attr("fill", "#dc2626") // Red color for mutation markers
                .attr("opacity", d => getEdgeOpacity(d))
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

        // Calculate edge groups for labels (always calculate, control visibility separately)
        let edgeGroups: EdgeGroupWithSpans[] = [];
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

        // Helper function to find optimal edge label position
        const findOptimalEdgeLabelPosition = (
            sourceNode: GraphNode, 
            targetNode: GraphNode, 
            edgeGroup: EdgeGroupWithSpans,
            allNodes: GraphNode[],
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

        // Create edge labels (always create, control visibility with CSS)
        const edgeLabels = g.append("g")
            .attr("class", "edge-labels")
            .selectAll<SVGTextElement, EdgeGroupWithSpans>("text")
            .data(edgeGroups)
            .join("text")
            .style("display", edgeLabelSettings.showEdgeLabels ? "block" : "none")  // Control initial visibility
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
            .attr("opacity", d => {
                // Get opacity from the edge
                const sourceNode = combinedNodes.find(n => n.id === d.sourceId);
                const targetNode = combinedNodes.find(n => n.id === d.targetId);
                if (sourceNode && targetNode) {
                    const sourceVisible = getNodeOpacity(sourceNode) > 0.5;
                    const targetVisible = getNodeOpacity(targetNode) > 0.5;
                    if (sourceVisible && targetVisible) {
                        return 1;
                    }
                }
                return 0.05; // Very faint for filtered out labels
            })
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
            });

        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
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

        function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
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
            }
            // No constraints for sample nodes - allow dragging anywhere on x-axis
            
            // Apply sibling constraints with reduced effect to allow better positioning
            // Only for internal nodes (samples don't have siblings in the traditional sense)
            if (!event.subject.is_sample) {
                const siblings = getSiblings(event.subject, combinedNodes, combinedEdges);
                if (siblings.length > 0) {
                    const siblingAvgX = siblings.reduce((sum, s) => sum + (s.x ?? 0), 0) / siblings.length;
                    const maxDistance = GRAPH_CONSTANTS.MAX_SIBLING_DISTANCE * 1.5; // Increased tolerance
                    x = Math.max(siblingAvgX - maxDistance, 
                        Math.min(siblingAvgX + maxDistance, x));
                }
            }
            
            event.subject.fx = x;
            // Don't modify Y position during drag - this was causing the layer jumping
            event.subject.fy = event.subject.y ?? null;
        }

        function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
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
            }
            // No constraints for sample nodes - allow dragging anywhere on x-axis
            
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
            
            // Recalculate edge crossings after drag with a slight delay
            setTimeout(() => {
                if (onEdgeCrossingsChange && combinedNodes && combinedEdges) {
                    const crossings = calculateEdgeCrossings(combinedNodes, combinedEdges);
                    console.log('Edge crossings recalculated after drag:', crossings);
                    onEdgeCrossingsChange(crossings);
                }
            }, 300); // 300ms delay to allow simulation to settle after drag
        }

        const nodes = g.append("g")
            .selectAll<SVGCircleElement, GraphNode>("circle")
            .data(combinedNodes)
            .join("circle")
            .attr("r", d => {
                // Cluster nodes are larger based on their size
                if (d.is_cluster) {
                    const baseRadius = getNodeRadius(d, nodeSizes, combinedNodes, combinedEdges);
                    const sizeScale = Math.min(3, 1 + Math.log10(d.cluster_size || 1) * 0.5);
                    return baseRadius * sizeScale;
                }
                return getNodeRadius(d, nodeSizes, combinedNodes, combinedEdges);
            })
            .attr("fill", d => {
                if (d.is_cluster) {
                    // Sample clusters use cyan/blue color
                    if (d.is_sample_cluster) {
                        return `rgba(56, 189, 248, 0.7)`; // Cyan with transparency
                    }
                    // Regular cluster nodes have a distinct purple/violet color
                    return `rgba(147, 51, 234, 0.7)`; // Purple with transparency
                }
                if (d.is_sample) return `rgb(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]})`;
                if (d.is_combined) return `rgb(${colors.nodeCombined[0]}, ${colors.nodeCombined[1]}, ${colors.nodeCombined[2]})`;
                if (isRootNode(d, combinedNodes, combinedEdges)) return `rgb(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]})`;
                return `rgb(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]})`;
            })
            .attr("fill-opacity", d => getNodeOpacity(d))
            .attr("stroke", d => {
                if (d.is_cluster) {
                    if (d.is_sample_cluster) return `rgb(56, 189, 248)`; // Cyan stroke for sample clusters
                    return `rgb(147, 51, 234)`; // Purple stroke for regular clusters
                }
                if (isRootNode(d, combinedNodes, combinedEdges)) return `rgb(${colors.nodeSelected[0]}, ${colors.nodeSelected[1]}, ${colors.nodeSelected[2]})`;
                if (d.is_sample) return colors.background;
                return "none";
            })
            .attr("stroke-opacity", d => getNodeOpacity(d))
            .attr("stroke-width", d => {
                if (d.is_cluster) return 2.5; // Thick stroke for cluster nodes
                if (isRootNode(d, combinedNodes, combinedEdges)) return GRAPH_CONSTANTS.ROOT_NODE_STROKE_WIDTH;
                if (d.is_sample) return GRAPH_CONSTANTS.SAMPLE_NODE_STROKE_WIDTH;
                return 0;
            })
            .style("stroke-dasharray", d => d.is_cluster ? "5,3" : "none") // Dashed outline for clusters
            .style("cursor", "pointer")
            .call(d3.drag<SVGCircleElement, GraphNode>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended) as any)
            .on("click", (event, d) => {
                event.preventDefault();
                // Debug logging only in development
                if (process.env.NODE_ENV === 'development') {
                  console.log('D3 click event:', { button: event.button, which: event.which, type: event.type });
                }
                // Only fire click if the node wasn't dragged
                if (!(d as any).wasDragged) {
                onNodeClick?.(d);
                }
                // Reset drag state for next interaction
                (d as any).wasDragged = false;
            })
            .on("contextmenu", (event, d) => {
                event.preventDefault();
                // Debug logging only in development
                if (process.env.NODE_ENV === 'development') {
                  console.log('D3 contextmenu event:', { button: event.button, which: event.which, type: event.type });
                }
                onNodeRightClick?.(d);
            })
            .on("mouseover", (event, d) => {
                let tooltipContent = '';
                
                // Helper function to format node ID for display (tskit approach)
                const formatNodeId = (node: GraphNode): string => {
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
                
                if (d.is_cluster) {
                    if (d.is_sample_cluster) {
                        // Sample cluster tooltip
                        const nodeList = d.cluster_nodes && d.cluster_nodes.length <= 20 
                            ? `<br>Samples: ${d.cluster_nodes.sort((a, b) => a - b).join(', ')}`
                            : d.cluster_nodes && d.cluster_nodes.length > 20
                            ? `<br>Samples: ${d.cluster_nodes.slice(0, 20).sort((a, b) => a - b).join(', ')}... (+${d.cluster_nodes.length - 20} more)`
                            : '';
                        
                        tooltipContent = `<strong>Sample Cluster</strong> [${d.cluster_size} samples]<br>Time: ${d.time}${nodeList}<br><br><em>Samples with shared ancestry</em>`;
                    } else {
                        // Regular subtree cluster tooltip
                        const nodeList = d.cluster_nodes && d.cluster_nodes.length <= 20 
                            ? `<br>Nodes: ${d.cluster_nodes.sort((a, b) => a - b).join(', ')}`
                            : d.cluster_nodes && d.cluster_nodes.length > 20
                            ? `<br>Nodes: ${d.cluster_nodes.slice(0, 20).sort((a, b) => a - b).join(', ')}... (+${d.cluster_nodes.length - 20} more)`
                            : '';
                        
                        tooltipContent = `<strong>Cluster Node</strong> [${d.cluster_size} nodes]<br>Root: Node ${d.id}<br>Time: ${d.time}<br>Depth: ${d.cluster_depth} layers<br>Descendant samples: ${d.cluster_samples}${nodeList}<br><br><em>Click to view subARG rooted here</em>`;
                    }
                } else if (d.is_sample) {
                    const nodeIdDisplay = formatNodeId(d);
                    tooltipContent = `Sample node ${nodeIdDisplay}<br>Time: ${d.time}`;
                } else if (d.is_combined) {
                    const nodeIdDisplay = formatNodeId(d);
                    tooltipContent = `Combined node ${nodeIdDisplay}<br>Time: ${d.time}`;
                } else if (isRootNode(d, combinedNodes, combinedEdges)) {
                    const childEdges = combinedEdges
                        .filter(e => {
                            const source = typeof e.source === 'number' ? combinedNodes.find(n => n.id === e.source) : e.source as GraphNode;
                            return source?.id === d.id;
                        });
                    
                    // Get children, expanding clusters to show original nodes
                    const childrenInfo: Array<{id: number, isInCluster?: boolean, clusterId?: number}> = [];
                    
                    childEdges.forEach(e => {
                        const target = typeof e.target === 'number' ? combinedNodes.find(n => n.id === e.target) : e.target as GraphNode;
                        if (!target) return;
                        
                        // If child is a cluster, show the actual nodes that were clustered
                        if (target.is_cluster && target.cluster_nodes && target.cluster_nodes.length > 0) {
                            target.cluster_nodes.forEach(nodeId => {
                                if (!childrenInfo.some(c => c.id === nodeId)) {
                                    childrenInfo.push({
                                        id: nodeId,
                                        isInCluster: true,
                                        clusterId: target.id
                                    });
                                }
                            });
                        } else {
                            if (!childrenInfo.some(c => c.id === target.id)) {
                                childrenInfo.push({ id: target.id });
                            }
                        }
                    });
                    
                    childrenInfo.sort((a, b) => a.id - b.id);

                    const descendantSamples = getDescendantSamples(d, combinedNodes, combinedEdges)
                        .map(sample => sample.id)
                        .sort((a, b) => a - b);

                    const nodeIdDisplay = formatNodeId(d);
                    tooltipContent = `Root node ${nodeIdDisplay}<br>Time: ${d.time}`;
                    
                    if (childrenInfo.length > 0) {
                        // Group by cluster
                        const clusterMap = new Map<number, number[]>();
                        const regularChildren: number[] = [];
                        
                        childrenInfo.forEach(child => {
                            if (child.isInCluster && child.clusterId !== undefined) {
                                if (!clusterMap.has(child.clusterId)) {
                                    clusterMap.set(child.clusterId, []);
                                }
                                clusterMap.get(child.clusterId)!.push(child.id);
                            } else {
                                regularChildren.push(child.id);
                            }
                        });
                        
                        // Build children display string
                        const childParts: string[] = [];
                        if (regularChildren.length > 0) {
                            childParts.push(regularChildren.join(", "));
                        }
                        clusterMap.forEach((nodeIds, clusterId) => {
                            if (nodeIds.length <= 3) {
                                childParts.push(`${nodeIds.join(", ")} (in cluster ${clusterId})`);
                            } else {
                                childParts.push(`${nodeIds.slice(0, 3).join(", ")} +${nodeIds.length - 3} more (in cluster ${clusterId})`);
                            }
                        });
                        
                        tooltipContent += `<br>Children: ${childParts.join(", ")}`;
                    }
                    if (descendantSamples.length > 0) {
                        tooltipContent += `<br>Descendant samples: ${descendantSamples.join(", ")}`;
                    }
                } else {
                    const parents = [...new Set(combinedEdges
                        .filter(e => {
                            const target = typeof e.target === 'number' ? combinedNodes.find(n => n.id === e.target) : e.target as GraphNode;
                            return target?.id === d.id;
                        })
                        .map(e => {
                            const source = typeof e.source === 'number' ? combinedNodes.find(n => n.id === e.source) : e.source as GraphNode;
                            return source?.id;
                        })
                        .filter(id => id !== undefined))]
                        .sort((a, b) => a - b);
                    
                    const childEdges = combinedEdges
                        .filter(e => {
                            const source = typeof e.source === 'number' ? combinedNodes.find(n => n.id === e.source) : e.source as GraphNode;
                            return source?.id === d.id;
                        });
                    
                    // Get children, expanding clusters to show original nodes
                    const childrenInfo: Array<{id: number, isInCluster?: boolean, clusterId?: number}> = [];
                    
                    childEdges.forEach(e => {
                        const target = typeof e.target === 'number' ? combinedNodes.find(n => n.id === e.target) : e.target as GraphNode;
                        if (!target) return;
                        
                        // If child is a cluster, show the actual nodes that were clustered
                        if (target.is_cluster && target.cluster_nodes && target.cluster_nodes.length > 0) {
                            // Add each node in the cluster with metadata
                            target.cluster_nodes.forEach(nodeId => {
                                if (!childrenInfo.some(c => c.id === nodeId)) {
                                    childrenInfo.push({
                                        id: nodeId,
                                        isInCluster: true,
                                        clusterId: target.id
                                    });
                                }
                            });
                        } else {
                            // Regular child
                            if (!childrenInfo.some(c => c.id === target.id)) {
                                childrenInfo.push({ id: target.id });
                            }
                        }
                    });
                    
                    // Sort by ID
                    childrenInfo.sort((a, b) => a.id - b.id);

                    const nodeIdDisplay = formatNodeId(d);
                    tooltipContent = `Internal node ${nodeIdDisplay}<br>Time: ${d.time}`;
                    if (parents.length > 0) {
                        tooltipContent += `<br>Parents: ${parents.join(", ")}`;
                    }
                    if (childrenInfo.length > 0) {
                        // Group by cluster
                        const clusterMap = new Map<number, number[]>();
                        const regularChildren: number[] = [];
                        
                        childrenInfo.forEach(child => {
                            if (child.isInCluster && child.clusterId !== undefined) {
                                if (!clusterMap.has(child.clusterId)) {
                                    clusterMap.set(child.clusterId, []);
                                }
                                clusterMap.get(child.clusterId)!.push(child.id);
                            } else {
                                regularChildren.push(child.id);
                            }
                        });
                        
                        // Build children display string
                        const childParts: string[] = [];
                        if (regularChildren.length > 0) {
                            childParts.push(regularChildren.join(", "));
                        }
                        clusterMap.forEach((nodeIds, clusterId) => {
                            if (nodeIds.length <= 3) {
                                childParts.push(`${nodeIds.join(", ")} (in cluster ${clusterId})`);
                            } else {
                                childParts.push(`${nodeIds.slice(0, 3).join(", ")} +${nodeIds.length - 3} more (in cluster ${clusterId})`);
                            }
                        });
                        
                        tooltipContent += `<br>Children: ${childParts.join(", ")}`;
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

                // Calculate position with bounds checking
                const gap = 10;
                const margin = 8;
                const tooltipNode = tooltip.node() as HTMLElement;
                if (tooltipNode) {
                    tooltip.html(tooltipContent);
                    // Force a layout calculation to get actual dimensions
                    tooltip.style("visibility", "hidden");
                    tooltipNode.style.display = "block";
                    const tooltipRect = tooltipNode.getBoundingClientRect();
                    tooltipNode.style.display = "";
                    
                    const viewportW = window.innerWidth;
                    const viewportH = window.innerHeight;
                    const clientX = (event as MouseEvent).clientX;
                    const clientY = (event as MouseEvent).clientY;
                    
                    // Calculate preferred position (to the right and slightly below cursor)
                    let left = clientX + gap;
                    let top = clientY + gap;
                    
                    // Adjust if tooltip would go off right edge
                    if (left + tooltipRect.width > viewportW - margin) {
                        // Try left side
                        left = clientX - gap - tooltipRect.width;
                        // If still off screen, clamp to viewport
                        if (left < margin) {
                            left = viewportW - tooltipRect.width - margin;
                        }
                    }
                    
                    // Adjust if tooltip would go off bottom edge
                    if (top + tooltipRect.height > viewportH - margin) {
                        // Try above cursor
                        top = clientY - gap - tooltipRect.height;
                        // If still off screen, clamp to viewport
                        if (top < margin) {
                            top = viewportH - tooltipRect.height - margin;
                        }
                    }
                    
                    // Ensure minimum margins
                    left = Math.max(margin, Math.min(left, viewportW - tooltipRect.width - margin));
                    top = Math.max(margin, Math.min(top, viewportH - tooltipRect.height - margin));
                    
                    tooltip
                        .style("visibility", "visible")
                        .style("left", left + "px")
                        .style("top", top + "px");
                }
            })
            .on("mousemove", (event) => {
                const gap = 10;
                const margin = 8;
                const tooltipNode = tooltip.node() as HTMLElement;
                if (tooltipNode) {
                    const tooltipRect = tooltipNode.getBoundingClientRect();
                    const viewportW = window.innerWidth;
                    const viewportH = window.innerHeight;
                    const clientX = (event as MouseEvent).clientX;
                    const clientY = (event as MouseEvent).clientY;
                    
                    // Calculate preferred position
                    let left = clientX + gap;
                    let top = clientY + gap;
                    
                    // Adjust if tooltip would go off right edge
                    if (left + tooltipRect.width > viewportW - margin) {
                        left = clientX - gap - tooltipRect.width;
                        if (left < margin) {
                            left = viewportW - tooltipRect.width - margin;
                        }
                    }
                    
                    // Adjust if tooltip would go off bottom edge
                    if (top + tooltipRect.height > viewportH - margin) {
                        top = clientY - gap - tooltipRect.height;
                        if (top < margin) {
                            top = viewportH - tooltipRect.height - margin;
                        }
                    }
                    
                    // Ensure minimum margins
                    left = Math.max(margin, Math.min(left, viewportW - tooltipRect.width - margin));
                    top = Math.max(margin, Math.min(top, viewportH - tooltipRect.height - margin));
                    
                    tooltip
                        .style("left", left + "px")
                        .style("top", top + "px");
                }
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        const labels = g.append("g")
            .attr("class", "node-labels")
            .selectAll<SVGTextElement, GraphNode>("text")
            .data(combinedNodes)  // Create ALL labels, control visibility with CSS
            .join("text")
            .style("display", d => {
                // Control initial visibility based on settings
                if (d.is_sample && !nodeIdSettings.showSampleIds) return "none";
                if (isRootNode(d, combinedNodes, combinedEdges) && !nodeIdSettings.showRootIds) return "none";
                if (!d.is_sample && !isRootNode(d, combinedNodes, combinedEdges) && !nodeIdSettings.showInternalIds) return "none";
                return "block";
            })
            .text(d => {
                // Cluster nodes show size information
                if (d.is_cluster) {
                    return `[${d.cluster_size}]`;
                }
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
            .attr("opacity", d => getNodeOpacity(d))
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
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as GraphNode;
                    return source?.x ?? 0;
                })
                .attr("y1", d => {
                    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as GraphNode;
                    return source?.y ?? 0; // Always use node.y which reflects current position (including spacing updates)
                })
                .attr("x2", d => {
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as GraphNode;
                    return target?.x ?? 0;
                })
                .attr("y2", d => {
                    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as GraphNode;
                    return target?.y ?? 0; // Always use node.y which reflects current position (including spacing updates)
                });

            nodes
                .attr("cx", d => d.x ?? 0)
                .attr("cy", d => d.y ?? 0); // Always use node.y which reflects current position (including spacing updates)

            labels
                .attr("x", d => d.x ?? 0)
                .attr("y", d => d.y ?? 0) // Always use node.y which reflects current position (including spacing updates)
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
                            const midY = ((sourceNode.y ?? 0) + (targetNode.y ?? 0)) / 2;
                            
                            d3.select(this)
                                .attr("x", midX)
                                .attr("y", midY);
                        }
                    });
            }
        });

        // Add "end" event handler to calculate edge crossings after simulation settles
        const edgeCrossingsTimeoutRef = { current: undefined as NodeJS.Timeout | undefined };
        simulation.on("end", () => {
            // Clear any pending timeout
            if (edgeCrossingsTimeoutRef.current) {
                clearTimeout(edgeCrossingsTimeoutRef.current);
            }
            // Add a slight delay to ensure all positions are final
            edgeCrossingsTimeoutRef.current = setTimeout(() => {
                if (onEdgeCrossingsChange && combinedNodes && combinedEdges) {
                    const crossings = calculateEdgeCrossings(combinedNodes, combinedEdges);
                    // Debug logging only in development
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Edge crossings calculated:', crossings);
                    }
                    onEdgeCrossingsChange(crossings);
                }
                edgeCrossingsTimeoutRef.current = undefined;
            }, 100); // 100ms delay to ensure everything is settled
        });

        // Store current state for spacing updates
        visualStateRef.current = {
            nodes: combinedNodes,
            edges: combinedEdges,
            simulation,
            svg,
            zoom,
            userMovedNodes: visualStateRef.current.userMovedNodes, // Preserve existing user movements
            currentTransform: visualStateRef.current.currentTransform // Preserve zoom state
        };

        return () => {
            if (simulation) simulation.stop();
            if (tooltip) tooltip.remove();
            if (autoZoomTimeout) clearTimeout(autoZoomTimeout);
            if (edgeCrossingsTimeoutRef.current) clearTimeout(edgeCrossingsTimeoutRef.current);
        };
    // Only restart simulation for structural changes, not visual settings
    // nodeSizes, edgeThickness, edgeOpacity, nodeIdSettings, edgeLabelSettings, edgeMutationSettings are purely visual
    // clusteredData depends on combinedData, so only clusteredData is needed in dependencies
        // Update previous sample order after applying layout
        prevSampleOrderRef.current = sampleOrder;
    }, [clusteredData, width, height, onNodeClick, onNodeRightClick, onEdgeClick, focalNode, ref, sampleOrder, clusteringEnabled, clusteringMinTreeSize, clusteringRequireDensity, clusteringDensityIntensity, clusteringRequireTemporalCompactness, clusteringTemporalIntensity, clusteringMaxSampleClusterSize]);

    // Effect to pause/resume simulation based on simulationPaused prop
    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current) return;
        if (!visualStateRef.current.simulation) return;

        const simulation = visualStateRef.current.simulation;
        const nodes = simulation.nodes() as GraphNode[];
        
        if (simulationPaused) {
            // Pin all NON-SAMPLE nodes in their current positions
            // Sample nodes are already pinned and should never be unpinned
            nodes.forEach(node => {
                // Skip sample nodes - they should always maintain their fx/fy
                if (node.is_sample) return;
                
                if (node.x !== undefined && node.y !== undefined) {
                    // Only pin if not already manually pinned
                    if (node.fx === undefined || node.fx === null) {
                        node.fx = node.x;
                        node.__autoPinnedX = true; // Mark as auto-pinned
                    }
                    if (node.fy === undefined || node.fy === null) {
                        node.fy = node.y;
                        node.__autoPinnedY = true; // Mark as auto-pinned
                    }
                }
            });
            
            // Set alpha to 0 to freeze the simulation in place
            // This is better than stop() because the tick listener stays active
            // and will continue to render the pinned positions
            simulation.alpha(0).alphaTarget(0);
            
            console.log('Force simulation paused - non-sample nodes pinned at current positions');
        } else {
            // Unpin nodes that were auto-pinned (not manually dragged or samples)
            // CRITICAL: Only unpin x-positions (fx), keep y-positions (fy) pinned to maintain temporal layers
            nodes.forEach(node => {
                // Never unpin sample nodes
                if (node.is_sample) return;
                
                if ((node as any).__autoPinnedX) {
                    node.fx = null;
                    delete (node as any).__autoPinnedX;
                }
                // DO NOT unpin fy - nodes should maintain their y positions based on time/rank
                // Keep fy pinned even if it was auto-pinned, to preserve temporal layer structure
                if ((node as any).__autoPinnedY) {
                    // Keep fy pinned - don't unpin y positions
                    delete (node as any).__autoPinnedY;
                }
            });
            
            // Resume the simulation with a gentle restart
            simulation.alpha(0.1).alphaTarget(0).restart();
            console.log('Force simulation resumed - non-sample nodes unpinned');
        }
    }, [simulationPaused, ref]);

    // Effect to unpin all nodes when unpinTrigger changes
    useEffect(() => {
        if (!visualStateRef.current.simulation || unpinTrigger === 0) return;

        const simulation = visualStateRef.current.simulation;
        const nodes = simulation.nodes() as GraphNode[];
        
        // Skip Y recalculation for dagre - positions are rank-based, not time-based
        if (sampleOrder !== 'dagre') {
            // Recalculate y positions based on time to ensure proper temporal layering
            const targetHeight = (visualStateRef.current.svg?.node()?.getBoundingClientRect().height ?? 0) * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);
            const uniqueTimes = Array.from(new Set(nodes.map(n => n.time))).sort((a, b) => a - b);
            
            nodes.forEach(node => {
                // Skip sample nodes - they should always keep their fx/fy
                if (node.is_sample) return;
                
                // Recalculate y position based on time to ensure proper temporal layer
                const y = calculateYPosition(node.time, uniqueTimes, targetHeight, temporalSpacingMode, temporalSpacing);
                node.y = y;
                node.fy = y; // Pin y position to maintain temporal layer
                node.vy = 0; // Reset velocity
            });
        }
        
        // Unpin all NON-SAMPLE nodes (both manually and auto-pinned)
        // Sample nodes should NEVER be unpinned - they maintain their spacing
        // CRITICAL: Only unpin x-positions (fx), keep y-positions (fy) pinned to maintain temporal layers
        nodes.forEach(node => {
            // Skip sample nodes - they should always keep their fx/fy
            if (node.is_sample) return;
            
            // Unpin x position to allow horizontal movement
            node.fx = null;
            
            // For dagre mode, preserve current y position by keeping fy pinned
            if (sampleOrder === 'dagre' && node.y !== undefined && (node.fy === null || node.fy === undefined)) {
                node.fy = node.y;
            }
            
            // Clean up any pinning markers
            delete (node as any).__autoPinnedX;
            delete (node as any).__autoPinnedY;
        });
        
        // Clear the userMovedNodes tracking (but only for non-samples)
        const userMovedNodes = visualStateRef.current.userMovedNodes;
        const samplesToKeep = new Map<number, any>();
        userMovedNodes.forEach((value, key) => {
            const node = nodes.find(n => n.id === key);
            if (node?.is_sample) {
                samplesToKeep.set(key, value);
            }
        });
        visualStateRef.current.userMovedNodes = samplesToKeep;
        
        // Give the simulation a gentle nudge to continue from current positions
        simulation.alpha(0.1).alphaTarget(0).restart();
        
        console.log('All non-sample nodes unpinned - simulation continues from current positions');
    }, [unpinTrigger, sampleOrder, temporalSpacingMode, temporalSpacing, height]);

    // Effect to update opacities when temporal, genomic, or tree range changes (without restarting simulation)
    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current) return;
        if (!visualStateRef.current.nodes || visualStateRef.current.nodes.length === 0) return;

        const svg = d3.select(ref.current);
        const { nodes: combinedNodes, edges: combinedEdges } = visualStateRef.current;

        // Helper function to check if an edge overlaps with genomic range
        const edgeOverlapsGenomicRange = (edge: GraphEdge): boolean => {
            if (!genomicRange || edge.left === undefined || edge.right === undefined) return true;
            const [genomicLeft, genomicRight] = genomicRange;
            return edge.left < genomicRight && edge.right > genomicLeft;
        };

        // Helper function to check if a node has any edges in the genomic range
        const nodeHasEdgesInGenomicRange = (node: GraphNode): boolean => {
            if (!genomicRange) return true;
            const nodeId = node.id;
            return combinedEdges.some(edge => {
                const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
                const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
                return (sourceId === nodeId || targetId === nodeId) && edgeOverlapsGenomicRange(edge);
            });
        };

        // Helper function to check if an edge overlaps with any selected tree intervals
        const edgeOverlapsTreeRange = (edge: GraphEdge): boolean => {
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
        const nodeHasEdgesInTreeRange = (node: GraphNode): boolean => {
            if (!treeRange || !treeIntervals) return true;
            const nodeId = node.id;
            return combinedEdges.some(edge => {
                const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
                const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
                return (sourceId === nodeId || targetId === nodeId) && edgeOverlapsTreeRange(edge);
            });
        };

        // Helper function to calculate opacity based on temporal range
        const getTemporalNodeOpacity = (node: GraphNode): number => {
            if (!temporalRange) return 1;
            const [minTime, maxTime] = temporalRange;
            if (node.time >= minTime && node.time <= maxTime) {
                return 1;
            }
            return Math.max(0, Math.min(0.99, temporalDimOpacity));
        };

        // Helper function to calculate opacity based on genomic range
        const getGenomicNodeOpacity = (node: GraphNode): number => {
            if (!genomicRange) return 1;
            if (nodeHasEdgesInGenomicRange(node)) {
                return 1;
            }
            return Math.max(0, Math.min(0.99, genomicDimOpacity));
        };

        // Helper function to calculate opacity based on tree range
        const getTreeNodeOpacity = (node: GraphNode): number => {
            if (!treeRange || !treeIntervals) return 1;
            if (nodeHasEdgesInTreeRange(node)) {
                return 1;
            }
            return Math.max(0, Math.min(0.99, treeDimOpacity));
        };

        // Combined node opacity (temporal, genomic, and tree)
        const getNodeOpacity = (node: GraphNode): number => {
            const temporal = getTemporalNodeOpacity(node);
            const genomic = getGenomicNodeOpacity(node);
            const tree = getTreeNodeOpacity(node);
            return Math.min(temporal, genomic, tree);
        };

        // Helper function to calculate edge opacity based on temporal range
        const getTemporalEdgeOpacity = (edge: GraphEdge): number => {
            if (!temporalRange) return edgeOpacity / 100;
            const sourceNode = typeof edge.source === 'number' ? 
                combinedNodes.find(n => n.id === edge.source) : edge.source as GraphNode;
            const targetNode = typeof edge.target === 'number' ? 
                combinedNodes.find(n => n.id === edge.target) : edge.target as GraphNode;
            
            if (sourceNode && targetNode) {
                const sourceVisible = getTemporalNodeOpacity(sourceNode) > 0.5;
                const targetVisible = getTemporalNodeOpacity(targetNode) > 0.5;
                if (sourceVisible && targetVisible) {
                    return edgeOpacity / 100;
                }
            }
            return Math.max(0, Math.min(0.99, temporalDimOpacity)) * (edgeOpacity / 100);
        };

        // Helper function to calculate edge opacity based on genomic range
        const getGenomicEdgeOpacity = (edge: GraphEdge): number => {
            if (!genomicRange) return edgeOpacity / 100;
            if (edgeOverlapsGenomicRange(edge)) {
                return edgeOpacity / 100;
            }
            return Math.max(0, Math.min(0.99, genomicDimOpacity)) * (edgeOpacity / 100);
        };

        // Helper function to calculate edge opacity based on tree range
        const getTreeEdgeOpacity = (edge: GraphEdge): number => {
            if (!treeRange || !treeIntervals) return edgeOpacity / 100;
            if (edgeOverlapsTreeRange(edge)) {
                return edgeOpacity / 100;
            }
            return Math.max(0, Math.min(0.99, treeDimOpacity)) * (edgeOpacity / 100);
        };

        // Combined edge opacity (temporal, genomic, and tree)
        const getEdgeOpacity = (edge: GraphEdge): number => {
            const temporal = getTemporalEdgeOpacity(edge);
            const genomic = getGenomicEdgeOpacity(edge);
            const tree = getTreeEdgeOpacity(edge);
            return Math.min(temporal, genomic, tree);
        };

        // Update node opacities
        svg.selectAll<SVGCircleElement, GraphNode>("circle")
            .attr("fill-opacity", d => getNodeOpacity(d))
            .attr("stroke-opacity", d => getNodeOpacity(d));

        // Update edge opacities
        svg.selectAll<SVGLineElement, GraphEdge>("line")
            .attr("stroke-opacity", d => getEdgeOpacity(d));

        // Update node label opacities
        svg.selectAll<SVGTextElement, GraphNode>(".node-labels text")
            .attr("opacity", d => getNodeOpacity(d));

        // Update mutation marker opacities
        svg.selectAll(".mutation-markers text")
            .attr("opacity", (d: any) => getEdgeOpacity(d));

        // Update edge label opacities
        svg.selectAll<SVGTextElement, any>("text")
            .filter(function(): boolean {
                // Filter for edge labels (have sourceId and targetId properties)
                const datum = d3.select(this).datum();
                return !!(datum && typeof datum === 'object' && 'sourceId' in datum && 'targetId' in datum);
            })
            .attr("opacity", (d: any) => {
                const sourceNode = combinedNodes.find((n: GraphNode) => n.id === d.sourceId);
                const targetNode = combinedNodes.find((n: GraphNode) => n.id === d.targetId);
                if (sourceNode && targetNode) {
                    const sourceVisible = getNodeOpacity(sourceNode) > 0.5;
                    const targetVisible = getNodeOpacity(targetNode) > 0.5;
                    if (sourceVisible && targetVisible) {
                        return 1;
                    }
                }
                return 0.05;
            });

    }, [temporalRange, temporalDimOpacity, genomicRange, genomicDimOpacity, treeRange, treeIntervals, treeDimOpacity, ref, edgeOpacity]);

    // Effect to update node sizes without restarting simulation
    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current) return;
        if (!visualStateRef.current.nodes || visualStateRef.current.nodes.length === 0) return;

        const svg = d3.select(ref.current);
        const { nodes: combinedNodes, edges: combinedEdges } = visualStateRef.current;

        // Update node radii
        svg.selectAll<SVGCircleElement, GraphNode>("circle")
            .attr("r", d => getNodeRadius(d, nodeSizes, combinedNodes, combinedEdges));

        // Update label font sizes based on node sizes
        svg.selectAll<SVGTextElement, GraphNode>("text")
            .filter(function() {
                const parent = d3.select(this.parentNode as any);
                return parent.selectAll("circle").size() > 0;
            })
            .attr("font-size", (d: GraphNode) => {
                const nodeRadius = getNodeRadius(d, nodeSizes, combinedNodes, combinedEdges);
                if (d.is_sample) {
                    return `${Math.max(8, nodeRadius * 1.2)}px`;
                } else {
                    return `${Math.max(12, nodeRadius * 1.8)}px`;
                }
            });

    }, [nodeSizes, ref]);

    // Effect to update edge visual properties without restarting simulation
    useEffect(() => {
        // Debug logging only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Edge opacity effect triggered:', { edgeThickness, edgeOpacity, hasTemporalRange: !!temporalRange, hasGenomicRange: !!genomicRange });
        }
        if (!ref || typeof ref === 'function' || !ref.current) {
            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
              console.log('Edge opacity effect: no ref');
            }
            return;
        }
        if (!visualStateRef.current.nodes || visualStateRef.current.nodes.length === 0) {
            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
              console.log('Edge opacity effect: no nodes in visualStateRef');
            }
            return;
        }

        const svg = d3.select(ref.current);
        const { nodes: combinedNodes, edges: combinedEdges } = visualStateRef.current;

        // Helper functions for opacity calculation
        const edgeOverlapsGenomicRange = (edge: GraphEdge): boolean => {
            if (!genomicRange || edge.left === undefined || edge.right === undefined) return true;
            const [genomicLeft, genomicRight] = genomicRange;
            return edge.left < genomicRight && edge.right > genomicLeft;
        };

        const edgeOverlapsTreeRange = (edge: GraphEdge): boolean => {
            if (!treeRange || !treeIntervals || edge.left === undefined || edge.right === undefined) return true;
            const [treeStartIdx, treeEndIdx] = treeRange;
            const selectedIntervals = treeIntervals.filter(interval => 
                interval.index >= treeStartIdx && interval.index <= treeEndIdx
            );
            return selectedIntervals.some(interval => {
                return edge.left < interval.right && edge.right > interval.left;
            });
        };

        const getTemporalEdgeOpacity = (edge: GraphEdge): number => {
            if (!temporalRange) return edgeOpacity / 100;
            const sourceNode = typeof edge.source === 'number' ? 
                combinedNodes.find(n => n.id === edge.source) : edge.source as GraphNode;
            const targetNode = typeof edge.target === 'number' ? 
                combinedNodes.find(n => n.id === edge.target) : edge.target as GraphNode;
            
            if (sourceNode && targetNode) {
                const [minTime, maxTime] = temporalRange;
                const sourceVisible = sourceNode.time >= minTime && sourceNode.time <= maxTime;
                const targetVisible = targetNode.time >= minTime && targetNode.time <= maxTime;
                if (sourceVisible && targetVisible) {
                    return edgeOpacity / 100;
                }
            }
            return Math.max(0, Math.min(0.99, temporalDimOpacity)) * (edgeOpacity / 100);
        };

        const getGenomicEdgeOpacity = (edge: GraphEdge): number => {
            if (!genomicRange) return edgeOpacity / 100;
            if (edgeOverlapsGenomicRange(edge)) {
                return edgeOpacity / 100;
            }
            return Math.max(0, Math.min(0.99, genomicDimOpacity)) * (edgeOpacity / 100);
        };

        const getTreeEdgeOpacity = (edge: GraphEdge): number => {
            if (!treeRange || !treeIntervals) return edgeOpacity / 100;
            if (edgeOverlapsTreeRange(edge)) {
                return edgeOpacity / 100;
            }
            return Math.max(0, Math.min(0.99, treeDimOpacity)) * (edgeOpacity / 100);
        };

        const edges = svg.selectAll<SVGLineElement, GraphEdge>("line");
        console.log('Edge opacity effect: found', edges.size(), 'edges');

        // Update edge thickness
        edges.attr("stroke-width", edgeThickness);

        // Update edge opacity (respecting temporal, genomic, and tree filters if active)
        let visibleCount = 0;
        let hiddenCount = 0;
        edges.attr("stroke-opacity", (d: GraphEdge) => {
                const temporal = getTemporalEdgeOpacity(d);
                const genomic = getGenomicEdgeOpacity(d);
                const tree = getTreeEdgeOpacity(d);
                const finalOpacity = Math.min(temporal, genomic, tree);
                
                if (finalOpacity > 0.5) {
                    visibleCount++;
                } else {
                    hiddenCount++;
                }
                return finalOpacity;
            });
        
        console.log('Edge opacity effect: updated', edges.size(), 'edges (visible:', visibleCount, 'hidden:', hiddenCount, ')');
        
    }, [edgeThickness, edgeOpacity, temporalRange, temporalDimOpacity, genomicRange, genomicDimOpacity, treeRange, treeIntervals, treeDimOpacity, ref]);

    // Effect to update node ID visibility without restarting simulation
    useEffect(() => {
        console.log('Node ID visibility effect triggered:', nodeIdSettings);
        if (!ref || typeof ref === 'function' || !ref.current) {
            console.log('Node ID effect: no ref');
            return;
        }
        if (!visualStateRef.current.nodes || visualStateRef.current.nodes.length === 0) {
            console.log('Node ID effect: no nodes in visualStateRef');
            return;
        }

        const svg = d3.select(ref.current);
        const { nodes: combinedNodes, edges: combinedEdges } = visualStateRef.current;

        // Get all node labels from the node-labels group
        const nodeLabels = svg.selectAll<SVGTextElement, GraphNode>(".node-labels text");

        console.log('Node ID effect: found', nodeLabels.size(), 'node labels');

        // Update visibility based on settings
        let updateCount = 0;
        nodeLabels.style("display", (d: GraphNode) => {
            updateCount++;
            if (d.is_sample && !nodeIdSettings.showSampleIds) return "none";
            if (isRootNode(d, combinedNodes, combinedEdges) && !nodeIdSettings.showRootIds) return "none";
            if (!d.is_sample && !isRootNode(d, combinedNodes, combinedEdges) && !nodeIdSettings.showInternalIds) return "none";
            return "block";
        });
        
        console.log('Node ID effect: updated', updateCount, 'labels');

    }, [nodeIdSettings, ref]);

    // Effect to update edge labels without restarting simulation
    useEffect(() => {
        console.log('Edge label effect triggered:', edgeLabelSettings);
        if (!ref || typeof ref === 'function' || !ref.current) {
            console.log('Edge label effect: no ref');
            return;
        }

        const svg = d3.select(ref.current);

        // Update edge label visibility and font size
        const edgeLabels = svg.selectAll<SVGTextElement, any>(".edge-labels text");
        
        console.log('Edge label effect: found', edgeLabels.size(), 'edge labels');
        
        edgeLabels
            .style("display", edgeLabelSettings.showEdgeLabels ? "block" : "none")
            .attr("font-size", `${edgeLabelSettings.labelFontSize}px`);

        console.log('Edge label effect: updated to', edgeLabelSettings.showEdgeLabels ? 'visible' : 'hidden');

    }, [edgeLabelSettings, ref]);

    // Effect to update mutation markers without restarting simulation
    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current) return;

        const svg = d3.select(ref.current);

        // Update mutation marker visibility and size
        svg.selectAll(".mutation-markers text")
            .style("display", edgeMutationSettings?.showMutationMarkers ? "block" : "none")
            .attr("font-size", `${edgeMutationSettings?.markerSize || 14}px`);

    }, [edgeMutationSettings, ref]);

    return (
        <div className="w-full h-full">
            <svg ref={ref} className="w-full h-full" />
        </div>
    );
}); 