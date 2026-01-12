import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

interface TreeInterval {
  index: number;
  left: number;
  right: number;
}

type FilterMode = 'subset' | 'highlight';

interface TreeRangeSliderProps {
  treeIntervals: TreeInterval[];
  value: [number, number]; // [start_tree_index, end_tree_index] - INCLUSIVE on both ends
  onChange: (value: [number, number]) => void;
  className?: string;
  label?: string;
  filterMode?: FilterMode;
  onFilterModeChange?: (mode: FilterMode) => void;
  dimOpacity?: number;
  onDimOpacityChange?: (opacity: number) => void;
}

export const TreeRangeSlider: React.FC<TreeRangeSliderProps> = ({
  treeIntervals,
  value,
  onChange,
  className = "",
  label,
  filterMode,
  onFilterModeChange,
  dimOpacity,
  onDimOpacityChange,
}) => {
  const { colors } = useColorTheme();
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'range' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; startValue: [number, number] }>({ x: 0, startValue: [0, 0] });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [fixedRangeSize, setFixedRangeSize] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Track shift key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
        if (fixedRangeSize === null) {
          const currentRangeSize = value[1] - value[0];
          setFixedRangeSize(Math.max(currentRangeSize, 0)); // Can be 0 for single tree
        }
        document.body.style.userSelect = 'none';
        (document.body.style as any).webkitUserSelect = 'none';
        (document.body.style as any).msUserSelect = 'none';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
        setFixedRangeSize(null);
        document.body.style.userSelect = '';
        (document.body.style as any).webkitUserSelect = '';
        (document.body.style as any).msUserSelect = '';
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.body.style.userSelect = '';
      (document.body.style as any).webkitUserSelect = '';
      (document.body.style as any).msUserSelect = '';
    };
  }, [value, fixedRangeSize]);

  if (!treeIntervals || treeIntervals.length === 0) {
    return null;
  }

  const minTreeIndex = 0;
  const maxTreeIndex = treeIntervals.length - 1;

  /**
   * Convert a mouse position to a tree index.
   * Uses a simple linear mapping from pixel position to tree index.
   */
  const getTreeIndexFromPosition = useCallback((clientX: number): number => {
    if (!sliderRef.current) return minTreeIndex;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // Direct linear mapping to tree index
    const rawIndex = minTreeIndex + percentage * (maxTreeIndex - minTreeIndex);
    const treeIndex = Math.round(rawIndex);
    
    return Math.max(minTreeIndex, Math.min(maxTreeIndex, treeIndex));
  }, [minTreeIndex, maxTreeIndex]);

  /**
   * Convert a tree index to a position percentage.
   * Uses linear mapping based on tree index, not genomic position.
   */
  const getPositionFromTreeIndex = useCallback((treeIndex: number): number => {
    if (treeIndex < 0 || treeIndex > maxTreeIndex) return 0;
    
    if (maxTreeIndex === minTreeIndex) return 50; // Single tree - center it
    
    // Linear mapping based on index
    return ((treeIndex - minTreeIndex) / (maxTreeIndex - minTreeIndex)) * 100;
  }, [minTreeIndex, maxTreeIndex]);

  const formatTreeIndexDisplay = useCallback((treeIndex: number): string => {
    if (treeIndex < 0 || treeIndex >= treeIntervals.length) return "Invalid";
    const interval = treeIntervals[treeIndex];
    const left = interval.left.toFixed(0);
    const right = interval.right.toFixed(0);
    return `Tree ${treeIndex} [${left}-${right})`;
  }, [treeIntervals]);

  const formatGenomicSpan = useCallback((startIdx: number, endIdx: number): string => {
    if (startIdx < 0 || endIdx >= treeIntervals.length || startIdx > endIdx) return "Invalid range";
    
    const startPos = treeIntervals[startIdx].left;
    const endPos = treeIntervals[endIdx].right;
    const spanLength = endPos - startPos;
    
    const formatPosition = (pos: number) => {
      if (pos >= 1000000) {
        return `${(pos / 1000000).toFixed(2)}M`;
      } else if (pos >= 1000) {
        return `${(pos / 1000).toFixed(1)}K`;
      }
      return pos.toFixed(0);
    };
    
    return `${formatPosition(spanLength)} bp`;
  }, [treeIntervals]);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'left' | 'right' | 'range') => {
    e.preventDefault();
    e.stopPropagation();
    
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';
    
    setIsDragging(type);
    setDragStart({ x: e.clientX, startValue: value });
  }, [value]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const newTreeIndex = getTreeIndexFromPosition(e.clientX);
    const [currentLeft, currentRight] = value;

    // If Shift is pressed, maintain range size and move the window
    if (isShiftPressed && (isDragging === 'left' || isDragging === 'right')) {
      const rangeSize = currentRight - currentLeft;
      const deltaX = e.clientX - dragStart.x;
      const rect = sliderRef.current.getBoundingClientRect();
      const deltaPercentage = deltaX / rect.width;
      const deltaIndex = Math.round(deltaPercentage * (maxTreeIndex - minTreeIndex));
      
      const [startLeft, startRight] = dragStart.startValue;
      
      let newLeft = startLeft + deltaIndex;
      let newRight = startRight + deltaIndex;
      
      // Constrain to bounds
      if (newLeft < minTreeIndex) {
        newLeft = minTreeIndex;
        newRight = minTreeIndex + rangeSize;
      }
      if (newRight > maxTreeIndex) {
        newRight = maxTreeIndex;
        newLeft = maxTreeIndex - rangeSize;
      }
      
      // Ensure both are within bounds
      newLeft = Math.max(minTreeIndex, Math.min(maxTreeIndex, newLeft));
      newRight = Math.max(minTreeIndex, Math.min(maxTreeIndex, newRight));
      
      onChange([newLeft, newRight]);
    } else if (isDragging === 'left') {
      // Normal mode: expand/contract by moving left handle
      if (newTreeIndex <= currentRight) {
        onChange([newTreeIndex, currentRight]);
      } else {
        // Swap handles
        onChange([currentRight, newTreeIndex]);
      }
    } else if (isDragging === 'right') {
      // Normal mode: expand/contract by moving right handle
      if (newTreeIndex >= currentLeft) {
        onChange([currentLeft, newTreeIndex]);
      } else {
        // Swap handles
        onChange([newTreeIndex, currentLeft]);
      }
    } else if (isDragging === 'range') {
      const deltaX = e.clientX - dragStart.x;
      const rect = sliderRef.current.getBoundingClientRect();
      const deltaPercentage = deltaX / rect.width;
      const deltaIndex = Math.round(deltaPercentage * (maxTreeIndex - minTreeIndex));
      
      const [startLeft, startRight] = dragStart.startValue;
      let rangeSize = startRight - startLeft;
      
      // Use fixed range size if shift is pressed
      if (isShiftPressed && fixedRangeSize !== null) {
        rangeSize = fixedRangeSize;
      }
      
      let newLeft = startLeft + deltaIndex;
      let newRight = startRight + deltaIndex;
      
      if (isShiftPressed && fixedRangeSize !== null) {
        // Maintain exact fixed range size
        const centerIndex = (startLeft + startRight) / 2 + deltaIndex;
        newLeft = Math.round(centerIndex - rangeSize / 2);
        newRight = Math.round(centerIndex + rangeSize / 2);
      }
      
      // Constrain to bounds
      if (newLeft < minTreeIndex) {
        newLeft = minTreeIndex;
        newRight = minTreeIndex + rangeSize;
      }
      if (newRight > maxTreeIndex) {
        newRight = maxTreeIndex;
        newLeft = maxTreeIndex - rangeSize;
      }
      
      // Ensure both are within bounds
      newLeft = Math.max(minTreeIndex, Math.min(maxTreeIndex, newLeft));
      newRight = Math.max(minTreeIndex, Math.min(maxTreeIndex, newRight));
      
      // Ensure left <= right
      if (newLeft > newRight) {
        [newLeft, newRight] = [newRight, newLeft];
      }
      
      onChange([newLeft, newRight]);
    }
  }, [isDragging, value, onChange, getTreeIndexFromPosition, minTreeIndex, maxTreeIndex, dragStart, isShiftPressed, fixedRangeSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    
    document.body.style.userSelect = '';
    (document.body.style as any).webkitUserSelect = '';
    (document.body.style as any).msUserSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const leftPosition = getPositionFromTreeIndex(value[0]);
  const rightPosition = getPositionFromTreeIndex(value[1]);

  const numSelectedTrees = value[1] - value[0] + 1; // Inclusive on both ends

  // Mode toggle button style
  const modeToggleStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.125rem 0.375rem',
    fontSize: '0.625rem',
    fontWeight: 600,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.25rem',
    background: filterMode === 'subset' ? `${colors.accentPrimary}20` : 'transparent',
    color: filterMode === 'subset' ? colors.accentPrimary : colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  };

  // Compact opacity slider style
  const opacityContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.625rem',
    color: colors.textSecondary,
  };

  const opacitySliderStyle: React.CSSProperties = {
    width: '3.5rem',
    height: '0.25rem',
    appearance: 'none',
    background: colors.border,
    borderRadius: '0.125rem',
    cursor: 'pointer',
  };

  return (
    <div className={`relative w-full ${className}`} style={{ userSelect: 'none' }}>
      {/* Slider track at top - closest to graph */}
      <div
        ref={sliderRef}
        className="relative h-1.5 rounded-full cursor-pointer"
        style={{ backgroundColor: colors.border }}
        onMouseDown={(e) => {
          const newTreeIndex = getTreeIndexFromPosition(e.clientX);
          const [left, right] = value;
          const leftDistance = Math.abs(newTreeIndex - left);
          const rightDistance = Math.abs(newTreeIndex - right);

          // If shift is pressed, prefer range dragging
          if (isShiftPressed) {
            handleMouseDown(e, 'range');
          } else if (leftDistance < rightDistance) {
            handleMouseDown(e, 'left');
          } else {
            handleMouseDown(e, 'right');
          }
        }}
      >
        {/* Selected range */}
        <div
          className={`absolute h-full rounded-full transition-all ${
            isShiftPressed ? 'cursor-grabbing' : 'cursor-grab'
          } active:cursor-grabbing`}
          style={{
            left: `${leftPosition}%`,
            width: `${Math.max(1, rightPosition - leftPosition)}%`, // At least 1% width for single tree
            backgroundColor: isShiftPressed ? colors.accentPrimary : colors.textSecondary,
            opacity: isShiftPressed ? 0.9 : 0.7,
            userSelect: 'none'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown(e, 'range');
          }}
          title="Drag to filter. Shift+Drag to move fixed window."
        />

        {/* Left handle */}
        <div
          className={`absolute w-4 h-4 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
            isShiftPressed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{
            left: `${leftPosition}%`,
            top: '50%',
            backgroundColor: colors.background,
            borderColor: colors.accentPrimary,
            boxShadow: `0 1px 3px ${colors.background}60`,
            userSelect: 'none',
            zIndex: isDragging === 'left' ? 10 : 5
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown(e, 'left');
          }}
          title="Drag to filter. Shift+Drag to move fixed window."
        />

        {/* Right handle */}
        <div
          className={`absolute w-4 h-4 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
            isShiftPressed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{
            left: `${rightPosition}%`,
            top: '50%',
            backgroundColor: colors.background,
            borderColor: colors.accentPrimary,
            boxShadow: `0 1px 3px ${colors.background}60`,
            userSelect: 'none',
            zIndex: isDragging === 'right' ? 10 : 5
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown(e, 'right');
          }}
          title="Drag to filter. Shift+Drag to move fixed window."
        />
      </div>

      {/* Integrated value display: Tree 0 | selection | Tree N */}
      <div className="flex items-center justify-center gap-2 mt-1.5 text-xs font-mono">
        <span style={{ color: colors.textSecondary }}>Tree 0</span>
        <span style={{ color: colors.textSecondary }}>|</span>
        <span className="font-semibold" style={{ color: colors.accentPrimary }}>
          {value[0]} - {value[1]}
        </span>
        <span style={{ color: colors.accentPrimary, fontSize: '0.65rem' }}>
          ({numSelectedTrees} tree{numSelectedTrees !== 1 ? 's' : ''}, {formatGenomicSpan(value[0], value[1])})
        </span>
        <span style={{ color: colors.textSecondary }}>|</span>
        <span style={{ color: colors.textSecondary }}>Tree {maxTreeIndex}</span>
      </div>

      {/* Footer row: Label + Mode toggle + Opacity */}
      {(label || (filterMode !== undefined && onFilterModeChange)) && (
        <div className="flex items-center justify-between mt-1.5">
          {label && (
            <div className="text-xs font-medium" style={{ color: colors.text }}>
              {label}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Opacity slider - shown when in highlight mode */}
            {filterMode === 'highlight' && dimOpacity !== undefined && onDimOpacityChange && (
              <div style={opacityContainerStyle}>
                <span style={{ opacity: 0.7 }}>Dim:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={dimOpacity}
                  onChange={(e) => onDimOpacityChange(parseFloat(e.target.value))}
                  style={opacitySliderStyle}
                  className="opacity-slider"
                />
                <span style={{ minWidth: '1.75rem', textAlign: 'right' }}>{Math.round(dimOpacity * 100)}%</span>
              </div>
            )}
            {filterMode !== undefined && onFilterModeChange && (
              <button
                type="button"
                onClick={() => onFilterModeChange(filterMode === 'subset' ? 'highlight' : 'subset')}
                style={modeToggleStyle}
                title={filterMode === 'subset' ? 'Subset: Hide filtered-out nodes' : 'Highlight: Dim filtered-out nodes'}
              >
                {filterMode === 'subset' ? 'Subset' : 'Dim'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
