import { ref } from 'vue'

// Mengubah error Axios menjadi { status, message, errors } (errors = field 422 Laravel).
export function parseApiError(err) {
  const res = err?.response
  if (!res) {
    let message = err?.message || 'Terjadi kesalahan. Silakan coba lagi.'
    if (err?.code === 'ECONNABORTED') message = 'Server tidak merespons tepat waktu. Silakan coba lagi.'
    else if (err?.isAxiosError) message = 'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.'
    return { status: 0, message, errors: {} }
  }
  const data = res.data || {}
  return {
    status: res.status,
    message: data.message || 'Terjadi kesalahan. Silakan coba lagi.',
    errors: res.status === 422 ? data.errors || {} : {},
  }
}

// Penampung error validasi per kolom untuk form.
export function useFormErrors() {
  const errors = ref({})
  const message = ref('')

  function clear() {
    errors.value = {}
    message.value = ''
  }

  function setFromError(err) {
    const parsed = parseApiError(err)
    errors.value = parsed.errors
    message.value = parsed.message
    return parsed
  }

  function first(field) {
    const e = errors.value[field]
    return Array.isArray(e) ? e[0] : e || ''
  }

  // Pesan pertama untuk field array Laravel, mis. firstOf('photos') mencakup photos.0, photos.1, ...
  function firstOf(prefix) {
    for (const [key, value] of Object.entries(errors.value)) {
      if (key === prefix || key.startsWith(`${prefix}.`) || key.startsWith(`${prefix}[`)) {
        return Array.isArray(value) ? value[0] : value
      }
    }
    return ''
  }

  return { errors, message, clear, setFromError, first, firstOf }
}
