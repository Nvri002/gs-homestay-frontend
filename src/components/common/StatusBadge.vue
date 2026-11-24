<script setup>
import { computed } from 'vue'
import { BOOKING_STATUS, ENTITY_STATUS } from '@/utils/statusMap'

const props = defineProps({ status: String })

const meta = computed(() => BOOKING_STATUS[props.status] || ENTITY_STATUS[props.status] || { label: props.status || '-', tone: 'neutral' })
const tones = {
  warn: 'bg-warn-bg text-warn-fg',
  info: 'bg-info-bg text-info-fg',
  ok: 'bg-ok-bg text-ok-fg',
  bad: 'bg-bad-bg text-bad-fg',
  teal: 'bg-teal-bg text-teal-fg',
  neutral: 'bg-neutral-bg text-neutral-fg',
}
</script>

<template>
  <span :class="['inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold', tones[meta.tone]]">
    {{ meta.label }}
  </span>
</template>
