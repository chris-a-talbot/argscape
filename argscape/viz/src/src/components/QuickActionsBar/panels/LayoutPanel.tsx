import { useUIStore } from '@/stores'
import { Slider, Select } from '@/components/common'
import type { SampleOrderType, TemporalSpacingMode } from '@/types'

const sampleOrderOptions = [
  { value: 'numeric', label: 'Numeric' },
  { value: 'first_minlex', label: 'First Tree' },
  { value: 'center_minlex', label: 'Center Tree' },
  { value: 'consensus_minlex', label: 'Consensus' },
  { value: 'dagre', label: 'Dagre' },
]

const temporalSpacingOptions = [
  { value: 'equal', label: 'Equal' },
  { value: 'linear', label: 'Linear' },
  { value: 'log', label: 'Logarithmic' },
]

export function LayoutPanel() {
  const { layout, setLayout } = useUIStore()

  return (
    <div className="text-white space-y-4">
      <h3 className="text-sm font-semibold">Layout</h3>

      <div className="space-y-3">
        <Select
          label="Sample Order"
          value={layout.sampleOrder}
          options={sampleOrderOptions}
          onChange={(v) => setLayout({ sampleOrder: v as SampleOrderType })}
        />
        <Select
          label="Temporal Spacing"
          value={layout.temporalSpacing}
          options={temporalSpacingOptions}
          onChange={(v) => setLayout({ temporalSpacing: v as TemporalSpacingMode })}
        />
      </div>

      <div className="border-t border-white/10 pt-3 space-y-3">
        <Slider
          label="Vertical Spacing"
          value={layout.verticalSpacing}
          min={5}
          max={100}
          step={5}
          onChange={(v) => setLayout({ verticalSpacing: v })}
          displayValue={`${layout.verticalSpacing}%`}
          minLabel="Min"
          maxLabel="Max"
        />
        <Slider
          label="Horizontal Spacing"
          value={layout.horizontalSpacing}
          min={5}
          max={100}
          step={5}
          onChange={(v) => setLayout({ horizontalSpacing: v })}
          displayValue={`${layout.horizontalSpacing}%`}
          minLabel="Min"
          maxLabel="Max"
        />
      </div>
    </div>
  )
}
