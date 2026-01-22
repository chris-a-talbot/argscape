import { useCallback, useState } from 'react'
import { Image, FileCode, Loader2, SquareStack } from 'lucide-react'
import { useUIStore } from '@/stores'
import { triggerDeckGLExport } from '@/components/Visualizations/Spatial3D/Spatial3D'
import type { Theme } from '@/types'

/**
 * Draw a legend to a canvas and return as data URL
 */
function renderLegendToCanvas(theme: Theme, showMutations: boolean): string {
  const scale = 2  // Retina scaling
  const padding = 16
  const rowHeight = 24
  const circleRadius = { sample: 6, internal: 4, root: 5, mutation: 4 }

  const items = [
    { label: 'Sample', color: theme.nodes.sample, radius: circleRadius.sample },
    { label: 'Internal', color: theme.nodes.internal, radius: circleRadius.internal },
    { label: 'Root', color: theme.nodes.root, radius: circleRadius.root },
  ]
  if (showMutations) {
    items.push({ label: 'Mutation', color: theme.mutation, radius: circleRadius.mutation })
  }

  const width = 120
  const height = padding * 2 + items.length * rowHeight

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.scale(scale, scale)

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.roundRect(0, 0, width, height, 8)
  ctx.fill()

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.roundRect(0, 0, width, height, 8)
  ctx.stroke()

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.fillText('Legend', padding, padding + 4)

  // Items
  ctx.font = '11px system-ui, sans-serif'
  items.forEach((item, i) => {
    const y = padding + 20 + i * rowHeight

    // Circle
    ctx.beginPath()
    ctx.fillStyle = item.color
    ctx.arc(padding + item.radius, y, item.radius, 0, Math.PI * 2)
    ctx.fill()

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillText(item.label, padding + 20, y + 4)
  })

  return canvas.toDataURL('image/png')
}

/**
 * Composite legend onto an existing image
 */
function compositeWithLegend(imageDataUrl: string, legendDataUrl: string, _position: 'bottom-right' = 'bottom-right'): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const legendImg = new window.Image()
      legendImg.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(imageDataUrl)
          return
        }

        // Draw main image
        ctx.drawImage(img, 0, 0)

        // Draw legend in bottom-right with padding
        const padding = 16 * 2  // Account for retina scaling
        const x = img.width - legendImg.width - padding
        const y = img.height - legendImg.height - padding
        ctx.drawImage(legendImg, x, y)

        resolve(canvas.toDataURL('image/png'))
      }
      legendImg.src = legendDataUrl
    }
    img.src = imageDataUrl
  })
}

export function ExportPanel() {
  const mode = useUIStore((state) => state.mode)
  const theme = useUIStore((state) => state.theme)
  const mutations = useUIStore((state) => state.mutations)
  const is3D = mode === 'spatial_3d'
  const [isExporting, setIsExporting] = useState(false)
  const [includeLegend, setIncludeLegend] = useState(false)

  // Export legend as separate image
  const exportLegend = useCallback(() => {
    if (!theme) return
    const dataUrl = renderLegendToCanvas(theme, mutations.show)
    const link = document.createElement('a')
    link.download = 'argscape-legend.png'
    link.href = dataUrl
    link.click()
  }, [theme, mutations.show])

  // Export PNG for 2D (SVG-based)
  const export2DPNG = useCallback(async () => {
    const svg = document.querySelector('#visualization-container svg') as SVGSVGElement
    if (!svg || !theme) return

    // Get the actual rendered dimensions
    const rect = svg.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Clone the SVG to avoid modifying the original
    const svgClone = svg.cloneNode(true) as SVGSVGElement

    // Set explicit pixel dimensions (required for image conversion)
    svgClone.setAttribute('width', String(width))
    svgClone.setAttribute('height', String(height))

    // Add viewBox if not present
    if (!svgClone.getAttribute('viewBox')) {
      svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`)
    }

    // Ensure background color is included
    svgClone.style.background = theme.background

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const svgData = new XMLSerializer().serializeToString(svgClone)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new window.Image()
    img.onload = async () => {
      // Use 2x resolution for retina displays
      canvas.width = width * 2
      canvas.height = height * 2
      ctx.scale(2, 2)

      // Fill background first (in case SVG background doesn't render)
      ctx.fillStyle = theme.background
      ctx.fillRect(0, 0, width, height)

      // Draw the SVG
      ctx.drawImage(img, 0, 0, width, height)

      let pngUrl = canvas.toDataURL('image/png')

      // Add legend if requested
      if (includeLegend) {
        const legendDataUrl = renderLegendToCanvas(theme, mutations.show)
        pngUrl = await compositeWithLegend(pngUrl, legendDataUrl, 'bottom-right')
      }

      const link = document.createElement('a')
      link.download = 'argscape-visualization.png'
      link.href = pngUrl
      link.click()

      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [theme, mutations.show, includeLegend])

  // Export PNG for 3D (WebGL canvas via deck.gl)
  const export3DPNG = useCallback(async () => {
    if (!theme) return
    setIsExporting(true)
    try {
      let dataUrl = await triggerDeckGLExport()

      // Add legend if requested
      if (includeLegend) {
        const legendDataUrl = renderLegendToCanvas(theme, mutations.show)
        dataUrl = await compositeWithLegend(dataUrl, legendDataUrl, 'bottom-right')
      }

      const link = document.createElement('a')
      link.download = 'argscape-visualization.png'
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Export failed:', e)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [theme, mutations.show, includeLegend])

  // Export SVG for 2D
  const export2DSVG = useCallback(() => {
    const svg = document.querySelector('#visualization-container svg') as SVGSVGElement
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = 'argscape-visualization.svg'
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }, [])

  const exportPNG = is3D ? export3DPNG : export2DPNG
  const exportSVG = export2DSVG

  return (
    <div className="text-white space-y-4">
      <h3 className="text-sm font-semibold">Export</h3>

      <div className="space-y-2">
        {/* Include legend checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeLegend}
            onChange={(e) => setIncludeLegend(e.target.checked)}
            className="w-4 h-4 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/70">Include legend</span>
        </label>

        <button
          onClick={exportPNG}
          disabled={isExporting}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
          <span className="text-sm">{isExporting ? 'Exporting...' : 'Download PNG'}</span>
        </button>

        {!is3D && (
          <button
            onClick={exportSVG}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <FileCode size={16} />
            <span className="text-sm">Download SVG</span>
          </button>
        )}

        {is3D && (
          <p className="text-xs text-white/50">
            SVG export is not available for 3D visualizations.
          </p>
        )}

        {/* Separate legend download */}
        <button
          onClick={exportLegend}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
        >
          <SquareStack size={16} />
          <span className="text-sm">Download Legend Only</span>
        </button>
      </div>
    </div>
  )
}
