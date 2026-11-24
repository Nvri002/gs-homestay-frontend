<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Pagination from '@/components/common/Pagination.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { parseApiError } from '@/composables/useApiError'
import { hostBookingService } from '@/services/hostBookingService'
import { hostHomestayService } from '@/services/hostHomestayService'
import { formatRupiah, formatTanggal } from '@/utils/format'
import { STATUS_FILTERS } from '@/utils/statusMap'

const route = useRoute()
const router = useRouter()

// Tanpa ?status= -> tampilkan yang perlu ditindaklanjuti (Pembayaran Terverifikasi). 'semua' = tanpa filter.
const statusKey = computed(() => (typeof route.query.status === 'string' ? route.query.status : 'pembayaran_terverifikasi'))
const status = computed(() => (statusKey.value === 'semua' ? '' : statusKey.value))
const homestayId = computed(() => (typeof route.query.homestay_id === 'string' ? route.query.homestay_id : ''))
const page = computed(() => Number(route.query.page) || 1)

const homestays = ref([])
const homestayOptions = computed(() => homestays.value.map((h) => ({ value: h.id, label: h.name })))
const items = ref([])
const meta = ref(null)
const loading = ref(true)
const error = ref('')
let reqId = 0

async function load() {
  if (route.name !== 'host-reservasi') return
  const id = ++reqId
  loading.value = true
  error.value = ''
  try {
    const result = await hostBookingService.list({ status: status.value, homestay_id: homestayId.value, page: page.value })
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
  router.push({ name: 'host-reservasi', query: q })
}
const setStatus = (value) => pushQuery({ status: value || 'semua', page: undefined })
const setHomestay = (value) => pushQuery({ homestay_id: value, page: undefined })
const goPage = (p) => pushQuery({ page: p > 1 ? String(p) : undefined })
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-ink">Konfirmasi Reservasi</h1>
    <p class="mt-1 text-muted">Reservasi dengan status Pembayaran Terverifikasi menunggu konfirmasi Anda.</p>

    <div class="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter status">
      <button
        v-for="f in STATUS_FILTERS"
        :key="f.value"
        type="button"
        :aria-pressed="statusKey === (f.value || 'semua')"
        :class="['shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition', statusKey === (f.value || 'semua') ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:bg-field']"
        @click="setStatus(f.value)"
      >
        {{ f.label }}
      </button>
    </div>

    <div v-if="homestays.length > 1" class="mt-4 max-w-sm">
      <BaseSelect :model-value="homestayId" label="Homestay" placeholder="Semua homestay" :options="homestayOptions" @update:model-value="setHomestay" />
    </div>

    <section class="mt-5" aria-live="polite">
      <div v-if="loading" class="flex items-center justify-center gap-3 py-16 text-muted"><BaseSpinner size="lg" /> <span>Memuat reservasi…</span></div>

      <div v-else-if="error" class="space-y-3">
        <AlertMessage type="error" :message="error" />
        <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
      </div>

      <EmptyState v-else-if="!items.length" title="Tidak ada reservasi" description="Belum ada reservasi dengan filter yang dipilih." />

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
                <p class="text-sm text-muted">{{ formatTanggal(b.checkIn) }} sampai {{ formatTanggal(b.checkOut) }} · {{ b.nights }} malam</p>
              </div>
              <div class="flex items-center justify-between gap-4 sm:justify-end">
                <div class="sm:text-right">
                  <p class="text-sm text-muted">Total biaya</p>
                  <p class="text-2xl font-bold text-ink">{{ formatRupiah(b.totalPrice) }}</p>
                </div>
                <RouterLink :to="{ name: 'host-reservasi-detail', params: { id: b.id } }" class="shrink-0 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-soft">Lihat Detail</RouterLink>
              </div>
            </div>
          </article>
        </div>
        <Pagination :meta="meta" @change="goPage" />
      </template>
    </section>
  </div>
</template>
