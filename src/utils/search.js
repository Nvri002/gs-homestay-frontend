import { todayISO } from './format'

export function readSearch(query) {
  const g = Number(query.guests)
  return {
    check_in: typeof query.check_in === 'string' ? query.check_in : '',
    check_out: typeof query.check_out === 'string' ? query.check_out : '',
    guests: Number.isInteger(g) && g > 0 ? g : null,
  }
}

export function toSearchQuery(s) {
  const q = {}
  if (s.check_in) q.check_in = s.check_in
  if (s.check_out) q.check_out = s.check_out
  if (s.guests) q.guests = String(s.guests)
  return q
}

// Mengembalikan objek error per field; kosong = valid.
export function validateSearch({ check_in, check_out, guests }, { requireGuests = true } = {}) {
  const e = {}
  if (!check_in) e.check_in = 'Tanggal check-in wajib diisi.'
  else if (check_in < todayISO()) e.check_in = 'Check-in tidak boleh sebelum hari ini.'
  if (!check_out) e.check_out = 'Tanggal check-out wajib diisi.'
  else if (check_in && check_out <= check_in) e.check_out = 'Check-out harus setelah check-in.'
  if (requireGuests) {
    const g = Number(guests)
    if (!Number.isInteger(g) || g < 1) e.guests = 'Jumlah tamu minimal 1.'
  }
  return e
}

export const hasDates = (s) => !!(s.check_in && s.check_out)
