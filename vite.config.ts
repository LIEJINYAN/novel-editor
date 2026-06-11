import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
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
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) return 'vendor-react'
            if (id.includes('/react/') || id.includes('/react\\')) return 'vendor-react'
            if (id.includes('@tiptap/') || id.includes('lowlight')) return 'vendor-tiptap'
            if (id.includes('monaco-editor')) return 'vendor-monaco'
            if (id.includes('@langchain/')) return 'vendor-langchain'
            if (id.includes('zustand')) return 'vendor-zustand'
            if (id.includes('@tauri-apps/')) return 'vendor-tauri'
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
