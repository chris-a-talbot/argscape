import { ArrowLeft } from 'lucide-react'
import { useDataStore } from '@/stores'

export function ViewModeHeader() {
  const { viewMode, selectedNodeId, rawData, resetView } = useDataStore()

  if (viewMode === 'full') return null

  const modeLabel = viewMode === 'subarg' ? 'SubARG' : 'Ancestors'

  // Look up the original node ID (before subsetting) for display
  const selectedNode = rawData?.nodes.find(n => n.id === selectedNodeId)
  const displayNodeId = selectedNode?.original_id ?? selectedNodeId

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full">
        <span className="text-white text-sm">
          {modeLabel} of Node {displayNodeId}
        </span>
        <button
          onClick={resetView}
          className="flex items-center gap-1 px-2 py-1 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft size={12} />
          Return to Full
        </button>
      </div>
    </div>
  )
}
