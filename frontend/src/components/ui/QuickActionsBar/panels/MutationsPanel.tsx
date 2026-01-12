/**
 * MutationsPanel Component
 *
 * Consolidated panel for all mutation-related settings in the Quick Actions Bar.
 *
 * Sections:
 * - Appearance: Mutation marker size
 * - Labels: Show mutation labels
 */

import React from 'react';
import { MutationsPanelProps } from './MutationsPanel.types';
import { UnifiedSlider } from './UnifiedSlider';
import { useColorTheme } from '../../../../context/ColorThemeContext';

export const MutationsPanel: React.FC<MutationsPanelProps> = ({
  // Show mutation markers
  showMutationMarkers = false,
  onShowMutationMarkersChange,

  // Mutation marker size
  mutationMarkerSize = 8,
  onMutationMarkerSizeChange,

  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  // Check what options are available
  const hasMutationToggle = onShowMutationMarkersChange !== undefined;
  const hasMutationSize = showMutationMarkers && onMutationMarkerSizeChange;

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

  const infoTextStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: colors.textSecondary,
    opacity: 0.8,
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Labels: Show mutation markers */}
      {hasMutationToggle && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Labels</div>
          <label style={checkboxContainerStyle}>
            <input
              type="checkbox"
              checked={showMutationMarkers}
              onChange={(e) => onShowMutationMarkersChange!(e.target.checked)}
              style={checkboxStyle}
            />
            <span style={checkboxLabelStyle}>Show Mutations</span>
          </label>
          <div style={infoTextStyle}>Display mutation markers on edges</div>
        </div>
      )}

      {/* Appearance: Marker size (only shown when mutations enabled) */}
      {hasMutationSize && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Appearance</div>
          <UnifiedSlider
            label="Marker Size"
            value={mutationMarkerSize}
            min={4}
            max={50}
            step={1}
            unit="px"
            onChange={onMutationMarkerSizeChange!}
            showValue={true}
          />
        </div>
      )}
    </div>
  );
};

export default MutationsPanel;
