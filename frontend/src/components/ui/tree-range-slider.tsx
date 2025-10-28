import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

interface TreeInterval {
  index: number;
  left: number;
  right: number;
}

interface TreeRangeSliderProps {
  treeIntervals: TreeInterval[];
  value: [number, number]; // [start_tree_index, end_tree_index] - INCLUSIVE on both ends
  onChange: (value: [number, number]) => void;
  className?: string;
  label?: string;
}

export const TreeRangeSlider: React.FC<TreeRangeSliderProps> = ({
  treeIntervals,
  value,
  onChange,
  className = "",
  label
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

  return (
    <div className={`relative w-full ${className}`} style={{ userSelect: 'none' }}>
      {/* Label */}
      {label && (
        <div className="mb-2 text-xs font-medium" style={{ color: colors.text }}>
          {label}
        </div>
      )}
      
      {/* Value display */}
      <div className="flex justify-between mb-2 text-sm font-mono" style={{ color: colors.accentPrimary }}>
        <span className="truncate">{formatTreeIndexDisplay(value[0])}</span>
        <span className="truncate">{formatTreeIndexDisplay(value[1])}</span>
      </div>
      
      {/* Slider track */}
      <div 
        ref={sliderRef}
        className="relative h-3 rounded-lg cursor-pointer"
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
          className={`absolute h-full rounded-lg transition-all ${
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
        />
        
        {/* Left handle */}
        <div 
          className={`absolute w-5 h-5 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
            isShiftPressed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{ 
            left: `${leftPosition}%`, 
            top: '50%',
            backgroundColor: colors.background,
            borderColor: colors.accentPrimary,
            boxShadow: `0 2px 4px ${colors.background}40`,
            userSelect: 'none',
            zIndex: isDragging === 'left' ? 10 : 5
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown(e, 'left');
          }}
        />
        
        {/* Right handle */}
        <div 
          className={`absolute w-5 h-5 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
            isShiftPressed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{ 
            left: `${rightPosition}%`, 
            top: '50%',
            backgroundColor: colors.background,
            borderColor: colors.accentPrimary,
            boxShadow: `0 2px 4px ${colors.background}40`,
            userSelect: 'none',
            zIndex: isDragging === 'right' ? 10 : 5
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown(e, 'right');
          }}
        />
      </div>
      
      {/* Tree index labels and genomic span info */}
      <div className="flex justify-between items-center mt-2 text-xs" style={{ color: colors.textSecondary }}>
        <span>Tree 0</span>
        <div className="text-center min-h-[18px]">
          {isShiftPressed ? (
            <div className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1" style={{ 
              backgroundColor: colors.accentPrimary, 
              color: colors.background,
              fontSize: '10px'
            }}>
              <span>⇄</span>
              <span>Move Range</span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <div style={{ color: colors.text }} className="font-medium">
                {numSelectedTrees} tree{numSelectedTrees !== 1 ? 's' : ''}
              </div>
              <div>{formatGenomicSpan(value[0], value[1])}</div>
            </div>
          )}
        </div>
        <span>Tree {maxTreeIndex}</span>
      </div>
    </div>
  );
};
