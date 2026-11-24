import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/inter'
import './assets/main.css'
import App from './App.vue'
import router from './router'
import { setupInterceptors } from './services/api'
import { useAuthStore } from './stores/auth'
import { useBookingDraftStore } from './stores/bookingDraft'
import { useUiStore } from './stores/ui'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const auth = useAuthStore(pinia)
const ui = useUiStore(pinia)
ui.initTheme()

setupInterceptors({
  // 401: hapus sesi, arahkan ke Login (membawa halaman asal sebagai ?redirect).
  onUnauthorized() {
    const wasLoggedIn = auth.isAuthenticated
    auth.clearSession()
    useBookingDraftStore(pinia).clear()
    if (router.currentRoute.value.name !== 'login') {
      if (wasLoggedIn) ui.notify('Sesi Anda berakhir. Silakan masuk kembali.', 'warning')
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    }
  },
  // 403: halaman Akses Ditolak.
  onForbidden() {
    if (router.currentRoute.value.name !== 'akses-ditolak') router.push({ name: 'akses-ditolak' })
  },
})

app.use(router)
app.mount('#app')
