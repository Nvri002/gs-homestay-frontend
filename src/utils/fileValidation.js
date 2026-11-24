export const PROOF_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
export const PHOTO_TYPES = ['image/jpeg', 'image/png']

const NAMES = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'application/pdf': 'PDF' }

export function typeLabels(types) {
  const names = types.map((t) => NAMES[t] || t)
  if (names.length < 2) return names.join('')
  return `${names.slice(0, -1).join(', ')}, atau ${names[names.length - 1]}`
}

// Mengembalikan pesan error, atau null jika berkas valid.
export function validateFile(file, { types = [], maxMB = 2 } = {}) {
  if (!file) return 'Berkas belum dipilih.'
  if (types.length && !types.includes(file.type)) {
    return `Format berkas tidak didukung. Gunakan ${typeLabels(types)}.`
  }
  if (file.size > maxMB * 1024 * 1024) return `Ukuran berkas maksimal ${maxMB} MB.`
  return null
}
