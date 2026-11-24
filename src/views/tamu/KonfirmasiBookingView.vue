<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import InfoRows from '@/components/common/InfoRows.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PaymentInstruction from '@/components/booking/PaymentInstruction.vue'
import { parseApiError } from '@/composables/useApiError'
import { bookingService } from '@/services/bookingService'
import { formatRupiah, formatTanggal, formatTanggalWaktu } from '@/utils/format'
import { CAN_UPLOAD_PROOF } from '@/utils/statusMap'

const route = useRoute()
const booking = ref(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    booking.value = await bookingService.detail(route.params.id)
  } catch (e) {
    const parsed = parseApiError(e)
    if (parsed.status === 404) notFound.value = true
    else error.value = parsed.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const rows = computed(() => {
  const b = booking.value
  if (!b) return []
  return [
    { label: 'Kamar', value: [b.room.name, b.homestay?.name].filter(Boolean).join(', ') },
    { label: 'Tanggal menginap', value: `${formatTanggal(b.checkIn)} sampai ${formatTanggal(b.checkOut)} (${b.nights} malam)` },
    { label: 'Total pembayaran', value: formatRupiah(b.totalPrice), strong: true },
    { label: 'Batas waktu', value: b.paymentDeadline ? formatTanggalWaktu(b.paymentDeadline) : '-', tone: 'danger' },
  ]
})
const canUpload = computed(() => booking.value && CAN_UPLOAD_PROOF.includes(booking.value.status))
</script>

<template>
  <div class="mx-auto w-full max-w-2xl">
    <div v-if="loading" class="flex items-center justify-center gap-3 py-24 text-muted"><BaseSpinner size="lg" /> <span>Memuat pemesanan…</span></div>

    <EmptyState v-else-if="notFound" title="Pemesanan tidak ditemukan" description="Pemesanan ini tidak ada atau bukan milik akun Anda." />

    <div v-else-if="error" class="space-y-3">
      <AlertMessage type="error" :message="error" />
      <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
    </div>

    <section v-else-if="booking" class="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div class="mx-auto grid size-16 place-items-center rounded-full bg-ok-bg text-ok-fg">
        <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg>
      </div>
      <h1 class="mt-4 text-center text-3xl font-bold text-ink">Pemesanan Berhasil Dibuat</h1>
      <p class="mt-2 text-center text-muted">Selesaikan pembayaran sebelum batas waktu agar kamar tetap ditahan.</p>

      <div class="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-line bg-field p-5">
        <div class="min-w-0">
          <p class="text-sm text-muted">Kode Booking</p>
          <p class="break-all text-2xl font-bold text-ink">{{ booking.code }}</p>
        </div>
        <StatusBadge :status="booking.status" />
      </div>

      <InfoRows class="mt-6" :rows="rows" />

      <PaymentInstruction class="mt-6" :instruction="booking.paymentInstruction" />

      <div class="mt-6 space-y-3">
        <RouterLink
          v-if="canUpload"
          :to="{ name: 'tamu-unggah-bukti', params: { id: booking.id } }"
          class="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 font-semibold text-on-primary hover:bg-primary-hover"
        >
          Unggah Bukti Pembayaran
        </RouterLink>
        <RouterLink :to="{ name: 'tamu-riwayat' }" class="flex w-full items-center justify-center rounded-xl border border-primary px-5 py-3.5 font-semibold text-primary hover:bg-primary-soft">
          Lihat Riwayat Pemesanan
        </RouterLink>
      </div>
    </section>
  </div>
</template>
