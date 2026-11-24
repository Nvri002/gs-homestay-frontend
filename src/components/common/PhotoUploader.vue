<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import BaseButton from './BaseButton.vue'
import ImageWithFallback from './ImageWithFallback.vue'
import { PHOTO_TYPES, typeLabels, validateFile } from '@/utils/fileValidation'

// Unggah banyak foto (JPG/PNG, maks 2 MB per foto). v-model = array File baru.
const files = defineModel({ type: Array, default: () => [] })
const props = defineProps({
  label: { type: String, default: 'Foto' },
  existing: { type: Array, default: () => [] }, // URL foto yang sudah tersimpan (mode ubah)
  error: String,
  disabled: Boolean,
})

const input = ref(null)
const localError = ref('')
const previews = ref([])

function add(list) {
  const problems = []
  const next = [...files.value]
  for (const f of list) {
    const e = validateFile(f, { types: PHOTO_TYPES, maxMB: 2 })
    if (e) problems.push(`${f.name}: ${e}`)
    else next.push(f)
  }
  localError.value = problems.join(' ')
  files.value = next
}

function onChange(e) {
  add(Array.from(e.target.files || []))
  e.target.value = ''
}

function remove(i) {
  files.value = files.value.filter((_, idx) => idx !== i)
}

function revokeAll() {
  previews.value.forEach((p) => URL.revokeObjectURL(p.url))
}

watch(
  files,
  (list) => {
    revokeAll()
    previews.value = list.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))
  },
  { immediate: true },
)
onBeforeUnmount(revokeAll)
</script>

<template>
  <div>
    <p class="mb-2 text-sm font-semibold text-ink">{{ label }}</p>

    <div v-if="props.existing.length" class="mb-3">
      <p class="mb-1 text-xs text-muted">Foto saat ini</p>
      <div class="flex gap-2 overflow-x-auto">
        <div v-for="u in props.existing" :key="u" class="size-16 shrink-0 overflow-hidden rounded-lg border border-line"><ImageWithFallback :src="u" alt="Foto tersimpan" /></div>
      </div>
    </div>

    <div v-if="previews.length" class="mb-3">
      <p class="mb-1 text-xs text-muted">Foto baru</p>
      <div class="flex flex-wrap gap-3">
        <div v-for="(p, i) in previews" :key="p.url" class="relative size-20">
          <img :src="p.url" :alt="p.name" class="size-full rounded-lg border border-line object-cover" />
          <button type="button" class="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-red-700 text-xs font-bold text-white" :aria-label="`Hapus ${p.name}`" :disabled="disabled" @click="remove(i)">×</button>
        </div>
      </div>
    </div>

    <div :class="['rounded-xl border-2 border-dashed px-4 py-5 text-center', localError || error ? 'border-bad-fg' : 'border-line']">
      <p class="text-sm text-muted">Format {{ typeLabels(PHOTO_TYPES) }}. Maksimal 2 MB per foto.</p>
      <BaseButton class="mt-3" variant="outline" size="sm" :disabled="disabled" @click="input.click()">Pilih foto</BaseButton>
      <input ref="input" type="file" class="hidden" multiple accept="image/jpeg,image/png" :disabled="disabled" @change="onChange" />
    </div>
    <p v-if="localError || error" class="mt-1.5 text-sm text-bad-fg" role="alert">{{ localError || error }}</p>
  </div>
</template>
