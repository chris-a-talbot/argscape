import { useState, useCallback, useEffect } from 'react';
import { TreeInterval } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

type FilterMode = 'genomic' | 'tree';

export interface TemporalState {
    isActive: boolean;
    minTime: number;
    maxTime: number;
    range: [number, number];
}

export interface FilteringState {
    // Filter control
    isFilterActive: boolean;
    filterMode: FilterMode;
    isFilterSectionCollapsed: boolean;

    // Genomic filtering
    genomicRange: [number, number];
    debouncedGenomicRange: [number, number];
    isUpdatingGenomicRange: boolean;
    genomicFilterMode: 'subset' | 'dim';
    genomicDimOpacity: number;

    // Tree filtering
    treeRange: [number, number];
    debouncedTreeRange: [number, number];
    isUpdatingTreeRange: boolean;
    treeIntervals: TreeInterval[];
    treeFilterMode: 'subset' | 'dim';
    treeDimOpacity: number;

    // Temporal filtering
    temporalState: TemporalState;
    temporalFilterMode: 'subset' | 'dim';
    temporalDimOpacity: number;
}

export interface FilteringActions {
    setIsFilterActive: (active: boolean) => void;
    setFilterMode: (mode: FilterMode) => void;
    setIsFilterSectionCollapsed: (collapsed: boolean) => void;

    setGenomicRange: (range: [number, number]) => void;
    setGenomicFilterMode: (mode: 'subset' | 'dim') => void;
    setGenomicDimOpacity: (opacity: number) => void;

    setTreeRange: (range: [number, number]) => void;
    setTreeFilterMode: (mode: 'subset' | 'dim') => void;
    setTreeDimOpacity: (opacity: number) => void;

    setTemporalState: (state: TemporalState | ((prev: TemporalState) => TemporalState)) => void;
    setTemporalFilterMode: (mode: 'subset' | 'dim') => void;
    setTemporalDimOpacity: (opacity: number) => void;

    // Handlers
    handleGenomicRangeChange: (newRange: [number, number]) => void;
    handleTreeRangeChange: (newRange: [number, number]) => void;
    handleToggleFilter: () => void;
    handleFilterModeChange: (newMode: FilterMode) => void;
}

export interface UseFilteringStateResult extends FilteringState, FilteringActions {}

