/**
 * DiffExportPanel Component
 *
 * Export panel specifically designed for diff visualizer.
 * Handles two tree sequences and diff-specific statistics export.
 *
 * Sections:
 * - Visualization: PNG download
 * - Tree Sequence 1: .trees, .tsz, statistics, locations
 * - Tree Sequence 2: .trees, .tsz, statistics, locations
 * - Diff Statistics: JSON (average stats), CSV (full node locations)
 */

import React, { useState } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import { api } from '@/lib/api';
import { log } from '@/lib/logger';

export interface DiffExportPanelProps {
  /** First filename for tree sequence operations */
  firstFilename?: string;
  /** Second filename for tree sequence operations */
  secondFilename?: string;
  /** Handler for PNG download */
  onDownloadPNG?: () => void;
  /** Whether PNG download is available */
  pngAvailable?: boolean;
  /** Loading state for downloads */
  isDownloading?: boolean;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Custom className */
  className?: string;
}

export const DiffExportPanel: React.FC<DiffExportPanelProps> = ({
  firstFilename,
  secondFilename,
  onDownloadPNG,
  pngAvailable = true,
  isDownloading = false,
  onError,
  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Get short display names for filenames
  const getShortName = (filename: string) => {
    const base = filename.replace(/\.(trees|tsz)$/, '');
    return base.length > 25 ? '...' + base.slice(-25) : base;
  };

  // Tree sequence download handler
  const handleDownloadTreeSequence = async (filename: string, format: 'trees' | 'tsz') => {
    try {
      const blob = await api.downloadTreeSequence(filename, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename.replace(/\.(trees|tsz)$/, '')}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      log.user.action('download-tree-sequence', { filename, format }, 'DiffExportPanel');
    } catch (error) {
      if (onError && error instanceof Error) onError(error);
    }
  };

  // Statistics download handler
  const handleDownloadStatistics = async (filename: string) => {
    try {
      const blob = await api.downloadStatisticsCSV(filename);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename.replace(/\.(trees|tsz)$/, '')}_statistics.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      log.user.action('download-statistics-csv', { filename }, 'DiffExportPanel');
    } catch (error) {
      if (onError && error instanceof Error) onError(error);
    }
  };

  // Locations download handler
  const handleDownloadLocations = async (filename: string, nodeType: 'all' | 'samples' | 'internal') => {
    try {
      const blob = await api.downloadLocationsCSV(filename, { nodeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${filename.replace(/\.(trees|tsz)$/, '')}_${nodeType}_locations.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      log.user.action('download-locations-csv', { filename, nodeType }, 'DiffExportPanel');
      setExpandedSection(null);
    } catch (error) {
      if (onError && error instanceof Error) onError(error);
    }
  };

  // Diff statistics download handler
  const handleDownloadDiffStatistics = async (format: 'csv' | 'json') => {
    if (!firstFilename || !secondFilename) return;
    try {
      const blob = await api.downloadDiffStatistics(firstFilename, secondFilename, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const baseName1 = firstFilename.replace(/\.(trees|tsz)$/, '');
      const baseName2 = secondFilename.replace(/\.(trees|tsz)$/, '');
      const extension = format === 'csv' ? '.csv' : '.json';
      link.setAttribute('download', `${baseName1}_vs_${baseName2}_diff${extension}`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      log.user.action('download-diff-statistics', { firstFilename, secondFilename, format }, 'DiffExportPanel');
    } catch (error) {
      if (onError && error instanceof Error) onError(error);
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    maxHeight: '400px',
    overflowY: 'auto',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem',
    background: isLiquid ? 'rgba(20, 226, 168, 0.02)' : colors.hoverOverlay,
    borderRadius: '0.375rem',
    border: `1px solid ${colors.border}`,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    fontWeight: 600,
    color: colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    border: `1px solid ${colors.border}`,
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: isDownloading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: isDownloading ? 0.6 : 1,
    background: 'transparent',
    color: colors.text,
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: colors.accentPrimary,
    color: colors.buttonText,
    border: 'none',
  };

  const smallButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    fontSize: '0.6875rem',
    padding: '0.375rem 0.5rem',
  };

  const filenameStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    color: colors.textSecondary,
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const subsectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    paddingTop: '0.375rem',
    borderTop: `1px solid ${colors.border}`,
    marginTop: '0.25rem',
  };

  // Render file export section
  const renderFileSection = (
    filename: string,
    label: string,
    sectionKey: string
  ) => (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>{label}</div>
      <div style={filenameStyle} title={filename}>
        {getShortName(filename)}
      </div>
      <div style={buttonGroupStyle}>
        <button
          style={smallButtonStyle}
          onClick={() => handleDownloadTreeSequence(filename, 'trees')}
          disabled={isDownloading}
          title="Download .trees file"
        >
          .trees
        </button>
        <button
          style={smallButtonStyle}
          onClick={() => handleDownloadTreeSequence(filename, 'tsz')}
          disabled={isDownloading}
          title="Download compressed .tsz file"
        >
          .tsz
        </button>
        <button
          style={smallButtonStyle}
          onClick={() => handleDownloadStatistics(filename)}
          disabled={isDownloading}
          title="Download statistics CSV"
        >
          Stats
        </button>
      </div>
      {expandedSection === `locations-${sectionKey}` ? (
        <div style={subsectionStyle}>
          <div style={{ fontSize: '0.625rem', color: colors.textSecondary }}>
            Select node type:
          </div>
          <div style={buttonGroupStyle}>
            <button
              style={smallButtonStyle}
              onClick={() => handleDownloadLocations(filename, 'samples')}
            >
              Samples
            </button>
            <button
              style={smallButtonStyle}
              onClick={() => handleDownloadLocations(filename, 'internal')}
            >
              Internal
            </button>
            <button
              style={smallButtonStyle}
              onClick={() => handleDownloadLocations(filename, 'all')}
            >
              All
            </button>
          </div>
          <button
            style={{ ...smallButtonStyle, fontSize: '0.625rem' }}
            onClick={() => setExpandedSection(null)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          style={smallButtonStyle}
          onClick={() => setExpandedSection(`locations-${sectionKey}`)}
          disabled={isDownloading}
          title="Download node locations CSV"
        >
          Locations CSV
        </button>
      )}
    </div>
  );

  const hasVisualizationExport = pngAvailable && onDownloadPNG;
  const hasFirstFile = !!firstFilename;
  const hasSecondFile = !!secondFilename;
  const hasDiffExport = hasFirstFile && hasSecondFile;

  return (
    <div style={containerStyle} className={className}>
      {/* Visualization: PNG */}
      {hasVisualizationExport && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Visualization</div>
          <button
            style={primaryButtonStyle}
            onClick={onDownloadPNG}
            disabled={isDownloading}
            title="Download as PNG image"
          >
            Download PNG
          </button>
        </div>
      )}

      {/* Tree Sequence 1 */}
      {hasFirstFile && renderFileSection(firstFilename!, 'Tree Sequence 1', 'first')}

      {/* Tree Sequence 2 */}
      {hasSecondFile && renderFileSection(secondFilename!, 'Tree Sequence 2', 'second')}

      {/* Diff Statistics */}
      {hasDiffExport && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Diff Statistics</div>
          <div style={buttonGroupStyle}>
            <button
              style={buttonStyle}
              onClick={() => handleDownloadDiffStatistics('json')}
              disabled={isDownloading}
              title="Download average statistics as JSON"
            >
              Average Stats (JSON)
            </button>
            <button
              style={buttonStyle}
              onClick={() => handleDownloadDiffStatistics('csv')}
              disabled={isDownloading}
              title="Download full node locations as CSV"
            >
              Full Locations (CSV)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffExportPanel;
