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
    publicDir: 'public',
    build: {
      target: 'esnext',
      rollupOptions: {
        input: {
          popup: 'src/popup/popup.html'
        },
        external: (id) => {
          // Node.js専用モジュール(nodefs.js)のみ除外、PGlite本体はバンドルに含める
          return id.includes('/nodefs.js') || id.includes('node:')
        }
      },
      chunkSizeWarningLimit: 10000
    },
    define: {
      'process.env.VITE_MODE': JSON.stringify('production'),
      'process.env.NODE_ENV': JSON.stringify('production')
    }
  }
})
