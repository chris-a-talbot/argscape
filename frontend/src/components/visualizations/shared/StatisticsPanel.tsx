import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { CollapsibleSection } from '../../ui/CollapsibleSection';

interface StatisticsPanelProps {
  filename: string;
  genomicRange?: [number, number] | null;
  temporalRange?: [number, number] | null;
  treeRange?: [number, number] | null;
  isActive: boolean; // Whether filtering is active
  className?: string;
  sequenceLength?: number;
}

interface Statistics {
  nucleotide_diversity?: number | null;
  wattersons_theta?: number | null;
  tajimas_d?: number | null;
  segregating_sites?: number | null;
  mean_tree_height?: number | null;
  median_tree_height?: number | null;
  mean_tree_length?: number | null;
  median_tree_length?: number | null;
  tmrca?: number | null;
  mean_tmrca?: number | null;
  median_tmrca?: number | null;
  ne_watterson?: number | null;
  ne_pi?: number | null;
  estimated_recombination_rate?: number | null;
  mean_ld_r2?: number | null;
  median_ld_r2?: number | null;
  min_ld_r2?: number | null;
  max_ld_r2?: number | null;
  fst?: number | null;
  num_populations?: number | null;
  mean_divergence?: number | null;
  median_divergence?: number | null;
  min_divergence?: number | null;
  max_divergence?: number | null;
}

