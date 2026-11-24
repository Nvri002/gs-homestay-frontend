<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchForm from '@/components/booking/SearchForm.vue'
import HomestayCard from '@/components/booking/HomestayCard.vue'
import Pagination from '@/components/common/Pagination.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { parseApiError } from '@/composables/useApiError'
import { homestayService } from '@/services/homestayService'
import { toSearchQuery } from '@/utils/search'

const router = useRouter()
const items = ref([])
const meta = ref(null)
const page = ref(1)
const loading = ref(true)
const error = ref('')
let reqId = 0

async function load() {
  const id = ++reqId
  loading.value = true
  error.value = ''
  try {
    const result = await homestayService.list({ page: page.value })
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

function goPage(p) {
  page.value = p
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function search(s) {
  router.push({ name: 'hasil', query: toSearchQuery(s) })
}

onMounted(load)
</script>

<template>
  <div>
    <section class="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h1 class="text-3xl font-bold text-ink">Cari kamar di Pekanbaru</h1>
      <p class="mt-2 text-muted">Pilih tanggal dan jumlah tamu untuk melihat kamar yang tersedia.</p>
      <div class="mt-6"><SearchForm @submit="search" /></div>
    </section>

    <section class="mt-8" aria-live="polite">
      <div v-if="loading" class="flex items-center justify-center gap-3 py-16 text-muted">
        <BaseSpinner size="lg" /> <span>Memuat homestay…</span>
      </div>

      <div v-else-if="error" class="space-y-3">
        <AlertMessage type="error" :message="error" />
        <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
      </div>

      <EmptyState v-else-if="!items.length" title="Belum ada homestay" description="Homestay yang aktif akan muncul di sini." />

      <template v-else>
        <div class="grid gap-6 sm:grid-cols-2">
          <HomestayCard v-for="h in items" :key="h.id" :homestay="h" />
        </div>
        <Pagination :meta="meta" @change="goPage" />
      </template>
    </section>
  </div>
</template>
