# GS Homestay Pekanbaru — Frontend

Antarmuka web untuk *Sistem Informasi Manajemen Homestay dan Reservasi Online Berbasis Web (Studi Kasus: GS Homestay Pekanbaru)*.
Vue 3 (Composition API) · Vite · Vue Router 4 · Pinia · Axios · Tailwind CSS v4.

## Menjalankan

```bash
npm install
cp .env.example .env        # atur VITE_API_BASE_URL bila backend tidak di 127.0.0.1:8000
npm run dev                 # http://localhost:5173
npm run build               # hasil di dist/
```

Backend Laravel (Sanctum) harus berjalan dan mengizinkan CORS dari `http://localhost:5173`.
Pengujian penyambungan: lihat **INTEGRATION_CHECKLIST.md**.

## Mode Demo (tanpa backend)

```bash
npm run demo          # http://localhost:5173 — semua fitur bisa dicoba dengan data tiruan
npm run build:demo    # build statis berisi mode demo (untuk dipamerkan/di-hosting)
```

- Seluruh endpoint di API Contract disimulasikan di browser (`src/mocks/`), termasuk validasi 422, konflik 409, 401/403/404, unggah berkas, dan penomoran halaman. Interceptor Axios tetap bekerja sama seperti dengan backend asli.
- Panel **Mode Demo** (kiri bawah) menyediakan masuk cepat sebagai Tamu / Host / Pengawas, tombol **Cabut sesi** (uji 401), **Matikan server** (uji error jaringan), dan **Reset data demo**. Kata sandi semua akun: `password123`.
- Data tersimpan di browser (localStorage + IndexedDB untuk berkas bukti bayar), jadi tetap ada setelah refresh.
- Mode demo **mati secara default**; `npm run dev` dan `npm run build` memakai backend asli dan tidak memuat kode demo sama sekali.
- Untuk menghapus mode demo dari proyek: hapus folder `src/mocks/`, `src/components/common/MockBanner.vue`, berkas `.env.mock`, blok `VITE_USE_MOCK` di `src/services/api.js`, dan tiga baris terkait di `src/App.vue`.

## Struktur

```
src/
├─ services/      Axios (api.js), pemanggilan endpoint per modul, mappers.js (pembacaan field response)
├─ mocks/         backend tiruan untuk Mode Demo (tidak dipakai pada build biasa)
├─ stores/        auth (token & user), ui (tema & toast), bookingDraft (draft pemesanan)
├─ router/        route + guard login/peran
├─ layouts/       PublicLayout (publik & Tamu), DashboardLayout (Host & Pengawas)
├─ components/    common/ (UI dasar), booking/, host/, pengawas/, layout/
├─ composables/   useApiError (error 422), useAsyncAction (anti double-submit), useBookRoom
├─ utils/         format, constants, statusMap, search, timeline, fileValidation, dll.
└─ views/         auth/, public/, tamu/, host/, pengawas/, shared/
```

Halaman tidak berisi data dummy: seluruh data berasal dari REST API (atau dari backend tiruan hanya saat Mode Demo).
Titik penyesuaian bila format response backend berbeda: `services/mappers.js`, `stores/auth.js`, `utils/constants.js`.
