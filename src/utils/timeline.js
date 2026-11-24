import { formatTanggalWaktu } from './format'

const when = (v) => (v ? formatTanggalWaktu(v) : '')

// Menyusun linimasa status dari data yang tersedia di API (hanya waktu yang ada yang ditampilkan).
// state: done | current | pending | bad
export function buildTimeline(b) {
  const steps = [{ label: 'Pemesanan dibuat', sub: when(b.createdAt), state: 'done' }]

  if (b.status === 'menunggu_pembayaran') {
    steps.push({
      label: 'Menunggu bukti pembayaran',
      sub: b.paymentDeadline ? `Batas ${formatTanggalWaktu(b.paymentDeadline)}` : '',
      state: 'current',
    })
    return steps
  }

  steps.push({ label: 'Bukti pembayaran dikirim', sub: when(b.proof?.uploadedAt), state: 'done' })

  switch (b.status) {
    case 'menunggu_verifikasi':
      steps.push({ label: 'Menunggu verifikasi', sub: 'Diperiksa Pengawas Sistem', state: 'current' })
      steps.push({ label: 'Menunggu konfirmasi Host', sub: '', state: 'pending' })
      break
    case 'pembayaran_ditolak':
      steps.push({ label: 'Pembayaran ditolak Pengawas', sub: 'Silakan unggah ulang bukti pembayaran', state: 'bad' })
      break
    case 'pembayaran_terverifikasi':
      steps.push({ label: 'Pembayaran diverifikasi Pengawas', sub: when(b.verifiedAt), state: 'done' })
      steps.push({ label: 'Menunggu konfirmasi Host', sub: '', state: 'current' })
      break
    case 'terkonfirmasi':
      steps.push({ label: 'Pembayaran diverifikasi Pengawas', sub: when(b.verifiedAt), state: 'done' })
      steps.push({ label: 'Dikonfirmasi Host', sub: when(b.confirmedAt), state: 'done' })
      break
    case 'ditolak':
      steps.push({ label: 'Pembayaran diverifikasi Pengawas', sub: when(b.verifiedAt), state: 'done' })
      steps.push({ label: 'Ditolak Host', sub: '', state: 'bad' })
      break
  }
  return steps
}
