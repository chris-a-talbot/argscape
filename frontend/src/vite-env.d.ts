/// <reference types="vite/client" />

// Tauri global type definition
declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}
