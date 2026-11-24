import api from './api'
import { mapBooking } from './mappers'

export const hostBookingService = {
  async list({ status = '', homestay_id = '', page = 1 } = {}) {
    const params = { page }
    if (status) params.status = status
    if (homestay_id) params.homestay_id = homestay_id
    const res = await api.get('/host/bookings', { params })
    return { items: (res.data?.data ?? []).map(mapBooking), meta: res.data?.meta ?? null }
  },

  async detail(id) {
    const res = await api.get(`/host/bookings/${id}`)
    return mapBooking(res.data?.data ?? {})
  },

  // 200 sukses, 409 jika status sudah berubah
  async confirm(id) {
    const res = await api.post(`/host/bookings/${id}/confirm`)
    return res.data
  },

  // 200 sukses, 422 jika alasan kosong, 409 jika status sudah berubah
  async reject(id, reason) {
    const res = await api.post(`/host/bookings/${id}/reject`, { reason })
    return res.data
  },
}
