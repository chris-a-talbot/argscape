/**
 * PopGenStatsDisplay Component
 *
 * Displays population genetics statistics with support for:
 * - Full sequence stats (always shown)
 * - Window-specific stats (side-by-side comparison when genomic filtering is active)
 * - Collapsible advanced stats section
 *
 * Styled to match SequenceStatsDisplay and NodeEdgeCountDisplay.
 */

import React, { useState } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { PopGenStatsDisplayProps, PopGenStats } from './StatsPanel.types';

// Format a number for display
const formatValue = (value: number | null | undefined, decimals: number = 4): string => {
  if (value === null || value === undefined) return '—';
  if (Math.abs(value) < 0.0001 && value !== 0) {
    return value.toExponential(2);
  }
  return value.toFixed(decimals);
};

// Format large numbers with commas
const formatInt = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return Math.round(value).toLocaleString();
};

// Core stats that are always shown
const CORE_STATS: { key: keyof PopGenStats; label: string; symbol?: string; decimals?: number; isInt?: boolean }[] = [
  { key: 'nucleotide_diversity', label: 'Nucleotide div.', symbol: 'π', decimals: 6 },
  { key: 'wattersons_theta', label: "Watterson's θ", decimals: 6 },
  { key: 'tajimas_d', label: "Tajima's D", decimals: 4 },
  { key: 'segregating_sites', label: 'Seg. sites', isInt: true },
  { key: 'tmrca', label: 'TMRCA', decimals: 2 },
];

// Advanced stats (shown in expandable section)
const ADVANCED_STATS: { key: keyof PopGenStats; label: string; decimals?: number; isInt?: boolean }[] = [
  { key: 'mean_tree_height', label: 'Mean tree height', decimals: 2 },
  { key: 'median_tree_height', label: 'Median tree height', decimals: 2 },
  { key: 'mean_tree_length', label: 'Mean tree length', decimals: 2 },
  { key: 'median_tree_length', label: 'Median tree length', decimals: 2 },
  { key: 'ne_watterson', label: 'Ne (Watterson)', isInt: true },
  { key: 'ne_pi', label: 'Ne (Pi)', isInt: true },
  { key: 'estimated_recombination_rate', label: 'Recomb. rate', decimals: 10 },
  { key: 'mean_ld_r2', label: 'Mean LD r²', decimals: 4 },
];

// Population structure stats
const POPULATION_STATS: { key: keyof PopGenStats; label: string; decimals?: number }[] = [
  { key: 'fst', label: 'FST', decimals: 4 },
  { key: 'mean_divergence', label: 'Mean divergence', decimals: 6 },
];

