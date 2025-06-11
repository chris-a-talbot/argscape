import { useState } from 'react';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';

interface DownloadDropdownProps {
    filename: string;
    onError?: (error: Error) => void;
}

export function DownloadDropdown({ filename, onError }: DownloadDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

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

    return (
        <div className="relative">
            <button 
                className="bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
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

            {isOpen && (
                <div className="absolute z-50 w-48 mt-2 right-0 bg-sp-dark-blue border border-sp-pale-green/20 rounded-xl shadow-xl">
                    <div className="py-2">
                        <button
                            className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2"
                            onClick={() => handleDownload('trees')}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download .trees
                        </button>
                        <button
                            className="w-full px-4 py-2 text-left hover:bg-sp-pale-green hover:text-sp-very-dark-blue transition-colors duration-200 flex items-center gap-2"
                            onClick={() => handleDownload('tsz')}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Download .tsz
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 