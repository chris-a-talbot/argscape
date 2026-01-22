import { useUIStore } from '@/stores'
import { Select } from '@/components/common'
import { THEME_OPTIONS, getTheme } from '@/config/themes'

export function ThemePanel() {
  const { theme, setTheme } = useUIStore()

  const handleThemeChange = (themeName: string) => {
    const newTheme = getTheme(themeName)
    setTheme(newTheme)
  }

  return (
    <div className="text-white space-y-4">
      <h3 className="text-sm font-semibold">Theme</h3>

      <div className="space-y-3">
        <Select
          label="Color Theme"
          value={theme?.name || 'tskit'}
          options={THEME_OPTIONS}
          onChange={handleThemeChange}
        />
      </div>

      {/* Preview swatches */}
      {theme && (
        <div className="border-t border-white/10 pt-3">
          <div className="text-xs text-white/60 mb-2">Preview</div>
          <div className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full border border-white/20"
              style={{ background: theme.nodes.sample }}
              title="Sample"
            />
            <div
              className="w-6 h-6 rounded-full border border-white/20"
              style={{ background: theme.nodes.internal }}
              title="Internal"
            />
            <div
              className="w-6 h-6 rounded-full border border-white/20"
              style={{ background: theme.nodes.root }}
              title="Root"
            />
            <div
              className="w-6 h-6 rounded-full border border-white/20"
              style={{ background: theme.mutation }}
              title="Mutation"
            />
            <div
              className="w-6 h-6 rounded border border-white/20"
              style={{ background: theme.background }}
              title="Background"
            />
          </div>
        </div>
      )}
    </div>
  )
}
