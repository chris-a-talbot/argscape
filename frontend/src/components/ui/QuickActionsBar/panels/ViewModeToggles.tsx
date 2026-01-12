/**
 * ViewModeToggles Component
 * 
 * Show/hide toggles for various visualization elements.
 * Provides quick access to visibility controls for nodes, edges,
 * labels, grids, and other visual elements.
 * Follows Liquid Glass design system with clear state indication.
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { ViewModeTogglesProps, ViewModeToggle } from './ViewPanel.types';

export const ViewModeToggles: React.FC<ViewModeTogglesProps> = ({
  toggles,
  onToggleChange,
  layout = 'grid',
  className = ''
}) => {
  const { colors } = useColorTheme();
  const [hoveredToggle, setHoveredToggle] = React.useState<string | null>(null);

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

  const gridContainerStyle: React.CSSProperties = {
    display: layout === 'grid' ? 'grid' : 'flex',
    gridTemplateColumns: layout === 'grid' ? 'repeat(2, 1fr)' : undefined,
    flexDirection: layout === 'list' ? 'column' : undefined,
    gap: '0.5rem',
  };

  const getToggleStyle = (toggle: ViewModeToggle): React.CSSProperties => {
    const isHovered = hoveredToggle === toggle.id;
    const isDisabled = toggle.disabled;

    return {
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      padding: '0.75rem',
      border: `1px solid ${colors.border}`,
      borderRadius: '0.5rem',
      background: isHovered && !isDisabled ? colors.hoverOverlay : colors.containerBackground,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
      userSelect: 'none',
      opacity: isDisabled ? 0.5 : 1,
      transform: isHovered && !isDisabled ? 'translateY(-1px)' : 'none',
    };
  };

  const checkboxStyle = (enabled: boolean, disabled: boolean): React.CSSProperties => ({
    width: '1.25rem',
    height: '1.25rem',
    minWidth: '1.25rem',
    borderRadius: '0.375rem',
    border: `2px solid ${enabled ? colors.accentPrimary : colors.border}`,
    background: enabled ? colors.accentPrimary : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    flexShrink: 0,
  });

  const checkmarkStyle: React.CSSProperties = {
    color: colors.buttonText,
    fontSize: '0.875rem',
    fontWeight: 'bold',
    lineHeight: 1,
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
    color: colors.text,
    lineHeight: 1.2,
  };

  const tooltipStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    color: colors.text,
    opacity: 0.6,
    lineHeight: 1.3,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '1rem',
    lineHeight: 1,
    flexShrink: 0,
  };

  const handleToggleClick = (toggle: ViewModeToggle) => {
    if (!toggle.disabled) {
      onToggleChange(toggle.id, !toggle.enabled);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, toggle: ViewModeToggle) => {
    if (!toggle.disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleToggleClick(toggle);
    }
  };

  if (toggles.length === 0) {
    return null;
  }

  return (
    <div style={containerStyle} className={className}>
      <div style={headerStyle}>
        Show/Hide Elements
      </div>
      
      <div style={gridContainerStyle}>
        {toggles.map((toggle) => (
          <div
            key={toggle.id}
            role="checkbox"
            aria-checked={toggle.enabled}
            aria-label={toggle.label}
            aria-disabled={toggle.disabled}
            tabIndex={toggle.disabled ? -1 : 0}
            title={toggle.tooltip}
            style={getToggleStyle(toggle)}
            onClick={() => handleToggleClick(toggle)}
            onKeyDown={(e) => handleKeyDown(e, toggle)}
            onMouseEnter={() => setHoveredToggle(toggle.id)}
            onMouseLeave={() => setHoveredToggle(null)}
          >
            {/* Custom checkbox */}
            <div style={checkboxStyle(toggle.enabled, !!toggle.disabled)}>
              {toggle.enabled && (
                <span style={checkmarkStyle}>✓</span>
              )}
            </div>
            
            {/* Icon (optional) */}
            {toggle.icon && (
              <span style={iconStyle}>{toggle.icon}</span>
            )}
            
            {/* Label and tooltip */}
            <div style={labelContainerStyle}>
              <span style={labelStyle}>{toggle.label}</span>
              {toggle.tooltip && (
                <span style={tooltipStyle}>{toggle.tooltip}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewModeToggles;





