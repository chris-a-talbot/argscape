import { useState, useEffect } from 'react';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useSemanticColors } from '../../hooks/useSemanticColors';

/**
 * Smart middle truncation for extremely long filenames only.
 * For most filenames, we rely on CSS text-overflow: ellipsis for natural truncation.
 * This function only kicks in for very long names (80+ chars) to ensure the end
 * (date/extension) remains visible even when CSS truncates.
 * Example: "s25_mdtwf_t1000000_very_long_name_with_lots_of_details_22814.trees"
 *       -> "s25_mdtwf_t1000000_very_long...details_22814.trees"
 */
function truncateFilename(filename: string, maxLength: number = 80): string {
  // Only apply smart truncation for very long filenames
  // Shorter names will use CSS truncation which adapts to container width
  if (filename.length <= maxLength) return filename;

  // Find the extension
  const lastDot = filename.lastIndexOf('.');
  const extension = lastDot > 0 ? filename.slice(lastDot) : '';
  const nameWithoutExt = lastDot > 0 ? filename.slice(0, lastDot) : filename;

  // Calculate how much space we have for the name parts
  const ellipsis = '...';
  const availableLength = maxLength - extension.length - ellipsis.length;

  if (availableLength <= 0) {
    // Extension is too long, just truncate
    return filename.slice(0, maxLength - 3) + '...';
  }

  // Split available space: more for the beginning (usually project identifier)
  const startLength = Math.ceil(availableLength * 0.6);
  const endLength = availableLength - startLength;

  if (endLength <= 0) {
    return nameWithoutExt.slice(0, startLength) + ellipsis + extension;
  }

  const start = nameWithoutExt.slice(0, startLength);
  const end = nameWithoutExt.slice(-endLength);

  return start + ellipsis + end + extension;
}

type TreeSequenceInfo = {
  filename: string;
  num_samples: number;
  num_nodes: number;
  num_edges: number;
  num_trees: number;
  num_mutations: number;
  has_temporal: boolean;
  has_sample_spatial: boolean;
  has_all_spatial: boolean;
  spatial_status: string;
};

interface TreeSequenceSelectorProps {
  onSelect: (treeSequence: TreeSequenceInfo) => void;
  className?: string;
}

