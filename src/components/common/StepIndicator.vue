<script setup>
defineProps({
  steps: { type: Array, required: true }, // ['Data pemesanan', 'Ringkasan', 'Pembayaran']
  current: { type: Number, default: 1 }, // 1-based
})
</script>

<template>
  <ol class="flex flex-wrap items-center gap-x-6 gap-y-2">
    <li v-for="(label, i) in steps" :key="label" class="flex items-center gap-2" :aria-current="current === i + 1 ? 'step' : undefined">
      <span
        :class="[
          'grid size-9 place-items-center rounded-full border text-sm font-semibold',
          current === i + 1 ? 'border-primary bg-primary text-on-primary' : 'border-muted text-muted',
        ]"
      >
        {{ i + 1 }}
      </span>
      <span :class="current === i + 1 ? 'font-semibold text-primary' : 'text-muted'">{{ label }}</span>
    </li>
  </ol>
</template>
