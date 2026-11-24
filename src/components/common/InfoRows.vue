<script setup>
// rows: [{ label, value, strong?, tone?: 'primary' | 'danger' }]
defineProps({ rows: { type: Array, required: true } })
const tones = { primary: 'text-primary', danger: 'text-bad-fg' }
</script>

<template>
  <dl class="grid grid-cols-[8rem_1fr] items-baseline gap-x-4 gap-y-3 sm:grid-cols-[11rem_1fr]">
    <template v-for="r in rows" :key="r.label">
      <dt class="text-muted">{{ r.label }}</dt>
      <dd :class="['min-w-0 break-words', r.strong ? 'text-2xl font-bold' : 'text-ink', tones[r.tone] || (r.strong ? 'text-ink' : '')]">{{ r.value || '-' }}</dd>
    </template>
  </dl>
</template>
