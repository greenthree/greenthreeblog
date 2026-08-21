import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/greenthreeblog/' : '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('katex')) {
              return 'vendor-katex'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (/(?:^|[\\/])node_modules[\\/](?:react|react-dom|scheduler)(?:[\\/]|$)/.test(id)) {
              return 'vendor-react'
            }
            if (id.includes('yaml')) {
              return 'vendor-yaml'
            }
          }
        }
      }
    }
  }
})
