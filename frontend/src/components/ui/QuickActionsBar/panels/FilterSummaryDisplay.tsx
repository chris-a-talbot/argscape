/**
 * FilterSummaryDisplay Component
 *
 * Displays a compact summary of active filters.
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { FilterSummaryDisplayProps } from './StatsPanel.types';

export const FilterSummaryDisplay: React.FC<FilterSummaryDisplayProps> = ({
  summary,
  className = '',
  onClearFilters,
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Check if any filters are active
  const hasActiveFilters =
    summary.genomicRange !== undefined ||
    summary.treeRange !== undefined ||
    summary.temporalRange !== undefined ||
    (summary.populationFilters && summary.populationFilters.length > 0) ||
    (summary.nodeTypeFilters && summary.nodeTypeFilters.length > 0);

  // Compact container matching other stats components
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    padding: '0.5rem',
    background: isLiquid ? 'rgba(20, 226, 168, 0.02)' : colors.hoverOverlay,
    borderRadius: '0.375rem',
    border: `1px solid ${colors.border}`,
  };

  const headerRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    fontWeight: 600,
    color: colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const clearButtonStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    padding: '0.125rem 0.375rem',
    background: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: '3px',
    color: colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const filterRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.25rem',
    fontSize: '0.75rem',
  };

  const labelStyle: React.CSSProperties = {
    color: colors.textSecondary,
    fontSize: '0.625rem',
  };

  const valueStyle: React.CSSProperties = {
    color: colors.text,
    fontWeight: 500,
  };

  const modeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.125rem 0.375rem',
    background: summary.mode === 'subset' ? `${colors.accentPrimary}20` : `${colors.warning}20`,
    color: summary.mode === 'subset' ? colors.accentPrimary : colors.warning,
    borderRadius: '3px',
    fontSize: '0.625rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  };

  const noFiltersStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: colors.textSecondary,
    fontStyle: 'italic',
    opacity: 0.7,
  };

  if (!hasActiveFilters) {
    return (
      <div className={className} style={containerStyle}>
        <div style={headerStyle}>Active Filters</div>
        <div style={noFiltersStyle}>No filters applied</div>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <div style={headerRowStyle}>
        <div style={headerStyle}>Active Filters</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={modeStyle}>{summary.mode}</span>
          {onClearFilters && (
            <button
              style={clearButtonStyle}
              onClick={onClearFilters}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.error;
                e.currentTarget.style.color = colors.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Compact filter list */}
      {summary.genomicRange && (
        <div style={filterRowStyle}>
          <span style={labelStyle}>Genomic:</span>
          <span style={valueStyle}>
            {formatNumber(summary.genomicRange.start)} - {formatNumber(summary.genomicRange.end)}
          </span>
        </div>
      )}

      {summary.treeRange && (
        <div style={filterRowStyle}>
          <span style={labelStyle}>Trees:</span>
          <span style={valueStyle}>
            {summary.treeRange.startIndex + 1}-{summary.treeRange.endIndex + 1} of {summary.treeRange.totalTrees}
          </span>
        </div>
      )}

      {summary.temporalRange && (
        <div style={filterRowStyle}>
          <span style={labelStyle}>Time:</span>
          <span style={valueStyle}>
            {summary.temporalRange.min.toFixed(0)} - {summary.temporalRange.max.toFixed(0)}
          </span>
        </div>
      )}

      {summary.populationFilters && summary.populationFilters.length > 0 && (
        <div style={filterRowStyle}>
          <span style={labelStyle}>Pops:</span>
          <span style={valueStyle}>{summary.populationFilters.join(', ')}</span>
        </div>
      )}

      {summary.nodeTypeFilters && summary.nodeTypeFilters.length > 0 && (
        <div style={filterRowStyle}>
          <span style={labelStyle}>Types:</span>
          <span style={valueStyle}>{summary.nodeTypeFilters.join(', ')}</span>
        </div>
      )}
    </div>
  );
};





