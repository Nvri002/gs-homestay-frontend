<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <section class="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
    <h1 class="text-3xl font-bold text-ink">Akses Ditolak</h1>
    <p class="mt-3 text-muted">Akun Anda tidak memiliki izin untuk membuka halaman ini.</p>
    <RouterLink :to="auth.isAuthenticated ? auth.homeRoute : { name: 'login' }" class="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary hover:bg-primary-hover">
      {{ auth.isAuthenticated ? 'Kembali ke menu saya' : 'Masuk' }}
    </RouterLink>
  </section>
</template>
