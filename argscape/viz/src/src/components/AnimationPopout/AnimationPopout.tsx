/**
 * AnimationPopout Component
 *
 * Floating animation button with expandable controls.
 * Supports both temporal and genomic animations.
 */

import React, { useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useAnimationStore, useUIStore } from '@/stores'

interface AnimationPopoutProps {
  minimal?: boolean  // When true, only show play button
}

const TEMPORAL_MODE_OPTIONS = [
  { id: 'hide' as const, label: 'Hide' },
  { id: 'glide' as const, label: 'Glide' },
  { id: 'root-to-samples' as const, label: 'Root→Samples' },
]

export const AnimationPopout: React.FC<AnimationPopoutProps> = ({ minimal = false }) => {
  const theme = useUIStore(state => state.theme)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    config,
    activeType,
    isPlaying,
    isPaused,
    progress,
    temporalMode,
    temporalRate,
    genomicRate,
    isExpanded,
    setActiveType,
    start,
    pause,
    resume,
    reset,
    setTemporalMode,
    setTemporalRate,
    setGenomicRate,
    setExpanded,
  } = useAnimationStore()

  // Close popout when clicking outside
  useEffect(() => {
    if (!isExpanded) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded, setExpanded])

  // Don't render if no animation config or theme
  if (!config || !theme) return null

  const hasBothTypes = config.temporal && config.genomic
  const currentRate = activeType === 'temporal' ? temporalRate : genomicRate

  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
    } else if (isPaused) {
      resume()
    } else {
      start()
    }
  }

  const colors = {
    background: theme.background,
    text: theme.text,
    textSecondary: theme.text_secondary,
    accent: theme.nodes.sample,
    border: theme.text + '33',
  }

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 80,  // Above genomic filter
    left: 16,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  }

  const glassStyle: React.CSSProperties = {
    background: colors.background + 'ee',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    border: `1px solid ${colors.border}`,
  }

  const buttonStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    ...glassStyle,
  }

  const expandButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    width: 28,
    height: 28,
  }

  const popoutStyle: React.CSSProperties = {
    width: 260,
    padding: 16,
    borderRadius: 8,
    ...glassStyle,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    color: colors.textSecondary,
    marginBottom: 6,
  }

  const modeButtonStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '6px 8px',
    borderRadius: 4,
    fontSize: '0.6875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: `1px solid ${isActive ? colors.accent : colors.border}`,
    background: isActive ? colors.accent : 'transparent',
    color: isActive ? colors.background : colors.text,
    textAlign: 'center' as const,
  })

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* Expanded panel */}
      {isExpanded && !minimal && (
        <div style={popoutStyle}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text, marginBottom: 12 }}>
            Animation Controls
          </div>

          {/* Animation type toggle (if both configured) */}
          {hasBothTypes && (
            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Animation Type</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  style={modeButtonStyle(activeType === 'temporal')}
                  onClick={() => setActiveType('temporal')}
                >
                  Temporal
                </button>
                <button
                  style={modeButtonStyle(activeType === 'genomic')}
                  onClick={() => setActiveType('genomic')}
                >
                  Genomic
                </button>
              </div>
            </div>
          )}

          {/* Temporal mode selection */}
          {activeType === 'temporal' && (
            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Mode</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {TEMPORAL_MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    style={modeButtonStyle(temporalMode === opt.id)}
                    onClick={() => setTemporalMode(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Speed slider */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
              <span>Speed</span>
              <span>{currentRate.toFixed(1)} {activeType === 'temporal' ? 'layers/s' : 'steps/s'}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={25}
              step={0.1}
              value={currentRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (activeType === 'temporal') {
                  setTemporalRate(val)
                } else {
                  setGenomicRate(val)
                }
              }}
              style={{ width: '100%', accentColor: colors.accent }}
            />
          </div>

          {/* Progress bar */}
          {(isPlaying || isPaused) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                <span>Progress</span>
                <span>{(progress * 100).toFixed(0)}%</span>
              </div>
              <div style={{ width: '100%', height: 4, background: colors.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress * 100}%`, background: colors.accent, transition: 'width 0.1s' }} />
              </div>
            </div>
          )}

          {/* Reset button */}
          {(isPlaying || isPaused) && (
            <button
              onClick={reset}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: `1px solid ${colors.border}`,
                background: 'transparent',
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
      )}

      {/* Button row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Play/Pause button */}
        <button
          style={buttonStyle}
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={18} color={colors.accent} />
          ) : (
            <Play size={18} color={colors.accent} />
          )}
        </button>

        {/* Expand button (hidden in minimal mode) */}
        {!minimal && (
          <button
            style={expandButtonStyle}
            onClick={() => setExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown size={16} color={colors.text} />
            ) : (
              <ChevronUp size={16} color={colors.text} />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default AnimationPopout
