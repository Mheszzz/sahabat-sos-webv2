import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = (env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      host: true, // Membuka akses jaringan Wi-Fi (0.0.0.0)
      port: 5173,
      proxy: {
        '/storage': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/storage-file': {
          target: `${backendUrl}/api`,
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
    },
  }
})
