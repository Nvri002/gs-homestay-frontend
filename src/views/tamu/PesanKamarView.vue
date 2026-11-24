<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StepIndicator from '@/components/common/StepIndicator.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { parseApiError, useFormErrors } from '@/composables/useApiError'
import { bookingService } from '@/services/bookingService'
import { homestayService } from '@/services/homestayService'
import { useAuthStore } from '@/stores/auth'
import { useBookingDraftStore } from '@/stores/bookingDraft'
import { addDaysISO, formatRupiah, todayISO } from '@/utils/format'
import { readSearch, validateSearch } from '@/utils/search'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const draftStore = useBookingDraftStore()
const { errors, message, clear, setFromError, first } = useFormErrors()

const roomId = computed(() => route.params.kamarId)

// Prioritas nilai awal: query (dari pencarian) > draft (saat "Ubah Data") > default.
const q = readSearch(route.query)
const saved = draftStore.draft && String(draftStore.draft.room_id) === String(route.params.kamarId) ? draftStore.draft : null
const checkIn0 = q.check_in || saved?.check_in || todayISO()
const form = reactive({
  check_in: checkIn0,
  check_out: q.check_out || saved?.check_out || addDaysISO(checkIn0, 1),
  guests: q.guests || saved?.guest_count || 1,
  notes: saved?.notes || '',
})
const localErrors = reactive({})
const err = (field) => localErrors[field] || first(field)

// Info kamar + total dari GET /rooms/{id}/availability
const info = ref(null)
const infoLoading = ref(false)
const loadError = ref('')
const roomMissing = ref(false)
let reqId = 0
let timer = null

const formValid = computed(() => Object.keys(validateSearch(form)).length === 0)
const hasFieldError = computed(() => ['check_in', 'check_out', 'guest_count', 'notes'].some((f) => err(f)))

async function checkRoom() {
  if (!formValid.value) return
  const id = ++reqId
  infoLoading.value = true
  loadError.value = ''
  try {
    const data = await homestayService.roomAvailability(roomId.value, {
      check_in: form.check_in,
      check_out: form.check_out,
      guests: Number(form.guests),
    })
    if (id !== reqId) return
    info.value = data
    roomMissing.value = false
  } catch (e) {
    if (id !== reqId) return
    const parsed = parseApiError(e)
    if (parsed.status === 404) roomMissing.value = true
    else loadError.value = parsed.message
  } finally {
    if (id === reqId) infoLoading.value = false
  }
}

watch(() => form.check_in, (value) => {
  if (value && (!form.check_out || form.check_out <= value)) form.check_out = addDaysISO(value, 1)
})
watch(() => [form.check_in, form.check_out, form.guests], () => {
  clearTimeout(timer)
  timer = setTimeout(checkRoom, 400)
})
checkRoom()
onBeforeUnmount(() => {
  clearTimeout(timer)
  reqId++
})

const nightsLabel = computed(() => (info.value?.nights ? `${info.value.nights} malam` : ''))

const { loading, run: submit } = useAsyncAction(async () => {
  clear()
  for (const k of Object.keys(localErrors)) delete localErrors[k]

  const found = validateSearch(form)
  if (found.guests) found.guest_count = found.guests
  delete found.guests
  const cap = info.value?.capacity
  if (!found.guest_count && cap && Number(form.guests) > cap) found.guest_count = `Maksimal ${cap} tamu.`
  if (Object.keys(found).length) {
    Object.assign(localErrors, found)
    return
  }
  if (info.value?.isAvailable === false) return

  const payload = {
    room_id: Number(roomId.value),
    check_in: form.check_in,
    check_out: form.check_out,
    guest_count: Number(form.guests),
  }
  if (form.notes.trim()) payload.notes = form.notes.trim()

  try {
    const preview = await bookingService.preview(payload)
    draftStore.setDraft({
      ...payload,
      notes: form.notes.trim(),
      homestay_id: preview.homestay?.id ?? info.value?.homestayId ?? null,
      preview,
    })
    router.push({ name: 'tamu-pesan-ringkasan' })
  } catch (e) {
    setFromError(e)
  }
})

