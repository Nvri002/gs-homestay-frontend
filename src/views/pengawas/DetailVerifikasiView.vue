<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InfoRows from '@/components/common/InfoRows.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ModalKonfirmasi from '@/components/common/ModalKonfirmasi.vue'
import ModalAlasanTolak from '@/components/common/ModalAlasanTolak.vue'
import PaymentProofPreview from '@/components/booking/PaymentProofPreview.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { parseApiError } from '@/composables/useApiError'
import { verificationService } from '@/services/verificationService'
import { useUiStore } from '@/stores/ui'
import { roomTypeLabel } from '@/utils/constants'
import { formatRupiah, formatTanggal, formatTanggalWaktu } from '@/utils/format'
import { BOOKING_STATUS } from '@/utils/statusMap'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const booking = ref(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const actionError = ref('')
const approveOpen = ref(false)
const rejectOpen = ref(false)
const rejectError = ref('')
let reqId = 0

async function load({ quiet = false } = {}) {
  if (route.name !== 'pengawas-verifikasi-detail') return
  const id = ++reqId
  if (!quiet) loading.value = true
  error.value = ''
  notFound.value = false
  try {
    const data = await verificationService.detail(route.params.id)
    if (id === reqId) booking.value = data
  } catch (e) {
    if (id !== reqId) return
    const parsed = parseApiError(e)
    if (parsed.status === 404) notFound.value = true
    else error.value = parsed.message
  } finally {
    if (id === reqId) loading.value = false
  }
}
watch(() => route.params.id, () => load(), { immediate: true })

const pending = computed(() => booking.value?.status === 'menunggu_verifikasi')
const hasProof = computed(() => !!booking.value?.proof)

// Rincian tagihan (disandingkan dengan bukti transfer).
const rows = computed(() => {
  const b = booking.value
  if (!b) return []
  const pi = b.paymentInstruction
  return [
    { label: 'Tamu', value: b.guest?.name },
    { label: 'Homestay', value: b.homestay?.name },
    { label: 'Kamar', value: [roomTypeLabel(b.room.type), b.room.name].filter(Boolean).join(', ') || b.room.name },
    { label: 'Tanggal menginap', value: `${formatTanggal(b.checkIn)} sampai ${formatTanggal(b.checkOut)}` },
    { label: 'Harga per malam', value: formatRupiah(b.pricePerNight) },
    { label: 'Jumlah malam', value: `${b.nights} malam` },
    { label: 'Total tagihan', value: formatRupiah(b.totalPrice), strong: true, tone: 'primary' },
    { label: 'Batas bayar', value: b.paymentDeadline ? formatTanggalWaktu(b.paymentDeadline) : '-' },
    { label: 'Rekening tujuan', value: pi ? `${pi.bank} · ${pi.accountNumber} a.n. ${pi.accountName}` : '-' },
  ]
})

// 409 = sudah diproses Pengawas lain: tampilkan pesan, tutup modal, segarkan data.
function handleConflict(parsed) {
  actionError.value = parsed.message
  approveOpen.value = false
  rejectOpen.value = false
  load({ quiet: true })
}

const { loading: approving, run: approve } = useAsyncAction(async () => {
  actionError.value = ''
  try {
    const res = await verificationService.approve(booking.value.id)
    ui.notify(res?.message || 'Pembayaran diterima.', 'success')
    router.push({ name: 'pengawas-verifikasi' })
  } catch (e) {
    const parsed = parseApiError(e)
    if (parsed.status === 409) handleConflict(parsed)
    else {
      approveOpen.value = false
      actionError.value = parsed.message
    }
  }
})

const { loading: rejecting, run: reject } = useAsyncAction(async (reason) => {
  rejectError.value = ''
  actionError.value = ''
  try {
    const res = await verificationService.reject(booking.value.id, reason)
    ui.notify(res?.message || 'Pembayaran ditolak.', 'success')
    router.push({ name: 'pengawas-verifikasi' })
  } catch (e) {
    const parsed = parseApiError(e)
    if (parsed.status === 409) handleConflict(parsed)
    else rejectError.value = parsed.errors.reason?.[0] || parsed.message
  }
})

function openReject() {
  rejectError.value = ''
  rejectOpen.value = true
}
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'pengawas-verifikasi' }" class="inline-flex rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft">← Kembali ke antrean</RouterLink>

    <div v-if="loading" class="flex items-center justify-center gap-3 py-24 text-muted"><BaseSpinner size="lg" /> <span>Memuat pemesanan…</span></div>

    <div v-else-if="error" class="mt-6 space-y-3">
      <AlertMessage type="error" :message="error" />
      <BaseButton variant="outline" size="sm" @click="load()">Coba lagi</BaseButton>
    </div>

    <EmptyState v-else-if="notFound" class="mt-6" title="Pemesanan tidak ditemukan" description="Pemesanan ini tidak ada atau sudah tidak berada di antrean verifikasi." />

    <template v-else-if="booking">
      <div class="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="break-all text-3xl font-bold text-ink">{{ booking.code }}</h1>
          <p class="mt-1 text-muted">Bandingkan rincian tagihan dengan bukti transfer, lalu terima atau tolak pembayaran.</p>
        </div>
        <StatusBadge :status="booking.status" />
      </div>

      <AlertMessage v-if="actionError" type="error" class="mt-4" :message="actionError" />
      <AlertMessage v-if="!pending" type="info" class="mt-4" :message="`Pemesanan ini sudah diproses (status: ${BOOKING_STATUS[booking.status]?.label || booking.status}). Tidak ada tindakan yang tersedia.`" />

      <div class="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <section class="rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-4 text-xl font-bold text-ink">Rincian tagihan</h2>
          <InfoRows :rows="rows" />
        </section>

        <section class="rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-4 text-xl font-bold text-ink">Bukti transfer</h2>
          <PaymentProofPreview v-if="hasProof" :booking-id="booking.id" :file-name="booking.proof.fileName" :mime-type="booking.proof.mimeType" :uploaded-at="booking.proof.uploadedAt" />
          <p v-else class="text-ink">Tamu belum mengunggah bukti pembayaran.</p>
        </section>
      </div>

      <div v-if="pending" class="mt-6 flex flex-wrap gap-3">
        <BaseButton :disabled="!hasProof" :title="hasProof ? '' : 'Bukti pembayaran belum tersedia'" @click="approveOpen = true">Terima</BaseButton>
        <BaseButton variant="danger" @click="openReject">Tolak</BaseButton>
      </div>
    </template>

    <ModalKonfirmasi v-model="approveOpen" title="Terima pembayaran?" message="Status berubah menjadi Pembayaran Terverifikasi dan diteruskan ke Host untuk dikonfirmasi." confirm-text="Ya, terima" :loading="approving" @confirm="approve" />
    <ModalAlasanTolak v-model="rejectOpen" title="Tolak pembayaran" label="Alasan penolakan" submit-text="Tolak pembayaran" :loading="rejecting" :error="rejectError" @submit="reject" />
  </div>
</template>
