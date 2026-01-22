import { useUIStore } from '@/stores'
import { Slider } from '@/components/common'

export function SpatialPanel() {
  const { spatial, setSpatial } = useUIStore()

  return (
    <div className="text-white space-y-4">
      <h3 className="text-sm font-semibold">Spatial Settings</h3>

      <div className="space-y-3">
        <Slider
          label="Temporal Multiplier"
          value={spatial.temporalMultiplier}
          min={1}
          max={50}
          step={1}
          onChange={(v) => setSpatial({ temporalMultiplier: v })}
        />

        <Slider
          label="Spatial Multiplier"
          value={spatial.spatialMultiplier}
          min={10}
          max={500}
          step={10}
          onChange={(v) => setSpatial({ spatialMultiplier: v })}
        />

        <Slider
          label="Shape Opacity"
          value={Math.round(spatial.shapeOpacity * 100)}
          min={0}
          max={100}
          step={5}
          onChange={(v) => setSpatial({ shapeOpacity: v / 100 })}
          displayValue={`${Math.round(spatial.shapeOpacity * 100)}%`}
        />

        <Slider
          label="Temporal Grid Opacity"
          value={Math.round(spatial.gridOpacity * 100)}
          min={0}
          max={100}
          step={5}
          onChange={(v) => setSpatial({ gridOpacity: v / 100 })}
          displayValue={`${Math.round(spatial.gridOpacity * 100)}%`}
        />
      </div>
    </div>
  )
}
