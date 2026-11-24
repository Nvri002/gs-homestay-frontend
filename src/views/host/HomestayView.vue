<script setup>
import { onMounted, ref } from 'vue'
import HomestayFormModal from '@/components/host/HomestayFormModal.vue'
import ModalKonfirmasi from '@/components/common/ModalKonfirmasi.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ImageWithFallback from '@/components/common/ImageWithFallback.vue'
import Pagination from '@/components/common/Pagination.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { parseApiError } from '@/composables/useApiError'
import { hostHomestayService } from '@/services/hostHomestayService'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const items = ref([])
const meta = ref(null)
const page = ref(1)
const loading = ref(true)
const error = ref('')
let reqId = 0

const formOpen = ref(false)
const editing = ref(null)
const target = ref(null) // homestay yang akan dinonaktifkan
const confirmOpen = ref(false)
const deactError = ref('')

async function load() {
  const id = ++reqId
  loading.value = true
  error.value = ''
  try {
    const result = await hostHomestayService.list(page.value)
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
onMounted(load)

function goPage(p) {
  page.value = p
  load()
}
function openCreate() {
  editing.value = null
  formOpen.value = true
}
function openEdit(h) {
  editing.value = h
  formOpen.value = true
}
function askDeactivate(h) {
  target.value = h
  deactError.value = ''
  confirmOpen.value = true
}

const { loading: deactivating, run: deactivate } = useAsyncAction(async () => {
  deactError.value = ''
  try {
    const res = await hostHomestayService.deactivate(target.value.id)
    ui.notify(res?.message || 'Homestay dinonaktifkan.', 'success')
    confirmOpen.value = false
    load()
  } catch (e) {
    // 409: masih ada reservasi aktif -> tampilkan pesan dari API di dalam modal.
    deactError.value = parseApiError(e).message
  }
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-ink">Kelola Data Homestay</h1>
        <p class="mt-1 text-muted">Tambah, ubah, atau nonaktifkan homestay milik Anda.</p>
      </div>
      <BaseButton @click="openCreate">Tambah Homestay</BaseButton>
    </div>

    <section class="mt-6" aria-live="polite">
      <div v-if="loading" class="flex items-center justify-center gap-3 py-16 text-muted"><BaseSpinner size="lg" /> <span>Memuat homestay…</span></div>

      <div v-else-if="error" class="space-y-3">
        <AlertMessage type="error" :message="error" />
        <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
      </div>

      <EmptyState v-else-if="!items.length" title="Belum ada homestay" description="Tambahkan homestay pertama Anda agar bisa mengelola kamar dan menerima pemesanan.">
        <BaseButton @click="openCreate">Tambah Homestay</BaseButton>
      </EmptyState>

      <template v-else>
        <div class="space-y-4">
          <article v-for="h in items" :key="h.id" class="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
            <div class="aspect-[4/3] w-full overflow-hidden rounded-xl sm:w-44 sm:shrink-0"><ImageWithFallback :src="h.coverPhoto" :alt="h.name" /></div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-xl font-bold text-ink">{{ h.name }}</h2>
                <StatusBadge :status="h.status" />
              </div>
              <p class="mt-1 text-muted">{{ h.address }}</p>
              <p class="mt-2 text-sm text-ink">{{ h.roomsCount }} kamar<template v-if="h.contactPhone"> · Kontak {{ h.contactPhone }}</template></p>
              <p v-if="h.facilities.length" class="mt-1 text-sm text-muted">{{ h.facilities.join(', ') }}</p>
            </div>
            <div class="flex gap-2 sm:flex-col">
              <BaseButton variant="outline" size="sm" @click="openEdit(h)">Ubah</BaseButton>
              <BaseButton v-if="h.status === 'aktif'" variant="danger" size="sm" @click="askDeactivate(h)">Nonaktifkan</BaseButton>
            </div>
          </article>
        </div>
        <Pagination :meta="meta" @change="goPage" />
      </template>
    </section>

    <HomestayFormModal v-model="formOpen" :homestay="editing" @saved="load" />

    <ModalKonfirmasi v-model="confirmOpen" title="Nonaktifkan homestay?" confirm-text="Ya, nonaktifkan" danger :loading="deactivating" @confirm="deactivate">
      <p>Homestay <strong class="text-ink">{{ target?.name }}</strong> tidak akan tampil lagi bagi Tamu. Homestay yang masih memiliki reservasi aktif tidak dapat dinonaktifkan.</p>
      <AlertMessage v-if="deactError" type="error" class="mt-3" :message="deactError" />
    </ModalKonfirmasi>
  </div>
</template>
