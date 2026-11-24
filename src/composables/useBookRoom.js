import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROLES } from '@/utils/constants'
import { toSearchQuery } from '@/utils/search'

// Tombol "Pesan": belum login -> guard mengarahkan ke Login lalu kembali ke halaman pemesanan.
export function useBookRoom() {
  const router = useRouter()
  const auth = useAuthStore()
  const ui = useUiStore()

  return function bookRoom(room, search) {
    if (auth.isAuthenticated && auth.role !== ROLES.TAMU) {
      ui.notify('Hanya akun Tamu yang dapat memesan kamar.', 'warning')
      return
    }
    router.push({ name: 'tamu-pesan', params: { kamarId: room.id }, query: toSearchQuery(search) })
  }
}
