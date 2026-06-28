import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1919,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})