import api from './api'
import { mapAvailabilityRoom } from './mappers'

export const availabilityService = {
  // month: 'YYYY-MM'
  async get({ month, homestay_id = '', room_type = '' }) {
    const params = { month }
    if (homestay_id) params.homestay_id = homestay_id
    if (room_type) params.room_type = room_type
    const res = await api.get('/host/availability', { params })
    return {
      rooms: (res.data?.data ?? []).map(mapAvailabilityRoom),
      month: res.data?.meta?.month ?? month,
      totalRooms: res.data?.meta?.total_rooms ?? (res.data?.data ?? []).length,
    }
  },
}
