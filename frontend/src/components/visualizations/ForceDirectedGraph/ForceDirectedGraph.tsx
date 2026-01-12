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
import {
  getNodeOpacity,
  getEdgeOpacity,
  OpacityCalculationParams
} from '../../../utils/opacityCalculations';
import { isRootNode } from '../../../utils/graphTraversal';
import { generatePopulationColors, darkenColor } from '../../../utils/colorUtils';
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
    colorByPopulation = false,
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
    clusteringMaxSampleClusterSize = 25,
    combineInternalNodes = false,
    combineSampleNodes = true
}, ref: ForwardedRef<SVGSVGElement>) => {
    const { colors, theme } = useColorTheme();

    // Determine if theme is dark - tskit is dark, liquid and grayscale are light
    // For custom themes, calculate based on background luminance
    const isDarkTheme = useMemo(() => {
        if (theme === 'tskit') return true;
        if (theme === 'liquid' || theme === 'grayscale') return false;
        
        // For custom themes, calculate luminance of background
        const bg = colors.background;
        if (bg.startsWith('#')) {
            const hex = bg.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance <= 0.5;
        }
        return false; // Default to light if can't determine
    }, [theme, colors.background]);
    
    // Generate population colors if enabled
    const populationColors = useMemo(() => {
        if (!colorByPopulation || !data?.metadata?.has_populations || !data?.metadata?.populations) {
            return null;
        }
        return generatePopulationColors(data.metadata.populations, isDarkTheme);
    }, [colorByPopulation, data?.metadata?.has_populations, data?.metadata?.populations, isDarkTheme]);
    
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

        let timeoutId: NodeJS.Timeout | undefined;
        if (clusteringChanged) {
            isClusteringChanging.current = true;
            // Reset flag after main rendering effect has had time to complete
            timeoutId = setTimeout(() => { isClusteringChanging.current = false; }, 100);
        }

        prevClusteringRef.current = {
            enabled: clusteringEnabled,
            minTreeSize: clusteringMinTreeSize,
            requireDensity: clusteringRequireDensity,
            densityIntensity: clusteringDensityIntensity,
            requireTemporalCompactness: clusteringRequireTemporalCompactness,
            temporalIntensity: clusteringTemporalIntensity
        };

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
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

    // Refs for tracking timeouts to ensure proper cleanup
    const dragCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dragCrossingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoZoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const edgeCrossingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Ref for tooltip element to ensure proper cleanup
    const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

    // Refs for visual settings to avoid triggering effect re-runs
    // These are read inside the effect but shouldn't cause re-renders
    const colorsRef = useRef(colors);
    const nodeSizesRef = useRef(nodeSizes);
    const edgeThicknessRef = useRef(edgeThickness);
    const edgeOpacityRef = useRef(edgeOpacity);
    const edgeLabelSettingsRef = useRef(edgeLabelSettings);
    const edgeMutationSettingsRef = useRef(edgeMutationSettings);
    const temporalSpacingModeRef = useRef(temporalSpacingMode);
    const temporalSpacingRef = useRef(temporalSpacing);
    const sampleSpacingRef = useRef(sampleSpacing);

    // Keep refs in sync with props
    useEffect(() => {
        colorsRef.current = colors;
        nodeSizesRef.current = nodeSizes;
        edgeThicknessRef.current = edgeThickness;
        edgeOpacityRef.current = edgeOpacity;
        edgeLabelSettingsRef.current = edgeLabelSettings;
        edgeMutationSettingsRef.current = edgeMutationSettings;
        temporalSpacingModeRef.current = temporalSpacingMode;
        temporalSpacingRef.current = temporalSpacing;
        sampleSpacingRef.current = sampleSpacing;
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
        const settleTimeout = setTimeout(() => {
            sim.alphaTarget(0);
        }, 2000);

        return () => {
            clearTimeout(settleTimeout);
        };
    }, [tuning, sampleOrder, data]); // Add data dependency to trigger on initial load

    // Full simulation reset while retaining sample order and positions
    useEffect(() => {
        if (resetTrigger === 0) return;
        // Skip reset if clustering is currently changing - let main rendering effect handle it
        if (isClusteringChanging.current) {
            return;
        }
        const sim = visualStateRef.current.simulation as d3.Simulation<GraphNode, GraphEdge> | null;
        const nodes = visualStateRef.current.nodes as GraphNode[];
        const svg = visualStateRef.current.svg;
        if (!sim || !nodes || !svg) return;

        // For dagre mode, skip manual reset - dagre positions are handled in main rendering effect
        if (sampleOrder === 'dagre') {
            return;
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
        const resetSettleTimeout = setTimeout(() => sim.alphaTarget(0), 2000); // Increased from 200ms to allow more settling time

        return () => {
            clearTimeout(resetSettleTimeout);
        };
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
        const temporalSettleTimeout = setTimeout(() => sim.alphaTarget(0), 1500); // Increased from 120ms to allow more settling time

        return () => {
            clearTimeout(temporalSettleTimeout);
        };
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
        
        const { nodes: combinedNodes, edges: combinedEdges } = combineGenealogyIdenticalNodes(
            stableData.nodes, 
            stableData.edges,
            combineInternalNodes,
            combineSampleNodes
        );
        return { nodes: combinedNodes, edges: combinedEdges };
    }, [stableData, combineInternalNodes, combineSampleNodes]);

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

        // Read visual settings from refs (not dependencies) to avoid re-renders
        const colors = colorsRef.current;
        const nodeSizes = nodeSizesRef.current;
        const edgeThickness = edgeThicknessRef.current;
        const edgeOpacity = edgeOpacityRef.current;
        const edgeLabelSettings = edgeLabelSettingsRef.current;
        const edgeMutationSettings = edgeMutationSettingsRef.current;
        const temporalSpacingMode = temporalSpacingModeRef.current;
        const temporalSpacing = temporalSpacingRef.current;
        const sampleSpacing = sampleSpacingRef.current;

        const containerRect = ref.current.getBoundingClientRect();
        const actualWidth = width || containerRect.width || 800;
        const actualHeight = height || containerRect.height || 600;
        const availableHeight = actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO);

        const { nodes: combinedNodes, edges: combinedEdges } = clusteredData;
        const originalNodes = (clusteredData as any).originalNodes as GraphNode[] | undefined;

        // Create nodeMap for O(1) lookups (instead of O(n) .find() calls)
        const nodeMap = new Map<number, GraphNode>(combinedNodes.map(n => [n.id, n]));
        const stableNodeMap = new Map<number, GraphNode>(stableData.nodes.map(n => [n.id, n]));

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
        
        const { timeSpacing: _timeSpacing, uniqueTimes: setupUniqueTimes } = setupInitialNodePositions(combinedNodes, combinedEdges, actualWidth, actualHeight, sampleOrder, nodeSizes, temporalSpacingMode, temporalSpacing, sampleSpacing, originalNodes);

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

        // Clear any existing timeouts before setting new ones
        if (autoZoomTimeoutRef.current) clearTimeout(autoZoomTimeoutRef.current);
        if (dragCleanupTimeoutRef.current) clearTimeout(dragCleanupTimeoutRef.current);
        if (dragCrossingsTimeoutRef.current) clearTimeout(dragCrossingsTimeoutRef.current);
        if (edgeCrossingsTimeoutRef.current) clearTimeout(edgeCrossingsTimeoutRef.current);

        // Only auto-zoom when there's a structural change, not for visual parameter adjustments
        // Use a simple flag check - no timeouts to prevent race conditions
        if (shouldAutoZoomRef.current) {
            // Reset flag immediately to prevent multiple calls
            shouldAutoZoomRef.current = false;

            // Schedule zoom after a brief delay to let positions settle
            // Using requestAnimationFrame for smoother timing
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (focalNode) {
                        focusOnNode(focalNode, combinedNodes, combinedEdges, false);
                    } else {
                        focusOnNode(null, combinedNodes, combinedEdges, true);
                    }
                });
            });
        }

        // Clean up previous tooltip if it exists
        if (tooltipRef.current) {
            tooltipRef.current.remove();
            tooltipRef.current = null;
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

        // Store tooltip in ref for cleanup
        tooltipRef.current = tooltip as any;

        // Create simulation with proper typing
        const simulation: Simulation = d3.forceSimulation<GraphNode>(combinedNodes)
            .alpha(sampleOrder === 'dagre' ? 0 : GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_START)
            .alphaDecay(sampleOrder === 'dagre' ? 1 : GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_DECAY)
            .velocityDecay(sampleOrder === 'dagre' ? 1 : 0.4) // Reduced from 0.7 to allow more movement
            .force("link", sampleOrder === 'dagre' ? null : d3.forceLink<GraphNode, GraphEdge>(combinedEdges)
                .id(d => d.id)
                .distance(d => {
                    const source = typeof d.source === 'number' ? nodeMap.get(d.source) : d.source as GraphNode;
                    const target = typeof d.target === 'number' ? nodeMap.get(d.target) : d.target as GraphNode;
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
                    const source = typeof d.source === 'number' ? nodeMap.get(d.source) : d.source as GraphNode;
                    const target = typeof d.target === 'number' ? nodeMap.get(d.target) : d.target as GraphNode;
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

        // Create opacity calculation parameters
        const opacityParams: OpacityCalculationParams = {
            temporalRange,
            temporalDimOpacity,
            genomicRange,
            genomicDimOpacity,
            treeRange,
            treeIntervals,
            treeDimOpacity,
            nodes: combinedNodes,
            edges: combinedEdges
        };


        const edges = g.append("g")
            .selectAll<SVGLineElement, GraphEdge>("line")
            .data(combinedEdges)
            .join("line")
            .attr("stroke", d => {
                const { isSampleClusterEdge } = getEdgeClusterInfo(d, combinedNodes);
                if (isSampleClusterEdge) {
                    return `rgb(${colors.edgeClusterSample[0]}, ${colors.edgeClusterSample[1]}, ${colors.edgeClusterSample[2]})`;
                } else {
                    return `rgb(${colors.edgeDefault[0]}, ${colors.edgeDefault[1]}, ${colors.edgeDefault[2]})`;
                }
            })
            .attr("stroke-opacity", d => getEdgeOpacity(d, combinedNodes, opacityParams) * (edgeOpacity / 100))
            .attr("stroke-width", d => {
                const { isSampleClusterEdge, clusterSize } = getEdgeClusterInfo(d, combinedNodes);
                if (isSampleClusterEdge) {
                    // Thicker edges for sample cluster connections (scale by cluster size)
                    return edgeThickness * Math.min(3, 1 + Math.log10(clusterSize) * 0.8);
                }
                return edgeThickness;
            })
            .attr("x1", d => {
                const source = typeof d.source === 'number' ? nodeMap.get(d.source as number) : d.source as GraphNode;
                return source?.x ?? 0;
            })
            .attr("y1", d => {
                const source = typeof d.source === 'number' ? nodeMap.get(d.source as number) : d.source as GraphNode;
                return sampleOrder === 'dagre' ? (source?.y ?? 0) : 
                    calculateYPosition(source?.time ?? 0, setupUniqueTimes, availableHeight, temporalSpacingMode, temporalSpacing);
            })
            .attr("x2", d => {
                const target = typeof d.target === 'number' ? nodeMap.get(d.target as number) : d.target as GraphNode;
                return target?.x ?? 0;
            })
            .attr("y2", d => {
                const target = typeof d.target === 'number' ? nodeMap.get(d.target as number) : d.target as GraphNode;
                return sampleOrder === 'dagre' ? (target?.y ?? 0) : 
                    calculateYPosition(target?.time ?? 0, setupUniqueTimes, actualHeight * (1 - GRAPH_CONSTANTS.LAYOUT.BOTTOM_MARGIN_RATIO), temporalSpacingMode, temporalSpacing);
            })
            .on("click", (_event, d) => onEdgeClick?.(d));

        // Create mutation markers with detailed information
        interface MutationMarkerData {
            edge: GraphEdge;
            mutation: any; // MutationDetail from types
            sourceNode: GraphNode | undefined;
            targetNode: GraphNode | undefined;
        }
        
        let mutationMarkers: d3.Selection<SVGTextElement, MutationMarkerData, SVGGElement, unknown> | null = null;
        
        if (edgeMutationSettings?.showMutationMarkers) {
            // Flatten all mutations from all edges into individual markers
            const mutationMarkerData: MutationMarkerData[] = [];
            
            for (const edge of combinedEdges) {
                if (edge.mutations && edge.mutations.length > 0) {
                    const sourceNode = typeof edge.source === 'number' 
                        ? nodeMap.get(edge.source as number)
                        : edge.source as GraphNode;
                    const targetNode = typeof edge.target === 'number' 
                        ? nodeMap.get(edge.target as number)
                        : edge.target as GraphNode;
                    
                    for (const mutation of edge.mutations) {
                        mutationMarkerData.push({
                            edge,
                            mutation,
                            sourceNode,
                            targetNode
                        });
                    }
                }
            }
            
            
            // Create a group for mutation markers
            const markerGroup = g.append("g").attr("class", "mutation-markers");
            
            mutationMarkers = markerGroup
                .selectAll<SVGTextElement, MutationMarkerData>("text")
                .data(mutationMarkerData)
                .join("text")
                .text("×") // Use multiplication sign for a clean "x" appearance
                .attr("font-size", `${edgeMutationSettings.markerSize || 40}px`)
                .attr("fill", `rgb(${colors.mutationMarker[0]}, ${colors.mutationMarker[1]}, ${colors.mutationMarker[2]})`)
                .attr("opacity", d => getEdgeOpacity(d.edge, combinedNodes, opacityParams) * (edgeOpacity / 100))
                .attr("stroke", colors.background) // Background stroke for visibility
                .attr("stroke-width", "2px") // Thicker stroke for better contrast
                .attr("paint-order", "stroke fill")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("font-weight", "bold")
                .attr("font-family", "monospace, Arial, sans-serif") // Monospace for better symbol rendering
                .style("cursor", "pointer")
                .style("pointer-events", "all")
                .style("user-select", "none")
                // Set initial positions for mutation markers
                // Position along the edge based on mutation time ratio
                .attr("x", d => {
                    if (d.sourceNode && d.targetNode && 
                        d.sourceNode.x !== undefined && d.targetNode.x !== undefined) {
                        // If mutation has time info, interpolate along edge
                        if (d.mutation.time !== null && d.mutation.time !== undefined) {
                            const sourceTime = d.sourceNode.time ?? 0;
                            const targetTime = d.targetNode.time ?? 0;
                            const mutationTime = d.mutation.time;
                            const timeRange = sourceTime - targetTime;
                            
                            if (timeRange > 0 && mutationTime >= targetTime && mutationTime <= sourceTime) {
                                const timeRatio = (mutationTime - targetTime) / timeRange;
                                return d.targetNode.x + timeRatio * (d.sourceNode.x - d.targetNode.x);
                            }
                        }
                        // Default to midpoint
                        return (d.sourceNode.x + d.targetNode.x) / 2;
                    }
                    return 0;
                })
                .attr("y", d => {
                    if (d.sourceNode && d.targetNode && 
                        d.sourceNode.y !== undefined && d.targetNode.y !== undefined) {
                        // If mutation has time info, interpolate along edge
                        if (d.mutation.time !== null && d.mutation.time !== undefined) {
                            const sourceTime = d.sourceNode.time ?? 0;
                            const targetTime = d.targetNode.time ?? 0;
                            const mutationTime = d.mutation.time;
                            const timeRange = sourceTime - targetTime;
                            
                            if (timeRange > 0 && mutationTime >= targetTime && mutationTime <= sourceTime) {
                                const timeRatio = (mutationTime - targetTime) / timeRange;
                                return d.targetNode.y + timeRatio * (d.sourceNode.y - d.targetNode.y);
                            }
                        }
                        // Default to midpoint
                        return (d.sourceNode.y + d.targetNode.y) / 2;
                    }
                    return 0;
                });
            
            // Add tooltip on hover using the same tooltip div as nodes
            mutationMarkers
                .on("mouseover", (event, d) => {
                    const mut = d.mutation;
                    let tooltipContent = `<strong>Mutation ${mut.id}</strong><br>`;
                    tooltipContent += `Position: ${Math.round(mut.position)}<br>`;
                    tooltipContent += `Transition: ${mut.previous_state} → ${mut.derived_state}<br>`;
                    tooltipContent += `Ancestral: ${mut.ancestral_state}`;
                    
                    if (mut.time !== null && mut.time !== undefined) {
                        tooltipContent += `<br>Time: ${mut.time.toFixed(4)}`;
                    }
                    if (mut.parent_mutation !== -1) {
                        tooltipContent += `<br>Parent mutation: ${mut.parent_mutation}`;
                    }
                    
                    // Calculate position with bounds checking (same as node tooltips)
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
                        
                        // Check if tooltip would overflow right edge
                        if (left + tooltipRect.width > viewportW - margin) {
                            left = clientX - tooltipRect.width - gap;
                        }
                        
                        // Check if tooltip would overflow bottom edge
                        if (top + tooltipRect.height > viewportH - margin) {
                            top = clientY - tooltipRect.height - gap;
                        }
                        
                        // Ensure minimum margins
                        left = Math.max(margin, Math.min(left, viewportW - tooltipRect.width - margin));
                        top = Math.max(margin, Math.min(top, viewportH - tooltipRect.height - margin));
                        
                        tooltip
                            .style("left", left + "px")
                            .style("top", top + "px")
                            .style("visibility", "visible");
                    }
                })
                .on("mouseout", () => {
                    tooltip.style("visibility", "hidden");
                });
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
            _allEdgeGroups: EdgeGroupWithSpans[]
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
                const sourceNode = nodeMap.get(d.sourceId);
                const targetNode = nodeMap.get(d.targetId);
                if (sourceNode && targetNode) {
                    const sourceVisible = getNodeOpacity(sourceNode, opacityParams) > 0.5;
                    const targetVisible = getNodeOpacity(targetNode, opacityParams) > 0.5;
                    if (sourceVisible && targetVisible) {
                        return 1;
                    }
                }
                return 0.05; // Very faint for filtered out labels
            })
            .each(function(d) {
                // Try to find nodes in combined nodes first, then fall back to original data
                let sourceNode = nodeMap.get(d.sourceId);
                let targetNode = nodeMap.get(d.targetId);
                
                // If not found in combined nodes, try to find in original nodes and map to combined
                if (!sourceNode) {
                    const originalSource = stableNodeMap.get(d.sourceId);
                    if (originalSource) {
                        // Find the combined node that contains this original node
                        sourceNode = combinedNodes.find(cn => 
                            cn.combined_nodes?.includes(d.sourceId) || cn.id === d.sourceId
                        );
                    }
                }
                
                if (!targetNode) {
                    const originalTarget = stableNodeMap.get(d.targetId);
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
            
            // Clean up drag tracking properties (using refs for proper cleanup)
            if (dragCleanupTimeoutRef.current) clearTimeout(dragCleanupTimeoutRef.current);
            dragCleanupTimeoutRef.current = setTimeout(() => {
                (event.subject as any).wasDragged = false;
            }, 100); // Small delay to ensure click handler has time to check the flag

            // Recalculate edge crossings after drag with a slight delay (using refs for proper cleanup)
            if (dragCrossingsTimeoutRef.current) clearTimeout(dragCrossingsTimeoutRef.current);
            dragCrossingsTimeoutRef.current = setTimeout(() => {
                if (onEdgeCrossingsChange && combinedNodes && combinedEdges) {
                    const crossings = calculateEdgeCrossings(combinedNodes, combinedEdges);
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
                // Cluster nodes always use theme colors
                if (d.is_cluster) {
                    if (d.is_sample_cluster) {
                        return `rgba(${colors.nodeClusterSample[0]}, ${colors.nodeClusterSample[1]}, ${colors.nodeClusterSample[2]}, ${colors.nodeClusterSample[3] / 255})`;
                    }
                    return `rgba(${colors.nodeClusterRegular[0]}, ${colors.nodeClusterRegular[1]}, ${colors.nodeClusterRegular[2]}, ${colors.nodeClusterRegular[3] / 255})`;
                }
                
                // Population coloring
                if (populationColors && d.population !== null && d.population !== undefined) {
                    let color = populationColors.get(d.population);
                    if (color) {
                        // Darken for samples and roots
                        if (d.is_sample || isRootNode(d, combinedNodes, combinedEdges)) {
                            color = darkenColor(color, 0.75);
                        }
                        return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                    }
                }
                
                // Default theme colors
                if (d.is_sample) return `rgb(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]})`;
                if (d.is_combined) return `rgb(${colors.nodeCombined[0]}, ${colors.nodeCombined[1]}, ${colors.nodeCombined[2]})`;
                if (isRootNode(d, combinedNodes, combinedEdges)) return `rgb(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]})`;
                return `rgb(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]})`;
            })
            .attr("fill-opacity", d => getNodeOpacity(d, opacityParams))
            .attr("stroke", d => {
                if (d.is_cluster) {
                    if (d.is_sample_cluster) return `rgb(${colors.edgeClusterSample[0]}, ${colors.edgeClusterSample[1]}, ${colors.edgeClusterSample[2]})`;
                    return `rgb(${colors.nodeClusterRegular[0]}, ${colors.nodeClusterRegular[1]}, ${colors.nodeClusterRegular[2]})`;
                }
                if (isRootNode(d, combinedNodes, combinedEdges)) return `rgb(${colors.nodeSelected[0]}, ${colors.nodeSelected[1]}, ${colors.nodeSelected[2]})`;
                if (d.is_sample) return colors.background;
                return "none";
            })
            .attr("stroke-opacity", d => getNodeOpacity(d, opacityParams))
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
                    if (d.population !== null && d.population !== undefined) {
                        tooltipContent += `<br>Population: ${d.population}`;
                    }
                } else if (d.is_combined) {
                    const nodeIdDisplay = formatNodeId(d);
                    tooltipContent = `Combined node ${nodeIdDisplay}<br>Time: ${d.time}`;
                    if (d.population !== null && d.population !== undefined) {
                        tooltipContent += `<br>Population: ${d.population}`;
                        if (d.population_inferred) {
                            tooltipContent += ` (inferred)`;
                        }
                    }
                } else if (isRootNode(d, combinedNodes, combinedEdges)) {
                    const childEdges = combinedEdges
                        .filter(e => {
                            const source = typeof e.source === 'number' ? nodeMap.get(e.source as number) : e.source as GraphNode;
                            return source?.id === d.id;
                        });
                    
                    // Get children, expanding clusters to show original nodes
                    const childrenInfo: Array<{id: number, isInCluster?: boolean, clusterId?: number}> = [];
                    
                    childEdges.forEach(e => {
                        const target = typeof e.target === 'number' ? nodeMap.get(e.target as number) : e.target as GraphNode;
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
                    if (d.population !== null && d.population !== undefined) {
                        tooltipContent += `<br>Population: ${d.population}`;
                        if (d.population_inferred) {
                            tooltipContent += ` (inferred)`;
                        }
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
                    if (descendantSamples.length > 0) {
                        tooltipContent += `<br>Descendant samples: ${descendantSamples.join(", ")}`;
                    }
                } else {
                    const parents = [...new Set(combinedEdges
                        .filter(e => {
                            const target = typeof e.target === 'number' ? nodeMap.get(e.target as number) : e.target as GraphNode;
                            return target?.id === d.id;
                        })
                        .map(e => {
                            const source = typeof e.source === 'number' ? nodeMap.get(e.source as number) : e.source as GraphNode;
                            return source?.id;
                        })
                        .filter(id => id !== undefined))]
                        .sort((a, b) => a - b);
                    
                    const childEdges = combinedEdges
                        .filter(e => {
                            const source = typeof e.source === 'number' ? nodeMap.get(e.source as number) : e.source as GraphNode;
                            return source?.id === d.id;
                        });
                    
                    // Get children, expanding clusters to show original nodes
                    const childrenInfo: Array<{id: number, isInCluster?: boolean, clusterId?: number}> = [];
                    
                    childEdges.forEach(e => {
                        const target = typeof e.target === 'number' ? nodeMap.get(e.target as number) : e.target as GraphNode;
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
                    if (d.population !== null && d.population !== undefined) {
                        tooltipContent += `<br>Population: ${d.population}`;
                        if (d.population_inferred) {
                            tooltipContent += ` (inferred)`;
                        }
                    }
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
            .attr("opacity", d => getNodeOpacity(d, opacityParams))
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
            .attr("stroke", colors.background)
            .attr("stroke-width", "2.5px")
            .attr("paint-order", "stroke fill")
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
                    const source = typeof d.source === 'number' ? nodeMap.get(d.source as number) : d.source as GraphNode;
                    return source?.x ?? 0;
                })
                .attr("y1", d => {
                    const source = typeof d.source === 'number' ? nodeMap.get(d.source as number) : d.source as GraphNode;
                    return source?.y ?? 0; // Always use node.y which reflects current position (including spacing updates)
                })
                .attr("x2", d => {
                    const target = typeof d.target === 'number' ? nodeMap.get(d.target as number) : d.target as GraphNode;
                    return target?.x ?? 0;
                })
                .attr("y2", d => {
                    const target = typeof d.target === 'number' ? nodeMap.get(d.target as number) : d.target as GraphNode;
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
                        let sourceNode = nodeMap.get(d.sourceId);
                        let targetNode = nodeMap.get(d.targetId);
                        
                        // If not found in combined nodes, try to find in original nodes and map to combined
                        if (!sourceNode) {
                            const originalSource = stableNodeMap.get(d.sourceId);
                            if (originalSource) {
                                // Find the combined node that contains this original node
                                sourceNode = combinedNodes.find(cn => 
                                    cn.combined_nodes?.includes(d.sourceId) || cn.id === d.sourceId
                                );
                            }
                        }
                        
                        if (!targetNode) {
                            const originalTarget = stableNodeMap.get(d.targetId);
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
                        // Dynamically find the current source and target nodes from combinedNodes
                        // This ensures markers move with the simulation
                        const sourceId = typeof d.edge.source === 'number' ? d.edge.source : (d.edge.source as any).id;
                        const targetId = typeof d.edge.target === 'number' ? d.edge.target : (d.edge.target as any).id;
                        
                        let sourceNode = nodeMap.get(sourceId);
                        let targetNode = nodeMap.get(targetId);
                        
                        // Fallback: try to find in original nodes and map to combined nodes
                        if (!sourceNode) {
                            const originalSource = stableNodeMap.get(sourceId);
                            if (originalSource) {
                                sourceNode = combinedNodes.find(cn => 
                                    cn.combined_nodes?.includes(sourceId) || cn.id === sourceId
                                );
                            }
                        }
                        
                        if (!targetNode) {
                            const originalTarget = stableNodeMap.get(targetId);
                            if (originalTarget) {
                                targetNode = combinedNodes.find(cn => 
                                    cn.combined_nodes?.includes(targetId) || cn.id === targetId
                                );
                            }
                        }
                        
                        if (sourceNode && targetNode && 
                            sourceNode.x !== undefined && sourceNode.y !== undefined &&
                            targetNode.x !== undefined && targetNode.y !== undefined) {
                            
                            // Calculate position along edge based on mutation time
                            let mutationX = (sourceNode.x + targetNode.x) / 2;
                            let mutationY = (sourceNode.y + targetNode.y) / 2;
                            
                            if (d.mutation.time !== null && d.mutation.time !== undefined) {
                                const sourceTime = sourceNode.time ?? 0;
                                const targetTime = targetNode.time ?? 0;
                                const mutationTime = d.mutation.time;
                                const timeRange = sourceTime - targetTime;
                                
                                // Interpolate position along the edge based on time ratio
                                if (timeRange > 0 && mutationTime >= targetTime && mutationTime <= sourceTime) {
                                    const timeRatio = (mutationTime - targetTime) / timeRange;
                                    mutationX = targetNode.x + timeRatio * (sourceNode.x - targetNode.x);
                                    mutationY = targetNode.y + timeRatio * (sourceNode.y - targetNode.y);
                                }
                            }
                            
                            d3.select(this)
                                .attr("x", mutationX)
                                .attr("y", mutationY);
                        }
                    });
            }
        });

        // Add "end" event handler to calculate edge crossings after simulation settles
        simulation.on("end", () => {
            // Clear any pending timeout
            if (edgeCrossingsTimeoutRef.current) {
                clearTimeout(edgeCrossingsTimeoutRef.current);
            }
            // Add a slight delay to ensure all positions are final
            edgeCrossingsTimeoutRef.current = setTimeout(() => {
                if (onEdgeCrossingsChange && combinedNodes && combinedEdges) {
                    const crossings = calculateEdgeCrossings(combinedNodes, combinedEdges);
                    onEdgeCrossingsChange(crossings);
                }
                edgeCrossingsTimeoutRef.current = null;
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

        // Cleanup function - properly deregister all D3 event handlers and clear timeouts
        return () => {
            // Stop simulation and deregister its event handlers
            if (simulation) {
                simulation.stop();
                simulation.on("tick", null);
                simulation.on("end", null);
            }

            // Remove tooltip from DOM
            if (tooltip) {
                tooltip.remove();
            }
            if (tooltipRef.current) {
                tooltipRef.current.remove();
                tooltipRef.current = null;
            }

            // Clear all timeouts using refs
            if (autoZoomTimeoutRef.current) {
                clearTimeout(autoZoomTimeoutRef.current);
                autoZoomTimeoutRef.current = null;
            }
            if (dragCleanupTimeoutRef.current) {
                clearTimeout(dragCleanupTimeoutRef.current);
                dragCleanupTimeoutRef.current = null;
            }
            if (dragCrossingsTimeoutRef.current) {
                clearTimeout(dragCrossingsTimeoutRef.current);
                dragCrossingsTimeoutRef.current = null;
            }
            if (edgeCrossingsTimeoutRef.current) {
                clearTimeout(edgeCrossingsTimeoutRef.current);
                edgeCrossingsTimeoutRef.current = null;
            }

            // Deregister zoom handler
            if (svg) {
                svg.on(".zoom", null);
            }

            // Note: Node/edge event handlers are automatically cleaned up when their DOM elements are removed
            // by d3.select(ref.current).selectAll("*").remove() at the start of the effect
        };
    // Only restart simulation for structural changes, not visual settings
    // Visual settings (colors, nodeSizes, edgeThickness, edgeOpacity, edgeLabelSettings, edgeMutationSettings,
    // temporalSpacingMode, temporalSpacing, sampleSpacing) are accessed via refs to avoid triggering re-renders
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
        
    }, [unpinTrigger, sampleOrder, temporalSpacingMode, temporalSpacing, height]);

    // Effect to update opacities when temporal, genomic, or tree range changes (without restarting simulation)
    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current) return;
        if (!visualStateRef.current.nodes || visualStateRef.current.nodes.length === 0) return;

        const svg = d3.select(ref.current);
        const { nodes: combinedNodes, edges: combinedEdges } = visualStateRef.current;

        // Create opacity calculation parameters
        const opacityParams: OpacityCalculationParams = {
            temporalRange,
            temporalDimOpacity,
            genomicRange,
            genomicDimOpacity,
            treeRange,
            treeIntervals,
            treeDimOpacity,
            nodes: combinedNodes,
            edges: combinedEdges
        };


        // Update node opacities
        svg.selectAll<SVGCircleElement, GraphNode>("circle")
            .attr("fill-opacity", d => getNodeOpacity(d, opacityParams))
            .attr("stroke-opacity", d => getNodeOpacity(d, opacityParams));

        // Update edge opacities
        svg.selectAll<SVGLineElement, GraphEdge>("line")
            .attr("stroke-opacity", d => getEdgeOpacity(d, combinedNodes, opacityParams) * (edgeOpacity / 100));

        // Update node label opacities
        svg.selectAll<SVGTextElement, GraphNode>(".node-labels text")
            .attr("opacity", d => getNodeOpacity(d, opacityParams));

        // Update mutation marker opacities
        svg.selectAll(".mutation-markers text")
            .attr("opacity", (d: any) => d && d.edge ? getEdgeOpacity(d.edge, combinedNodes, opacityParams) * (edgeOpacity / 100) : 0);

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
                    const sourceVisible = getNodeOpacity(sourceNode, opacityParams) > 0.5;
                    const targetVisible = getNodeOpacity(targetNode, opacityParams) > 0.5;
                    if (sourceVisible && targetVisible) {
                        return 1;
                    }
                }
                return 0.05;
            });

    }, [temporalRange, temporalDimOpacity, genomicRange, genomicDimOpacity, treeRange, treeIntervals, treeDimOpacity, ref, edgeOpacity]);

    // Effect to update colors when theme changes (without restarting simulation)
    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current) return;
        if (!visualStateRef.current.nodes || visualStateRef.current.nodes.length === 0) return;

        const svg = d3.select(ref.current);
        const { nodes: combinedNodes, edges: combinedEdges } = visualStateRef.current;

        // Update node colors
        svg.selectAll<SVGCircleElement, GraphNode>("circle")
            .attr("fill", d => {
                // Cluster nodes always use theme colors
                if (d.is_cluster) {
                    if (d.is_sample_cluster) {
                        return `rgba(${colors.nodeClusterSample[0]}, ${colors.nodeClusterSample[1]}, ${colors.nodeClusterSample[2]}, ${colors.nodeClusterSample[3] / 255})`;
                    }
                    return `rgba(${colors.nodeClusterRegular[0]}, ${colors.nodeClusterRegular[1]}, ${colors.nodeClusterRegular[2]}, ${colors.nodeClusterRegular[3] / 255})`;
                }
                
                // Population coloring
                if (populationColors && d.population !== null && d.population !== undefined) {
                    let color = populationColors.get(d.population);
                    if (color) {
                        // Darken for samples and roots
                        if (d.is_sample || isRootNode(d, combinedNodes, combinedEdges)) {
                            color = darkenColor(color, 0.75);
                        }
                        return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                    }
                }
                
                // Default theme colors
                if (d.is_sample) return `rgba(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]}, ${colors.nodeSample[3] / 255})`;
                if (d.is_combined) return `rgba(${colors.nodeCombined[0]}, ${colors.nodeCombined[1]}, ${colors.nodeCombined[2]}, ${colors.nodeCombined[3] / 255})`;
                if (isRootNode(d, combinedNodes, combinedEdges)) return `rgba(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]}, ${colors.nodeRoot[3] / 255})`;
                return `rgba(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]}, ${colors.nodeDefault[3] / 255})`;
            })
            .attr("stroke", d => {
                if (d.is_cluster) {
                    if (d.is_sample_cluster) return `rgba(${colors.edgeClusterSample[0]}, ${colors.edgeClusterSample[1]}, ${colors.edgeClusterSample[2]}, ${colors.edgeClusterSample[3] / 255})`;
                    return `rgba(${colors.nodeClusterRegular[0]}, ${colors.nodeClusterRegular[1]}, ${colors.nodeClusterRegular[2]}, ${colors.nodeClusterRegular[3] / 255})`;
                }
                if (isRootNode(d, combinedNodes, combinedEdges)) return `rgba(${colors.nodeSelected[0]}, ${colors.nodeSelected[1]}, ${colors.nodeSelected[2]}, ${colors.nodeSelected[3] / 255})`;
                if (d.is_sample) return colors.background;
                return "none";
            });

        // Update edge colors
        svg.selectAll<SVGLineElement, GraphEdge>("line")
            .attr("stroke", d => {
                const { isSampleClusterEdge } = getEdgeClusterInfo(d, combinedNodes);
                if (isSampleClusterEdge) {
                    return `rgba(${colors.edgeClusterSample[0]}, ${colors.edgeClusterSample[1]}, ${colors.edgeClusterSample[2]}, ${colors.edgeClusterSample[3] / 255})`;
                } else {
                    return `rgba(${colors.edgeDefault[0]}, ${colors.edgeDefault[1]}, ${colors.edgeDefault[2]}, ${colors.edgeDefault[3] / 255})`;
                }
            });

        // Update mutation marker colors
        svg.selectAll(".mutation-markers text")
            .attr("fill", `rgb(${colors.mutationMarker[0]}, ${colors.mutationMarker[1]}, ${colors.mutationMarker[2]})`)
            .attr("stroke", colors.background);

        // Update edge label colors
        svg.selectAll<SVGTextElement, any>("text")
            .filter(function(): boolean {
                const datum = d3.select(this).datum();
                return !!(datum && typeof datum === 'object' && 'sourceId' in datum && 'targetId' in datum);
            })
            .attr("fill", colors.text)
            .attr("stroke", colors.background);

        // Update node label colors
        svg.selectAll<SVGTextElement, GraphNode>(".node-labels text")
            .attr("fill", colors.text)
            .attr("stroke", colors.background)
            .attr("stroke-width", "2.5px")
            .attr("paint-order", "stroke fill");

        // Update tooltip colors
        svg.selectAll<HTMLDivElement, unknown>(".tooltip")
            .style("background-color", colors.tooltipBackground)
            .style("color", colors.tooltipText)
            .style("border", `1px solid ${colors.border}`);

    }, [colors, populationColors, ref]);

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
        }

        const svg = d3.select(ref.current);
        const { nodes: combinedNodes, edges: combinedEdges } = visualStateRef.current;

        // Create opacity calculation parameters
        const opacityParams: OpacityCalculationParams = {
            temporalRange,
            temporalDimOpacity,
            genomicRange,
            genomicDimOpacity,
            treeRange,
            treeIntervals,
            treeDimOpacity,
            nodes: combinedNodes,
            edges: combinedEdges
        };

        const edges = svg.selectAll<SVGLineElement, GraphEdge>("line");

        // Update edge thickness
        edges.attr("stroke-width", edgeThickness);

        // Update edge opacity (respecting temporal, genomic, and tree filters if active)
        edges.attr("stroke-opacity", (d: GraphEdge) =>
            getEdgeOpacity(d, combinedNodes, opacityParams) * (edgeOpacity / 100)
        );
        
    }, [edgeThickness, edgeOpacity, temporalRange, temporalDimOpacity, genomicRange, genomicDimOpacity, treeRange, treeIntervals, treeDimOpacity, ref]);

    // Effect to update node ID visibility without restarting simulation
    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current) {
            return;
        }
        if (!visualStateRef.current.nodes || visualStateRef.current.nodes.length === 0) {
            return;
        }

        const svg = d3.select(ref.current);
        const { nodes: combinedNodes, edges: combinedEdges } = visualStateRef.current;

        // Get all node labels from the node-labels group
        const nodeLabels = svg.selectAll<SVGTextElement, GraphNode>(".node-labels text");

        // Update visibility based on settings
        nodeLabels.style("display", (d: GraphNode) => {
            if (d.is_sample && !nodeIdSettings.showSampleIds) return "none";
            if (isRootNode(d, combinedNodes, combinedEdges) && !nodeIdSettings.showRootIds) return "none";
            if (!d.is_sample && !isRootNode(d, combinedNodes, combinedEdges) && !nodeIdSettings.showInternalIds) return "none";
            return "block";
        });

    }, [nodeIdSettings, ref]);

    // Effect to update edge labels without restarting simulation
    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current) {
            return;
        }

        const svg = d3.select(ref.current);

        // Update edge label visibility and font size
        const edgeLabels = svg.selectAll<SVGTextElement, any>(".edge-labels text");

        edgeLabels
            .style("display", edgeLabelSettings.showEdgeLabels ? "block" : "none")
            .attr("font-size", `${edgeLabelSettings.labelFontSize}px`);

    }, [edgeLabelSettings, ref]);

    // Effect to update mutation markers without restarting simulation
    useEffect(() => {
        if (!ref || typeof ref === 'function' || !ref.current) return;

        const svg = d3.select(ref.current);

        // Update mutation marker visibility and size
        svg.selectAll(".mutation-markers text")
            .style("display", edgeMutationSettings?.showMutationMarkers ? "block" : "none")
            .attr("font-size", `${edgeMutationSettings?.markerSize || 40}px`);

    }, [edgeMutationSettings, ref]);

    // Cleanup effect that runs only on unmount - clears all refs to prevent memory leaks
    useEffect(() => {
        return () => {
            // Clear all timeout refs
            if (autoZoomTimeoutRef.current) {
                clearTimeout(autoZoomTimeoutRef.current);
                autoZoomTimeoutRef.current = null;
            }
            if (dragCleanupTimeoutRef.current) {
                clearTimeout(dragCleanupTimeoutRef.current);
                dragCleanupTimeoutRef.current = null;
            }
            if (dragCrossingsTimeoutRef.current) {
                clearTimeout(dragCrossingsTimeoutRef.current);
                dragCrossingsTimeoutRef.current = null;
            }
            if (edgeCrossingsTimeoutRef.current) {
                clearTimeout(edgeCrossingsTimeoutRef.current);
                edgeCrossingsTimeoutRef.current = null;
            }

            // Stop simulation if it exists
            if (visualStateRef.current.simulation) {
                visualStateRef.current.simulation.stop();
                visualStateRef.current.simulation.on("tick", null);
                visualStateRef.current.simulation.on("end", null);
            }

            // Remove tooltip if it exists
            if (tooltipRef.current) {
                tooltipRef.current.remove();
                tooltipRef.current = null;
            }

            // Clear visualStateRef to release large data structures
            visualStateRef.current = {
                nodes: [],
                edges: [],
                simulation: null,
                svg: null,
                zoom: null,
                userMovedNodes: new Map(),
                currentTransform: null
            };
        };
    }, []);

    // Don't render if no data
    if (!data) {
        return null;
    }

    return (
        <div className="w-full h-full">
            <svg ref={ref} className="w-full h-full" />
        </div>
    );
}); 