/**
 * LayoutPresetPicker Component
 * 
 * Layout preset selector for 2D force-directed graph visualizer.
 * Provides quick access to different sample ordering algorithms
 * that help reduce edge crossings and improve graph clarity.
 * Follows Liquid Glass design system with quality metrics.
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { LayoutPresetPickerProps, LayoutPresetConfig } from './ViewPanel.types';

/**
 * Default layout presets for 2D force-directed graph
 */
export const DEFAULT_LAYOUT_PRESETS: LayoutPresetConfig[] = [
  {
    id: 'numeric',
    label: 'Numeric',
    icon: '🔢',
    description: 'Simple numeric order (0, 1, 2...)',
    computeIntensive: false
  },
  {
    id: 'first-tree',
    label: 'First Tree',
    icon: '🌱',
    description: 'Minlex postorder from first genomic tree',
    computeIntensive: false
  },
  {
    id: 'center-tree',
    label: 'Center Tree',
    icon: '🎯',
    description: 'Minlex postorder from center position',
    computeIntensive: false
  },
  {
    id: 'consensus',
    label: 'Consensus',
    icon: '🏆',
    description: 'Majority vote across trees (often best)',
    computeIntensive: true
  },
  {
    id: 'ancestral-path',
    label: 'Ancestral',
    icon: '🧬',
    description: 'Order by ancestral path length',
    computeIntensive: false
  },
  {
    id: 'coalescence',
    label: 'Coalescence',
    icon: '⏱️',
    description: 'Order by coalescence time',
    computeIntensive: false
  },
  {
    id: 'dagre',
    label: 'Dagre',
    icon: '📊',
    description: 'Layer-by-layer optimization',
    computeIntensive: true
  }
];

export const LayoutPresetPicker: React.FC<LayoutPresetPickerProps> = ({
  presets = DEFAULT_LAYOUT_PRESETS,
  currentPreset,
  onPresetSelect,
  edgeCrossings,
  isCalculatingEdgeCrossings = false,
  className = ''
}) => {
  const { colors } = useColorTheme();
  const [hoveredPreset, setHoveredPreset] = React.useState<string | null>(null);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    opacity: 0.7,
  };

  const qualityMetricStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    color: colors.text,
    opacity: 0.6,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
  };

  const getPresetButtonStyle = (preset: LayoutPresetConfig): React.CSSProperties => {
    const isActive = preset.id === currentPreset;
    const isHovered = hoveredPreset === preset.id;

    return {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem',
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
      transform: isHovered ? 'translateY(-1px)' : 'none',
      boxShadow: isActive 
        ? `0 2px 8px ${colors.accentPrimary}40` 
        : isHovered 
          ? `0 2px 8px ${colors.border}` 
          : 'none',
      position: 'relative',
      textAlign: 'left',
    };
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    lineHeight: 1,
    flexShrink: 0,
  };

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    flex: 1,
    minWidth: 0,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8125rem',
    fontWeight: 500,
    lineHeight: 1.2,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    opacity: 0.7,
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: '0.5625rem',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    background: colors.accentPrimary,
    color: colors.buttonText,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flexShrink: 0,
  };

  const handlePresetClick = (preset: LayoutPresetConfig) => {
    onPresetSelect(preset.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, preset: LayoutPresetConfig) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePresetClick(preset);
    }
  };

  return (
    <div style={containerStyle} className={className}>
      <div style={headerStyle}>
        <div style={titleStyle}>
          Layout Algorithm
        </div>
        
        {/* Edge crossing quality metric */}
        {(edgeCrossings !== null && edgeCrossings !== undefined) && (
          <div style={qualityMetricStyle}>
            {isCalculatingEdgeCrossings ? (
              <>
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <span>Crossings:</span>
                <span style={{ fontWeight: 600 }}>{edgeCrossings.toLocaleString()}</span>
              </>
            )}
          </div>
        )}
      </div>
      
      <div style={gridStyle}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            role="button"
            aria-label={`${preset.label}: ${preset.description}`}
            aria-pressed={preset.id === currentPreset}
            title={preset.description}
            style={getPresetButtonStyle(preset)}
            onClick={() => handlePresetClick(preset)}
            onKeyDown={(e) => handleKeyDown(e, preset)}
            onMouseEnter={() => setHoveredPreset(preset.id)}
            onMouseLeave={() => setHoveredPreset(null)}
          >
            <span style={iconStyle}>{preset.icon}</span>
            
            <div style={labelContainerStyle}>
              <span style={labelStyle}>{preset.label}</span>
              <span style={descriptionStyle}>{preset.description}</span>
            </div>
            
            {preset.computeIntensive && (
              <span style={badgeStyle}>Slow</span>
            )}
          </button>
        ))}
      </div>
      
      {/* Help text */}
      <div style={{ 
        fontSize: '0.6875rem', 
        color: colors.text, 
        opacity: 0.6,
        lineHeight: 1.4
      }}>
        Different algorithms optimize sample ordering to reduce edge crossings.
        Try "Consensus" for best results.
      </div>
    </div>
  );
};

export default LayoutPresetPicker;





