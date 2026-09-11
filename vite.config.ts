import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      react(),
      isAnalyze ? visualizer({ 
        template: 'treemap', 
        open: true, 
        gzipSize: true, 
        brotliSize: true, 
        filename: 'bundle-report.html' 
      }) : null
    ].filter(Boolean),
    
    build: {
      target: 'esnext',
      minify: 'esbuild',
      chunkSizeWarningLimit: 1500, // Немного увеличим лимит, так как 3D тяжелый по природе
      rollupOptions: { // Исправлено: было rollUpOptions
        output: {
          manualChunks(id) {
            // Явная функция надежнее работает с новым типом ManualChunksFunction
            
            // React
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
              return 'react-vendor';
            }
            
            // Three.js ядро
            if (id.includes('/node_modules/three/')) {
              // Исключаем примеры и аддоны из основного чанка three, если они не попали в другие
              if (id.includes('/examples/jsm/')) {
                 // Draco и Basis часто лучше грузить отдельно или вместе с drei, 
                 // но если очень хочется отделить:
                 if (id.includes('draco')) return 'three-draco';
                 if (id.includes('basis')) return 'three-basis';
                 return 'three-examples';
              }
              return 'three-core';
            }

            // R3F
            if (id.includes('/node_modules/@react-three/fiber/')) {
              return 'r3f-fiber';
            }
            
            // Drei
            if (id.includes('@react-three/drei')) {
              // Разделяем на используемые компоненты
              if (id.includes('TransformControls')) return 'drei-transform';
              if (id.includes('OrbitControls')) return 'drei-controls';
              if (id.includes('Text')) return 'drei-text';
              if (id.includes('Outlines')) return 'drei-outlines';
              if (id.includes('Grid')) return 'drei-grid';
              return 'drei-core'; // Остальное
            }

            // Appwrite
            if (id.includes('/node_modules/appwrite/')) {
              return 'appwrite-vendor';
            }
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    
    optimizeDeps: {
      include: [
        'three', 
        '@react-three/fiber', 
        '@react-three/drei', 
        'appwrite'
      ],
      // exclude здесь не нужен для draco/basis, так как они грузятся через import() внутри библиотек
    }
  }
})