/**
 * EdgesPanel Component
 *
 * Consolidated panel for all edge-related settings in the Quick Actions Bar.
 *
 * Sections:
 * - Appearance: Width, Opacity
 * - Labels: Show edge labels, Font size
 */

import React from 'react';
import { EdgesPanelProps } from './EdgesPanel.types';
import { UnifiedSlider } from './UnifiedSlider';
import { useColorTheme } from '../../../../context/ColorThemeContext';

const DEFAULT_EDGE_THICKNESS_MIN = 0.5;
const DEFAULT_EDGE_THICKNESS_MAX = 8;

export const EdgesPanel: React.FC<EdgesPanelProps> = ({
  // Edge appearance
  edgeThickness = 1.5,
  onEdgeThicknessChange,
  edgeThicknessMin = DEFAULT_EDGE_THICKNESS_MIN,
  edgeThicknessMax = DEFAULT_EDGE_THICKNESS_MAX,

  edgeOpacity = 95,
  onEdgeOpacityChange,

  // Edge labels
  showEdgeLabels = false,
  onShowEdgeLabelsChange,
  edgeLabelFontSize = 12,
  onEdgeLabelFontSizeChange,

  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  // Check what options are available
  const hasEdgeAppearance = onEdgeThicknessChange || onEdgeOpacityChange;
  const hasEdgeLabelToggle = onShowEdgeLabelsChange !== undefined;
  const hasEdgeLabelSize = showEdgeLabels && onEdgeLabelFontSizeChange;

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
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.125rem 0',
  };

  const checkboxStyle: React.CSSProperties = {
    width: '0.875rem',
    height: '0.875rem',
    accentColor: colors.accentPrimary,
    cursor: 'pointer',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: colors.text,
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Appearance: Width and Opacity */}
      {hasEdgeAppearance && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Appearance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {onEdgeThicknessChange && (
              <UnifiedSlider
                label="Width"
                value={edgeThickness}
                min={edgeThicknessMin}
                max={edgeThicknessMax}
                step={0.1}
                unit="px"
                onChange={onEdgeThicknessChange}
                showValue={true}
                compact={true}
              />
            )}
            {onEdgeOpacityChange && (
              <UnifiedSlider
                label="Opacity"
                value={edgeOpacity}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={onEdgeOpacityChange}
                showValue={true}
                compact={true}
              />
            )}
          </div>
        </div>
      )}

      {/* Labels: Show edge labels toggle and font size */}
      {hasEdgeLabelToggle && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Labels</div>
          <label style={checkboxContainerStyle}>
            <input
              type="checkbox"
              checked={showEdgeLabels}
              onChange={(e) => onShowEdgeLabelsChange!(e.target.checked)}
              style={checkboxStyle}
            />
            <span style={checkboxLabelStyle}>Show Edge Labels</span>
          </label>
          {hasEdgeLabelSize && (
            <UnifiedSlider
              label="Font Size"
              value={edgeLabelFontSize}
              min={8}
              max={24}
              step={1}
              unit="px"
              onChange={onEdgeLabelFontSizeChange!}
              showValue={true}
              compact={true}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EdgesPanel;
