<script setup>
import { computed, reactive, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import FacilityPicker from '@/components/common/FacilityPicker.vue'
import PhotoUploader from '@/components/common/PhotoUploader.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useFormErrors } from '@/composables/useApiError'
import { hostRoomService } from '@/services/hostRoomService'
import { useUiStore } from '@/stores/ui'
import { ROOM_TYPES } from '@/utils/constants'

const open = defineModel({ type: Boolean, default: false })
const props = defineProps({
  room: { type: Object, default: null }, // null = tambah
  homestays: { type: Array, default: () => [] }, // homestay milik Host
  defaultHomestayId: { type: [Number, String], default: '' },
})
const emit = defineEmits(['saved'])

const ui = useUiStore()
const { message, clear, setFromError, first, firstOf } = useFormErrors()
const form = reactive({ homestay_id: '', name: '', room_type: '', capacity: '', price_per_night: '', description: '', facilities: [], photos: [] })
const localErrors = reactive({})
const isEdit = computed(() => !!props.room)
const err = (f) => localErrors[f] || first(f)
const homestayOptions = computed(() => props.homestays.map((h) => ({ value: h.id, label: h.name })))
const fields = ['homestay_id', 'name', 'room_type', 'capacity', 'price_per_night', 'description']
const hasFieldError = computed(() => fields.some((f) => err(f)) || firstOf('facilities') || firstOf('photos'))

watch(open, (value) => {
  if (!value) return
  clear()
  for (const k of Object.keys(localErrors)) delete localErrors[k]
  const r = props.room
  form.homestay_id = r?.homestayId ?? (props.defaultHomestayId || (props.homestays.length === 1 ? props.homestays[0].id : ''))
  form.name = r?.name ?? ''
  form.room_type = r?.type ?? ''
  form.capacity = r?.capacity ?? ''
  form.price_per_night = r?.pricePerNight ?? ''
  form.description = r?.description ?? ''
  form.facilities = [...(r?.facilities ?? [])]
  form.photos = []
})

const { loading, run: submit } = useAsyncAction(async () => {
  clear()
  for (const k of Object.keys(localErrors)) delete localErrors[k]
  if (!form.homestay_id) localErrors.homestay_id = 'Pilih homestay.'
  if (!form.name.trim()) localErrors.name = 'Nama kamar wajib diisi.'
  if (!form.room_type) localErrors.room_type = 'Pilih tipe kamar.'
  if (!(Number(form.capacity) >= 1)) localErrors.capacity = 'Kapasitas minimal 1 tamu.'
  if (!(Number(form.price_per_night) > 0)) localErrors.price_per_night = 'Harga per malam harus lebih dari 0.'
  if (Object.keys(localErrors).length) return
  try {
    const res = isEdit.value ? await hostRoomService.update(props.room.id, form) : await hostRoomService.create(form)
    ui.notify(res?.message || 'Kamar berhasil disimpan.', 'success')
    open.value = false
    emit('saved')
  } catch (e) {
    setFromError(e)
  }
})
</script>

<template>
  <BaseModal v-model="open" :title="isEdit ? 'Ubah Kamar' : 'Tambah Kamar'" size="lg" :persistent="loading">
    <form id="room-form" class="space-y-4" novalidate @submit.prevent="submit">
      <AlertMessage v-if="message && !hasFieldError" type="error" :message="message" />
      <BaseSelect v-model="form.homestay_id" label="Homestay" required placeholder="Pilih homestay" :options="homestayOptions" :error="err('homestay_id')" />
      <BaseInput v-model="form.name" label="Nama kamar" required :error="err('name')" />
      <div class="grid gap-4 sm:grid-cols-3">
        <BaseSelect v-model="form.room_type" label="Tipe kamar" required placeholder="Pilih tipe" :options="ROOM_TYPES" :error="err('room_type')" />
        <BaseInput v-model="form.capacity" type="number" min="1" label="Kapasitas (tamu)" required :error="err('capacity')" />
        <BaseInput v-model="form.price_per_night" type="number" min="0" label="Harga per malam (Rp)" required :error="err('price_per_night')" />
      </div>
      <BaseInput v-model="form.description" type="textarea" :rows="3" label="Deskripsi" :error="err('description')" />
      <FacilityPicker v-model="form.facilities" :error="firstOf('facilities')" :disabled="loading" />
      <PhotoUploader v-model="form.photos" :label="isEdit ? 'Foto baru (opsional — jika diisi, menggantikan foto lama)' : 'Foto kamar'" :existing="room?.photos || []" :error="firstOf('photos')" :disabled="loading" />
    </form>
    <template #footer>
      <BaseButton variant="outline" :disabled="loading" @click="open = false">Batal</BaseButton>
      <BaseButton type="submit" form="room-form" :loading="loading">Simpan</BaseButton>
    </template>
  </BaseModal>
</template>
