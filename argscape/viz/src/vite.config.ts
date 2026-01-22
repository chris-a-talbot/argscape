import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../standalone',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Build as IIFE so it can be embedded inline
        format: 'iife',
        name: 'ARGscapeViz',
        entryFileNames: 'standalone.js',
        chunkFileNames: 'standalone-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'standalone.css'
          }
          return 'assets/[name]-[hash][extname]'
        },
        manualChunks: undefined,
        // Inline dynamic imports since IIFE doesn't support code splitting
        inlineDynamicImports: true,
      },
    },
  },
})
