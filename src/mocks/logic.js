import { daysOfMonth, diffDays, hoursAhead, nowIso, todayJ } from './time'

export class HttpError extends Error {
  constructor(status, body) {
    super(body?.message || `HTTP ${status}`)
    this.status = status
    this.body = body
  }
}

export const unauthenticated = () => new HttpError(401, { message: 'Unauthenticated.' })
export const forbidden = () => new HttpError(403, { message: 'Anda tidak memiliki akses.' })
export const notFound = () => new HttpError(404, { message: 'Data tidak ditemukan.' })
export const conflict = (message) => new HttpError(409, { message })

export function fail(errors) {
  if (Object.keys(errors).length) throw new HttpError(422, { message: 'Validation failed', errors })
}

export const OK = (message, data, meta) => ({ status: 200, body: { message, ...(data !== undefined ? { data } : {}), ...(meta ? { meta } : {}) } })
export const CREATED = (message, data) => ({ status: 201, body: { message, data } })

export function paginate(items, query, defaultPer = 5) {
  const per = Math.max(1, Math.min(100, Number(query.per_page) || defaultPer))
  const total = items.length
  const last = Math.max(1, Math.ceil(total / per))
  const page = Math.min(Math.max(1, Number(query.page) || 1), last)
  const start = (page - 1) * per
  const data = items.slice(start, start + per)
  return { data, meta: { current_page: page, last_page: last, per_page: per, total, from: total ? start + 1 : null, to: total ? start + data.length : null } }
}

export const byNewest = (a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : b.id - a.id)

// ---- Ketersediaan ----
export const HOLD_STATUSES = ['menunggu_pembayaran', 'menunggu_verifikasi', 'pembayaran_terverifikasi', 'pembayaran_ditolak']

// Apakah pemesanan menahan/memesan kamar? -> 'terpesan' | 'ditahan' | null
export function occupancy(b) {
  if (b.status === 'terkonfirmasi') return 'terpesan'
  if (!HOLD_STATUSES.includes(b.status)) return null
  if (b.status === 'menunggu_pembayaran' && new Date(b.payment_deadline) < new Date()) return null // batas bayar lewat
  return 'ditahan'
}

export const overlapping = (db, roomId, ci, co, ignoreId = null) =>
  db.bookings.filter((b) => b.room_id === roomId && b.id !== ignoreId && occupancy(b) && b.check_in < co && ci < b.check_out)

export function roomState(db, room, ci, co, guests) {
  const hs = db.homestays.find((h) => h.id === room.homestay_id)
  if (room.status !== 'aktif' || hs?.status !== 'aktif') return { ok: false, reason: 'Kamar tidak aktif.' }
  if (guests && guests > room.capacity) return { ok: false, reason: `Kapasitas kamar maksimal ${room.capacity} tamu.` }
  if (overlapping(db, room.id, ci, co).length) return { ok: false, reason: 'Kamar sudah dipesan pada tanggal tersebut.' }
  return { ok: true, reason: null }
}

// Reservasi "aktif" = masih menahan/memesan kamar dan belum lewat tanggal check-out.
export const isActiveBooking = (b) => !!occupancy(b) && b.check_out >= todayJ()

export function parseDates(q, { required = false } = {}) {
  const ci = q.check_in
  const co = q.check_out
  if (!ci && !co && !required) return null
  const e = {}
  if (!ci) e.check_in = ['Tanggal check-in wajib diisi.']
  if (!co) e.check_out = ['Tanggal check-out wajib diisi.']
  if (ci && ci < todayJ()) e.check_in = ['Check-in tidak boleh sebelum hari ini.']
  if (ci && co && co <= ci) e.check_out = ['Check-out harus setelah check-in.']
  fail(e)
  return { ci, co, nights: diffDays(ci, co) }
}

// ---- Resource (bentuk JSON sesuai API Contract) ----
export const userRes = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status, created_at: u.created_at })
export const authUserRes = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status })

export function publicRoom(db, room, dates, guests) {
  const state = dates ? roomState(db, room, dates.ci, dates.co, guests) : null
  return {
    id: room.id, homestay_id: room.homestay_id, name: room.name, room_type: room.room_type, capacity: room.capacity,
    description: room.description, facilities: room.facilities, photos: room.photos, price_per_night: room.price_per_night, status: room.status,
    nights: dates ? dates.nights : null,
    total_price: dates ? dates.nights * room.price_per_night : null,
    is_available: state ? state.ok : null,
  }
}

export function publicHomestay(db, hs, rooms, dates, guests) {
  const prices = rooms.map((r) => r.price_per_night)
  return {
    id: hs.id, name: hs.name, address: hs.address, description: hs.description, contact_phone: hs.contact_phone, status: hs.status,
    facilities: hs.facilities, photos: hs.photos, min_price: prices.length ? Math.min(...prices) : null,
    rooms: rooms.map((r) => publicRoom(db, r, dates, guests)),
  }
}

export const hostHomestayRes = (db, hs) => ({
  id: hs.id, name: hs.name, address: hs.address, description: hs.description, contact_phone: hs.contact_phone, status: hs.status,
  facilities: hs.facilities, cover_photo: hs.photos[0] ?? null, photos: hs.photos,
  rooms_count: db.rooms.filter((r) => r.homestay_id === hs.id).length, created_at: hs.created_at,
})

