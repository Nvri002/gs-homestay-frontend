<script setup>
import { computed } from 'vue'
import BaseSpinner from './BaseSpinner.vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | outline | danger | danger-solid | ghost
  size: { type: String, default: 'md' }, // sm | md | lg
  type: { type: String, default: 'button' },
  loading: Boolean,
  disabled: Boolean,
  block: Boolean,
})

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60',
  props.block ? 'w-full' : '',
  { sm: 'px-3.5 py-2 text-sm', md: 'px-5 py-3 text-base', lg: 'px-6 py-3.5 text-base' }[props.size],
  {
    primary: 'bg-primary text-on-primary hover:bg-primary-hover',
    outline: 'border border-primary text-primary hover:bg-primary-soft',
    danger: 'border border-bad-fg text-bad-fg hover:bg-bad-bg',
    'danger-solid': 'bg-red-700 text-white hover:bg-red-800',
    ghost: 'text-ink hover:bg-field',
  }[props.variant],
])
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading" :aria-busy="loading">
    <BaseSpinner v-if="loading" size="sm" />
    <slot />
  </button>
</template>
