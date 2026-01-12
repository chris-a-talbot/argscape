/**
 * MoreOptionsExpander Component
 *
 * Progressive disclosure component for the Quick Actions Bar panels.
 * Allows hiding advanced controls behind an expandable section.
 *
 * Features:
 * - Smooth expand/collapse animation
 * - Liquid Glass design system integration
 * - Keyboard accessible
 * - Customizable label and icon
 */

import React, { useState, useRef, useEffect } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';

export interface MoreOptionsExpanderProps {
  /** Label shown on the expander button */
  label?: string;
  /** Whether the section starts expanded */
  defaultExpanded?: boolean;
  /** Controlled expanded state (if provided, component is controlled) */
  expanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Children to render inside the expandable section */
  children: React.ReactNode;
  /** Additional className for the container */
  className?: string;
  /** Whether to show a subtle divider above the expander */
  showDivider?: boolean;
}

export const MoreOptionsExpander: React.FC<MoreOptionsExpanderProps> = ({
  label = 'More options',
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandedChange,
  children,
  className = '',
  showDivider = true,
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  // Internal state for uncontrolled mode
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [children, isExpanded]);

  const handleToggle = () => {
    const newValue = !isExpanded;
    if (controlledExpanded === undefined) {
      setInternalExpanded(newValue);
    }
    onExpandedChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  };

  const dividerStyle: React.CSSProperties = showDivider ? {
    height: '1px',
    background: colors.border,
    opacity: 0.3,
    marginBottom: '0.75rem',
  } : {};

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: 'none',
    background: isHovered
      ? (isLiquid ? 'rgba(20, 226, 168, 0.05)' : colors.hoverOverlay)
      : 'transparent',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
  };

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: isExpanded ? colors.accentPrimary : colors.textSecondary,
    transition: 'color 0.2s ease',
  };

  const iconContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '0.25rem',
    background: isExpanded
      ? (isLiquid ? 'rgba(20, 226, 168, 0.1)' : `${colors.accentPrimary}15`)
      : 'transparent',
    transition: 'all 0.2s ease',
  };

  const chevronStyle: React.CSSProperties = {
    width: '0.875rem',
    height: '0.875rem',
    color: isExpanded ? colors.accentPrimary : colors.textSecondary,
    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1), color 0.2s ease',
  };

  const contentContainerStyle: React.CSSProperties = {
    overflow: 'hidden',
    maxHeight: isExpanded ? `${contentHeight}px` : '0px',
    opacity: isExpanded ? 1 : 0,
    transition: 'max-height 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.2s ease',
  };

  const contentInnerStyle: React.CSSProperties = {
    paddingTop: '0.75rem',
    paddingLeft: '0.25rem',
    paddingRight: '0.25rem',
  };

  // Chevron SVG icon
  const ChevronIcon = (
    <svg
      style={chevronStyle}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Settings gear icon for label
  const SettingsIcon = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ color: isExpanded ? colors.accentPrimary : colors.textSecondary }}
    >
      <path
        d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.93 10C12.7888 10.3016 12.7478 10.6362 12.8125 10.9606C12.8772 11.285 13.0448 11.5843 13.29 11.82L13.35 11.88C13.5492 12.0791 13.7076 12.3149 13.8163 12.5735C13.9249 12.8321 13.9818 13.1086 13.9837 13.3881C13.9856 13.6676 13.9326 13.9449 13.8275 14.205C13.7225 14.4651 13.5674 14.7032 13.371 14.905C13.1745 15.1068 12.9406 15.268 12.6833 15.3798C12.4261 15.4916 12.1502 15.5519 11.8709 15.5575C11.5916 15.5631 11.3136 15.5139 11.0524 15.4126C10.7912 15.3112 10.5517 15.1596 10.348 14.966L10.288 14.906C10.0523 14.6608 9.75301 14.4932 9.42857 14.4285C9.10414 14.3638 8.76947 14.4048 8.46797 14.546C8.17222 14.68 7.92083 14.8963 7.74497 15.1697C7.56912 15.4431 7.47662 15.7616 7.47797 16.087V16.267C7.47797 16.8234 7.25733 17.3569 6.86426 17.75C6.47118 18.143 5.93768 18.3637 5.38147 18.3637C4.82525 18.3637 4.29175 18.143 3.89867 17.75C3.5056 17.3569 3.28497 16.8234 3.28497 16.267V16.173C3.27788 15.8377 3.17341 15.5116 2.98257 15.2358C2.79173 14.9599 2.52254 14.7466 2.20797 14.623C1.90647 14.4818 1.57181 14.4408 1.24737 14.5055C0.922934 14.5702 0.623609 14.7378 0.387969 14.983L0.327969 15.043C0.124334 15.2366 -0.0273061 15.4761 -0.11543 15.7373C-0.203555 15.9985 -0.225839 16.2765 -0.180369 16.5481C-0.1349 16.8196 -0.0236152 17.077 0.143977 17.3006C0.311569 17.5241 0.531053 17.7077 0.784969 17.836L0.844969 17.896C1.09018 18.1318 1.25777 18.431 1.32246 18.7555C1.38715 19.0799 1.34615 19.4146 1.20497 19.716"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="scale(0.8) translate(1.5, 1.5)"
      />
    </svg>
  );

  return (
    <div style={containerStyle} className={className}>
      {showDivider && <div style={dividerStyle} />}

      <button
        type="button"
        role="button"
        aria-expanded={isExpanded}
        aria-controls="more-options-content"
        style={buttonStyle}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={labelContainerStyle}>
          {SettingsIcon}
          <span style={labelStyle}>{label}</span>
        </div>
        <div style={iconContainerStyle}>
          {ChevronIcon}
        </div>
      </button>

      <div
        id="more-options-content"
        style={contentContainerStyle}
        aria-hidden={!isExpanded}
      >
        <div ref={contentRef} style={contentInnerStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default MoreOptionsExpander;
