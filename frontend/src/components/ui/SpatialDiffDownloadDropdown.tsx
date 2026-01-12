import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';
import { useThemeStyles } from '../../hooks/useThemeStyles';

interface SpatialDiffDownloadDropdownProps {
    firstFilename: string;
    secondFilename: string;
    onError?: (error: Error) => void;
    onDownloadImage?: () => void;
}

export function SpatialDiffDownloadDropdown({ 
    firstFilename, 
    secondFilename, 
    onError, 
    onDownloadImage 
}: SpatialDiffDownloadDropdownProps) {
    const { colors, dropdownMenuStyle } = useThemeStyles();
    const [isOpen, setIsOpen] = useState(false);
    const [showDiffOptions, setShowDiffOptions] = useState(false);
    const [showTree1Menu, setShowTree1Menu] = useState(false);
    const [showTree2Menu, setShowTree2Menu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowDiffOptions(false);
                setShowTree1Menu(false);
                setShowTree2Menu(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleDownloadTreeSequence = async (filename: string, format: 'trees' | 'tsz') => {
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
            log.user.action('download-tree-sequence', { filename, format }, 'SpatialDiffDownloadDropdown');
            setIsOpen(false);
            setShowTree1Menu(false);
            setShowTree2Menu(false);
        } catch (error) {
            log.error('Download failed', {
                component: 'SpatialDiffDownloadDropdown',
                error: error instanceof Error ? error : new Error(String(error)),
                data: { filename }
            });
            if (onError && error instanceof Error) {
                onError(error);
            }
        }
    };

    const handleDownloadStatistics = async (filename: string) => {
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
            log.user.action('download-statistics-csv', { filename }, 'SpatialDiffDownloadDropdown');
            setIsOpen(false);
            setShowTree1Menu(false);
            setShowTree2Menu(false);
        } catch (error) {
            log.error('Statistics CSV download failed', {
                component: 'SpatialDiffDownloadDropdown',
                error: error instanceof Error ? error : new Error(String(error)),
                data: { filename }
            });
            if (onError && error instanceof Error) {
                onError(error);
            }
        }
    };

    const handleDownloadLocations = async (filename: string, nodeType: 'all' | 'samples' | 'internal') => {
        try {
            const blob = await api.downloadLocationsCSV(filename, { nodeType });
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
            log.user.action('download-locations-csv', { filename, nodeType }, 'SpatialDiffDownloadDropdown');
            setIsOpen(false);
            setShowTree1Menu(false);
            setShowTree2Menu(false);
        } catch (error) {
            log.error('Location CSV download failed', {
                component: 'SpatialDiffDownloadDropdown',
                error: error instanceof Error ? error : new Error(String(error)),
                data: { filename, nodeType }
            });
            if (onError && error instanceof Error) {
                onError(error);
            }
        }
    };

    const handleDownloadDiffStatistics = async (format: 'csv' | 'json') => {
        try {
            const blob = await api.downloadDiffStatistics(firstFilename, secondFilename, format);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const baseName1 = firstFilename.replace(/\.(trees|tsz)$/, '');
            const baseName2 = secondFilename.replace(/\.(trees|tsz)$/, '');
            const extension = format === 'csv' ? '.csv' : '.json';
            const downloadFilename = `${baseName1}_vs_${baseName2}_diff${extension}`;
            
            link.setAttribute('download', downloadFilename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            log.user.action('download-diff-statistics', { firstFilename, secondFilename, format }, 'SpatialDiffDownloadDropdown');
            setIsOpen(false);
            setShowDiffOptions(false);
        } catch (error) {
            log.error('Diff statistics download failed', {
                component: 'SpatialDiffDownloadDropdown',
                error: error instanceof Error ? error : new Error(String(error)),
                data: { firstFilename, secondFilename, format }
            });
            if (onError && error instanceof Error) {
                onError(error);
            }
        }
    };

    // Get short display names for filenames - show the end of the filename
    const getShortName = (filename: string) => {
        // Remove extension for display
        const base = filename.replace(/\.(trees|tsz)$/, '');
        // Show last 40 characters (end of filename) if longer, as this likely includes important suffixes
        return base.length > 40 ? '...' + base.slice(-40) : base;
    };

    return (
        <div className="relative" ref={dropdownRef}>
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

            {isOpen && (
                <div 
                    className="absolute w-64 mt-2 right-0" 
                    style={{ ...dropdownMenuStyle, zIndex: 10000 }}
                >
                    <div className="py-2">
                        {/* Image Download */}
                        {onDownloadImage && (
                            <>
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
                                <div className="border-t border-sp-pale-green/20 my-2"></div>
                            </>
                        )}

                        {/* Tree Sequence 1 */}
                        <div className="px-4 py-2 text-xs font-semibold text-sp-pale-green/70 uppercase tracking-wider">
                            Tree Sequence 1
                        </div>
                        {!showTree1Menu ? (
                            <button
                                className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2"
                                onClick={() => setShowTree1Menu(true)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="truncate" title={firstFilename}>{getShortName(firstFilename)}</span>
                                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <div className="px-2">
                                <div className="px-2 py-2 text-xs text-sp-pale-green/80 mb-2">
                                    {getShortName(firstFilename)}
                                </div>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                    onClick={() => handleDownloadTreeSequence(firstFilename, 'trees')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download .trees
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                    onClick={() => handleDownloadTreeSequence(firstFilename, 'tsz')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    Download .tsz
                                </button>
                                <div className="border-t border-sp-pale-green/20 my-2"></div>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                    onClick={() => handleDownloadStatistics(firstFilename)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Download Statistics CSV
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                    onClick={() => handleDownloadLocations(firstFilename, 'all')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Download Locations CSV
                                </button>
                                <div className="border-t border-sp-pale-green/20 my-2"></div>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green/20 hover:text-sp-pale-green transition-colors duration-200 flex items-center gap-2 text-sm"
                                    onClick={() => setShowTree1Menu(false)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                            </div>
                        )}

                        <div className="border-t border-sp-pale-green/20 my-2"></div>

                        {/* Tree Sequence 2 */}
                        <div className="px-4 py-2 text-xs font-semibold text-sp-pale-green/70 uppercase tracking-wider">
                            Tree Sequence 2
                        </div>
                        {!showTree2Menu ? (
                            <button
                                className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2"
                                onClick={() => setShowTree2Menu(true)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="truncate" title={secondFilename}>{getShortName(secondFilename)}</span>
                                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <div className="px-2">
                                <div className="px-2 py-2 text-xs text-sp-pale-green/80 mb-2">
                                    {getShortName(secondFilename)}
                                </div>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                    onClick={() => handleDownloadTreeSequence(secondFilename, 'trees')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download .trees
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                    onClick={() => handleDownloadTreeSequence(secondFilename, 'tsz')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    Download .tsz
                                </button>
                                <div className="border-t border-sp-pale-green/20 my-2"></div>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                    onClick={() => handleDownloadStatistics(secondFilename)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Download Statistics CSV
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                    onClick={() => handleDownloadLocations(secondFilename, 'all')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Download Locations CSV
                                </button>
                                <div className="border-t border-sp-pale-green/20 my-2"></div>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green/20 hover:text-sp-pale-green transition-colors duration-200 flex items-center gap-2 text-sm"
                                    onClick={() => setShowTree2Menu(false)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                            </div>
                        )}

                        <div className="border-t border-sp-pale-green/20 my-2"></div>

                        {/* Diff Statistics */}
                        <div className="px-4 py-2 text-xs font-semibold text-sp-pale-green/70 uppercase tracking-wider">
                            Diff Statistics
                        </div>
                        {!showDiffOptions ? (
                            <button
                                className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2"
                                onClick={() => setShowDiffOptions(true)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Download Diff Statistics
                                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <div className="px-2">
                                <div className="px-2 py-2 text-xs text-sp-pale-green/80 mb-2">
                                    Select format:
                                </div>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                    onClick={() => handleDownloadDiffStatistics('json')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Average Statistics (.json)
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2 mb-1 text-sm"
                                    onClick={() => handleDownloadDiffStatistics('csv')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Full Node Locations (.csv)
                                </button>
                                <div className="border-t border-sp-pale-green/20 my-2"></div>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-sp-pale-green/20 hover:text-sp-pale-green transition-colors duration-200 flex items-center gap-2 text-sm"
                                    onClick={() => setShowDiffOptions(false)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

