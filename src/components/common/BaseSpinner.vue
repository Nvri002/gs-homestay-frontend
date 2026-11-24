<script setup>
defineProps({ size: { type: String, default: 'md' } })
const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-10' }
</script>

<template>
  <svg :class="['animate-spin', sizes[size]]" viewBox="0 0 24 24" fill="none" role="status" aria-label="Memuat">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
  </svg>
</template>
