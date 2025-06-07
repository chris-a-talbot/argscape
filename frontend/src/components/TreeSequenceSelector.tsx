import { useState, useEffect } from 'react';
import { useTreeSequence } from '../context/TreeSequenceContext';
import { api } from '../lib/api';
import { log } from '../lib/logger';
import ConfirmModal from './ui/ConfirmModal';
import AlertModal from './ui/AlertModal';

interface TreeSequenceInfo {
  filename: string;
  num_samples: number;
  num_nodes: number;
  num_edges: number;
  num_trees: number;
  has_temporal: boolean;
  has_sample_spatial: boolean;
  has_all_spatial: boolean;
  spatial_status: string;
}

interface TreeSequenceSelectorProps {
  onSelect: (treeSequence: TreeSequenceInfo) => void;
  className?: string;
}

export default function TreeSequenceSelector({ onSelect, className = '' }: TreeSequenceSelectorProps) {
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
        data: { filename, num_samples: data.num_samples, num_nodes: data.num_nodes }
      });
      
      return {
        filename: data.filename,
        num_samples: data.num_samples,
        num_nodes: data.num_nodes,
        num_edges: data.num_edges,
        num_trees: data.num_trees,
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
          const response = await api.deleteTreeSequence(filename);
          
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sp-pale-green"></div>
      </div>
    );
  }

  if (availableTreeSequences.length === 0) {
    return (
      <div className={className}>
        <div className="bg-sp-dark-blue border border-sp-pale-green/20 rounded-xl p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sp-pale-green/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-sp-white">No Existing Tree Sequences</h3>
          </div>
          <p className="text-sp-white/60 text-sm mb-6">No previously uploaded sequences found. Upload or simulate a tree sequence first.</p>
          <button 
            onClick={fetchAvailableTreeSequences}
            className="bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-2 mx-auto"
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
    <div className={className}>
      {/* Header Card */}
      <div className="bg-sp-dark-blue border border-sp-pale-green/20 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-sp-pale-green/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-sp-white">Select Existing Tree Sequence</h3>
            <p className="text-sp-white/60 text-xs">Choose from previously uploaded sequences</p>
          </div>
          {selectedFilenames.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-sp-white/70">
                {selectedFilenames.size} selected
              </span>
              <button
                onClick={handleDeleteSelected}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-1"
                title={`Delete ${selectedFilenames.size} selected tree sequence${selectedFilenames.size > 1 ? 's' : ''}`}
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
        <div className="space-y-3 max-h-60 overflow-y-auto select-none">
          {availableTreeSequences.map((filename, index) => {
            const info = treeSequenceInfos[filename];
            const isCurrentlySelected = currentTreeSequence?.filename === filename;
            const isSelected = selectedFilename === filename;
            const isMultiSelected = selectedFilenames.has(filename);
            
            return (
              <div
                key={filename}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-sp-pale-green bg-sp-very-dark-blue shadow-lg' 
                    : isMultiSelected
                    ? 'border-blue-400 bg-sp-very-dark-blue shadow-md'
                    : 'border-sp-pale-green/20 bg-sp-very-dark-blue hover:border-sp-pale-green/50 hover:shadow-md'
                } ${isCurrentlySelected ? 'ring-2 ring-sp-pale-green ring-offset-2 ring-offset-sp-dark-blue' : ''}`}
                onClick={(e) => handleFileClick(filename, index, e)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Multi-select checkbox */}
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isMultiSelected}
                        onChange={() => {}} // Handled by onClick
                        className="w-4 h-4 text-sp-pale-green bg-sp-very-dark-blue border-sp-pale-green/30 rounded focus:ring-sp-pale-green focus:ring-2"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-mono text-sp-pale-green text-sm font-medium truncate"
                          title={filename}
                        >
                          {filename}
                        </span>
                        {isCurrentlySelected && (
                          <span className="text-xs bg-sp-pale-green text-sp-very-dark-blue px-2 py-1 rounded-full font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      {info ? (
                        <div className="text-xs text-sp-white/70 space-y-0.5">
                          <div className="flex gap-4">
                            <span>{info.num_samples} samples</span>
                            <span>{info.num_nodes} nodes</span>
                          </div>
                          <div className="flex gap-4">
                            <span>{info.num_edges} edges</span>
                            <span>{info.num_trees} trees</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-sp-white/50">Loading info...</div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(filename, e)}
                    className="ml-3 text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-all duration-200"
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

        {/* Help text */}
        <div className="mt-3 text-xs text-sp-white/60 text-center">
          Click to select for loading • Ctrl+click to multi-select • Shift+click to select range
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSelect}
          disabled={!selectedFilename || !treeSequenceInfos[selectedFilename]}
          className="flex-1 bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Load Selected
        </button>
        <button
          onClick={fetchAvailableTreeSequences}
          className="bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
        <button
          onClick={handleClearAll}
          disabled={availableTreeSequences.length === 0}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
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