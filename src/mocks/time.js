// Waktu Asia/Jakarta (+07:00) tanpa bergantung zona waktu perangkat.
const J = 7 * 3600 * 1000

export const nowIso = (d = new Date()) => new Date(d.getTime() + J).toISOString().slice(0, 19) + '+07:00'
export const todayJ = () => new Date(Date.now() + J).toISOString().slice(0, 10)
export const hoursAgo = (h) => nowIso(new Date(Date.now() - h * 3600 * 1000))
export const hoursAhead = (h) => nowIso(new Date(Date.now() + h * 3600 * 1000))

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

export function diffDays(a, b) {
  const t = (s) => Date.UTC(...s.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))))
  return Math.round((t(b) - t(a)) / 86400000)
}

export const daysOfMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`)
}