export const PopGenStatsDisplay: React.FC<PopGenStatsDisplayProps> = ({
  fullStats,
  windowStats,
  windowStatsLoading = false,
  isGenomicFilterActive = false,
  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Check if we have any stats to show
  const hasFullStats = fullStats && Object.values(fullStats).some(v => v !== null && v !== undefined);
  const hasWindowStats = windowStats && Object.values(windowStats).some(v => v !== null && v !== undefined);
  const showComparison = isGenomicFilterActive && (hasWindowStats || windowStatsLoading);
  const hasMultiplePopulations = (fullStats?.num_populations ?? 0) > 1;

  if (!hasFullStats) {
    return null;
  }

  // Styles matching other stats components
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem',
    background: isLiquid ? 'rgba(20, 226, 168, 0.02)' : colors.hoverOverlay,
    borderRadius: '0.375rem',
    border: `1px solid ${colors.border}`,
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    fontWeight: 600,
    color: colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  // Grid layout: label column + value columns (1 or 2 depending on comparison mode)
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: showComparison ? 'auto 1fr 1fr' : 'auto 1fr',
    gap: '0.25rem 0.5rem',
    alignItems: 'center',
    fontSize: '0.75rem',
  };

  const labelCellStyle: React.CSSProperties = {
    color: colors.textSecondary,
    fontWeight: 500,
    fontSize: '0.6875rem',
  };

  const valueCellStyle: React.CSSProperties = {
    color: colors.text,
    fontWeight: 600,
    textAlign: 'right',
    fontFamily: 'monospace',
    fontSize: '0.6875rem',
  };

  const headerCellStyle: React.CSSProperties = {
    color: colors.textSecondary,
    fontSize: '0.625rem',
    textAlign: 'right',
    opacity: 0.7,
  };

  const expandButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0',
    fontSize: '0.625rem',
    color: colors.accentPrimary,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    marginTop: '0.125rem',
  };

  const loadingStyle: React.CSSProperties = {
    color: colors.textSecondary,
    fontStyle: 'italic',
  };

  const renderStatValue = (stats: PopGenStats | null | undefined, stat: typeof CORE_STATS[0]): string => {
    if (!stats) return '—';
    const value = stats[stat.key];
    if (stat.isInt) {
      return formatInt(value as number | null | undefined);
    }
    return formatValue(value as number | null | undefined, stat.decimals);
  };

  const renderStatsGrid = (stats: typeof CORE_STATS | typeof ADVANCED_STATS) => {
    // Filter out stats that have no value in either full or window
    const relevantStats = stats.filter(stat => {
      const fullValue = fullStats?.[stat.key];
      const windowValue = windowStats?.[stat.key];
      return (fullValue !== null && fullValue !== undefined) ||
             (windowValue !== null && windowValue !== undefined);
    });

    if (relevantStats.length === 0) return null;

    return (
      <div style={gridStyle}>
        {/* Header row */}
        <div></div>
        {showComparison ? (
          <>
            <div style={headerCellStyle}>Full</div>
            <div style={headerCellStyle}>Window</div>
          </>
        ) : (
          <div style={headerCellStyle}>Value</div>
        )}

        {/* Stat rows */}
        {relevantStats.map(stat => (
          <React.Fragment key={stat.key}>
            <div style={labelCellStyle}>
              {stat.label}
              {'symbol' in stat && (stat as { symbol?: string }).symbol && (
                <span style={{ fontStyle: 'italic', marginLeft: '0.25rem', opacity: 0.7 }}>
                  ({(stat as { symbol?: string }).symbol})
                </span>
              )}
            </div>
            {showComparison ? (
              <>
                <div style={valueCellStyle}>
                  {renderStatValue(fullStats, stat)}
                </div>
                <div style={valueCellStyle}>
                  {windowStatsLoading ? (
                    <span style={loadingStyle}>...</span>
                  ) : (
                    renderStatValue(windowStats, stat)
                  )}
                </div>
              </>
            ) : (
              <div style={valueCellStyle}>
                {renderStatValue(fullStats, stat)}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Check if there are any advanced stats to show
  const hasAdvancedStats = ADVANCED_STATS.some(stat => {
    const value = fullStats?.[stat.key];
    return value !== null && value !== undefined;
  });

  // Check if there are population stats to show
  const hasPopulationStats = hasMultiplePopulations && POPULATION_STATS.some(stat => {
    const value = fullStats?.[stat.key];
    return value !== null && value !== undefined;
  });

  return (
    <div style={containerStyle} className={className}>
      <div style={headerStyle}>Population Genetics</div>

      {/* Core stats */}
      {renderStatsGrid(CORE_STATS)}

      {/* Population structure stats (if multiple populations) */}
      {hasPopulationStats && (
        <>
          <div style={{ ...headerStyle, marginTop: '0.25rem', fontSize: '0.5625rem', opacity: 0.8 }}>
            Population Structure
          </div>
          {renderStatsGrid(POPULATION_STATS)}
        </>
      )}

      {/* Expandable advanced stats */}
      {hasAdvancedStats && (
        <>
          <button
            style={expandButtonStyle}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              ▶
            </span>
            {showAdvanced ? 'Hide advanced' : 'Show advanced'}
          </button>

          {showAdvanced && renderStatsGrid(ADVANCED_STATS)}
        </>
      )}
    </div>
  );
};

export default PopGenStatsDisplay;
