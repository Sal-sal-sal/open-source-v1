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
      proxy: {
        '/api': {
          target: API_BASE_URL,
          changeOrigin: true,
        },
      }
    }
  }
})
