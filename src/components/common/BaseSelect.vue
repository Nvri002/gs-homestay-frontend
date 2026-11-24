<script setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const model = defineModel()
const props = defineProps({
  label: String,
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: String,
  error: String,
  hint: String,
  required: Boolean,
  id: String,
})

const uid = props.id || `s-${Math.random().toString(36).slice(2, 9)}`

const fieldClasses = computed(() => [
  'w-full rounded-xl border bg-field px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60',
  props.error ? 'border-bad-fg' : 'border-line',
])
</script>

<template>
  <div>
    <label v-if="label" :for="uid" class="mb-1.5 block text-sm font-semibold text-ink">
      {{ label }}<span v-if="required" class="text-bad-fg"> *</span>
    </label>
    <select :id="uid" v-model="model" :class="fieldClasses" :aria-invalid="!!error" v-bind="$attrs">
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <p v-if="error" class="mt-1.5 text-sm text-bad-fg" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-sm text-muted">{{ hint }}</p>
  </div>
</template>
