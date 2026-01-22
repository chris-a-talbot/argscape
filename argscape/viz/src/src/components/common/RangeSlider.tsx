interface RangeSliderProps {
  label: string
  min: number
  max: number
  value: [number, number] | null
  onChange: (value: [number, number]) => void
  formatValue?: (v: number) => string
}

export function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  formatValue = (v) => v.toString(),
}: RangeSliderProps) {
  const currentValue = value || [min, max]

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="opacity-70">{label}</span>
        <span>{formatValue(currentValue[0])} - {formatValue(currentValue[1])}</span>
      </div>
      <div className="flex gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={currentValue[0]}
          onChange={(e) => onChange([Number(e.target.value), currentValue[1]])}
          className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={currentValue[1]}
          onChange={(e) => onChange([currentValue[0], Number(e.target.value)])}
          className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white"
        />
      </div>
    </div>
  )
}
