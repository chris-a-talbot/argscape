import React, { useState, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

interface TooltipProps {
  content: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, className = "" }) => {
  const { colors } = useColorTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!buttonRef.current || !tooltipRef.current || !isVisible) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = buttonRect.top - tooltipRect.height - 8; // 8px gap above button
    let left = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2); // Center horizontally
    
    // Adjust horizontal position if tooltip would extend beyond viewport
    if (left < 8) {
      left = 8; // 8px margin from left edge
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8; // 8px margin from right edge
    }
    
    // Adjust vertical position if tooltip would extend beyond viewport
    if (top < 8) {
      // Position below button instead
      top = buttonRect.bottom + 8;
    }
    
    // If still doesn't fit below, position at the edge with margin
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }
    
    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure tooltip is rendered before positioning
      const timer = setTimeout(updatePosition, 10);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isVisible]);

  const handleShow = () => {
    setIsVisible(true);
  };

  const handleHide = () => {
    setIsVisible(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${className}`}
        style={{
          backgroundColor: colors.background,
          borderColor: `${colors.accentPrimary}80`,
          color: `${colors.accentPrimary}CC`
        }}
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onFocus={handleShow}
        onBlur={handleHide}
        type="button"
        aria-label="More information"
      >
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </button>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] max-w-xs pointer-events-none"
          style={{ 
            top: `${position.top}px`,
            left: `${position.left}px`,
            minWidth: '200px'
          }}
        >
          <div
            className="px-3 py-2 text-xs rounded-lg shadow-lg border"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
              boxShadow: `0 4px 6px -1px ${colors.border}40, 0 10px 15px -3px ${colors.border}30`
            }}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
}; 