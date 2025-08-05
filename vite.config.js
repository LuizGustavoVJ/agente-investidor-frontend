import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // Configuração de alias para imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@api': resolve(__dirname, 'src/api'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  
  // Configuração do servidor de desenvolvimento
  server: {
    port: 3000,
    host: true, // Permite acesso externo
    cors: true,
    
    // Proxy para APIs do backend
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/auth/, '/api/auth')
      },
      '/api/data': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/data/, '/api/data')
      },
      '/api/methodology': {
        target: 'http://localhost:8003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/methodology/, '/api/methodology')
      },
      '/api/analysis': {
        target: 'http://localhost:8004',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/analysis/, '/api/analysis')
      },
      '/api/portfolio': {
        target: 'http://localhost:8002', // Portfolio pode estar no data-service
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/portfolio/, '/api/portfolio')
      },
      '/api/brokers': {
        target: 'http://localhost:8002', // Brokers pode estar no data-service
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/brokers/, '/api/brokers')
      },
      // Proxy para WebSocket (se necessário)
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  
  // Configuração de build
  build: {
    outDir: 'dist',
    sourcemap: true,
    
    // Otimizações de build
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para melhor cache
          vendor: ['vue', 'vue-router', 'pinia'],
          charts: ['chart.js'],
          utils: ['axios', 'lodash-es', 'date-fns']
        }
      }
    },
    
    // Configurações de chunk size
    chunkSizeWarningLimit: 1000
  },
  
  // Configuração de CSS
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Configuração de variáveis de ambiente
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Configuração de otimização de dependências
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'chart.js',
      'date-fns',
      'lodash-es'
    ]
  }
})

