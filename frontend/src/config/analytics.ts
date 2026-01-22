/**
 * Google Analytics 4 configuration
 * Only loads on Railway (production) to avoid polluting analytics with local dev data
 */

import { isRailway } from './constants';

const GA_MEASUREMENT_ID = 'G-PY9L7GTYE1';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Initialize Google Analytics 4
 * Should be called once at app startup
 */
export function initializeAnalytics(): void {
  if (!isRailway()) {
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
}
