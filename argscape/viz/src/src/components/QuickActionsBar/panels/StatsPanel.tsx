import { useState } from 'react'
import { useDataStore } from '@/stores'

// Format number for display
const formatValue = (value: number | null | undefined, decimals: number = 4): string => {
  if (value === null || value === undefined) return '—'
  if (Math.abs(value) < 0.0001 && value !== 0) {
    return value.toExponential(2)
  }
  return value.toFixed(decimals)
}

const formatInt = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  return Math.round(value).toLocaleString()
}

export function StatsPanel() {
  const { rawData, displayedNodes, displayedEdges } = useDataStore()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const metadata = rawData?.metadata
  const popgen = metadata?.popgen_stats

  return (
    <div className="text-white space-y-4 max-h-[500px] overflow-y-auto">
      <h3 className="text-sm font-semibold">Statistics</h3>

      {/* Current View */}
      <div className="space-y-1 text-xs">
        <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
          Current View
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">Displayed Nodes</span>
          <span className="font-mono">{displayedNodes.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">Displayed Edges</span>
          <span className="font-mono">{displayedEdges.length}</span>
        </div>
      </div>

      {metadata && (
        <>
          {/* Tree Sequence Stats */}
          <div className="border-t border-white/10 pt-3 space-y-1 text-xs">
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
              Tree Sequence
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Samples</span>
              <span className="font-mono">{metadata.num_samples}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Trees</span>
              <span className="font-mono">{metadata.num_trees}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Mutations</span>
              <span className="font-mono">{metadata.num_mutations}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Sequence Length</span>
              <span className="font-mono">{metadata.sequence_length.toLocaleString()} bp</span>
            </div>
          </div>

          {/* Population Genetics Stats */}
          {popgen && (
            <div className="border-t border-white/10 pt-3 space-y-1 text-xs">
              <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
                Population Genetics
              </div>

              {/* Core stats */}
              <div className="flex justify-between">
                <span className="opacity-70">
                  Nucleotide div. <span className="italic opacity-50">(π)</span>
                </span>
                <span className="font-mono">{formatValue(popgen.nucleotide_diversity, 6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Watterson's θ</span>
                <span className="font-mono">{formatValue(popgen.wattersons_theta, 6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Tajima's D</span>
                <span className="font-mono">{formatValue(popgen.tajimas_d, 4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Seg. sites</span>
                <span className="font-mono">{formatInt(popgen.segregating_sites)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">TMRCA</span>
                <span className="font-mono">{formatValue(popgen.tmrca, 2)}</span>
              </div>

              {/* Expandable advanced stats */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 mt-2"
              >
                <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  ▶
                </span>
                {showAdvanced ? 'Hide advanced' : 'Show advanced'}
              </button>

              {showAdvanced && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span className="opacity-70">Mean tree height</span>
                    <span className="font-mono">{formatValue(popgen.mean_tree_height, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Median tree height</span>
                    <span className="font-mono">{formatValue(popgen.median_tree_height, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Mean tree length</span>
                    <span className="font-mono">{formatValue(popgen.mean_tree_length, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Median tree length</span>
                    <span className="font-mono">{formatValue(popgen.median_tree_length, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Ne (Watterson)</span>
                    <span className="font-mono">{formatInt(popgen.ne_watterson)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Ne (Pi)</span>
                    <span className="font-mono">{formatInt(popgen.ne_pi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Recomb. rate</span>
                    <span className="font-mono">{formatValue(popgen.estimated_recombination_rate, 10)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {metadata.is_subset && (
            <div className="border-t border-white/10 pt-2 mt-2">
              <p className="text-[10px] opacity-50">
                Subset of {metadata.original_num_samples} samples
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
