import api from './api'
import { mapAvailability, mapHomestay } from './mappers'

// Membuang parameter kosong agar query string bersih.
function clean(params = {}) {
  const out = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === '' || v === null || v === undefined) continue
    if (Array.isArray(v) && !v.length) continue
    out[k] = v
  }
  return out
}

export const homestayService = {
  // Tanpa tanggal = daftar homestay aktif; dengan tanggal = pencarian.
  // params: check_in, check_out, guests, min_price, max_price, room_type, facilities[], page
  async list(params) {
    const res = await api.get('/homestays', { params: clean(params) })
    return { items: (res.data?.data ?? []).map(mapHomestay), meta: res.data?.meta ?? null }
  },

  // params opsional: check_in, check_out, guests
  async detail(id, params) {
    const res = await api.get(`/homestays/${id}`, { params: clean(params) })
    return mapHomestay(res.data?.data ?? {})
  },

  // params: check_in, check_out, guests
  async roomAvailability(roomId, params) {
    const res = await api.get(`/rooms/${roomId}/availability`, { params: clean(params) })
    return mapAvailability(res.data?.data ?? {})
  },
}
