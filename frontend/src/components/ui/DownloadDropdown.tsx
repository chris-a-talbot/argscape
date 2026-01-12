import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface DownloadDropdownProps {
    filename: string;
    onError?: (error: Error) => void;
    onDownloadImage?: () => void; // Optional image download handler for visualization pages
    useVisualizationStyle?: boolean; // If true, use sleek visualization page style
}

export function DownloadDropdown({ filename, onError, onDownloadImage, useVisualizationStyle = false }: DownloadDropdownProps) {
    const { colors, dropdownMenuStyle } = useThemeStyles();
    const [isOpen, setIsOpen] = useState(false);
    const [showLocationOptions, setShowLocationOptions] = useState(false);
    const [showIntermediateData, setShowIntermediateData] = useState(false);
    const [availableIntermediateData, setAvailableIntermediateData] = useState<string[]>([]);
    const [locationColumns, setLocationColumns] = useState<string[]>([]);
    const [selectedDataType, setSelectedDataType] = useState<string | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<'pkl' | 'csv' | 'npy' | 'zip'>('pkl');

    // Load available intermediate data when dropdown opens
    useEffect(() => {
        if (isOpen) {
            api.listIntermediateData(filename)
                .then((result) => {
                    const dataTypes = result.available_data_types || [];
                    setAvailableIntermediateData(dataTypes);
                })
                .catch(() => {
                    // Silently fail - intermediate data is optional
                    setAvailableIntermediateData([]);
                });
        }
    }, [isOpen, filename]);

    const handleDownload = async (format: 'trees' | 'tsz') => {
        try {
            const blob = await api.downloadTreeSequence(filename, format);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const downloadFilename = `${filename.replace(/\.(trees|tsz)$/, '')}.${format}`;
            link.setAttribute('download', downloadFilename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            log.user.action('download-tree-sequence', { filename, format }, 'DownloadDropdown');
            setIsOpen(false);
        } catch (error) {
            log.error('Download failed', {
                component: 'DownloadDropdown',
                error: error instanceof Error ? error : new Error(String(error)),
                data: { filename }
            });
            if (onError && error instanceof Error) {
                onError(error);
            }
        }
    };

    const handleDownloadLocations = async (nodeType: 'all' | 'samples' | 'internal') => {
        try {
            const blob = await api.downloadLocationsCSV(filename, {
                nodeType,
                includeColumns: locationColumns
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const baseName = filename.replace(/\.(trees|tsz)$/, '');
            const downloadFilename = `${baseName}_${nodeType}_locations.csv`;
            link.setAttribute('download', downloadFilename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            log.user.action('download-locations-csv', { filename, nodeType, columns: locationColumns }, 'DownloadDropdown');
            setShowLocationOptions(false);
            setIsOpen(false);
        } catch (error) {
            log.error('Location CSV download failed', {
                component: 'DownloadDropdown',
                error: error instanceof Error ? error : new Error(String(error)),
                data: { filename, nodeType }
            });
            if (onError && error instanceof Error) {
                onError(error);
            }
        }
    };

    const handleDownloadStatistics = async () => {
        try {
            const blob = await api.downloadStatisticsCSV(filename);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const baseName = filename.replace(/\.(trees|tsz)$/, '');
            const downloadFilename = `${baseName}_statistics.csv`;
            link.setAttribute('download', downloadFilename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            log.user.action('download-statistics-csv', { filename }, 'DownloadDropdown');
            setIsOpen(false);
        } catch (error) {
            log.error('Statistics CSV download failed', {
                component: 'DownloadDropdown',
                error: error instanceof Error ? error : new Error(String(error)),
                data: { filename }
            });
            if (onError && error instanceof Error) {
                onError(error);
            }
        }
    };

    const handleDownloadIntermediateData = async (dataType: string, format?: 'pkl' | 'csv' | 'npy' | 'zip') => {
        try {
            const blob = await api.downloadIntermediateData(filename, dataType, format);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const baseName = filename.replace(/\.(trees|tsz)$/, '');
            
            // Determine file extension based on data type and format
            let extension: string;
            if (dataType === 'mpr_result' || dataType === 'spatial_arg') {
                if (format === 'csv' || format === 'npy' || format === 'zip') {
                    extension = '.zip';
                } else {
                    extension = '.pkl';
                }
            } else if (dataType === 'dispersal_params') {
                extension = '.json';
            } else {
                extension = '.csv';
            }
            
            const downloadFilename = `${baseName}_${dataType}${extension}`;
            link.setAttribute('download', downloadFilename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            log.user.action('download-intermediate-data', { filename, dataType, format }, 'DownloadDropdown');
            setShowIntermediateData(false);
            setSelectedDataType(null);
            setIsOpen(false);
        } catch (error) {
            log.error('Intermediate data download failed', {
                component: 'DownloadDropdown',
                error: error instanceof Error ? error : new Error(String(error)),
                data: { filename, dataType, format }
            });
            if (onError && error instanceof Error) {
                onError(error);
            }
        }
    };

    const toggleColumn = (column: string) => {
        setLocationColumns(prev => 
            prev.includes(column) 
                ? prev.filter(c => c !== column)
                : [...prev, column]
        );
    };

    const availableColumns = [
        { id: 'time', label: 'Time' },
        { id: 'individual_id', label: 'Individual ID' },
        { id: 'pedigree_id', label: 'Pedigree ID' },
        { id: 'population', label: 'Population' },
        { id: 'is_sample', label: 'Is Sample' },
        { id: 'z', label: 'Z Coordinate' }
    ];

    return (
        <div className="relative">
            {useVisualizationStyle ? (
                <button 
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    style={{
                        backgroundColor: colors.accentPrimary,
                        color: colors.background
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                    }}
                    onClick={() => setIsOpen(!isOpen)}
                    title="Download options"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download</span>
                    <svg 
                        className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            ) : (
                <button
                    className="font-bold py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
                    style={{
                        backgroundColor: colors.accentPrimary,
                        color: colors.buttonText,
                        border: `1px solid ${colors.accentPrimary}`
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.accentSecondary;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.accentPrimary;
                    }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            )}

            {isOpen && (
                <div 
                    className="absolute w-64 mt-2 right-0" 
                    style={{ 
                        ...dropdownMenuStyle,
                        zIndex: 10000
                    }}
                >
                    <div className="py-2" style={{ color: colors.text }}>
                        {/* Tree Sequence Downloads */}
                        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                            Tree Sequence
                        </div>
                        <button
                            className="w-full px-4 py-2 text-left transition-colors duration-200 flex items-center gap-2"
                            style={{ color: colors.text }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.accentPrimary;
                                e.currentTarget.style.color = colors.buttonText;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = colors.text;
                            }}
                            onClick={() => handleDownload('trees')}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download .trees
                        </button>
                        <button
                            className="w-full px-4 py-2 text-left transition-colors duration-200 flex items-center gap-2"
                            style={{ color: colors.text }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.accentPrimary;
                                e.currentTarget.style.color = colors.buttonText;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = colors.text;
                            }}
                            onClick={() => handleDownload('tsz')}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Download .tsz
                        </button>
                        
                        {/* Image Download (for visualization pages) */}
                        {onDownloadImage && (
                            <>
                                <div className="border-t border-sp-pale-green/20 my-2"></div>
                                <div className="px-4 py-2 text-xs font-semibold text-sp-pale-green/70 uppercase tracking-wider">
                                    Visualization
                                </div>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2"
                                    onClick={() => {
                                        onDownloadImage();
                                        setIsOpen(false);
                                    }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Download Image
                                </button>
                            </>
                        )}
                        
                        {/* Statistics Download */}
                        <div className="border-t border-sp-pale-green/20 my-2"></div>
                        <div className="px-4 py-2 text-xs font-semibold text-sp-pale-green/70 uppercase tracking-wider">
                            Statistics
                        </div>
                        <button
                            className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2"
                            onClick={handleDownloadStatistics}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Download Statistics CSV
                        </button>

                        {/* Location CSV Downloads */}
                        <div className="border-t border-sp-pale-green/20 my-2"></div>
                        <div className="px-4 py-2 text-xs font-semibold text-sp-pale-green/70 uppercase tracking-wider">
                            Location Data
                        </div>
                        {!showLocationOptions ? (
                            <button
                                className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2"
                                onClick={() => setShowLocationOptions(true)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Download Locations CSV
                                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <div className="px-2">
                                {/* Column Selection */}
                                <div className="px-2 py-2 text-xs text-sp-pale-green/80 mb-2">
                                    Include columns:
                                </div>
                                <div className="px-2 pb-2 space-y-1 max-h-32 overflow-y-auto">
                                    {availableColumns.map(col => (
                                        <label key={col.id} className="flex items-center gap-2 px-2 py-1 hover:bg-sp-pale-green/10 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={locationColumns.includes(col.id)}
                                                onChange={() => toggleColumn(col.id)}
                                                className="rounded border-sp-pale-green/50 text-sp-pale-green focus:ring-sp-pale-green"
                                            />
                                            <span className="text-sm">{col.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="border-t border-sp-pale-green/20 my-2"></div>
                                {/* Node Type Selection */}
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1"
                                    onClick={() => handleDownloadLocations('samples')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Sample Locations
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1"
                                    onClick={() => handleDownloadLocations('internal')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Internal Node Locations
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1"
                                    onClick={() => handleDownloadLocations('all')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    All Node Locations
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green/20 hover:text-sp-pale-green transition-colors duration-200 flex items-center gap-2 text-sm"
                                    onClick={() => setShowLocationOptions(false)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                            </div>
                        )}

                        {/* Intermediate Data Downloads */}
                        {availableIntermediateData.length > 0 && (
                            <>
                                <div className="border-t border-sp-pale-green/20 my-2"></div>
                                <div className="px-4 py-2 text-xs font-semibold text-sp-pale-green/70 uppercase tracking-wider">
                                    Intermediate Data
                                </div>
                                {/* Flattened display for 1-2 items that don't need format selection */}
                                {availableIntermediateData.length <= 2 && !showIntermediateData && selectedDataType === null ? (
                                    <>
                                        {availableIntermediateData.map(dataType => {
                                            const displayNames: Record<string, string> = {
                                                'mpr_result': 'GAIA MPR Result',
                                                'spatial_arg': 'SpatialARG Object',
                                                'dispersal_params': 'Dispersal Parameters',
                                                'ancestor_locations': 'Ancestor Locations'
                                            };
                                            const displayName = displayNames[dataType] || dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                            const supportsFormats = dataType === 'mpr_result';

                                            return (
                                                <button
                                                    key={dataType}
                                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2"
                                                    onClick={() => {
                                                        if (supportsFormats) {
                                                            setSelectedDataType(dataType);
                                                            setSelectedFormat('pkl');
                                                            setShowIntermediateData(true);
                                                        } else {
                                                            handleDownloadIntermediateData(dataType);
                                                        }
                                                    }}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                    </svg>
                                                    {displayName}
                                                    {supportsFormats && (
                                                        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </>
                                ) : !showIntermediateData ? (
                                    <button
                                        className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2"
                                        onClick={() => setShowIntermediateData(true)}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                        </svg>
                                        Download Intermediate Data ({availableIntermediateData.length})
                                        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : selectedDataType === null ? (
                                    <div className="px-2">
                                        {availableIntermediateData.map(dataType => {
                                            // Format display names for better readability
                                            const displayNames: Record<string, string> = {
                                                'mpr_result': 'GAIA MPR Result',
                                                'spatial_arg': 'SpatialARG Object',
                                                'dispersal_params': 'Dispersal Parameters',
                                                'ancestor_locations': 'Ancestor Locations'
                                            };
                                            const displayName = displayNames[dataType] || dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                            
                                            // Check if this data type supports multiple formats
                                            const supportsFormats = dataType === 'mpr_result';
                                            
                                            return (
                                                <button
                                                    key={dataType}
                                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                                    onClick={() => {
                                                        if (supportsFormats) {
                                                            setSelectedDataType(dataType);
                                                            setSelectedFormat('pkl');
                                                        } else {
                                                            handleDownloadIntermediateData(dataType);
                                                        }
                                                    }}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                    </svg>
                                                    {displayName}
                                                    {supportsFormats && (
                                                        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            );
                                        })}
                                        <button
                                            className="w-full px-4 py-2 text-left hover:bg-sp-pale-green/20 hover:text-sp-pale-green transition-colors duration-200 flex items-center gap-2 text-sm"
                                            onClick={() => setShowIntermediateData(false)}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Back
                                        </button>
                                    </div>
                                ) : (
                                    <div className="px-2">
                                        {/* Format selection for MPR results */}
                                        <div className="px-2 py-2 text-xs text-sp-pale-green/80 mb-2">
                                            Select format:
                                        </div>
                                        <button
                                            className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                            onClick={() => handleDownloadIntermediateData(selectedDataType, 'pkl')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                            </svg>
                                            Pickle (.pkl) - Full object
                                        </button>
                                        <button
                                            className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                            onClick={() => handleDownloadIntermediateData(selectedDataType, 'csv')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            CSV (.zip) - Arrays as CSV files
                                        </button>
                                        <button
                                            className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                            onClick={() => handleDownloadIntermediateData(selectedDataType, 'npy')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                            </svg>
                                            NumPy (.zip) - Arrays as .npy files
                                        </button>
                                        <button
                                            className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                            onClick={() => handleDownloadIntermediateData(selectedDataType, 'zip')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            </svg>
                                            All Formats (.zip) - CSV + NumPy
                                        </button>
                                        <div className="border-t border-sp-pale-green/20 my-2"></div>
                                        <button
                                            className="w-full px-4 py-2 text-left hover:bg-sp-pale-green/20 hover:text-sp-pale-green transition-colors duration-200 flex items-center gap-2 text-sm"
                                            onClick={() => setSelectedDataType(null)}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Back
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
