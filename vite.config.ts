import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
            if (id.includes('epubjs') || id.includes('jszip') || id.includes('localforage') || id.includes('xmldom') || id.includes('lodash') || id.includes('marks-pane') || id.includes('path-webpack') || id.includes('event-emitter') || id.includes('es5-ext') || id.includes('d/')) return 'vendor-epub'
            return 'vendor-other'
          }
        },
      },
    },
  },
})
