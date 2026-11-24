<script setup>
defineProps({ title: String, description: String })
</script>

<template>
  <div class="rounded-2xl border border-line bg-field px-6 py-12 text-center">
    <h3 class="text-xl font-bold text-ink">{{ title }}</h3>
    <p v-if="description" class="mx-auto mt-2 max-w-md text-muted">{{ description }}</p>
    <div v-if="$slots.default" class="mt-6 flex justify-center"><slot /></div>
  </div>
</template>
