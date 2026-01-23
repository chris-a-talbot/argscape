/**
 * ExportPanel Component
 *
 * Comprehensive export controls panel for the Quick Actions Bar.
 * Consolidates visualization export and DownloadDropdown functionality.
 *
 * Sections:
 * - Visualization: PNG, SVG download
 * - Data: JSON export
 * - Tree Sequence: .trees, .tsz download
 * - Statistics: CSV export
 * - Locations: CSV export with node type selection
 * - Intermediate Data: MPR results, etc. (when available)
 */

import React, { useState, useEffect } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import { api } from '@/lib/api';
import { log } from '@/lib/logger';

export interface ExportPanelProps {
  /** Handler for PNG download */
  onDownloadPNG?: () => void;
  /** Handler for SVG download */
  onDownloadSVG?: () => void;
  /** Handler for JSON data export */
  onDownloadJSON?: () => void;
  /** Handler for Python script export */
  onDownloadPython?: () => void;
  /** Handler for copying shareable URL */
  onCopyURL?: () => void;
  /** Current filename for tree sequence operations */
  filename?: string;
  /** Whether PNG download is available */
  pngAvailable?: boolean;
  /** Whether SVG download is available */
  svgAvailable?: boolean;
  /** Whether JSON export is available */
  jsonAvailable?: boolean;
  /** Whether URL sharing is available */
  urlAvailable?: boolean;
  /** Loading state for downloads */
  isDownloading?: boolean;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Custom className */
  className?: string;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  onDownloadPNG,
  onDownloadSVG,
  onDownloadJSON,
  onDownloadPython,
  onCopyURL,
  filename,
  pngAvailable = true,
  svgAvailable = true,
  jsonAvailable = false,
  urlAvailable = false,
  isDownloading = false,
  onError,
  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  const [urlCopied, setUrlCopied] = useState(false);
  const [availableIntermediateData, setAvailableIntermediateData] = useState<string[]>([]);
  const [selectedLocationColumns, setSelectedLocationColumns] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Load available intermediate data when panel opens
  useEffect(() => {
    if (filename) {
      api
        .listIntermediateData(filename)
        .then((result) => {
          setAvailableIntermediateData(result.available_data_types || []);
        })
        .catch(() => {
          setAvailableIntermediateData([]);
        });
    }
  }, [filename]);

  // Handle URL copy with feedback
  const handleCopyURL = () => {
    if (onCopyURL) {
      onCopyURL();
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
  };

  // Tree sequence download handlers
  const handleDownloadTreeSequence = async (format: 'trees' | 'tsz') => {
    if (!filename) return;
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
      log.user.action('download-tree-sequence', { filename, format }, 'ExportPanel');
    } catch (error) {
      if (onError && error instanceof Error) onError(error);
    }
  };

