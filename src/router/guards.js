import { useAuthStore } from '@/stores/auth'

export function installGuards(router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    if (!auth.hydrated) await auth.hydrate()

    // Pengguna yang sudah login tidak perlu melihat Login/Registrasi.
    if (to.meta.guestOnly && auth.isAuthenticated) return auth.homeRoute

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // Role-Based Route Guard
    if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
      return { name: 'akses-ditolak' }
    }
    return true
  })

  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · GS Homestay` : 'GS Homestay Pekanbaru'
  })
}
