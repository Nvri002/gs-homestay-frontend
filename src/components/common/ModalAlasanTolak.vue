<script setup>
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'

const open = defineModel({ type: Boolean, default: false })
const props = defineProps({
  title: { type: String, default: 'Tolak' },
  label: { type: String, default: 'Alasan penolakan' },
  submitText: { type: String, default: 'Tolak' },
  loading: Boolean,
  error: String, // error dari API (mis. errors.reason[0] atau pesan 409)
})
const emit = defineEmits(['submit'])

const reason = ref('')
const localError = ref('')

watch(open, (value) => {
  if (value) {
    reason.value = ''
    localError.value = ''
  }
})

function submit() {
  const text = reason.value.trim()
  if (!text) {
    localError.value = `${props.label} wajib diisi.`
    return
  }
  localError.value = ''
  emit('submit', text)
}
</script>

<template>
  <BaseModal v-model="open" :title="title" :persistent="loading">
    <BaseInput v-model="reason" type="textarea" :rows="4" :label="label" required :error="localError || error" placeholder="Tulis alasan secara jelas" />
    <template #footer>
      <BaseButton variant="outline" :disabled="loading" @click="open = false">Batal</BaseButton>
      <BaseButton variant="danger-solid" :loading="loading" @click="submit">{{ submitText }}</BaseButton>
    </template>
  </BaseModal>
</template>
