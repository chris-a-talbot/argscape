import { useUIStore } from '@/stores'
import { Slider, Toggle } from '@/components/common'

export function NodesPanel() {
  const { nodes, setNodes } = useUIStore()

  return (
    <div className="text-white space-y-4">
      <h3 className="text-sm font-semibold">Nodes</h3>

      <div className="space-y-3">
        <Slider
          label="Sample Size"
          value={nodes.sampleSize}
          min={2}
          max={30}
          onChange={(v) => setNodes({ sampleSize: v })}
        />
        <Slider
          label="Internal Size"
          value={nodes.internalSize}
          min={1}
          max={20}
          onChange={(v) => setNodes({ internalSize: v })}
        />
        <Slider
          label="Root Size"
          value={nodes.rootSize}
          min={2}
          max={25}
          onChange={(v) => setNodes({ rootSize: v })}
        />
      </div>

      <div className="border-t border-white/10 pt-3 space-y-2">
        <Toggle
          label="Show Sample IDs"
          checked={nodes.showSampleIds}
          onChange={(v) => setNodes({ showSampleIds: v })}
        />
        <Toggle
          label="Show Internal IDs"
          checked={nodes.showInternalIds}
          onChange={(v) => setNodes({ showInternalIds: v })}
        />
        <Toggle
          label="Show Root IDs"
          checked={nodes.showRootIds}
          onChange={(v) => setNodes({ showRootIds: v })}
        />
        <Toggle
          label="Color by Population"
          checked={nodes.colorByPopulation}
          onChange={(v) => setNodes({ colorByPopulation: v })}
        />
      </div>
    </div>
  )
}
