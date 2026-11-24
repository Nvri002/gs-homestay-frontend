<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InfoRows from '@/components/common/InfoRows.vue'
import FileUploader from '@/components/common/FileUploader.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PaymentInstruction from '@/components/booking/PaymentInstruction.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { parseApiError, useFormErrors } from '@/composables/useApiError'
import { bookingService } from '@/services/bookingService'
import { useUiStore } from '@/stores/ui'
import { formatRupiah, formatTanggal, formatTanggalWaktu } from '@/utils/format'
import { PROOF_TYPES } from '@/utils/fileValidation'
import { CAN_UPLOAD_PROOF } from '@/utils/statusMap'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const { message, clear, setFromError, first } = useFormErrors()

const booking = ref(null)
const loading = ref(true)
const loadError = ref('')
const notFound = ref(false)
const file = ref(null)

async function load() {
  loading.value = true
  loadError.value = ''
  notFound.value = false
  try {
    booking.value = await bookingService.detail(route.params.id)
  } catch (e) {
    const parsed = parseApiError(e)
    if (parsed.status === 404) notFound.value = true
    else loadError.value = parsed.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const canUpload = computed(() => booking.value && CAN_UPLOAD_PROOF.includes(booking.value.status))
const rows = computed(() => {
  const b = booking.value
  if (!b) return []
  return [
    { label: 'Kamar', value: [b.room.name, b.homestay?.name].filter(Boolean).join(', ') },
    { label: 'Tanggal', value: `${formatTanggal(b.checkIn)} sampai ${formatTanggal(b.checkOut)} (${b.nights} malam)` },
    { label: 'Total', value: formatRupiah(b.totalPrice), strong: true },
    { label: 'Batas waktu', value: b.paymentDeadline ? formatTanggalWaktu(b.paymentDeadline) : '-', tone: 'danger' },
  ]
})

const fileError = ref('')

const { loading: sending, run: send } = useAsyncAction(async () => {
  clear()
  fileError.value = ''
  if (!file.value) {
    fileError.value = 'Pilih berkas bukti pembayaran terlebih dahulu.'
    return
  }
  try {
    await bookingService.uploadProof(booking.value.id, file.value)
    ui.notify('Bukti pembayaran terkirim. Menunggu verifikasi.', 'success')
    router.replace({ name: 'tamu-riwayat-detail', params: { id: booking.value.id } })
  } catch (e) {
    const parsed = setFromError(e)
    // 409: status pemesanan sudah berubah -> beri tahu dan segarkan data.
    if (parsed.status === 409) {
      ui.notify(parsed.message, 'warning')
      load()
    }
  }
})

function cancel() {
  router.push({ name: 'tamu-riwayat-detail', params: { id: route.params.id } })
}
</script>

<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center gap-3 py-24 text-muted"><BaseSpinner size="lg" /> <span>Memuat pemesanan…</span></div>

    <EmptyState v-else-if="notFound" title="Pemesanan tidak ditemukan" description="Pemesanan ini tidak ada atau bukan milik akun Anda." />

    <div v-else-if="loadError" class="space-y-3">
      <AlertMessage type="error" :message="loadError" />
      <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
    </div>

    <div v-else-if="booking" class="grid items-start gap-6 lg:grid-cols-2">
      <section class="rounded-2xl border border-line bg-surface p-6">
        <h1 class="text-3xl font-bold text-ink">Unggah Bukti Pembayaran</h1>
        <p class="mt-2 text-muted">Pembayaran bersifat simulasi.</p>

        <div class="mt-5 rounded-2xl border border-line bg-field p-5">
          <p class="text-sm text-muted">Kode Booking</p>
          <p class="break-all text-2xl font-bold text-ink">{{ booking.code }}</p>
        </div>

        <InfoRows class="mt-5" :rows="rows" />
        <PaymentInstruction class="mt-5" :instruction="booking.paymentInstruction" />
      </section>

      <section class="rounded-2xl border border-line bg-surface p-6">
        <h2 class="text-xl font-bold text-ink">Berkas bukti transfer</h2>

        <template v-if="canUpload">
          <AlertMessage v-if="booking.status === 'pembayaran_ditolak' && booking.rejectionReason" type="error" class="mt-4">
            <strong>Pembayaran sebelumnya ditolak:</strong> {{ booking.rejectionReason }}
          </AlertMessage>
          <AlertMessage v-if="message && !first('proof')" type="error" class="mt-4" :message="message" />

          <form class="mt-4" @submit.prevent="send">
            <FileUploader v-model="file" :accept="PROOF_TYPES" :error="fileError || first('proof')" :disabled="sending" />
            <div class="mt-6 flex justify-end gap-3 border-t border-line pt-5">
              <BaseButton variant="outline" :disabled="sending" @click="cancel">Batal</BaseButton>
              <BaseButton type="submit" :loading="sending">Kirim</BaseButton>
            </div>
          </form>
        </template>

        <div v-else class="mt-4 space-y-4">
          <AlertMessage type="warning" message="Bukti pembayaran tidak dapat diunggah pada status pemesanan ini." />
          <BaseButton variant="outline" @click="cancel">Lihat detail pemesanan</BaseButton>
        </div>
      </section>
    </div>
  </div>
</template>
