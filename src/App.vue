<script setup>
import { defineAsyncComponent } from 'vue'
import ToastHost from '@/components/common/ToastHost.vue'
import { isMock } from '@/mocks/flag'

// Panel alat demo hanya dimuat pada mode demo.
// (kondisi ditulis langsung agar bundler membuang seluruh kode demo pada build biasa)
const MockBanner = import.meta.env.VITE_USE_MOCK === 'true' ? defineAsyncComponent(() => import('@/components/common/MockBanner.vue')) : null
</script>

<template>
  <RouterView />
  <ToastHost />
  <component :is="MockBanner" v-if="isMock" />
</template>
