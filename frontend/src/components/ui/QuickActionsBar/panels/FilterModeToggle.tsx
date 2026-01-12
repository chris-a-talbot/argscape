/**
 * FilterModeToggle Component
 * 
 * Toggle switch for Subset/Highlight filter modes
 * Implements Liquid Glass design system with smooth transitions
 */

import React, { useState } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { FilterModeToggleProps } from './FilterPanel.types';

export const FilterModeToggle: React.FC<FilterModeToggleProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const [hoveredOption, setHoveredOption] = useState<'subset' | 'highlight' | null>(null);

  const isLiquid = theme === 'liquid';

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem',
    background: isLiquid ? 'rgba(255, 255, 255, 0.5)' : colors.border,
    backdropFilter: isLiquid ? 'blur(8px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(8px)' : 'none',
    borderRadius: '0.5rem',
    position: 'relative',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  const optionBaseStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '0.375rem',
    border: 'none',
    background: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    position: 'relative',
    zIndex: 1,
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const getOptionStyle = (option: 'subset' | 'highlight'): React.CSSProperties => {
    const isActive = value === option;
    const isHovered = hoveredOption === option;

    return {
      ...optionBaseStyle,
      color: isActive ? colors.buttonText : colors.text,
      background: isActive
        ? colors.accentPrimary
        : isHovered && !disabled
        ? colors.hoverOverlay
        : 'transparent',
      transform: isActive ? 'scale(1.02)' : 'scale(1)',
      boxShadow: isActive
        ? `0 2px 8px ${colors.accentPrimary}40`
        : 'none',
    };
  };

  const handleClick = (mode: 'subset' | 'highlight') => {
    if (!disabled) {
      onChange(mode);
    }
  };

  return (
    <div style={containerStyle} className={className} role="group" aria-label="Filter mode">
      <button
        type="button"
        style={getOptionStyle('subset')}
        onClick={() => handleClick('subset')}
        onMouseEnter={() => setHoveredOption('subset')}
        onMouseLeave={() => setHoveredOption(null)}
        disabled={disabled}
        aria-pressed={value === 'subset'}
        aria-label="Subset mode: Show only filtered data"
        title="Subset mode: Show only filtered data"
      >
        Subset
      </button>
      
      <button
        type="button"
        style={getOptionStyle('highlight')}
        onClick={() => handleClick('highlight')}
        onMouseEnter={() => setHoveredOption('highlight')}
        onMouseLeave={() => setHoveredOption(null)}
        disabled={disabled}
        aria-pressed={value === 'highlight'}
        aria-label="Highlight mode: Dim filtered-out data"
        title="Highlight mode: Dim filtered-out data"
      >
        Highlight
      </button>
    </div>
  );
};

export default FilterModeToggle;





