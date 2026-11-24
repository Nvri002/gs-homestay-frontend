<script setup>
import { computed, reactive, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useFormErrors } from '@/composables/useApiError'
import { adminUserService } from '@/services/adminUserService'
import { useUiStore } from '@/stores/ui'

const open = defineModel({ type: Boolean, default: false })
const props = defineProps({ user: { type: Object, default: null } }) // null = tambah akun Host
const emit = defineEmits(['saved'])

const ui = useUiStore()
const { message, clear, setFromError, first } = useFormErrors()
const form = reactive({ name: '', email: '', phone: '', password: '' })
const localErrors = reactive({})
const isEdit = computed(() => !!props.user)
const err = (f) => localErrors[f] || first(f)
const hasFieldError = computed(() => ['name', 'email', 'phone', 'password'].some((f) => err(f)))

watch(open, (value) => {
  if (!value) return
  clear()
  for (const k of Object.keys(localErrors)) delete localErrors[k]
  form.name = props.user?.name ?? ''
  form.email = props.user?.email ?? ''
  form.phone = props.user?.phone ?? ''
  form.password = ''
})

const { loading, run: submit } = useAsyncAction(async () => {
  clear()
  for (const k of Object.keys(localErrors)) delete localErrors[k]
  if (!form.name.trim()) localErrors.name = 'Nama lengkap wajib diisi.'
  if (!form.email.trim()) localErrors.email = 'Email wajib diisi.'
  if (!form.phone.trim()) localErrors.phone = 'Nomor telepon wajib diisi.'
  if (!isEdit.value && form.password.length < 8) localErrors.password = 'Kata sandi awal minimal 8 karakter.'
  if (Object.keys(localErrors).length) return

  const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() }
  try {
    let res
    if (isEdit.value) res = await adminUserService.update(props.user.id, payload)
    else res = await adminUserService.create({ ...payload, password: form.password })
    ui.notify(res?.message || 'Akun berhasil disimpan.', 'success')
    open.value = false
    emit('saved')
  } catch (e) {
    setFromError(e)
  }
})
</script>

<template>
  <BaseModal v-model="open" :title="isEdit ? 'Ubah Data Akun' : 'Tambah Akun Host'" :persistent="loading">
    <form id="akun-form" class="space-y-4" novalidate @submit.prevent="submit">
      <AlertMessage v-if="message && !hasFieldError" type="error" :message="message" />
      <BaseInput v-model="form.name" label="Nama lengkap" required autocomplete="off" :error="err('name')" />
      <BaseInput v-model="form.email" type="email" label="Email" required autocomplete="off" :error="err('email')" />
      <BaseInput v-model="form.phone" type="tel" label="Nomor telepon" required placeholder="08xxxxxxxxxx" autocomplete="off" :error="err('phone')" />
      <BaseInput v-if="!isEdit" v-model="form.password" type="password" label="Kata sandi awal" required autocomplete="new-password" hint="Minimal 8 karakter. Akun otomatis berperan Host dan berstatus aktif." :error="err('password')" />
    </form>
    <template #footer>
      <BaseButton variant="outline" :disabled="loading" @click="open = false">Batal</BaseButton>
      <BaseButton type="submit" form="akun-form" :loading="loading">Simpan</BaseButton>
    </template>
  </BaseModal>
</template>
