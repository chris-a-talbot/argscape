import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface TooltipProps {
  content: string | React.ReactNode;
  className?: string;
}

interface GroupTooltipProps {
  content: string | React.ReactNode;
  className?: string;
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
  wide?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, className = "" }) => {
  const { colors, tooltipStyle } = useThemeStyles();
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
    
    // Small delay to ensure DOM has settled after layout changes (e.g., collapsible sections)
    const timeoutId = setTimeout(() => {
      computePosition();
    }, 0);
    
    const handler = () => {
      // Use requestAnimationFrame to ensure we calculate after layout
      requestAnimationFrame(() => {
        computePosition();
      });
    };
    
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    
    return () => {
      clearTimeout(timeoutId);
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
      
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{ 
            minWidth: '250px',
            maxWidth: '350px',
            top: position.top,
            left: position.left
          }}
        >
          <div
            className="px-3 py-2 text-xs whitespace-normal"
            style={{
              ...tooltipStyle,
              padding: '0.75rem',
              fontSize: '0.75rem',
              lineHeight: '1rem'
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
        </div>,
        document.body
      )}
    </div>
  );
};

// Group hover tooltip component with bounds checking
export const GroupTooltip: React.FC<GroupTooltipProps> = ({
  content,
  className = "",
  preferredPlacement = 'bottom',
  wide = false
}) => {
  const { colors, tooltipStyle } = useThemeStyles();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{
    left?: string | number;
    right?: string | number;
    top?: string | number;
    bottom?: string | number;
    transform?: string;
    marginTop?: string;
    marginBottom?: string;
    marginLeft?: string;
    marginRight?: string;
    position?: 'fixed' | 'absolute';
  }>({});

  // Find the group element and set up hover handlers
  useLayoutEffect(() => {
    // Find the parent container with 'group' class (the actual trigger element)
    const findGroupElement = () => {
      const placeholder = placeholderRef.current;
      if (!placeholder) return null;
      
      let container: HTMLElement | null = placeholder.parentElement;
      while (container && !container.classList.contains('group')) {
        container = container.parentElement;
      }
      if (container) {
        groupRef.current = container;
        return container;
      }
      return null;
    };

    // Try to find group element, with retry if not immediately available
    let cleanup: (() => void) | null = null;

    const setupHandlers = () => {
      const group = findGroupElement();
      if (group && !cleanup) {
        const handleMouseEnter = () => {
          setIsVisible(true);
        };

        const handleMouseLeave = () => {
          setIsVisible(false);
        };

        group.addEventListener('mouseenter', handleMouseEnter);
        group.addEventListener('mouseleave', handleMouseLeave);

        cleanup = () => {
          group.removeEventListener('mouseenter', handleMouseEnter);
          group.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    };

    // Try immediately
    setupHandlers();
    
    // Retry after a short delay if not found
    const timeoutId = setTimeout(() => {
      setupHandlers();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      const tooltip = tooltipRef.current;
      const container = groupRef.current;
      if (!tooltip || !container) return;

      // Temporarily show to measure dimensions
      const wasVisible = window.getComputedStyle(tooltip).display !== 'none';
      if (!wasVisible) {
        tooltip.style.display = 'block';
        tooltip.style.visibility = 'hidden';
        tooltip.style.position = 'fixed';
        tooltip.style.left = '0';
        tooltip.style.top = '0';
      }

      const tooltipRect = tooltip.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      if (!wasVisible) {
        tooltip.style.display = '';
        tooltip.style.visibility = '';
        tooltip.style.position = '';
        tooltip.style.left = '';
        tooltip.style.top = '';
      }

      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const margin = 8;
      const gap = 8; // Gap between tooltip and trigger (matches Tooltip component)
      const tooltipWidth = tooltipRect.width || 288;
      const tooltipHeight = tooltipRect.height || 100;

      // Use fixed positioning like the Tooltip component - position relative to viewport
      let positionStyle: typeof position = {
        position: 'fixed'
      };

      // Simple positioning: use preferred placement, position relative to container's viewport position
      if (preferredPlacement === 'bottom') {
        // Position below container, centered horizontally
        let left = containerRect.left + containerRect.width / 2 - tooltipWidth / 2;
        let top = containerRect.bottom + gap;
        
        // Check bounds and adjust
        if (left < margin) {
          left = margin;
        } else if (left + tooltipWidth > viewportW - margin) {
          left = viewportW - tooltipWidth - margin;
        }
        
        if (top + tooltipHeight > viewportH - margin) {
          // Not enough space below, try above
          top = containerRect.top - tooltipHeight - gap;
        }
        
        positionStyle.left = `${left}px`;
        positionStyle.top = `${Math.max(margin, top)}px`;
      } else if (preferredPlacement === 'top') {
        // Position above container, centered horizontally
        let left = containerRect.left + containerRect.width / 2 - tooltipWidth / 2;
        let top = containerRect.top - tooltipHeight - gap;
        
        // Check bounds
        if (left < margin) {
          left = margin;
        } else if (left + tooltipWidth > viewportW - margin) {
          left = viewportW - tooltipWidth - margin;
        }
        
        if (top < margin) {
          // Not enough space above, try below
          top = containerRect.bottom + gap;
        }
        
        positionStyle.left = `${left}px`;
        positionStyle.top = `${Math.max(margin, top)}px`;
      } else if (preferredPlacement === 'right') {
        // Position to the right of container, centered vertically
        let left = containerRect.right + gap;
        let top = containerRect.top + containerRect.height / 2 - tooltipHeight / 2;
        
        // Check bounds
        if (left + tooltipWidth > viewportW - margin) {
          left = containerRect.left - tooltipWidth - gap;
        }
        if (top < margin) {
          top = margin;
        } else if (top + tooltipHeight > viewportH - margin) {
          top = viewportH - tooltipHeight - margin;
        }
        
        positionStyle.left = `${Math.max(margin, left)}px`;
        positionStyle.top = `${top}px`;
      } else {
        // preferredPlacement === 'left'
        // Position to the left of container, centered vertically
        let left = containerRect.left - tooltipWidth - gap;
        let top = containerRect.top + containerRect.height / 2 - tooltipHeight / 2;
        
        // Check bounds
        if (left < margin) {
          left = containerRect.right + gap;
        }
        if (top < margin) {
          top = margin;
        } else if (top + tooltipHeight > viewportH - margin) {
          top = viewportH - tooltipHeight - margin;
        }
        
        positionStyle.left = `${Math.max(margin, left)}px`;
        positionStyle.top = `${top}px`;
      }
      
      setPosition(positionStyle);
    };

    // Use ResizeObserver to detect size and position changes
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updatePosition);
    });
    
    // Observe tooltip and find container to observe
    const setupObservers = () => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      
      resizeObserver.observe(tooltip);
      
      // Find and observe the container element
      let container: HTMLElement | null = tooltip.parentElement;
      while (container && !container.classList.contains('group')) {
        container = container.parentElement;
      }
      if (!container) {
        container = tooltip.parentElement;
      }
      if (container) {
        resizeObserver.observe(container);
        // Also observe all ancestor containers for position changes
        let ancestor = container.parentElement;
        while (ancestor && ancestor !== document.body) {
          resizeObserver.observe(ancestor);
          ancestor = ancestor.parentElement;
        }
      }
    };

    setupObservers();

    // Use MutationObserver to detect when tooltip becomes visible via group-hover
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        updatePosition();
        setupObservers(); // Re-setup observers in case DOM changed
      });
    });
    
    if (tooltipRef.current) {
      mutationObserver.observe(tooltipRef.current, { 
        attributes: true, 
        attributeFilter: ['class']
      });
      // Also observe parent containers
      let container = tooltipRef.current.parentElement;
      while (container && container !== document.body) {
        mutationObserver.observe(container, { 
          attributes: true, 
          attributeFilter: ['class']
        });
        container = container.parentElement;
      }
    }

    // Initial position update with delay to ensure DOM has settled
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(updatePosition);
    }, 0);
    
    const scrollHandler = () => {
      requestAnimationFrame(updatePosition);
    };
    
    window.addEventListener('scroll', scrollHandler, true);
    window.addEventListener('resize', scrollHandler);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', scrollHandler, true);
      window.removeEventListener('resize', scrollHandler);
    };
  }, [preferredPlacement, content, isVisible]);

  return (
    <>
      {/* Placeholder to find group element */}
      <div ref={placeholderRef} className="hidden" />
      
      {/* Portaled tooltip */}
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className={`z-[9999] pointer-events-none ${wide ? 'max-w-md' : 'w-72'} ${className}`}
          style={{
            ...position,
            ...tooltipStyle,
            padding: '0.75rem'
          }}
        >
          <div className={`text-xs whitespace-normal ${wide ? 'break-all font-mono' : ''}`}>
            {content}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}; 