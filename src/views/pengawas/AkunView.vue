<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AkunFormModal from '@/components/pengawas/AkunFormModal.vue'
import ModalKonfirmasi from '@/components/common/ModalKonfirmasi.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Pagination from '@/components/common/Pagination.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { parseApiError } from '@/composables/useApiError'
import { adminUserService } from '@/services/adminUserService'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROLE_LABEL } from '@/utils/constants'
import { copyText } from '@/utils/clipboard'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const str = (k) => (typeof route.query[k] === 'string' ? route.query[k] : '')
const role = computed(() => str('role'))
const status = computed(() => str('status'))
const search = computed(() => str('search'))
const page = computed(() => Number(route.query.page) || 1)

const ROLE_OPTIONS = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))
const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
]

const searchInput = ref(search.value)
watch(search, (v) => (searchInput.value = v))

const items = ref([])
const meta = ref(null)
const loading = ref(true)
const error = ref('')
let reqId = 0

async function load() {
  if (route.name !== 'pengawas-akun') return
  const id = ++reqId
  loading.value = true
  error.value = ''
  try {
    const result = await adminUserService.list({ role: role.value, status: status.value, search: search.value, page: page.value })
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

function pushQuery(patch) {
  const q = { ...route.query, ...patch }
  for (const k of Object.keys(q)) if (q[k] === '' || q[k] == null) delete q[k]
  router.push({ name: 'pengawas-akun', query: q })
}
const submitSearch = () => pushQuery({ search: searchInput.value.trim(), page: undefined })
const goPage = (p) => pushQuery({ page: p > 1 ? String(p) : undefined })

// ---- Tambah / ubah ----
const formOpen = ref(false)
const editing = ref(null)
function openCreate() {
  editing.value = null
  formOpen.value = true
}
function openEdit(u) {
  editing.value = u
  formOpen.value = true
}

// ---- Aktifkan / nonaktifkan ----
const statusOpen = ref(false)
const statusTarget = ref(null)
const nextStatus = ref('')
const statusError = ref('')
function askStatus(u) {
  statusTarget.value = u
  nextStatus.value = u.status === 'aktif' ? 'nonaktif' : 'aktif'
  statusError.value = ''
  statusOpen.value = true
}
const { loading: changing, run: changeStatus } = useAsyncAction(async () => {
  statusError.value = ''
  try {
    const res = await adminUserService.setStatus(statusTarget.value.id, nextStatus.value)
    ui.notify(res?.message || 'Status akun diperbarui.', 'success')
    statusOpen.value = false
    load()
  } catch (e) {
    // 409: tidak boleh menonaktifkan akun sendiri -> pesan dari API tampil di modal.
    statusError.value = parseApiError(e).message
  }
})

// ---- Reset kata sandi ----
const resetOpen = ref(false)
const resetTarget = ref(null)
const resetError = ref('')
const tempOpen = ref(false)
const temp = ref(null)
function askReset(u) {
  resetTarget.value = u
  resetError.value = ''
  resetOpen.value = true
}
const { loading: resetting, run: resetPassword } = useAsyncAction(async () => {
  resetError.value = ''
  try {
    temp.value = await adminUserService.resetPassword(resetTarget.value.id)
    resetOpen.value = false
    tempOpen.value = true
  } catch (e) {
    resetError.value = parseApiError(e).message
  }
})
watch(tempOpen, (open) => {
  if (!open) temp.value = null // kata sandi sementara tidak disimpan setelah modal ditutup
})
async function copyTemp() {
  const ok = await copyText(temp.value.temporaryPassword)
  ui.notify(ok ? 'Kata sandi sementara disalin.' : 'Gagal menyalin. Salin secara manual.', ok ? 'success' : 'error', 2500)
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-ink">Kelola Akun Pengguna</h1>
        <p class="mt-1 text-muted">Kelola akun Tamu, Host, dan Pengawas Sistem.</p>
      </div>
      <BaseButton @click="openCreate">Tambah Akun Host</BaseButton>
    </div>

    <div class="mt-6 grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem]">
      <form class="flex items-end gap-2 sm:col-span-2 lg:col-span-1" @submit.prevent="submitSearch">
        <div class="min-w-0 flex-1"><BaseInput v-model="searchInput" label="Cari akun" placeholder="Nama atau email" /></div>
        <BaseButton type="submit">Cari</BaseButton>
      </form>
      <BaseSelect :model-value="role" label="Peran" placeholder="Semua peran" :options="ROLE_OPTIONS" @update:model-value="(v) => pushQuery({ role: v, page: undefined })" />
      <BaseSelect :model-value="status" label="Status" placeholder="Semua status" :options="STATUS_OPTIONS" @update:model-value="(v) => pushQuery({ status: v, page: undefined })" />
    </div>

    <section class="mt-6" aria-live="polite">
      <div v-if="loading" class="flex items-center justify-center gap-3 py-16 text-muted"><BaseSpinner size="lg" /> <span>Memuat akun…</span></div>

      <div v-else-if="error" class="space-y-3">
        <AlertMessage type="error" :message="error" />
        <BaseButton variant="outline" size="sm" @click="load">Coba lagi</BaseButton>
      </div>

      <EmptyState v-else-if="!items.length" title="Akun tidak ditemukan" description="Coba ubah kata kunci atau filter pencarian." />

      <template v-else>
        <div class="space-y-4">
          <article v-for="u in items" :key="u.id" class="rounded-2xl border border-line bg-surface p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-xl font-bold text-ink">{{ u.name }}<span v-if="u.id === auth.user?.id" class="ml-1 text-sm font-medium text-muted">(Anda)</span></h2>
                  <span class="rounded-full bg-neutral-bg px-3 py-1 text-xs font-semibold text-neutral-fg">{{ ROLE_LABEL[u.role] || u.role }}</span>
                  <StatusBadge :status="u.status" />
                </div>
                <p class="mt-1 break-all text-ink">{{ u.email }}</p>
                <p class="text-sm text-muted">{{ u.phone || '-' }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <BaseButton variant="outline" size="sm" @click="openEdit(u)">Ubah</BaseButton>
                <BaseButton variant="outline" size="sm" @click="askReset(u)">Reset Kata Sandi</BaseButton>
                <BaseButton :variant="u.status === 'aktif' ? 'danger' : 'primary'" size="sm" @click="askStatus(u)">
                  {{ u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan' }}
                </BaseButton>
              </div>
            </div>
          </article>
        </div>
        <Pagination :meta="meta" @change="goPage" />
      </template>
    </section>

    <AkunFormModal v-model="formOpen" :user="editing" @saved="load" />

    <ModalKonfirmasi
      v-model="statusOpen"
      :title="nextStatus === 'nonaktif' ? 'Nonaktifkan akun?' : 'Aktifkan akun?'"
      :confirm-text="nextStatus === 'nonaktif' ? 'Ya, nonaktifkan' : 'Ya, aktifkan'"
      :danger="nextStatus === 'nonaktif'"
      :loading="changing"
      @confirm="changeStatus"
    >
      <p v-if="nextStatus === 'nonaktif'">Akun <strong class="text-ink">{{ statusTarget?.name }}</strong> tidak dapat masuk ke sistem sampai diaktifkan kembali.</p>
      <p v-else>Akun <strong class="text-ink">{{ statusTarget?.name }}</strong> akan dapat masuk ke sistem kembali.</p>
      <AlertMessage v-if="statusError" type="error" class="mt-3" :message="statusError" />
    </ModalKonfirmasi>

    <ModalKonfirmasi v-model="resetOpen" title="Reset kata sandi?" confirm-text="Ya, reset" danger :loading="resetting" @confirm="resetPassword">
      <p>Kata sandi akun <strong class="text-ink">{{ resetTarget?.name }}</strong> akan diganti dengan kata sandi sementara. Kata sandi lama tidak berlaku lagi.</p>
      <AlertMessage v-if="resetError" type="error" class="mt-3" :message="resetError" />
    </ModalKonfirmasi>

    <BaseModal v-model="tempOpen" title="Kata sandi sementara" size="sm">
      <template v-if="temp">
        <p class="text-muted">Kata sandi baru untuk <strong class="text-ink">{{ temp.name }}</strong> ({{ temp.email }}):</p>
        <div class="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-field px-4 py-3">
          <code class="break-all text-xl font-bold tracking-wider text-ink select-all">{{ temp.temporaryPassword }}</code>
          <BaseButton variant="outline" size="sm" @click="copyTemp">Salin</BaseButton>
        </div>
        <AlertMessage type="warning" class="mt-4" message="Salin dan sampaikan kepada pengguna. Kata sandi ini tidak akan ditampilkan lagi setelah jendela ini ditutup." />
      </template>
      <template #footer>
        <BaseButton @click="tempOpen = false">Tutup</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
