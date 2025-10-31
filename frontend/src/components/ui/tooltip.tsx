import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

interface TooltipProps {
  content: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, className = "" }) => {
  const { colors } = useColorTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<'right' | 'left' | 'top' | 'bottom'>('right');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Compute best-fit placement and on-screen position when visible
  const computePosition = () => {
    const btn = buttonRef.current;
    const tip = tooltipRef.current;
    if (!btn || !tip) return;

    const gap = 8;
    const margin = 8;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const rect = btn.getBoundingClientRect();
    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;

    const fits = (left: number, top: number) =>
      left >= margin &&
      left + tipW <= viewportW - margin &&
      top >= margin &&
      top + tipH <= viewportH - margin;

    // Candidate positions
    const candidates: Array<{
      place: 'right' | 'left' | 'top' | 'bottom';
      left: number;
      top: number;
    }> = [
      {
        place: 'right',
        left: rect.right + gap,
        top: rect.top + rect.height / 2 - tipH / 2,
      },
      {
        place: 'left',
        left: rect.left - gap - tipW,
        top: rect.top + rect.height / 2 - tipH / 2,
      },
      {
        place: 'top',
        left: rect.left + rect.width / 2 - tipW / 2,
        top: rect.top - gap - tipH,
      },
      {
        place: 'bottom',
        left: rect.left + rect.width / 2 - tipW / 2,
        top: rect.bottom + gap,
      },
    ];

    let chosen = candidates.find(c => fits(c.left, c.top));

    if (!chosen) {
      // Fallback: prefer right, then clamp to viewport
      const pref = candidates[0];
      const clampedLeft = Math.min(Math.max(pref.left, margin), viewportW - margin - tipW);
      const clampedTop = Math.min(Math.max(pref.top, margin), viewportH - margin - tipH);
      chosen = { ...pref, left: clampedLeft, top: clampedTop } as const;
    }

    setPlacement(chosen.place);
    setPosition({ top: Math.round(chosen.top), left: Math.round(chosen.left) });
  };

  useLayoutEffect(() => {
    if (!isVisible) return;
    computePosition();
    const handler = () => computePosition();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          ref={tooltipRef}
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
          {/* Arrow */}
          {placement === 'right' && (
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
          )}
          {placement === 'left' && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 left-full ml-[-1px]"
              style={{
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderLeft: `6px solid ${colors.border}`
              }}
            />
          )}
          {placement === 'top' && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[-1px]"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${colors.border}`
              }}
            />
          )}
          {placement === 'bottom' && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 top-full mt-[-1px]"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: `6px solid ${colors.border}`
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}; 