interface FilterMetadata {
  genomic_start?: number | null;
  genomic_end?: number | null;
  temporal_start?: number | null;
  temporal_end?: number | null;
  filtered_sequence_length?: number;
  filtered_num_nodes?: number;
  filtered_num_trees?: number;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  filename,
  genomicRange,
  temporalRange,
  treeRange,
  isActive,
  className = '',
  sequenceLength
}) => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [filterMetadata, setFilterMetadata] = useState<FilterMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce statistics fetching
  useEffect(() => {
    if (!filename || !isActive) {
      setStatistics(null);
      setFilterMetadata(null);
      return;
    }

    const fetchStatistics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const options: {
          genomicStart?: number;
          genomicEnd?: number;
          temporalStart?: number;
          temporalEnd?: number;
          treeStartIdx?: number;
          treeEndIdx?: number;
        } = {};

        // Always send genomic range if provided (even if it's the full range)
        // The backend will handle it appropriately
        if (genomicRange && sequenceLength) {
          // Only send if it's actually different from full range
          if (genomicRange[0] !== 0 || genomicRange[1] !== sequenceLength) {
            options.genomicStart = genomicRange[0];
            options.genomicEnd = genomicRange[1];
          }
        }

        // Always send temporal range if provided
        // Note: Backend temporal filtering is not fully implemented yet
        if (temporalRange && temporalRange[0] !== undefined && temporalRange[1] !== undefined) {
          options.temporalStart = temporalRange[0];
          options.temporalEnd = temporalRange[1];
        }

        // Send tree index range if provided
        if (treeRange && treeRange[0] !== undefined && treeRange[1] !== undefined) {
          options.treeStartIdx = treeRange[0];
          options.treeEndIdx = treeRange[1];
        }

        const response = await api.getStatisticsForRange(filename, options);
        const data = response.data as Statistics & { filter_metadata?: FilterMetadata };
        
        // Force update by creating a new object reference
        setStatistics({ ...data });
        if (data.filter_metadata) {
          setFilterMetadata({ ...data.filter_metadata });
        } else {
          setFilterMetadata(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
        setError(errorMessage);
        console.error('Error fetching statistics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce: wait 500ms after filter changes before fetching
    const timeoutId = setTimeout(fetchStatistics, 500);
    return () => clearTimeout(timeoutId);
  }, [filename, genomicRange?.[0], genomicRange?.[1], temporalRange?.[0], temporalRange?.[1], treeRange?.[0], treeRange?.[1], isActive, sequenceLength]);

  // Don't render if no filtering is active
  if (!isActive) {
    return null;
  }

  const hasStatistics = statistics !== null && Object.keys(statistics).length > 0;

  return (
    <div className={className}>
      <CollapsibleSection
        title="Range Statistics"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
        subtitle="Statistics for filtered range"
        defaultOpen={true}
      >
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-sp-pale-green border-t-transparent"></div>
            <span className="ml-3 text-sp-white/70">Computing statistics...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-sm text-red-200">
            <p className="font-semibold">Error loading statistics</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        )}

        {!isLoading && !error && hasStatistics && (
          <div className="space-y-4 mt-4">
            {/* Filter Info */}
            {(filterMetadata || genomicRange || temporalRange) && (
              <div className="bg-sp-dark-blue/30 border border-sp-pale-green/20 rounded-lg p-2 text-xs">
                {genomicRange && (
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sp-white/70">Genomic range:</span>
                    <span className="font-mono text-sp-white">
                      {genomicRange[0].toLocaleString()} - {genomicRange[1].toLocaleString()} bp
                    </span>
                  </div>
                )}
                {temporalRange && (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sp-white/70">Temporal range:</span>
                      <span className="font-mono text-sp-white">
                        {temporalRange[0].toFixed(2)} - {temporalRange[1].toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-yellow-400/70 mt-1 italic">
                      Note: Temporal filtering for statistics is not yet fully implemented
                    </div>
                  </>
                )}
                {filterMetadata?.filtered_num_nodes && (
                  <div className="flex justify-between items-center">
                    <span className="text-sp-white/70">Nodes in range:</span>
                    <span className="font-mono text-sp-white">{filterMetadata.filtered_num_nodes.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Diversity Statistics */}
              {(statistics.nucleotide_diversity !== null && statistics.nucleotide_diversity !== undefined) ||
               (statistics.wattersons_theta !== null && statistics.wattersons_theta !== undefined) ||
               (statistics.tajimas_d !== null && statistics.tajimas_d !== undefined) ? (
                <div className="bg-sp-dark-blue/50 border border-sp-pale-green/20 rounded-lg p-3">
                  <h5 className="text-sm font-semibold text-sp-pale-green mb-2">Diversity</h5>
                  <div className="space-y-1.5 text-xs">
                    {statistics.nucleotide_diversity !== null && statistics.nucleotide_diversity !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sp-white/70">π:</span>
                        <span className="font-mono text-sp-white">
                          {statistics.nucleotide_diversity.toExponential(3)}
                        </span>
                      </div>
                    )}
                    {statistics.wattersons_theta !== null && statistics.wattersons_theta !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sp-white/70">θ:</span>
                        <span className="font-mono text-sp-white">
                          {statistics.wattersons_theta.toExponential(3)}
                        </span>
                      </div>
                    )}
                    {statistics.tajimas_d !== null && statistics.tajimas_d !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sp-white/70">Tajima's D:</span>
                        <span className="font-mono text-sp-white">
                          {statistics.tajimas_d.toFixed(3)}
                        </span>
                      </div>
                    )}
                    {statistics.segregating_sites !== null && statistics.segregating_sites !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sp-white/70">Seg. sites:</span>
                        <span className="font-mono text-sp-white">
                          {statistics.segregating_sites.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Tree Topology */}
              {(statistics.mean_tree_height !== null && statistics.mean_tree_height !== undefined) ||
               (statistics.tmrca !== null && statistics.tmrca !== undefined) ? (
                <div className="bg-sp-dark-blue/50 border border-sp-pale-green/20 rounded-lg p-3">
                  <h5 className="text-sm font-semibold text-sp-pale-green mb-2">Tree Topology</h5>
                  <div className="space-y-1.5 text-xs">
                    {statistics.mean_tree_height !== null && statistics.mean_tree_height !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sp-white/70">Mean height:</span>
                        <span className="font-mono text-sp-white">
                          {statistics.mean_tree_height.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {statistics.tmrca !== null && statistics.tmrca !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sp-white/70">TMRCA:</span>
                        <span className="font-mono text-sp-white">
                          {statistics.tmrca.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {statistics.mean_tree_length !== null && statistics.mean_tree_length !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sp-white/70">Mean length:</span>
                        <span className="font-mono text-sp-white">
                          {statistics.mean_tree_length.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Population Structure */}
              {(statistics.fst !== null && statistics.fst !== undefined) ||
               (statistics.mean_divergence !== null && statistics.mean_divergence !== undefined) ? (
                <div className="bg-sp-dark-blue/50 border border-sp-pale-green/20 rounded-lg p-3">
                  <h5 className="text-sm font-semibold text-sp-pale-green mb-2">Population Structure</h5>
                  <div className="space-y-1.5 text-xs">
                    {statistics.fst !== null && statistics.fst !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sp-white/70">Fst:</span>
                        <span className="font-mono text-sp-white">
                          {statistics.fst.toFixed(4)}
                        </span>
                      </div>
                    )}
                    {statistics.mean_divergence !== null && statistics.mean_divergence !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sp-white/70">Mean div.:</span>
                        <span className="font-mono text-sp-white">
                          {statistics.mean_divergence.toExponential(3)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {!isLoading && !error && !hasStatistics && (
          <div className="text-center py-4 text-sp-white/50 text-sm">
            No statistics available for this range
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
};

