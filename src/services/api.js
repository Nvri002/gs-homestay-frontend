import axios from 'axios'
import { TOKEN_KEY } from '@/utils/constants'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
  timeout: 30000,
})

// Mode demo: jaringan diganti backend tiruan di browser (src/mocks). Tidak ikut ter-bundle pada build biasa.
if (import.meta.env.VITE_USE_MOCK === 'true') {
  const { createMockAdapter } = await import('@/mocks/adapter.js')
  api.defaults.adapter = createMockAdapter()
}

// Menyisipkan Bearer Token. Untuk FormData, biarkan Axios mengisi Content-Type
// (multipart + boundary) secara otomatis; jangan set manual.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let handlers = { onUnauthorized: () => {}, onForbidden: () => {} }

// Dipanggil sekali dari main.js agar api.js tidak bergantung pada router/store (hindari circular import).
export function setupInterceptors(newHandlers) {
  handlers = { ...handlers, ...newHandlers }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const cfg = error.config || {}
    const silent = cfg.skipAuthRedirect === true
    // Kegagalan login (401/403/422) ditampilkan di form Login, bukan dialihkan.
    const isLogin = String(cfg.url || '').endsWith('/login')

    if (status === 401 && !silent && !isLogin) {
      handlers.onUnauthorized(error)
    } else if (status === 403 && !silent && !isLogin && !cfg.skipForbiddenRedirect) {
      handlers.onForbidden(error)
    }
    return Promise.reject(error)
  },
)

export default api
