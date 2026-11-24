import { defineStore } from 'pinia'
import { ref } from 'vue'
import { THEME_KEY } from '@/utils/constants'

export const useUiStore = defineStore('ui', () => {
  const theme = ref('light')
  const toasts = ref([])
  let seq = 0

  function applyTheme() {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY)
    theme.value = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    applyTheme()
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, theme.value)
    applyTheme()
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  // type: success | error | warning | info
  function notify(message, type = 'info', timeout = 4500) {
    const id = ++seq
    toasts.value.push({ id, message, type })
    if (timeout) setTimeout(() => dismiss(id), timeout)
  }

  return { theme, toasts, initTheme, toggleTheme, notify, dismiss }
})
