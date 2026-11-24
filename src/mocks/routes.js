import { nextId, save } from './db'
import { getProof, putProof } from './files'
import { makeReceiptBlob, toThumb } from './photos'
import {
  CREATED, HttpError, OK, PAYMENT_INSTRUCTION, authUserRes, bookingCode, bookingRes, byNewest, conflict, fail, forbidden, hostHomestayRes,
  hostRoomRes, isActiveBooking, newBooking, notFound, occupancy, paginate, parseDates, publicHomestay,
  revenueReport, roomState, unauthenticated, userRes,
} from './logic'
import { daysOfMonth, nowIso, todayJ } from './time'

const ROOM_TYPES = ['standard', 'deluxe', 'family']
const FACILITIES = ['AC', 'WiFi', 'TV', 'Kamar Mandi Dalam', 'Parkir', 'Dapur Bersama', 'Dispenser', 'Musala']
const FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const PHOTO_TYPES = ['image/jpeg', 'image/png']
const MAX_BYTES = 2 * 1024 * 1024

// ---------- helper ----------
const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim())
const list = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v])
const isFile = (v) => typeof File !== 'undefined' && v instanceof File
const emailTaken = (db, email, exceptId = null) => db.users.some((u) => u.id !== exceptId && u.email.toLowerCase() === email.toLowerCase())

function authorize(ctx, ...roles) {
  if (!ctx.user) throw unauthenticated()
  if (roles.length && !roles.includes(ctx.user.role)) throw forbidden()
  return ctx.user
}

const findOr404 = (items, id) => {
  const item = items.find((x) => x.id === Number(id))
  if (!item) throw notFound()
  return item
}

function validateFacilities(raw, e) {
  const facilities = list(raw)
  facilities.forEach((f, i) => {
    if (!FACILITIES.includes(f)) e[`facilities.${i}`] = [`Fasilitas "${f}" tidak dikenali.`]
  })
  return facilities
}

async function processPhotos(raw, e) {
  const files = list(raw).filter((f) => isFile(f) && f.size > 0)
  files.forEach((f, i) => {
    if (!PHOTO_TYPES.includes(f.type)) e[`photos.${i}`] = ['Foto harus berformat JPG atau PNG.']
    else if (f.size > MAX_BYTES) e[`photos.${i}`] = ['Ukuran foto maksimal 2 MB.']
  })
  return { files, thumbs: async () => (await Promise.all(files.map(toThumb))).filter(Boolean) }
}

function bookingFilters(items, q) {
  let out = items
  if (q.status) out = out.filter((b) => b.status === q.status)
  return out.sort(byNewest)
}

function hostScope(db, user) {
  const hsIds = db.homestays.filter((h) => h.host_id === user.id).map((h) => h.id)
  const roomIds = db.rooms.filter((r) => hsIds.includes(r.homestay_id)).map((r) => r.id)
  return { hsIds, roomIds, bookings: db.bookings.filter((b) => roomIds.includes(b.room_id)) }
}

// ---------- tabel route ----------
const table = []
const on = (method, pattern, handler) => {
  const keys = [...pattern.matchAll(/:([a-z_]+)/g)].map((m) => m[1])
  table.push({ method, keys, re: new RegExp(`^${pattern.replace(/:[a-z_]+/g, '([^/]+)')}$`), handler })
}

export function matchRoute(method, path) {
  for (const r of table) {
    if (r.method !== method) continue
    const m = path.match(r.re)
    if (m) return { handler: r.handler, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }
  }
  return null
}

// ================= AUTH =================
on('POST', '/register', ({ body, db }) => {
  const e = {}
  const name = str(body.name)
  const email = str(body.email)
  const phone = str(body.phone)
  const password = body.password ?? ''
  if (!name) e.name = ['Nama lengkap wajib diisi.']
  if (!email) e.email = ['Email wajib diisi.']
  else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = ['Format email tidak valid.']
  else if (emailTaken(db, email)) e.email = ['Email sudah terdaftar.']
  if (!phone) e.phone = ['Nomor telepon wajib diisi.']
  if (password.length < 8) e.password = ['Kata sandi minimal 8 karakter.']
  else if (password !== body.password_confirmation) e.password = ['Konfirmasi kata sandi tidak sama.']
  fail(e)
  const user = { id: nextId('users'), name, email, phone, password, role: 'tamu', status: 'aktif', created_at: nowIso() }
  db.users.push(user)
  save()
  return CREATED('Registrasi berhasil', authUserRes(user))
})

