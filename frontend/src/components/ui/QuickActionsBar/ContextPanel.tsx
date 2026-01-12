/**
 * ContextPanel Component (Phase 2)
 * 
 * Slide-in context panel for displaying detailed information:
 * - Node Inspector
 * - Edge Inspector  
 * - Cluster Details
 * - Diff Details
 * 
 * Features:
 * - Slides in from right side
 * - Glass morphism styling
 * - Closable with X button or ESC key
 * - Stacking support (multiple panels)
 * - Backdrop overlay for focus
 */

import React, { useEffect } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { ContextPanelProps } from './QuickActionsBar.types';

export const ContextPanel: React.FC<ContextPanelProps> = ({
  panel,
  isOpen,
  onClose,
  className = '',
}) => {
  const { colors, theme } = useColorTheme();

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isLiquid = theme === 'liquid';

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: panel.zIndex || 200,
    animation: 'fadeIn 0.2s ease-out',
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: panel.width || '400px',
    maxWidth: '90vw',
    background: isLiquid ? 'rgba(255, 255, 255, 0.95)' : colors.containerBackground,
    backdropFilter: isLiquid ? 'blur(24px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(24px)' : 'none',
    borderLeft: `1px solid ${colors.border}`,
    boxShadow: isLiquid
      ? '-8px 0 32px rgba(20, 226, 168, 0.12), -2px 0 8px rgba(0, 0, 0, 0.04)'
      : '-2px 0 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: (panel.zIndex || 200) + 1,
    animation: 'slideInFromRight 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.5rem',
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: colors.text,
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
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
    fontSize: '1.25rem',
    lineHeight: 1,
  };

  const [closeHovered, setCloseHovered] = React.useState(false);

  const closeHoverStyle: React.CSSProperties = closeHovered
    ? {
        background: colors.hoverOverlay,
        color: colors.text,
      }
    : {};

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem',
  };

  return (
    <>
      {/* Backdrop */}
      <div style={backdropStyle} onClick={onClose} />

      {/* Panel */}
      <div style={panelStyle} className={className} role="dialog" aria-modal="true" aria-labelledby="context-panel-title">
        {/* Header */}
        <div style={headerStyle}>
          <h2 id="context-panel-title" style={titleStyle}>
            {panel.title}
          </h2>

          {panel.closable !== false && (
            <button
              type="button"
              aria-label="Close panel"
              title="Close (ESC)"
              style={{ ...closeButtonStyle, ...closeHoverStyle }}
              onClick={onClose}
              onMouseEnter={() => setCloseHovered(true)}
              onMouseLeave={() => setCloseHovered(false)}
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div style={contentStyle}>{panel.content}</div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes fadeIn,
          @keyframes slideInFromRight {
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
};

export default ContextPanel;

