<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const open = defineModel({ type: Boolean, default: false })
const props = defineProps({
  title: String,
  persistent: Boolean, // true = tidak bisa ditutup (mis. saat request berjalan)
  size: { type: String, default: 'md' }, // sm | md | lg
})

const panel = ref(null)
let lastFocused = null

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
const focusables = () => (panel.value ? [...panel.value.querySelectorAll(FOCUSABLE)] : [])

function close() {
  if (!props.persistent) open.value = false
}

// Esc menutup; Tab dijaga agar fokus tidak keluar dari dialog.
function onKey(e) {
  if (e.key === 'Escape') {
    close()
    return
  }
  if (e.key !== 'Tab') return
  const els = focusables()
  if (!els.length) {
    e.preventDefault()
    panel.value?.focus()
    return
  }
  const first = els[0]
  const last = els[els.length - 1]
  const active = document.activeElement
  if (e.shiftKey && (active === first || active === panel.value)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  open,
  (value) => {
    if (value) {
      lastFocused = document.activeElement
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
      nextTick(() => {
        const target = panel.value?.querySelector('input:not([type="hidden"]):not([readonly]),select,textarea') || focusables()[0] || panel.value
        target?.focus()
      })
    } else {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lastFocused?.focus?.()
      lastFocused = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' }
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" :aria-label="title">
      <div class="absolute inset-0 bg-black/50" @click="close" />
      <div ref="panel" tabindex="-1" :class="['relative max-h-[90vh] w-full overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-6 shadow-xl outline-none', widths[size]]">
        <div class="mb-4 flex items-start justify-between gap-4">
          <h2 class="text-xl font-bold text-ink">{{ title }}</h2>
          <button v-if="!persistent" type="button" class="-mr-2 -mt-1 rounded-lg p-2 text-muted hover:bg-field" aria-label="Tutup" @click="close">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <slot />
        <div v-if="$slots.footer" class="mt-6 flex flex-wrap justify-end gap-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
