/**
 * AnimationPopout Component
 *
 * A floating pop-out panel for animation controls that appears
 * alongside the visualization rather than in the tabs.
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { AnimationState, LayerRevealMode } from './ViewPanel.types';

interface AnimationPopoutProps {
  /** Whether the popout is visible */
  isOpen: boolean;
  /** Handler to close the popout */
  onClose: () => void;
  /** Animation state */
  state: AnimationState;
  /** Play/resume animation */
  onPlay: () => void;
  /** Pause animation */
  onPause: () => void;
  /** Reset animation to start */
  onReset: () => void;
  /** Change animation speed */
  onRateChange: (rate: number) => void;
  /** Change animation mode */
  onModeChange: (mode: LayerRevealMode) => void;
  /** Position of the popout */
  position?: 'left' | 'right';
}

export const AnimationPopout: React.FC<AnimationPopoutProps> = ({
  isOpen,
  onClose,
  state,
  onPlay,
  onPause,
  onReset,
  onRateChange,
  onModeChange,
  position = 'right',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  if (!isOpen || !state.enabled) return null;

  const handlePlayPause = () => {
    if (state.isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '1rem',
    [position]: '1rem',
    width: '200px',
    padding: '0.75rem',
    background: isLiquid
      ? 'rgba(255, 255, 255, 0.95)'
      : colors.containerBackground,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${colors.border}`,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    fontWeight: 600,
    color: colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const closeButtonStyle: React.CSSProperties = {
    width: '1.25rem',
    height: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: colors.textSecondary,
    cursor: 'pointer',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    transition: 'all 0.15s ease',
  };

  const controlsRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.375rem',
  };

  const buttonStyle = (isPrimary: boolean = false): React.CSSProperties => ({
    flex: isPrimary ? 1 : 'none',
    padding: '0.5rem',
    border: `1px solid ${isPrimary ? colors.accentPrimary : colors.border}`,
    borderRadius: '0.375rem',
    background: isPrimary ? colors.accentPrimary : 'transparent',
    color: isPrimary ? colors.buttonText : colors.text,
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
  });

  const sliderRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  };

  const sliderLabelStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.625rem',
    color: colors.textSecondary,
  };

  const progressBarStyle: React.CSSProperties = {
    width: '100%',
    height: '3px',
    background: colors.border,
    borderRadius: '2px',
    overflow: 'hidden',
  };

  const progressFillStyle: React.CSSProperties = {
    height: '100%',
    width: `${state.progress * 100}%`,
    background: colors.accentPrimary,
    transition: 'width 0.2s ease',
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={titleStyle}>Animation</span>
        <button
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.hoverOverlay;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      {state.isPlaying && (
        <div style={progressBarStyle}>
          <div style={progressFillStyle} />
        </div>
      )}

      {/* Playback controls */}
      <div style={controlsRowStyle}>
        <button
          style={buttonStyle(true)}
          onClick={handlePlayPause}
        >
          <span>{state.isPlaying ? '⏸' : '▶'}</span>
          <span>{state.isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <button
          style={buttonStyle(false)}
          onClick={onReset}
          title="Reset"
        >
          ⏮
        </button>
      </div>

      {/* Speed slider */}
      <div style={sliderRowStyle}>
        <div style={sliderLabelStyle}>
          <span>Speed</span>
          <span style={{ fontWeight: 600, color: colors.text }}>{state.rate.toFixed(1)} layers/s</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="25"
          step="0.1"
          value={state.rate}
          onChange={(e) => onRateChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            appearance: 'none',
            cursor: 'pointer',
            background: colors.border,
            accentColor: colors.accentPrimary,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', color: colors.textSecondary, opacity: 0.7 }}>
          <span>0.1</span>
          <span>25</span>
        </div>
      </div>

      {/* Progress display when playing */}
      {state.isPlaying && state.progress > 0 && (
        <div style={{ fontSize: '0.625rem', color: colors.textSecondary, textAlign: 'center' }}>
          {Math.round(state.progress * 100)}% complete
        </div>
      )}
    </div>
  );
};

export default AnimationPopout;
