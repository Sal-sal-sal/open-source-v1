import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_BASE_URL = env.VITE_API_BASE_URL || 'http://localhost:8000';

  return {
    plugins: [react()],
    base: '/',
    server: {
      host: '0.0.0.0', // Доступ извне
      port: 5173,
      proxy: {
        '/api': {
          target: API_BASE_URL,
          changeOrigin: true,
        },
        '/upload': {
          target: API_BASE_URL,
          changeOrigin: true,
        },
        '/librivox-api': {
          target: 'https://librivox.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/librivox-api/, '/api'),
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        }
      }
    }
  }
})