function cancel() {
  draftStore.clear()
  const hid = info.value?.homestayId
  if (hid) {
    router.push({ name: 'homestay-detail', params: { id: hid }, query: { check_in: form.check_in, check_out: form.check_out, guests: String(form.guests) } })
  } else {
    router.push({ name: 'beranda' })
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl">
    <StepIndicator :steps="['Data pemesanan', 'Ringkasan', 'Pembayaran']" :current="1" />

    <EmptyState v-if="roomMissing" class="mt-6" title="Kamar tidak ditemukan" description="Kamar ini tidak tersedia atau sudah tidak aktif.">
      <RouterLink :to="{ name: 'beranda' }" class="inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary hover:bg-primary-hover">Cari kamar lain</RouterLink>
    </EmptyState>

    <section v-else class="mt-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h1 class="text-3xl font-bold text-ink">Data Pemesanan</h1>
      <p class="mt-2 text-muted">
        <template v-if="info">{{ info.roomName }} · {{ info.homestayName }} · {{ formatRupiah(info.pricePerNight) }} / malam</template>
        <template v-else-if="infoLoading">Memuat data kamar…</template>
      </p>

      <div v-if="loadError" class="mt-4 space-y-3">
        <AlertMessage type="error" :message="loadError" />
        <BaseButton variant="outline" size="sm" @click="checkRoom">Coba lagi</BaseButton>
      </div>

      <form class="mt-6 space-y-5" novalidate @submit.prevent="submit">
        <AlertMessage v-if="info && info.isAvailable === false" type="warning" :message="info.reason || 'Kamar tidak tersedia pada tanggal yang dipilih.'" />
        <AlertMessage v-if="message && !hasFieldError" type="error" :message="message" />

        <div class="grid gap-4 sm:grid-cols-2">
          <BaseInput :model-value="auth.user?.name || ''" label="Nama lengkap" readonly />
          <BaseInput :model-value="auth.user?.phone || ''" label="Nomor telepon" readonly />
          <div class="sm:col-span-2"><BaseInput :model-value="auth.user?.email || ''" label="Email" readonly hint="Data tamu diambil otomatis dari akun Anda." /></div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <BaseInput v-model="form.check_in" type="date" label="Check-in" :min="todayISO()" :error="err('check_in')" />
          <BaseInput v-model="form.check_out" type="date" label="Check-out" :min="addDaysISO(form.check_in || todayISO(), 1)" :error="err('check_out')" />
        </div>

        <BaseInput
          v-model="form.guests"
          type="number"
          label="Jumlah tamu"
          min="1"
          :max="info?.capacity || undefined"
          :hint="info?.capacity ? `Maksimal ${info.capacity} tamu.` : undefined"
          :error="err('guest_count')"
        />

        <BaseInput v-model="form.notes" type="textarea" :rows="3" label="Catatan khusus (opsional)" placeholder="Contoh: perkiraan jam tiba" :error="err('notes')" />

        <div class="flex items-center justify-between gap-4 rounded-2xl border border-line bg-field px-5 py-4" aria-live="polite">
          <span class="text-muted">Total biaya</span>
          <span :class="['text-xl font-bold text-primary sm:text-2xl', infoLoading ? 'opacity-50' : '']">
            <template v-if="info && formValid && info.totalPrice != null">{{ formatRupiah(info.totalPrice) }} ({{ nightsLabel }})</template>
            <template v-else>-</template>
          </span>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <BaseButton variant="outline" :disabled="loading" @click="cancel">Batal</BaseButton>
          <BaseButton type="submit" :loading="loading" :disabled="info?.isAvailable === false">Lanjut ke Ringkasan</BaseButton>
        </div>
      </form>
    </section>
  </div>
</template>
