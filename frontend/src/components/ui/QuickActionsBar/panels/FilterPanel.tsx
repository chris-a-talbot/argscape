/**
 * FilterPanel Component
 *
 * Filter controls panel for Quick Actions Bar.
 * Shows toggles to enable/disable filters - actual sliders appear
 * persistently alongside the visualization when enabled.
 *
 * Features:
 * - Two-column layout with Genomic and Temporal toggles side by side
 * - Type selector (Position/Tree) for genomic filter when both are available
 * - Mode toggle and opacity controls are part of the slider components
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { FilterPanelProps, TemporalFilterMode } from './FilterPanel.types';
import { Tooltip } from '../../tooltip';

// Temporal filter mode options
const TEMPORAL_MODE_OPTIONS: { value: TemporalFilterMode; label: string }[] = [
  { value: 'hide', label: 'Hide' },
  { value: 'planes', label: 'Planes' },
  { value: 'hybrid', label: 'Hybrid' },
];

// Tooltip content for temporal modes
const TEMPORAL_MODE_TOOLTIP = (
  <div>
    <p style={{ marginBottom: '0.5rem' }}>
      <strong>Hide:</strong> Removes nodes outside the time range entirely.
    </p>
    <p style={{ marginBottom: '0.5rem' }}>
      <strong>Planes:</strong> Shows all nodes; dims those outside range with opacity.
    </p>
    <p>
      <strong>Hybrid:</strong> Hides nodes AND shows temporal plane markers.
    </p>
  </div>
);

export const FilterPanel: React.FC<FilterPanelProps> = ({
  genomicFilter,
  treeFilter,
  temporalFilter,
  filterType = 'genomic',
  onFilterTypeChange,
  spatialFilterEnabled = false,
  onSpatialFilterToggle,
  temporalFilterEnabled = false,
  onTemporalFilterToggle,
  temporalFilterMode = 'planes',
  onTemporalFilterModeChange,
  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  // Check what filters are available
  const hasGenomicFilter = genomicFilter?.enabled && genomicFilter.sequenceLength > 0;
  const hasTreeFilter = treeFilter?.enabled && treeFilter.treeIntervals.length > 0;
  const hasTemporalFilter = temporalFilter?.enabled && temporalFilter.max > temporalFilter.min;
  const hasAnyFilter = hasGenomicFilter || hasTreeFilter || hasTemporalFilter;
  const hasSpatialFilter = hasGenomicFilter || hasTreeFilter;
  const hasBothSpatialFilters = hasGenomicFilter && hasTreeFilter;

  // Styles
  const containerStyle: React.CSSProperties = {
    width: '100%',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    fontWeight: 600,
    color: colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const iconStyle: React.CSSProperties = {
    color: colors.accentPrimary,
    opacity: 0.8,
  };

  const noFiltersStyle: React.CSSProperties = {
    padding: '1rem',
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: '0.75rem',
  };

  const toggleButtonStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '1.5rem',
    fontSize: '0.625rem',
    fontWeight: 600,
    border: `1px solid ${isActive ? colors.accentPrimary : colors.border}`,
    borderRadius: '0.75rem',
    background: isActive
      ? colors.accentPrimary
      : 'transparent',
    color: isActive ? colors.background : colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const filterTypeButtonStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    fontSize: '0.6875rem',
    fontWeight: 500,
    border: `1px solid ${isActive ? colors.accentPrimary : colors.border}`,
    borderRadius: '0.25rem',
    background: isActive
      ? (isLiquid ? 'rgba(20, 226, 168, 0.15)' : `${colors.accentPrimary}20`)
      : 'transparent',
    color: isActive ? colors.accentPrimary : colors.text,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  // Icons
  const GenomicIcon = (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={iconStyle}>
      <path
        d="M2 8h12M8 2v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const TreeIcon = (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={iconStyle}>
      <path
        d="M8 2v4M8 6l-3 3M8 6l3 3M5 9v2M11 9v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const TimeIcon = (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={iconStyle}>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 4.5v3.5l2.5 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!hasAnyFilter) {
    return (
      <div style={containerStyle} className={className}>
        <div style={noFiltersStyle}>
          No filtering options available for this dataset.
        </div>
      </div>
    );
  }

  // Two-column grid layout
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: hasSpatialFilter && hasTemporalFilter ? '1fr 1fr' : '1fr',
    gap: '0.5rem',
  };

  const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    padding: '0.5rem',
    background: isLiquid ? 'rgba(20, 226, 168, 0.02)' : colors.hoverOverlay,
    borderRadius: '0.375rem',
    border: `1px solid ${colors.border}`,
  };

  const columnHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  };

  return (
    <div style={containerStyle} className={className}>
      <div style={gridStyle}>
        {/* Genomic Filter Toggle */}
        {hasSpatialFilter && onSpatialFilterToggle && (
          <div style={columnStyle}>
            <div style={columnHeaderStyle}>
              <span style={sectionHeaderStyle}>Genomic</span>
              <button
                onClick={() => onSpatialFilterToggle(!spatialFilterEnabled)}
                style={toggleButtonStyle(spatialFilterEnabled)}
              >
                {spatialFilterEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            {/* Type selector if both available */}
            {hasBothSpatialFilters && onFilterTypeChange && (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={() => onFilterTypeChange('genomic')}
                  style={filterTypeButtonStyle(filterType === 'genomic')}
                >
                  {GenomicIcon}
                  <span>Pos</span>
                </button>
                <button
                  onClick={() => onFilterTypeChange('tree')}
                  style={filterTypeButtonStyle(filterType === 'tree')}
                >
                  {TreeIcon}
                  <span>Tree</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Temporal Filter Toggle */}
        {hasTemporalFilter && onTemporalFilterToggle && (
          <div style={columnStyle}>
            <div style={columnHeaderStyle}>
              <span style={sectionHeaderStyle}>Temporal</span>
              <button
                onClick={() => onTemporalFilterToggle(!temporalFilterEnabled)}
                style={toggleButtonStyle(temporalFilterEnabled)}
              >
                {temporalFilterEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div style={{ fontSize: '0.625rem', color: colors.textSecondary }}>
              {temporalFilter!.min.toFixed(0)} - {temporalFilter!.max.toFixed(0)}
            </div>
            {/* Temporal Mode Selector - only show when enabled and handler exists */}
            {temporalFilterEnabled && onTemporalFilterModeChange && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.625rem', color: colors.textSecondary }}>Mode</span>
                  <Tooltip content={TEMPORAL_MODE_TOOLTIP} />
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {TEMPORAL_MODE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onTemporalFilterModeChange(opt.value)}
                      style={filterTypeButtonStyle(temporalFilterMode === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
