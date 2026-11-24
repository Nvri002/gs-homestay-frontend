const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function formatRupiah(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return 'Rp' + n.toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

// 'YYYY-MM-DD' dibaca sebagai tanggal lokal agar tidak bergeser zona waktu.
function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatTanggal(value) {
  const d = parseDate(value)
  return d ? `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}` : '-'
}

export function formatTanggalPendek(value) {
  const d = parseDate(value)
  return d ? `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}` : '-'
}

// Contoh hasil: "18 Nov 2026, 10.07 WIB"
export function formatTanggalWaktu(value) {
  const d = parseDate(value)
  if (!d) return '-'
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const get = (type) => parts.find((p) => p.type === type)?.value
  return `${get('day')} ${BULAN_PENDEK[Number(get('month')) - 1]} ${get('year')}, ${get('hour')}.${get('minute')} WIB`
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const todayISO = () => toISODate(new Date())

export function addDaysISO(iso, days) {
  const d = parseDate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function nightsBetween(checkIn, checkOut) {
  const a = parseDate(checkIn)
  const b = parseDate(checkOut)
  if (!a || !b) return 0
  return Math.round((b - a) / 86400000)
}

// ---- Bulan (format 'YYYY-MM') ----
export const currentMonth = () => todayISO().slice(0, 7)

export function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function formatBulanTahun(ym) {
  const [y, m] = ym.split('-').map(Number)
  return `${BULAN[m - 1]} ${y}`
}
