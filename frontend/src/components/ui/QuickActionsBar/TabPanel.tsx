/**
 * TabPanel Component
 * 
 * Individual tab button in the Quick Actions Bar.
 * Implements Liquid Glass design system with:
 * - Accessible button with ARIA labels
 * - Keyboard navigation support
 * - Active state styling
 * - Hover effects
 * - Badge support for notifications
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { TabPanelProps } from './QuickActionsBar.types';

export const TabPanel: React.FC<TabPanelProps> = ({
  tab,
  isActive,
  onClick,
  className = '',
  showShortcutHint = false,
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    border: 'none',
    background: isActive ? colors.hoverOverlay : 'transparent',
    color: isActive ? colors.accentPrimary : colors.text,
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '0.5rem',
    cursor: tab.disabled ? 'not-allowed' : 'pointer',
    opacity: tab.disabled ? 0.5 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    position: 'relative',
    userSelect: 'none',
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const hoverStyle: React.CSSProperties = isHovered && !tab.disabled && !isActive
    ? {
        background: colors.hoverOverlay,
        transform: 'translateY(-1px)',
      }
    : {};

  const activeIndicatorStyle: React.CSSProperties = isActive
    ? {
        position: 'absolute',
        bottom: '-2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '50%',
        height: '2px',
        background: colors.accentPrimary,
        borderRadius: '2px 2px 0 0',
      }
    : {};

  const badgeStyle: React.CSSProperties = {
    minWidth: '1.25rem',
    height: '1.25rem',
    padding: '0 0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.accentPrimary,
    color: colors.buttonText,
    borderRadius: '0.625rem',
    fontSize: '0.625rem',
    fontWeight: 600,
  };

  const shortcutHintStyle: React.CSSProperties = {
    padding: '0.125rem 0.375rem',
    background: isLiquid
      ? 'rgba(20, 226, 168, 0.08)'
      : 'rgba(0, 0, 0, 0.1)',
    border: `1px solid ${isLiquid ? 'rgba(20, 226, 168, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`,
    borderRadius: '0.25rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    fontFamily: 'monospace',
    color: isActive ? colors.accentPrimary : colors.textSecondary,
    opacity: isHovered ? 1 : 0.7,
    transition: 'opacity 0.15s ease',
  };

  const handleClick = () => {
    if (!tab.disabled) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!tab.disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${tab.id}`}
      aria-label={tab.ariaLabel || `${tab.label} tab`}
      aria-disabled={tab.disabled}
      tabIndex={tab.disabled ? -1 : 0}
      title={`${tab.label} (${tab.shortcut.toUpperCase()})`}
      style={{ ...baseStyle, ...hoverStyle }}
      className={className}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon (optional) */}
      {tab.icon && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {tab.icon}
        </span>
      )}

      {/* Label */}
      <span>{tab.label}</span>

      {/* Shortcut hint badge (if enabled) */}
      {showShortcutHint && tab.shortcut && (
        <span 
          style={shortcutHintStyle}
          aria-hidden="true"
        >
          {tab.shortcut.toUpperCase()}
        </span>
      )}

      {/* Badge (if present) */}
      {tab.badge !== undefined && (
        <span style={badgeStyle} aria-label={`${tab.badge} items`}>
          {tab.badge}
        </span>
      )}

      {/* Active indicator underline */}
      {isActive && <div style={activeIndicatorStyle} />}
    </button>
  );
};

export default TabPanel;

