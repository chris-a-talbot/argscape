/**
 * SpatialArg3DAnimationPopout Component
 *
 * Floating animation button with expandable controls for layer reveal.
 * Provides play/pause, speed adjustment, mode selection, and progress display.
 * Follows Liquid Glass design system with intuitive floating controls.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useColorTheme } from '@/context/ColorThemeContext';
import { UnifiedSlider } from '@/components/ui/QuickActionsBar/panels/UnifiedSlider';

export type LayerRevealMode = 'hide' | 'glide' | 'root-to-samples';

export interface SpatialArg3DAnimationPopoutProps {
  enabled: boolean;
  isPlaying: boolean;
  rate: number;
  mode: LayerRevealMode;
  progress: number;
  currentTime?: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRateChange: (rate: number) => void;
  onModeChange: (mode: LayerRevealMode) => void;
}

const MODE_OPTIONS: Array<{ id: LayerRevealMode; label: string }> = [
  { id: 'hide', label: 'Hide' },
  { id: 'glide', label: 'Glide' },
  { id: 'root-to-samples', label: 'Root\u2192Samples' },
];

export const SpatialArg3DAnimationPopout: React.FC<SpatialArg3DAnimationPopoutProps> = ({
  enabled,
  isPlaying,
  rate,
  mode,
  progress,
  currentTime,
  onStart,
  onPause,
  onResume,
  onCancel,
  onRateChange,
  onModeChange,
}) => {
  const { theme, colors } = useColorTheme();
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popout when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };

    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [expanded]);

  const handlePlayPause = () => {
    if (!enabled) {
      onStart();
    } else if (isPlaying) {
      onPause();
    } else {
      onResume();
    }
  };

  const isLiquid = theme === 'liquid';

  // Container styles
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  };

  // Liquid glass effect for popout
  const liquidGlassStyle: React.CSSProperties = isLiquid
    ? {
        background: colors.glassBackground,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px ${colors.glassShadowPrimary}, 0 2px 8px ${colors.glassShadowSecondary}`,
        border: `1px solid ${colors.glassBorder}`,
      }
    : {
        background: colors.containerBackground,
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
        border: `1px solid ${colors.border}`,
      };

  // Play button styles
  const playButtonStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ...liquidGlassStyle,
  };

  // Expand button styles
  const expandButtonStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ...liquidGlassStyle,
  };

  // Popout panel styles
  const popoutStyle: React.CSSProperties = {
    width: 240,
    padding: 16,
    borderRadius: 8,
    ...liquidGlassStyle,
  };

  // Time indicator styles (when enabled and not expanded)
  const timeIndicatorStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: '0.75rem',
    fontWeight: 500,
    color: colors.text,
    ...liquidGlassStyle,
  };

  // Mode button styles
  const getModeButtonStyle = (modeId: LayerRevealMode): React.CSSProperties => {
    const isActive = mode === modeId;
    return {
      flex: 1,
      padding: '6px 8px',
      borderRadius: 4,
      fontSize: '0.6875rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      border: `1px solid ${isActive ? colors.accentPrimary : colors.border}`,
      background: isActive ? colors.accentPrimary : 'transparent',
      color: isActive ? colors.buttonText : colors.text,
      textAlign: 'center' as const,
    };
  };

  // Progress bar styles
  const progressBarContainerStyle: React.CSSProperties = {
    width: '100%',
    height: 4,
    background: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  };

  const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    width: `${progress * 100}%`,
    background: colors.accentPrimary,
    borderRadius: 2,
    transition: 'width 0.1s linear',
  };

  // Reset button styles
  const resetButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 4,
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* Expanded popout panel (positioned above buttons) */}
      {expanded && (
        <div style={popoutStyle}>
          {/* Title */}
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Layer Reveal Animation
          </div>

          {/* Mode selection */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: '0.6875rem',
                color: colors.textSecondary,
                marginBottom: 6,
              }}
            >
              Mode
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  style={getModeButtonStyle(opt.id)}
                  onClick={() => onModeChange(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed slider */}
          <div style={{ marginBottom: 12 }}>
            <UnifiedSlider
              label="Speed"
              value={rate}
              min={0.1}
              max={25}
              step={0.1}
              unit=" layers/s"
              onChange={onRateChange}
              showValue={true}
              compact={true}
            />
          </div>

          {/* Progress bar (when enabled) */}
          {enabled && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: colors.textSecondary,
                  marginBottom: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Progress</span>
                <span>{(progress * 100).toFixed(0)}%</span>
              </div>
              <div style={progressBarContainerStyle}>
                <div style={progressBarFillStyle} />
              </div>
            </div>
          )}

          {/* Current time display (when enabled and currentTime provided) */}
          {enabled && currentTime !== undefined && (
            <div
              style={{
                fontSize: '0.75rem',
                color: colors.text,
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: colors.textSecondary }}>Current Time:</span>
              <span style={{ fontWeight: 500 }}>{currentTime.toFixed(2)}</span>
            </div>
          )}

          {/* Reset button (when enabled) */}
          {enabled && (
            <button
              style={resetButtonStyle}
              onClick={onCancel}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.hoverOverlay;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <RotateCcw size={14} />
              Reset Animation
            </button>
          )}
        </div>
      )}

      {/* Time indicator (when enabled, not expanded, and currentTime provided) */}
      {enabled && !expanded && currentTime !== undefined && (
        <div style={timeIndicatorStyle}>Time: {currentTime.toFixed(2)}</div>
      )}

      {/* Button row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Play/Pause button */}
        <button
          style={playButtonStyle}
          onClick={handlePlayPause}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label={!enabled ? 'Start animation' : isPlaying ? 'Pause animation' : 'Resume animation'}
        >
          {isPlaying ? (
            <Pause size={18} color={colors.accentPrimary} />
          ) : (
            <Play size={18} color={colors.accentPrimary} />
          )}
        </button>

        {/* Expand/Collapse button */}
        <button
          style={expandButtonStyle}
          onClick={() => setExpanded(!expanded)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label={expanded ? 'Collapse controls' : 'Expand controls'}
        >
          {expanded ? (
            <ChevronDown size={16} color={colors.text} />
          ) : (
            <ChevronUp size={16} color={colors.text} />
          )}
        </button>
      </div>
    </div>
  );
};

export default SpatialArg3DAnimationPopout;
