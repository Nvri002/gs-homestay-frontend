<script setup>
// Dipakai Host dan Pengawas Sistem: topbar + sidebar (drawer di layar kecil).
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABEL } from '@/utils/constants'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import SidebarMenu from '@/components/layout/SidebarMenu.vue'
import UserMenu from '@/components/layout/UserMenu.vue'

const auth = useAuthStore()
const drawer = ref(false)
</script>

<template>
  <div class="min-h-screen bg-bg">
    <header class="sticky top-0 z-30 border-b border-line bg-surface">
      <div class="flex h-16 items-center justify-between px-4 sm:px-6">
        <div class="flex items-center gap-3">
          <button type="button" class="rounded-lg p-2 text-ink hover:bg-field lg:hidden" aria-label="Buka menu" @click="drawer = true">
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <RouterLink :to="auth.homeRoute" class="text-2xl font-bold tracking-tight text-primary">GS Homestay</RouterLink>
          <span class="hidden rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary sm:inline">{{ ROLE_LABEL[auth.role] }}</span>
        </div>
        <div class="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>

    <div class="mx-auto flex w-full max-w-7xl">
      <aside class="hidden w-64 shrink-0 p-4 lg:block"><SidebarMenu /></aside>
      <main class="min-w-0 flex-1 px-4 py-6 sm:px-6"><RouterView /></main>
    </div>

    <div v-if="drawer" class="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/50" @click="drawer = false" />
      <aside class="absolute inset-y-0 left-0 w-72 bg-surface p-4 shadow-xl">
        <p class="mb-4 px-2 text-xl font-bold text-primary">GS Homestay</p>
        <SidebarMenu @navigate="drawer = false" />
      </aside>
    </div>
  </div>
</template>
