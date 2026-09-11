import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({mode}) => {

  const isAnalyze = mode === 'analyze';  

  return {
    plugins: [
      react(),
      isAnalyze ? visualizer({ template: 'treemap', open: true, gzipSize: true, brotliSize: true, filename: 'bundle-report.html' 
      }) : null
    ].filter(Boolean),
    build: {
      chunkSizeWarningLimit: 1000, 
      rollUpOptions: {
        output: {
          manualChunks: {
            'render-vendor': ['react', 'react-dom'],
            'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
            'appwrite-vendor': ['appwrite']
          }
        }
      }
    }
  }
})
