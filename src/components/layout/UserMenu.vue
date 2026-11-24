<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBookingDraftStore } from '@/stores/bookingDraft'
import { useUiStore } from '@/stores/ui'
import { ROLE_LABEL, ROLES } from '@/utils/constants'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const open = ref(false)
const root = ref(null)
const loggingOut = ref(false)

const homeItem = computed(() => {
  if (auth.role === ROLES.TAMU) return { label: 'Riwayat Pemesanan', to: { name: 'tamu-riwayat' } }
  return { label: `Dashboard ${ROLE_LABEL[auth.role] || ''}`.trim(), to: auth.homeRoute }
})

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}
function onKey(e) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})

async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  await auth.logout()
  useBookingDraftStore().clear()
  loggingOut.value = false
  open.value = false
  ui.notify('Anda telah keluar.', 'success')
  router.push({ name: 'login' })
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-muted transition hover:bg-field focus-visible:outline-2 focus-visible:outline-primary"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="max-w-40 truncate">{{ auth.user?.name || 'Akun' }}</span>
      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6" /></svg>
    </button>

    <div v-if="open" class="absolute right-0 z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-2 shadow-lg" role="menu">
      <div class="border-b border-line px-3 pb-2 pt-1">
        <p class="truncate font-semibold text-ink">{{ auth.user?.name }}</p>
        <p class="truncate text-sm text-muted">{{ auth.user?.email }}</p>
        <p class="mt-1 text-xs font-semibold text-primary">{{ ROLE_LABEL[auth.role] }}</p>
      </div>
      <RouterLink :to="homeItem.to" class="mt-1 block rounded-lg px-3 py-2 text-ink hover:bg-field" role="menuitem" @click="open = false">
        {{ homeItem.label }}
      </RouterLink>
      <button type="button" class="block w-full rounded-lg px-3 py-2 text-left text-bad-fg hover:bg-bad-bg disabled:opacity-60" role="menuitem" :disabled="loggingOut" @click="logout">
        {{ loggingOut ? 'Keluar…' : 'Keluar' }}
      </button>
    </div>
  </div>
</template>
