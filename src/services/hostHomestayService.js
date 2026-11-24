import api from './api'
import { mapHostHomestay } from './mappers'

// multipart/form-data. Untuk update, Laravel membutuhkan POST + _method=PUT.
function buildForm(v, method) {
  const fd = new FormData()
  fd.append('name', v.name.trim())
  fd.append('address', v.address.trim())
  fd.append('description', v.description.trim())
  fd.append('contact_phone', v.contact_phone.trim())
  v.facilities.forEach((f) => fd.append('facilities[]', f))
  v.photos.forEach((p) => fd.append('photos[]', p))
  if (method) fd.append('_method', method)
  return fd
}

export const hostHomestayService = {
  async list(page = 1) {
    const res = await api.get('/host/homestays', { params: { page } })
    return { items: (res.data?.data ?? []).map(mapHostHomestay), meta: res.data?.meta ?? null }
  },

  // Seluruh homestay Host (untuk dropdown filter/form); menelusuri semua halaman pagination.
  async all() {
    const out = []
    let page = 1
    let last = 1
    do {
      const { items, meta } = await this.list(page)
      out.push(...items)
      last = meta?.last_page ?? 1
      page += 1
    } while (page <= last && page <= 20)
    return out
  },

  async detail(id) {
    const res = await api.get(`/host/homestays/${id}`)
    return mapHostHomestay(res.data?.data ?? {})
  },

  async create(values) {
    const res = await api.post('/host/homestays', buildForm(values))
    return res.data
  },

  async update(id, values) {
    const res = await api.post(`/host/homestays/${id}`, buildForm(values, 'PUT'))
    return res.data
  },

  async deactivate(id) {
    const res = await api.patch(`/host/homestays/${id}/deactivate`)
    return res.data
  },
}
