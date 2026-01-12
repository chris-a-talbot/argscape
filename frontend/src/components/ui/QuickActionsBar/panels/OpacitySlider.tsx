/**
 * OpacitySlider Component
 * 
 * Slider control for adjusting opacity in Highlight mode
 * Provides visual feedback with gradient preview
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { OpacitySliderProps } from './FilterPanel.types';

export const OpacitySlider: React.FC<OpacitySliderProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Dimmed Opacity',
  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const isLiquid = theme === 'liquid';

  // Convert mouse position to opacity value (0-1)
  const getValueFromPosition = useCallback((clientX: number): number => {
    if (!sliderRef.current) return value;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(percentage * 100) / 100; // Round to 2 decimal places
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    
    const newValue = getValueFromPosition(e.clientX);
    onChange(newValue);
  }, [disabled, getValueFromPosition, onChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || disabled) return;
    
    const newValue = getValueFromPosition(e.clientX);
    onChange(newValue);
  }, [isDragging, disabled, getValueFromPosition, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'default',
  };

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: colors.text,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.accentPrimary,
    fontFamily: 'monospace',
  };

  const trackContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '0.75rem',
    borderRadius: '0.5rem',
    background: `linear-gradient(to right, 
      ${colors.background}00 0%, 
      ${colors.background}40 50%, 
      ${colors.background}99 100%)`,
    border: `1px solid ${colors.border}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  const fillStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: `${value * 100}%`,
    background: colors.accentPrimary,
    borderRadius: '0.5rem 0 0 0.5rem',
    opacity: 0.3,
    transition: isDragging ? 'none' : 'width 0.15s ease',
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${value * 100}%`,
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '50%',
    background: colors.background,
    border: `2px solid ${colors.accentPrimary}`,
    boxShadow: `0 2px 8px ${colors.accentPrimary}40, 0 0 0 4px ${colors.background}`,
    cursor: disabled ? 'not-allowed' : 'grab',
    transition: isDragging ? 'none' : 'left 0.15s ease',
    zIndex: 10,
  };

  const previewStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: colors.textSecondary,
  };

  const previewBoxStyle: React.CSSProperties = {
    width: '3rem',
    height: '1rem',
    borderRadius: '0.25rem',
    background: isLiquid ? 'rgba(255, 255, 255, 0.8)' : colors.containerBackground,
    border: `1px solid ${colors.border}`,
    position: 'relative',
    overflow: 'hidden',
  };

  const previewOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: colors.background,
    opacity: value,
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Label and value */}
      <div style={labelContainerStyle}>
        <span style={labelStyle}>{label}</span>
        <span style={valueStyle}>{Math.round(value * 100)}%</span>
      </div>

      {/* Track and thumb */}
      <div style={trackContainerStyle}>
        <div
          ref={sliderRef}
          style={trackStyle}
          onMouseDown={handleMouseDown}
          role="slider"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(value * 100)}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
        >
          <div style={fillStyle} />
          <div style={thumbStyle} />
        </div>

        {/* Preview */}
        <div style={previewStyle}>
          <div style={previewBoxStyle}>
            <div style={previewOverlayStyle} />
          </div>
          <span>Preview of dimmed elements</span>
        </div>
      </div>
    </div>
  );
};

export default OpacitySlider;