  // Statistics download handler
  const handleDownloadStatistics = async () => {
    if (!filename) return;
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
      log.user.action('download-statistics-csv', { filename }, 'ExportPanel');
    } catch (error) {
      if (onError && error instanceof Error) onError(error);
    }
  };

  // Locations download handler
  const handleDownloadLocations = async (nodeType: 'all' | 'samples' | 'internal') => {
    if (!filename) return;
    try {
      const blob = await api.downloadLocationsCSV(filename, {
        nodeType,
        includeColumns: selectedLocationColumns,
      });
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
      log.user.action('download-locations-csv', { filename, nodeType }, 'ExportPanel');
      setExpandedSection(null);
    } catch (error) {
      if (onError && error instanceof Error) onError(error);
    }
  };

  // Intermediate data download handler
  const handleDownloadIntermediateData = async (
    dataType: string,
    format?: 'pkl' | 'csv' | 'npy' | 'zip'
  ) => {
    if (!filename) return;
    try {
      const blob = await api.downloadIntermediateData(filename, dataType, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let extension = '.csv';
      if (dataType === 'mpr_result' || dataType === 'spatial_arg') {
        extension = format === 'pkl' ? '.pkl' : '.zip';
      } else if (dataType === 'dispersal_params') {
        extension = '.json';
      }

      link.setAttribute(
        'download',
        `${filename.replace(/\.(trees|tsz)$/, '')}_${dataType}${extension}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      log.user.action('download-intermediate-data', { filename, dataType, format }, 'ExportPanel');
    } catch (error) {
      if (onError && error instanceof Error) onError(error);
    }
  };

  const toggleLocationColumn = (column: string) => {
    setSelectedLocationColumns((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
    );
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
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

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  };

  const checkboxStyle: React.CSSProperties = {
    width: '0.75rem',
    height: '0.75rem',
    accentColor: colors.accentPrimary,
    cursor: 'pointer',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    color: colors.text,
    cursor: 'pointer',
  };

  const infoTextStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: colors.textSecondary,
    opacity: 0.8,
  };

  const locationColumns = [
    { id: 'time', label: 'Time' },
    { id: 'individual_id', label: 'Individual' },
    { id: 'pedigree_id', label: 'Pedigree' },
    { id: 'population', label: 'Population' },
    { id: 'is_sample', label: 'Is Sample' },
    { id: 'z', label: 'Z Coord' },
  ];

  const intermediateDataNames: Record<string, string> = {
    mpr_result: 'GAIA MPR Result',
    spatial_arg: 'SpatialARG Object',
    dispersal_params: 'Dispersal Parameters',
    ancestor_locations: 'Ancestor Locations',
  };

  const hasVisualizationExport =
    (pngAvailable && onDownloadPNG) || (svgAvailable && onDownloadSVG) || onDownloadPython;
  const hasDataExport = jsonAvailable && onDownloadJSON;
  const hasTreeSequenceExport = !!filename;
  const hasIntermediateData = availableIntermediateData.length > 0;

  return (
    <div style={containerStyle} className={className}>
      {/* Visualization: PNG, SVG */}
      {hasVisualizationExport && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Visualization</div>
          <div style={buttonGroupStyle}>
            {pngAvailable && onDownloadPNG && (
              <button
                style={primaryButtonStyle}
                onClick={onDownloadPNG}
                disabled={isDownloading}
                title="Download as PNG image"
              >
                PNG
              </button>
            )}
            {svgAvailable && onDownloadSVG && (
              <button
                style={buttonStyle}
                onClick={onDownloadSVG}
                disabled={isDownloading}
                title="Download as SVG vector"
              >
                SVG
              </button>
            )}
            {hasDataExport && (
              <button
                style={buttonStyle}
                onClick={onDownloadJSON}
                disabled={isDownloading}
                title="Download graph data as JSON"
              >
                JSON
              </button>
            )}
            {onDownloadPython && (
              <button
                style={buttonStyle}
                onClick={onDownloadPython}
                disabled={isDownloading}
                title="Download Python script to recreate this visualization"
              >
                Python
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tree Sequence: .trees, .tsz */}
      {hasTreeSequenceExport && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Tree Sequence</div>
          <div style={buttonGroupStyle}>
            <button
              style={buttonStyle}
              onClick={() => handleDownloadTreeSequence('trees')}
              title="Download .trees file"
            >
              .trees
            </button>
            <button
              style={buttonStyle}
              onClick={() => handleDownloadTreeSequence('tsz')}
              title="Download compressed .tsz file"
            >
              .tsz
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      {hasTreeSequenceExport && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Statistics</div>
          <button style={buttonStyle} onClick={handleDownloadStatistics} title="Download statistics CSV">
            Download Statistics CSV
          </button>
        </div>
      )}

      {/* Locations */}
      {hasTreeSequenceExport && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Locations</div>
          {expandedSection !== 'locations' ? (
            <button
              style={buttonStyle}
              onClick={() => setExpandedSection('locations')}
              title="Configure location download"
            >
              Download Locations CSV
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={infoTextStyle}>Include columns:</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {locationColumns.map((col) => (
                  <label key={col.id} style={checkboxContainerStyle}>
                    <input
                      type="checkbox"
                      checked={selectedLocationColumns.includes(col.id)}
                      onChange={() => toggleLocationColumn(col.id)}
                      style={checkboxStyle}
                    />
                    <span style={checkboxLabelStyle}>{col.label}</span>
                  </label>
                ))}
              </div>
              <div style={buttonGroupStyle}>
                <button
                  style={buttonStyle}
                  onClick={() => handleDownloadLocations('samples')}
                  title="Download sample locations"
                >
                  Samples
                </button>
                <button
                  style={buttonStyle}
                  onClick={() => handleDownloadLocations('internal')}
                  title="Download internal node locations"
                >
                  Internal
                </button>
                <button
                  style={buttonStyle}
                  onClick={() => handleDownloadLocations('all')}
                  title="Download all node locations"
                >
                  All
                </button>
              </div>
              <button
                style={{ ...buttonStyle, fontSize: '0.625rem', padding: '0.25rem 0.5rem' }}
                onClick={() => setExpandedSection(null)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Intermediate Data */}
      {hasIntermediateData && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Intermediate Data</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {availableIntermediateData.map((dataType) => {
              const displayName = intermediateDataNames[dataType] || dataType;
              const supportsFormats = dataType === 'mpr_result';

              if (supportsFormats && expandedSection === `intermediate-${dataType}`) {
                return (
                  <div key={dataType} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div style={infoTextStyle}>{displayName} format:</div>
                    <div style={buttonGroupStyle}>
                      <button
                        style={buttonStyle}
                        onClick={() => handleDownloadIntermediateData(dataType, 'pkl')}
                      >
                        Pickle
                      </button>
                      <button
                        style={buttonStyle}
                        onClick={() => handleDownloadIntermediateData(dataType, 'csv')}
                      >
                        CSV
                      </button>
                      <button
                        style={buttonStyle}
                        onClick={() => handleDownloadIntermediateData(dataType, 'npy')}
                      >
                        NumPy
                      </button>
                    </div>
                    <button
                      style={{ ...buttonStyle, fontSize: '0.625rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => setExpandedSection(null)}
                    >
                      Cancel
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={dataType}
                  style={buttonStyle}
                  onClick={() =>
                    supportsFormats
                      ? setExpandedSection(`intermediate-${dataType}`)
                      : handleDownloadIntermediateData(dataType)
                  }
                >
                  {displayName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Share URL */}
      {urlAvailable && onCopyURL && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Share</div>
          <button
            style={{
              ...buttonStyle,
              background: urlCopied
                ? isLiquid
                  ? 'rgba(20, 226, 168, 0.2)'
                  : 'rgba(16, 185, 129, 0.1)'
                : 'transparent',
            }}
            onClick={handleCopyURL}
            title="Copy shareable URL to clipboard"
          >
            {urlCopied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportPanel;
