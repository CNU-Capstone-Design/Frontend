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
      'unidealistic-synthia-cataclysmically.ngrok-free.dev'
    ]
  },
  // --- 여기까지 추가 ---
  assetsInclude: ['**/*.svg', '**/*.csv'],
})