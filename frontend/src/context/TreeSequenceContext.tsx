import { createContext, useContext, useState, ReactNode } from 'react';
import { SAMPLE_LIMITS } from '../config/constants';

interface TreeSequenceData {
  filename: string;
  size: number;
  content_type: string;
  status: string;
  num_nodes: number;
  num_edges: number;
  num_samples: number;
  num_trees: number;
  num_mutations?: number;  // Optional - only present for simulations with mutations
  num_sites?: number;      // Optional - only present for simulations with mutations
  num_recombination_nodes?: number;  // Optional - only present for ARG simulations
  sequence_length?: number;
  has_temporal: boolean;
  temporal_range?: {       // Optional - contains min/max time values when has_temporal is true
    min_time: number;
    max_time: number;
  };
  has_sample_spatial: boolean;
  has_all_spatial: boolean;
  spatial_status: string;
  is_simulated?: boolean;  // Optional - indicates if the tree sequence was generated through simulation
  statistics?: {
    nucleotide_diversity?: number | null;
    wattersons_theta?: number | null;
    tajimas_d?: number | null;
    segregating_sites?: number | null;
    mean_tree_height?: number | null;
    median_tree_height?: number | null;
    mean_tree_length?: number | null;
    median_tree_length?: number | null;
    tmrca?: number | null;
    mean_tmrca?: number | null;
    median_tmrca?: number | null;
    ne_watterson?: number | null;
    ne_pi?: number | null;
    estimated_recombination_rate?: number | null;
    mean_ld_r2?: number | null;
    median_ld_r2?: number | null;
    min_ld_r2?: number | null;
    max_ld_r2?: number | null;
    // Population structure statistics
    fst?: number | null;
    num_populations?: number | null;
    mean_divergence?: number | null;
    median_divergence?: number | null;
    min_divergence?: number | null;
    max_divergence?: number | null;
  };
}

interface TreeSequenceContextType {
  treeSequence: TreeSequenceData | null;
  setTreeSequence: (data: TreeSequenceData | null) => void;
  maxSamples: number;
  setMaxSamples: (value: number) => void;
  temporalRange: [number, number] | null;
  setTemporalRange: (range: [number, number] | null) => void;
  genomicRange: [number, number] | null;
  setGenomicRange: (range: [number, number] | null) => void;
  genomicMode: 'base_pairs' | 'tree_indices';
  setGenomicMode: (mode: 'base_pairs' | 'tree_indices') => void;
}

const TreeSequenceContext = createContext<TreeSequenceContextType | undefined>(undefined);

export function TreeSequenceProvider({ children }: { children: ReactNode }) {
  const [treeSequence, setTreeSequence] = useState<TreeSequenceData | null>(null);
  const [maxSamples, setMaxSamples] = useState<number>(SAMPLE_LIMITS.DEFAULT_MAX_SAMPLES);
  const [temporalRange, setTemporalRange] = useState<[number, number] | null>(null);
  const [genomicRange, setGenomicRange] = useState<[number, number] | null>(null);
  const [genomicMode, setGenomicMode] = useState<'base_pairs' | 'tree_indices'>('tree_indices');

  // Custom setTreeSequence that also updates maxSamples appropriately
  const setTreeSequenceWithSamples = (data: TreeSequenceData | null) => {
    setTreeSequence(data);
    if (data?.num_samples) {
      // Set maxSamples to min(DEFAULT_MAX_SAMPLES, actual_samples), ensuring we don't exceed available samples
      const newMaxSamples = Math.min(SAMPLE_LIMITS.DEFAULT_MAX_SAMPLES, data.num_samples);
      setMaxSamples(newMaxSamples);
    }
  };

  // Custom setMaxSamples that respects the current tree sequence sample limit
  const setMaxSamplesWithLimit = (value: number) => {
    if (treeSequence?.num_samples) {
      // Ensure value is between MIN_SAMPLES and the actual number of samples
      const clampedValue = Math.max(SAMPLE_LIMITS.MIN_SAMPLES, Math.min(value, treeSequence.num_samples));
      setMaxSamples(clampedValue);
    } else {
      // If no tree sequence loaded, just use min(value, DEFAULT_MAX_SAMPLES)
      setMaxSamples(Math.min(value, SAMPLE_LIMITS.DEFAULT_MAX_SAMPLES));
    }
  };

  return (
    <TreeSequenceContext.Provider 
      value={{ 
        treeSequence, 
        setTreeSequence: setTreeSequenceWithSamples, 
        maxSamples, 
        setMaxSamples: setMaxSamplesWithLimit,
        temporalRange,
        setTemporalRange,
        genomicRange,
        setGenomicRange,
        genomicMode,
        setGenomicMode
      }}
    >
      {children}
    </TreeSequenceContext.Provider>
  );
}

export function useTreeSequence() {
  const context = useContext(TreeSequenceContext);
  if (context === undefined) {
    throw new Error('useTreeSequence must be used within a TreeSequenceProvider');
  }
  return context;
} 