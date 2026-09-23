import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Proxy API and media requests to Django so the browser sees one origin (no CORS).
// Host header is kept as-is, so Django builds media URLs pointing back at this server.
const backend = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
      '/media': backend,
    },
  },
})
