import { useState, useRef, useEffect } from 'react';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';

interface TreeSequenceDownload {
    filename: string;
    label?: string;
    tooltipLabel?: string; // Full filename shown on hover
}

interface ComprehensiveDownloadDropdownProps {
    onDownloadImage: () => void;
    treeSequences: TreeSequenceDownload[];
    onError?: (error: Error) => void;
    showTooltips?: boolean; // Whether to show tooltip icons for tree sequences
}

export function ComprehensiveDownloadDropdown({ 
    onDownloadImage, 
    treeSequences,
    onError,
    showTooltips = false
}: ComprehensiveDownloadDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { colors, dropdownMenuStyle } = useThemeStyles();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
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
            log.user.action('download-tree-sequence', { filename, format }, 'ComprehensiveDownloadDropdown');
            setIsOpen(false);
        } catch (error) {
            log.error('Download failed', {
                component: 'ComprehensiveDownloadDropdown',
                error: error instanceof Error ? error : new Error(String(error)),
                data: { filename }
            });
            if (onError && error instanceof Error) {
                onError(error);
            }
        }
    };

    const handleImageDownload = () => {
        onDownloadImage();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                style={{
                    backgroundColor: colors.containerBackground,
                    color: colors.text
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.accentPrimary;
                    e.currentTarget.style.color = colors.background;
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.backgroundColor = colors.containerBackground;
                        e.currentTarget.style.color = colors.text;
                    }
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
                    className="absolute z-50 mt-2 right-0 rounded-lg shadow-xl border min-w-[200px]"
                    style={{
                        backgroundColor: colors.containerBackground,
                        borderColor: colors.border
                    }}
                >
                    <div className="py-1">
                        {/* Image download */}
                        <button
                            className="w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2"
                            style={{ color: colors.text }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.accentPrimary;
                                e.currentTarget.style.color = colors.background;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = colors.text;
                            }}
                            onClick={handleImageDownload}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Download Image
                        </button>

                        {/* Divider */}
                        {treeSequences.length > 0 && (
                            <div 
                                className="my-1 border-t"
                                style={{ borderColor: colors.border }}
                            />
                        )}

                        {/* Tree sequence downloads */}
                        {treeSequences.map((ts, index) => (
                            <div key={index}>
                                {ts.label && (
                                    <div 
                                        className="px-4 py-1 text-xs font-semibold flex items-center gap-1.5"
                                        style={{ color: `${colors.text}99` }}
                                    >
                                        <span>{ts.label}</span>
                                        {showTooltips && ts.tooltipLabel && (
                                            <div 
                                                className="relative inline-flex items-center"
                                                onMouseEnter={() => setHoveredTooltip(ts.tooltipLabel || null)}
                                                onMouseLeave={() => setHoveredTooltip(null)}
                                            >
                                                <svg 
                                                    className="w-3 h-3 cursor-help" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                    style={{ opacity: 0.6 }}
                                                >
                                                    <path 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        strokeWidth={2} 
                                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                                    />
                                                </svg>
                                                {hoveredTooltip === ts.tooltipLabel && (
                                                    <div 
                                                        className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[100] px-3 py-1.5 rounded text-xs pointer-events-none shadow-lg font-mono"
                                                        style={{
                                                            backgroundColor: colors.tooltipBackground || colors.containerBackground,
                                                            color: colors.tooltipText || colors.text,
                                                            border: `1px solid ${colors.border}`,
                                                            maxWidth: 'min(30vw, 500px)',
                                                            minWidth: '12rem',
                                                            overflowWrap: 'break-word',
                                                            wordWrap: 'break-word',
                                                            hyphens: 'auto'
                                                        }}
                                                    >
                                                        {ts.tooltipLabel}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button
                                    className="w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2"
                                    style={{ color: colors.text }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = colors.accentPrimary;
                                        e.currentTarget.style.color = colors.background;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = colors.text;
                                    }}
                                    onClick={() => handleDownloadTreeSequence(ts.filename, 'trees')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download .trees
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2"
                                    style={{ color: colors.text }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = colors.accentPrimary;
                                        e.currentTarget.style.color = colors.background;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = colors.text;
                                    }}
                                    onClick={() => handleDownloadTreeSequence(ts.filename, 'tsz')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    Download .tsz
                                </button>
                                {index < treeSequences.length - 1 && (
                                    <div 
                                        className="my-1 border-t"
                                        style={{ borderColor: colors.border }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

