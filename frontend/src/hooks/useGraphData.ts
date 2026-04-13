import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { GraphData, SampleOrderType } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';
import { convertTreeIntervals } from '../utils/dataHelpers';
import { useSampleOrderOptimization } from './useSampleOrderOptimization';

export interface GraphDataState {
    data: GraphData | null;
    subArgData: GraphData | null;
    error: string | null;
    loading: boolean;
    isInitialized: boolean;
    isOptimizingSampleOrder: boolean;
    sequenceLength: number;
    treeIntervals: any[];
    temporalState: {
        isActive: boolean;
        minTime: number;
        maxTime: number;
        range: [number, number];
    };
}

export interface GraphDataActions {
    setData: (data: GraphData | null) => void;
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
}

export interface UseGraphDataResult extends GraphDataState, GraphDataActions {}

export interface GraphDataOptions {
    filename: string;
    max_samples: number;
    sampleOrder: SampleOrderType;
    genomicStart?: number;
    genomicEnd?: number;
    treeStartIdx?: number;
    treeEndIdx?: number;
    // Filtering state
    isFilterActive: boolean;
    filterMode: 'genomic' | 'tree';
    debouncedGenomicRange: [number, number];
    debouncedTreeRange: [number, number];
    genomicFilterMode: 'subset' | 'dim';
    treeFilterMode: 'subset' | 'dim';
    sequenceLength: number;
    treeIntervals: any[];
    // Clustering state
    clusteringEnabled: boolean;
    clusteringMinTreeSize: number;
    clusteringRequireDensity: boolean;
    clusteringDensityIntensity: number;
    clusteringTemporalIntensity: number;
    // Sample subsetting options
    sampleSubsetMode?: 'even' | 'random' | 'ids' | 'range' | 'population';
    sampleIds?: number[];
    sampleRangeStart?: number;
    sampleRangeEnd?: number;
    randomSeed?: number;
    samplePopulations?: number[];
}

