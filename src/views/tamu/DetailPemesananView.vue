<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import InfoRows from '@/components/common/InfoRows.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTimeline from '@/components/booking/StatusTimeline.vue'
import PaymentProofPreview from '@/components/booking/PaymentProofPreview.vue'
import { parseApiError } from '@/composables/useApiError'
import { bookingService } from '@/services/bookingService'
import { roomTypeLabel } from '@/utils/constants'
import { formatRupiah, formatTanggal } from '@/utils/format'
import { BOOKING_STATUS, CAN_UPLOAD_PROOF } from '@/utils/statusMap'
import { buildTimeline } from '@/utils/timeline'

const route = useRoute()
const booking = ref(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
let reqId = 0

async function load() {
  if (route.name !== 'tamu-riwayat-detail') return
  const id = ++reqId
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    const data = await bookingService.detail(route.params.id)
    if (id !== reqId) return
    booking.value = data
  } catch (e) {
    if (id !== reqId) return
    const parsed = parseApiError(e)
    booking.value = null
    if (parsed.status === 404) notFound.value = true
    else error.value = parsed.message
  } finally {
    if (id === reqId) loading.value = false
  }
}
watch(() => route.params.id, load, { immediate: true })

const rows = computed(() => {
  const b = booking.value
  if (!b) return []
  return [
    { label: 'Homestay', value: b.homestay?.name },
    { label: 'Kamar', value: [roomTypeLabel(b.room.type), b.room.name].filter(Boolean).join(', ') || b.room.name },
    { label: 'Tanggal menginap', value: `${formatTanggal(b.checkIn)} sampai ${formatTanggal(b.checkOut)}` },
    { label: 'Jumlah tamu', value: `${b.guestCount} orang` },
    { label: 'Catatan khusus', value: b.notes ? `“${b.notes}”` : '-' },
    { label: 'Harga per malam', value: formatRupiah(b.pricePerNight) },
    { label: 'Jumlah malam', value: `${b.nights} malam` },
    { label: 'Total biaya', value: formatRupiah(b.totalPrice), strong: true, tone: 'primary' },
  ]
})
const steps = computed(() => (booking.value ? buildTimeline(booking.value) : []))
const description = computed(() => BOOKING_STATUS[booking.value?.status]?.description || '')
const canUpload = computed(() => booking.value && CAN_UPLOAD_PROOF.includes(booking.value.status))
const rejectionLabel = computed(() => (booking.value?.status === 'ditolak' ? 'Alasan penolakan Host' : 'Alasan penolakan pembayaran'))
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'tamu-riwayat' }" class="inline-flex rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft">← Kembali ke riwayat</RouterLink>

    <div v-if="loading" class="flex items-center justify-center gap-3 py-24 text-muted"><BaseSpinner size="lg" /> <span>Memuat pemesanan…</span></div>

    <div v-else-if="error" class="mt-6 space-y-3">
      <AlertMessage type="error" :message="error" />
      <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
    </div>

    <EmptyState v-else-if="notFound" class="mt-6" title="Pemesanan tidak ditemukan" description="Pemesanan ini tidak ada atau bukan milik akun Anda." />

    <template v-else-if="booking">
      <div class="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="break-all text-3xl font-bold text-ink">{{ booking.code }}</h1>
          <p class="mt-1 text-muted">{{ description }}</p>
        </div>
        <StatusBadge :status="booking.status" />
      </div>

      <div class="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div class="space-y-6">
          <section class="rounded-2xl border border-line bg-surface p-6">
            <h2 class="mb-4 text-xl font-bold text-ink">Rincian pesanan</h2>
            <InfoRows :rows="rows" />
          </section>

          <AlertMessage v-if="booking.rejectionReason" type="error">
            <strong>{{ rejectionLabel }}:</strong> {{ booking.rejectionReason }}
          </AlertMessage>

          <section class="rounded-2xl border border-line bg-surface p-6">
            <h2 class="mb-4 text-xl font-bold text-ink">Bukti pembayaran</h2>
            <PaymentProofPreview v-if="booking.proof" :booking-id="booking.id" :file-name="booking.proof.fileName" :mime-type="booking.proof.mimeType" :uploaded-at="booking.proof.uploadedAt" />
            <p v-else class="text-ink">Belum ada bukti pembayaran.</p>
          </section>

          <RouterLink
            v-if="canUpload"
            :to="{ name: 'tamu-unggah-bukti', params: { id: booking.id } }"
            class="inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-primary-hover"
          >
            {{ booking.status === 'pembayaran_ditolak' ? 'Unggah Ulang Bukti' : 'Unggah Bukti' }}
          </RouterLink>
        </div>

        <aside class="rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-4 text-xl font-bold text-ink">Status pemesanan</h2>
          <StatusTimeline :steps="steps" />
        </aside>
      </div>
    </template>
  </div>
</template>
