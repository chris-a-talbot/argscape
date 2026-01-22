import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeAnalytics } from './config/analytics'

// Initialize GA4 (only runs on Railway/production)
initializeAnalytics();

createRoot(document.getElementById('root')!).render(
  <App />
)
