import { createRouter, createWebHistory } from 'vue-router'
import { ROLES } from '@/utils/constants'
import PublicLayout from '@/layouts/PublicLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { installGuards } from './guards'

// Seluruh halaman dimuat lazy lewat import.meta.glob. Nama file harus sama dengan yang dirujuk di bawah;
// jika tidak, error langsung muncul saat aplikasi dimulai (bukan saat halaman dibuka).
const modules = import.meta.glob('../views/**/*.vue')
const view = (path) => {
  const loader = modules[`../views/${path}.vue`]
  if (!loader) throw new Error(`View tidak ditemukan: ${path}`)
  return loader
}

const tamu = { requiresAuth: true, roles: [ROLES.TAMU] }

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'beranda', component: view('public/BerandaView'), meta: { title: 'Cari Kamar' } },
      { path: 'hasil', name: 'hasil', component: view('public/HasilPencarianView'), meta: { title: 'Hasil Pencarian' } },
      { path: 'homestay/:id', name: 'homestay-detail', component: view('public/DetailHomestayView'), meta: { title: 'Detail Homestay' } },
      { path: 'masuk', name: 'login', component: view('auth/LoginView'), meta: { title: 'Masuk', guestOnly: true } },
      { path: 'daftar', name: 'register', component: view('auth/RegisterView'), meta: { title: 'Daftar', guestOnly: true } },

      // Tamu
      { path: 'pesan/ringkasan', name: 'tamu-pesan-ringkasan', component: view('tamu/RingkasanPemesananView'), meta: { ...tamu, title: 'Ringkasan Pemesanan' } },
      { path: 'pesan/berhasil/:id', name: 'tamu-pesan-berhasil', component: view('tamu/KonfirmasiBookingView'), meta: { ...tamu, title: 'Pemesanan Berhasil' } },
      { path: 'pesan/:kamarId', name: 'tamu-pesan', component: view('tamu/PesanKamarView'), meta: { ...tamu, title: 'Data Pemesanan' } },
      { path: 'pembayaran/:id/unggah', name: 'tamu-unggah-bukti', component: view('tamu/UnggahBuktiView'), meta: { ...tamu, title: 'Unggah Bukti Pembayaran' } },
      { path: 'riwayat', name: 'tamu-riwayat', component: view('tamu/RiwayatView'), meta: { ...tamu, title: 'Riwayat Pemesanan' } },
      { path: 'riwayat/:id', name: 'tamu-riwayat-detail', component: view('tamu/DetailPemesananView'), meta: { ...tamu, title: 'Detail Pemesanan' } },

      { path: 'akses-ditolak', name: 'akses-ditolak', component: view('shared/ForbiddenView'), meta: { title: 'Akses Ditolak' } },
    ],
  },
  {
    path: '/host',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.HOST] },
    children: [
      { path: '', redirect: { name: 'host-ketersediaan' } },
      { path: 'ketersediaan', name: 'host-ketersediaan', component: view('host/KetersediaanView'), meta: { title: 'Ketersediaan Kamar' } },
      { path: 'reservasi', name: 'host-reservasi', component: view('host/ReservasiView'), meta: { title: 'Konfirmasi Reservasi' } },
      { path: 'reservasi/:id', name: 'host-reservasi-detail', component: view('host/DetailReservasiView'), meta: { title: 'Detail Reservasi' } },
      { path: 'homestay', name: 'host-homestay', component: view('host/HomestayView'), meta: { title: 'Kelola Homestay' } },
      { path: 'kamar', name: 'host-kamar', component: view('host/KamarView'), meta: { title: 'Kelola Kamar' } },
      { path: 'laporan', name: 'host-laporan', component: view('shared/LaporanView'), meta: { title: 'Laporan Pendapatan' } },
    ],
  },
  {
    path: '/pengawas',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.PENGAWAS] },
    children: [
      { path: '', redirect: { name: 'pengawas-verifikasi' } },
      { path: 'verifikasi', name: 'pengawas-verifikasi', component: view('pengawas/VerifikasiView'), meta: { title: 'Verifikasi Pembayaran' } },
      { path: 'verifikasi/:id', name: 'pengawas-verifikasi-detail', component: view('pengawas/DetailVerifikasiView'), meta: { title: 'Detail Verifikasi' } },
      { path: 'akun', name: 'pengawas-akun', component: view('pengawas/AkunView'), meta: { title: 'Kelola Akun' } },
      { path: 'laporan', name: 'pengawas-laporan', component: view('shared/LaporanView'), meta: { title: 'Laporan Pendapatan' } },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    component: PublicLayout,
    children: [{ path: '', name: 'not-found', component: view('shared/NotFoundView'), meta: { title: 'Halaman Tidak Ditemukan' } }],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

installGuards(router)

export default router
