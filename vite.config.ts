import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig(({ mode }) => {
  // 開発モード: スタンドアロンWebアプリ（http://localhost:5173で動作）
  if (mode === 'development') {
    return {
      plugins: [react()],
      server: {
        port: 5173,
        open: true
      },
      optimizeDeps: {
        exclude: ['@electric-sql/pglite']
      },
      define: {
        'process.env.VITE_MODE': JSON.stringify('development')
      }
    }
  }

  // ビルドモード: Chrome拡張（完全独立、外部通信なし）
  return {
    plugins: [
      react(),
      crx({ 
        manifest: manifest as any,
        browser: 'chrome'
      })
    ],
    base: './',
    build: {
      rollupOptions: {
        input: {
          popup: 'src/popup/popup.html'
        },
        external: ['@electric-sql/pglite']
      },
      chunkSizeWarningLimit: 10000
    },
    optimizeDeps: {
      exclude: ['@electric-sql/pglite']
    },
    define: {
      'process.env.VITE_MODE': JSON.stringify('production')
    }
  }
})
