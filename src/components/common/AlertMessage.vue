<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'info' }, // success | error | warning | info
  message: String,
})

const tone = computed(
  () =>
    ({
      success: 'bg-ok-bg text-ok-fg',
      error: 'bg-bad-bg text-bad-fg',
      warning: 'bg-warn-bg text-warn-fg',
      info: 'bg-info-bg text-info-fg',
    })[props.type],
)
</script>

<template>
  <div :class="['rounded-xl px-4 py-3 text-sm font-medium', tone]" :role="type === 'error' ? 'alert' : 'status'">
    <slot>{{ message }}</slot>
  </div>
</template>
