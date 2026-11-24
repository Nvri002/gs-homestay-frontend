import { roomTypeLabel } from './constants'
import { formatRupiah, formatTanggal } from './format'

// Baris rincian pemesanan untuk tampilan Host/Pengawas (termasuk data tamu).
export function buildStaffBookingRows(b) {
  return [
    { label: 'Tamu', value: b.guest?.name },
    { label: 'Email', value: b.guest?.email },
    { label: 'Telepon', value: b.guest?.phone },
    { label: 'Homestay', value: b.homestay?.name },
    { label: 'Kamar', value: [roomTypeLabel(b.room.type), b.room.name].filter(Boolean).join(', ') || b.room.name },
    { label: 'Tanggal menginap', value: `${formatTanggal(b.checkIn)} sampai ${formatTanggal(b.checkOut)}` },
    { label: 'Jumlah tamu', value: `${b.guestCount} orang` },
    { label: 'Catatan khusus', value: b.notes ? `“${b.notes}”` : '-' },
    { label: 'Harga per malam', value: formatRupiah(b.pricePerNight) },
    { label: 'Jumlah malam', value: `${b.nights} malam` },
    { label: 'Total biaya', value: formatRupiah(b.totalPrice), strong: true, tone: 'primary' },
  ]
}
