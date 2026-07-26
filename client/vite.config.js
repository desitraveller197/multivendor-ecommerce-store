import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/stripe': {
        target: 'http://localhost:4242',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stripe/, ''),
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
