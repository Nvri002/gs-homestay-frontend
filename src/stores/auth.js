import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService } from '@/services/authService'
import { TOKEN_KEY, USER_KEY, ROLE_HOME, normalizeRole } from '@/utils/constants'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY))
  const user = ref(readStoredUser())
  const hydrated = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => normalizeRole(user.value?.role))
  const homeRoute = computed(() => ROLE_HOME[role.value] || { name: 'beranda' })

  function persistUser(value) {
    user.value = value
    if (value) localStorage.setItem(USER_KEY, JSON.stringify(value))
    else localStorage.removeItem(USER_KEY)
  }

  function setSession(newToken, newUser) {
    token.value = newToken
    localStorage.setItem(TOKEN_KEY, newToken)
    persistUser(newUser)
  }

  function clearSession() {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
    persistUser(null)
  }

  // Satu-satunya titik yang membaca bentuk response login (sesuaikan di sini bila berbeda).
  function extractAuth(res) {
    const d = res.data?.data ?? {}
    return { token: d.token ?? d.access_token ?? null, user: d.user ?? null }
  }

  async function register(payload) {
    return authService.register(payload)
  }

  async function login(credentials) {
    const res = await authService.login(credentials)
    const { token: newToken, user: newUser } = extractAuth(res)
    if (!newToken) throw new Error('Token tidak ditemukan pada response login.')
    setSession(newToken, newUser)
    if (!role.value) await fetchProfile()
    return user.value
  }

  async function fetchProfile(config = {}) {
    const res = await authService.profile(config)
    const data = res.data?.data
    persistUser(data?.user ?? data ?? null)
    return user.value
  }

  // Dipanggil sekali pada navigasi pertama: validasi token yang tersimpan.
  async function hydrate() {
    if (hydrated.value) return
    hydrated.value = true
    if (!token.value) return
    try {
      await fetchProfile({ skipAuthRedirect: true })
    } catch (e) {
      if (e?.response?.status === 401) clearSession()
    }
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // Sesi lokal tetap dihapus walau request gagal.
    }
    clearSession()
  }

  return { token, user, hydrated, isAuthenticated, role, homeRoute, register, login, fetchProfile, hydrate, logout, clearSession }
})
