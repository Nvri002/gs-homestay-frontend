<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import InfoRows from '@/components/common/InfoRows.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { parseApiError } from '@/composables/useApiError'
import { hostBookingService } from '@/services/hostBookingService'
import { buildStaffBookingRows } from '@/utils/bookingRows'

const open = defineModel({ type: Boolean, default: false })
const props = defineProps({ bookingId: { type: [Number, String], default: null } })
const router = useRouter()

const booking = ref(null)
const loading = ref(false)
const error = ref('')
let reqId = 0

async function load() {
  const id = ++reqId
  loading.value = true
  error.value = ''
  booking.value = null
  try {
    const data = await hostBookingService.detail(props.bookingId)
    if (id === reqId) booking.value = data
  } catch (e) {
    if (id === reqId) error.value = parseApiError(e).message
  } finally {
    if (id === reqId) loading.value = false
  }
}

watch(() => [open.value, props.bookingId], ([isOpen, id]) => { if (isOpen && id) load() }, { immediate: true })

const rows = computed(() => (booking.value ? buildStaffBookingRows(booking.value) : []))

function openFull() {
  open.value = false
  router.push({ name: 'host-reservasi-detail', params: { id: props.bookingId } })
}
</script>

<template>
  <BaseModal v-model="open" title="Detail Reservasi" size="lg">
    <div v-if="loading" class="flex items-center justify-center gap-3 py-10 text-muted"><BaseSpinner /> <span>Memuat reservasi…</span></div>
    <div v-else-if="error" class="space-y-3">
      <AlertMessage type="error" :message="error" />
      <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
    </div>
    <template v-else-if="booking">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p class="break-all text-xl font-bold text-ink">{{ booking.code }}</p>
        <StatusBadge :status="booking.status" />
      </div>
      <InfoRows :rows="rows" />
    </template>
    <template #footer>
      <BaseButton variant="outline" @click="open = false">Tutup</BaseButton>
      <BaseButton v-if="booking" @click="openFull">Buka Konfirmasi Reservasi</BaseButton>
    </template>
  </BaseModal>
</template>
