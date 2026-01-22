import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Read embedded data from window (set by Python renderer)
declare global {
  interface Window {
    ARGSCAPE_DATA: unknown
    ARGSCAPE_OPTIONS: unknown
    ARGSCAPE_SIMULATION_SETTLED?: boolean
    argscapeSignalReady?: () => void
  }
}

const data = window.ARGSCAPE_DATA || { nodes: [], edges: [], metadata: {} }
const options = window.ARGSCAPE_OPTIONS || { mode: 'force_graph', theme: {} }

// Function to signal that visualization is ready for export
// Called by ForceGraph when simulation settles
window.argscapeSignalReady = () => {
  if (!document.getElementById('argscape-ready')) {
    const ready = document.createElement('div')
    ready.id = 'argscape-ready'
    ready.style.display = 'none'
    document.body.appendChild(ready)
  }
  window.ARGSCAPE_SIMULATION_SETTLED = true
}

ReactDOM.createRoot(document.getElementById('argscape-root')!).render(
  <React.StrictMode>
    <App data={data} options={options} />
  </React.StrictMode>,
)
