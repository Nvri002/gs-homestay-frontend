<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchForm from '@/components/booking/SearchForm.vue'
import RoomCard from '@/components/booking/RoomCard.vue'
import ImageWithFallback from '@/components/common/ImageWithFallback.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useFormErrors } from '@/composables/useApiError'
import { useBookRoom } from '@/composables/useBookRoom'
import { homestayService } from '@/services/homestayService'
import { formatTanggal, nightsBetween } from '@/utils/format'
import { readSearch, toSearchQuery, validateSearch } from '@/utils/search'

const route = useRoute()
const router = useRouter()
const bookRoom = useBookRoom()
const { setFromError, first, clear } = useFormErrors()

const homestay = ref(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const active = ref(0)
let reqId = 0

const search = computed(() => readSearch(route.query))
const datesChosen = computed(() => Object.keys(validateSearch(search.value, { requireGuests: false })).length === 0)
const nights = computed(() => (datesChosen.value ? nightsBetween(search.value.check_in, search.value.check_out) : 0))
const serverErrors = computed(() => ({ check_in: first('check_in'), check_out: first('check_out'), guests: first('guests') }))

async function load() {
  if (route.name !== 'homestay-detail') return
  const id = ++reqId
  loading.value = true
  error.value = ''
  notFound.value = false
  clear()
  try {
    const params = datesChosen.value ? { check_in: search.value.check_in, check_out: search.value.check_out, guests: search.value.guests } : {}
    const data = await homestayService.detail(route.params.id, params)
    if (id !== reqId) return
    homestay.value = data
    active.value = 0
  } catch (e) {
    if (id !== reqId) return
    const parsed = setFromError(e)
    homestay.value = null
    if (parsed.status === 404) notFound.value = true
    else error.value = parsed.message
  } finally {
    if (id === reqId) loading.value = false
  }
}

watch(() => route.fullPath, load, { immediate: true })

function checkAvailability(s) {
  router.push({ name: 'homestay-detail', params: { id: route.params.id }, query: toSearchQuery(s) })
}

function reasonFor(room) {
  if (!datesChosen.value) return 'Pilih tanggal terlebih dahulu'
  if (room.available === false) return 'Kamar tidak tersedia pada tanggal ini'
  if (search.value.guests && room.capacity && search.value.guests > room.capacity) return `Kapasitas maksimal ${room.capacity} tamu`
  return ''
}

function back() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'beranda' })
}
</script>

<template>
  <div>
    <BaseButton variant="outline" size="sm" @click="back">← Kembali</BaseButton>

    <div v-if="loading && !homestay" class="flex items-center justify-center gap-3 py-24 text-muted" aria-live="polite">
      <BaseSpinner size="lg" /> <span>Memuat homestay…</span>
    </div>

    <div v-else-if="error" class="mt-6 space-y-3">
      <AlertMessage type="error" :message="error" />
      <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
    </div>

    <EmptyState v-else-if="notFound" class="mt-6" title="Homestay tidak ditemukan" description="Homestay ini tidak tersedia atau sudah tidak aktif.">
      <RouterLink :to="{ name: 'beranda' }" class="inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary hover:bg-primary-hover">Cari homestay lain</RouterLink>
    </EmptyState>

    <template v-else-if="homestay">
      <section class="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <div class="aspect-[16/7] overflow-hidden bg-field">
          <ImageWithFallback :src="homestay.photos[active]" :alt="homestay.name" />
        </div>
        <div v-if="homestay.photos.length > 1" class="flex gap-2 overflow-x-auto px-6 pt-4">
          <button
            v-for="(p, i) in homestay.photos"
            :key="p"
            type="button"
            :class="['size-20 shrink-0 overflow-hidden rounded-lg border-2', i === active ? 'border-primary' : 'border-transparent']"
            :aria-label="`Foto ${i + 1}`"
            @click="active = i"
          >
            <ImageWithFallback :src="p" :alt="`Foto ${i + 1}`" />
          </button>
        </div>
        <div class="p-6">
          <h1 class="text-3xl font-bold text-ink">{{ homestay.name }}</h1>
          <p class="mt-1 text-muted">{{ homestay.address }}</p>
          <p v-if="homestay.description" class="mt-4 max-w-3xl text-ink">{{ homestay.description }}</p>
          <p v-if="homestay.facilities.length" class="mt-4 text-sm text-ink">
            <strong>Fasilitas:</strong> {{ homestay.facilities.join(', ') }}
          </p>
        </div>
      </section>

      <section class="mt-6 rounded-2xl border border-line bg-surface p-6">
        <h2 class="text-xl font-bold text-ink">Cek ketersediaan</h2>
        <p class="mb-4 mt-1 text-muted">Pilih tanggal dan jumlah tamu untuk melihat kamar yang tersedia.</p>
        <SearchForm :initial="search" :server-errors="serverErrors" submit-text="Cek ketersediaan" :loading="loading" @submit="checkAvailability" />
      </section>

      <section class="mt-8">
        <h2 class="text-2xl font-bold text-ink">
          Kamar<template v-if="datesChosen"> ({{ formatTanggal(search.check_in) }} – {{ formatTanggal(search.check_out) }})</template>
        </h2>
        <EmptyState v-if="!homestay.rooms.length" class="mt-4" title="Belum ada kamar" description="Homestay ini belum memiliki kamar yang bisa dipesan." />
        <div v-else class="mt-4 space-y-4">
          <RoomCard
            v-for="r in homestay.rooms"
            :key="r.id"
            :room="r"
            :search="search"
            :nights="nights"
            variant="detail"
            :disabled-reason="reasonFor(r)"
            @book="bookRoom($event, search)"
          />
        </div>
      </section>
    </template>
  </div>
</template>