export default function TreeSequenceSelector({ onSelect, className = '' }: TreeSequenceSelectorProps) {
  const { colors } = useColorTheme();
  const semanticColors = useSemanticColors();
  const [availableTreeSequences, setAvailableTreeSequences] = useState<string[]>([]);
  const [treeSequenceInfos, setTreeSequenceInfos] = useState<Record<string, TreeSequenceInfo>>({});
  const [loading, setLoading] = useState(false);
  const [selectedFilename, setSelectedFilename] = useState<string>('');
  const [selectedFilenames, setSelectedFilenames] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number>(-1);
  const { treeSequence: currentTreeSequence } = useTreeSequence();

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'default' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'default'
  });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const fetchAvailableTreeSequences = async () => {
    setLoading(true);
    try {
      log.data.processing('fetch-available-tree-sequences', 'TreeSequenceSelector');
      const response = await api.getUploadedFiles();
      const data = response.data as { uploaded_tree_sequences: string[] };
      setAvailableTreeSequences(data.uploaded_tree_sequences || []);
      log.info(`Loaded ${data.uploaded_tree_sequences?.length || 0} tree sequences`, {
        component: 'TreeSequenceSelector',
        action: 'fetch-available'
      });
    } catch (error) {
      log.error('Failed to fetch available tree sequences', {
        component: 'TreeSequenceSelector',
        error: error instanceof Error ? error : new Error(String(error))
      });
      setAvailableTreeSequences([]);
    } finally {
      setLoading(false);
    }
  };

  const getTreeSequenceInfo = async (filename: string): Promise<TreeSequenceInfo | null> => {
    try {
      log.data.processing('fetch-metadata', 'TreeSequenceSelector', undefined, undefined);
      const response = await api.getTreeSequenceMetadata(filename);
      const data = response.data as TreeSequenceInfo;
      
      log.debug(`Retrieved metadata for ${filename}`, {
        component: 'TreeSequenceSelector',
        data: { filename, num_samples: data.num_samples, num_nodes: data.num_nodes, num_mutations: data.num_mutations }
      });
      
      return {
        filename: data.filename,
        num_samples: data.num_samples,
        num_nodes: data.num_nodes,
        num_edges: data.num_edges,
        num_trees: data.num_trees,
        num_mutations: data.num_mutations,
        has_temporal: data.has_temporal,
        has_sample_spatial: data.has_sample_spatial,
        has_all_spatial: data.has_all_spatial,
        spatial_status: data.spatial_status
      };
    } catch (error) {
      log.error(`Failed to get metadata for ${filename}`, {
        component: 'TreeSequenceSelector',
        error: error instanceof Error ? error : new Error(String(error)),
        data: { filename }
      });
      return null;
    }
  };

  useEffect(() => {
    fetchAvailableTreeSequences();
  }, []);

  useEffect(() => {
    // Fetch info for all available tree sequences
    const fetchAllInfos = async () => {
      const infos: Record<string, TreeSequenceInfo> = {};
      for (const filename of availableTreeSequences) {
        const info = await getTreeSequenceInfo(filename);
        if (info) {
          infos[filename] = info;
        }
      }
      setTreeSequenceInfos(infos);
    };

    if (availableTreeSequences.length > 0) {
      fetchAllInfos();
    }
  }, [availableTreeSequences]);

  const handleSelect = () => {
    if (selectedFilename && treeSequenceInfos[selectedFilename]) {
      onSelect(treeSequenceInfos[selectedFilename]);
    }
  };

  const handleFileClick = (filename: string, index: number, event: React.MouseEvent) => {
    // Prevent text selection on any modifier key clicks
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }

    if (event.shiftKey && lastClickedIndex !== -1) {
      // Shift+click: clear selections, then select range from last clicked to current
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const newSelected = new Set<string>();
      
      for (let i = start; i <= end; i++) {
        newSelected.add(availableTreeSequences[i]);
      }
      
      setSelectedFilenames(newSelected);
      // Don't update lastClickedIndex on shift+click - keep the anchor point
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+click: toggle this item in/out of selection, keep others
      const newSelected = new Set(selectedFilenames);
      if (newSelected.has(filename)) {
        newSelected.delete(filename);
      } else {
        newSelected.add(filename);
      }
      setSelectedFilenames(newSelected);
      setLastClickedIndex(index);
    } else {
      // Regular click: clear all selections, select just this item
      setSelectedFilename(filename);
      setSelectedFilenames(new Set([filename]));
      setLastClickedIndex(index);
    }
  };

  const handleDelete = async (filename: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Tree Sequence',
      message: `Are you sure you want to delete "${filename}"?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        
        try {
          log.user.action('delete-tree-sequence', { filename }, 'TreeSequenceSelector');
          await api.deleteTreeSequence(filename);
          
          log.info(`Successfully deleted tree sequence: ${filename}`, {
            component: 'TreeSequenceSelector',
            data: { filename }
          });

          // Remove from local state
          setAvailableTreeSequences(prev => prev.filter(f => f !== filename));
          setTreeSequenceInfos(prev => {
            const newInfos = { ...prev };
            delete newInfos[filename];
            return newInfos;
          });

          // Clear from selections
          if (selectedFilename === filename) {
            setSelectedFilename('');
          }
          setSelectedFilenames(prev => {
            const newSelected = new Set(prev);
            newSelected.delete(filename);
            return newSelected;
          });

        } catch (error) {
          log.error('Failed to delete tree sequence', {
            component: 'TreeSequenceSelector',
            error: error instanceof Error ? error : new Error(String(error)),
            data: { filename }
          });
          setAlertModal({
            isOpen: true,
            title: 'Delete Failed',
            message: `Failed to delete tree sequence: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
        }
      }
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedFilenames.size === 0) return;
    
    const filenames = Array.from(selectedFilenames);
    const confirmMessage = filenames.length === 1 
      ? `Are you sure you want to delete "${filenames[0]}"?`
      : `Are you sure you want to delete ${filenames.length} tree sequences?`;
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Tree Sequences',
      message: confirmMessage,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        
        try {
          // Delete all selected files
          const deletePromises = filenames.map(filename => api.deleteTreeSequence(filename));
          await Promise.all(deletePromises);
          
          log.info(`Successfully deleted ${filenames.length} tree sequences`, {
            component: 'TreeSequenceSelector',
            data: { filenames }
          });

          // Remove from local state
          setAvailableTreeSequences(prev => prev.filter(f => !filenames.includes(f)));
          setTreeSequenceInfos(prev => {
            const newInfos = { ...prev };
            filenames.forEach(filename => delete newInfos[filename]);
            return newInfos;
          });

          // Clear selections
          setSelectedFilenames(new Set());
          if (filenames.includes(selectedFilename)) {
            setSelectedFilename('');
          }

        } catch (error) {
          log.error('Failed to delete selected tree sequences', {
            component: 'TreeSequenceSelector',
            error: error instanceof Error ? error : new Error(String(error)),
            data: { filenames }
          });
          setAlertModal({
            isOpen: true,
            title: 'Delete Failed',
            message: `Failed to delete tree sequences: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
        }
      }
    });
  };

  const handleClearAll = async () => {
    if (availableTreeSequences.length === 0) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Tree Sequences',
      message: `Are you sure you want to delete ALL ${availableTreeSequences.length} tree sequences? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        
        try {
          // Delete all files
          const deletePromises = availableTreeSequences.map(filename => api.deleteTreeSequence(filename));
          await Promise.all(deletePromises);
          
          log.info(`Successfully cleared all ${availableTreeSequences.length} tree sequences`, {
            component: 'TreeSequenceSelector',
            data: { count: availableTreeSequences.length }
          });

          // Clear all state
          setAvailableTreeSequences([]);
          setTreeSequenceInfos({});
          setSelectedFilenames(new Set());
          setSelectedFilename('');

        } catch (error) {
          log.error('Failed to clear all tree sequences', {
            component: 'TreeSequenceSelector',
            error: error instanceof Error ? error : new Error(String(error))
          });
          setAlertModal({
            isOpen: true,
            title: 'Clear Failed',
            message: `Failed to clear all tree sequences: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
          // Refresh the list to see what's left
          fetchAvailableTreeSequences();
        }
      }
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: colors.accentPrimary }}></div>
      </div>
    );
  }

  if (availableTreeSequences.length === 0) {
    return (
      <div className={className}>
        <div className="border rounded-xl p-8 text-center" style={{
          backgroundColor: colors.containerBackground,
          borderColor: colors.border
        }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
              backgroundColor: `${colors.accentPrimary}10`
            }}>
              <svg className="w-5 h-5" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>No Existing Tree Sequences</h3>
          </div>
          <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>No previously uploaded sequences found. Upload or simulate a tree sequence first.</p>
          <button 
            onClick={fetchAvailableTreeSequences}
            className="font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-2 mx-auto border"
            style={{
              backgroundColor: colors.containerBackground,
              color: colors.text,
              borderColor: colors.border
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accentPrimary;
              e.currentTarget.style.color = colors.buttonText;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.containerBackground;
              e.currentTarget.style.color = colors.text;
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header Card */}
      <div className="border rounded-xl p-5 mb-4 flex-1 flex flex-col" style={{
        backgroundColor: colors.containerBackground,
        borderColor: colors.border
      }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
            backgroundColor: `${colors.accentPrimary}10`
          }}>
            <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>Select Tree Sequence</h3>
          </div>
          {/* Refresh icon button - utility action */}
          <button
            onClick={fetchAvailableTreeSequences}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: colors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${colors.accentPrimary}15`;
              e.currentTarget.style.color = colors.accentPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textSecondary;
            }}
            title="Refresh file list"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {selectedFilenames.size > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>
                {selectedFilenames.size} selected
              </span>
              <button
                onClick={handleDeleteSelected}
                className="font-bold py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-1"
                style={{ backgroundColor: semanticColors.error, color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = semanticColors.errorHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = semanticColors.error}
                title={`Delete ${selectedFilenames.size} selected tree sequences`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
        
        {/* File List */}
        <div className="space-y-2 flex-1 min-h-[300px] overflow-y-auto select-none py-2">
          {availableTreeSequences.map((filename, index) => {
            const info = treeSequenceInfos[filename];
            const isCurrent = currentTreeSequence?.filename === filename;
            // A file is "selected" if it's in the selection set (for loading)
            const isInSelection = selectedFilenames.has(filename);
            const isSelected = isInSelection && !isCurrent;

            // Style logic:
            // - Current (loaded): subtle gray background, "Current" badge, NO thick border
            // - Selected (to load next): thick green border, "Selected" badge
            // - Default: normal border
            const getBorderColor = () => {
              if (isSelected) return colors.accentPrimary; // Thick border for "about to load"
              return colors.border;
            };

            const getBorderWidth = () => {
              if (isSelected) return '2px';
              return '1px';
            };

            const getBackgroundColor = () => {
              if (isCurrent) return `${colors.textSecondary}10`; // Subtle gray for current
              if (isSelected) return `${colors.accentPrimary}05`; // Very subtle tint for selected
              return colors.containerBackground;
            };

            return (
              <div
                key={filename}
                className="p-4 rounded-lg cursor-pointer transition-all duration-200 group"
                style={{
                  borderWidth: getBorderWidth(),
                  borderStyle: 'solid',
                  borderColor: getBorderColor(),
                  backgroundColor: getBackgroundColor(),
                  boxShadow: isSelected ? `0 0 0 2px ${colors.accentPrimary}30` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isCurrent) {
                    e.currentTarget.style.borderColor = `${colors.accentPrimary}60`;
                    e.currentTarget.style.backgroundColor = `${colors.accentPrimary}05`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isCurrent) {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.backgroundColor = colors.containerBackground;
                  }
                }}
                onClick={(e) => handleFileClick(filename, index, e)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 min-w-0">
                      <span
                        className="font-mono text-sm font-medium cursor-help truncate"
                        style={{ color: isSelected ? colors.accentPrimary : colors.text }}
                        title={`${filename}\n\nClick to select, Ctrl+Click for multi-select, Shift+Click for range select`}
                      >
                        {truncateFilename(filename)}
                      </span>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                          backgroundColor: `${colors.textSecondary}20`,
                          color: colors.textSecondary
                        }}>
                          Current
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                          backgroundColor: colors.accentPrimary,
                          color: colors.buttonText
                        }}>
                          Selected
                        </span>
                      )}
                    </div>
                    {info ? (
                      <div className="text-xs flex gap-4 flex-wrap" style={{ color: colors.textSecondary }}>
                        <span>{info.num_samples} samples</span>
                        <span>{info.num_nodes} nodes</span>
                        <span>{info.num_trees} trees</span>
                      </div>
                    ) : (
                      <div className="text-xs" style={{ color: colors.textSecondary, opacity: 0.5 }}>Loading info...</div>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDelete(filename, e)}
                    className="ml-3 p-2 rounded-lg transition-all duration-200 opacity-50 group-hover:opacity-100"
                    style={{ color: semanticColors.error }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.color = semanticColors.errorHover;
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = semanticColors.error;
                      e.currentTarget.style.opacity = '';
                    }}
                    title="Delete tree sequence"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-shrink-0">
        {/* Load button - only enabled when exactly one file is selected */}
        {(() => {
          const canLoad = selectedFilenames.size === 1 && selectedFilename && treeSequenceInfos[selectedFilename];
          const multipleSelected = selectedFilenames.size > 1;
          return (
            <button
              onClick={handleSelect}
              disabled={!canLoad}
              className="flex-1 font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: canLoad ? colors.accentPrimary : colors.border,
                color: canLoad ? colors.buttonText : colors.textSecondary
              }}
              onMouseEnter={(e) => {
                if (canLoad) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
              title={multipleSelected ? 'Select only one file to load' : undefined}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {multipleSelected ? 'Select One to Load' : 'Load Selected'}
            </button>
          );
        })()}
        <button
          onClick={handleClearAll}
          disabled={availableTreeSequences.length === 0}
          className="font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            backgroundColor: availableTreeSequences.length === 0 ? colors.border : semanticColors.error,
            color: availableTreeSequences.length === 0 ? colors.textSecondary : 'white'
          }}
          onMouseEnter={(e) => {
            if (availableTreeSequences.length > 0) {
              e.currentTarget.style.backgroundColor = semanticColors.errorHover;
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (availableTreeSequences.length > 0) {
              e.currentTarget.style.backgroundColor = semanticColors.error;
              e.currentTarget.style.transform = '';
            }
          }}
          title="Delete all tree sequences"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Clear All
        </button>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />
    </div>
  );
} 