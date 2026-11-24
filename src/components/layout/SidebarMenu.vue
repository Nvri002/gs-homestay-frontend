<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/utils/constants'

const emit = defineEmits(['navigate'])
const auth = useAuthStore()

const MENUS = {
  [ROLES.HOST]: [
    { label: 'Ketersediaan Kamar', to: { name: 'host-ketersediaan' } },
    { label: 'Konfirmasi Reservasi', to: { name: 'host-reservasi' } },
    { label: 'Kelola Homestay', to: { name: 'host-homestay' } },
    { label: 'Kelola Kamar', to: { name: 'host-kamar' } },
    { label: 'Laporan Pendapatan', to: { name: 'host-laporan' } },
  ],
  [ROLES.PENGAWAS]: [
    { label: 'Verifikasi Pembayaran', to: { name: 'pengawas-verifikasi' } },
    { label: 'Kelola Akun', to: { name: 'pengawas-akun' } },
    { label: 'Laporan Pendapatan', to: { name: 'pengawas-laporan' } },
  ],
}

const items = computed(() => MENUS[auth.role] || [])
</script>

<template>
  <nav class="flex flex-col gap-1" aria-label="Menu dashboard">
    <RouterLink
      v-for="item in items"
      :key="item.label"
      :to="item.to"
      class="rounded-xl px-4 py-3 font-medium text-ink transition hover:bg-field"
      active-class="bg-primary-soft !text-primary"
      @click="emit('navigate')"
    >
      {{ item.label }}
    </RouterLink>
  </nav>
</template>
