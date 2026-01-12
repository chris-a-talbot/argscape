/**
 * CameraPanel Component
 *
 * Camera controls panel for 3D visualizers in the Quick Actions Bar.
 * Provides camera presets, center view button, and auto-rotation controls.
 *
 * Sections:
 * - Camera Presets: Quick access to Front/Top/Right/Iso views with shortcut badges
 * - Current Position: Read-only display of pitch/heading/zoom (conditional)
 * - Auto-Rotation: Enable toggle + speed slider (conditional)
 */

import React from 'react';
import { Video, RotateCcw, Focus } from 'lucide-react';
import { useColorTheme } from '@/context/ColorThemeContext';
import { UnifiedSlider } from './UnifiedSlider';
import { FilterGroup } from './FilterGroup';
import type { CameraPanelProps, CameraPreset } from './CameraPanel.types';
import { CAMERA_PRESETS } from './CameraPanel.types';

export const CameraPanel: React.FC<CameraPanelProps> = ({
  // Current camera state
  currentRotationX,
  currentRotationOrbit,
  currentZoom,

  // Preset controls
  onPresetSelect,
  onCenterView,

  // Auto-rotation
  autoRotationEnabled = false,
  onAutoRotationEnabledChange,
  autoRotationRate = 10,
  onAutoRotationRateChange,

  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  // Track hovered preset for button styling
  const [hoveredPreset, setHoveredPreset] = React.useState<string | null>(null);

  // Check what controls are available
  const hasPresetControls = onPresetSelect !== undefined;
  const hasCenterButton = onCenterView !== undefined;
  const hasPositionDisplay =
    currentRotationX !== undefined ||
    currentRotationOrbit !== undefined ||
    currentZoom !== undefined;
  const hasAutoRotation =
    onAutoRotationEnabledChange !== undefined ||
    onAutoRotationRateChange !== undefined;

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

  const presetGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.375rem',
  };

  const getPresetButtonStyle = (presetId: string): React.CSSProperties => {
    const isHovered = hoveredPreset === presetId;

    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.5rem 0.25rem',
      border: `1px solid ${colors.border}`,
      borderRadius: '0.375rem',
      background: isHovered ? colors.hoverOverlay : colors.containerBackground,
      color: colors.text,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      transform: isHovered ? 'translateY(-1px)' : 'none',
      boxShadow: isHovered ? `0 2px 6px ${colors.border}` : 'none',
      position: 'relative',
    };
  };

  const presetLabelStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    fontWeight: 500,
    lineHeight: 1.2,
  };

  const shortcutBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0.25rem',
    right: '0.25rem',
    fontSize: '0.5625rem',
    fontWeight: 600,
    padding: '0.125rem 0.25rem',
    borderRadius: '0.25rem',
    background: isLiquid ? 'rgba(20, 226, 168, 0.15)' : `${colors.accentPrimary}20`,
    color: colors.accentPrimary,
    lineHeight: 1,
  };

  const centerButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    border: `1px solid ${colors.accentPrimary}`,
    borderRadius: '0.375rem',
    background: isLiquid ? 'rgba(20, 226, 168, 0.1)' : `${colors.accentPrimary}15`,
    color: colors.accentPrimary,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: '0.75rem',
    fontWeight: 500,
    marginTop: '0.25rem',
  };

  const positionRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
  };

  const positionLabelStyle: React.CSSProperties = {
    color: colors.textSecondary,
  };

  const positionValueStyle: React.CSSProperties = {
    color: colors.text,
    fontWeight: 500,
    fontFamily: 'monospace',
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
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

  const handlePresetClick = (preset: CameraPreset) => {
    if (onPresetSelect) {
      onPresetSelect(preset);
    }
  };

  const handlePresetKeyDown = (e: React.KeyboardEvent, preset: CameraPreset) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePresetClick(preset);
    }
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Camera Presets Section */}
      {(hasPresetControls || hasCenterButton) && (
        <FilterGroup label="Camera Presets" icon={<Video size={16} />}>
          {hasPresetControls && (
            <div style={presetGridStyle}>
              {CAMERA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={`${preset.label} view${preset.shortcut ? ` (${preset.shortcut})` : ''}`}
                  title={`${preset.label}: Pitch ${preset.rotationX}, Heading ${preset.rotationOrbit}`}
                  style={getPresetButtonStyle(preset.id)}
                  onClick={() => handlePresetClick(preset)}
                  onKeyDown={(e) => handlePresetKeyDown(e, preset)}
                  onMouseEnter={() => setHoveredPreset(preset.id)}
                  onMouseLeave={() => setHoveredPreset(null)}
                >
                  <span style={presetLabelStyle}>{preset.label}</span>
                  {preset.shortcut && (
                    <span style={shortcutBadgeStyle}>{preset.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {hasCenterButton && (
            <button
              type="button"
              style={centerButtonStyle}
              onClick={onCenterView}
              aria-label="Center ARG in view"
            >
              <Focus size={14} />
              <span>Center ARG</span>
            </button>
          )}
        </FilterGroup>
      )}

      {/* Current Position Section (conditional) */}
      {hasPositionDisplay && (
        <FilterGroup label="Current Position" icon={<Focus size={16} />}>
          <div style={sectionStyle}>
            {currentRotationX !== undefined && (
              <div style={positionRowStyle}>
                <span style={positionLabelStyle}>Pitch</span>
                <span style={positionValueStyle}>{currentRotationX.toFixed(1)}</span>
              </div>
            )}
            {currentRotationOrbit !== undefined && (
              <div style={positionRowStyle}>
                <span style={positionLabelStyle}>Heading</span>
                <span style={positionValueStyle}>{currentRotationOrbit.toFixed(1)}</span>
              </div>
            )}
            {currentZoom !== undefined && (
              <div style={positionRowStyle}>
                <span style={positionLabelStyle}>Zoom</span>
                <span style={positionValueStyle}>{currentZoom.toFixed(2)}x</span>
              </div>
            )}
          </div>
        </FilterGroup>
      )}

      {/* Auto-Rotation Section (conditional) */}
      {hasAutoRotation && (
        <FilterGroup label="Auto-Rotation" icon={<RotateCcw size={16} />}>
          <div style={sectionStyle}>
            {onAutoRotationEnabledChange && (
              <label style={checkboxContainerStyle}>
                <input
                  type="checkbox"
                  checked={autoRotationEnabled}
                  onChange={(e) => onAutoRotationEnabledChange(e.target.checked)}
                  style={checkboxStyle}
                />
                <span style={checkboxLabelStyle}>Enable auto-rotation</span>
              </label>
            )}

            {onAutoRotationRateChange && autoRotationEnabled && (
              <UnifiedSlider
                label="Speed"
                value={autoRotationRate}
                min={1}
                max={60}
                step={1}
                unit="/s"
                onChange={onAutoRotationRateChange}
                showValue={true}
                compact={true}
              />
            )}
          </div>
        </FilterGroup>
      )}
    </div>
  );
};

export default CameraPanel;
