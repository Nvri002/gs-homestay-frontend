// Hanya menerima path internal agar ?redirect tidak bisa dipakai untuk open-redirect.
export function safeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null
}
