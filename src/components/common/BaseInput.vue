<script setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const model = defineModel()
const props = defineProps({
  label: String,
  type: { type: String, default: 'text' }, // text | email | password | date | number | textarea ...
  error: String, // pesan validasi (mis. dari response 422)
  hint: String,
  required: Boolean,
  id: String,
  rows: { type: Number, default: 4 },
})

const uid = props.id || `f-${Math.random().toString(36).slice(2, 9)}`

const fieldClasses = computed(() => [
  'w-full rounded-xl border bg-field px-4 py-3 text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60 read-only:opacity-80',
  props.error ? 'border-bad-fg' : 'border-line',
])
</script>

<template>
  <div>
    <label v-if="label" :for="uid" class="mb-1.5 block text-sm font-semibold text-ink">
      {{ label }}<span v-if="required" class="text-bad-fg"> *</span>
    </label>
    <textarea v-if="type === 'textarea'" :id="uid" v-model="model" :rows="rows" :class="fieldClasses" :aria-invalid="!!error" v-bind="$attrs" />
    <input v-else :id="uid" v-model="model" :type="type" :class="fieldClasses" :aria-invalid="!!error" v-bind="$attrs" />
    <p v-if="error" class="mt-1.5 text-sm text-bad-fg" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-sm text-muted">{{ hint }}</p>
  </div>
</template>
