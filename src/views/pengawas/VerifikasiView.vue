<script setup>
import { onMounted, ref } from 'vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Pagination from '@/components/common/Pagination.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { parseApiError } from '@/composables/useApiError'
import { verificationService } from '@/services/verificationService'
import { formatRupiah, formatTanggal, formatTanggalWaktu } from '@/utils/format'

const items = ref([])
const meta = ref(null)
const page = ref(1)
const loading = ref(true)
const error = ref('')
let reqId = 0

async function load() {
  const id = ++reqId
  loading.value = true
  error.value = ''
  try {
    const result = await verificationService.list(page.value)
    if (id !== reqId) return
    items.value = result.items
    meta.value = result.meta
  } catch (e) {
    if (id !== reqId) return
    error.value = parseApiError(e).message
  } finally {
    if (id === reqId) loading.value = false
  }
}
onMounted(load)

function goPage(p) {
  page.value = p
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-ink">Verifikasi Pembayaran</h1>
    <p class="mt-1 text-muted">Antrean pemesanan yang bukti pembayarannya menunggu diperiksa.</p>

    <section class="mt-6" aria-live="polite">
      <div v-if="loading" class="flex items-center justify-center gap-3 py-16 text-muted"><BaseSpinner size="lg" /> <span>Memuat antrean…</span></div>

      <div v-else-if="error" class="space-y-3">
        <AlertMessage type="error" :message="error" />
        <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
      </div>

      <EmptyState v-else-if="!items.length" title="Antrean kosong" description="Tidak ada pembayaran yang menunggu verifikasi saat ini." />

      <template v-else>
        <div class="space-y-4">
          <article v-for="b in items" :key="b.id" class="rounded-2xl border border-line bg-surface p-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-3">
                  <h2 class="text-xl font-bold text-ink">{{ b.code }}</h2>
                  <StatusBadge :status="b.status" />
                </div>
                <p class="mt-2 text-ink">{{ b.guest?.name }} · {{ [b.homestay?.name, b.room.name].filter(Boolean).join(' · ') }}</p>
                <p class="text-sm text-muted">{{ formatTanggal(b.checkIn) }} sampai {{ formatTanggal(b.checkOut) }}</p>
                <p v-if="b.proof?.uploadedAt" class="text-sm text-muted">Bukti diunggah {{ formatTanggalWaktu(b.proof.uploadedAt) }}</p>
              </div>
              <div class="flex items-center justify-between gap-4 sm:justify-end">
                <div class="sm:text-right">
                  <p class="text-sm text-muted">Total tagihan</p>
                  <p class="text-2xl font-bold text-ink">{{ formatRupiah(b.totalPrice) }}</p>
                </div>
                <RouterLink :to="{ name: 'pengawas-verifikasi-detail', params: { id: b.id } }" class="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover">Periksa</RouterLink>
              </div>
            </div>
          </article>
        </div>
        <Pagination :meta="meta" @change="goPage" />
      </template>
    </section>
  </div>
</template>
