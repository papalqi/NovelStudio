import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const workspaceRoot = path.resolve(__dirname, '../..')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    fs: {
      allow: [workspaceRoot]
    }
  },
  resolve: {
    alias: {
      'lucide-react': path.join(workspaceRoot, 'node_modules/lucide-react')
    },
    dedupe: ['react', 'react-dom']
  }
})
