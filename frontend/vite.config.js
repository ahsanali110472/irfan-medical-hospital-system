import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  base: './',
  build: { 
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://127.0.0.1:5000/api')
  }
})





