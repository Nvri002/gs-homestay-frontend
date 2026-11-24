import api from './api'
import { mapBooking } from './mappers'

export const bookingService = {
  // body: { room_id, check_in, check_out, guest_count, notes? }
  async preview(payload) {
    const res = await api.post('/bookings/preview', payload)
    return mapBooking(res.data?.data ?? {})
  },

  async create(payload) {
    const res = await api.post('/bookings', payload)
    return mapBooking(res.data?.data ?? {})
  },

  async list({ status = '', page = 1 } = {}) {
    const params = { page }
    if (status) params.status = status
    const res = await api.get('/bookings', { params })
    return { items: (res.data?.data ?? []).map(mapBooking), meta: res.data?.meta ?? null }
  },

  async detail(id) {
    const res = await api.get(`/bookings/${id}`)
    return mapBooking(res.data?.data ?? {})
  },

  // multipart/form-data: field `proof` (JPG/PNG/PDF, maks 2 MB)
  async uploadProof(id, file) {
    const fd = new FormData()
    fd.append('proof', file)
    const res = await api.post(`/bookings/${id}/payment-proof`, fd)
    return res.data
  },

  // File bukti ada di disk privat: ambil sebagai Blob lewat endpoint ber-auth.
  // skipForbiddenRedirect: 403 ditampilkan sebagai fallback pratinjau; 401 tetap mengarah ke Login.
  async fetchProof(id) {
    const res = await api.get(`/bookings/${id}/payment-proof`, { responseType: 'blob', skipForbiddenRedirect: true })
    return res.data
  },
}
