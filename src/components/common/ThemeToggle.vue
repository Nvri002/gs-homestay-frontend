<script setup>
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <button
    type="button"
    class="rounded-lg px-3 py-2 text-ink transition hover:bg-field focus-visible:outline-2 focus-visible:outline-primary"
    :aria-pressed="ui.theme === 'dark'"
    :title="ui.theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'"
    @click="ui.toggleTheme()"
  >
    Tema
  </button>
</template>
