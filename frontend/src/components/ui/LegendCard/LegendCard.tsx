import { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';
import { ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { LegendCardProps, LegendItem } from './LegendCard.types';

/**
 * LegendCard - A draggable, minimizable legend component for visualizations
 *
 * Features:
 * - Draggable by clicking and dragging the header
 * - Minimizable via chevron button
 * - Supports liquid glass styling when theme === 'liquid'
 * - Renders different shapes (circle, square, x, diamond) based on legend item configuration
 * - Defaults to bottom-right position unless defaultPosition is provided
 */
export function LegendCard({
  items,
  title = 'Legend',
  defaultPosition,
  defaultMinimized = false,
  className = '',
}: LegendCardProps) {
  const { theme, colors } = useColorTheme();
  const legendRef = useRef<HTMLDivElement>(null);
  const [minimized, setMinimized] = useState(defaultMinimized);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    defaultPosition || null
  );
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const isLiquidTheme = theme === 'liquid';

  // Handle drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't drag when clicking buttons
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      e.stopPropagation();

      const legend = legendRef.current;
      if (!legend) return;

      const rect = legend.getBoundingClientRect();
      dragState.current.isDragging = true;
      dragState.current.startX = e.clientX;
      dragState.current.startY = e.clientY;
      dragState.current.offsetX = e.clientX - rect.left;
      dragState.current.offsetY = e.clientY - rect.top;

      legend.style.cursor = 'grabbing';
    },
    []
  );

  // Handle drag movement and release
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.isDragging) return;

      const legend = legendRef.current;
      if (!legend) return;

      const parent = legend.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const newLeft = e.clientX - parentRect.left - dragState.current.offsetX;
      const newTop = e.clientY - parentRect.top - dragState.current.offsetY;

      // Clamp to parent bounds
      const maxLeft = parentRect.width - legend.offsetWidth;
      const maxTop = parentRect.height - legend.offsetHeight;

      setPosition({
        x: Math.max(0, Math.min(newLeft, maxLeft)),
        y: Math.max(0, Math.min(newTop, maxTop)),
      });
    };

    const handleMouseUp = () => {
      if (!dragState.current.isDragging) return;

      dragState.current.isDragging = false;
      const legend = legendRef.current;
      if (legend) {
        legend.style.cursor = 'grab';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Toggle minimized state
  const handleToggleMinimize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMinimized((prev) => !prev);
  }, []);

  // Render shape based on legend item configuration
  const renderShape = (item: LegendItem) => {
    const size = item.size || 10;
    const halfSize = size / 2;

    switch (item.shape) {
      case 'square':
        return (
          <div
            style={{
              width: size,
              height: size,
              backgroundColor: item.color,
              borderRadius: 2,
              border: item.borderColor ? `1px solid ${item.borderColor}` : undefined,
            }}
          />
        );

      case 'x':
        return (
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            fill="none"
          >
            <line
              x1={1}
              y1={1}
              x2={size - 1}
              y2={size - 1}
              stroke={item.color}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={size - 1}
              y1={1}
              x2={1}
              y2={size - 1}
              stroke={item.color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        );

      case 'diamond':
        return (
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            fill={item.color}
          >
            <polygon
              points={`${halfSize},0 ${size},${halfSize} ${halfSize},${size} 0,${halfSize}`}
              stroke={item.borderColor}
              strokeWidth={item.borderColor ? 1 : 0}
            />
          </svg>
        );

      case 'bar':
        // Vertical bar representing mutation markers on edges
        return (
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            fill="none"
          >
            <rect
              x={halfSize - 1.5}
              y={1}
              width={3}
              height={size - 2}
              fill={item.color}
              rx={1}
            />
          </svg>
        );

      case 'circle':
      default:
        return (
          <div
            style={{
              width: size,
              height: size,
              backgroundColor: item.color,
              borderRadius: '50%',
              border: item.borderColor ? `1px solid ${item.borderColor}` : undefined,
            }}
          />
        );
    }
  };

  // Calculate position styles
  const getPositionStyle = (): CSSProperties => {
    if (position) {
      return {
        left: position.x,
        top: position.y,
        right: 'auto',
        bottom: 'auto',
      };
    }
    // Default position: bottom-right
    return {
      right: 16,
      bottom: 16,
    };
  };

  // Card styles based on theme
  const cardStyle: CSSProperties = {
    ...getPositionStyle(),
    backgroundColor: isLiquidTheme
      ? colors.glassBackground
      : `${colors.containerBackground}F2`,
    borderColor: isLiquidTheme ? colors.glassBorder : colors.border,
    backdropFilter: isLiquidTheme ? 'blur(20px)' : 'blur(4px)',
    WebkitBackdropFilter: isLiquidTheme ? 'blur(20px)' : 'blur(4px)',
    boxShadow: isLiquidTheme
      ? `0 8px 32px ${colors.glassShadowPrimary}, 0 2px 8px rgba(0, 0, 0, 0.04)`
      : '0 2px 8px rgba(0, 0, 0, 0.15)',
    cursor: 'grab',
    zIndex: 10,
    minWidth: 120,
  };

  return (
    <div
      ref={legendRef}
      className={`absolute rounded-lg border shadow-sm select-none ${className}`}
      style={cardStyle}
      onMouseDown={handleMouseDown}
    >
      {/* Header with title, grip icon, and minimize button */}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <GripHorizontal
            size={12}
            style={{ color: colors.textSecondary, opacity: 0.5 }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: colors.textSecondary }}
          >
            {title}
          </span>
        </div>
        <button
          onClick={handleToggleMinimize}
          className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          style={{ color: colors.textSecondary }}
          title={minimized ? 'Expand legend' : 'Collapse legend'}
        >
          {minimized ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      </div>

      {/* Legend content - collapsible */}
      {!minimized && (
        <div
          className="flex flex-col gap-1.5 px-2 py-1.5 border-t"
          style={{ borderTopColor: isLiquidTheme ? colors.glassBorder : colors.border }}
        >
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              {renderShape(item)}
              <span className="text-xs" style={{ color: colors.text }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
