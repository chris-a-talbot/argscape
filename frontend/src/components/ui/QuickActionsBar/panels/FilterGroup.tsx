/**
 * FilterGroup Component
 * 
 * Wrapper component for grouping related filter controls
 * Provides consistent styling and optional collapse functionality
 */

import React, { useState } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { FilterGroupProps } from './FilterPanel.types';

export const FilterGroup: React.FC<FilterGroupProps> = ({
  label,
  icon,
  children,
  collapsible = false,
  defaultExpanded = true,
  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const containerStyle: React.CSSProperties = {
    marginBottom: '1rem',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: isExpanded ? '0.75rem' : '0',
    cursor: collapsible ? 'pointer' : 'default',
    padding: collapsible ? '0.5rem' : '0',
    borderRadius: '0.5rem',
    transition: 'background-color 0.15s ease',
  };

  const [isHovered, setIsHovered] = useState(false);

  const hoverStyle: React.CSSProperties = 
    collapsible && isHovered
      ? { backgroundColor: colors.hoverOverlay }
      : {};

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.text,
    userSelect: 'none',
    flex: 1,
  };

  const iconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.25rem',
    height: '1.25rem',
    color: colors.accentPrimary,
  };

  const expandIconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1rem',
    height: '1rem',
    color: colors.textSecondary,
    transition: 'transform 0.2s ease',
    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
  };

  const contentStyle: React.CSSProperties = {
    overflow: 'hidden',
    transition: 'max-height 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.2s ease',
    maxHeight: isExpanded ? '1000px' : '0',
    opacity: isExpanded ? 1 : 0,
  };

  const handleHeaderClick = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Header */}
      <div
        style={{ ...headerStyle, ...hoverStyle }}
        onClick={handleHeaderClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={(e) => {
          if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleHeaderClick();
          }
        }}
      >
        {/* Expand/collapse icon */}
        {collapsible && (
          <div style={expandIconStyle}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M4 2L8 6L4 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Icon */}
        {icon && <div style={iconStyle}>{icon}</div>}

        {/* Label */}
        <div style={labelStyle}>{label}</div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default FilterGroup;





