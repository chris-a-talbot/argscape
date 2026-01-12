/**
 * DiffStatsPanel Component
 *
 * Statistics panel for diff visualizer showing two datasets side-by-side.
 * Displays node/edge counts and sequence stats for both datasets being compared,
 * plus optional performance metrics.
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import { NodeEdgeCountDisplay } from './NodeEdgeCountDisplay';
import { SequenceStatsDisplay } from './SequenceStatsDisplay';
import { PerformanceStatsDisplay } from './PerformanceStatsDisplay';
import type { NodeEdgeStats, SequenceStats, PerformanceStats } from './StatsPanel.types';

export interface DiffStatsPanelProps {
  firstDatasetStats: {
    nodeEdgeStats?: NodeEdgeStats;
    sequenceStats?: SequenceStats;
    label: string;
  };
  secondDatasetStats: {
    nodeEdgeStats?: NodeEdgeStats;
    sequenceStats?: SequenceStats;
    label: string;
  };
  performanceStats?: PerformanceStats;
  showPerformance?: boolean;
  className?: string;
}

export const DiffStatsPanel: React.FC<DiffStatsPanelProps> = ({
  firstDatasetStats,
  secondDatasetStats,
  performanceStats,
  showPerformance = true,
  className = '',
}) => {
  const { colors } = useColorTheme();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '500px',
    overflowY: 'auto',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: colors.text,
    paddingBottom: '0.375rem',
    borderBottom: `1px solid ${colors.border}`,
  };

  const scrollbarStyles = `
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: ${colors.background};
    }
    ::-webkit-scrollbar-thumb {
      background: ${colors.border};
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${colors.textSecondary};
    }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className={className} style={containerStyle}>
        {/* First Dataset Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>{firstDatasetStats.label}</div>
          {firstDatasetStats.sequenceStats && (
            <SequenceStatsDisplay stats={firstDatasetStats.sequenceStats} />
          )}
          {firstDatasetStats.nodeEdgeStats && (
            <NodeEdgeCountDisplay stats={firstDatasetStats.nodeEdgeStats} />
          )}
        </div>

        {/* Second Dataset Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>{secondDatasetStats.label}</div>
          {secondDatasetStats.sequenceStats && (
            <SequenceStatsDisplay stats={secondDatasetStats.sequenceStats} />
          )}
          {secondDatasetStats.nodeEdgeStats && (
            <NodeEdgeCountDisplay stats={secondDatasetStats.nodeEdgeStats} />
          )}
        </div>

        {/* Performance Section */}
        {showPerformance && performanceStats && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Performance</div>
            <PerformanceStatsDisplay stats={performanceStats} />
          </div>
        )}
      </div>
    </>
  );
};
