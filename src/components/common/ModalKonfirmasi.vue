<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const open = defineModel({ type: Boolean, default: false })
defineProps({
  title: { type: String, default: 'Konfirmasi' },
  message: String,
  confirmText: { type: String, default: 'Ya, lanjutkan' },
  cancelText: { type: String, default: 'Batal' },
  danger: Boolean,
  loading: Boolean,
})
const emit = defineEmits(['confirm'])
</script>

<template>
  <BaseModal v-model="open" :title="title" size="sm" :persistent="loading">
    <div class="text-muted"><slot>{{ message }}</slot></div>
    <template #footer>
      <BaseButton variant="outline" :disabled="loading" @click="open = false">{{ cancelText }}</BaseButton>
      <BaseButton :variant="danger ? 'danger-solid' : 'primary'" :loading="loading" @click="emit('confirm')">{{ confirmText }}</BaseButton>
    </template>
  </BaseModal>
</template>
