import api from './api'
import { mapTempPassword, mapUser } from './mappers'

export const adminUserService = {
  async list({ role = '', status = '', search = '', page = 1, per_page = '' } = {}) {
    const params = { page }
    if (role) params.role = role
    if (status) params.status = status
    if (search) params.search = search
    if (per_page) params.per_page = per_page
    const res = await api.get('/admin/users', { params })
    return { items: (res.data?.data ?? []).map(mapUser), meta: res.data?.meta ?? null }
  },

  // Daftar Host untuk filter laporan (per_page=100 sesuai kontrak).
  async hosts() {
    const { items } = await this.list({ role: 'host', per_page: 100 })
    return items
  },

  // Khusus tambah akun Host: { name, email, phone, password } (role otomatis host, status aktif)
  async create(payload) {
    const res = await api.post('/admin/users', payload)
    return res.data
  },

  // { name, email, phone }
  async update(id, payload) {
    const res = await api.put(`/admin/users/${id}`, payload)
    return res.data
  },

  // status: 'aktif' | 'nonaktif' (409 bila Pengawas menonaktifkan akunnya sendiri)
  async setStatus(id, status) {
    const res = await api.patch(`/admin/users/${id}/status`, { status })
    return res.data
  },

  async resetPassword(id) {
    const res = await api.post(`/admin/users/${id}/reset-password`)
    return mapTempPassword(res.data?.data ?? {})
  },
}
