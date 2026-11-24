<script setup>
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const tones = {
  success: 'bg-ok-bg text-ok-fg',
  error: 'bg-bad-bg text-bad-fg',
  warning: 'bg-warn-bg text-warn-fg',
  info: 'bg-info-bg text-info-fg',
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:w-96" aria-live="polite">
    <button
      v-for="t in ui.toasts"
      :key="t.id"
      type="button"
      :class="['pointer-events-auto w-full rounded-xl border border-line px-4 py-3 text-left text-sm font-medium shadow-lg', tones[t.type]]"
      @click="ui.dismiss(t.id)"
    >
      {{ t.message }}
    </button>
  </div>
</template>
