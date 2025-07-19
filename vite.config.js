import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
  rollupOptions: {
    input: {
      background: resolve(__dirname, 'src/background.js'),
      sidepanel: resolve(__dirname, 'sidepanel.html'),
    },
    output: {
      entryFileNames: '[name].js', // No hash in filename
    }
  },
  outDir: 'dist',
  emptyOutDir: true,
}
})
