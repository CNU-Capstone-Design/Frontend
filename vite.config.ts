import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // --- 여기서부터 추가 ---
  server: {
    allowedHosts: [
      '2d39-2406-da12-16a-fe00-6700-87d-cba6-7968.ngrok-free.app'
    ]
  },
  // --- 여기까지 추가 ---
  assetsInclude: ['**/*.svg', '**/*.csv'],
})