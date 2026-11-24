<script setup>
import { computed } from 'vue'

// meta: { current_page, last_page, from, to, total } (format pagination Laravel)
const props = defineProps({ meta: { type: Object, default: null } })
const emit = defineEmits(['change'])

const current = computed(() => props.meta?.current_page ?? 1)
const last = computed(() => props.meta?.last_page ?? 1)

const pages = computed(() => {
  const set = new Set([1, last.value, current.value - 1, current.value, current.value + 1])
  const sorted = [...set].filter((p) => p >= 1 && p <= last.value).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
})

function go(p) {
  if (p !== current.value && p >= 1 && p <= last.value) emit('change', p)
}
</script>

<template>
  <nav v-if="meta && last > 1" class="mt-8 flex flex-wrap items-center justify-between gap-3" aria-label="Halaman">
    <p v-if="meta.total" class="text-sm text-muted">Menampilkan {{ meta.from }}–{{ meta.to }} dari {{ meta.total }}</p>
    <div class="flex items-center gap-1">
      <button type="button" class="rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-field disabled:opacity-40" :disabled="current <= 1" @click="go(current - 1)">Sebelumnya</button>
      <template v-for="(p, i) in pages" :key="i">
        <span v-if="p === '…'" class="px-1 text-muted">…</span>
        <button
          v-else
          type="button"
          :aria-current="p === current ? 'page' : undefined"
          :class="['min-w-9 rounded-lg px-3 py-2 text-sm font-semibold', p === current ? 'bg-primary text-on-primary' : 'text-ink hover:bg-field']"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>
      <button type="button" class="rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-field disabled:opacity-40" :disabled="current >= last" @click="go(current + 1)">Berikutnya</button>
    </div>
  </nav>
</template>
