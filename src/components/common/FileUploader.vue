<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import BaseButton from './BaseButton.vue'
import { typeLabels, validateFile } from '@/utils/fileValidation'

const file = defineModel({ default: null }) // File | null
const props = defineProps({
  accept: { type: Array, required: true }, // mis. PROOF_TYPES atau PHOTO_TYPES
  maxSizeMB: { type: Number, default: 2 },
  error: String, // error dari API (mis. errors.proof[0])
  disabled: Boolean,
})
const emit = defineEmits(['invalid'])

const input = ref(null)
const localError = ref('')
const previewUrl = ref('')
const dragging = ref(false)

const isImage = computed(() => !!file.value?.type?.startsWith('image/'))

function setFile(f) {
  const err = validateFile(f, { types: props.accept, maxMB: props.maxSizeMB })
  if (err) {
    localError.value = err
    file.value = null
    emit('invalid', err)
    return
  }
  localError.value = ''
  file.value = f
}

function onChange(e) {
  const f = e.target.files?.[0]
  if (f) setFile(f)
  e.target.value = ''
}

function onDrop(e) {
  dragging.value = false
  if (props.disabled) return
  const f = e.dataTransfer?.files?.[0]
  if (f) setFile(f)
}

function remove() {
  file.value = null
  localError.value = ''
}

function sizeLabel(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

watch(
  file,
  (f) => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = f && f.type.startsWith('image/') ? URL.createObjectURL(f) : ''
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <div>
    <div
      :class="[
        'rounded-2xl border-2 border-dashed px-6 py-8 text-center transition',
        dragging ? 'border-primary bg-primary-soft' : 'border-line',
        localError || error ? 'border-bad-fg' : '',
      ]"
      @dragover.prevent="dragging = !disabled"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <p class="font-semibold text-ink">Pilih berkas dari perangkat</p>
      <p class="mt-1 text-sm text-muted">Format {{ typeLabels(accept) }}. Maksimal {{ maxSizeMB }} MB.</p>
      <div class="mt-4 flex justify-center">
        <BaseButton variant="outline" size="sm" :disabled="disabled" @click="input.click()">Pilih berkas</BaseButton>
      </div>
      <input ref="input" type="file" class="hidden" :accept="accept.join(',')" :disabled="disabled" @change="onChange" />
    </div>

    <p v-if="localError || error" class="mt-2 text-sm text-bad-fg" role="alert">{{ localError || error }}</p>

    <div v-if="file" class="mt-4 flex items-center gap-4 rounded-xl border border-primary/40 bg-primary-soft p-3">
      <img v-if="isImage" :src="previewUrl" alt="Pratinjau berkas" class="size-16 rounded-lg bg-surface object-cover" />
      <div v-else class="grid size-16 place-items-center rounded-lg bg-surface text-sm font-bold text-primary">PDF</div>
      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold text-ink">{{ file.name }}</p>
        <p class="text-sm text-muted">{{ sizeLabel(file.size) }}</p>
      </div>
      <BaseButton variant="ghost" size="sm" :disabled="disabled" @click="remove">Hapus</BaseButton>
    </div>
  </div>
</template>
