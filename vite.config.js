import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 👈 'react-plugin'을 'plugin-react'로 수정!
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://168.107.42.66:5000',
        changeOrigin: true,
      }
    }
  }
})