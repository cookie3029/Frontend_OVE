import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 👈 'react-plugin'을 'plugin-react'로 수정!
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})