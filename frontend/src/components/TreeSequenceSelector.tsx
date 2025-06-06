import { useState, useEffect } from 'react';
import { useTreeSequence } from '../context/TreeSequenceContext';
import { api } from '../lib/api';
import { log } from '../lib/logger';

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
    
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

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
      alert(`Failed to delete tree sequence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFilenames.size === 0) return;
    
    const filenames = Array.from(selectedFilenames);
    const confirmMessage = filenames.length === 1 
      ? `Are you sure you want to delete "${filenames[0]}"?`
      : `Are you sure you want to delete ${filenames.length} tree sequences?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

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
      alert(`Failed to delete tree sequences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClearAll = async () => {
    if (availableTreeSequences.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ALL ${availableTreeSequences.length} tree sequences? This action cannot be undone.`)) {
      return;
    }

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
      alert(`Failed to clear all tree sequences: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Refresh the list to see what's left
      fetchAvailableTreeSequences();
    }
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
      <div className={`text-center p-8 ${className}`}>
        <p className="text-sp-white text-lg mb-4">No existing tree sequences found</p>
        <button 
          onClick={fetchAvailableTreeSequences}
          className="bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-sp-white">Select Existing Tree Sequence</h3>
          {selectedFilenames.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-sp-white/70">
                {selectedFilenames.size} selected
              </span>
              <button
                onClick={handleDeleteSelected}
                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
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
        
        <div className="space-y-2 max-h-60 overflow-y-auto select-none">
          {availableTreeSequences.map((filename, index) => {
            const info = treeSequenceInfos[filename];
            const isCurrentlySelected = currentTreeSequence?.filename === filename;
            const isSelected = selectedFilename === filename;
            const isMultiSelected = selectedFilenames.has(filename);
            
            return (
              <div
                key={filename}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-sp-pale-green bg-sp-dark-blue' 
                    : isMultiSelected
                    ? 'border-blue-400 bg-blue-900/30'
                    : 'border-sp-dark-blue bg-sp-very-dark-blue hover:border-sp-pale-green'
                } ${isCurrentlySelected ? 'ring-2 ring-sp-pale-green' : ''}`}
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
                        className="w-4 h-4 text-sp-pale-green bg-sp-very-dark-blue border-sp-dark-blue rounded focus:ring-sp-pale-green focus:ring-2"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-mono text-sp-pale-green text-sm truncate"
                          title={filename}
                        >
                          {filename}
                        </span>
                        {isCurrentlySelected && (
                          <span className="text-xs bg-sp-pale-green text-sp-very-dark-blue px-2 py-1 rounded font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      {info ? (
                        <div className="text-xs text-sp-white space-y-1">
                          <div>{info.num_samples} samples, {info.num_nodes} nodes</div>
                          <div>{info.num_edges} edges, {info.num_trees} trees</div>
                        </div>
                      ) : (
                        <div className="text-xs text-sp-white">Loading info...</div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(filename, e)}
                    className="ml-2 text-red-400 hover:text-red-300 p-1 rounded transition-colors"
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
        <div className="mt-2 text-xs text-sp-white/60">
          Click to select for loading • Ctrl+click to multi-select • Shift+click to select range
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSelect}
          disabled={!selectedFilename || !treeSequenceInfos[selectedFilename]}
          className="flex-1 bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-bold py-2 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Load Selected
        </button>
        <button
          onClick={fetchAvailableTreeSequences}
          className="bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={handleClearAll}
          disabled={availableTreeSequences.length === 0}
          className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title="Delete all tree sequences"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Clear All
        </button>
      </div>
    </div>
  );
} 