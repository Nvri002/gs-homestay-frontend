<script setup>
import { reactive, watch } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { addDaysISO, todayISO } from '@/utils/format'
import { validateSearch } from '@/utils/search'

const props = defineProps({
  initial: { type: Object, default: () => ({}) }, // { check_in, check_out, guests }
  serverErrors: { type: Object, default: () => ({}) }, // pesan 422 per field
  submitText: { type: String, default: 'Cari Kamar' },
  loading: Boolean,
})
const emit = defineEmits(['submit'])

const today = todayISO()
const form = reactive({
  check_in: props.initial.check_in || today,
  check_out: props.initial.check_out || addDaysISO(props.initial.check_in || today, 1),
  guests: props.initial.guests || 2,
})
const errors = reactive({})

// Check-out selalu setelah check-in.
watch(
  () => form.check_in,
  (value) => {
    if (value && (!form.check_out || form.check_out <= value)) form.check_out = addDaysISO(value, 1)
  },
)

function submit() {
  for (const k of Object.keys(errors)) delete errors[k]
  const found = validateSearch(form)
  if (Object.keys(found).length) {
    Object.assign(errors, found)
    return
  }
  emit('submit', { check_in: form.check_in, check_out: form.check_out, guests: Number(form.guests) })
}
</script>

<template>
  <form class="grid gap-4 sm:grid-cols-3" novalidate @submit.prevent="submit">
    <BaseInput v-model="form.check_in" type="date" label="Check-in" :min="today" :error="errors.check_in || serverErrors.check_in" />
    <BaseInput v-model="form.check_out" type="date" label="Check-out" :min="form.check_in ? addDaysISO(form.check_in, 1) : today" :error="errors.check_out || serverErrors.check_out" />
    <BaseInput v-model="form.guests" type="number" label="Jumlah tamu" min="1" :error="errors.guests || serverErrors.guests" />
    <div class="sm:col-span-3">
      <BaseButton type="submit" :loading="loading">{{ submitText }}</BaseButton>
    </div>
  </form>
</template>
