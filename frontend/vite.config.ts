import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // This makes port 5173 act exactly like our Nginx port 80
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})