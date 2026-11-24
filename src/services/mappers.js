// Semua pembacaan field response publik (homestay & kamar) ada di file ini.
// ASUMSI bentuk response (snake_case, mengikuti API Contract):
//   homestay: id, name, address, description, facilities[], photos[] , min_price?, rooms[]
//   room    : id, name, room_type, capacity, description, facilities[], photos[],
//             price_per_night, total_price?, nights?, is_available?
// Bila nama field di backend berbeda, cukup ubah di sini.

const ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '')

export function assetUrl(path) {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  return `${ORIGIN}/${String(path).replace(/^\/+/, '')}`
}

function toList(value) {
  if (!value) return []
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean)
  if (Array.isArray(value)) return value.map((i) => (typeof i === 'string' ? i : i?.name ?? i?.label)).filter(Boolean)
  return []
}

function toPhotos(...values) {
  const out = []
  for (const v of values) {
    if (!v) continue
    for (const p of Array.isArray(v) ? v : [v]) {
      const url = typeof p === 'string' ? p : p?.url ?? p?.photo_url ?? p?.path
      if (url) out.push(assetUrl(url))
    }
  }
  return [...new Set(out)]
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

export function mapRoom(raw, homestay = null) {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.room_type ?? raw.type ?? '',
    capacity: num(raw.capacity),
    description: raw.description ?? '',
    facilities: toList(raw.facilities),
    photos: toPhotos(raw.photos, raw.photo, raw.photo_url),
    pricePerNight: num(raw.price_per_night ?? raw.price) ?? 0,
    totalPrice: num(raw.total_price),
    nights: num(raw.nights),
    available: raw.is_available ?? raw.available ?? null, // null = tidak ada info (anggap tersedia)
    homestay: homestay ?? (raw.homestay ? { id: raw.homestay.id, name: raw.homestay.name } : null),
  }
}

export function mapHomestay(raw) {
  const ref = { id: raw.id, name: raw.name }
  const rooms = (raw.rooms ?? []).map((r) => mapRoom(r, ref))
  const prices = rooms.map((r) => r.pricePerNight).filter(Boolean)
  const start = num(raw.min_price ?? raw.starting_price) ?? (prices.length ? Math.min(...prices) : null)
  return {
    id: raw.id,
    name: raw.name,
    address: raw.address ?? '',
    description: raw.description ?? '',
    facilities: toList(raw.facilities),
    photos: toPhotos(raw.photos, raw.photo, raw.photo_url),
    startingPrice: start,
    rooms,
  }
}

// ---- Pemesanan (bookings) ----
// Dipakai untuk response POST /bookings/preview, POST /bookings, GET /bookings, GET /bookings/{id}.
function mapProof(p) {
  if (!p) return null
  const has = p.has_proof ?? !!p.file_name
  return has ? { fileName: p.file_name ?? '', mimeType: p.mime_type ?? '', uploadedAt: p.uploaded_at ?? null } : null
}

export function mapBooking(raw) {
  const r = typeof raw.room === 'string' ? { name: raw.room } : raw.room ?? {}
  const pi = raw.payment_instruction
  return {
    id: raw.id ?? null,
    code: raw.code ?? '',
    status: raw.status ?? '',
    homestay: raw.homestay ? { id: raw.homestay.id, name: raw.homestay.name, address: raw.homestay.address ?? '' } : null,
    room: { id: r.id ?? null, name: r.name ?? '', type: r.room_type ?? '', capacity: num(r.capacity) },
    guest: raw.guest ? { id: raw.guest.id, name: raw.guest.name, email: raw.guest.email, phone: raw.guest.phone } : null,
    checkIn: raw.check_in ?? '',
    checkOut: raw.check_out ?? '',
    nights: num(raw.nights) ?? 0,
    guestCount: num(raw.guest_count) ?? 0,
    notes: raw.notes ?? '',
    pricePerNight: num(raw.price_per_night) ?? 0,
    totalPrice: num(raw.total_price) ?? 0,
    paymentDeadline: raw.payment_deadline ?? null,
    paymentInstruction: pi ? { bank: pi.bank, accountNumber: pi.account_number, accountName: pi.account_name } : null,
    proof: mapProof(raw.payment_proof),
    rejectionReason: raw.rejection_reason ?? '',
    verifiedAt: raw.verified_at ?? null,
    confirmedAt: raw.confirmed_at ?? null,
    createdAt: raw.created_at ?? null,
  }
}

