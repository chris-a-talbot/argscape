/**
 * SequenceStatsDisplay Component
 *
 * Displays tree sequence metadata statistics in a compact grid format.
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { SequenceStatsDisplayProps } from './StatsPanel.types';

export const SequenceStatsDisplay: React.FC<SequenceStatsDisplayProps> = ({
  stats,
  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '—';
    return num.toLocaleString();
  };

  // Compact grid layout matching NodeEdgeCountDisplay
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

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.25rem 0.5rem',
  };

  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    padding: '0.25rem',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: colors.textSecondary,
    opacity: 0.7,
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: colors.text,
  };

  // Create stat items array
  const statItems = [
    { label: 'Samples', value: stats.samples },
    { label: 'Sites', value: stats.sites },
    { label: 'Trees', value: stats.trees },
    { label: 'Mutations', value: stats.mutations },
  ];

  if (stats.populations !== undefined && stats.populations > 0) {
    statItems.push({ label: 'Populations', value: stats.populations });
  }

  if (stats.individuals !== undefined && stats.individuals > 0) {
    statItems.push({ label: 'Individuals', value: stats.individuals });
  }

  return (
    <div className={className} style={containerStyle}>
      <div style={headerStyle}>Tree Sequence</div>
      <div style={gridStyle}>
        {statItems.map((item) => (
          <div key={item.label} style={statItemStyle}>
            <div style={statLabelStyle}>{item.label}</div>
            <div style={statValueStyle}>{formatNumber(item.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};





