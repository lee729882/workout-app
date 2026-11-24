import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'images/login-couple.webp'],
      manifest: {
        name: '오운완 다이어리',
        short_name: '오운완',
        description: '운동하면 포인트, 포인트로 랜덤박스',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        background_color: '#FBF6EC',
        theme_color: '#FBF6EC',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webp,png}'],
        globIgnores: ['push-sw.js'],
        importScripts: ['push-sw.js'],
      },
    }),
  ],
})
