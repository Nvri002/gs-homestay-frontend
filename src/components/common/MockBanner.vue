<script setup>
// Panel alat bantu MODE DEMO (hanya tampil bila VITE_USE_MOCK=true).
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from './BaseButton.vue'
import { OFFLINE_KEY } from '@/mocks/adapter'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, OTHER_ACCOUNTS } from '@/mocks/accounts'
import { parseApiError } from '@/composables/useApiError'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const open = ref(false)
const busy = ref(false)
const offline = ref(localStorage.getItem(OFFLINE_KEY) === '1')

async function loginAs(account) {
  if (busy.value) return
  busy.value = true
  try {
    if (auth.isAuthenticated) await auth.logout()
    await auth.login({ email: account.email, password: DEMO_PASSWORD })
    await router.push(auth.homeRoute)
    ui.notify(`Masuk sebagai ${account.role}.`, 'success', 2500)
    open.value = false
  } catch (e) {
    ui.notify(parseApiError(e).message, 'error')
  } finally {
    busy.value = false
  }
}

async function resetData() {
  if (!window.confirm('Kembalikan seluruh data demo ke kondisi awal? Pemesanan dan perubahan Anda akan hilang.')) return
  const { resetMockDb } = await import('@/mocks/db.js')
  await resetMockDb()
  auth.clearSession()
  sessionStorage.clear()
  localStorage.removeItem(OFFLINE_KEY)
  window.location.assign('/')
}

async function expireSession() {
  const { revokeAllTokens } = await import('@/mocks/db.js')
  revokeAllTokens()
  ui.notify('Sesi dicabut. Buka halaman atau lakukan aksi berikutnya untuk melihat alur 401.', 'info')
}

function toggleOffline() {
  offline.value = !offline.value
  if (offline.value) localStorage.setItem(OFFLINE_KEY, '1')
  else localStorage.removeItem(OFFLINE_KEY)
  ui.notify(offline.value ? 'Server dimatikan (simulasi). Request akan gagal.' : 'Server dihidupkan kembali.', 'info', 2500)
}
</script>

<template>
  <div class="fixed bottom-4 left-4 z-[55]">
    <button
      v-if="!open"
      type="button"
      class="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-lg hover:bg-field"
      aria-label="Buka panel mode demo"
      @click="open = true"
    >
      <span class="size-2.5 rounded-full" :class="offline ? 'bg-red-600' : 'bg-primary'" /> Mode Demo
    </button>

    <section v-else class="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-4 shadow-xl" aria-label="Panel mode demo">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="font-bold text-ink">Mode Demo</h2>
          <p class="text-xs text-muted">Data tiruan, tersimpan di browser ini. Tidak terhubung ke backend.</p>
        </div>
        <button type="button" class="rounded-lg px-2 py-1 text-muted hover:bg-field" aria-label="Tutup panel" @click="open = false">✕</button>
      </div>

      <p class="mt-3 text-sm font-semibold text-ink">Masuk cepat</p>
      <div class="mt-2 grid gap-2">
        <BaseButton v-for="a in DEMO_ACCOUNTS" :key="a.email" variant="outline" size="sm" :disabled="busy" @click="loginAs(a)">
          {{ a.role }} <span class="font-normal text-muted">· {{ a.name }}</span>
        </BaseButton>
      </div>
      <p class="mt-2 text-xs text-muted">
        Kata sandi semua akun: <code class="font-bold text-ink">{{ DEMO_PASSWORD }}</code>.
        Akun lain: <template v-for="(o, i) in OTHER_ACCOUNTS" :key="o.email">{{ o.email }} ({{ o.role }})<template v-if="i < OTHER_ACCOUNTS.length - 1">, </template></template>.
      </p>

      <p class="mt-4 text-sm font-semibold text-ink">Uji skenario</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <BaseButton variant="outline" size="sm" @click="expireSession">Cabut sesi (uji 401)</BaseButton>
        <BaseButton :variant="offline ? 'danger-solid' : 'outline'" size="sm" @click="toggleOffline">{{ offline ? 'Hidupkan server' : 'Matikan server' }}</BaseButton>
        <BaseButton variant="danger" size="sm" @click="resetData">Reset data demo</BaseButton>
      </div>
    </section>
  </div>
</template>
