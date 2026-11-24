<script setup>
import { computed, reactive, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import FacilityPicker from '@/components/common/FacilityPicker.vue'
import PhotoUploader from '@/components/common/PhotoUploader.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useFormErrors } from '@/composables/useApiError'
import { hostHomestayService } from '@/services/hostHomestayService'
import { useUiStore } from '@/stores/ui'

const open = defineModel({ type: Boolean, default: false })
const props = defineProps({ homestay: { type: Object, default: null } }) // null = tambah
const emit = defineEmits(['saved'])

const ui = useUiStore()
const { message, clear, setFromError, first, firstOf } = useFormErrors()
const form = reactive({ name: '', address: '', description: '', contact_phone: '', facilities: [], photos: [] })
const localErrors = reactive({})
const isEdit = computed(() => !!props.homestay)
const err = (f) => localErrors[f] || first(f)
const hasFieldError = computed(() => ['name', 'address', 'description', 'contact_phone'].some((f) => err(f)) || firstOf('facilities') || firstOf('photos'))

watch(open, (value) => {
  if (!value) return
  clear()
  for (const k of Object.keys(localErrors)) delete localErrors[k]
  const h = props.homestay
  form.name = h?.name ?? ''
  form.address = h?.address ?? ''
  form.description = h?.description ?? ''
  form.contact_phone = h?.contactPhone ?? ''
  form.facilities = [...(h?.facilities ?? [])]
  form.photos = []
})

const { loading, run: submit } = useAsyncAction(async () => {
  clear()
  for (const k of Object.keys(localErrors)) delete localErrors[k]
  if (!form.name.trim()) localErrors.name = 'Nama homestay wajib diisi.'
  if (!form.address.trim()) localErrors.address = 'Alamat wajib diisi.'
  if (Object.keys(localErrors).length) return
  try {
    const res = isEdit.value ? await hostHomestayService.update(props.homestay.id, form) : await hostHomestayService.create(form)
    ui.notify(res?.message || 'Homestay berhasil disimpan.', 'success')
    open.value = false
    emit('saved')
  } catch (e) {
    setFromError(e)
  }
})
</script>

<template>
  <BaseModal v-model="open" :title="isEdit ? 'Ubah Homestay' : 'Tambah Homestay'" size="lg" :persistent="loading">
    <form id="homestay-form" class="space-y-4" novalidate @submit.prevent="submit">
      <AlertMessage v-if="message && !hasFieldError" type="error" :message="message" />
      <BaseInput v-model="form.name" label="Nama homestay" required :error="err('name')" />
      <BaseInput v-model="form.address" label="Alamat" required :error="err('address')" />
      <BaseInput v-model="form.description" type="textarea" :rows="3" label="Deskripsi" :error="err('description')" />
      <BaseInput v-model="form.contact_phone" type="tel" label="Nomor kontak" placeholder="08xxxxxxxxxx" :error="err('contact_phone')" />
      <FacilityPicker v-model="form.facilities" :error="firstOf('facilities')" :disabled="loading" />
      <PhotoUploader v-model="form.photos" :label="isEdit ? 'Foto baru (opsional — jika diisi, menggantikan foto lama)' : 'Foto homestay'" :existing="homestay?.photos || []" :error="firstOf('photos')" :disabled="loading" />
    </form>
    <template #footer>
      <BaseButton variant="outline" :disabled="loading" @click="open = false">Batal</BaseButton>
      <BaseButton type="submit" form="homestay-form" :loading="loading">Simpan</BaseButton>
    </template>
  </BaseModal>
</template>
