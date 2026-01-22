import { useEffect } from 'react'
import {
  Circle,
  GitBranch,
  Dna,
  LayoutGrid,
  BarChart3,
  Download,
  Map,
  Palette,
} from 'lucide-react'
import { useUIStore } from '@/stores'
import { PanelButton } from './PanelButton'
import { NodesPanel } from './panels/NodesPanel'
import { EdgesPanel } from './panels/EdgesPanel'
import { MutationsPanel } from './panels/MutationsPanel'
import { LayoutPanel } from './panels/LayoutPanel'
import { StatsPanel } from './panels/StatsPanel'
import { ExportPanel } from './panels/ExportPanel'
import { SpatialPanel } from './panels/SpatialPanel'
import { ThemePanel } from './panels/ThemePanel'

type PanelId = 'nodes' | 'edges' | 'mutations' | 'layout' | 'stats' | 'export' | 'spatial' | 'theme'

interface PanelConfig {
  id: PanelId
  icon: React.ReactNode
  label: string
  shortcut: string
  modes: ('force_graph' | 'spatial_3d')[]
}

const panels: PanelConfig[] = [
  { id: 'nodes', icon: <Circle size={20} />, label: 'Nodes', shortcut: 'N', modes: ['force_graph', 'spatial_3d'] },
  { id: 'edges', icon: <GitBranch size={20} />, label: 'Edges', shortcut: 'E', modes: ['force_graph', 'spatial_3d'] },
  { id: 'mutations', icon: <Dna size={20} />, label: 'Mutations', shortcut: 'M', modes: ['force_graph', 'spatial_3d'] },
  { id: 'layout', icon: <LayoutGrid size={20} />, label: 'Layout', shortcut: 'L', modes: ['force_graph'] },
  { id: 'spatial', icon: <Map size={20} />, label: 'Spatial', shortcut: 'S', modes: ['spatial_3d'] },
  { id: 'theme', icon: <Palette size={20} />, label: 'Theme', shortcut: 'T', modes: ['force_graph', 'spatial_3d'] },
  { id: 'stats', icon: <BarChart3 size={20} />, label: 'Stats', shortcut: 'I', modes: ['force_graph', 'spatial_3d'] },
  { id: 'export', icon: <Download size={20} />, label: 'Export', shortcut: 'X', modes: ['force_graph', 'spatial_3d'] },
]

const shortcutMap: Record<string, PanelId> = {
  'n': 'nodes',
  'e': 'edges',
  'm': 'mutations',
  'l': 'layout',
  's': 'spatial',
  't': 'theme',
  'i': 'stats',
  'x': 'export',
}

export function QuickActionsBar() {
  const { mode, activePanel, togglePanel } = useUIStore()

  // Filter panels based on current mode
  const visiblePanels = panels.filter(p => p.modes.includes(mode))

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      const key = e.key.toLowerCase()
      if (key in shortcutMap) {
        const panelId = shortcutMap[key]
        // Only trigger if panel is visible in current mode
        if (visiblePanels.some(p => p.id === panelId)) {
          e.preventDefault()
          togglePanel(panelId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePanel, visiblePanels])

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      {/* Bar */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 text-white">
        {visiblePanels.map(panel => (
          <PanelButton
            key={panel.id}
            icon={panel.icon}
            label={panel.label}
            shortcut={panel.shortcut}
            isActive={activePanel === panel.id}
            onClick={() => togglePanel(panel.id)}
          />
        ))}
      </div>

      {/* Active Panel */}
      {activePanel && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 max-h-96 overflow-auto rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 p-4">
          {activePanel === 'nodes' && <NodesPanel />}
          {activePanel === 'edges' && <EdgesPanel />}
          {activePanel === 'mutations' && <MutationsPanel />}
          {activePanel === 'layout' && <LayoutPanel />}
          {activePanel === 'spatial' && <SpatialPanel />}
          {activePanel === 'theme' && <ThemePanel />}
          {activePanel === 'stats' && <StatsPanel />}
          {activePanel === 'export' && <ExportPanel />}
        </div>
      )}
    </div>
  )
}
