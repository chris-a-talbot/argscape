import { useState, useEffect } from 'react';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useSemanticColors } from '../../hooks/useSemanticColors';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';

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

interface SpatialDiffTreeSequenceSelectorProps {
  onSelect: (treeSequence: TreeSequenceInfo) => void;
  className?: string;
}

export default function SpatialDiffTreeSequenceSelector({ onSelect, className = '' }: SpatialDiffTreeSequenceSelectorProps) {
  const { colors } = useColorTheme();
  const semanticColors = useSemanticColors();
  const [availableTreeSequences, setAvailableTreeSequences] = useState<string[]>([]);
  const [treeSequenceInfos, setTreeSequenceInfos] = useState<Record<string, TreeSequenceInfo>>({});
  const [loading, setLoading] = useState(false);
  const [selectedFilename, setSelectedFilename] = useState<string>('');
  const { treeSequence: currentTreeSequence } = useTreeSequence();

  const fetchAvailableTreeSequences = async () => {
    setLoading(true);
    try {
      log.data.processing('fetch-available-tree-sequences', 'SpatialDiffTreeSequenceSelector');
      const response = await api.getUploadedFiles();
      const data = response.data as { uploaded_tree_sequences: string[] };
      setAvailableTreeSequences(data.uploaded_tree_sequences || []);
      log.info(`Loaded ${data.uploaded_tree_sequences?.length || 0} tree sequences`, {
        component: 'SpatialDiffTreeSequenceSelector',
        action: 'fetch-available'
      });
    } catch (error) {
      log.error('Failed to fetch available tree sequences', {
        component: 'SpatialDiffTreeSequenceSelector',
        error: error instanceof Error ? error : new Error(String(error))
      });
      setAvailableTreeSequences([]);
    } finally {
      setLoading(false);
    }
  };

  const getTreeSequenceInfo = async (filename: string): Promise<TreeSequenceInfo | null> => {
    try {
      log.data.processing('fetch-metadata', 'SpatialDiffTreeSequenceSelector', undefined, undefined);
      const response = await api.getTreeSequenceMetadata(filename);
      const data = response.data as TreeSequenceInfo;
      
      log.debug(`Retrieved metadata for ${filename}`, {
        component: 'SpatialDiffTreeSequenceSelector',
        data: { filename, num_samples: data.num_samples, num_nodes: data.num_nodes }
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
        component: 'SpatialDiffTreeSequenceSelector',
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

  // Filter tree sequences to only show those with identical structure
  const getMatchingTreeSequences = (): TreeSequenceInfo[] => {
    if (!currentTreeSequence) return [];

    const current = currentTreeSequence;
    const matching: TreeSequenceInfo[] = [];

    for (const filename of availableTreeSequences) {
      const info = treeSequenceInfos[filename];
      if (!info) continue;

      // Skip the current tree sequence itself
      if (info.filename === current.filename) continue;

      // Check for identical structure
      if (
        info.num_nodes === current.num_nodes &&
        info.num_edges === current.num_edges &&
        info.num_samples === current.num_samples &&
        info.num_trees === current.num_trees
      ) {
        // Also check that it has temporal and spatial data
        if (info.has_temporal && info.has_all_spatial) {
          matching.push(info);
        }
      }
    }

    return matching;
  };

  const matchingSequences = getMatchingTreeSequences();

  const handleSelect = () => {
    if (selectedFilename && treeSequenceInfos[selectedFilename]) {
      onSelect(treeSequenceInfos[selectedFilename]);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div
          className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
          style={{ borderColor: colors.accentPrimary }}
        />
      </div>
    );
  }

  if (!currentTreeSequence) {
    return (
      <div className={className}>
        <div
          className="rounded-xl p-8 text-center border"
          style={{
            backgroundColor: colors.containerBackground,
            borderColor: `${colors.accentPrimary}33`
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${semanticColors.error}15` }}
            >
              <svg className="w-5 h-5" style={{ color: semanticColors.error }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>No Tree Sequence Loaded</h3>
          </div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Please load a tree sequence first before comparing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Current Tree Sequence Info */}
      <div
        className="border-2 rounded-xl p-5"
        style={{
          backgroundColor: `${colors.accentPrimary}15`,
          borderColor: `${colors.accentPrimary}4D`
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${colors.accentPrimary}33` }}
          >
            <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold" style={{ color: colors.accentPrimary }}>Currently Loaded Tree Sequence</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium truncate" style={{ color: colors.text }} title={currentTreeSequence.filename}>
              {currentTreeSequence.filename}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs" style={{ color: colors.textSecondary }}>
            <div>
              <span style={{ opacity: 0.7 }}>Samples:</span>
              <span className="font-mono font-bold ml-2" style={{ color: colors.accentPrimary }}>{currentTreeSequence.num_samples.toLocaleString()}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Nodes:</span>
              <span className="font-mono font-bold ml-2" style={{ color: colors.accentPrimary }}>{currentTreeSequence.num_nodes.toLocaleString()}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Edges:</span>
              <span className="font-mono font-bold ml-2" style={{ color: colors.accentPrimary }}>{currentTreeSequence.num_edges.toLocaleString()}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Trees:</span>
              <span className="font-mono font-bold ml-2" style={{ color: colors.accentPrimary }}>{currentTreeSequence.num_trees.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matching Tree Sequences */}
      <div
        className="rounded-xl p-5 flex-1 flex flex-col border"
        style={{
          backgroundColor: colors.containerBackground,
          borderColor: `${colors.accentPrimary}33`
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${colors.accentPrimary}1A` }}
          >
            <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>Select Tree Sequence to Compare</h3>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Only tree sequences with identical structure (same samples, nodes, edges, and trees) are shown.
            </p>
          </div>
        </div>

        {matchingSequences.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${semanticColors.warning}15` }}
              >
                <svg className="w-8 h-8" style={{ color: semanticColors.warning }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>No Matching Tree Sequences Found</h4>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                No other tree sequences were found with identical structure to the currently loaded sequence.
              </p>
              <div
                className="rounded-lg p-4 text-left space-y-2 border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: `${colors.accentPrimary}33`
                }}
              >
                <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>To compare tree sequences, they must have:</p>
                <ul className="text-xs space-y-1 list-disc list-inside" style={{ color: colors.textSecondary, opacity: 0.8 }}>
                  <li>Identical number of samples ({currentTreeSequence.num_samples.toLocaleString()})</li>
                  <li>Identical number of nodes ({currentTreeSequence.num_nodes.toLocaleString()})</li>
                  <li>Identical number of edges ({currentTreeSequence.num_edges.toLocaleString()})</li>
                  <li>Identical number of trees ({currentTreeSequence.num_trees.toLocaleString()})</li>
                  <li>Temporal data (node times)</li>
                  <li>Complete spatial data (all nodes have coordinates)</li>
                </ul>
                <p className="text-xs mt-3" style={{ color: colors.textSecondary, opacity: 0.8 }}>
                  <strong>Tip:</strong> Tree sequences created from the same base ARG (e.g., through different inference methods) typically have matching structure.
                </p>
              </div>
              <button
                onClick={fetchAvailableTreeSequences}
                className="mt-4 font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto border"
                style={{
                  backgroundColor: colors.containerBackground,
                  color: colors.text,
                  borderColor: `${colors.accentPrimary}33`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.accentPrimary;
                  e.currentTarget.style.color = colors.background;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.containerBackground;
                  e.currentTarget.style.color = colors.text;
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh List
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* File List */}
            <div className="space-y-3 flex-1 min-h-[200px] max-h-[400px] overflow-y-auto select-none py-2">
              {matchingSequences.map((info) => {
                const isSelected = selectedFilename === info.filename;

                return (
                  <div
                    key={info.filename}
                    className="p-4 rounded-lg border-2 cursor-pointer transition-all duration-200"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: isSelected ? colors.accentPrimary : `${colors.accentPrimary}33`,
                      boxShadow: isSelected ? `0 0 0 2px ${colors.accentPrimary}` : 'none'
                    }}
                    onClick={() => setSelectedFilename(info.filename)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = `${colors.accentPrimary}80`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = `${colors.accentPrimary}33`;
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-mono text-sm font-medium truncate"
                            style={{ color: colors.accentPrimary }}
                            title={info.filename}
                          >
                            {info.filename}
                          </span>
                        </div>
                        <div className="text-xs space-y-0.5" style={{ color: colors.textSecondary }}>
                          <div className="flex gap-4">
                            <span>{info.num_samples} samples</span>
                            <span>{info.num_nodes} nodes</span>
                          </div>
                          <div className="flex gap-4">
                            <span>{info.num_edges} edges</span>
                            <span>{info.num_trees} trees</span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="ml-3">
                          <svg className="w-5 h-5" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Button */}
            <div className="mt-4 pt-4 border-t" style={{ borderTopColor: `${colors.accentPrimary}33` }}>
              <button
                onClick={handleSelect}
                disabled={!selectedFilename || !treeSequenceInfos[selectedFilename]}
                className="w-full font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                style={{
                  backgroundColor: colors.accentPrimary,
                  color: colors.background
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Compare with Selected Tree Sequence
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