// Response GET /rooms/{id}/availability
export function mapAvailability(raw) {
  return {
    roomId: raw.room_id,
    roomName: raw.room_name ?? '',
    homestayId: raw.homestay_id ?? null,
    homestayName: raw.homestay_name ?? '',
    roomType: raw.room_type ?? '',
    capacity: num(raw.capacity),
    pricePerNight: num(raw.price_per_night) ?? 0,
    nights: num(raw.nights) ?? 0,
    totalPrice: num(raw.total_price),
    isAvailable: raw.is_available ?? null,
    reason: raw.reason ?? '',
  }
}

// ---- Host ----
export function mapHostHomestay(raw) {
  const photos = toPhotos(raw.photos)
  return {
    id: raw.id,
    name: raw.name ?? '',
    address: raw.address ?? '',
    description: raw.description ?? '',
    contactPhone: raw.contact_phone ?? '',
    status: raw.status ?? 'aktif',
    facilities: toList(raw.facilities),
    coverPhoto: assetUrl(raw.cover_photo) || photos[0] || '',
    photos,
    roomsCount: num(raw.rooms_count) ?? 0,
    createdAt: raw.created_at ?? null,
  }
}

export function mapHostRoom(raw) {
  return {
    id: raw.id,
    homestayId: raw.homestay_id ?? null,
    homestayName: raw.homestay_name ?? '',
    name: raw.name ?? '',
    type: raw.room_type ?? '',
    capacity: num(raw.capacity),
    pricePerNight: num(raw.price_per_night) ?? 0,
    description: raw.description ?? '',
    facilities: toList(raw.facilities),
    photos: toPhotos(raw.photos),
    status: raw.status ?? 'aktif',
    createdAt: raw.created_at ?? null,
  }
}

// Satu baris kalender: satu kamar + status per tanggal.
export function mapAvailabilityRoom(raw) {
  const dates = {}
  for (const [iso, v] of Object.entries(raw.dates ?? {})) {
    dates[iso] = { status: v?.status ?? '', bookingId: v?.booking_id ?? null, bookingCode: v?.booking_code ?? '', guestName: v?.guest_name ?? '' }
  }
  return {
    roomId: raw.room_id,
    room: raw.room ?? '',
    homestayId: raw.homestay_id ?? null,
    homestayName: raw.homestay_name ?? '',
    roomType: raw.room_type ?? '',
    status: raw.status ?? 'aktif',
    dates,
  }
}

export function mapRevenue(body) {
  const d = body?.data ?? {}
  return {
    message: body?.message ?? '',
    period: d.period ?? '',
    label: d.label ?? '',
    totalRevenue: num(d.total_revenue) ?? 0,
    totalBookings: num(d.total_bookings) ?? 0,
    items: (d.items ?? []).map((i) => ({
      bookingId: i.booking_id ?? null,
      code: i.code ?? '',
      homestay: i.homestay ?? '',
      room: i.room ?? '',
      hostName: i.host_name ?? '',
      guestName: i.guest_name ?? '',
      checkIn: i.check_in ?? '',
      checkOut: i.check_out ?? '',
      nights: num(i.nights) ?? 0,
      totalPrice: num(i.total_price) ?? 0,
    })),
  }
}

// ---- Pengawas ----
export function mapUser(raw) {
  return {
    id: raw.id,
    name: raw.name ?? '',
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    role: raw.role ?? '',
    status: raw.status ?? '',
    createdAt: raw.created_at ?? null,
  }
}

export function mapTempPassword(raw) {
  return { userId: raw.user_id, name: raw.name ?? '', email: raw.email ?? '', temporaryPassword: raw.temporary_password ?? '' }
}
