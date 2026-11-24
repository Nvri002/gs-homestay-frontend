<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/utils/constants'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import UserMenu from './UserMenu.vue'

const auth = useAuthStore()
const mobileOpen = ref(false)

const links = computed(() => {
  const list = [{ label: 'Cari', to: { name: 'beranda' } }]
  if (!auth.isAuthenticated) {
    list.push({ label: 'Masuk', to: { name: 'login' } }, { label: 'Daftar', to: { name: 'register' } })
  } else if (auth.role === ROLES.TAMU) {
    list.push({ label: 'Riwayat Pemesanan', to: { name: 'tamu-riwayat' } })
  }
  return list
})
</script>

<template>
  <header class="border-b border-line bg-surface">
    <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
      <RouterLink :to="{ name: 'beranda' }" class="text-2xl font-bold tracking-tight text-primary">GS Homestay</RouterLink>

      <nav class="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
        <RouterLink v-for="l in links" :key="l.label" :to="l.to" class="rounded-lg px-3 py-2 text-ink hover:bg-field" active-class="font-semibold text-primary">
          {{ l.label }}
        </RouterLink>
        <UserMenu v-if="auth.isAuthenticated" />
        <ThemeToggle />
      </nav>

      <button type="button" class="rounded-lg p-2 text-ink hover:bg-field md:hidden" aria-label="Buka menu" :aria-expanded="mobileOpen" @click="mobileOpen = !mobileOpen">
        <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
    </div>

    <nav v-if="mobileOpen" class="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden" aria-label="Navigasi seluler">
      <RouterLink v-for="l in links" :key="l.label" :to="l.to" class="rounded-lg px-3 py-2 text-ink hover:bg-field" active-class="font-semibold text-primary" @click="mobileOpen = false">
        {{ l.label }}
      </RouterLink>
      <div v-if="auth.isAuthenticated" class="px-0"><UserMenu /></div>
      <div><ThemeToggle /></div>
    </nav>
  </header>
</template>
