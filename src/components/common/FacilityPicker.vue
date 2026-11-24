<script setup>
import { FACILITY_OPTIONS } from '@/utils/constants'

const model = defineModel({ type: Array, default: () => [] })
defineProps({
  label: { type: String, default: 'Fasilitas' },
  options: { type: Array, default: () => FACILITY_OPTIONS },
  error: String,
  disabled: Boolean,
})
</script>

<template>
  <fieldset :disabled="disabled">
    <legend class="mb-2 text-sm font-semibold text-ink">{{ label }}</legend>
    <div class="flex flex-wrap gap-2">
      <label
        v-for="f in options"
        :key="f"
        :class="['cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition', model.includes(f) ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:bg-field']"
      >
        <input v-model="model" type="checkbox" :value="f" class="sr-only" />
        {{ f }}
      </label>
    </div>
    <p v-if="error" class="mt-1.5 text-sm text-bad-fg" role="alert">{{ error }}</p>
  </fieldset>
</template>
