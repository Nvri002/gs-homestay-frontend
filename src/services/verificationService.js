import api from './api'
import { mapBooking } from './mappers'

export const verificationService = {
  // Antrean pemesanan berstatus menunggu_verifikasi
  async list(page = 1) {
    const res = await api.get('/admin/payment-verifications', { params: { page } })
    return { items: (res.data?.data ?? []).map(mapBooking), meta: res.data?.meta ?? null }
  },

  async detail(id) {
    const res = await api.get(`/admin/payment-verifications/${id}`)
    return mapBooking(res.data?.data ?? {})
  },

  // 200 -> pembayaran_terverifikasi; 409 jika status sudah berubah
  async approve(id) {
    const res = await api.post(`/admin/payment-verifications/${id}/approve`)
    return res.data
  },

  // 200 -> pembayaran_ditolak; 422 jika alasan kosong; 409 jika status sudah berubah
  async reject(id, reason) {
    const res = await api.post(`/admin/payment-verifications/${id}/reject`, { reason })
    return res.data
  },
}
