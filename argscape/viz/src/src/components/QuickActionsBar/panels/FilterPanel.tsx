import { useDataStore } from '@/stores'
import { RangeSlider, Select, Slider } from '@/components/common'

const filterModeOptions = [
  { value: 'subset', label: 'Subset (hide)' },
  { value: 'highlight', label: 'Highlight (dim)' },
]

export function FilterPanel() {
  const { rawData, filter, setFilter } = useDataStore()

  const metadata = rawData?.metadata
  const sequenceLength = metadata?.sequence_length || 100000
  const maxTime = rawData?.nodes
    ? Math.max(...rawData.nodes.map(n => n.time))
    : 1000

  return (
    <div className="text-white space-y-4">
      <h3 className="text-sm font-semibold">Filter</h3>

      <div className="space-y-3">
        <RangeSlider
          label="Genomic Range"
          min={0}
          max={sequenceLength}
          value={filter.genomicRange}
          onChange={(v) => setFilter({ genomicRange: v })}
          formatValue={(v) => {
            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}Mb`
            if (v >= 1000) return `${(v / 1000).toFixed(1)}kb`
            return `${v}bp`
          }}
        />

        <RangeSlider
          label="Temporal Range"
          min={0}
          max={maxTime}
          value={filter.temporalRange}
          onChange={(v) => setFilter({ temporalRange: v })}
          formatValue={(v) => v.toFixed(1)}
        />
      </div>

      <div className="border-t border-white/10 pt-3 space-y-3">
        <Select
          label="Filter Mode"
          value={filter.mode}
          options={filterModeOptions}
          onChange={(v) => setFilter({ mode: v as 'subset' | 'highlight' })}
        />

        {filter.mode === 'highlight' && (
          <Slider
            label="Dimmed Opacity"
            value={filter.dimmedOpacity * 100}
            min={0}
            max={100}
            onChange={(v) => setFilter({ dimmedOpacity: v / 100 })}
          />
        )}
      </div>
    </div>
  )
}
