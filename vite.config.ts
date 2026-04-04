import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite configuration for MindSense AI
 * - React Fast Refresh enabled
 * - Development server configured for localhost access
 * - Strict port enforcement to avoid conflicts
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['mindsense', 'localhost', '127.0.0.1'],
    strictPort: true,
  },
})
