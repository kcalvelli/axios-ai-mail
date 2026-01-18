import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'icon-192.png', 'icon-512.png', 'icon-monochrome.svg'],
      manifest: {
        name: 'Axios AI Mail',
        short_name: 'Mail',
        description: 'AI-powered email client with intelligent classification',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          // Standard icons
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          // Maskable icons for adaptive icon shapes
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          // Monochrome icons for Material You theming on Android 13+
          {
            src: 'icon-monochrome.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'monochrome',
          },
        ],
      },
      workbox: {
        // Don't use cached fallback for API/WebSocket routes
        navigateFallbackDenylist: [/^\/api/, /^\/ws/],
        // Cache static assets only
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Explicitly skip caching for API routes
        // Using navigateFallback: undefined ensures no fallback for non-navigation requests
        runtimeCaching: [
          {
            // Match any request that contains /api/ in the URL
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
          {
            // Match WebSocket upgrade requests
            urlPattern: ({ url }) => url.pathname.startsWith('/ws'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
})
