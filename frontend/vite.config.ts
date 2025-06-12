import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    base: '/',
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    define: {
        __API_URL__: JSON.stringify(process.env.VITE_API_URL || '/api')
    },
    build: {
        // Ensure assets are properly copied
        assetsInlineLimit: 0,
        copyPublicDir: true,
    },
    publicDir: 'public'
})