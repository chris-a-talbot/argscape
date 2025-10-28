import React, { useMemo } from 'react';
import { SidebarSlider, SidebarSubsection, SidebarCheckbox, SidebarButtonGroup } from '../../ui/VisualizationSidebar';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { TemporalRangeSlider } from '../../ui/temporal-range-slider';
import { GraphData } from '../ForceDirectedGraph/ForceDirectedGraph.types';

export type DiffViewMode = 'diff' | 'first' | 'second';

interface NodeDiffStats {
  averageDistance: number;
  maxDistance: number;
  minDistance: number;
  nodeCount: number;
}

// ========== DIFF CONTROLS SECTION ==========
interface DiffControlsSectionProps {
  diffEdgeWidth: number;
  onDiffEdgeWidthChange: (value: number) => void;
  viewMode: DiffViewMode;
  onViewModeChange: (mode: DiffViewMode) => void;
  showErrorBars: boolean;
  onShowErrorBarsChange: (show: boolean) => void;
}

export const DiffControlsSection: React.FC<DiffControlsSectionProps> = ({
  diffEdgeWidth,
  onDiffEdgeWidthChange,
  viewMode,
  onViewModeChange,
  showErrorBars,
  onShowErrorBarsChange,
}) => {

  return (
    <div className="space-y-4">
      <SidebarSubsection title="View Mode" tooltip="Diff: Shows averaged node positions with error bars between versions. First/Second: Shows individual tree sequence with error bars pointing to the other version.">
        <SidebarButtonGroup
          label="Display Mode"
          value={viewMode}
          options={[
            { value: 'diff', label: 'Diff (Average)' },
            { value: 'first', label: 'First Tree Seq' },
            { value: 'second', label: 'Second Tree Seq' }
          ]}
          onChange={(value) => onViewModeChange(value as DiffViewMode)}
        />
      </SidebarSubsection>

      <SidebarSubsection title="Error Visualization" tooltip="Error bars show spatial movement of nodes between tree sequences. Longer bars indicate greater positional differences.">
        <SidebarCheckbox
          label="Show Error Bars"
          checked={showErrorBars}
          onChange={onShowErrorBarsChange}
          tooltip="Toggle visibility of error bars showing positional differences"
        />

        {showErrorBars && (
          <SidebarSlider
            label="Error Bar Thickness"
            value={diffEdgeWidth}
            min={1}
            max={10}
            step={0.5}
            onChange={onDiffEdgeWidthChange}
            unit="x"
          />
        )}
      </SidebarSubsection>
    </div>
  );
};

// ========== DIFF STATISTICS SECTION ==========
interface DiffStatisticsSectionProps {
  firstData: GraphData | null;
  secondData: GraphData | null;
  minTime: number;
  maxTime: number;
  statsTimeRange: [number, number];
  onStatsTimeRangeChange: (range: [number, number]) => void;
}

export const DiffStatisticsSection: React.FC<DiffStatisticsSectionProps> = ({
  firstData,
  secondData,
  minTime,
  maxTime,
  statsTimeRange,
  onStatsTimeRangeChange,
}) => {
  const { colors } = useColorTheme();

  // Calculate statistics for nodes in the selected time range
  const statistics = useMemo<NodeDiffStats>(() => {
    if (!firstData || !secondData) {
      return { averageDistance: 0, maxDistance: 0, minDistance: 0, nodeCount: 0 };
    }

    const secondNodesMap = new Map(secondData.nodes.map((node: any) => [node.id, node]));
    const distances: number[] = [];

    firstData.nodes.forEach((node: any) => {
      // Skip sample nodes and nodes outside the time range
      if (node.is_sample || node.time < statsTimeRange[0] || node.time > statsTimeRange[1]) {
        return;
      }

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
  }, [firstData, secondData, statsTimeRange]);

  return (
    <div className="space-y-4">
      <SidebarSubsection 
        title="Statistics" 
        tooltip="Statistics calculated for non-sample nodes within the selected time range. Distances are in coordinate space units."
      >
        <div className="space-y-3">
          {/* Stats display */}
          <div 
            className="p-3 rounded-md space-y-2 text-xs"
            style={{ 
              backgroundColor: `${colors.containerBackground}`,
              border: `1px solid ${colors.border}40`
            }}
          >
            <div className="flex justify-between items-center">
              <span style={{ color: colors.text, opacity: 0.8 }}>Nodes Analyzed:</span>
              <span style={{ color: colors.text, fontWeight: 600 }}>{statistics.nodeCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: colors.text, opacity: 0.8 }}>Average Distance:</span>
              <span style={{ color: colors.text, fontWeight: 600 }}>
                {statistics.averageDistance.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: colors.text, opacity: 0.8 }}>Max Distance:</span>
              <span style={{ color: colors.text, fontWeight: 600 }}>
                {statistics.maxDistance.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: colors.text, opacity: 0.8 }}>Min Distance:</span>
              <span style={{ color: colors.text, fontWeight: 600 }}>
                {statistics.minDistance.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Time range filter for statistics */}
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: colors.text, opacity: 0.9 }}>
              Time Range Filter
            </label>
            <div className="flex justify-center">
              <TemporalRangeSlider
                min={minTime}
                max={maxTime}
                step={(maxTime - minTime) / 1000}
                value={statsTimeRange}
                onChange={onStatsTimeRangeChange}
                formatValue={(v) => v.toFixed(3)}
                height={200}
              />
            </div>
            <div className="text-xs text-center" style={{ color: colors.text, opacity: 0.7 }}>
              {statsTimeRange[0].toFixed(3)} - {statsTimeRange[1].toFixed(3)}
            </div>
          </div>
        </div>
      </SidebarSubsection>
    </div>
  );
};

