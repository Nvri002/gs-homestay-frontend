<script setup>
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useFormErrors } from '@/composables/useApiError'
import { useAuthStore } from '@/stores/auth'
import { safeRedirect } from '@/utils/navigation'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Email terisi otomatis setelah registrasi (?email=...).
const form = reactive({ email: typeof route.query.email === 'string' ? route.query.email : '', password: '' })
const justRegistered = route.query.registered === '1'
const { errors, message, clear, setFromError, first } = useFormErrors()

const { loading, run: submit } = useAsyncAction(async () => {
  clear()
  try {
    await auth.login({ email: form.email.trim(), password: form.password })
    // Kembali ke halaman asal (mis. tombol Pesan) atau ke menu sesuai peran.
    router.replace(safeRedirect(route.query.redirect) || auth.homeRoute)
  } catch (e) {
    setFromError(e)
    form.password = ''
  }
})
</script>

<template>
  <section class="mx-auto w-full max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8">
    <h1 class="text-3xl font-bold text-ink">Masuk</h1>
    <p class="mt-2 text-muted">Masuk sebagai Tamu, Host, atau Pengawas Sistem.</p>

    <AlertMessage v-if="justRegistered && !message" type="success" class="mt-5" message="Registrasi berhasil. Silakan masuk dengan akun Anda." />
    <AlertMessage v-if="message && !Object.keys(errors).length" type="error" class="mt-5" :message="message" />

    <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
      <BaseInput v-model="form.email" type="email" label="Email" autocomplete="email" :error="first('email')" />
      <BaseInput v-model="form.password" type="password" label="Kata sandi" autocomplete="current-password" :error="first('password')" />
      <BaseButton type="submit" block :loading="loading">Masuk</BaseButton>
    </form>

    <p class="mt-5 text-muted">
      Belum punya akun?
      <RouterLink :to="{ name: 'register' }" class="font-medium text-primary underline underline-offset-4">Daftar sebagai tamu</RouterLink>
    </p>
  </section>
</template>
