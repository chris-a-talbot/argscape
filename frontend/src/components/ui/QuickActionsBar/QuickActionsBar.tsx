/**
 * QuickActionsBar Component
 * 
 * Main Quick Actions Bar component implementing the UI Refactor Proposal.
 * Features:
 * - Horizontal tab bar with Filter, View, Style, Advanced, Stats tabs
 * - Slide-down panel system
 * - Keyboard shortcuts (F, V, S, A, I for tabs, ESC to close)
 * - Liquid Glass design system integration
 * - Responsive layout
 * - Accessibility support (ARIA labels, keyboard navigation)
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useColorTheme, colorStringToRgbaArray } from '@/context/ColorThemeContext';
import { TabPanel } from './TabPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { QuickActionsBarProps, PanelConfig } from './QuickActionsBar.types';

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  tabs,
  panels,
  activeTab,
  onTabChange,
  enableKeyboardShortcuts = true,
  showShortcutHints = false,
  className = '',
  showHelpButton = true,
  onHelpClick,
  compact = false,
  rightContent,
  floating = false,
}) => {
  const { colors, theme } = useColorTheme();
  const { registerShortcut, setEnabled } = useKeyboardShortcuts(enableKeyboardShortcuts);

  // Drag state for floating mode
  const [position, setPosition] = useState({ x: 12, y: 12 }); // 0.75rem = 12px
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!floating) return;
    // Only start drag from the bar itself, not from buttons/inputs
    if ((e.target as HTMLElement).closest('button, input, [role="tablist"]')) return;

    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [floating, position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 200) - 12;
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 50) - 12;

      setPosition({
        x: Math.max(12, Math.min(newX, maxX)),
        y: Math.max(12, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Register keyboard shortcuts for all tabs
  useEffect(() => {
    tabs.forEach((tab) => {
      if (!tab.disabled) {
        registerShortcut({
          key: tab.shortcut,
          action: () => onTabChange(activeTab === tab.id ? null : tab.id),
          description: `Toggle ${tab.label} panel`,
        });
      }
    });

    // Register ESC to close panels
    registerShortcut({
      key: 'Escape',
      action: () => onTabChange(null),
      description: 'Close all panels',
    });

    // Register ? for help
    if (showHelpButton && onHelpClick) {
      registerShortcut({
        key: '?',
        action: onHelpClick,
        description: 'Show keyboard shortcuts help',
        modifiers: { shift: true },
      });
    }
  }, [tabs, activeTab, onTabChange, registerShortcut, showHelpButton, onHelpClick]);

  // Enable/disable shortcuts based on prop
  useEffect(() => {
    setEnabled(enableKeyboardShortcuts);
  }, [enableKeyboardShortcuts, setEnabled]);

  // Find active panel
  const activePanel = panels.find((p) => p.tabId === activeTab);
  const isPanelOpen = activePanel !== undefined;

  // Styles
  const isLiquid = theme === 'liquid';

  // Extract RGB values from theme's glass shadow color
  const shadowRgb = useMemo(() => {
    const rgba = colorStringToRgbaArray(colors.glassShadowPrimary);
    return { r: rgba[0], g: rgba[1], b: rgba[2] };
  }, [colors.glassShadowPrimary]);

  const containerStyle: React.CSSProperties = floating
    ? {
        position: 'absolute',
        top: position.y,
        left: position.x,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        position: 'relative',
        zIndex: 100,
      };

  const barStyle: React.CSSProperties = floating
    ? {
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.375rem 0.5rem',
        background: isLiquid ? 'rgba(255, 255, 255, 0.9)' : colors.containerBackground,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '0.5rem',
        border: `1px solid ${colors.border}`,
        boxShadow: isDragging
          ? '0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.12)'
          : '0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
        transition: isDragging ? 'none' : 'box-shadow 0.15s ease',
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: compact ? '0.25rem' : '0.5rem',
        padding: compact ? '0.5rem 1rem' : '0.75rem 1.5rem',
        background: isLiquid ? colors.glassBackground : colors.containerBackground,
        backdropFilter: isLiquid ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: isLiquid ? 'blur(20px)' : 'none',
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: isLiquid
          ? `0 2px 8px rgba(${shadowRgb.r}, ${shadowRgb.g}, ${shadowRgb.b}, 0.08), 0 1px 4px rgba(0, 0, 0, 0.02)`
          : 'none',
        position: 'relative',
        zIndex: 100,
      };

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: compact ? '0.25rem' : '0.5rem',
    role: 'tablist',
  };

  const rightContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  // Max height for scrolling, but panel sizes to content
  const panelMaxHeight = activePanel?.defaultHeight || 400;
  const panelWidth = activePanel?.defaultWidth;

  const panelContainerStyle: React.CSSProperties = floating
    ? {
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '0.5rem',
        minWidth: panelWidth ? `${panelWidth}px` : '280px',
        maxWidth: panelWidth ? `${panelWidth}px` : '400px',
        overflow: 'hidden',
        transition: 'max-height 0.2s ease-out, opacity 0.15s ease-out',
        maxHeight: isPanelOpen ? `${panelMaxHeight}px` : '0',
        opacity: isPanelOpen ? 1 : 0,
        zIndex: 99,
        pointerEvents: isPanelOpen ? 'auto' : 'none',
      }
    : {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.2s ease-out',
        maxHeight: isPanelOpen ? `${panelMaxHeight}px` : '0',
        opacity: isPanelOpen ? 1 : 0,
        zIndex: 99,
        pointerEvents: isPanelOpen ? 'auto' : 'none',
      };

  const panelInnerStyle: React.CSSProperties = floating
    ? {
        padding: '0.75rem',
        background: isLiquid ? 'rgba(255, 255, 255, 0.95)' : colors.containerBackground,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '0.5rem',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)',
        maxHeight: `${panelMaxHeight - 24}px`,
        overflowY: 'auto',
        overflowX: 'hidden',
      }
    : {
        padding: '0.75rem 1rem',
        background: isLiquid ? colors.glassShimmer : colors.containerBackground,
        backdropFilter: isLiquid ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isLiquid ? 'blur(16px)' : 'none',
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)`,
        maxHeight: `${panelMaxHeight - 24}px`,
        overflowY: 'auto',
        overflowX: 'hidden',
      };

  const helpButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: colors.textSecondary,
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1)',
    fontSize: '1rem',
    fontWeight: 600,
  };

  const [helpHovered, setHelpHovered] = React.useState(false);

  const helpHoverStyle: React.CSSProperties = helpHovered
    ? {
        background: colors.hoverOverlay,
        color: colors.accentPrimary,
        transform: 'scale(1.05)',
      }
    : {};

  // Drag handle style
  const dragHandleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.25rem',
    height: '1.5rem',
    cursor: 'grab',
    color: colors.textSecondary,
    opacity: 0.5,
    marginRight: '0.25rem',
    flexShrink: 0,
  };

  return (
    <div style={containerStyle} className={className} ref={containerRef}>
      {/* Tab Bar */}
      <div style={barStyle} onMouseDown={handleMouseDown}>
        {/* Drag Handle (floating mode only) */}
        {floating && (
          <div
            style={dragHandleStyle}
            title="Drag to move"
            onMouseDown={(e) => {
              setIsDragging(true);
              dragOffset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
              };
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
              <circle cx="3" cy="3" r="1.5" />
              <circle cx="9" cy="3" r="1.5" />
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="9" cy="8" r="1.5" />
              <circle cx="3" cy="13" r="1.5" />
              <circle cx="9" cy="13" r="1.5" />
            </svg>
          </div>
        )}
        {/* Tabs */}
        <div style={tabsContainerStyle} role="tablist">
          {tabs.map((tab) => (
            <TabPanel
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => onTabChange(activeTab === tab.id ? null : tab.id)}
              showShortcutHint={showShortcutHints}
            />
          ))}
        </div>

        {/* Right Content */}
        <div style={rightContentStyle}>
          {rightContent}
          
          {/* Help Button */}
          {showHelpButton && onHelpClick && (
            <button
              type="button"
              title="Show keyboard shortcuts (?)"
              aria-label="Show keyboard shortcuts help"
              style={{ ...helpButtonStyle, ...helpHoverStyle }}
              onClick={onHelpClick}
              onMouseEnter={() => setHelpHovered(true)}
              onMouseLeave={() => setHelpHovered(false)}
            >
              ?
            </button>
          )}
        </div>
      </div>

      {/* Panel Container */}
      <div
        style={panelContainerStyle}
        role="tabpanel"
        id={activePanel ? `panel-${activePanel.tabId}` : undefined}
        aria-labelledby={activePanel ? `tab-${activePanel.tabId}` : undefined}
        aria-hidden={!isPanelOpen}
      >
        {activePanel && (
          <div style={panelInnerStyle}>
            {activePanel.header}
            {activePanel.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActionsBar;

