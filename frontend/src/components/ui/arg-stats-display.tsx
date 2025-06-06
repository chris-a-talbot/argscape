import React from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

export interface ArgStatsData {
  originalNodes: number;
  originalEdges: number;
  subArgNodes: number;
  subArgEdges: number;
  displayedNodes: number;
  displayedEdges: number;
}

interface ArgStatsDisplayProps {
  stats: ArgStatsData;
  className?: string;
}

export const ArgStatsDisplay: React.FC<ArgStatsDisplayProps> = ({
  stats,
  className = ""
}) => {
  const { colors } = useColorTheme();

  return (
    <div 
      className={`text-xs ${className}`}
      style={{ color: colors.textSecondary }}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <span className="font-medium">Original ARG:</span>
          <span>{stats.originalNodes.toLocaleString()} nodes, {stats.originalEdges.toLocaleString()} edges</span>
        </div>
        
        {(stats.subArgNodes !== stats.originalNodes || stats.subArgEdges !== stats.originalEdges) && (
          <div className="flex items-center gap-1">
            <span className="font-medium">SubARG:</span>
            <span>{stats.subArgNodes.toLocaleString()} nodes, {stats.subArgEdges.toLocaleString()} edges</span>
          </div>
        )}
        
        {(stats.displayedNodes !== stats.subArgNodes || stats.displayedEdges !== stats.subArgEdges) && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Displayed:</span>
            <span>{stats.displayedNodes.toLocaleString()} nodes, {stats.displayedEdges.toLocaleString()} edges</span>
          </div>
        )}
        
        {/* Show filtering percentage if there's a difference */}
        {stats.displayedNodes !== stats.originalNodes && (
          <div className="flex items-center gap-1 text-xs opacity-75">
            <span>
              ({((stats.displayedNodes / stats.originalNodes) * 100).toFixed(1)}% of original)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}; 