import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { PopGenStats } from '@/components/ui/QuickActionsBar/panels/StatsPanel.types';

export interface UseWindowStatsOptions {
  filename: string | null;
  isGenomicFilterActive: boolean;
  filterMode: 'genomic' | 'tree';
  genomicStart?: number;
  genomicEnd?: number;
  treeStartIdx?: number;
  treeEndIdx?: number;
  sequenceLength: number;
}

export interface UseWindowStatsResult {
  windowStats: PopGenStats | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch population genetics statistics for a filtered genomic window.
 * Uses debouncing (expects debounced values) and only fetches when filters are active.
 */
export const useWindowStats = ({
  filename,
  isGenomicFilterActive,
  filterMode,
  genomicStart,
  genomicEnd,
  treeStartIdx,
  treeEndIdx,
  sequenceLength,
}: UseWindowStatsOptions): UseWindowStatsResult => {
  const [windowStats, setWindowStats] = useState<PopGenStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the last request to avoid race conditions
  const lastRequestRef = useRef<number>(0);

  useEffect(() => {
    // Don't fetch if no filename or filter is not active
    if (!filename || !isGenomicFilterActive) {
      setWindowStats(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check if we're viewing the full range (no need to fetch separate stats)
    const isFullGenomicRange = filterMode === 'genomic' &&
      genomicStart === 0 && genomicEnd === sequenceLength;

    if (isFullGenomicRange) {
      setWindowStats(null);
      setIsLoading(false);
      return;
    }

    const requestId = ++lastRequestRef.current;

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const options: {
          genomicStart?: number;
          genomicEnd?: number;
          treeStartIdx?: number;
          treeEndIdx?: number;
        } = {};

        if (filterMode === 'genomic') {
          if (genomicStart !== undefined) options.genomicStart = genomicStart;
          if (genomicEnd !== undefined) options.genomicEnd = genomicEnd;
        } else if (filterMode === 'tree') {
          if (treeStartIdx !== undefined) options.treeStartIdx = treeStartIdx;
          if (treeEndIdx !== undefined) options.treeEndIdx = treeEndIdx;
        }

        const response = await api.getWindowStatistics(filename, options);

        // Only update state if this is still the latest request
        if (requestId === lastRequestRef.current) {
          // The API returns stats with filter_metadata, extract just the stats
          const stats = response.data as PopGenStats & { filter_metadata?: unknown };
          // Remove filter_metadata from the stats object
          if (stats && 'filter_metadata' in stats) {
            delete stats.filter_metadata;
          }
          setWindowStats(stats);
          setIsLoading(false);
        }
      } catch (err) {
        // Only update state if this is still the latest request
        if (requestId === lastRequestRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch window statistics';
          setError(errorMessage);
          setWindowStats(null);
          setIsLoading(false);
        }
      }
    };

    fetchStats();
  }, [
    filename,
    isGenomicFilterActive,
    filterMode,
    genomicStart,
    genomicEnd,
    treeStartIdx,
    treeEndIdx,
    sequenceLength,
  ]);

  return {
    windowStats,
    isLoading,
    error,
  };
};
