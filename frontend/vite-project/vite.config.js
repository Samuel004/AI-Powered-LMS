import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Provide global for libraries that expect `global` (common in Node shims)
    global: 'globalThis'
  },
  optimizeDeps: {
    include: ['simple-peer', 'events', 'util', 'buffer']
  },
  resolve: {
    alias: {
      // ensure Node modules resolve to browser-friendly packages
      events: 'events',
      util: 'util',
      buffer: 'buffer'
    }
  }
})
