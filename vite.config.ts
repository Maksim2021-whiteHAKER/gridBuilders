import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({mode}) => {

  const isAnalyze = mode === 'analyze';  

  return {
    plugins: [
      react(),
      isAnalyze ? visualizer({ template: 'treemap', open: true, gzipSize: true, brotliSize: true, filename: 'bundle-report.html' }) : null
    ],
  }
})