export const useGraphData = (options: GraphDataOptions): UseGraphDataResult => {
    const [data, setData] = useState<GraphData | null>(null);
    const [subArgData, setSubArgData] = useState<GraphData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [sequenceLength, setSequenceLength] = useState<number>(0);
    const [treeIntervals, setTreeIntervals] = useState<any[]>([]);
    const [temporalState, setTemporalState] = useState({
        isActive: false,
        minTime: 0,
        maxTime: 1,
        range: [0, 1] as [number, number]
    });

    // Use sample order optimization hook
    const { isOptimizing: isOptimizingSampleOrder, optimizeSampleOrder } = useSampleOrderOptimization();

    // Cache for full graph data (before any subsetting) - keyed by filename, sampleOrder, max_samples
    const fullGraphCacheRef = useRef<{
        data: GraphData;
        key: string;
    } | null>(null);
    const [fullGraphCache, setFullGraphCache] = useState<{
        data: GraphData;
        key: string;
    } | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        fullGraphCacheRef.current = fullGraphCache;
    }, [fullGraphCache]);

    const {
        filename,
        max_samples,
        sampleOrder,
        genomicStart,
        genomicEnd,
        treeStartIdx,
        treeEndIdx,
        isFilterActive,
        filterMode,
        debouncedGenomicRange,
        debouncedTreeRange,
        genomicFilterMode,
        treeFilterMode,
        clusteringEnabled: _clusteringEnabled,
        clusteringMinTreeSize: _clusteringMinTreeSize,
        clusteringRequireDensity: _clusteringRequireDensity,
        clusteringDensityIntensity: _clusteringDensityIntensity,
        clusteringTemporalIntensity: _clusteringTemporalIntensity,
        // Sample subsetting
        sampleSubsetMode,
        sampleIds,
        sampleRangeStart,
        sampleRangeEnd,
        randomSeed,
        samplePopulations,
    } = options;

    // Initial data loading, including URL genomic/tree filters.
    useEffect(() => {
        // Create AbortController for this effect instance
        const abortController = new AbortController();
        let isMounted = true;

        const fetchInitialData = async () => {
            try {
                setLoading(true);

                // Build options including URL parameters
                const apiOptions: any = { maxSamples: max_samples, sampleOrder, signal: abortController.signal };

                // Add sample subsetting parameters
                if (sampleSubsetMode && sampleSubsetMode !== 'even') {
                    apiOptions.sampleSubsetMode = sampleSubsetMode;
                }
                if (sampleIds?.length) {
                    apiOptions.sampleIds = sampleIds;
                }
                if (sampleRangeStart !== undefined) {
                    apiOptions.sampleRangeStart = sampleRangeStart;
                }
                if (sampleRangeEnd !== undefined) {
                    apiOptions.sampleRangeEnd = sampleRangeEnd;
                }
                if (randomSeed !== undefined) {
                    apiOptions.randomSeed = randomSeed;
                }
                if (samplePopulations?.length) {
                    apiOptions.samplePopulations = samplePopulations;
                }

                // Temporal filtering is handled purely client-side (opacity dimming).
                // temporalStart/temporalEnd URL params are used by ForceDirectedGraphContainer
                // to auto-enable the temporal filter UI, not sent to the API.

                // Add genomic filtering if provided via URL
                if (genomicStart !== undefined && genomicEnd !== undefined) {
                    apiOptions.genomicStart = genomicStart;
                    apiOptions.genomicEnd = genomicEnd;
                } else if (treeStartIdx !== undefined && treeEndIdx !== undefined) {
                    apiOptions.treeStartIdx = treeStartIdx;
                    apiOptions.treeEndIdx = treeEndIdx;
                }

                let response = await api.getGraphData(filename, apiOptions);
                let graphData = response.data as GraphData;

                // Fall back to metadata if treeSequence context is still loading.
                const originalNodeCount = graphData.metadata.original_num_nodes || graphData.nodes.length;
                const shouldAutoEnableFromMetadata = originalNodeCount > 250;

                if (shouldAutoEnableFromMetadata) {
                    // Clustering state management should be handled by the clustering hook
                }

                // Optimize sample order using the dedicated hook
                const { optimizedData, optimizedOrder: _optimizedOrder } = await optimizeSampleOrder(
                    filename,
                    graphData,
                    sampleOrder,
                    apiOptions
                );

                // Use optimized data and order
                graphData = optimizedData;

                // Initialize genomic range settings (after optimization to use final data)
                if (graphData.metadata.sequence_length) {
                    setSequenceLength(graphData.metadata.sequence_length);
                }

                // Initialize tree intervals and range settings
                if (graphData.metadata.tree_intervals && graphData.metadata.tree_intervals.length > 0) {
                    const intervals = convertTreeIntervals(graphData.metadata.tree_intervals as unknown as [number, number, number][]);
                    setTreeIntervals(intervals);
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

                // Check if request was aborted or component unmounted
                if (abortController.signal.aborted || !isMounted) {
                    return;
                }

                // Validate data before setting it
                if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
                    console.error('[ForceDirectedGraph] Invalid graph data received:', graphData);
                    throw new Error('Received empty or invalid graph data');
                }

                // Cache full graph data if this is full data (not a subset from URL parameters)
                const isFullData = !genomicStart && !genomicEnd && !treeStartIdx && !treeEndIdx;
                if (isFullData) {
                    const cacheKey = `${filename}-${sampleOrder}-${max_samples}`;
                    setFullGraphCache({
                        data: graphData,
                        key: cacheKey
                    });
                }

                setIsInitialized(true);
                setData(graphData);
                setSubArgData(graphData); // Store SubARG data (what was loaded with max_samples)
                setError(null);

                // Ensure loading is cleared after data is set
                setLoading(false);
            } catch (e) {
                // Ignore abort errors - they're expected during cleanup
                if (e instanceof Error && e.name === 'AbortError') {
                    return;
                }
                // Only update state if still mounted
                if (!isMounted) return;

                console.error('[ForceDirectedGraph] Error fetching initial graph data:', e);
                const errorMessage = e instanceof Error ? e.message : 'An error occurred while fetching graph data';
                setError(errorMessage);
                setData(null);
                setLoading(false);
            }
        };

        // Reset initialization state when filename or max_samples change
        setIsInitialized(false);
        fullGraphCacheRef.current = null;
        setFullGraphCache(null);

        fetchInitialData();

        // Cleanup function: abort pending requests and mark as unmounted
        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [filename, max_samples, genomicStart, genomicEnd, treeStartIdx, treeEndIdx,
        sampleSubsetMode, sampleIds, sampleRangeStart, sampleRangeEnd, randomSeed, samplePopulations]);

    // Data loading with filtering and sample order changes
    useEffect(() => {
        // Skip if not initialized or if this is the initial load
        if (!isInitialized) {
            return;
        }

        // Create AbortController for this effect instance
        const abortController = new AbortController();
        let isMounted = true;

        // Create cache key for current configuration
        const cacheKey = `${filename}-${sampleOrder}-${max_samples}`;

        // Determine if we need to make an API call
        let needsApiCall = false;
        let genomicParams = null;
        let treeParams = null;
        let isRequestingFullData = false;

        if (isFilterActive) {
            if (filterMode === 'genomic') {
                // In 'dim' mode, don't make API calls - we'll dim elements client-side
                if (genomicFilterMode === 'dim') {
                    // Skip API call, we'll handle dimming in the visualization
                    needsApiCall = false;
                } else {
                    // Check if genomic range covers the full sequence
                    const isFullSequence = debouncedGenomicRange[0] === 0 && debouncedGenomicRange[1] === sequenceLength;
                    if (!isFullSequence) {
                        needsApiCall = true;
                        genomicParams = {
                            genomic_start: debouncedGenomicRange[0],
                            genomic_end: debouncedGenomicRange[1]
                        };
                    } else {
                        // Expanding to full range - check cache first
                        isRequestingFullData = true;
                    }
                }
            } else if (filterMode === 'tree') {
                // In 'dim' mode, don't make API calls - we'll dim elements client-side
                if (treeFilterMode === 'dim') {
                    // Skip API call, we'll handle dimming in the visualization
                    needsApiCall = false;
                } else {
                    // Check if tree range covers all trees
                    const isFullTreeRange = debouncedTreeRange[0] === 0 && debouncedTreeRange[1] === treeIntervals.length - 1;
                    if (!isFullTreeRange && treeIntervals.length > 0) {
                        needsApiCall = true;
                        treeParams = {
                            tree_start_idx: debouncedTreeRange[0],
                            tree_end_idx: debouncedTreeRange[1]
                        };
                    } else {
                        // Expanding to full range - check cache first
                        isRequestingFullData = true;
                    }
                }
            }
        } else {
            // No filter active - requesting full data
            isRequestingFullData = true;
        }

        // When switching to 'dim' mode, we need to restore full graph from cache if we have subset data
        if (!needsApiCall && !isRequestingFullData) {
            // Check if we're in 'dim' mode and have subset data that needs to be restored
            const isDimMode = (filterMode === 'genomic' && genomicFilterMode === 'dim') ||
                             (filterMode === 'tree' && treeFilterMode === 'dim');
            const cachedFullData = fullGraphCacheRef.current;

            if (isDimMode && cachedFullData && cachedFullData.key === cacheKey) {
                // Check if current data is a subset (has fewer nodes/edges than cached full data)
                const currentData = data;
                if (currentData && (
                    currentData.nodes.length < cachedFullData.data.nodes.length ||
                    currentData.edges.length < cachedFullData.data.edges.length ||
                    currentData.metadata.is_subset === true
                )) {
                    // Restore full graph from cache
                    const timeoutId = setTimeout(() => {
                        setData(cachedFullData.data);
                        setError(null);
                    }, 150);
                    return () => clearTimeout(timeoutId);
                }
            }

            // Check if we have data and the sample order in metadata matches current selection
            if (!data || data.metadata.sample_order !== sampleOrder) {
                needsApiCall = true;
                isRequestingFullData = true; // Sample order change means we need full data
            } else {
                return;
            }
        }

        // Check cache for full data if we're requesting full data
        const cachedFullData = fullGraphCacheRef.current;
        if (isRequestingFullData && !needsApiCall && cachedFullData && cachedFullData.key === cacheKey) {
            // Check if data is already set to cached data to prevent loops
            const currentData = data;
            const isAlreadyCached = currentData &&
                currentData.nodes.length === cachedFullData.data.nodes.length &&
                currentData.edges.length === cachedFullData.data.edges.length &&
                currentData.metadata.sequence_length === cachedFullData.data.metadata.sequence_length;

            if (!isAlreadyCached) {
                // Use setTimeout to delay the state update and prevent immediate re-trigger
                const timeoutId = setTimeout(() => {
                    setData(cachedFullData.data);
                    setError(null);
                }, 150); // Small delay to prevent loop

                // Return cleanup function to cancel timeout if effect re-runs
                return () => clearTimeout(timeoutId);
            }
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);

                let options: any = { maxSamples: max_samples, sampleOrder, signal: abortController.signal };

                // Add sample subsetting parameters
                if (sampleSubsetMode && sampleSubsetMode !== 'even') {
                    options.sampleSubsetMode = sampleSubsetMode;
                }
                if (sampleIds?.length) {
                    options.sampleIds = sampleIds;
                }
                if (sampleRangeStart !== undefined) {
                    options.sampleRangeStart = sampleRangeStart;
                }
                if (sampleRangeEnd !== undefined) {
                    options.sampleRangeEnd = sampleRangeEnd;
                }
                if (randomSeed !== undefined) {
                    options.randomSeed = randomSeed;
                }
                if (samplePopulations?.length) {
                    options.samplePopulations = samplePopulations;
                }

                // Temporal filtering is purely client-side; don't send to API.

                if (genomicParams) {
                    options.genomicStart = genomicParams.genomic_start;
                    options.genomicEnd = genomicParams.genomic_end;
                } else if (treeParams) {
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
                }

                const response = await api.getGraphData(filename, options);

                // Check if request was aborted or component unmounted
                if (abortController.signal.aborted || !isMounted) {
                    return;
                }

                const graphData = response.data as GraphData;

                // Cache full data if we just fetched it (no genomic/tree filtering)
                if (!genomicParams && !treeParams &&
                    !genomicStart && !genomicEnd &&
                    !treeStartIdx && !treeEndIdx) {
                    const cacheEntry = {
                        data: graphData,
                        key: cacheKey
                    };
                    fullGraphCacheRef.current = cacheEntry;
                    setFullGraphCache(cacheEntry);
                }

                setData(graphData);
                setError(null);
            } catch (e) {
                // Ignore abort errors - they're expected during cleanup
                if (e instanceof Error && e.name === 'AbortError') {
                    return;
                }
                // Only update state if still mounted
                if (!isMounted) return;

                console.error('Error fetching graph data:', e);
                setError(e instanceof Error ? e.message : 'An error occurred while fetching graph data');
                setData(null);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // Cleanup function: abort pending requests and mark as unmounted
        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [
        filename,
        max_samples,
        debouncedGenomicRange,
        debouncedTreeRange,
        isFilterActive,
        filterMode,
        genomicFilterMode,
        treeFilterMode,
        isInitialized,
        sequenceLength,
        treeIntervals,
        sampleOrder,
        sampleSubsetMode,
        sampleIds,
        sampleRangeStart,
        sampleRangeEnd,
        randomSeed,
        samplePopulations
    ]);

    // Cleanup on unmount - clear cache refs to prevent memory leaks
    useEffect(() => {
        return () => {
            fullGraphCacheRef.current = null;
        };
    }, []);

    return {
        data,
        subArgData,
        error,
        loading,
        isInitialized,
        isOptimizingSampleOrder,
        sequenceLength,
        treeIntervals,
        temporalState,
        setData,
        setError,
        setLoading,
    };
};
