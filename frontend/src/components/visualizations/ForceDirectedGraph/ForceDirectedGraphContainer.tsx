import { useEffect, useState, forwardRef, ForwardedRef, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ForceDirectedGraph } from './ForceDirectedGraph';
import { LayoutSpacingSection, NodesSection, EdgesSection, InformationSection, ViewControlsSection, ClusteringSection } from './ForceDirectedGraphSidebarSections';
import { GraphData, GraphNode, GraphEdge, TreeInterval, NodeSizeSettings, TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, EdgeMutationSettings, ForceTuningSettings } from './ForceDirectedGraph.types';
import { RangeSlider } from '../../ui/range-slider';
import { TreeRangeSlider } from '../../ui/tree-range-slider';
import { TemporalRangeSlider } from '../../ui/temporal-range-slider';
import { SampleOrderType } from '../../ui/sample-order-control';
import { ArgStatsData } from '../../ui/arg-stats-display';
import { VisualizationSidebar } from '../../ui/VisualizationSidebar';
import AlertModal from '../../ui/AlertModal';
import { api } from '../../../lib/api';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { useTreeSequence } from '../../../context/TreeSequenceContext';
import { getDescendants, getAncestors } from '../../../utils/graphTraversal';
import { formatGenomicPosition } from '../../../utils/colorUtils';
import { convertTreeIntervals } from '../../../utils/dataHelpers';

// Define view modes for the graph
type ViewMode = 'full' | 'subgraph' | 'ancestors';
type FilterMode = 'genomic' | 'tree';

interface ForceDirectedGraphContainerProps {
    filename: string;
    max_samples?: number;
    temporalStart?: number;
    temporalEnd?: number;
    genomicStart?: number;
    genomicEnd?: number;
    treeStartIdx?: number;
    treeEndIdx?: number;
}

const DEFAULT_VISUAL_SETTINGS = {
    nodeSizes: {
        sample: 12,
        root: 10,
        other: 8
    },
    nodeIdSettings: {
        showSampleIds: true,
        showRootIds: true,
        showInternalIds: false
    },
    edgeLabelSettings: {
        showEdgeLabels: false,
        labelFontSize: 14
    },
    edgeMutationSettings: {
        showMutationMarkers: true,
        markerSize: 14
    },
    edgeThickness: 2.5,
    edgeOpacity: 95,
    temporalSpacingMode: 'equal' as TemporalSpacingMode,
    temporalSpacing: 14,
    sampleSpacing: 40
};