export const hostRoomRes = (db, r) => ({
  id: r.id, homestay_id: r.homestay_id, homestay_name: db.homestays.find((h) => h.id === r.homestay_id)?.name ?? '', name: r.name,
  room_type: r.room_type, capacity: r.capacity, price_per_night: r.price_per_night, description: r.description, facilities: r.facilities,
  photos: r.photos, status: r.status, created_at: r.created_at,
})

export const bookingCode = (b) => `GSH-${b.created_at.slice(0, 10).replaceAll('-', '')}-${String(b.id).padStart(4, '0')}`

export const PAYMENT_INSTRUCTION = { bank: 'Bank BRI', account_number: '0123456789', account_name: 'GS Homestay Pekanbaru' }

export function bookingRes(db, b) {
  const room = db.rooms.find((r) => r.id === b.room_id)
  const hs = db.homestays.find((h) => h.id === room.homestay_id)
  const guest = db.users.find((u) => u.id === b.guest_id)
  const verifier = b.verified_by ? db.users.find((u) => u.id === b.verified_by) : null
  return {
    id: b.id, code: bookingCode(b), status: b.status,
    homestay: { id: hs.id, name: hs.name, address: hs.address },
    room: { id: room.id, name: room.name, room_type: room.room_type, capacity: room.capacity },
    guest: { id: guest.id, name: guest.name, email: guest.email, phone: guest.phone },
    check_in: b.check_in, check_out: b.check_out, nights: b.nights, guest_count: b.guest_count, notes: b.notes || null,
    price_per_night: b.price_per_night, total_price: b.total_price, payment_deadline: b.payment_deadline,
    payment_instruction: PAYMENT_INSTRUCTION,
    payment_proof: b.proof ? { has_proof: true, file_name: b.proof.file_name, mime_type: b.proof.mime_type, uploaded_at: b.proof.uploaded_at } : null,
    rejection_reason: b.rejection_reason, verified_by: verifier ? { id: verifier.id, name: verifier.name } : null,
    verified_at: b.verified_at, confirmed_at: b.confirmed_at, created_at: b.created_at,
  }
}

export function newBooking(db, id, room, input, guestId) {
  return {
    id, status: 'menunggu_pembayaran', room_id: room.id, guest_id: guestId,
    check_in: input.ci, check_out: input.co, nights: input.nights, guest_count: input.guests, notes: input.notes,
    price_per_night: room.price_per_night, total_price: room.price_per_night * input.nights,
    payment_deadline: hoursAhead(24), created_at: nowIso(),
    proof: null, rejection_reason: null, verified_by: null, verified_at: null, confirmed_at: null,
  }
}

// ---- Laporan pendapatan ----
export function revenueReport(db, q, bookings, { withHost = false } = {}) {
  const e = {}
  const period = q.period
  if (!['daily', 'monthly', 'range'].includes(period)) e.period = ['Periode harus daily, monthly, atau range.']
  let start = ''
  let end = ''
  let label = ''
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const tgl = (iso) => `${Number(iso.slice(8))} ${BULAN[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
  if (period === 'daily') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(q.date || '')) e.date = ['Tanggal wajib diisi (YYYY-MM-DD).']
    else { start = end = q.date; label = tgl(q.date) }
  } else if (period === 'monthly') {
    if (!/^\d{4}-\d{2}$/.test(q.month || '')) e.month = ['Bulan wajib diisi (YYYY-MM).']
    else { const days = daysOfMonth(q.month); start = days[0]; end = days[days.length - 1]; label = `${BULAN[Number(q.month.slice(5)) - 1]} ${q.month.slice(0, 4)}` }
  } else if (period === 'range') {
    if (!q.start_date) e.start_date = ['Tanggal mulai wajib diisi.']
    if (!q.end_date) e.end_date = ['Tanggal akhir wajib diisi.']
    if (q.start_date && q.end_date && q.end_date < q.start_date) e.end_date = ['Tanggal akhir tidak boleh sebelum tanggal mulai.']
    if (!e.start_date && !e.end_date) { start = q.start_date; end = q.end_date; label = `${tgl(start)} – ${tgl(end)}` }
  }
  fail(e)

  const items = bookings
    .filter((b) => b.status === 'terkonfirmasi' && b.check_in >= start && b.check_in <= end)
    .sort((a, b) => (a.check_in < b.check_in ? -1 : 1))
    .map((b) => {
      const room = db.rooms.find((r) => r.id === b.room_id)
      const hs = db.homestays.find((h) => h.id === room.homestay_id)
      const host = db.users.find((u) => u.id === hs.host_id)
      return {
        booking_id: b.id, code: bookingCode(b), homestay: hs.name, room: room.name,
        ...(withHost ? { host_name: host?.name ?? '' } : {}),
        guest_name: db.users.find((u) => u.id === b.guest_id)?.name ?? '', check_in: b.check_in, check_out: b.check_out, nights: b.nights, total_price: b.total_price,
      }
    })
  const total = items.reduce((sum, i) => sum + i.total_price, 0)
  return OK(items.length ? 'Laporan pendapatan berhasil diambil' : 'Tidak ada data pada periode ini', { period, label, total_revenue: total, total_bookings: items.length, items })
}

