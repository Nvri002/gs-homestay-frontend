<script setup>
// Laporan Pendapatan: dipakai Host (/host/reports/revenue) dan Pengawas (/admin/reports/revenue).
import { computed, onMounted, reactive, ref } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useFormErrors } from '@/composables/useApiError'
import { adminUserService } from '@/services/adminUserService'
import { reportService } from '@/services/reportService'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/utils/constants'
import { currentMonth, formatRupiah, formatTanggal, todayISO } from '@/utils/format'

const auth = useAuthStore()
const scope = computed(() => (auth.role === ROLES.PENGAWAS ? 'admin' : 'host'))

const PERIODS = [
  { value: 'daily', label: 'Harian' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'range', label: 'Rentang tanggal' },
]

const form = reactive({
  host_id: '',
  period: 'monthly',
  date: todayISO(),
  month: currentMonth(),
  start_date: `${currentMonth()}-01`,
  end_date: todayISO(),
})
const localErrors = reactive({})
const { message, clear, setFromError, first } = useFormErrors()
const err = (f) => localErrors[f] || first(f)

const result = ref(null)
const loadedOnce = ref(false)

function validate() {
  for (const k of Object.keys(localErrors)) delete localErrors[k]
  if (form.period === 'daily' && !form.date) localErrors.date = 'Tanggal wajib diisi.'
  if (form.period === 'monthly' && !/^\d{4}-\d{2}$/.test(form.month)) localErrors.month = 'Pilih bulan (format YYYY-MM).'
  if (form.period === 'range') {
    if (!form.start_date) localErrors.start_date = 'Tanggal mulai wajib diisi.'
    if (!form.end_date) localErrors.end_date = 'Tanggal akhir wajib diisi.'
    if (form.start_date && form.end_date && form.end_date < form.start_date) localErrors.end_date = 'Tanggal akhir tidak boleh sebelum tanggal mulai.'
  }
  return Object.keys(localErrors).length === 0
}

const { loading, run: show } = useAsyncAction(async () => {
  clear()
  if (!validate()) return
  try {
    result.value = await reportService.revenue(scope.value, form)
    loadedOnce.value = true
  } catch (e) {
    setFromError(e)
  }
})

const hosts = ref([])
const hostOptions = computed(() => hosts.value.map((h) => ({ value: h.id, label: h.name })))
const showHostCol = computed(() => !!result.value?.items.some((i) => i.hostName))

onMounted(async () => {
  show()
  if (scope.value === 'admin') {
    try {
      hosts.value = await adminUserService.hosts()
    } catch {
      /* filter host bersifat opsional */
    }
  }
})

const hasFieldError = computed(() => ['host_id', 'period', 'date', 'month', 'start_date', 'end_date'].some((f) => err(f)))
const isEmpty = computed(() => result.value && !result.value.items.length)
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-ink">Laporan Pendapatan</h1>
    <p class="mt-1 text-muted">Pendapatan dihitung dari reservasi yang berstatus Terkonfirmasi.</p>

    <form class="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6" novalidate @submit.prevent="show">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BaseSelect v-if="scope === 'admin'" v-model="form.host_id" label="Host" placeholder="Semua host" :options="hostOptions" :error="err('host_id')" />
        <BaseSelect v-model="form.period" label="Periode" :options="PERIODS" :error="err('period')" />
        <BaseInput v-if="form.period === 'daily'" v-model="form.date" type="date" label="Tanggal" :error="err('date')" />
        <BaseInput v-if="form.period === 'monthly'" v-model="form.month" type="month" label="Bulan" placeholder="YYYY-MM" :error="err('month')" />
        <template v-if="form.period === 'range'">
          <BaseInput v-model="form.start_date" type="date" label="Dari tanggal" :error="err('start_date')" />
          <BaseInput v-model="form.end_date" type="date" label="Sampai tanggal" :error="err('end_date')" />
        </template>
      </div>
      <AlertMessage v-if="message && !hasFieldError" type="error" class="mt-4" :message="message" />
      <div class="mt-5"><BaseButton type="submit" :loading="loading">Tampilkan</BaseButton></div>
    </form>

    <section class="mt-6" aria-live="polite">
      <div v-if="loading && !loadedOnce" class="flex items-center justify-center gap-3 py-16 text-muted"><BaseSpinner size="lg" /> <span>Memuat laporan…</span></div>

      <template v-else-if="result">
        <p v-if="result.label" class="mb-3 text-lg font-semibold text-ink">Periode: {{ result.label }}</p>

        <div :class="['grid gap-4 sm:grid-cols-2', loading ? 'opacity-60' : '']">
          <div class="rounded-2xl border border-line bg-surface p-5">
            <p class="text-sm text-muted">Total pendapatan</p>
            <p class="mt-1 text-3xl font-bold text-primary">{{ formatRupiah(result.totalRevenue) }}</p>
          </div>
          <div class="rounded-2xl border border-line bg-surface p-5">
            <p class="text-sm text-muted">Reservasi Terkonfirmasi</p>
            <p class="mt-1 text-3xl font-bold text-ink">{{ result.totalBookings }}</p>
          </div>
        </div>

        <EmptyState v-if="isEmpty" class="mt-6" title="Tidak ada data" :description="result.message || 'Tidak ada data pada periode ini'" />

        <template v-else>
          <p class="mt-6 text-xs text-muted sm:hidden">Geser tabel ke samping untuk melihat seluruh kolom.</p>
          <div class="mt-2 max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-line bg-surface sm:mt-6" tabindex="0" role="region" aria-label="Tabel rincian pendapatan (dapat digulir ke samping)">
          <table class="min-w-full text-left text-sm">
            <caption class="sr-only">Rincian pendapatan per reservasi</caption>
            <thead class="bg-field text-muted">
              <tr>
                <th scope="col" class="sticky left-0 bg-field px-4 py-3 font-semibold">Kode</th>
                <th scope="col" class="px-4 py-3 font-semibold">Homestay / Kamar</th>
                <th v-if="showHostCol" scope="col" class="px-4 py-3 font-semibold">Host</th>
                <th scope="col" class="px-4 py-3 font-semibold">Tamu</th>
                <th scope="col" class="px-4 py-3 font-semibold">Check-in</th>
                <th scope="col" class="px-4 py-3 font-semibold">Check-out</th>
                <th scope="col" class="px-4 py-3 text-right font-semibold">Malam</th>
                <th scope="col" class="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in result.items" :key="i.bookingId ?? i.code" class="border-t border-line">
                <td class="sticky left-0 whitespace-nowrap bg-surface px-4 py-3 font-semibold text-ink">{{ i.code }}</td>
                <td class="px-4 py-3 text-ink">{{ i.homestay }}<br /><span class="text-muted">{{ i.room }}</span></td>
                <td v-if="showHostCol" class="px-4 py-3 text-ink">{{ i.hostName }}</td>
                <td class="px-4 py-3 text-ink">{{ i.guestName }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-ink">{{ formatTanggal(i.checkIn) }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-ink">{{ formatTanggal(i.checkOut) }}</td>
                <td class="px-4 py-3 text-right text-ink">{{ i.nights }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-right font-semibold text-ink">{{ formatRupiah(i.totalPrice) }}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </template>
      </template>
    </section>
  </div>
</template>
