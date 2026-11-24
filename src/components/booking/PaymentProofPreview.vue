<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { bookingService } from '@/services/bookingService'
import { formatTanggalWaktu } from '@/utils/format'

// Bukti bayar ada di disk privat: diambil lewat Axios (blob) lalu ditampilkan dengan object URL.
const props = defineProps({
  bookingId: { type: [Number, String], required: true },
  fileName: String,
  mimeType: String,
  uploadedAt: String,
})

const url = ref('')
const loading = ref(true)
const failed = ref(false)
let reqId = 0

const isPdf = computed(() => (props.mimeType || '').includes('pdf') || (props.fileName || '').toLowerCase().endsWith('.pdf'))

function revoke() {
  if (url.value) URL.revokeObjectURL(url.value)
  url.value = ''
}

async function load() {
  const id = ++reqId
  loading.value = true
  failed.value = false
  revoke()
  try {
    const blob = await bookingService.fetchProof(props.bookingId)
    if (id !== reqId) return
    if (!blob || !blob.size || (blob.type || '').includes('json')) throw new Error('Berkas tidak valid')
    const type = blob.type && blob.type !== 'application/octet-stream' ? blob.type : props.mimeType || (isPdf.value ? 'application/pdf' : 'image/jpeg')
    url.value = URL.createObjectURL(blob.type === type ? blob : new Blob([blob], { type }))
  } catch {
    if (id === reqId) failed.value = true
  } finally {
    if (id === reqId) loading.value = false
  }
}

watch(() => props.bookingId, load, { immediate: true })
onBeforeUnmount(() => {
  reqId++
  revoke()
})
</script>

<template>
  <div>
    <div v-if="loading" class="flex h-48 items-center justify-center gap-3 rounded-xl bg-field text-muted">
      <BaseSpinner /> <span>Memuat bukti pembayaran…</span>
    </div>

    <div v-else-if="failed" class="flex h-48 flex-col items-center justify-center gap-3 rounded-xl bg-field px-4 text-center">
      <p class="font-semibold text-ink">File bukti tidak dapat dibuka</p>
      <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
    </div>

    <template v-else>
      <iframe v-if="isPdf" :src="url" title="Bukti pembayaran (PDF)" class="h-[28rem] w-full rounded-xl border border-line bg-field" />
      <img v-else :src="url" alt="Bukti pembayaran" class="max-h-[28rem] w-full rounded-xl border border-line bg-field object-contain" @error="failed = true" />
      <a v-if="isPdf" :href="url" target="_blank" rel="noopener" class="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-4">Buka di tab baru</a>
    </template>

    <p v-if="fileName" class="mt-3 font-semibold text-ink">{{ fileName }}</p>
    <p v-if="uploadedAt" class="text-sm text-muted">Diunggah {{ formatTanggalWaktu(uploadedAt) }}</p>
  </div>
</template>
