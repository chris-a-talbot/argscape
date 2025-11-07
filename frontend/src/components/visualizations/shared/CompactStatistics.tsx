import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../../lib/api';
import { useColorTheme } from '../../../context/ColorThemeContext';

interface CompactStatisticsProps {
  filename: string;
  genomicRange?: [number, number] | null;
  temporalRange?: [number, number] | null;
  treeRange?: [number, number] | null;
  isActive: boolean;
  sequenceLength?: number;
}

interface Statistics {
  nucleotide_diversity?: number | null;
  wattersons_theta?: number | null;
  tajimas_d?: number | null;
  mean_tree_height?: number | null;
  tmrca?: number | null;
}

/**
 * Compact inline statistics display for showing next to filter sliders
 */
export const CompactStatistics: React.FC<CompactStatisticsProps> = ({
  filename,
  genomicRange,
  temporalRange: _temporalRange, // Accepted but not used - temporal filtering doesn't affect population genetics stats
  treeRange,
  isActive,
  sequenceLength
}) => {
  const { colors } = useColorTheme();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const statRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!filename || !isActive) {
      setStatistics(null);
      return;
    }

    const fetchStatistics = async () => {
      setIsLoading(true);
      
      try {
        const options: {
          genomicStart?: number;
          genomicEnd?: number;
          temporalStart?: number;
          temporalEnd?: number;
          treeStartIdx?: number;
          treeEndIdx?: number;
        } = {};

        if (genomicRange && sequenceLength) {
          if (genomicRange[0] !== 0 || genomicRange[1] !== sequenceLength) {
            options.genomicStart = genomicRange[0];
            options.genomicEnd = genomicRange[1];
          }
        }

        // Note: temporalRange is NOT used for population genetics statistics
        // Temporal filtering is only for visualization (hiding/dimming nodes)
        // Population genetics statistics should only be affected by genomic/tree filtering

        if (treeRange && treeRange[0] !== undefined && treeRange[1] !== undefined) {
          options.treeStartIdx = treeRange[0];
          options.treeEndIdx = treeRange[1];
        }

        const response = await api.getStatisticsForRange(filename, options);
        const data = response.data as Statistics;
        setStatistics({ ...data });
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setStatistics(null);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchStatistics, 500);
    return () => clearTimeout(timeoutId);
  }, [filename, genomicRange?.[0], genomicRange?.[1], treeRange?.[0], treeRange?.[1], isActive, sequenceLength]);

  // Update tooltip position when hovered stat changes or tooltip is rendered
  // NOTE: This hook must be called before any conditional returns to follow Rules of Hooks
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

  if (!isActive || (!statistics && !isLoading)) {
    return null;
  }

  const tooltips: Record<string, string> = {
    pi: "Nucleotide diversity (π): Average number of pairwise differences per site. Measures genetic diversity in the population.",
    tajima: "Tajima's D: Tests for neutrality. Negative values indicate excess of low-frequency variants (population expansion), positive values indicate excess of intermediate-frequency variants (balancing selection).",
    height: "Mean tree height (H): Average time to the most recent common ancestor across all trees in the filtered range. Measures the depth of genealogical history."
  };

  return (
    <>
      <div className="flex items-center gap-3 text-xs ml-auto relative">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sp-white/50">
            <div className="animate-spin rounded-full h-3 w-3 border border-sp-pale-green border-t-transparent"></div>
            <span>Computing...</span>
          </div>
        ) : statistics ? (
          <>
            {statistics.nucleotide_diversity !== null && statistics.nucleotide_diversity !== undefined && (
              <div 
                ref={(el) => { statRefs.current['pi'] = el; }}
                className="flex items-center gap-1 cursor-help relative"
                onMouseEnter={() => setHoveredStat('pi')}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <span className="text-sp-white/70">π:</span>
                <span className="font-mono text-sp-white">
                  {statistics.nucleotide_diversity.toExponential(2)}
                </span>
              </div>
            )}
            {statistics.tajimas_d !== null && statistics.tajimas_d !== undefined && (
              <div 
                ref={(el) => { statRefs.current['tajima'] = el; }}
                className="flex items-center gap-1 cursor-help relative"
                onMouseEnter={() => setHoveredStat('tajima')}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <span className="text-sp-white/70">D:</span>
                <span className="font-mono text-sp-white">
                  {statistics.tajimas_d.toFixed(2)}
                </span>
              </div>
            )}
            {statistics.mean_tree_height !== null && statistics.mean_tree_height !== undefined && (
              <div 
                ref={(el) => { statRefs.current['height'] = el; }}
                className="flex items-center gap-1 cursor-help relative"
                onMouseEnter={() => setHoveredStat('height')}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <span className="text-sp-white/70">H:</span>
                <span className="font-mono text-sp-white">
                  {statistics.mean_tree_height.toFixed(1)}
                </span>
              </div>
            )}
          </>
        ) : null}
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
