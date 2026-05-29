import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/status',
  plugins: [react()],
  server: {
    port: 5174,
    // ADDED: The same proxy tunnel structure to forward commands securely
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        headers: {
          'x-dashboard-token': 'CS@RIT-70'
        }
      }
    }
  }
})
