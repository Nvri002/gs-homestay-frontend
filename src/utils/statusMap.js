// Status pemesanan resmi dari API Contract (urutan = urutan chip filter).
export const BOOKING_STATUS = {
  menunggu_pembayaran: { label: 'Menunggu Pembayaran', tone: 'warn', description: 'Segera unggah bukti pembayaran sebelum batas waktu.' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', tone: 'info', description: 'Pembayaran Anda sedang diperiksa oleh Pengawas Sistem.' },
  pembayaran_terverifikasi: { label: 'Pembayaran Terverifikasi', tone: 'teal', description: 'Pembayaran terverifikasi. Menunggu konfirmasi dari Host.' },
  pembayaran_ditolak: { label: 'Pembayaran Ditolak', tone: 'bad', description: 'Bukti pembayaran ditolak. Silakan unggah ulang bukti yang benar.' },
  terkonfirmasi: { label: 'Terkonfirmasi', tone: 'ok', description: 'Pemesanan Anda telah dikonfirmasi. Selamat menginap!' },
  ditolak: { label: 'Ditolak', tone: 'bad', description: 'Pemesanan ditolak oleh Host.' },
}

export const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  ...Object.entries(BOOKING_STATUS).map(([value, s]) => ({ value, label: s.label })),
]

// Tombol Unggah Bukti hanya muncul pada dua status ini.
export const CAN_UPLOAD_PROOF = ['menunggu_pembayaran', 'pembayaran_ditolak']

// Status akun/homestay/kamar.
export const ENTITY_STATUS = {
  aktif: { label: 'Aktif', tone: 'ok' },
  nonaktif: { label: 'Nonaktif', tone: 'neutral' },
}

// Status tanggal pada kalender ketersediaan. `mark` = penanda teks agar tidak hanya bergantung warna.
export const CALENDAR_STATUS = {
  tersedia: { label: 'Tersedia', cell: 'bg-ok-bg text-ok-fg', mark: '' },
  ditahan: { label: 'Ditahan', cell: 'bg-warn-bg text-warn-fg', mark: 'D' },
  terpesan: { label: 'Terpesan', cell: 'bg-info-bg text-info-fg', mark: 'P' },
  nonaktif: { label: 'Nonaktif', cell: 'bg-neutral-bg text-neutral-fg', mark: '–' },
}
