import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Base path for deployment
  base: '/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'next'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  
  // Preview server configuration
  preview: {
    allowedHosts: true,
    port: 4173,
    host: true,
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  
  // Environment variables prefix
  envPrefix: 'VITE_',
  
  // Assets optimization
  assetsInlineLimit: 4096,
})
