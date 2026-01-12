/**
 * CameraPresetPicker Component
 * 
 * Camera preset selector for 3D visualizers.
 * Provides quick access to common camera angles and zoom levels.
 * Follows Liquid Glass design system with visual feedback.
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { CameraPresetPickerProps, CameraPresetConfig } from './ViewPanel.types';

/**
 * Default camera presets for 3D visualization
 */
export const DEFAULT_CAMERA_PRESETS: CameraPresetConfig[] = [
  {
    id: 'fit',
    label: 'Fit',
    icon: '🔍',
    description: 'Fit entire ARG in view',
    settings: { zoom: 1.8 }
  },
  {
    id: 'medium',
    label: 'Medium',
    icon: '👁️',
    description: 'Medium zoom level',
    settings: { zoom: 1.2 }
  },
  {
    id: 'far',
    label: 'Far',
    icon: '🌐',
    description: 'Wide overview',
    settings: { zoom: 0.8 }
  },
  {
    id: 'top',
    label: 'Top',
    icon: '⬇️',
    description: 'Top-down view',
    settings: { rotationX: 90, rotationOrbit: 0 }
  },
  {
    id: 'side',
    label: 'Side',
    icon: '↔️',
    description: 'Side view',
    settings: { rotationX: 0, rotationOrbit: 90 }
  },
  {
    id: 'isometric',
    label: 'Isometric',
    icon: '📐',
    description: '3D isometric view',
    settings: { rotationX: 30, rotationOrbit: 45 }
  }
];

export const CameraPresetPicker: React.FC<CameraPresetPickerProps> = ({
  presets = DEFAULT_CAMERA_PRESETS,
  currentPreset,
  onPresetSelect,
  currentState,
  className = ''
}) => {
  const { colors } = useColorTheme();

  /**
   * Check if a preset is currently active based on camera state
   */
  const isPresetActive = (preset: CameraPresetConfig): boolean => {
    if (preset.id === currentPreset) return true;
    
    // If we have current state, check if it matches preset settings
    if (currentState && preset.settings) {
      const { zoom, rotationX, rotationOrbit } = preset.settings;
      
      // Check zoom match (within tolerance)
      if (zoom !== undefined && currentState.zoom !== undefined) {
        if (Math.abs(currentState.zoom - zoom) < 0.1) {
          return true;
        }
      }
      
      // Check rotation match (within tolerance)
      if (rotationX !== undefined && rotationOrbit !== undefined &&
          currentState.rotationX !== undefined && currentState.rotationOrbit !== undefined) {
        if (Math.abs(currentState.rotationX - rotationX) < 5 &&
            Math.abs(currentState.rotationOrbit - rotationOrbit) < 5) {
          return true;
        }
      }
    }
    
    return false;
  };

  const [hoveredPreset, setHoveredPreset] = React.useState<string | null>(null);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    opacity: 0.7,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
  };

  const getPresetButtonStyle = (preset: CameraPresetConfig): React.CSSProperties => {
    const isActive = isPresetActive(preset);
    const isHovered = hoveredPreset === preset.id;

    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.375rem',
      padding: '0.75rem 0.5rem',
      border: `1px solid ${isActive ? colors.accentPrimary : colors.border}`,
      borderRadius: '0.5rem',
      background: isActive 
        ? colors.accentPrimary 
        : isHovered 
          ? colors.hoverOverlay 
          : colors.containerBackground,
      color: isActive ? colors.buttonText : colors.text,
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
      userSelect: 'none',
      transform: isHovered ? 'translateY(-2px)' : 'none',
      boxShadow: isActive 
        ? `0 2px 8px ${colors.accentPrimary}40` 
        : isHovered 
          ? `0 2px 8px ${colors.border}` 
          : 'none',
    };
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    lineHeight: 1,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    fontWeight: 500,
    textAlign: 'center',
    lineHeight: 1.2,
  };

  const handlePresetClick = (preset: CameraPresetConfig) => {
    onPresetSelect(preset.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, preset: CameraPresetConfig) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePresetClick(preset);
    }
  };

  return (
    <div style={containerStyle} className={className}>
      <div style={headerStyle}>
        Camera Presets
      </div>
      
      <div style={gridStyle}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            role="button"
            aria-label={`${preset.label}: ${preset.description}`}
            aria-pressed={isPresetActive(preset)}
            title={preset.description}
            style={getPresetButtonStyle(preset)}
            onClick={() => handlePresetClick(preset)}
            onKeyDown={(e) => handleKeyDown(e, preset)}
            onMouseEnter={() => setHoveredPreset(preset.id)}
            onMouseLeave={() => setHoveredPreset(null)}
          >
            <span style={iconStyle}>{preset.icon}</span>
            <span style={labelStyle}>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CameraPresetPicker;





