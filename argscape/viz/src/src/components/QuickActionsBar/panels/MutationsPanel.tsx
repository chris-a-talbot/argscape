import { useUIStore } from '@/stores'
import { Slider, Toggle } from '@/components/common'

export function MutationsPanel() {
  const { mutations, setMutations } = useUIStore()

  return (
    <div className="text-white space-y-4">
      <h3 className="text-sm font-semibold">Mutations</h3>

      <Toggle
        label="Show Mutations"
        checked={mutations.show}
        onChange={(v) => setMutations({ show: v })}
      />

      {mutations.show && (
        <div className="space-y-3">
          <Slider
            label="Marker Size"
            value={mutations.size}
            min={2}
            max={20}
            onChange={(v) => setMutations({ size: v })}
          />
        </div>
      )}
    </div>
  )
}
