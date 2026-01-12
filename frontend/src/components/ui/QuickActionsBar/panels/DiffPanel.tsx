/**
 * DiffPanel Component
 *
 * Panel for diff visualizer controls in the Quick Actions Bar.
 * Provides controls for:
 * - View mode (diff/first/second dataset)
 * - Error bar visibility and thickness
 * - Distance metrics display (read-only)
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import { UnifiedSlider } from './UnifiedSlider';

// ============================================================================
// Types
// ============================================================================

export type DiffViewMode = 'diff' | 'first' | 'second';

export interface DiffStats {
  averageDistance: number;
  maxDistance: number;
  minDistance: number;
  nodeCount: number;
}

export interface DiffPanelProps {
  viewMode: DiffViewMode;
  onViewModeChange?: (mode: DiffViewMode) => void;
  showErrorBars: boolean;
  onShowErrorBarsChange?: (show: boolean) => void;
  errorBarThickness: number;
  onErrorBarThicknessChange?: (thickness: number) => void;
  diffStats?: DiffStats;
}

// ============================================================================
// View Mode Options
// ============================================================================

const VIEW_MODE_OPTIONS: { value: DiffViewMode; label: string; description: string }[] = [
  { value: 'diff', label: 'Diff', description: 'Averaged positions with error bars' },
  { value: 'first', label: 'First', description: 'First dataset positions' },
  { value: 'second', label: 'Second', description: 'Second dataset positions' },
];

// ============================================================================
// Component
// ============================================================================

export const DiffPanel: React.FC<DiffPanelProps> = ({
  viewMode,
  onViewModeChange,
  showErrorBars,
  onShowErrorBarsChange,
  errorBarThickness,
  onErrorBarThicknessChange,
  diffStats,
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem',
    background: isLiquid ? 'rgba(20, 226, 168, 0.02)' : colors.hoverOverlay,
    borderRadius: '0.375rem',
    border: `1px solid ${colors.border}`,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    fontWeight: 600,
    color: colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.125rem',
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: onShowErrorBarsChange ? 'pointer' : 'default',
  };

  const checkboxStyle: React.CSSProperties = {
    width: '0.875rem',
    height: '0.875rem',
    accentColor: colors.accentPrimary,
    cursor: onShowErrorBarsChange ? 'pointer' : 'default',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: colors.text,
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.25rem',
    flexWrap: 'wrap',
  };

  const statRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.25rem 0',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: colors.textSecondary,
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: colors.text,
    fontFamily: 'monospace',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: colors.textSecondary,
    opacity: 0.8,
    marginTop: '0.25rem',
  };

  // Get current view mode description
  const currentModeDescription = VIEW_MODE_OPTIONS.find(opt => opt.value === viewMode)?.description || '';

  return (
    <div style={containerStyle}>
      {/* View Mode Section */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>View Mode</div>
        <div style={buttonGroupStyle}>
          {VIEW_MODE_OPTIONS.map((opt) => {
            const isSelected = viewMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onViewModeChange?.(opt.value)}
                disabled={!onViewModeChange}
                style={{
                  padding: '0.375rem 0.625rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: `1px solid ${isSelected ? colors.accentPrimary : colors.border}`,
                  borderRadius: '0.25rem',
                  background: isSelected
                    ? (isLiquid ? 'rgba(20, 226, 168, 0.15)' : `${colors.accentPrimary}20`)
                    : 'transparent',
                  color: isSelected ? colors.accentPrimary : colors.text,
                  cursor: onViewModeChange ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  opacity: !onViewModeChange ? 0.6 : 1,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div style={descriptionStyle}>{currentModeDescription}</div>
      </div>

      {/* Error Bars Section */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Error Bars</div>
        <label style={checkboxContainerStyle}>
          <input
            type="checkbox"
            checked={showErrorBars}
            onChange={(e) => onShowErrorBarsChange?.(e.target.checked)}
            disabled={!onShowErrorBarsChange}
            style={checkboxStyle}
          />
          <span style={checkboxLabelStyle}>Show error bars</span>
        </label>
        {showErrorBars && (
          <UnifiedSlider
            label="Thickness"
            value={errorBarThickness}
            min={1}
            max={10}
            step={0.5}
            unit="px"
            onChange={onErrorBarThicknessChange || (() => {})}
            disabled={!onErrorBarThicknessChange}
            showValue={true}
            compact={true}
          />
        )}
      </div>

      {/* Distance Metrics Section (read-only) */}
      {diffStats && diffStats.nodeCount > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Distance Metrics</div>
          <div style={statRowStyle}>
            <span style={statLabelStyle}>Nodes Analyzed</span>
            <span style={statValueStyle}>{diffStats.nodeCount.toLocaleString()}</span>
          </div>
          <div style={statRowStyle}>
            <span style={statLabelStyle}>Avg Distance</span>
            <span style={statValueStyle}>{diffStats.averageDistance.toFixed(4)}</span>
          </div>
          <div style={statRowStyle}>
            <span style={statLabelStyle}>Max Distance</span>
            <span style={statValueStyle}>{diffStats.maxDistance.toFixed(4)}</span>
          </div>
          <div style={statRowStyle}>
            <span style={statLabelStyle}>Min Distance</span>
            <span style={statValueStyle}>{diffStats.minDistance.toFixed(4)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffPanel;
