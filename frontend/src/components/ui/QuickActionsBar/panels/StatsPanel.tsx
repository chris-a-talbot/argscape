/**
 * StatsPanel Component
 * 
 * Main statistics panel for Quick Actions Bar.
 * Displays:
 * - Node/edge counts (Original → Subset → Displayed)
 * - Tree sequence statistics
 * - Performance metrics (FPS, memory)
 * - Active filter summary
 * - Export functionality (CSV/JSON)
 */

import React, { useState } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import { NodeEdgeCountDisplay } from './NodeEdgeCountDisplay';
import { SequenceStatsDisplay } from './SequenceStatsDisplay';
import { PerformanceStatsDisplay } from './PerformanceStatsDisplay';
import { FilterSummaryDisplay } from './FilterSummaryDisplay';
import { PopGenStatsDisplay } from './PopGenStatsDisplay';
import type { StatsPanelProps, ExportFormat, ExportData } from './StatsPanel.types';

export const StatsPanel: React.FC<StatsPanelProps> = ({
  nodeEdgeStats,
  sequenceStats,
  popGenStats,
  windowPopGenStats,
  windowStatsLoading = false,
  isGenomicFilterActive = false,
  performanceStats,
  filterSummary,
  showExport = true,
  onExport,
  className = '',
  showPerformance = true,
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleExport = (format: ExportFormat) => {
    if (!onExport) return;

    const exportData: ExportData = {
      timestamp: new Date().toISOString(),
      nodeEdgeStats,
      sequenceStats,
      performanceStats,
      filterSummary,
    };

    // Call the export handler
    onExport(format);

    // For CSV/TSV format, generate and download
    if (format === 'csv' || format === 'tsv') {
      const delimiter = format === 'csv' ? ',' : '\t';
      const lines: string[] = [];

      // Header
      lines.push('Statistic' + delimiter + 'Value');

      // Node/Edge stats
      lines.push('Original Nodes' + delimiter + nodeEdgeStats.originalNodes);
      lines.push('Subset Nodes' + delimiter + nodeEdgeStats.subsetNodes);
      lines.push('Displayed Nodes' + delimiter + nodeEdgeStats.displayedNodes);
      lines.push('Original Edges' + delimiter + nodeEdgeStats.originalEdges);
      lines.push('Subset Edges' + delimiter + nodeEdgeStats.subsetEdges);
      lines.push('Displayed Edges' + delimiter + nodeEdgeStats.displayedEdges);

      // Sequence stats
      lines.push('Samples' + delimiter + sequenceStats.samples);
      lines.push('Sites' + delimiter + sequenceStats.sites);
      lines.push('Trees' + delimiter + sequenceStats.trees);
      lines.push('Mutations' + delimiter + sequenceStats.mutations);
      if (sequenceStats.populations) {
        lines.push('Populations' + delimiter + sequenceStats.populations);
      }
      if (sequenceStats.individuals) {
        lines.push('Individuals' + delimiter + sequenceStats.individuals);
      }

      // Performance stats
      if (performanceStats) {
        lines.push('FPS' + delimiter + performanceStats.fps.toFixed(1));
        if (performanceStats.memoryMB !== undefined) {
          lines.push('Memory (MB)' + delimiter + performanceStats.memoryMB.toFixed(1));
        }
        if (performanceStats.renderTimeMs !== undefined) {
          lines.push('Render Time (ms)' + delimiter + performanceStats.renderTimeMs.toFixed(1));
        }
        if (performanceStats.lastFrameTime !== undefined) {
          lines.push('Last Frame Time (ms)' + delimiter + performanceStats.lastFrameTime.toFixed(1));
        }
        if (performanceStats.avgFrameTime !== undefined) {
          lines.push('Avg Frame Time (ms)' + delimiter + performanceStats.avgFrameTime.toFixed(1));
        }
      }

      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: format === 'csv' ? 'text/csv' : 'text/tab-separated-values' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `argscape-stats-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      // JSON export
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `argscape-stats-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setExportMenuOpen(false);
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '500px',
    overflowY: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: colors.text,
  };

  const exportButtonStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: colors.text,
    background: isLiquid ? 'rgba(255, 255, 255, 0.6)' : colors.containerBackground,
    backdropFilter: isLiquid ? 'blur(10px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(10px)' : 'none',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const exportMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.25rem',
    minWidth: '120px',
    background: isLiquid ? 'rgba(255, 255, 255, 0.95)' : colors.containerBackground,
    backdropFilter: isLiquid ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(20px)' : 'none',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    zIndex: 1000,
  };

  const exportOptionStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.8rem',
    color: colors.text,
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
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
        {/* Header with title and export button */}
        <div style={headerStyle}>
          <div style={titleStyle}>Statistics</div>
          {showExport && onExport && (
            <div style={{ position: 'relative' }}>
              <button
                style={exportButtonStyle}
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.accentPrimary;
                  e.currentTarget.style.color = colors.accentPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.color = colors.text;
                }}
              >
                <span>📊</span>
                <span>Export</span>
              </button>
              
              {exportMenuOpen && (
                <div style={exportMenuStyle}>
                  <button
                    style={exportOptionStyle}
                    onClick={() => handleExport('csv')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.containerBackground;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Export as CSV
                  </button>
                  <button
                    style={exportOptionStyle}
                    onClick={() => handleExport('json')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.containerBackground;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Export as JSON
                  </button>
                  <button
                    style={exportOptionStyle}
                    onClick={() => handleExport('tsv')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.containerBackground;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Export as TSV
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Node/Edge Count Display */}
        <NodeEdgeCountDisplay stats={nodeEdgeStats} showPipeline />

        {/* Sequence Stats Display */}
        <SequenceStatsDisplay stats={sequenceStats} />

        {/* Population Genetics Stats Display */}
        {popGenStats && (
          <PopGenStatsDisplay
            fullStats={popGenStats}
            windowStats={windowPopGenStats}
            windowStatsLoading={windowStatsLoading}
            isGenomicFilterActive={isGenomicFilterActive}
          />
        )}

        {/* Performance Stats Display */}
        {showPerformance && performanceStats && (
          <PerformanceStatsDisplay stats={performanceStats} />
        )}

        {/* Filter Summary Display */}
        {filterSummary && (
          <FilterSummaryDisplay summary={filterSummary} />
        )}
      </div>
    </>
  );
};




