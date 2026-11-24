export const TOKEN_KEY = 'gsh_token'
export const USER_KEY = 'gsh_user'
export const THEME_KEY = 'gsh_theme'

// Nilai kanonis peran di frontend. Nilai dari backend dinormalisasi lewat normalizeRole().
export const ROLES = { TAMU: 'tamu', HOST: 'host', PENGAWAS: 'admin' }

export const ROLE_LABEL = {
  tamu: 'Tamu',
  host: 'Host',
  admin: 'Pengawas Sistem',
}

// Halaman tujuan setelah login / saat membuka halaman guest-only.
export const ROLE_HOME = {
  tamu: { name: 'beranda' },
  host: { name: 'host-ketersediaan' },
  admin: { name: 'pengawas-verifikasi' },
}

export function normalizeRole(value) {
  const raw = (value && typeof value === 'object' ? value.name : value) ?? ''
  const v = String(raw).trim().toLowerCase().replace(/[_-]+/g, ' ')
  if (v === 'tamu' || v === 'guest') return ROLES.TAMU
  if (v === 'host') return ROLES.HOST
  if (v === 'admin' || v === 'pengawas' || v === 'pengawas sistem') return ROLES.PENGAWAS
  return null
}

// Enumerasi filter pencarian (nilai resmi sesuai skenario GS Homestay Pekanbaru).
export const ROOM_TYPES = [
  { value: 'standard', label: 'Standar' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'family', label: 'Family' },
]

export const FACILITY_OPTIONS = ['AC', 'WiFi', 'TV', 'Kamar Mandi Dalam', 'Parkir', 'Dapur Bersama', 'Dispenser', 'Musala']

export function roomTypeLabel(value) {
  if (!value) return ''
  const hit = ROOM_TYPES.find((t) => t.value === String(value).toLowerCase())
  if (hit) return hit.label
  const s = String(value)
  return s.charAt(0).toUpperCase() + s.slice(1)
}
