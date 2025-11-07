import React, { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { GraphData, GraphNode } from '../ForceDirectedGraph/ForceDirectedGraph.types';

interface CompactDiffStatisticsProps {
  firstData: GraphData | null;
  secondData: GraphData | null;
  temporalRange?: [number, number] | null;
  genomicRange?: [number, number] | null;
  isActive: boolean;
}

interface DiffStats {
  averageDistance: number;
  maxDistance: number;
  minDistance: number;
  nodeCount: number;
}

/**
 * Compact inline diff statistics display for showing next to filter sliders
 * Shows spatial distance statistics between two datasets
 */
export const CompactDiffStatistics: React.FC<CompactDiffStatisticsProps> = ({
  firstData,
  secondData,
  temporalRange,
  genomicRange,
  isActive
}) => {
  const { colors } = useColorTheme();
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const statRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  // Calculate statistics for nodes in the active filter ranges
  const statistics = useMemo<DiffStats>(() => {
    if (!firstData || !secondData || !isActive) {
      return { averageDistance: 0, maxDistance: 0, minDistance: 0, nodeCount: 0 };
    }

    const secondNodesMap = new Map(secondData.nodes.map((node: GraphNode) => [node.id, node]));
    const distances: number[] = [];

    firstData.nodes.forEach((node: GraphNode) => {
      // Skip sample nodes
      if (node.is_sample) {
        return;
      }

      // Note: Temporal and genomic filtering is already applied to the data
      // passed to this component, so we don't need to filter again here

      const secondNode = secondNodesMap.get(node.id);
      if (!secondNode || !node.location || !secondNode.location) {
        return;
      }

      // Calculate Euclidean distance
      const dx = node.location.x - secondNode.location.x;
      const dy = node.location.y - secondNode.location.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      distances.push(distance);
    });

    if (distances.length === 0) {
      return { averageDistance: 0, maxDistance: 0, minDistance: 0, nodeCount: 0 };
    }

    return {
      averageDistance: distances.reduce((sum, d) => sum + d, 0) / distances.length,
      maxDistance: Math.max(...distances),
      minDistance: Math.min(...distances),
      nodeCount: distances.length,
    };
  }, [firstData, secondData, temporalRange, genomicRange, isActive]);

  // Update tooltip position when hovered stat changes
  useLayoutEffect(() => {
    if (!hoveredStat || !statRefs.current[hoveredStat]) {
      setTooltipPosition(null);
      return;
    }

    const updatePosition = () => {
      const element = statRefs.current[hoveredStat];
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      const tooltipHeight = tooltip ? tooltip.offsetHeight : 100;
      
      // Position above the element, centered horizontally
      // Check if tooltip would go off top of screen
      const topPosition = rect.top - tooltipHeight - 8;
      const finalTop = topPosition < 8 ? rect.bottom + 8 : topPosition;
      
      setTooltipPosition({
        top: finalTop,
        left: rect.left + rect.width / 2
      });
    };

    // Initial position update
    updatePosition();
    
    // Also update after a short delay to account for tooltip rendering
    const timeoutId = setTimeout(() => {
      updatePosition();
    }, 10);
    
    // Update on scroll/resize
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [hoveredStat]);

  if (!isActive || !firstData || !secondData) {
    return null;
  }

  const tooltips: Record<string, string> = {
    nodes: "Diff - Nodes analyzed: Number of non-sample nodes compared between the two datasets in the current filter range.",
    avg: "Diff - Average distance: Mean Euclidean spatial distance between corresponding nodes in the two datasets. Measures overall spatial divergence.",
    max: "Diff - Maximum distance: Largest spatial distance between any pair of corresponding nodes. Identifies regions with the greatest spatial divergence.",
    min: "Diff - Minimum distance: Smallest spatial distance between any pair of corresponding nodes. Identifies regions with the least spatial divergence."
  };

  return (
    <>
      <div className="flex items-center gap-3 text-xs ml-auto relative">
        <span className="text-sp-white/70 font-semibold">Diff:</span>
        {statistics.nodeCount > 0 ? (
          <>
            <div 
              ref={(el) => { statRefs.current['nodes'] = el; }}
              className="flex items-center gap-1 cursor-help relative"
              onMouseEnter={() => setHoveredStat('nodes')}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <span className="text-sp-white/70">N:</span>
              <span className="font-mono text-sp-white">
                {statistics.nodeCount}
              </span>
            </div>
            <div 
              ref={(el) => { statRefs.current['avg'] = el; }}
              className="flex items-center gap-1 cursor-help relative"
              onMouseEnter={() => setHoveredStat('avg')}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <span className="text-sp-white/70">Avg:</span>
              <span className="font-mono text-sp-white">
                {statistics.averageDistance.toFixed(2)}
              </span>
            </div>
            <div 
              ref={(el) => { statRefs.current['max'] = el; }}
              className="flex items-center gap-1 cursor-help relative"
              onMouseEnter={() => setHoveredStat('max')}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <span className="text-sp-white/70">Max:</span>
              <span className="font-mono text-sp-white">
                {statistics.maxDistance.toFixed(2)}
              </span>
            </div>
            <div 
              ref={(el) => { statRefs.current['min'] = el; }}
              className="flex items-center gap-1 cursor-help relative"
              onMouseEnter={() => setHoveredStat('min')}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <span className="text-sp-white/70">Min:</span>
              <span className="font-mono text-sp-white">
                {statistics.minDistance.toFixed(2)}
              </span>
            </div>
          </>
        ) : (
          <span className="text-sp-white/50">No nodes in range</span>
        )}
      </div>
      
      {/* Tooltip portal */}
      {hoveredStat && tooltipPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className="fixed pointer-events-none"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: 'translateX(-50%)',
            zIndex: 10000,
            minWidth: '200px',
            maxWidth: '300px'
          }}
        >
          <div 
            className="px-2 py-1 text-xs rounded shadow-lg border whitespace-normal"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
              boxShadow: `0 4px 6px -1px ${colors.border}40`
            }}
          >
            {tooltips[hoveredStat]}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