on('POST', '/login', ({ body, db }) => {
  const user = db.users.find((u) => u.email.toLowerCase() === str(body.email).toLowerCase())
  if (!user || user.password !== body.password) throw new HttpError(401, { message: 'Email atau kata sandi salah.' })
  if (user.status !== 'aktif') throw new HttpError(403, { message: 'Akun Anda dinonaktifkan. Hubungi Pengawas Sistem.' })
  const token = `${user.id}|${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  db.tokens[token] = user.id
  save()
  return OK('Login berhasil', { token, user: authUserRes(user) })
})

on('POST', '/logout', (ctx) => {
  authorize(ctx)
  delete ctx.db.tokens[ctx.token]
  save()
  return OK('Logout berhasil')
})

on('GET', '/profile', (ctx) => OK('Data profil berhasil diambil', authUserRes(authorize(ctx))))

// ================= PUBLIK =================
on('GET', '/homestays', ({ db, query: q }) => {
  const dates = parseDates(q)
  const guests = Number(q.guests) || 0
  const min = q.min_price !== undefined && q.min_price !== '' ? Number(q.min_price) : null
  const max = q.max_price !== undefined && q.max_price !== '' ? Number(q.max_price) : null
  const wanted = list(q['facilities[]'] ?? q.facilities).filter(Boolean)
  const filtering = !!(dates || q.room_type || min !== null || max !== null || wanted.length || guests)

  const items = []
  for (const hs of db.homestays.filter((h) => h.status === 'aktif')) {
    const rooms = db.rooms.filter((r) => r.homestay_id === hs.id && r.status === 'aktif').filter((r) => {
      if (q.room_type && r.room_type !== q.room_type) return false
      if (min !== null && r.price_per_night < min) return false
      if (max !== null && r.price_per_night > max) return false
      if (!wanted.every((f) => r.facilities.includes(f) || hs.facilities.includes(f))) return false
      if (guests && r.capacity < guests) return false
      if (dates && !roomState(db, r, dates.ci, dates.co, guests).ok) return false
      return true
    })
    if (filtering && !rooms.length) continue
    items.push(publicHomestay(db, hs, rooms, dates, guests))
  }
  const { data, meta } = paginate(items, q, 4)
  return OK('Data homestay berhasil diambil', data, meta)
})

on('GET', '/homestays/:id', ({ db, params, query: q }) => {
  const hs = findOr404(db.homestays, params.id)
  if (hs.status !== 'aktif') throw notFound()
  const dates = parseDates(q)
  const rooms = db.rooms.filter((r) => r.homestay_id === hs.id && r.status === 'aktif')
  return OK('Detail homestay berhasil diambil', publicHomestay(db, hs, rooms, dates, Number(q.guests) || 0))
})

on('GET', '/rooms/:id/availability', ({ db, params, query: q }) => {
  const room = findOr404(db.rooms, params.id)
  const dates = parseDates(q, { required: true })
  const guests = Number(q.guests) || 0
  const hs = db.homestays.find((h) => h.id === room.homestay_id)
  const state = roomState(db, room, dates.ci, dates.co, guests)
  return OK('Pengecekan ketersediaan berhasil', {
    room_id: room.id, room_name: room.name, homestay_id: hs.id, homestay_name: hs.name, room_type: room.room_type, capacity: room.capacity,
    price_per_night: room.price_per_night, check_in: dates.ci, check_out: dates.co, nights: dates.nights,
    total_price: dates.nights * room.price_per_night, is_available: state.ok, reason: state.reason,
  })
})

// ================= TAMU =================
function bookingInput(ctx) {
  const { db, body } = ctx
  authorize(ctx, 'tamu')
  const e = {}
  const room = db.rooms.find((r) => r.id === Number(body.room_id))
  if (!room || room.status !== 'aktif') e.room_id = ['Kamar tidak ditemukan atau tidak aktif.']
  const dates = (() => {
    try { return parseDates({ check_in: body.check_in, check_out: body.check_out }, { required: true }) } catch (err) { Object.assign(e, err.body.errors); return null }
  })()
  const guests = Number(body.guest_count)
  if (!Number.isInteger(guests) || guests < 1) e.guest_count = ['Jumlah tamu minimal 1.']
  else if (room && guests > room.capacity) e.guest_count = [`Jumlah tamu melebihi kapasitas kamar (maks ${room.capacity}).`]
  const notes = str(body.notes)
  if (notes.length > 500) e.notes = ['Catatan maksimal 500 karakter.']
  fail(e)
  const state = roomState(db, room, dates.ci, dates.co, guests)
  if (!state.ok) throw conflict(state.reason === 'Kamar sudah dipesan pada tanggal tersebut.' ? 'Kamar baru saja dipesan Tamu lain.' : state.reason)
  return { room, input: { ci: dates.ci, co: dates.co, nights: dates.nights, guests, notes: notes || null } }
}

on('POST', '/bookings/preview', (ctx) => {
  const { room, input } = bookingInput(ctx)
  const hs = ctx.db.homestays.find((h) => h.id === room.homestay_id)
  return OK('Ringkasan pemesanan berhasil dihitung', {
    homestay: { id: hs.id, name: hs.name, address: hs.address },
    room: { id: room.id, name: room.name, room_type: room.room_type, capacity: room.capacity },
    check_in: input.ci, check_out: input.co, nights: input.nights, guest_count: input.guests, notes: input.notes,
    price_per_night: room.price_per_night, total_price: room.price_per_night * input.nights,
  })
})

on('POST', '/bookings', (ctx) => {
  const { room, input } = bookingInput(ctx)
  const b = newBooking(ctx.db, nextId('bookings'), room, input, ctx.user.id)
  ctx.db.bookings.push(b)
  save()
  return CREATED('Pemesanan berhasil dibuat', bookingRes(ctx.db, b))
})

on('POST', '/bookings/:id/payment-proof', async (ctx) => {
  authorize(ctx, 'tamu')
  const b = findOr404(ctx.db.bookings, ctx.params.id)
  if (b.guest_id !== ctx.user.id) throw forbidden()
  const file = ctx.body.proof
  const e = {}
  if (!isFile(file) || !file.size) e.proof = ['Bukti pembayaran wajib diunggah.']
  else if (!FILE_TYPES.includes(file.type)) e.proof = ['Berkas harus berformat JPG, PNG, atau PDF.']
  else if (file.size > MAX_BYTES) e.proof = ['Ukuran berkas maksimal 2 MB.']
  fail(e)
  if (!['menunggu_pembayaran', 'pembayaran_ditolak'].includes(b.status)) throw conflict('Status pemesanan sudah berubah. Bukti pembayaran tidak dapat diunggah.')
  await putProof(b.id, file)
  b.proof = { file_name: file.name, mime_type: file.type, uploaded_at: nowIso() }
  b.status = 'menunggu_verifikasi'
  b.rejection_reason = null
  b.verified_by = null
  b.verified_at = null
  save()
  return OK('Bukti pembayaran berhasil diunggah', bookingRes(ctx.db, b))
})

on('GET', '/bookings', (ctx) => {
  authorize(ctx, 'tamu')
  const { data, meta } = paginate(bookingFilters(ctx.db.bookings.filter((b) => b.guest_id === ctx.user.id), ctx.query), ctx.query, 5)
  return OK('Data pemesanan berhasil diambil', data.map((b) => bookingRes(ctx.db, b)), meta)
})

on('GET', '/bookings/:id', (ctx) => {
  authorize(ctx, 'tamu')
  const b = findOr404(ctx.db.bookings, ctx.params.id)
  if (b.guest_id !== ctx.user.id) throw forbidden()
  return OK('Detail pemesanan berhasil diambil', bookingRes(ctx.db, b))
})

// Berkas bukti: Tamu pemilik, Host pemilik homestay, atau Admin.
on('GET', '/bookings/:id/payment-proof', async (ctx) => {
  authorize(ctx)
  const b = findOr404(ctx.db.bookings, ctx.params.id)
  const room = ctx.db.rooms.find((r) => r.id === b.room_id)
  const hs = ctx.db.homestays.find((h) => h.id === room.homestay_id)
  const allowed = ctx.user.role === 'admin' || (ctx.user.role === 'tamu' && b.guest_id === ctx.user.id) || (ctx.user.role === 'host' && hs.host_id === ctx.user.id)
  if (!allowed) throw forbidden()
  if (!b.proof) throw new HttpError(404, { message: 'Bukti pembayaran belum diunggah.' })
  let blob = await getProof(b.id)
  if (!blob) blob = await makeReceiptBlob({ code: bookingCode(b), amount: b.total_price, ...{ bank: PAYMENT_INSTRUCTION.bank, accountNumber: PAYMENT_INSTRUCTION.account_number, accountName: PAYMENT_INSTRUCTION.account_name } })
  return { status: 200, blob }
})

// ================= HOST =================
on('GET', '/host/homestays', (ctx) => {
  const user = authorize(ctx, 'host')
  const { data, meta } = paginate(ctx.db.homestays.filter((h) => h.host_id === user.id).sort((a, b) => b.id - a.id), ctx.query, 5)
  return OK('Data homestay berhasil diambil', data.map((h) => hostHomestayRes(ctx.db, h)), meta)
})

const ownHomestay = (ctx, id) => {
  const hs = findOr404(ctx.db.homestays, id)
  if (hs.host_id !== ctx.user.id) throw forbidden()
  return hs
}

on('GET', '/host/homestays/:id', (ctx) => {
  authorize(ctx, 'host')
  return OK('Detail homestay berhasil diambil', hostHomestayRes(ctx.db, ownHomestay(ctx, ctx.params.id)))
})

async function saveHomestay(ctx, hs) {
  const { body } = ctx
  const e = {}
  const name = str(body.name)
  const address = str(body.address)
  if (!name) e.name = ['Nama homestay wajib diisi.']
  if (!address) e.address = ['Alamat wajib diisi.']
  const facilities = validateFacilities(body.facilities, e)
  const photos = await processPhotos(body.photos, e)
  fail(e)
  const target = hs ?? { id: nextId('homestays'), host_id: ctx.user.id, status: 'aktif', photos: [], created_at: nowIso() }
  Object.assign(target, { name, address, description: str(body.description), contact_phone: str(body.contact_phone), facilities })
  if (photos.files.length) target.photos = await photos.thumbs() // foto baru MENGGANTIKAN foto lama
  if (!hs) ctx.db.homestays.push(target)
  save()
  return target
}

on('POST', '/host/homestays', async (ctx) => {
  authorize(ctx, 'host')
  return CREATED('Homestay berhasil ditambahkan', hostHomestayRes(ctx.db, await saveHomestay(ctx, null)))
})

on('PUT', '/host/homestays/:id', async (ctx) => {
  authorize(ctx, 'host')
  const hs = ownHomestay(ctx, ctx.params.id)
  return OK('Homestay berhasil diperbarui', hostHomestayRes(ctx.db, await saveHomestay(ctx, hs)))
})

on('PATCH', '/host/homestays/:id/deactivate', (ctx) => {
  authorize(ctx, 'host')
  const hs = ownHomestay(ctx, ctx.params.id)
  const roomIds = ctx.db.rooms.filter((r) => r.homestay_id === hs.id).map((r) => r.id)
  if (ctx.db.bookings.some((b) => roomIds.includes(b.room_id) && isActiveBooking(b))) throw conflict('Homestay tidak dapat dinonaktifkan karena masih memiliki reservasi aktif.')
  hs.status = 'nonaktif'
  save()
  return OK('Homestay berhasil dinonaktifkan', hostHomestayRes(ctx.db, hs))
})

on('GET', '/host/rooms', (ctx) => {
  const user = authorize(ctx, 'host')
  const own = ctx.db.homestays.filter((h) => h.host_id === user.id).map((h) => h.id)
  let rooms = ctx.db.rooms.filter((r) => own.includes(r.homestay_id))
  if (ctx.query.homestay_id) rooms = rooms.filter((r) => r.homestay_id === Number(ctx.query.homestay_id))
  const { data, meta } = paginate(rooms.sort((a, b) => b.id - a.id), ctx.query, 5)
  return OK('Data kamar berhasil diambil', data.map((r) => hostRoomRes(ctx.db, r)), meta)
})

async function saveRoom(ctx, room) {
  const { body, db, user } = ctx
  const e = {}
  const hs = db.homestays.find((h) => h.id === Number(body.homestay_id) && h.host_id === user.id)
  if (!hs) e.homestay_id = ['Homestay tidak valid.']
  const name = str(body.name)
  if (!name) e.name = ['Nama kamar wajib diisi.']
  if (!ROOM_TYPES.includes(body.room_type)) e.room_type = ['Tipe kamar harus standard, deluxe, atau family.']
  const capacity = Number(body.capacity)
  if (!Number.isInteger(capacity) || capacity < 1) e.capacity = ['Kapasitas minimal 1 tamu.']
  const price = Number(body.price_per_night)
  if (!(price > 0)) e.price_per_night = ['Harga per malam harus lebih dari 0.']
  const facilities = validateFacilities(body.facilities, e)
  const photos = await processPhotos(body.photos, e)
  fail(e)
  const target = room ?? { id: nextId('rooms'), status: 'aktif', photos: [], created_at: nowIso() }
  Object.assign(target, { homestay_id: hs.id, name, room_type: body.room_type, capacity, price_per_night: price, description: str(body.description), facilities })
  if (photos.files.length) target.photos = await photos.thumbs()
  if (!room) db.rooms.push(target)
  save()
  return target
}

const ownRoom = (ctx, id) => {
  const room = findOr404(ctx.db.rooms, id)
  const hs = ctx.db.homestays.find((h) => h.id === room.homestay_id)
  if (hs.host_id !== ctx.user.id) throw forbidden()
  return room
}

on('POST', '/host/rooms', async (ctx) => {
  authorize(ctx, 'host')
  return CREATED('Kamar berhasil ditambahkan', hostRoomRes(ctx.db, await saveRoom(ctx, null)))
})

on('PUT', '/host/rooms/:id', async (ctx) => {
  authorize(ctx, 'host')
  const room = ownRoom(ctx, ctx.params.id)
  return OK('Kamar berhasil diperbarui', hostRoomRes(ctx.db, await saveRoom(ctx, room)))
})

on('PATCH', '/host/rooms/:id/deactivate', (ctx) => {
  authorize(ctx, 'host')
  const room = ownRoom(ctx, ctx.params.id)
  if (ctx.db.bookings.some((b) => b.room_id === room.id && isActiveBooking(b))) throw conflict('Kamar tidak dapat dinonaktifkan karena masih memiliki reservasi aktif.')
  room.status = 'nonaktif'
  save()
  return OK('Kamar berhasil dinonaktifkan', hostRoomRes(ctx.db, room))
})

on('GET', '/host/bookings', (ctx) => {
  const user = authorize(ctx, 'host')
  let items = hostScope(ctx.db, user).bookings
  if (ctx.query.homestay_id) {
    const roomIds = ctx.db.rooms.filter((r) => r.homestay_id === Number(ctx.query.homestay_id)).map((r) => r.id)
    items = items.filter((b) => roomIds.includes(b.room_id))
  }
  const { data, meta } = paginate(bookingFilters(items, ctx.query), ctx.query, 5)
  return OK('Data reservasi berhasil diambil', data.map((b) => bookingRes(ctx.db, b)), meta)
})

const hostBooking = (ctx, id) => {
  const b = findOr404(ctx.db.bookings, id)
  if (!hostScope(ctx.db, ctx.user).roomIds.includes(b.room_id)) throw forbidden()
  return b
}

on('GET', '/host/bookings/:id', (ctx) => {
  authorize(ctx, 'host')
  return OK('Detail reservasi berhasil diambil', bookingRes(ctx.db, hostBooking(ctx, ctx.params.id)))
})

on('POST', '/host/bookings/:id/confirm', (ctx) => {
  authorize(ctx, 'host')
  const b = hostBooking(ctx, ctx.params.id)
  if (b.status !== 'pembayaran_terverifikasi') throw conflict('Status reservasi sudah berubah. Muat ulang halaman.')
  b.status = 'terkonfirmasi'
  b.confirmed_at = nowIso()
  save()
  return OK('Reservasi berhasil dikonfirmasi', bookingRes(ctx.db, b))
})

on('POST', '/host/bookings/:id/reject', (ctx) => {
  authorize(ctx, 'host')
  const b = hostBooking(ctx, ctx.params.id)
  const reason = str(ctx.body.reason)
  fail(reason ? {} : { reason: ['Alasan penolakan wajib diisi.'] })
  if (b.status !== 'pembayaran_terverifikasi') throw conflict('Status reservasi sudah berubah. Muat ulang halaman.')
  b.status = 'ditolak'
  b.rejection_reason = reason
  save()
  return OK('Reservasi berhasil ditolak', bookingRes(ctx.db, b))
})

on('GET', '/host/availability', (ctx) => {
  const user = authorize(ctx, 'host')
  const month = ctx.query.month || todayJ().slice(0, 7)
  fail(/^\d{4}-\d{2}$/.test(month) ? {} : { month: ['Format bulan harus YYYY-MM.'] })
  const { db } = ctx
  const own = db.homestays.filter((h) => h.host_id === user.id)
  const allRooms = db.rooms.filter((r) => own.some((h) => h.id === r.homestay_id))
  let rooms = allRooms
  if (ctx.query.homestay_id) rooms = rooms.filter((r) => r.homestay_id === Number(ctx.query.homestay_id))
  if (ctx.query.room_type) rooms = rooms.filter((r) => r.room_type === ctx.query.room_type)
  const days = daysOfMonth(month)
  const data = rooms.map((r) => {
    const hs = own.find((h) => h.id === r.homestay_id)
    const inactive = r.status !== 'aktif' || hs.status !== 'aktif'
    const dates = {}
    for (const day of days) {
      if (inactive) { dates[day] = { status: 'nonaktif', booking_id: null }; continue }
      const hits = db.bookings.filter((b) => b.room_id === r.id && occupancy(b) && b.check_in <= day && day < b.check_out)
      const hit = hits.find((b) => occupancy(b) === 'terpesan') || hits[0]
      dates[day] = hit
        ? { status: occupancy(hit), booking_id: hit.id, booking_code: bookingCode(hit), guest_name: db.users.find((u) => u.id === hit.guest_id)?.name ?? '' }
        : { status: 'tersedia', booking_id: null }
    }
    return { room_id: r.id, room: r.name, homestay_id: hs.id, homestay_name: hs.name, room_type: r.room_type, status: r.status, dates }
  })
  return OK('Kalender ketersediaan berhasil diambil', data, { month, total_rooms: allRooms.length })
})

on('GET', '/host/reports/revenue', (ctx) => {
  const user = authorize(ctx, 'host')
  return revenueReport(ctx.db, ctx.query, hostScope(ctx.db, user).bookings)
})

// ================= ADMIN (PENGAWAS) =================
on('GET', '/admin/users', (ctx) => {
  authorize(ctx, 'admin')
  const q = ctx.query
  const term = str(q.search).toLowerCase()
  let users = ctx.db.users
  if (q.role) users = users.filter((u) => u.role === q.role)
  if (q.status) users = users.filter((u) => u.status === q.status)
  if (term) users = users.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
  const { data, meta } = paginate([...users].sort((a, b) => a.id - b.id), q, 5)
  return OK('Data akun berhasil diambil', data.map(userRes), meta)
})

function userInput(body, db, exceptId, { withPassword }) {
  const e = {}
  const name = str(body.name)
  const email = str(body.email)
  const phone = str(body.phone)
  if (!name) e.name = ['Nama lengkap wajib diisi.']
  if (!email) e.email = ['Email wajib diisi.']
  else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = ['Format email tidak valid.']
  else if (emailTaken(db, email, exceptId)) e.email = ['Email sudah terdaftar.']
  if (!phone) e.phone = ['Nomor telepon wajib diisi.']
  if (withPassword && (body.password || '').length < 8) e.password = ['Kata sandi awal minimal 8 karakter.']
  fail(e)
  return { name, email, phone }
}

on('POST', '/admin/users', (ctx) => {
  authorize(ctx, 'admin')
  const data = userInput(ctx.body, ctx.db, null, { withPassword: true })
  const user = { id: nextId('users'), ...data, password: ctx.body.password, role: 'host', status: 'aktif', created_at: nowIso() }
  ctx.db.users.push(user)
  save()
  return CREATED('Akun Host berhasil ditambahkan', userRes(user))
})

on('PUT', '/admin/users/:id', (ctx) => {
  authorize(ctx, 'admin')
  const user = findOr404(ctx.db.users, ctx.params.id)
  Object.assign(user, userInput(ctx.body, ctx.db, user.id, { withPassword: false }))
  save()
  return OK('Data akun berhasil diperbarui', userRes(user))
})

on('PATCH', '/admin/users/:id/status', (ctx) => {
  const me = authorize(ctx, 'admin')
  const user = findOr404(ctx.db.users, ctx.params.id)
  const status = ctx.body.status
  fail(['aktif', 'nonaktif'].includes(status) ? {} : { status: ['Status harus aktif atau nonaktif.'] })
  if (user.id === me.id && status === 'nonaktif') throw conflict('Anda tidak dapat menonaktifkan akun Anda sendiri.')
  user.status = status
  if (status === 'nonaktif') for (const t of Object.keys(ctx.db.tokens)) if (ctx.db.tokens[t] === user.id) delete ctx.db.tokens[t]
  save()
  return OK(status === 'aktif' ? 'Akun berhasil diaktifkan' : 'Akun berhasil dinonaktifkan', userRes(user))
})

on('POST', '/admin/users/:id/reset-password', (ctx) => {
  authorize(ctx, 'admin')
  const user = findOr404(ctx.db.users, ctx.params.id)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const temp = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  user.password = temp
  save()
  return OK('Kata sandi berhasil direset', { user_id: user.id, name: user.name, email: user.email, temporary_password: temp })
})

on('GET', '/admin/payment-verifications', (ctx) => {
  authorize(ctx, 'admin')
  const queue = ctx.db.bookings.filter((b) => b.status === 'menunggu_verifikasi').sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
  const { data, meta } = paginate(queue, ctx.query, 5)
  return OK('Antrean verifikasi berhasil diambil', data.map((b) => bookingRes(ctx.db, b)), meta)
})

on('GET', '/admin/payment-verifications/:id', (ctx) => {
  authorize(ctx, 'admin')
  return OK('Detail verifikasi berhasil diambil', bookingRes(ctx.db, findOr404(ctx.db.bookings, ctx.params.id)))
})

on('POST', '/admin/payment-verifications/:id/approve', (ctx) => {
  const me = authorize(ctx, 'admin')
  const b = findOr404(ctx.db.bookings, ctx.params.id)
  if (b.status !== 'menunggu_verifikasi') throw conflict('Status pemesanan sudah berubah (mungkin diproses Pengawas lain).')
  b.status = 'pembayaran_terverifikasi'
  b.verified_by = me.id
  b.verified_at = nowIso()
  b.rejection_reason = null
  save()
  return OK('Pembayaran berhasil diterima', bookingRes(ctx.db, b))
})

on('POST', '/admin/payment-verifications/:id/reject', (ctx) => {
  const me = authorize(ctx, 'admin')
  const b = findOr404(ctx.db.bookings, ctx.params.id)
  const reason = str(ctx.body.reason)
  fail(reason ? {} : { reason: ['Alasan penolakan wajib diisi.'] })
  if (b.status !== 'menunggu_verifikasi') throw conflict('Status pemesanan sudah berubah (mungkin diproses Pengawas lain).')
  b.status = 'pembayaran_ditolak'
  b.verified_by = me.id
  b.verified_at = nowIso()
  b.rejection_reason = reason
  save()
  return OK('Pembayaran berhasil ditolak', bookingRes(ctx.db, b))
})

on('GET', '/admin/reports/revenue', (ctx) => {
  authorize(ctx, 'admin')
  let bookings = ctx.db.bookings
  if (ctx.query.host_id) {
    const own = ctx.db.homestays.filter((h) => h.host_id === Number(ctx.query.host_id)).map((h) => h.id)
    const roomIds = ctx.db.rooms.filter((r) => own.includes(r.homestay_id)).map((r) => r.id)
    bookings = bookings.filter((b) => roomIds.includes(b.room_id))
  }
  return revenueReport(ctx.db, ctx.query, bookings, { withHost: true })
})

