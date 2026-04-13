/**
 * PerformanceStatsDisplay Component
 *
 * Displays real-time performance metrics in a compact inline format.
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { PerformanceStatsDisplayProps } from './StatsPanel.types';

export const PerformanceStatsDisplay: React.FC<PerformanceStatsDisplayProps> = ({
  stats,
  className = '',
  updateInterval = 1000,
  showMemory = true,
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';
  void updateInterval;

  const formatNumber = (num: number): string => {
    return num.toFixed(1);
  };

  const getFpsColor = (fps: number): string => {
    if (fps >= 50) return colors.success;
    if (fps >= 30) return colors.warning;
    return colors.error;
  };

  // Compact container matching other stats components
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

  // Inline row layout
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    flexWrap: 'wrap',
  };

  const statStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.25rem',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: colors.textSecondary,
    opacity: 0.7,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: colors.text,
  };

  const fpsValueStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: getFpsColor(stats.fps),
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={headerStyle}>Performance</div>
      <div style={rowStyle}>
        <div style={statStyle}>
          <span style={labelStyle}>FPS:</span>
          <span style={fpsValueStyle}>{formatNumber(stats.fps)}</span>
        </div>
        {stats.renderTimeMs !== undefined && (
          <div style={statStyle}>
            <span style={labelStyle}>Render:</span>
            <span style={valueStyle}>{formatNumber(stats.renderTimeMs)}ms</span>
          </div>
        )}
        {stats.avgFrameTime !== undefined && (
          <div style={statStyle}>
            <span style={labelStyle}>Avg:</span>
            <span style={valueStyle}>{formatNumber(stats.avgFrameTime)}ms</span>
          </div>
        )}
        {showMemory && stats.memoryMB !== undefined && (
          <div style={statStyle}>
            <span style={labelStyle}>Mem:</span>
            <span style={valueStyle}>{formatNumber(stats.memoryMB)}MB</span>
          </div>
        )}
      </div>
    </div>
  );
};


