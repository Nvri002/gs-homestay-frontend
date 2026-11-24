<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import InfoRows from '@/components/common/InfoRows.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ModalKonfirmasi from '@/components/common/ModalKonfirmasi.vue'
import ModalAlasanTolak from '@/components/common/ModalAlasanTolak.vue'
import StatusTimeline from '@/components/booking/StatusTimeline.vue'
import PaymentProofPreview from '@/components/booking/PaymentProofPreview.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { parseApiError } from '@/composables/useApiError'
import { hostBookingService } from '@/services/hostBookingService'
import { useUiStore } from '@/stores/ui'
import { buildStaffBookingRows } from '@/utils/bookingRows'
import { BOOKING_STATUS } from '@/utils/statusMap'
import { buildTimeline } from '@/utils/timeline'

const route = useRoute()
const ui = useUiStore()

const booking = ref(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const actionError = ref('')
const confirmOpen = ref(false)
const rejectOpen = ref(false)
const rejectError = ref('')
let reqId = 0

async function load({ quiet = false } = {}) {
  if (route.name !== 'host-reservasi-detail') return
  const id = ++reqId
  if (!quiet) loading.value = true
  error.value = ''
  notFound.value = false
  try {
    const data = await hostBookingService.detail(route.params.id)
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

const rows = computed(() => (booking.value ? buildStaffBookingRows(booking.value) : []))
const steps = computed(() => (booking.value ? buildTimeline(booking.value) : []))
const description = computed(() => BOOKING_STATUS[booking.value?.status]?.description || '')
const canDecide = computed(() => booking.value?.status === 'pembayaran_terverifikasi')

// 409 = status sudah berubah (mis. klik ganda / diproses di perangkat lain): tampilkan pesan lalu segarkan data.
function handleConflict(parsed) {
  actionError.value = parsed.message
  confirmOpen.value = false
  rejectOpen.value = false
  load({ quiet: true })
}

const { loading: confirming, run: confirmBooking } = useAsyncAction(async () => {
  actionError.value = ''
  try {
    const res = await hostBookingService.confirm(booking.value.id)
    ui.notify(res?.message || 'Reservasi dikonfirmasi.', 'success')
    confirmOpen.value = false
    load({ quiet: true })
  } catch (e) {
    const parsed = parseApiError(e)
    if (parsed.status === 409) handleConflict(parsed)
    else {
      confirmOpen.value = false
      actionError.value = parsed.message
    }
  }
})

const { loading: rejecting, run: rejectBooking } = useAsyncAction(async (reason) => {
  rejectError.value = ''
  actionError.value = ''
  try {
    const res = await hostBookingService.reject(booking.value.id, reason)
    ui.notify(res?.message || 'Reservasi ditolak.', 'success')
    rejectOpen.value = false
    load({ quiet: true })
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
    <RouterLink :to="{ name: 'host-reservasi' }" class="inline-flex rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft">← Kembali ke daftar reservasi</RouterLink>

    <div v-if="loading" class="flex items-center justify-center gap-3 py-24 text-muted"><BaseSpinner size="lg" /> <span>Memuat reservasi…</span></div>

    <div v-else-if="error" class="mt-6 space-y-3">
      <AlertMessage type="error" :message="error" />
      <BaseButton variant="outline" size="sm" @click="load()">Coba lagi</BaseButton>
    </div>

    <EmptyState v-else-if="notFound" class="mt-6" title="Reservasi tidak ditemukan" description="Reservasi ini tidak ada atau bukan milik homestay Anda." />

    <template v-else-if="booking">
      <div class="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="break-all text-3xl font-bold text-ink">{{ booking.code }}</h1>
          <p class="mt-1 text-muted">{{ description }}</p>
        </div>
        <StatusBadge :status="booking.status" />
      </div>

      <AlertMessage v-if="actionError" type="error" class="mt-4" :message="actionError" />

      <div class="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div class="space-y-6">
          <section class="rounded-2xl border border-line bg-surface p-6">
            <h2 class="mb-4 text-xl font-bold text-ink">Rincian reservasi</h2>
            <InfoRows :rows="rows" />
          </section>

          <AlertMessage v-if="booking.rejectionReason" type="error">
            <strong>Alasan penolakan:</strong> {{ booking.rejectionReason }}
          </AlertMessage>

          <section class="rounded-2xl border border-line bg-surface p-6">
            <h2 class="mb-4 text-xl font-bold text-ink">Bukti pembayaran</h2>
            <PaymentProofPreview v-if="booking.proof" :booking-id="booking.id" :file-name="booking.proof.fileName" :mime-type="booking.proof.mimeType" :uploaded-at="booking.proof.uploadedAt" />
            <p v-else class="text-ink">Belum ada bukti pembayaran.</p>
          </section>

          <div v-if="canDecide" class="flex flex-wrap gap-3">
            <BaseButton @click="confirmOpen = true">Konfirmasi</BaseButton>
            <BaseButton variant="danger" @click="openReject">Tolak</BaseButton>
          </div>
        </div>

        <aside class="rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-4 text-xl font-bold text-ink">Status reservasi</h2>
          <StatusTimeline :steps="steps" />
        </aside>
      </div>
    </template>

    <ModalKonfirmasi v-model="confirmOpen" title="Konfirmasi reservasi?" message="Reservasi akan berstatus Terkonfirmasi dan kamar terpesan untuk tamu." confirm-text="Ya, konfirmasi" :loading="confirming" @confirm="confirmBooking" />
    <ModalAlasanTolak v-model="rejectOpen" title="Tolak reservasi" label="Alasan penolakan" submit-text="Tolak reservasi" :loading="rejecting" :error="rejectError" @submit="rejectBooking" />
  </div>
</template>
