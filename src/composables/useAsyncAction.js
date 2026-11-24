import { ref } from 'vue'

// Membungkus aksi async dengan state loading dan mencegah double submit.
export function useAsyncAction(fn) {
  const loading = ref(false)

  async function run(...args) {
    if (loading.value) return undefined
    loading.value = true
    try {
      return await fn(...args)
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
