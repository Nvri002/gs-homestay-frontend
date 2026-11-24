<script setup>
// Dipakai halaman publik, autentikasi, dan Tamu (navbar atas yang sama di desain).
import Navbar from '@/components/layout/Navbar.vue'
</script>

<template>
  <div class="min-h-screen bg-bg">
    <Navbar />
    <main class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <RouterView />
    </main>
  </div>
</template>
