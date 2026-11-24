import api from './api'
import { mapHostRoom } from './mappers'

function buildForm(v, method) {
  const fd = new FormData()
  fd.append('homestay_id', v.homestay_id)
  fd.append('name', v.name.trim())
  fd.append('room_type', v.room_type)
  fd.append('capacity', v.capacity)
  fd.append('price_per_night', v.price_per_night)
  fd.append('description', v.description.trim())
  v.facilities.forEach((f) => fd.append('facilities[]', f))
  v.photos.forEach((p) => fd.append('photos[]', p))
  if (method) fd.append('_method', method)
  return fd
}

export const hostRoomService = {
  async list({ homestay_id = '', page = 1 } = {}) {
    const params = { page }
    if (homestay_id) params.homestay_id = homestay_id
    const res = await api.get('/host/rooms', { params })
    return { items: (res.data?.data ?? []).map(mapHostRoom), meta: res.data?.meta ?? null }
  },

  async create(values) {
    const res = await api.post('/host/rooms', buildForm(values))
    return res.data
  },

  async update(id, values) {
    const res = await api.post(`/host/rooms/${id}`, buildForm(values, 'PUT'))
    return res.data
  },

  async deactivate(id) {
    const res = await api.patch(`/host/rooms/${id}/deactivate`)
    return res.data
  },
}
