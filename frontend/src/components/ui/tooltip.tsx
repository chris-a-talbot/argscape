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

  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position to the right of the button by default
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8
      });
    }
  }, [isVisible]);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={buttonRef}
        className="w-4 h-4 rounded-full border flex items-center justify-center transition-colors"
        style={{
          backgroundColor: colors.background,
          borderColor: `${colors.accentPrimary}80`,
          color: `${colors.accentPrimary}CC`
        }}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        type="button"
        aria-label="More information"
      >
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </button>
      
      {isVisible && (
        <div
          className="fixed z-[9999] pointer-events-none -translate-y-1/2"
          style={{ 
            minWidth: '250px', 
            maxWidth: '350px',
            top: position.top,
            left: position.left
          }}
        >
          <div
            className="px-3 py-2 text-xs rounded-lg shadow-lg border whitespace-normal"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
              boxShadow: `0 4px 6px -1px ${colors.border}40, 0 10px 15px -3px ${colors.border}30`
            }}
          >
            {content}
          </div>
          {/* Arrow pointing left */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 right-full mr-[-1px]"
            style={{
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: `6px solid ${colors.border}`
            }}
          />
        </div>
      )}
    </div>
  );
}; 