export const useFilteringState = (
    sequenceLength: number,
    initialTreeIntervals: TreeInterval[] = []
): UseFilteringStateResult => {
    // Filter control state
    const [isFilterActive, setIsFilterActive] = useState(false);
    const [filterMode, setFilterMode] = useState<FilterMode>('genomic');
    const [isFilterSectionCollapsed, setIsFilterSectionCollapsed] = useState(true);

    // Genomic filtering state - initialize to full range when sequenceLength is available
    const [genomicRange, setGenomicRange] = useState<[number, number]>([0, sequenceLength]);
    const [debouncedGenomicRange, setDebouncedGenomicRange] = useState<[number, number]>([0, sequenceLength]);
    const [isUpdatingGenomicRange, setIsUpdatingGenomicRange] = useState(false);
    const [genomicFilterMode, setGenomicFilterMode] = useState<'subset' | 'dim'>('dim');
    const [genomicDimOpacity, setGenomicDimOpacity] = useState<number>(0.30);

    // Tree filtering state - initialize to full range when treeIntervals are available
    const initialTreeMax = initialTreeIntervals.length > 0 ? initialTreeIntervals.length - 1 : 0;
    const [treeRange, setTreeRange] = useState<[number, number]>([0, initialTreeMax]);
    const [debouncedTreeRange, setDebouncedTreeRange] = useState<[number, number]>([0, initialTreeMax]);
    const [isUpdatingTreeRange, setIsUpdatingTreeRange] = useState(false);
    const [treeIntervals, setTreeIntervals] = useState<TreeInterval[]>(initialTreeIntervals);
    const [treeFilterMode, setTreeFilterMode] = useState<'subset' | 'dim'>('dim');
    const [treeDimOpacity, setTreeDimOpacity] = useState<number>(0.30);

    // Temporal filtering state
    const [temporalState, setTemporalState] = useState<TemporalState>({
        isActive: false,
        minTime: 0,
        maxTime: 1,
        range: [0, 1]
    });
    const [temporalFilterMode, setTemporalFilterMode] = useState<'subset' | 'dim'>('dim');
    const [temporalDimOpacity, setTemporalDimOpacity] = useState<number>(0.05);

    // Debounce genomic range changes to prevent excessive API calls
    useEffect(() => {
        if (isFilterActive && filterMode === 'genomic') {
            setIsUpdatingGenomicRange(true);
        }

        const timer = setTimeout(() => {
            setDebouncedGenomicRange(genomicRange);
            setIsUpdatingGenomicRange(false);
        }, 750); // Increased to 750ms to prevent rapid-fire API calls during slider movement

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
        }, 750); // Increased to 750ms to prevent rapid-fire API calls during slider movement

        return () => clearTimeout(timer);
    }, [treeRange, isFilterActive, filterMode]);

    // Update tree intervals when provided
    useEffect(() => {
        setTreeIntervals(initialTreeIntervals);
        // Also update tree range to full range when intervals change
        if (initialTreeIntervals.length > 0) {
            const fullTreeRange: [number, number] = [0, initialTreeIntervals.length - 1];
            setTreeRange(fullTreeRange);
            setDebouncedTreeRange(fullTreeRange);
        }
    }, [initialTreeIntervals]);

    // Update genomic range to full range when sequence length changes
    useEffect(() => {
        if (sequenceLength > 0) {
            setGenomicRange([0, sequenceLength]);
            setDebouncedGenomicRange([0, sequenceLength]);
        }
    }, [sequenceLength]);

    // Auto-collapse filter section when filters are inactive, but only on initialization
    useEffect(() => {
        if (!isFilterActive) {
            setIsFilterSectionCollapsed(true);
        }
    }, [isFilterActive]);

    // Handlers
    const handleGenomicRangeChange = useCallback((newRange: [number, number]) => {
        // Only update if the range actually changed to avoid unnecessary rerenders
        if (newRange[0] !== genomicRange[0] || newRange[1] !== genomicRange[1]) {
            setGenomicRange(newRange);
            // Auto-activate filter when range changes from full range
            const isFullRange = newRange[0] === 0 && newRange[1] === sequenceLength;
            if (!isFullRange && !isFilterActive) {
                setIsFilterActive(true);
                setFilterMode('genomic');
            } else if (isFullRange && isFilterActive && filterMode === 'genomic') {
                // Deactivate if returned to full range
                setIsFilterActive(false);
            }
        }
    }, [genomicRange, sequenceLength, isFilterActive, filterMode]);

    const handleTreeRangeChange = useCallback((newRange: [number, number]) => {
        // Only update if the range actually changed to avoid unnecessary rerenders
        if (newRange[0] !== treeRange[0] || newRange[1] !== treeRange[1]) {
            setTreeRange(newRange);
            // Auto-activate filter when range changes from full range
            const isFullRange = treeIntervals.length > 0 && newRange[0] === 0 && newRange[1] === treeIntervals.length - 1;
            if (!isFullRange && !isFilterActive) {
                setIsFilterActive(true);
                setFilterMode('tree');
            } else if (isFullRange && isFilterActive && filterMode === 'tree') {
                // Deactivate if returned to full range
                setIsFilterActive(false);
            }
        }
    }, [treeRange, treeIntervals, isFilterActive, filterMode]);

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
            // Deactivating filter - collapse controls
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

    return {
        // State
        isFilterActive,
        filterMode,
        isFilterSectionCollapsed,
        genomicRange,
        debouncedGenomicRange,
        isUpdatingGenomicRange,
        genomicFilterMode,
        genomicDimOpacity,
        treeRange,
        debouncedTreeRange,
        isUpdatingTreeRange,
        treeIntervals,
        treeFilterMode,
        treeDimOpacity,
        temporalState,
        temporalFilterMode,
        temporalDimOpacity,

        // Actions
        setIsFilterActive,
        setFilterMode,
        setIsFilterSectionCollapsed,
        setGenomicRange,
        setGenomicFilterMode,
        setGenomicDimOpacity,
        setTreeRange,
        setTreeFilterMode,
        setTreeDimOpacity,
        setTemporalState,
        setTemporalFilterMode,
        setTemporalDimOpacity,

        // Handlers
        handleGenomicRangeChange,
        handleTreeRangeChange,
        handleToggleFilter,
        handleFilterModeChange,
    };
};
