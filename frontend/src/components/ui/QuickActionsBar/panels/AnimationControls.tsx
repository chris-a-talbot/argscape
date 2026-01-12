/**
 * AnimationControls Component
 * 
 * Controls for layer-by-layer reveal animation and auto-rotation.
 * Provides play/pause, speed adjustment, and mode selection.
 * Follows Liquid Glass design system with intuitive controls.
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { AnimationControlsProps, LayerRevealMode } from './ViewPanel.types';

/**
 * Layer reveal mode configurations
 */
const REVEAL_MODES: Array<{ id: LayerRevealMode; label: string; description: string }> = [
  {
    id: 'hide',
    label: 'Hide',
    description: 'Simply reveal layers progressively'
  },
  {
    id: 'glide',
    label: 'Glide',
    description: 'Dim below and glide shapefile'
  },
  {
    id: 'root-to-samples',
    label: 'Root→Samples',
    description: 'Reveal from root down to samples'
  }
];

export const AnimationControls: React.FC<AnimationControlsProps> = ({
  state,
  onPlay,
  onPause,
  onReset,
  onRateChange,
  onModeChange,
  className = ''
}) => {
  const { colors } = useColorTheme();
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

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

  const controlsRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  };

  const getButtonStyle = (buttonId: string, variant: 'primary' | 'secondary' = 'secondary'): React.CSSProperties => {
    const isHovered = hoveredButton === buttonId;
    const isPrimary = variant === 'primary';

    return {
      flex: isPrimary ? 1 : 'none',
      padding: isPrimary ? '0.75rem 1rem' : '0.75rem',
      border: `1px solid ${isPrimary ? colors.accentPrimary : colors.border}`,
      borderRadius: '0.5rem',
      background: isPrimary 
        ? colors.accentPrimary 
        : isHovered 
          ? colors.hoverOverlay 
          : colors.containerBackground,
      color: isPrimary ? colors.buttonText : colors.text,
      fontSize: '0.8125rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.375rem',
      transform: isHovered ? 'translateY(-1px)' : 'none',
      boxShadow: isHovered ? `0 2px 8px ${colors.border}` : 'none',
    };
  };

  const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  };

  const sliderLabelStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: colors.text,
    opacity: 0.7,
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '0.375rem',
    borderRadius: '0.1875rem',
    background: colors.border,
    appearance: 'none',
    cursor: 'pointer',
    outline: 'none',
  };

  const modeSelectStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.375rem',
  };

  const getModeButtonStyle = (mode: LayerRevealMode): React.CSSProperties => {
    const isActive = state.mode === mode;
    const isHovered = hoveredButton === `mode-${mode}`;

    return {
      flex: 1,
      padding: '0.5rem 0.75rem',
      border: `1px solid ${isActive ? colors.accentPrimary : colors.border}`,
      borderRadius: '0.375rem',
      background: isActive 
        ? colors.accentPrimary 
        : isHovered 
          ? colors.hoverOverlay 
          : colors.containerBackground,
      color: isActive ? colors.buttonText : colors.text,
      fontSize: '0.6875rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1)',
      userSelect: 'none',
      textAlign: 'center',
    };
  };

  const progressBarContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '0.25rem',
    background: colors.border,
    borderRadius: '0.125rem',
    overflow: 'hidden',
  };

  const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    width: `${state.progress * 100}%`,
    background: colors.accentPrimary,
    borderRadius: '0.125rem',
    transition: 'width 0.3s ease',
  };

  const handlePlayPause = () => {
    if (state.isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRateChange(parseFloat(e.target.value));
  };

  if (!state.enabled) {
    return null;
  }

  return (
    <div style={containerStyle} className={className}>
      <div style={headerStyle}>
        Layer Reveal Animation
      </div>

      {/* Progress bar */}
      {state.isPlaying && (
        <div style={progressBarContainerStyle}>
          <div style={progressBarFillStyle} />
        </div>
      )}

      {/* Playback controls */}
      <div style={controlsRowStyle}>
        <button
          style={getButtonStyle('play-pause', 'primary')}
          onClick={handlePlayPause}
          onMouseEnter={() => setHoveredButton('play-pause')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label={state.isPlaying ? 'Pause animation' : 'Play animation'}
        >
          <span style={{ fontSize: '1rem' }}>
            {state.isPlaying ? '⏸' : '▶'}
          </span>
          <span>{state.isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          style={getButtonStyle('reset')}
          onClick={onReset}
          onMouseEnter={() => setHoveredButton('reset')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label="Reset animation"
          title="Reset to start"
        >
          <span style={{ fontSize: '1rem' }}>⏮</span>
        </button>
      </div>

      {/* Speed control */}
      <div style={sliderContainerStyle}>
        <div style={sliderLabelStyle}>
          <span>Animation Speed</span>
          <span style={{ fontWeight: 600 }}>{state.rate.toFixed(1)} layers/s</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="25"
          step="0.1"
          value={state.rate}
          onChange={handleRateChange}
          style={sliderStyle}
          aria-label="Animation speed"
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.625rem',
          color: colors.text,
          opacity: 0.5,
        }}>
          <span>0.1</span>
          <span>25</span>
        </div>
      </div>

      {/* Mode selection */}
      <div style={sliderContainerStyle}>
        <div style={sliderLabelStyle}>
          <span>Reveal Mode</span>
        </div>
        <div style={modeSelectStyle}>
          {REVEAL_MODES.map((mode) => (
            <button
              key={mode.id}
              style={getModeButtonStyle(mode.id)}
              onClick={() => onModeChange(mode.id)}
              onMouseEnter={() => setHoveredButton(`mode-${mode.id}`)}
              onMouseLeave={() => setHoveredButton(null)}
              aria-label={mode.label}
              title={mode.description}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Help text */}
      <div style={{ 
        fontSize: '0.6875rem', 
        color: colors.text, 
        opacity: 0.6,
        lineHeight: 1.4
      }}>
        Animates layer-by-layer reveal of the ARG over time.
        Use different modes for various visualization effects.
      </div>
    </div>
  );
};

export default AnimationControls;





