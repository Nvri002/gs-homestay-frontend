<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchForm from '@/components/booking/SearchForm.vue'
import RoomFilters from '@/components/booking/RoomFilters.vue'
import RoomCard from '@/components/booking/RoomCard.vue'
import ModalDetailKamar from '@/components/booking/ModalDetailKamar.vue'
import Pagination from '@/components/common/Pagination.vue'
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

// Seluruh kriteria pencarian disimpan di URL (bisa di-refresh / dibagikan).
const search = computed(() => readSearch(route.query))
const searchInvalid = computed(() => Object.keys(validateSearch(search.value)).length > 0)
const nights = computed(() => nightsBetween(search.value.check_in, search.value.check_out))
const filters = computed(() => ({
  room_type: typeof route.query.room_type === 'string' ? route.query.room_type : '',
  min_price: typeof route.query.min_price === 'string' ? route.query.min_price : '',
  max_price: typeof route.query.max_price === 'string' ? route.query.max_price : '',
  facilities: typeof route.query.facilities === 'string' ? route.query.facilities.split(',').filter(Boolean) : [],
}))
const page = computed(() => Number(route.query.page) || 1)

const rooms = ref([])
const meta = ref(null)
const loading = ref(false)
const error = ref('')
const editing = ref(false)
const selected = ref(null)
const showDetail = ref(false)
let reqId = 0

const serverErrors = computed(() => ({ check_in: first('check_in'), check_out: first('check_out'), guests: first('guests') }))

async function load() {
  if (route.name !== 'hasil') return
  error.value = ''
  clear()
  if (searchInvalid.value) {
    rooms.value = []
    meta.value = null
    editing.value = true
    return
  }
  const id = ++reqId
  loading.value = true
  try {
    const result = await homestayService.list({ ...search.value, ...filters.value, page: page.value })
    if (id !== reqId) return
    rooms.value = result.items.flatMap((h) => h.rooms)
    meta.value = result.meta
  } catch (e) {
    if (id !== reqId) return
    rooms.value = []
    error.value = setFromError(e).message
  } finally {
    if (id === reqId) loading.value = false
  }
}

watch(() => route.fullPath, load, { immediate: true })

function pushQuery(patch) {
  const merged = { ...route.query, ...patch }
  for (const k of Object.keys(merged)) if (merged[k] === '' || merged[k] == null) delete merged[k]
  router.push({ name: 'hasil', query: merged })
}

function onSearch(s) {
  editing.value = false
  pushQuery({ ...toSearchQuery(s), page: undefined })
}

function applyFilters(f) {
  pushQuery({ room_type: f.room_type, min_price: f.min_price, max_price: f.max_price, facilities: f.facilities.join(','), page: undefined })
}

function resetFilters() {
  pushQuery({ room_type: undefined, min_price: undefined, max_price: undefined, facilities: undefined, page: undefined })
}

function goPage(p) {
  pushQuery({ page: p > 1 ? String(p) : undefined })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openDetail(room) {
  selected.value = room
  showDetail.value = true
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-ink">Hasil Pencarian</h1>
        <p v-if="!searchInvalid" class="mt-1 text-muted">
          {{ formatTanggal(search.check_in) }} sampai {{ formatTanggal(search.check_out) }} · {{ nights }} malam · {{ search.guests }} tamu
        </p>
      </div>
      <BaseButton variant="outline" @click="editing = !editing">Ubah pencarian</BaseButton>
    </div>

    <div v-if="editing" class="mt-6 rounded-2xl border border-line bg-surface p-6">
      <AlertMessage v-if="searchInvalid" type="warning" class="mb-4" message="Tanggal atau jumlah tamu belum valid. Perbarui pencarian Anda." />
      <SearchForm :initial="search" :server-errors="serverErrors" @submit="onSearch" />
    </div>

    <RoomFilters class="mt-6" :model-value="filters" @apply="applyFilters" @reset="resetFilters" />

    <section class="mt-6" aria-live="polite">
      <div v-if="loading" class="flex items-center justify-center gap-3 py-16 text-muted">
        <BaseSpinner size="lg" /> <span>Mencari kamar…</span>
      </div>

      <div v-else-if="error" class="space-y-3">
        <AlertMessage type="error" :message="error" />
        <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
      </div>

      <EmptyState v-else-if="!searchInvalid && !rooms.length" title="Tidak ada kamar yang cocok" description="Coba ubah tanggal, jumlah tamu, atau filter pencarian." />

      <template v-else-if="rooms.length">
        <div class="space-y-4">
          <RoomCard
            v-for="r in rooms"
            :key="`${r.homestay?.id}-${r.id}`"
            :room="r"
            :search="search"
            :nights="nights"
            show-detail
            @detail="openDetail"
            @book="bookRoom($event, search)"
          />
        </div>
        <Pagination :meta="meta" @change="goPage" />
      </template>
    </section>

    <ModalDetailKamar v-model="showDetail" :room="selected" :nights="nights" @book="(r) => { showDetail = false; bookRoom(r, search) }" />
  </div>
</template>
