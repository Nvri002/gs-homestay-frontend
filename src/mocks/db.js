import { clearProofs } from './files'
import { placeholderPhoto } from './photos'
import { addDays, hoursAgo, hoursAhead, nowIso, todayJ } from './time'

const KEY = 'gsh_mock_db_v1'
let state = null

function seed() {
  const today = todayJ()
  const d = (n) => addDays(today, n)
  const pw = 'password123'
  const user = (id, name, email, phone, role, status = 'aktif') => ({ id, name, email, phone, password: pw, role, status, created_at: hoursAgo(24 * 30) })

  const users = [
    user(1, 'Pengawas Sistem', 'admin@demo.test', '081200000001', 'admin'),
    user(2, 'Budi Santoso', 'host@demo.test', '085212345678', 'host'),
    user(3, 'Siti Rahma', 'host2@demo.test', '081377001122', 'host'),
    user(4, 'Rizka Amelia', 'tamu@demo.test', '081234567890', 'tamu'),
    user(5, 'Farhan Ramadhan', 'tamu2@demo.test', '081377889900', 'tamu'),
    user(6, 'Ahmad Fauzi', 'nonaktif@demo.test', '081299887766', 'tamu', 'nonaktif'),
  ]

  const homestays = [
    {
      id: 1, host_id: 2, name: 'GS Homestay Pekanbaru', address: 'Jl. Sudirman No. 120, Pekanbaru',
      description: 'Homestay bersih dan nyaman dekat pusat kota, 10 menit dari Bandara SSK II.',
      contact_phone: '081234500011', status: 'aktif', facilities: ['WiFi', 'Parkir', 'Dapur Bersama', 'Dispenser'],
      photos: [placeholderPhoto('GS Homestay Pekanbaru', 'Tampak depan', 172), placeholderPhoto('GS Homestay Pekanbaru', 'Ruang bersama', 160), placeholderPhoto('GS Homestay Pekanbaru', 'Dapur bersama', 190)],
      created_at: hoursAgo(24 * 30),
    },
    {
      id: 2, host_id: 3, name: 'Griya Sagu Panam', address: 'Jl. Garuda Sakti KM 2, Pekanbaru',
      description: 'Rumah dua lantai di kawasan Panam dengan suasana tenang.',
      contact_phone: '081377001199', status: 'aktif', facilities: ['WiFi', 'Parkir', 'Musala'],
      photos: [placeholderPhoto('Griya Sagu Panam', 'Tampak depan', 28), placeholderPhoto('Griya Sagu Panam', 'Teras', 40)],
      created_at: hoursAgo(24 * 28),
    },
  ]

  const room = (id, homestay_id, name, room_type, capacity, price, description, facilities, hue) => ({
    id, homestay_id, name, room_type, capacity, price_per_night: price, description, facilities, status: 'aktif',
    photos: [placeholderPhoto(name, room_type.toUpperCase(), hue), placeholderPhoto(name, 'Kamar mandi', hue + 20)],
    created_at: hoursAgo(24 * 29),
  })
  const rooms = [
    room(1, 1, 'Kamar Standar 01', 'standard', 2, 250000, 'Kasur queen, AC, kamar mandi dalam.', ['AC', 'WiFi', 'Kamar Mandi Dalam'], 175),
    room(2, 1, 'Kamar Deluxe 02', 'deluxe', 3, 350000, 'Kasur king, AC, TV, balkon kecil.', ['AC', 'WiFi', 'TV', 'Kamar Mandi Dalam'], 200),
    room(3, 1, 'Kamar Family 03', 'family', 5, 550000, 'Dua kasur, ruang keluarga mini.', ['AC', 'WiFi', 'TV', 'Kamar Mandi Dalam', 'Dispenser'], 150),
    room(4, 2, 'Kamar Melati', 'standard', 2, 200000, 'Kamar sederhana, kipas dan AC.', ['AC', 'WiFi'], 30),
    room(5, 2, 'Kamar Anggrek', 'deluxe', 3, 300000, 'Kamar luas dengan meja kerja.', ['AC', 'WiFi', 'TV', 'Kamar Mandi Dalam'], 45),
  ]

  const nights = (a, b) => (Date.UTC(...b.split('-').map((v, i) => (i === 1 ? v - 1 : +v))) - Date.UTC(...a.split('-').map((v, i) => (i === 1 ? v - 1 : +v)))) / 86400000
  const booking = (o) => {
    const room = rooms.find((r) => r.id === o.room_id)
    const n = nights(o.check_in, o.check_out)
    const created = o.created ?? 24
    return {
      id: o.id, status: o.status, room_id: o.room_id, guest_id: o.guest_id,
      check_in: o.check_in, check_out: o.check_out, nights: n, guest_count: o.guest_count ?? 2, notes: o.notes ?? '',
      price_per_night: room.price_per_night, total_price: room.price_per_night * n,
      payment_deadline: hoursAhead(24 - created), created_at: hoursAgo(created),
      proof: o.proof != null ? { file_name: o.proofName ?? 'bukti_transfer.png', mime_type: 'image/png', uploaded_at: hoursAgo(o.proof) } : null,
      rejection_reason: o.reason ?? null,
      verified_by: o.verified != null ? 1 : null, verified_at: o.verified != null ? hoursAgo(o.verified) : null,
      confirmed_at: o.confirmed != null ? hoursAgo(o.confirmed) : null,
    }
  }
  const bookings = [
    booking({ id: 1, room_id: 3, guest_id: 4, check_in: d(1), check_out: d(3), status: 'terkonfirmasi', created: 30, proof: 29, verified: 28, confirmed: 27 }),
    booking({ id: 2, room_id: 2, guest_id: 4, check_in: d(5), check_out: d(7), status: 'menunggu_verifikasi', created: 3, proof: 2, notes: 'Perkiraan tiba pukul 14.00 WIB', proofName: 'bukti_transfer_rizka.png' }),
    booking({ id: 3, room_id: 5, guest_id: 4, check_in: d(10), check_out: d(12), status: 'menunggu_pembayaran', created: 2 }),
    booking({ id: 4, room_id: 1, guest_id: 5, check_in: d(2), check_out: d(4), status: 'pembayaran_terverifikasi', created: 20, proof: 19, verified: 18 }),
    booking({ id: 5, room_id: 4, guest_id: 5, check_in: d(8), check_out: d(9), status: 'pembayaran_ditolak', created: 5, proof: 4, verified: 3, reason: 'Nominal transfer tidak sesuai tagihan', guest_count: 1 }),
    booking({ id: 6, room_id: 2, guest_id: 5, check_in: d(12), check_out: d(14), status: 'ditolak', created: 50, proof: 49, verified: 48, reason: 'Kamar sedang diperbaiki pada tanggal tersebut' }),
    booking({ id: 7, room_id: 1, guest_id: 4, check_in: d(-2), check_out: d(0), status: 'terkonfirmasi', created: 96, proof: 95, verified: 94, confirmed: 93 }),
    booking({ id: 8, room_id: 4, guest_id: 5, check_in: d(-4), check_out: d(-2), status: 'terkonfirmasi', created: 120, proof: 119, verified: 118, confirmed: 117, guest_count: 2 }),
    booking({ id: 9, room_id: 3, guest_id: 5, check_in: d(15), check_out: d(18), status: 'menunggu_verifikasi', created: 1, proof: 0.5, guest_count: 4 }),
    booking({ id: 10, room_id: 5, guest_id: 4, check_in: d(20), check_out: d(22), status: 'terkonfirmasi', created: 40, proof: 39, verified: 38, confirmed: 37 }),
    booking({ id: 11, room_id: 4, guest_id: 4, check_in: d(25), check_out: d(27), status: 'menunggu_pembayaran', created: 1 }),
  ]
  const seeded = new Set(bookings.map((b) => b.id))

  return {
    users, homestays, rooms, bookings, tokens: {},
    seq: { users: 6, homestays: 2, rooms: 5, bookings: Math.max(...seeded) },
    createdAt: nowIso(),
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* data rusak: buat ulang */
  }
  const s = seed()
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* abaikan */
  }
  return s
}

export function db() {
  if (!state) state = load()
  return state
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* kuota penuh: data tetap ada di memori selama halaman terbuka */
  }
}

export function nextId(table) {
  const s = db()
  s.seq[table] = (s.seq[table] || 0) + 1
  return s.seq[table]
}

export async function resetMockDb() {
  localStorage.removeItem(KEY)
  state = null
  await clearProofs()
}

// Mencabut semua token (untuk menguji alur 401 "sesi berakhir").
export function revokeAllTokens() {
  db().tokens = {}
  save()
}
