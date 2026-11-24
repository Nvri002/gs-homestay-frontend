<script setup>
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import StepIndicator from '@/components/common/StepIndicator.vue'
import InfoRows from '@/components/common/InfoRows.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import ModalKonfirmasi from '@/components/common/ModalKonfirmasi.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useFormErrors } from '@/composables/useApiError'
import { bookingService } from '@/services/bookingService'
import { useBookingDraftStore } from '@/stores/bookingDraft'
import { useUiStore } from '@/stores/ui'
import { roomTypeLabel } from '@/utils/constants'
import { formatRupiah, formatTanggal } from '@/utils/format'

const router = useRouter()
const draftStore = useBookingDraftStore()
const ui = useUiStore()
const { errors, message, clear, setFromError } = useFormErrors()

const draft = computed(() => draftStore.draft)
const p = computed(() => draftStore.draft?.preview)
const confirmCancel = ref(false)

// Pesan error: gabungan semua pesan validasi 422, atau pesan umum (mis. 409 kamar bentrok).
const errorText = computed(() => {
  const all = Object.values(errors.value).flat().filter(Boolean)
  return all.length ? all.join(' ') : message.value
})

onBeforeMount(() => {
  if (!draft.value?.preview) {
    ui.notify('Data pemesanan tidak ditemukan. Silakan pilih kamar terlebih dahulu.', 'warning')
    router.replace({ name: 'beranda' })
  }
})

const rows = computed(() => {
  if (!p.value) return []
  const typeLabel = roomTypeLabel(p.value.room.type)
  return [
    { label: 'Homestay', value: p.value.homestay?.name },
    { label: 'Kamar', value: [typeLabel, p.value.room.name].filter(Boolean).join(', ') },
    { label: 'Tanggal menginap', value: `${formatTanggal(p.value.checkIn)} sampai ${formatTanggal(p.value.checkOut)}` },
    { label: 'Jumlah tamu', value: `${p.value.guestCount} orang` },
    { label: 'Catatan khusus', value: p.value.notes ? `“${p.value.notes}”` : '-' },
  ]
})

function backToForm() {
  router.push({
    name: 'tamu-pesan',
    params: { kamarId: draft.value.room_id },
    query: { check_in: draft.value.check_in, check_out: draft.value.check_out, guests: String(draft.value.guest_count) },
  })
}

function discard() {
  const hid = draft.value?.homestay_id
  const query = { check_in: draft.value?.check_in, check_out: draft.value?.check_out, guests: String(draft.value?.guest_count || '') }
  draftStore.clear()
  confirmCancel.value = false
  if (hid) router.push({ name: 'homestay-detail', params: { id: hid }, query })
  else router.push({ name: 'beranda' })
}

const { loading, run: confirmBooking } = useAsyncAction(async () => {
  clear()
  const d = draft.value
  const payload = { room_id: d.room_id, check_in: d.check_in, check_out: d.check_out, guest_count: d.guest_count }
  if (d.notes) payload.notes = d.notes
  try {
    const booking = await bookingService.create(payload)
    draftStore.clear()
    if (booking.id) router.replace({ name: 'tamu-pesan-berhasil', params: { id: booking.id } })
    else router.replace({ name: 'tamu-riwayat' })
  } catch (e) {
    setFromError(e)
  }
})
</script>

<template>
  <div v-if="p" class="mx-auto w-full max-w-3xl">
    <StepIndicator :steps="['Data pemesanan', 'Ringkasan', 'Pembayaran']" :current="2" />

    <section class="mt-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h1 class="text-3xl font-bold text-ink">Ringkasan Pemesanan</h1>
      <p class="mt-2 text-muted">Periksa kembali. Ketersediaan dicek ulang saat Anda mengonfirmasi.</p>

      <AlertMessage v-if="errorText" type="error" class="mt-5" :message="errorText" />

      <InfoRows class="mt-6" :rows="rows" />

      <div class="mt-6 rounded-2xl border border-line bg-field p-5">
        <div class="flex items-baseline justify-between"><span class="text-muted">Harga per malam</span><strong class="text-ink">{{ formatRupiah(p.pricePerNight) }}</strong></div>
        <div class="mt-1 flex items-baseline justify-between"><span class="text-muted">Jumlah malam</span><strong class="text-ink">{{ p.nights }} malam</strong></div>
        <div class="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span class="text-muted">Total biaya</span>
          <strong class="text-3xl text-primary">{{ formatRupiah(p.totalPrice) }}</strong>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
        <BaseButton variant="outline" :disabled="loading" @click="confirmCancel = true">Batal</BaseButton>
        <div class="flex flex-wrap gap-3">
          <BaseButton variant="outline" :disabled="loading" @click="backToForm">Ubah Data</BaseButton>
          <BaseButton :loading="loading" @click="confirmBooking">Konfirmasi Pemesanan</BaseButton>
        </div>
      </div>
    </section>

    <ModalKonfirmasi v-model="confirmCancel" title="Batalkan pemesanan?" message="Data pemesanan yang sudah Anda isi akan dihapus." confirm-text="Ya, batalkan" cancel-text="Kembali" danger @confirm="discard" />
  </div>
</template>
