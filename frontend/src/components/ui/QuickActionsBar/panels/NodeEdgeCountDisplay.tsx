/**
 * NodeEdgeCountDisplay Component
 * 
 * Displays node and edge counts through the filtering pipeline:
 * Original → Subset → Displayed
 * 
 * Shows visual pipeline with reduction percentages
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { NodeEdgeCountDisplayProps } from './StatsPanel.types';

export const NodeEdgeCountDisplay: React.FC<NodeEdgeCountDisplayProps> = ({
  stats,
  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  // Calculate total reduction percentages for summary
  const nodeTotalReduction = stats.originalNodes > 0
    ? ((stats.originalNodes - stats.displayedNodes) / stats.originalNodes) * 100
    : 0;
  const edgeTotalReduction = stats.originalEdges > 0
    ? ((stats.originalEdges - stats.displayedEdges) / stats.originalEdges) * 100
    : 0;

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Compact grid layout
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
    gridTemplateColumns: 'auto 1fr 1fr 1fr',
    gap: '0.25rem 0.5rem',
    alignItems: 'center',
    fontSize: '0.75rem',
  };

  const labelCellStyle: React.CSSProperties = {
    color: colors.textSecondary,
    fontWeight: 500,
  };

  const valueCellStyle: React.CSSProperties = {
    color: colors.text,
    fontWeight: 600,
    textAlign: 'right',
  };

  const headerCellStyle: React.CSSProperties = {
    color: colors.textSecondary,
    fontSize: '0.625rem',
    textAlign: 'right',
    opacity: 0.7,
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={headerStyle}>Graph Counts</div>
      <div style={gridStyle}>
        {/* Header row */}
        <div></div>
        <div style={headerCellStyle}>Original</div>
        <div style={headerCellStyle}>Subset</div>
        <div style={headerCellStyle}>Displayed</div>

        {/* Nodes row */}
        <div style={labelCellStyle}>Nodes</div>
        <div style={valueCellStyle}>{formatNumber(stats.originalNodes)}</div>
        <div style={valueCellStyle}>{formatNumber(stats.subsetNodes)}</div>
        <div style={valueCellStyle}>{formatNumber(stats.displayedNodes)}</div>

        {/* Edges row */}
        <div style={labelCellStyle}>Edges</div>
        <div style={valueCellStyle}>{formatNumber(stats.originalEdges)}</div>
        <div style={valueCellStyle}>{formatNumber(stats.subsetEdges)}</div>
        <div style={valueCellStyle}>{formatNumber(stats.displayedEdges)}</div>
      </div>

      {/* Reduction summary if significant */}
      {(nodeTotalReduction > 5 || edgeTotalReduction > 5) && (
        <div style={{ fontSize: '0.625rem', color: colors.textSecondary, opacity: 0.8, marginTop: '0.125rem' }}>
          Reduction: {nodeTotalReduction > 5 ? `${nodeTotalReduction.toFixed(0)}% nodes` : ''}
          {nodeTotalReduction > 5 && edgeTotalReduction > 5 ? ', ' : ''}
          {edgeTotalReduction > 5 ? `${edgeTotalReduction.toFixed(0)}% edges` : ''}
        </div>
      )}
    </div>
  );
};





