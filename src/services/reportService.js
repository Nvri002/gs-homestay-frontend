import api from './api'
import { mapRevenue } from './mappers'

// scope: 'host' -> /host/reports/revenue, 'admin' -> /admin/reports/revenue (komponen laporan yang sama).
export const reportService = {
  // v: { period: 'daily'|'monthly'|'range', date, month, start_date, end_date, host_id? }
  async revenue(scope, v) {
    const params = { period: v.period }
    if (v.period === 'daily') params.date = v.date
    if (v.period === 'monthly') params.month = v.month
    if (v.period === 'range') {
      params.start_date = v.start_date
      params.end_date = v.end_date
    }
    if (scope === 'admin' && v.host_id) params.host_id = v.host_id
    const res = await api.get(`/${scope}/reports/revenue`, { params })
    return mapRevenue(res.data)
  },
}
