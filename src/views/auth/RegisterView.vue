<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useFormErrors } from '@/composables/useApiError'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const form = reactive({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
const localErrors = reactive({})
const { errors, message, clear, setFromError, first } = useFormErrors()

// Pesan lokal didahulukan, lalu pesan 422 dari API.
const err = (field) => localErrors[field] || first(field)

function validate() {
  for (const k of Object.keys(localErrors)) delete localErrors[k]
  if (!form.name.trim()) localErrors.name = 'Nama lengkap wajib diisi.'
  if (!form.email.trim()) localErrors.email = 'Email wajib diisi.'
  if (!form.phone.trim()) localErrors.phone = 'Nomor HP wajib diisi.'
  if (form.password.length < 8) localErrors.password = 'Kata sandi minimal 8 karakter.'
  if (form.password_confirmation !== form.password) localErrors.password_confirmation = 'Konfirmasi kata sandi tidak sama.'
  return Object.keys(localErrors).length === 0
}

const { loading, run: submit } = useAsyncAction(async () => {
  clear()
  if (!validate()) return
  try {
    await auth.register({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      password_confirmation: form.password_confirmation,
    })
    ui.notify('Registrasi berhasil. Silakan masuk.', 'success')
    router.push({ name: 'login', query: { email: form.email.trim(), registered: '1' } })
  } catch (e) {
    setFromError(e)
  }
})
</script>

<template>
  <section class="mx-auto w-full max-w-lg rounded-2xl border border-line bg-surface p-6 sm:p-8">
    <h1 class="text-3xl font-bold text-ink">Daftar Tamu</h1>
    <p class="mt-2 text-muted">Buat akun untuk memesan kamar.</p>

    <AlertMessage v-if="message && !Object.keys(errors).length" type="error" class="mt-5" :message="message" />

    <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
      <BaseInput v-model="form.name" label="Nama lengkap" autocomplete="name" :error="err('name')" />
      <BaseInput v-model="form.email" type="email" label="Email" autocomplete="email" :error="err('email')" />
      <BaseInput v-model="form.phone" type="tel" label="Nomor HP" placeholder="08xxxxxxxxxx" autocomplete="tel" :error="err('phone')" />
      <BaseInput v-model="form.password" type="password" label="Kata sandi" hint="Minimal 8 karakter." autocomplete="new-password" :error="err('password')" />
      <BaseInput v-model="form.password_confirmation" type="password" label="Ulangi kata sandi" autocomplete="new-password" :error="err('password_confirmation')" />
      <BaseButton type="submit" block :loading="loading">Daftar</BaseButton>
    </form>

    <p class="mt-5 text-muted">
      Sudah punya akun?
      <RouterLink :to="{ name: 'login' }" class="font-medium text-primary underline underline-offset-4">Masuk</RouterLink>
    </p>
  </section>
</template>
