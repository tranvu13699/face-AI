import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import wasm from '@rollup/plugin-wasm'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.wasm'],
  },
  build: {
    rollupOptions: {
      plugins: [
        wasm(),
      ],
    },
    assetsInlineLimit: 0, // Đảm bảo rằng Vite không nhúng các tệp lớn (như WASM) vào bundle
  },
  server: {
    // Đảm bảo rằng Vite phục vụ tệp WASM với kiểu MIME chính xác
    mimeTypes: {
      '.wasm': 'application/wasm',
    },
  },
})
