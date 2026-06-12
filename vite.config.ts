import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.ico'],
      manifest: {
        name: 'NovelEngine Editor',
        short_name: 'NovelEngine',
        description: '一款现代化的小说编辑器，结合富文本编辑与AI辅助写作',
        theme_color: '#89b4fa',
        background_color: '#1e1e2e',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        categories: ['productivity', 'utilities'],
        lang: 'zh-CN',
        dir: 'ltr',
        icons: [
          {
            src: './icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: './icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}'],
        globIgnores: ['**/monaco-*.js', '**/*.worker-*.js', '**/ts.worker-*.js'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.worker-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'monaco-workers',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['monaco-editor'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || (id.includes('/react/') && !id.includes('react-dom'))) return 'vendor-react'
            if (id.includes('@tiptap/') || id.includes('lowlight')) return 'vendor-tiptap'
            if (id.includes('monaco-editor') || id.includes('monaco-languageclient')) return 'vendor-monaco'
            if (id.includes('@langchain/')) return 'vendor-langchain'
            if (id.includes('zustand')) return 'vendor-zustand'
            if (id.includes('@tauri-apps/')) return 'vendor-tauri'
            return 'vendor-misc'
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 4173,
  },
})
