<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import RoomFormModal from '@/components/host/RoomFormModal.vue'
import ModalKonfirmasi from '@/components/common/ModalKonfirmasi.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ImageWithFallback from '@/components/common/ImageWithFallback.vue'
import Pagination from '@/components/common/Pagination.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { parseApiError } from '@/composables/useApiError'
import { hostHomestayService } from '@/services/hostHomestayService'
import { hostRoomService } from '@/services/hostRoomService'
import { useUiStore } from '@/stores/ui'
import { roomTypeLabel } from '@/utils/constants'
import { formatRupiah } from '@/utils/format'

const ui = useUiStore()
const homestays = ref([])
const homestaysLoaded = ref(false)
const homestayFilter = ref('')
const items = ref([])
const meta = ref(null)
const page = ref(1)
const loading = ref(true)
const error = ref('')
let reqId = 0

const formOpen = ref(false)
const editing = ref(null)
const target = ref(null)
const confirmOpen = ref(false)
const deactError = ref('')

const homestayOptions = computed(() => homestays.value.map((h) => ({ value: h.id, label: h.name })))

async function load() {
  const id = ++reqId
  loading.value = true
  error.value = ''
  try {
    const result = await hostRoomService.list({ homestay_id: homestayFilter.value, page: page.value })
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

onMounted(async () => {
  try {
    homestays.value = await hostHomestayService.all()
  } catch (e) {
    error.value = parseApiError(e).message
  } finally {
    homestaysLoaded.value = true
  }
  if (homestays.value.length) load()
  else loading.value = false
})

watch(homestayFilter, () => {
  page.value = 1
  load()
})

function goPage(p) {
  page.value = p
  load()
}
function openCreate() {
  editing.value = null
  formOpen.value = true
}
function openEdit(r) {
  editing.value = r
  formOpen.value = true
}
function askDeactivate(r) {
  target.value = r
  deactError.value = ''
  confirmOpen.value = true
}

const { loading: deactivating, run: deactivate } = useAsyncAction(async () => {
  deactError.value = ''
  try {
    const res = await hostRoomService.deactivate(target.value.id)
    ui.notify(res?.message || 'Kamar dinonaktifkan.', 'success')
    confirmOpen.value = false
    load()
  } catch (e) {
    deactError.value = parseApiError(e).message // 409: masih ada reservasi aktif
  }
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-ink">Kelola Data Kamar</h1>
        <p class="mt-1 text-muted">Tambah, ubah, atau nonaktifkan kamar di homestay Anda.</p>
      </div>
      <BaseButton v-if="homestays.length" @click="openCreate">Tambah Kamar</BaseButton>
    </div>

    <EmptyState v-if="homestaysLoaded && !homestays.length && !error" class="mt-6" title="Belum ada homestay" description="Buat homestay terlebih dahulu sebelum menambahkan kamar.">
      <RouterLink :to="{ name: 'host-homestay' }" class="inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary hover:bg-primary-hover">Ke Kelola Homestay</RouterLink>
    </EmptyState>

    <template v-else>
      <div v-if="homestays.length" class="mt-6 max-w-sm">
        <BaseSelect v-model="homestayFilter" label="Filter homestay" placeholder="Semua homestay" :options="homestayOptions" />
      </div>

      <section class="mt-6" aria-live="polite">
        <div v-if="loading" class="flex items-center justify-center gap-3 py-16 text-muted"><BaseSpinner size="lg" /> <span>Memuat kamar…</span></div>

        <div v-else-if="error" class="space-y-3">
          <AlertMessage type="error" :message="error" />
          <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
        </div>

        <EmptyState v-else-if="!items.length" title="Belum ada kamar" description="Tambahkan kamar agar tamu dapat memesan.">
          <BaseButton @click="openCreate">Tambah Kamar</BaseButton>
        </EmptyState>

        <template v-else>
          <div class="space-y-4">
            <article v-for="r in items" :key="r.id" class="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
              <div class="aspect-[4/3] w-full overflow-hidden rounded-xl sm:w-40 sm:shrink-0"><ImageWithFallback :src="r.photos[0]" :alt="r.name" /></div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-xl font-bold text-ink">{{ r.name }}</h2>
                  <span class="rounded-full bg-neutral-bg px-3 py-1 text-xs font-semibold text-neutral-fg">{{ roomTypeLabel(r.type) }}</span>
                  <StatusBadge :status="r.status" />
                </div>
                <p class="mt-1 text-muted">{{ r.homestayName }} · maks {{ r.capacity }} tamu</p>
                <p class="mt-1 text-lg font-bold text-ink">{{ formatRupiah(r.pricePerNight) }} <span class="text-sm font-normal text-muted">/ malam</span></p>
                <p v-if="r.facilities.length" class="mt-1 text-sm text-muted">{{ r.facilities.join(', ') }}</p>
              </div>
              <div class="flex gap-2 sm:flex-col">
                <BaseButton variant="outline" size="sm" @click="openEdit(r)">Ubah</BaseButton>
                <BaseButton v-if="r.status === 'aktif'" variant="danger" size="sm" @click="askDeactivate(r)">Nonaktifkan</BaseButton>
              </div>
            </article>
          </div>
          <Pagination :meta="meta" @change="goPage" />
        </template>
      </section>
    </template>

    <RoomFormModal v-model="formOpen" :room="editing" :homestays="homestays" :default-homestay-id="homestayFilter" @saved="load" />

    <ModalKonfirmasi v-model="confirmOpen" title="Nonaktifkan kamar?" confirm-text="Ya, nonaktifkan" danger :loading="deactivating" @confirm="deactivate">
      <p>Kamar <strong class="text-ink">{{ target?.name }}</strong> tidak akan bisa dipesan lagi. Kamar yang masih memiliki reservasi aktif tidak dapat dinonaktifkan.</p>
      <AlertMessage v-if="deactError" type="error" class="mt-3" :message="deactError" />
    </ModalKonfirmasi>
  </div>
</template>
