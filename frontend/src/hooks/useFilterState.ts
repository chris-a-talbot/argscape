import { useState, useCallback } from 'react';
import { TreeInterval } from '../components/ForceDirectedGraph/ForceDirectedGraph.types';

export type FilterMode = 'genomic' | 'tree';
export type TemporalFilterMode = 'hide' | 'planes';

interface FilterState {
  // Genomic filtering
  genomicRange: [number, number];
  sequenceLength: number;
  isGenomicFilterActive: boolean;
  
  // Tree filtering  
  filterMode: FilterMode;
  treeRange: [number, number];
  treeIntervals: TreeInterval[];
  isFilterActive: boolean;
  
  // Temporal filtering
  temporalRange: [number, number];
  minTime: number;
  maxTime: number;
  isTemporalFilterActive: boolean;
  temporalFilterMode: TemporalFilterMode;
}

interface FilterActions {
  setGenomicRange: (range: [number, number]) => void;
  setSequenceLength: (length: number) => void;
  setIsGenomicFilterActive: (active: boolean) => void;
  setFilterMode: (mode: FilterMode) => void;
  setTreeRange: (range: [number, number]) => void;
  setTreeIntervals: (intervals: TreeInterval[]) => void;
  setIsFilterActive: (active: boolean) => void;
  setTemporalRange: (range: [number, number]) => void;
  setMinTime: (time: number) => void;
  setMaxTime: (time: number) => void;
  setIsTemporalFilterActive: (active: boolean) => void;
  setTemporalFilterMode: (mode: TemporalFilterMode) => void;
  
  // Helper methods
  initializeGenomicRange: (sequenceLength: number) => void;
  initializeTreeRange: (intervals: TreeInterval[]) => void;
  initializeTemporalRange: (minTime: number, maxTime: number) => void;
  toggleFilter: (sequenceLength: number, treeIntervals: TreeInterval[]) => void;
  changeFilterMode: (newMode: FilterMode, sequenceLength: number, treeIntervals: TreeInterval[]) => void;
}

export function useFilterState(): FilterState & FilterActions {
  // State
  const [genomicRange, setGenomicRange] = useState<[number, number]>([0, 0]);
  const [sequenceLength, setSequenceLength] = useState<number>(0);
  const [isGenomicFilterActive, setIsGenomicFilterActive] = useState(false);
  
  const [filterMode, setFilterMode] = useState<FilterMode>('genomic');
  const [treeRange, setTreeRange] = useState<[number, number]>([0, 0]);
  const [treeIntervals, setTreeIntervals] = useState<TreeInterval[]>([]);
  const [isFilterActive, setIsFilterActive] = useState(false);
  
  const [temporalRange, setTemporalRange] = useState<[number, number]>([0, 1]);
  const [minTime, setMinTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(1);
  const [isTemporalFilterActive, setIsTemporalFilterActive] = useState(false);
  const [temporalFilterMode, setTemporalFilterMode] = useState<TemporalFilterMode>('planes');

  // Helper methods
  const initializeGenomicRange = useCallback((sequenceLength: number) => {
    setSequenceLength(sequenceLength);
    const fullRange: [number, number] = [0, sequenceLength];
    setGenomicRange(fullRange);
  }, []);

  const initializeTreeRange = useCallback((intervals: TreeInterval[]) => {
    setTreeIntervals(intervals);
    const treeFullRange: [number, number] = [0, intervals.length - 1];
    setTreeRange(treeFullRange);
  }, []);

  const initializeTemporalRange = useCallback((minTime: number, maxTime: number) => {
    setMinTime(minTime);
    setMaxTime(maxTime);
    // Default to showing only the oldest time slice (minimum time)
    const oldestSliceRange: [number, number] = [minTime, minTime];
    setTemporalRange(oldestSliceRange);
  }, []);

  const toggleFilter = useCallback((sequenceLength: number, treeIntervals: TreeInterval[]) => {
    const newFilterState = !isFilterActive;
    setIsFilterActive(newFilterState);
    
    if (newFilterState) {
      if (filterMode === 'genomic') {
        setGenomicRange([0, sequenceLength]);
      } else if (filterMode === 'tree' && treeIntervals.length > 0) {
        const fullTreeRange: [number, number] = [0, treeIntervals.length - 1];
        setTreeRange(fullTreeRange);
      }
    }
  }, [isFilterActive, filterMode]);

  const changeFilterMode = useCallback((newMode: FilterMode, sequenceLength: number, treeIntervals: TreeInterval[]) => {
    setFilterMode(newMode);
    
    // Initialize the appropriate range when switching modes
    if (newMode === 'genomic') {
      setGenomicRange([0, sequenceLength]);
    } else if (newMode === 'tree' && treeIntervals.length > 0) {
      const fullTreeRange: [number, number] = [0, treeIntervals.length - 1];
      setTreeRange(fullTreeRange);
    }
  }, []);

  return {
    // State
    genomicRange,
    sequenceLength,
    isGenomicFilterActive,
    filterMode,
    treeRange,
    treeIntervals,
    isFilterActive,
    temporalRange,
    minTime,
    maxTime,
    isTemporalFilterActive,
    temporalFilterMode,
    
    // Actions
    setGenomicRange,
    setSequenceLength,
    setIsGenomicFilterActive,
    setFilterMode,
    setTreeRange,
    setTreeIntervals,
    setIsFilterActive,
    setTemporalRange,
    setMinTime,
    setMaxTime,
    setIsTemporalFilterActive,
    setTemporalFilterMode,
    
    // Helper methods
    initializeGenomicRange,
    initializeTreeRange,
    initializeTemporalRange,
    toggleFilter,
    changeFilterMode,
  };
} 