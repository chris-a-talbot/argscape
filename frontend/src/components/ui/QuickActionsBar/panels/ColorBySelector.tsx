/**
 * ColorBySelector Component
 *
 * Compact toggle for color mode: Type (default) or Population.
 * Uses styling consistent with filter/view panels.
 */

import React from 'react';
import { ColorBySelectorProps, ColorByMode } from './StylePanel.types';
import { useColorTheme } from '../../../../context/ColorThemeContext';

export const ColorBySelector: React.FC<ColorBySelectorProps> = ({
  value,
  onChange,
  disabledModes = [],
  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  const isPopulationDisabled = disabledModes.includes('population');

  const buttonStyle = (isActive: boolean, isDisabled: boolean = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    fontSize: '0.6875rem',
    fontWeight: 500,
    border: `1px solid ${isActive ? colors.accentPrimary : colors.border}`,
    borderRadius: '0.25rem',
    background: isActive
      ? (isLiquid ? 'rgba(20, 226, 168, 0.15)' : `${colors.accentPrimary}20`)
      : 'transparent',
    color: isDisabled
      ? colors.textSecondary
      : isActive ? colors.accentPrimary : colors.text,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: isDisabled ? 0.5 : 1,
  });

  return (
    <div className={className} style={{ display: 'flex', gap: '0.25rem' }}>
      <button
        type="button"
        onClick={() => onChange('type')}
        style={buttonStyle(value === 'type' || value === 'none')}
        title="Color nodes by type (sample, internal, root)"
      >
        Type
      </button>
      <button
        type="button"
        onClick={() => !isPopulationDisabled && onChange('population')}
        disabled={isPopulationDisabled}
        style={buttonStyle(value === 'population', isPopulationDisabled)}
        title={isPopulationDisabled ? 'No population data available' : 'Color nodes by population'}
      >
        Population
      </button>
    </div>
  );
};





