import { useUIStore } from '@/stores'
import { Slider, Toggle } from '@/components/common'

export function EdgesPanel() {
  const { edges, setEdges } = useUIStore()

  return (
    <div className="text-white space-y-4">
      <h3 className="text-sm font-semibold">Edges</h3>

      <div className="space-y-3">
        <Slider
          label="Width"
          value={edges.width}
          min={0.5}
          max={10}
          step={0.5}
          onChange={(v) => setEdges({ width: v })}
        />
        <Slider
          label="Opacity"
          value={edges.opacity * 100}
          min={0}
          max={100}
          onChange={(v) => setEdges({ opacity: v / 100 })}
        />
      </div>

      <div className="border-t border-white/10 pt-3 space-y-2">
        <Toggle
          label="Show Labels"
          checked={edges.showLabels}
          onChange={(v) => setEdges({ showLabels: v })}
        />
      </div>
    </div>
  )
}
