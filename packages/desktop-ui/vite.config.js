import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron to load assets with relative paths
  server: {
    port: 5173,
    strictPort: true,
  }
})
