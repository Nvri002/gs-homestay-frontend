<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  src: String,
  alt: { type: String, default: '' },
  fallbackText: { type: String, default: 'Foto belum tersedia' },
})

const failed = ref(false)
watch(() => props.src, () => (failed.value = false))
</script>

<template>
  <img v-if="src && !failed" :src="src" :alt="alt" loading="lazy" class="size-full object-cover" @error="failed = true" />
  <div v-else class="grid size-full place-items-center bg-field px-4 text-center text-sm text-muted">{{ fallbackText }}</div>
</template>
