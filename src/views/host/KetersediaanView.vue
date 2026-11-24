<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AvailabilityMatrix from '@/components/host/AvailabilityMatrix.vue'
import ReservationDetailModal from '@/components/host/ReservationDetailModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { parseApiError } from '@/composables/useApiError'
import { availabilityService } from '@/services/availabilityService'
import { hostHomestayService } from '@/services/hostHomestayService'
import { ROOM_TYPES } from '@/utils/constants'
import { currentMonth, formatBulanTahun, shiftMonth } from '@/utils/format'
import { CALENDAR_STATUS } from '@/utils/statusMap'

const route = useRoute()
const router = useRouter()

const month = computed(() => (typeof route.query.month === 'string' && /^\d{4}-\d{2}$/.test(route.query.month) ? route.query.month : currentMonth()))
const homestayId = computed(() => (typeof route.query.homestay_id === 'string' ? route.query.homestay_id : ''))
const roomType = computed(() => (typeof route.query.room_type === 'string' ? route.query.room_type : ''))

const homestays = ref([])
const homestayOptions = computed(() => homestays.value.map((h) => ({ value: h.id, label: h.name })))
const result = ref(null)
const loading = ref(true)
const error = ref('')
const bookingId = ref(null)
const detailOpen = ref(false)
let reqId = 0

const filtered = computed(() => !!(homestayId.value || roomType.value))

async function load() {
  if (route.name !== 'host-ketersediaan') return
  const id = ++reqId
  loading.value = true
  error.value = ''
  try {
    const data = await availabilityService.get({ month: month.value, homestay_id: homestayId.value, room_type: roomType.value })
    if (id === reqId) result.value = data
  } catch (e) {
    if (id === reqId) error.value = parseApiError(e).message
  } finally {
    if (id === reqId) loading.value = false
  }
}
watch(() => route.fullPath, load, { immediate: true })
onMounted(async () => {
  try {
    homestays.value = await hostHomestayService.all()
  } catch {
    /* filter homestay opsional */
  }
})

function pushQuery(patch) {
  const q = { ...route.query, ...patch }
  for (const k of Object.keys(q)) if (q[k] === '' || q[k] == null) delete q[k]
  router.push({ name: 'host-ketersediaan', query: q })
}
const go = (delta) => pushQuery({ month: shiftMonth(month.value, delta) })
const toToday = () => pushQuery({ month: undefined })

function openBooking(id) {
  bookingId.value = id
  detailOpen.value = true
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-ink">Ketersediaan Kamar</h1>
    <p class="mt-1 text-muted">Pantau status seluruh kamar per tanggal. Klik tanggal yang terisi untuk melihat detail reservasi.</p>

    <div class="mt-5 flex flex-wrap items-end gap-3">
      <div class="flex items-center gap-2">
        <BaseButton variant="outline" size="sm" aria-label="Bulan sebelumnya" @click="go(-1)">‹</BaseButton>
        <p class="min-w-40 text-center text-lg font-bold text-ink" aria-live="polite">{{ formatBulanTahun(month) }}</p>
        <BaseButton variant="outline" size="sm" aria-label="Bulan berikutnya" @click="go(1)">›</BaseButton>
        <BaseButton variant="ghost" size="sm" @click="toToday">Bulan ini</BaseButton>
      </div>
      <div class="w-full sm:w-56"><BaseSelect :model-value="homestayId" label="Homestay" placeholder="Semua homestay" :options="homestayOptions" @update:model-value="(v) => pushQuery({ homestay_id: v })" /></div>
      <div class="w-full sm:w-44"><BaseSelect :model-value="roomType" label="Tipe kamar" placeholder="Semua tipe" :options="ROOM_TYPES" @update:model-value="(v) => pushQuery({ room_type: v })" /></div>
    </div>

    <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink" aria-label="Keterangan warna">
      <li v-for="(s, key) in CALENDAR_STATUS" :key="key" class="flex items-center gap-2">
        <span :class="['grid size-6 place-items-center rounded-md text-xs font-bold', s.cell]">{{ s.mark }}</span> {{ s.label }}
      </li>
    </ul>

    <section class="mt-5" aria-live="polite">
      <div v-if="loading && !result" class="flex items-center justify-center gap-3 py-16 text-muted"><BaseSpinner size="lg" /> <span>Memuat kalender…</span></div>

      <div v-else-if="error" class="space-y-3">
        <AlertMessage type="error" :message="error" />
        <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
      </div>

      <EmptyState v-else-if="result && result.totalRooms === 0 && !filtered" title="Anda belum memiliki kamar" description="Tambahkan kamar terlebih dahulu agar ketersediaan dapat dipantau.">
        <RouterLink :to="{ name: 'host-kamar' }" class="inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary hover:bg-primary-hover">Ke Kelola Data Kamar</RouterLink>
      </EmptyState>

      <EmptyState v-else-if="result && !result.rooms.length" title="Tidak ada kamar yang cocok" description="Coba ubah filter homestay atau tipe kamar." />

      <div v-else-if="result" :class="loading ? 'opacity-60 transition' : 'transition'">
        <AvailabilityMatrix :rooms="result.rooms" :month="month" @select="openBooking" />
      </div>
    </section>

    <ReservationDetailModal v-model="detailOpen" :booking-id="bookingId" />
  </div>
</template>