export const ForceDirectedGraphContainer = forwardRef<SVGSVGElement, ForceDirectedGraphContainerProps>(({ 
    filename,
    max_samples = 25,
    temporalStart,
    temporalEnd,
    genomicStart,
    genomicEnd,
    treeStartIdx,
    treeEndIdx
}, ref: ForwardedRef<SVGSVGElement>) => {
    const { colors } = useColorTheme();
    const { treeSequence } = useTreeSequence();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<GraphData | null>(null);
    const [subArgData, setSubArgData] = useState<GraphData | null>(null); // Rename to clarify this is the SubARG
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('full');
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [genomicRange, setGenomicRange] = useState<[number, number]>([0, 0]);
    const [sequenceLength, setSequenceLength] = useState<number>(0);
    const [isGenomicFilterActive, setIsGenomicFilterActive] = useState(false);
    const [debouncedGenomicRange, setDebouncedGenomicRange] = useState<[number, number]>([0, 0]);
    const [isUpdatingGenomicRange, setIsUpdatingGenomicRange] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [filterMode, setFilterMode] = useState<FilterMode>('genomic');
    const [treeRange, setTreeRange] = useState<[number, number]>([0, 0]);
    // Force remount of the visualization on layout-affecting changes (e.g., sample order)
    const [layoutVersion, setLayoutVersion] = useState(0);
    const [debouncedTreeRange, setDebouncedTreeRange] = useState<[number, number]>([0, 0]);
    const [isUpdatingTreeRange, setIsUpdatingTreeRange] = useState(false);
    const [treeIntervals, setTreeIntervals] = useState<TreeInterval[]>([]);
    const [isFilterActive, setIsFilterActive] = useState(false);
    // Initialize sampleOrder based on URL parameter for clustering
    const [sampleOrder, setSampleOrder] = useState<SampleOrderType>(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true' ? 'dagre' : 'custom';
    });
    const [isFilterSectionCollapsed, setIsFilterSectionCollapsed] = useState(true);
    const [nodeSizes, setNodeSizes] = useState<NodeSizeSettings>(DEFAULT_VISUAL_SETTINGS.nodeSizes);
    const [nodeIdSettings, setNodeIdSettings] = useState<NodeIdSettings>(DEFAULT_VISUAL_SETTINGS.nodeIdSettings);
    const [edgeLabelSettings, setEdgeLabelSettings] = useState<EdgeLabelSettings>(DEFAULT_VISUAL_SETTINGS.edgeLabelSettings);
    const [edgeMutationSettings, setEdgeMutationSettings] = useState<EdgeMutationSettings>(DEFAULT_VISUAL_SETTINGS.edgeMutationSettings);
    const [edgeThickness, setEdgeThickness] = useState(DEFAULT_VISUAL_SETTINGS.edgeThickness);
    const [edgeOpacity, setEdgeOpacity] = useState(DEFAULT_VISUAL_SETTINGS.edgeOpacity);
    const [isLoading, setIsLoading] = useState(false);
    const [visualSettings, setVisualSettings] = useState(DEFAULT_VISUAL_SETTINGS);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [forceTuning, setForceTuning] = useState<ForceTuningSettings>({
        chargeScale: 1,
        linkStrengthScale: 0.4,
        xStrengthScale: 4,
        yStrengthScale: 1,
        collisionRadiusScale: 1.1,
        collisionStrength: 0.7,
        edgeCrossingScale: 1,
        edgeBundlingScale: 1,
        descendantRangeScale: 1,
    });

    // Temporal filtering state
    const [temporalState, setTemporalState] = useState<{
        isActive: boolean;
        minTime: number;
        maxTime: number;
        range: [number, number];
    }>({
        isActive: false,
        minTime: 0,
        maxTime: 1,
        range: [0, 1]
    });

    // Opacity for dimmed (out-of-range) elements during temporal filtering (0.0 - 0.99)
    const [temporalDimOpacity, setTemporalDimOpacity] = useState<number>(0.05);

    // Layer reveal state
    const [layerReveal, setLayerReveal] = useState<{
        isPlaying: boolean;
        rate: number; // layers per second
        mode: 'hide' | 'fade';
        currentProgress: number; // 0 to 1
        initialTarget: [number, number]; // Store initial camera position
        simulationPaused: boolean; // Track if simulation should be paused
    }>({
        isPlaying: false,
        rate: 2.0,
        mode: 'hide',
        currentProgress: 0,
        initialTarget: [0, 0],
        simulationPaused: false
    });

    // Manual simulation control
    const [manualSimulationPaused, setManualSimulationPaused] = useState(false);
    const [unpinTrigger, setUnpinTrigger] = useState(0); // Counter to trigger unpin action
    const [resetTrigger, setResetTrigger] = useState(0); // Counter to trigger simulation reset

    // Clustering state - initialize from URL parameter if present
    const [clusteringEnabled, setClusteringEnabled] = useState(() => {
        return searchParams.get('clustering') === 'true';
    });
    const [clusteringMinTreeSize, setClusteringMinTreeSize] = useState(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true' ? 2 : 3; // Minimum tree size for URL-enabled clustering (max clustering = min size)
    });
    const [clusteringRequireDensity, setClusteringRequireDensity] = useState(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true'; // Enable density for URL-enabled clustering
    });
    const [clusteringDensityIntensity, setClusteringDensityIntensity] = useState(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true' ? 0.05 : 0.5; // 5% for maximum clustering (very lenient = more clusters)
    });
    const [clusteringRequireTemporalCompactness, setClusteringRequireTemporalCompactness] = useState(true);
    const [clusteringTemporalIntensity, setClusteringTemporalIntensity] = useState(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true' ? 0.25 : 0.5; // 25% when enabled from URL/result page, 50% default
    });
    
    // Track if clustering has been initialized to avoid re-triggering on data changes
    // If clustering is enabled from URL, mark as initialized immediately since state is set correctly from the start
    const [clusteringInitialized, setClusteringInitialized] = useState(() => {
        return searchParams.get('clustering') === 'true';
    });
    
    // Handler for when clustering is enabled/disabled from within the visualizer
    // Sets temporal intensity to 40% when enabled by user interaction
    const handleClusteringEnabledChange = useCallback((enabled: boolean) => {
        if (enabled && !clusteringEnabled) {
            // User just enabled clustering - set temporal intensity to 40%
            setClusteringTemporalIntensity(0.40);
        }
        setClusteringEnabled(enabled);
    }, [clusteringEnabled]);
    
    // Store clustering state before viewing subARG (to restore later)
    const [savedClusteringState, setSavedClusteringState] = useState<{
        enabled: boolean;
        minTreeSize: number;
        requireDensity: boolean;
        densityIntensity: number;
        requireTemporalCompactness: boolean;
        temporalIntensity: number;
    } | null>(null);

    // Edge crossings tracking
    const [edgeCrossings, setEdgeCrossings] = useState<number | null>(null);
    const [isCalculatingEdgeCrossings, setIsCalculatingEdgeCrossings] = useState(false);

    // Track if we should show notification about auto-enabled clustering
    const [showAutoClusteringNotification, setShowAutoClusteringNotification] = useState(false);
    // Track if clustering was auto-enabled (for opening the panel by default)
    const [wasAutoEnabled, setWasAutoEnabled] = useState(false);

    // Destructure visual settings for easier access
    const { nodeSizes: visualNodeSizes, edgeThickness: visualEdgeThickness, temporalSpacingMode: visualTemporalSpacingMode, temporalSpacing: visualTemporalSpacing, sampleSpacing: visualSampleSpacing } = visualSettings;

    // Set calculating state when data changes (new visualization loaded)
    useEffect(() => {
        if (data) {
            setIsCalculatingEdgeCrossings(true);
        }
    }, [data]);

    // Clustering initialization is now handled in the initial fetch effect
    // URL-based clustering is initialized via lazy state initialization
    // Auto-enable clustering (>250 nodes) is handled during initial data fetch

    // Track previous clustering settings to detect changes
    const prevClusteringSettings = useRef({
        enabled: clusteringEnabled,
        minTreeSize: clusteringMinTreeSize,
        requireDensity: clusteringRequireDensity,
        densityIntensity: clusteringDensityIntensity,
        requireTemporalCompactness: clusteringRequireTemporalCompactness,
        temporalIntensity: clusteringTemporalIntensity
    });

    // Reset layout when clustering settings change to ensure proper sample/cluster placement
    // This prevents overlapping nodes and ensures correct positioning in dagre mode
    // Only trigger after initialization is complete to avoid interfering with initial load
    useEffect(() => {
        // Don't trigger during initialization
        if (!clusteringInitialized) {
            // Update the ref to current values for future comparisons
            prevClusteringSettings.current = {
                enabled: clusteringEnabled,
                minTreeSize: clusteringMinTreeSize,
                requireDensity: clusteringRequireDensity,
                densityIntensity: clusteringDensityIntensity,
                requireTemporalCompactness: clusteringRequireTemporalCompactness,
                temporalIntensity: clusteringTemporalIntensity
            };
            return;
        }
        
        const prev = prevClusteringSettings.current;
        const hasChanged = 
            prev.enabled !== clusteringEnabled ||
            prev.minTreeSize !== clusteringMinTreeSize ||
            prev.requireDensity !== clusteringRequireDensity ||
            prev.densityIntensity !== clusteringDensityIntensity ||
            prev.requireTemporalCompactness !== clusteringRequireTemporalCompactness ||
            prev.temporalIntensity !== clusteringTemporalIntensity;
        
        if (hasChanged && data) {
            console.log('Clustering settings changed:', {
                enabled: `${prev.enabled} → ${clusteringEnabled}`,
                minTreeSize: `${prev.minTreeSize} → ${clusteringMinTreeSize}`,
                requireDensity: `${prev.requireDensity} → ${clusteringRequireDensity}`,
                densityIntensity: `${prev.densityIntensity} → ${clusteringDensityIntensity}`,
                requireTemporalCompactness: `${prev.requireTemporalCompactness} → ${clusteringRequireTemporalCompactness}`,
                temporalIntensity: `${prev.temporalIntensity} → ${clusteringTemporalIntensity}`
            });
            // For dagre mode, don't trigger reset - the main rendering effect will handle position recalculation
            // For non-dagre modes, trigger reset to recalculate sample spacing
            if (sampleOrder !== 'dagre') {
                console.log('Triggering layout reset - this will recalculate sample spacing');
                setResetTrigger(prev => prev + 1);
            } else {
                console.log('Clustering changed in dagre mode - main rendering effect will handle position recalculation');
            }
            
            // Update the ref for next comparison
            prevClusteringSettings.current = {
                enabled: clusteringEnabled,
                minTreeSize: clusteringMinTreeSize,
                requireDensity: clusteringRequireDensity,
                densityIntensity: clusteringDensityIntensity,
                requireTemporalCompactness: clusteringRequireTemporalCompactness,
                temporalIntensity: clusteringTemporalIntensity
            };
        }
    }, [clusteringEnabled, clusteringMinTreeSize, clusteringRequireDensity, clusteringDensityIntensity, clusteringRequireTemporalCompactness, clusteringTemporalIntensity, clusteringInitialized, data, sampleOrder]);

    // Debounce genomic range changes to prevent excessive API calls
    useEffect(() => {
        if (isFilterActive && filterMode === 'genomic') {
            setIsUpdatingGenomicRange(true);
        }
        
        const timer = setTimeout(() => {
            setDebouncedGenomicRange(genomicRange);
            setIsUpdatingGenomicRange(false);
        }, 500); // Increased from 300ms to 500ms for better performance

        return () => clearTimeout(timer);
    }, [genomicRange, isFilterActive, filterMode]);

    // Debounce tree range changes to prevent excessive API calls
    useEffect(() => {
        if (isFilterActive && filterMode === 'tree') {
            setIsUpdatingTreeRange(true);
        }
        
        const timer = setTimeout(() => {
            setDebouncedTreeRange(treeRange);
            setIsUpdatingTreeRange(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [treeRange, isFilterActive, filterMode]);

    // Initial data loading (now including URL parameters for filtering)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                console.log('Fetching initial graph data for file:', filename, 'with max_samples:', max_samples);
                
                // Build options including URL parameters
                let currentSampleOrder = sampleOrder;
                const options: any = { maxSamples: max_samples, sampleOrder: currentSampleOrder };
                
                // Add temporal filtering if provided via URL
                if (temporalStart !== undefined && temporalEnd !== undefined) {
                    options.temporalStart = temporalStart;
                    options.temporalEnd = temporalEnd;
                    console.log('Applying temporal filtering:', temporalStart, '-', temporalEnd);
                }
                
                // Add genomic filtering if provided via URL
                if (genomicStart !== undefined && genomicEnd !== undefined) {
                    options.genomicStart = genomicStart;
                    options.genomicEnd = genomicEnd;
                    console.log('Applying genomic filtering:', genomicStart, '-', genomicEnd);
                } else if (treeStartIdx !== undefined && treeEndIdx !== undefined) {
                    options.treeStartIdx = treeStartIdx;
                    options.treeEndIdx = treeEndIdx;
                    console.log('Applying tree index filtering:', treeStartIdx, '-', treeEndIdx);
                }
                
                let response = await api.getGraphData(filename, options);
                let graphData = response.data as GraphData;
                console.log('Received initial graph data:', graphData);
                
                // Check if auto-enable clustering is needed (>250 nodes) and not already enabled from URL
                // Use searchParams to check URL state, as clusteringEnabled might not reflect URL param in closure
                const clusteringParam = searchParams.get('clustering');
                const isClusteringEnabledFromURL = clusteringParam === 'true';
                const shouldAutoEnableClustering = graphData.nodes.length > 250 && !isClusteringEnabledFromURL;
                if (shouldAutoEnableClustering) {
                    console.log(`Auto-enabling clustering for large graph (${graphData.nodes.length} nodes)`);
                    
                    // Set clustering state with maximum clustering settings
                    setClusteringEnabled(true);
                    setClusteringMinTreeSize(2);  // Minimum tree size for maximum clustering
                    setClusteringRequireDensity(true);  // Enable density
                    setClusteringDensityIntensity(0.05);  // 5% for maximum clustering (very lenient = more clusters)
                    setClusteringRequireTemporalCompactness(true);  // Enable temporal
                    setClusteringTemporalIntensity(0.25);  // 25% when auto-enabled
                    setSampleOrder('dagre');
                    currentSampleOrder = 'dagre';
                    
                    // Re-fetch with correct sampleOrder before setting data
                    console.log('Re-fetching with clustering settings and dagre sampleOrder');
                    options.sampleOrder = 'dagre';
                    response = await api.getGraphData(filename, options);
                    graphData = response.data as GraphData;
                    console.log('Received re-fetched graph data with clustering settings');
                }
                
                // Initialize genomic range settings
                if (graphData.metadata.sequence_length) {
                    setSequenceLength(graphData.metadata.sequence_length);
                    const fullRange: [number, number] = [0, graphData.metadata.sequence_length];
                    setGenomicRange(fullRange);
                    setDebouncedGenomicRange(fullRange);
                }

                // Initialize tree intervals and range settings
                if (graphData.metadata.tree_intervals && graphData.metadata.tree_intervals.length > 0) {
                    const intervals = convertTreeIntervals(graphData.metadata.tree_intervals as unknown as [number, number, number][]);
                    setTreeIntervals(intervals);
                    const treeFullRange: [number, number] = [0, intervals.length - 1];
                    setTreeRange(treeFullRange);
                    setDebouncedTreeRange(treeFullRange);
                }

                // Initialize temporal state from data
                if (graphData.nodes.length > 0) {
                    const times = graphData.nodes.map(n => n.time);
                    const minTime = Math.min(...times);
                    const maxTime = Math.max(...times);
                    setTemporalState({
                        isActive: false,
                        minTime,
                        maxTime,
                        range: [minTime, maxTime]
                    });
                }

                // Dynamic vertical spacing based on number of layers
                const uniqueTimes = Array.from(new Set(graphData.nodes.map(n => n.time)));
                const numLayers = uniqueTimes.length;
                
                let dynamicVertical = 14; // fallback
                
                if (numLayers > 1) {
                    const rawV = 100 / Math.log2(numLayers + 2);
                    dynamicVertical = Math.ceil(Math.max(8, Math.min(20, rawV)));
                }
                
                // Horizontal spacing is constant per sample (slider value = spacing per sample)
                // Use default 40px - this stays the same regardless of sample count
                const constantHorizontal = 40;
                
                console.log(`Dynamic spacing: H=${constantHorizontal}px per sample (constant), V=${dynamicVertical} (layers=${numLayers})`);
                
                setVisualSettings(prev => ({
                    ...prev,
                    sampleSpacing: constantHorizontal,
                    temporalSpacing: dynamicVertical
                }));

                // Mark clustering as initialized if we enabled it
                if (shouldAutoEnableClustering) {
                    setClusteringInitialized(true);
                    setWasAutoEnabled(true);
                    // Show notification after data is loaded
                    setShowAutoClusteringNotification(true);
                }

                setIsInitialized(true);
                setData(graphData);
                setSubArgData(graphData); // Store SubARG data (what was loaded with max_samples)
                setError(null);
            } catch (e) {
                console.error('Error fetching initial graph data:', e);
                setError(e instanceof Error ? e.message : 'An error occurred while fetching graph data');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        // Reset initialization state when filename or max_samples change
        setIsInitialized(false);
        setIsFilterActive(false); // Also reset filter state
        setShowAutoClusteringNotification(false); // Reset notification state
        setWasAutoEnabled(false); // Reset auto-enablement tracking
        // Reset clustering initialized flag when starting fresh (but preserve if clustering was set from URL)
        // Note: clusteringEnabled is read inside the effect, not from dependencies, to use current state value
        const currentClusteringEnabled = searchParams.get('clustering') === 'true';
        if (!currentClusteringEnabled) {
            setClusteringInitialized(false);
        }
        fetchInitialData();
    // convertTreeIntervals is a stable utility function and doesn't need to be in dependencies
    // sampleOrder and clusteringEnabled are read inside the effect but not in deps to avoid re-fetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filename, max_samples, temporalStart, temporalEnd, genomicStart, genomicEnd, treeStartIdx, treeEndIdx]);

    // Data loading with filtering and sample order changes
    useEffect(() => {
        // Skip if not initialized or if this is the initial load
        if (!isInitialized) {
            return;
        }

        // Determine if we need to make an API call
        let needsApiCall = false;
        let genomicParams = null;
        let treeParams = null;

        if (isFilterActive) {
            if (filterMode === 'genomic') {
                // Check if genomic range covers the full sequence
                const isFullSequence = debouncedGenomicRange[0] === 0 && debouncedGenomicRange[1] === sequenceLength;
                if (!isFullSequence) {
                    needsApiCall = true;
                    genomicParams = {
                        genomic_start: debouncedGenomicRange[0],
                        genomic_end: debouncedGenomicRange[1]
                    };
                }
            } else if (filterMode === 'tree') {
                // Check if tree range covers all trees
                const isFullTreeRange = debouncedTreeRange[0] === 0 && debouncedTreeRange[1] === treeIntervals.length - 1;
                if (!isFullTreeRange && treeIntervals.length > 0) {
                    needsApiCall = true;
                    treeParams = {
                        tree_start_idx: debouncedTreeRange[0],
                        tree_end_idx: debouncedTreeRange[1]
                    };
                }
            }
        }

        // Always make API call if sample order has changed, regardless of filter state
        if (!needsApiCall) {
            // Check if we have data and the sample order in metadata matches current selection
            if (!data || data.metadata.sample_order !== sampleOrder) {
                needsApiCall = true;
                console.log('Making API call due to sample order change');
            } else {
                console.log('Skipping API call - using existing data (full range or filter disabled)');
                return;
            }
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                
                let options: any = { maxSamples: max_samples, sampleOrder };
                
                // Always include URL parameters if present
                if (temporalStart !== undefined && temporalEnd !== undefined) {
                    options.temporalStart = temporalStart;
                    options.temporalEnd = temporalEnd;
                }
                
                if (genomicParams) {
                    console.log('Fetching filtered graph data for genomic range:', debouncedGenomicRange);
                    options.genomicStart = genomicParams.genomic_start;
                    options.genomicEnd = genomicParams.genomic_end;
                } else if (treeParams) {
                    console.log('Fetching filtered graph data for tree range:', debouncedTreeRange);
                    options.treeStartIdx = treeParams.tree_start_idx;
                    options.treeEndIdx = treeParams.tree_end_idx;
                } else if (genomicStart !== undefined && genomicEnd !== undefined) {
                    // Apply URL genomic parameters if no local filter is active
                    options.genomicStart = genomicStart;
                    options.genomicEnd = genomicEnd;
                } else if (treeStartIdx !== undefined && treeEndIdx !== undefined) {
                    // Apply URL tree parameters if no local filter is active
                    options.treeStartIdx = treeStartIdx;
                    options.treeEndIdx = treeEndIdx;
                } else {
                    console.log('Fetching unfiltered graph data');
                }
                
                const response = await api.getGraphData(filename, options);
                const graphData = response.data as GraphData;
                console.log('Received graph data:', graphData);
                
                setData(graphData);
                setError(null);
            } catch (e) {
                console.error('Error fetching graph data:', e);
                setError(e instanceof Error ? e.message : 'An error occurred while fetching graph data');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filename, max_samples, debouncedGenomicRange, debouncedTreeRange, isFilterActive, filterMode, isInitialized, sequenceLength, treeIntervals, sampleOrder]);

    // Auto-collapse filter section when filters are inactive, but only on initialization
    useEffect(() => {
        if (!isFilterActive) {
            setIsFilterSectionCollapsed(true);
        }
    }, [isFilterActive]);

    // Layer-by-layer reveal effect
    useEffect(() => {
        if (!layerReveal.isPlaying || !data || !temporalState.isActive) return;

        // Get unique times from the data (sorted)
        const uniqueTimes = Array.from(new Set(data.nodes.map(node => node.time))).sort((a, b) => a - b);
        const numLayers = uniqueTimes.length;
        
        if (numLayers === 0) return;

        // Calculate time between layers based on rate (layers per second)
        const msPerLayer = 1000 / layerReveal.rate;
        
        // Start from the current progress
        const startLayerIndex = Math.floor(layerReveal.currentProgress * numLayers);
        let currentLayerIndex = startLayerIndex;

        // Set initial layer
        if (currentLayerIndex < numLayers) {
            setTemporalState(prev => ({
                ...prev,
                range: [temporalState.minTime, uniqueTimes[currentLayerIndex]]
            }));
        }

        const interval = setInterval(() => {
            currentLayerIndex++;
            
            if (currentLayerIndex >= numLayers) {
                // Animation complete - resume simulation
                clearInterval(interval);
                setLayerReveal(prev => ({
                    ...prev,
                    isPlaying: false,
                    currentProgress: 1,
                    simulationPaused: false // Signal to resume simulation
                }));
                setTemporalState(prev => ({
                    ...prev,
                    range: [temporalState.minTime, temporalState.maxTime]
                }));
            } else {
                // Update to next layer
                const progress = currentLayerIndex / numLayers;
                setLayerReveal(prev => ({
                    ...prev,
                    currentProgress: progress
                }));
                setTemporalState(prev => ({
                    ...prev,
                    range: [temporalState.minTime, uniqueTimes[currentLayerIndex]]
                }));
            }
        }, msPerLayer);

        return () => {
            clearInterval(interval);
            // If layer reveal is interrupted, resume simulation
            setLayerReveal(prev => ({
                ...prev,
                simulationPaused: false
            }));
        };
    }, [layerReveal.isPlaying, layerReveal.rate, data, temporalState.isActive, temporalState.minTime, temporalState.maxTime]);

    // Memoize filtered data to prevent unnecessary re-renders
    const filteredData = useMemo(() => {
        if (!data || !selectedNode) return data;

        switch (viewMode) {
            case 'subgraph': {
                const descendants = getDescendants(selectedNode, data.nodes, data.edges);
                descendants.add(selectedNode.id);
                
                const filteredNodes = data.nodes.filter(node => descendants.has(node.id));
                const filteredEdges = data.edges.filter(edge => {
                    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
                    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
                    return descendants.has(sourceId) && descendants.has(targetId);
                });

                return {
                    ...data,
                    nodes: filteredNodes,
                    edges: filteredEdges,
                    metadata: {
                        ...data.metadata,
                        is_subset: true
                    }
                };
            }
            case 'ancestors': {
                let allAncestors: Set<number>;
                
                // Handle sample clusters: combine ancestors of all samples in the cluster
                if (selectedNode.is_sample_cluster && selectedNode.cluster_nodes && selectedNode.cluster_nodes.length > 0) {
                    // Start with ancestors reachable through the cluster node
                    // (edges that were remapped from samples to point to the cluster node)
                    allAncestors = getAncestors(selectedNode, data.nodes, data.edges);
                    
                    // Add the cluster node itself
                    allAncestors.add(selectedNode.id);
                    
                    // Also try to find individual sample nodes that might still exist in data
                    // (in case some samples weren't fully clustered or are present for other reasons)
                    for (const sampleId of selectedNode.cluster_nodes) {
                        const sampleNode = data.nodes.find(n => n.id === sampleId);
                        if (sampleNode) {
                            // Sample node exists - get its ancestors and add to union
                            const sampleAncestors = getAncestors(sampleNode, data.nodes, data.edges);
                            sampleAncestors.forEach(id => allAncestors.add(id));
                            allAncestors.add(sampleId);
                        } else {
                            // Sample node was clustered and removed - include its ID anyway
                            // (even though it won't be in filteredNodes, this ensures completeness)
                            allAncestors.add(sampleId);
                        }
                    }
                } else {
                    // Regular node (not a sample cluster) - use normal ancestor computation
                    allAncestors = getAncestors(selectedNode, data.nodes, data.edges);
                    allAncestors.add(selectedNode.id);
                }
                
                const filteredNodes = data.nodes.filter(node => allAncestors.has(node.id));
                const filteredEdges = data.edges.filter(edge => {
                    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
                    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
                    return allAncestors.has(sourceId) && allAncestors.has(targetId);
                });

                return {
                    ...data,
                    nodes: filteredNodes,
                    edges: filteredEdges,
                    metadata: {
                        ...data.metadata,
                        is_subset: true
                    }
                };
            }
            default:
                return data;
        }
    }, [data, selectedNode, viewMode]);

    // Memoize ARG statistics for display
    const argStats = useMemo((): ArgStatsData | null => {
        if (!subArgData || !data || !treeSequence || !filteredData) return null;

        // SubARG stats are the same as filtered data in force-directed graph
        // since temporal filtering is not available here
        return {
            originalNodes: data.metadata.original_num_nodes || treeSequence.num_nodes,
            originalEdges: data.metadata.original_num_edges || treeSequence.num_edges,
            subArgNodes: subArgData.nodes.length,
            subArgEdges: subArgData.edges.length,
            displayedNodes: filteredData.nodes.length,
            displayedEdges: filteredData.edges.length
        };
    }, [subArgData, data, treeSequence, filteredData]);

    // Handle left click - show subgraph
    // Use refs to avoid recreating callback on every state change
    const selectedNodeRef = useRef(selectedNode);
    const viewModeRef = useRef(viewMode);
    
    useEffect(() => {
        selectedNodeRef.current = selectedNode;
        viewModeRef.current = viewMode;
    }, [selectedNode, viewMode]);
    
    // Helper function to save clustering state when leaving full view
    const saveClusteringStateIfNeeded = useCallback(() => {
        // Only save if we're in full view and haven't saved yet
        if (viewMode === 'full' && !savedClusteringState) {
            setSavedClusteringState({
                enabled: clusteringEnabled,
                minTreeSize: clusteringMinTreeSize,
                requireDensity: clusteringRequireDensity,
                densityIntensity: clusteringDensityIntensity,
                requireTemporalCompactness: clusteringRequireTemporalCompactness,
                temporalIntensity: clusteringTemporalIntensity
            });
        }
    }, [viewMode, savedClusteringState, clusteringEnabled, clusteringMinTreeSize, clusteringRequireDensity, clusteringDensityIntensity, clusteringRequireTemporalCompactness, clusteringTemporalIntensity]);
    
    // Helper function to restore clustering state when returning to full view
    const restoreClusteringStateIfNeeded = useCallback(() => {
        if (savedClusteringState) {
            setClusteringEnabled(savedClusteringState.enabled);
            setClusteringMinTreeSize(savedClusteringState.minTreeSize);
            setClusteringRequireDensity(savedClusteringState.requireDensity);
            setClusteringDensityIntensity(savedClusteringState.densityIntensity);
            setClusteringRequireTemporalCompactness(savedClusteringState.requireTemporalCompactness);
            setClusteringTemporalIntensity(savedClusteringState.temporalIntensity);
            setSavedClusteringState(null);
        }
    }, [savedClusteringState]);
    
    const handleNodeClick = useCallback((node: GraphNode) => {
        const currentViewMode = viewModeRef.current;
        const currentSelectedNode = selectedNodeRef.current;
        
        if (currentViewMode === 'full') {
            // Entering subARG view - save clustering state and disable clustering
            saveClusteringStateIfNeeded();
            setClusteringEnabled(false); // Disable clustering in subARG (expand cluster)
            
            setSelectedNode(node);
            setViewMode('subgraph');
        } else if (currentSelectedNode?.id === node.id) {
            // Same node clicked again - return to full view and restore clustering
            setViewMode('full');
            setSelectedNode(null);
            
            // Restore clustering state
            restoreClusteringStateIfNeeded();
        } else {
            // Different node clicked - show its subgraph (keep clustering disabled)
            setSelectedNode(node);
            setViewMode('subgraph');
        }
    }, [saveClusteringStateIfNeeded, restoreClusteringStateIfNeeded]); // Need dependencies for state access

    // Handle right click - show ancestors
    const handleNodeRightClick = useCallback((node: GraphNode) => {
        // Only save clustering state if we're entering from full view
        if (viewMode === 'full') {
            saveClusteringStateIfNeeded();
            setClusteringEnabled(false); // Disable clustering in parent ARG
        }
        setSelectedNode(node);
        setViewMode('ancestors');
    }, [viewMode, saveClusteringStateIfNeeded]);

    const handleEdgeClick = useCallback((edge: GraphEdge) => {
        console.log('Edge clicked:', edge);
        // Add your edge click handling logic here
    }, []);

    const handleReturnToFull = useCallback(() => {
        // Restore clustering state when returning to full view
        restoreClusteringStateIfNeeded();
        setViewMode('full');
        setSelectedNode(null);
    }, [restoreClusteringStateIfNeeded]);

    // Callback for edge crossings calculation
    const handleEdgeCrossingsChange = useCallback((count: number) => {
        setEdgeCrossings(count);
        setIsCalculatingEdgeCrossings(false);
    }, []);

    // Handler for sample order change that triggers calculation state
    const handleSampleOrderChange = useCallback((order: SampleOrderType) => {
        setSampleOrder(order);
        setIsCalculatingEdgeCrossings(true);
        
        // If switching to dagre mode, trigger a reset to fix spacing and apply dagre positions immediately
        if (order === 'dagre') {
            console.log('Switching to dagre mode - triggering spacing recalculation');
            // Small delay to let the mode switch take effect first
            setTimeout(() => {
                setResetTrigger(prev => prev + 1);
            }, 100);
        }
        // Force a remount so the layout resets cleanly to the new ordering
        setLayoutVersion(prev => prev + 1);
    }, []);

    // Genomic range control handlers
    const handleGenomicRangeChange = useCallback((newRange: [number, number]) => {
        // Only update if the range actually changed to avoid unnecessary rerenders
        if (newRange[0] !== genomicRange[0] || newRange[1] !== genomicRange[1]) {
            setGenomicRange(newRange);
        }
    }, [genomicRange]);

    const handleTreeRangeChange = useCallback((newRange: [number, number]) => {
        // Only update if the range actually changed to avoid unnecessary rerenders
        if (newRange[0] !== treeRange[0] || newRange[1] !== treeRange[1]) {
            setTreeRange(newRange);
        }
    }, [treeRange]);

    const handleToggleFilter = useCallback(() => {
        const newFilterState = !isFilterActive;
        setIsFilterActive(newFilterState);
        
        if (newFilterState) {
            if (filterMode === 'genomic') {
                // Activating genomic filter - ensure range is set to full sequence initially
                setGenomicRange([0, sequenceLength]);
                setDebouncedGenomicRange([0, sequenceLength]);
            } else if (filterMode === 'tree' && treeIntervals.length > 0) {
                // Activating tree filter - ensure range is set to full tree range initially
                const fullTreeRange: [number, number] = [0, treeIntervals.length - 1];
                setTreeRange(fullTreeRange);
                setDebouncedTreeRange(fullTreeRange);
            }
            // Show controls when activating filter
            setIsFilterSectionCollapsed(false);
        } else {
            // Deactivating filter - reload initial data without filtering and collapse controls
            setIsFilterSectionCollapsed(true);
        }
    }, [isFilterActive, filterMode, sequenceLength, treeIntervals]);

    const handleFilterModeChange = useCallback((newMode: FilterMode) => {
        setFilterMode(newMode);
        
        // Initialize the appropriate range when switching modes
        if (newMode === 'genomic') {
            setGenomicRange([0, sequenceLength]);
            setDebouncedGenomicRange([0, sequenceLength]);
        } else if (newMode === 'tree' && treeIntervals.length > 0) {
            const fullTreeRange: [number, number] = [0, treeIntervals.length - 1];
            setTreeRange(fullTreeRange);
            setDebouncedTreeRange(fullTreeRange);
        }
    }, [sequenceLength, treeIntervals]);

    const getViewTitle = (): string => {
        let title = '';
        switch (viewMode) {
            case 'subgraph':
                title = `SubARG at Root ${selectedNode?.id}`;
                break;
            case 'ancestors':
                title = `Parent ARG of Node ${selectedNode?.id}`;
                break;
            default:
                title = 'Full ARG';
        }
        
        if (isFilterActive && data?.metadata.genomic_start !== undefined && data?.metadata.genomic_end !== undefined) {
            title += ` (${formatGenomicPosition(data.metadata.genomic_start)} - ${formatGenomicPosition(data.metadata.genomic_end)})`;
        }
        
        return title;
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
                <div className="text-center">
                    <div 
                        className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                        style={{ borderColor: colors.accentPrimary }}
                    ></div>
                    <p style={{ color: colors.text }}>Loading force-directed ARG visualization...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
                <div className="text-center" style={{ color: colors.text }}>
                    <p className="text-lg mb-2">Error loading visualization</p>
                    <p className="text-sm" style={{ color: `${colors.text}B3` }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="flex flex-col h-full"
            style={{ backgroundColor: colors.background }}
        >
            {/* Header */}
            <div 
                className="flex-shrink-0 border-b"
                style={{ 
                    backgroundColor: colors.background,
                    borderBottomColor: colors.border 
                }}
            >
                {/* Row 3: View title and filter controls */}
                <div className="px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-semibold" style={{ color: colors.headerText }}>
                                    {getViewTitle()}
                                </h2>
                                
                                {(sequenceLength > 0 || treeIntervals.length > 0) && (
                                    <div className="flex items-center gap-4">
                                        {sequenceLength > 0 && (
                                            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.headerText }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isFilterActive}
                                                    onChange={handleToggleFilter}
                                                    className="w-4 h-4 rounded focus:ring-2"
                                                    style={{
                                                        accentColor: colors.accentPrimary
                                                    }}
                                                />
                                                Filter Genomic Range
                                            </label>
                                        )}
                                    </div>
                                )}
                                
                                {viewMode !== 'full' && (
                                    <button
                                        onClick={handleReturnToFull}
                                        className="font-medium px-3 py-1 rounded text-sm transition-colors border"
                                        style={{
                                            backgroundColor: colors.containerBackground,
                                            color: colors.text,
                                            borderColor: `${colors.accentPrimary}33` // 20% opacity
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = `${colors.accentPrimary}66`; // 40% opacity
                                            e.currentTarget.style.backgroundColor = `${colors.containerBackground}CC`; // 80% opacity
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = `${colors.accentPrimary}33`;
                                            e.currentTarget.style.backgroundColor = colors.containerBackground;
                                        }}
                                    >
                                        Return to Full ARG
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            {/* Show/hide controls button when filters are active */}
                            {(isFilterActive || temporalState.isActive) && (
                                <button
                                    onClick={() => setIsFilterSectionCollapsed(!isFilterSectionCollapsed)}
                                    className="flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: colors.accentPrimary,
                                        color: colors.background
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '0.8';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                    }}
                                >
                                    <span>
                                        {isFilterSectionCollapsed ? 'Show Controls' : 'Hide Controls'}
                                    </span>
                                    <svg 
                                        className={`w-4 h-4 transition-transform ${isFilterSectionCollapsed ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs" style={{ color: colors.headerText }}>
                                <div className="flex items-center gap-1">
                                    <div 
                                        className="w-2 h-2 rounded-full border"
                                        style={{
                                            backgroundColor: `rgb(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]})`,
                                            borderColor: colors.background,
                                            borderWidth: '0.5px'
                                        }}
                                    ></div>
                                    <span>Sample</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div 
                                        className="w-2 h-2 rounded-full" 
                                        style={{backgroundColor: `rgb(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]})`}}
                                    ></div>
                                    <span>Internal</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div 
                                        className="w-2 h-2 rounded-full" 
                                        style={{backgroundColor: `rgb(${colors.nodeCombined[0]}, ${colors.nodeCombined[1]}, ${colors.nodeCombined[2]})`}}
                                    ></div>
                                    <span>Combined</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div 
                                        className="w-2 h-2 rounded-full border-2" 
                                        style={{
                                            backgroundColor: `rgb(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]})`,
                                            borderColor: `rgb(${colors.nodeSelected[0]}, ${colors.nodeSelected[1]}, ${colors.nodeSelected[2]})`
                                        }}
                                    ></div>
                                    <span>Root</span>
                                </div>
                            </div>
                            
                            <div 
                                className="text-xs border-l pl-4"
                                style={{ 
                                    color: colors.headerText,
                                    borderLeftColor: colors.border 
                                }}
                            >
                                Left click: Subgraph • Right click: Ancestors
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Filter Controls Section - only show when filters are active */}
            {(isFilterActive || temporalState.isActive) && (
                <div 
                    className="flex-shrink-0 border-b"
                    style={{ 
                        backgroundColor: colors.background,
                        borderBottomColor: colors.border 
                    }}
                >
                    {!isFilterSectionCollapsed && (
                        <div className="px-4 py-3">
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex flex-col gap-3 flex-shrink-0 min-w-0">
                                    {/* Genomic Filter mode selection */}
                                    {isFilterActive && treeIntervals.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm whitespace-nowrap" style={{ color: colors.text }}>
                                                Genomic Mode:
                                            </span>
                                            <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.containerBackground }}>
                                                <button
                                                    onClick={() => handleFilterModeChange('genomic')}
                                                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                                                        filterMode === 'genomic' 
                                                            ? '' 
                                                            : 'hover:opacity-80'
                                                    }`}
                                                    style={{
                                                        backgroundColor: filterMode === 'genomic' ? colors.accentPrimary : colors.containerBackground,
                                                        color: filterMode === 'genomic' ? colors.background : colors.text
                                                    }}
                                                >
                                                    Genomic
                                                </button>
                                                <button
                                                    onClick={() => handleFilterModeChange('tree')}
                                                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                                                        filterMode === 'tree' 
                                                            ? '' 
                                                            : 'hover:opacity-80'
                                                    }`}
                                                    style={{
                                                        backgroundColor: filterMode === 'tree' ? colors.accentPrimary : colors.containerBackground,
                                                        color: filterMode === 'tree' ? colors.background : colors.text
                                                    }}
                                                >
                                                    Tree Index
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isFilterActive && (
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex-1 max-w-md min-w-0">
                                            {filterMode === 'genomic' && sequenceLength > 0 ? (
                                                <RangeSlider
                                                    min={0}
                                                    max={sequenceLength}
                                                    step={Math.max(1, Math.floor(sequenceLength / 1000))}
                                                    value={genomicRange}
                                                    onChange={handleGenomicRangeChange}
                                                    formatValue={formatGenomicPosition}
                                                    className="w-full"
                                                />
                                            ) : filterMode === 'tree' && treeIntervals.length > 0 ? (
                                                <TreeRangeSlider
                                                    treeIntervals={treeIntervals}
                                                    value={treeRange}
                                                    onChange={handleTreeRangeChange}
                                                    className="w-full"
                                                />
                                            ) : null}
                                        </div>
                                        
                                        {/* Inline filter info */}
                                        <div className="text-xs flex-shrink-0" style={{ color: colors.text }}>
                                            {filterMode === 'genomic' ? (
                                                <span>
                                                    {formatGenomicPosition(genomicRange[1] - genomicRange[0])} bp
                                                    ({((genomicRange[1] - genomicRange[0]) / sequenceLength * 100).toFixed(1)}%)
                                                    {data?.metadata.num_local_trees !== undefined && (
                                                        <> • {data.metadata.num_local_trees} trees</>
                                                    )}
                                                </span>
                                            ) : filterMode === 'tree' && treeIntervals.length > 0 ? (
                                                <span>
                                                    Trees {treeRange[0]}-{treeRange[1]} ({treeRange[1] - treeRange[0] + 1} of {treeIntervals.length})
                                                    {data?.metadata.num_local_trees !== undefined && (
                                                        <> • {data.metadata.expected_tree_count ?? data.metadata.num_local_trees} displayed</>
                                                    )}
                                                    {data?.metadata.tree_count_mismatch && (
                                                        <> ⚠️ (actual: {data.metadata.num_local_trees})</>
                                                    )}
                                                </span>
                                            ) : null}
                                            {loading && (
                                                <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border border-t-transparent" style={{ borderColor: colors.accentPrimary }}></div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Temporal filter info */}
                            {temporalState.isActive && (
                                <div className="text-xs mt-3" style={{ color: colors.text }}>
                                    <div className="flex items-center gap-2">
                                        <span>
                                            Temporal Range: {temporalState.range[0].toFixed(0)} - {temporalState.range[1].toFixed(0)}{' '}
                                            ({(((temporalState.range[1] - temporalState.range[0]) / (temporalState.maxTime - temporalState.minTime)) * 100).toFixed(1)}% of time range)
                                            • Hold Shift + drag to maintain window size
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Area with Sidebar */}
            <div className="flex-1 overflow-hidden flex min-h-0 min-w-0">
                {/* Temporal Slider - only show when temporal filter is active */}
                {temporalState.isActive && !isFilterSectionCollapsed && (
                    <div 
                        className="flex-shrink-0 border-r px-3 py-4 flex items-center justify-center"
                        style={{ 
                            backgroundColor: colors.background,
                            borderRightColor: colors.border 
                        }}
                    >
                        <TemporalRangeSlider
                            min={temporalState.minTime}
                            max={temporalState.maxTime}
                            step={(temporalState.maxTime - temporalState.minTime) / 100}
                            value={temporalState.range}
                            onChange={(newRange) => setTemporalState(prev => ({ ...prev, range: newRange }))}
                            formatValue={(v) => v.toFixed(0)}
                            height={500}
                        />
                    </div>
                )}

                {/* Graph Visualization and Sidebar Container */}
                <div className="flex-1 overflow-hidden flex flex-row min-h-0 min-w-0">
                    {/* Graph Visualization */}
                    <div className="flex-1 overflow-hidden relative min-h-0 min-w-0">
                    <ForceDirectedGraph 
                        key={`fdg-${layoutVersion}-${sampleOrder}`}
                        ref={ref}
                        data={filteredData}
                        onNodeClick={handleNodeClick}
                        onNodeRightClick={handleNodeRightClick}
                        onEdgeClick={handleEdgeClick}
                        focalNode={selectedNode}
                        nodeSizes={nodeSizes}
                        nodeIdSettings={nodeIdSettings}
                        edgeLabelSettings={edgeLabelSettings}
                        edgeMutationSettings={edgeMutationSettings}
                        sampleOrder={sampleOrder}
                        edgeThickness={edgeThickness}
                        edgeOpacity={edgeOpacity}
                        temporalSpacingMode={visualTemporalSpacingMode}
                        temporalSpacing={visualTemporalSpacing}
                        sampleSpacing={visualSampleSpacing}
                        temporalRange={temporalState.isActive ? temporalState.range : undefined}
                            temporalDimOpacity={temporalDimOpacity}
                        simulationPaused={layerReveal.simulationPaused || manualSimulationPaused || temporalState.isActive}
                        unpinTrigger={unpinTrigger}
                        onEdgeCrossingsChange={handleEdgeCrossingsChange}
                        forceTuning={forceTuning}
                        resetTrigger={resetTrigger}
                        clusteringEnabled={clusteringEnabled}
                        clusteringMinTreeSize={clusteringMinTreeSize}
                        clusteringRequireDensity={clusteringRequireDensity}
                        clusteringDensityIntensity={clusteringDensityIntensity}
                        clusteringRequireTemporalCompactness={clusteringRequireTemporalCompactness}
                        clusteringTemporalIntensity={clusteringTemporalIntensity}
                    />

                    {temporalState.isActive && (
                        <div 
                            className="absolute left-1/2 -translate-x-1/2 top-2 px-2.5 py-1.5 rounded text-xs font-semibold border shadow-sm"
                            style={{ 
                                backgroundColor: `${colors.containerBackground}E6`,
                                color: colors.text,
                                borderColor: colors.border,
                                backdropFilter: 'blur(2px)'
                            }}
                        >
                            t = {temporalState.range[1].toFixed(0)}
                        </div>
                    )}
                    </div>
                        
                    {/* Unified Sidebar */}
                    <VisualizationSidebar
                    position="right"
                    defaultWidth={350}
                    minWidth={280}
                    maxWidth={600}
                    defaultCollapsed={false}
                    sections={[
                        {
                            id: 'layout',
                            title: 'Layout & Spacing',
                            icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                                </svg>
                            ),
                            content: (
                                <LayoutSpacingSection
                                    sampleOrder={sampleOrder}
                                    onSampleOrderChange={handleSampleOrderChange}
                                    temporalSpacingMode={visualTemporalSpacingMode}
                                    onTemporalSpacingModeChange={(mode) => setVisualSettings(prev => ({ ...prev, temporalSpacingMode: mode }))}
                                    temporalSpacing={visualTemporalSpacing}
                                    onTemporalSpacingChange={(spacing) => setVisualSettings(prev => ({ ...prev, temporalSpacing: spacing }))}
                                    sampleSpacing={visualSampleSpacing}
                                    onSampleSpacingChange={(spacing) => setVisualSettings(prev => ({ ...prev, sampleSpacing: spacing }))}
                                    simulationPaused={manualSimulationPaused}
                                    onSimulationPausedChange={setManualSimulationPaused}
                                    temporalFilterEnabled={temporalState.isActive}
                                    onUnpinAllNodes={() => setUnpinTrigger(prev => prev + 1)}
                                    onResetSimulation={() => setResetTrigger(prev => prev + 1)}
                                    edgeCrossings={edgeCrossings}
                                    isCalculatingEdgeCrossings={isCalculatingEdgeCrossings}
                                    forceTuning={forceTuning}
                                    onForceTuningChange={setForceTuning}
                                />
                            ),
                            defaultOpen: false
                        },
                        {
                            id: 'nodes',
                            title: 'Nodes',
                            icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            ),
                            content: (
                                <NodesSection
                                    nodeSizes={nodeSizes}
                                    onNodeSizeChange={(sizes) => setNodeSizes(sizes)}
                                    nodeIdSettings={nodeIdSettings}
                                    onNodeIdSettingsChange={(settings) => setNodeIdSettings(settings)}
                                />
                            ),
                            defaultOpen: false
                        },
                        {
                            id: 'edges',
                            title: 'Edges',
                            icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            ),
                            content: (
                                <EdgesSection
                                    edgeThickness={edgeThickness}
                                    onEdgeThicknessChange={(thickness) => setEdgeThickness(thickness)}
                                    edgeOpacity={edgeOpacity}
                                    onEdgeOpacityChange={(opacity) => setEdgeOpacity(opacity)}
                                    edgeLabelSettings={edgeLabelSettings}
                                    onEdgeLabelSettingsChange={(settings) => setEdgeLabelSettings(settings)}
                                    edgeMutationSettings={edgeMutationSettings}
                                    onEdgeMutationSettingsChange={(settings) => setEdgeMutationSettings(settings)}
                                />
                            ),
                            defaultOpen: false
                        },
                        {
                            id: 'view',
                            title: 'View Controls',
                            icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ),
                            content: (
                                <ViewControlsSection
                                    temporalFilterEnabled={temporalState.isActive}
                                    onTemporalFilterChange={(enabled) => {
                                        setTemporalState(prev => ({
                                            ...prev,
                                            isActive: enabled,
                                            range: enabled ? prev.range : [prev.minTime, prev.maxTime]
                                        }));
                                        if (enabled && isFilterSectionCollapsed) {
                                            setIsFilterSectionCollapsed(false);
                                        }
                                    }}
                                    temporalDimOpacity={temporalDimOpacity}
                                    onTemporalDimOpacityChange={(value) => setTemporalDimOpacity(Math.max(0, Math.min(0.99, value)))}
                                    layerRevealEnabled={layerReveal.isPlaying}
                                    layerRevealRate={layerReveal.rate}
                                    onLayerRevealRateChange={(rate) => setLayerReveal(prev => ({ ...prev, rate }))}
                                    onLayerRevealPlay={() => {
                                        if (!temporalState.isActive) {
                                            // Auto-enable temporal filter
                                            setTemporalState(prev => ({ ...prev, isActive: true }));
                                            setIsFilterSectionCollapsed(false);
                                        }
                                        setLayerReveal(prev => ({
                                            ...prev,
                                            isPlaying: true,
                                            currentProgress: 0,
                                            simulationPaused: true // Pause simulation during reveal
                                        }));
                                        // Reset to show only oldest layer
                                        setTemporalState(prev => ({
                                            ...prev,
                                            range: [prev.minTime, prev.minTime]
                                        }));
                                    }}
                                    onLayerRevealPause={() => setLayerReveal(prev => ({ ...prev, isPlaying: false, simulationPaused: false }))}
                                    onLayerRevealReset={() => {
                                        setLayerReveal(prev => ({
                                            ...prev,
                                            isPlaying: false,
                                            currentProgress: 0,
                                            simulationPaused: false
                                        }));
                                        setTemporalState(prev => ({
                                            ...prev,
                                            range: [prev.minTime, prev.minTime]
                                        }));
                                    }}
                                />
                            ),
                            defaultOpen: false
                        },
                        {
                            id: 'clustering',
                            title: 'Performance',
                            icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            ),
                            content: (
                                <ClusteringSection
                                    clusteringEnabled={clusteringEnabled}
                                    onClusteringEnabledChange={handleClusteringEnabledChange}
                                    clusteringMinTreeSize={clusteringMinTreeSize}
                                    onClusteringMinTreeSizeChange={setClusteringMinTreeSize}
                                    clusteringRequireDensity={clusteringRequireDensity}
                                    onClusteringRequireDensityChange={setClusteringRequireDensity}
                                    clusteringDensityIntensity={clusteringDensityIntensity}
                                    onClusteringDensityIntensityChange={setClusteringDensityIntensity}
                                    clusteringRequireTemporalCompactness={clusteringRequireTemporalCompactness}
                                    onClusteringRequireTemporalCompactnessChange={setClusteringRequireTemporalCompactness}
                                    clusteringTemporalIntensity={clusteringTemporalIntensity}
                                    onClusteringTemporalIntensityChange={setClusteringTemporalIntensity}
                                    nodeCount={data?.nodes.length}
                                    clusteredNodeCount={filteredData?.nodes.length}
                                />
                            ),
                            defaultOpen: wasAutoEnabled
                        },
                        {
                            id: 'information',
                            title: 'Information',
                            icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                            content: (
                                <InformationSection
                                    originalNodeCount={argStats?.originalNodes}
                                    originalEdgeCount={argStats?.originalEdges}
                                    subargNodeCount={argStats?.subArgNodes}
                                    subargEdgeCount={argStats?.subArgEdges}
                                    displayedNodeCount={argStats?.displayedNodes}
                                    displayedEdgeCount={argStats?.displayedEdges}
                                    genomicRange={isFilterActive ? genomicRange : undefined}
                                    sequenceLength={sequenceLength}
                                    isFiltered={isFilterActive}
                                />
                            ),
                            defaultOpen: false
                        }
                    ]}
                    />
                </div>
            </div>

            {/* Notification for auto-enabled clustering */}
            <AlertModal
                isOpen={showAutoClusteringNotification}
                title="Clustering Auto-Enabled"
                message="This graph has been automatically loaded with subtree-clustering enabled and dagre-d3 layout mode for optimal rendering performance due to its large size. You can adjust these settings from the sidebar if needed."
                buttonText="Got it"
                type="info"
                onClose={() => setShowAutoClusteringNotification(false)}
            />
        </div>
    );
}); 