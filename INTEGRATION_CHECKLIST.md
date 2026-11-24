# Checklist Integrasi Frontend ↔ Backend — GS Homestay Pekanbaru

Dokumen ini dipakai saat Frontend (Vue.js) pertama kali disambungkan ke Backend (Laravel).
Centang `[ ]` → `[x]` saat lulus. Jika gagal, catat di **Lembar Temuan** (bagian 8).

- Base URL API: `http://127.0.0.1:8000/api` (ubah di `.env` → `VITE_API_BASE_URL`)
- Frontend: `npm install` → `npm run dev` → buka `http://localhost:5173` (**bukan** `npm run demo`; mode demo tidak memakai backend)
- Alat bantu: DevTools browser (tab **Network** dan **Console**), Postman/Insomnia untuk membandingkan response.

---

## 0. Prasyarat Backend

- [ ] `php artisan serve` berjalan di `127.0.0.1:8000`; `GET /api/homestays` dapat dibuka dari browser.
- [ ] **CORS** mengizinkan origin `http://localhost:5173` dan `http://127.0.0.1:5173` (`config/cors.php`, path `api/*`, header `Authorization`, `Content-Type`, `Accept`).
- [ ] **Sanctum Bearer Token** aktif (tidak memakai cookie/CSRF; Frontend hanya mengirim `Authorization: Bearer {token}`).
- [ ] Semua error API berbentuk JSON (`{"message": "..."}`), termasuk 401/403/404/422/409 (Frontend mengirim `Accept: application/json`).
- [ ] `php artisan storage:link` sudah dijalankan agar foto publik (`/storage/...`) dapat dibuka.
- [ ] Bukti pembayaran tersimpan di **disk privat** dan hanya terbaca lewat `GET /api/bookings/{id}/payment-proof`.
- [ ] Batas unggah PHP memadai: `upload_max_filesize` dan `post_max_size` (mis. ≥ 20M) agar unggah beberapa foto 2 MB tidak gagal dengan 413/422 yang membingungkan.
- [ ] Zona waktu aplikasi `Asia/Jakarta`; semua datetime berformat ISO 8601 dengan offset (`2026-10-19T09:30:00+07:00`).
- [ ] **Data uji (seeder)** tersedia:
  - [ ] 1 akun Pengawas Sistem (`role: admin`)
  - [ ] 2 akun Host: Host A (≥ 2 homestay, ≥ 4 kamar bertipe `standard`/`deluxe`/`family`), Host B (1 homestay)
  - [ ] 2 akun Tamu
  - [ ] Pemesanan contoh untuk **setiap status**: `menunggu_pembayaran`, `menunggu_verifikasi`, `pembayaran_terverifikasi`, `pembayaran_ditolak`, `terkonfirmasi`, `ditolak`
  - [ ] Minimal 1 pemesanan dengan bukti bayar JPG dan 1 dengan PDF

---

## 1. Asumsi Frontend yang Harus Cocok dengan Backend

Jika ada yang berbeda, perbaiki di file Frontend yang tertera (cukup satu tempat).

| # | Asumsi Frontend | Cek di backend | Ubah di |
|---|---|---|---|
| 1 | `POST /login` → `data.token` dan `data.user` (berisi `role`) | [ ] | `stores/auth.js` → `extractAuth()` |
| 2 | `GET /profile` → objek user langsung di `data` (atau `data.user`) | [ ] | `stores/auth.js` → `fetchProfile()` |
| 3 | Nilai `role`: `tamu`, `host`, `admin` (huruf kecil) | [ ] | `utils/constants.js` → `normalizeRole()` |
| 4 | Status akun/homestay/kamar: `aktif` / `nonaktif` | [ ] | `utils/statusMap.js` |
| 5 | Status pemesanan: `menunggu_pembayaran`, `menunggu_verifikasi`, `pembayaran_terverifikasi`, `pembayaran_ditolak`, `terkonfirmasi`, `ditolak` | [ ] | `utils/statusMap.js` |
| 6 | Foto berupa path relatif (`/storage/...`) atau URL absolut; path relatif diberi awalan origin dari `VITE_API_BASE_URL` tanpa `/api` | [ ] | `services/mappers.js` → `assetUrl()` |
| 7 | `GET /homestays`: tiap homestay memuat `rooms[]` (saat bertanggal hanya kamar tersedia, dengan `nights`, `total_price`, `is_available`) dan `min_price` | [ ] | `services/mappers.js` → `mapHomestay()` |
| 8 | `GET /homestays/{id}` bertanggal: semua kamar aktif + `is_available` true/false; tanpa tanggal: `nights/total_price/is_available = null` | [ ] | `services/mappers.js` |
| 9 | `POST /bookings` mengembalikan `data.id` (wajib), `code`, `payment_instruction`, dll. | [ ] | `views/tamu/RingkasanPemesananView.vue` |
| 10 | `room_type` ∈ `standard`, `deluxe`, `family` | [ ] | `utils/constants.js` → `ROOM_TYPES` |
| 11 | Fasilitas ∈ `AC`, `WiFi`, `TV`, `Kamar Mandi Dalam`, `Parkir`, `Dapur Bersama`, `Dispenser`, `Musala` | [ ] | `utils/constants.js` → `FACILITY_OPTIONS` |
| 12 | Pagination `meta`: `current_page`, `last_page`, `per_page`, `total`, `from`, `to` | [ ] | `components/common/Pagination.vue` |
| 13 | `GET /bookings/{id}` memuat `verified_at`, `confirmed_at`, `payment_proof {has_proof,file_name,mime_type,uploaded_at}`, `rejection_reason` | [ ] | `services/mappers.js` → `mapBooking()` |
| 14 | Kalender host: objek `dates` berisi **seluruh tanggal** dalam bulan, tiap tanggal `status` + `booking_id` | [ ] | `services/mappers.js` → `mapAvailabilityRoom()` |
| 15 | Update homestay/kamar: `POST` + `_method=PUT` (multipart); `photos[]` diisi = **menggantikan** foto lama, kosong = foto lama tetap | [ ] | `services/hostHomestayService.js`, `hostRoomService.js` |
| 16 | Error 422 berbentuk `{"message": "...", "errors": {"field": ["pesan"]}}`; field array memakai kunci `photos.0`, `facilities.0` | [ ] | `composables/useApiError.js` |
| 17 | `GET /bookings/{id}/payment-proof` mengirim `Content-Type` benar (`image/jpeg`, `image/png`, `application/pdf`); dapat diakses Tamu pemilik, Host pemilik homestay, dan Admin | [ ] | `components/booking/PaymentProofPreview.vue` |
| 18 | `GET /admin/users?role=host&per_page=100` mengembalikan daftar Host (untuk filter laporan) | [ ] | `services/adminUserService.js` |

### Acuan perilaku: aturan yang disimulasikan Mode Demo

`npm run demo` menjalankan backend tiruan (`src/mocks/`) sebagai contoh perilaku yang diharapkan Frontend. Backend asli boleh berbeda, tetapi perbedaannya perlu disepakati:

- **Kamar menahan tanggal** saat status `menunggu_pembayaran` (selama belum lewat `payment_deadline`), `menunggu_verifikasi`, `pembayaran_terverifikasi`, atau `pembayaran_ditolak` → kalender **Ditahan**. Status `terkonfirmasi` → **Terpesan**. Status `ditolak` tidak menahan tanggal.
- Malam yang dihitung: `check_in` s.d. sehari sebelum `check_out` (hari check-out kembali kosong).
- **Reservasi aktif** (penghalang nonaktifkan homestay/kamar) = pemesanan yang menahan/memesan kamar dan `check_out` belum lewat.
- **409 saat memesan** jika kamar bentrok: "Kamar baru saja dipesan Tamu lain."
- **409 unggah bukti** jika status bukan `menunggu_pembayaran`/`pembayaran_ditolak`; unggah ulang menghapus `rejection_reason` dan mengembalikan status ke `menunggu_verifikasi`.
- **Laporan** menghitung pemesanan `terkonfirmasi` yang `check_in`-nya berada dalam periode.
- Menonaktifkan akun mencabut token akun tersebut (request berikutnya → 401); login akun nonaktif → 403.
- Login salah → 401 `{"message": "Email atau kata sandi salah."}`.

---

## 2. Pengecekan Lintas Fitur (Semua Halaman)

**Autentikasi & sesi**
- [ ] Setiap request ber-auth membawa header `Authorization: Bearer …` (lihat tab Network).
- [ ] Muat ulang (refresh) halaman saat sudah login → tetap login; Frontend memanggil `GET /profile` sekali.
- [ ] Token dibuat tidak valid (hapus di DB / ubah di localStorage `gsh_token`) lalu buka halaman ber-login → diarahkan ke `/masuk?redirect=…` + toast "Sesi Anda berakhir".
- [ ] Setelah login ulang, user kembali ke halaman asal (`redirect`).
- [ ] Logout → `POST /logout`, token dan data user terhapus, diarahkan ke `/masuk`; tombol Back browser tidak menampilkan data halaman ber-login.

**Penanganan status HTTP**
- [ ] **401** → sesi dihapus, ke halaman Login (kecuali pada form Login: pesan tampil di form).
- [ ] **403** → halaman "Akses Ditolak" (kecuali pratinjau bukti bayar: tampil "File bukti tidak dapat dibuka").
- [ ] **404** → pesan "… tidak ditemukan" (detail homestay, kamar, pemesanan, reservasi); URL tidak dikenal → halaman 404.
- [ ] **409** → pesan dari API tampil jelas (kamar bentrok, status sudah berubah, tidak bisa nonaktif, akun sendiri) dan data disegarkan bila relevan.
- [ ] **422** → pesan tampil di bawah kolom terkait; kolom lain tidak ikut error.
- [ ] Backend dimatikan → pesan "Tidak dapat terhubung ke server…" dengan tombol **Coba lagi** (bukan layar kosong).

**Loading & anti double-submit**
- [ ] Setiap halaman daftar/detail menampilkan spinner saat memuat.
- [ ] Tombol submit menampilkan spinner dan nonaktif selama request; klik cepat 2–3 kali hanya mengirim **1 request** (cek Network).
- [ ] Modal konfirmasi/penolakan tidak bisa ditutup saat request berjalan.

**Tampilan**
- [ ] Mode gelap (tombol **Tema**) menjaga kontras di semua halaman; pilihan tersimpan setelah refresh.
- [ ] Lebar **360 px, 768 px, 1280 px**: tidak ada halaman yang bergeser ke samping; tabel/kalender menggulir **di dalam kotaknya**.
- [ ] Format: Rupiah `Rp350.000`, tanggal `22 November 2026`, waktu `18 Nov 2026, 10.07 WIB`.

---

## 3. Matriks Akses Peran

| Buka halaman | Belum login | Tamu | Host | Pengawas |
|---|---|---|---|---|
| `/`, `/hasil`, `/homestay/:id` | ✅ | ✅ | ✅ | ✅ |
| `/masuk`, `/daftar` | ✅ | → `/` | → `/host/ketersediaan` | → `/pengawas/verifikasi` |
| `/pesan/…`, `/pembayaran/…`, `/riwayat…` | → Login | ✅ | Akses Ditolak | Akses Ditolak |
| `/host/…` | → Login | Akses Ditolak | ✅ | Akses Ditolak |
| `/pengawas/…` | → Login | Akses Ditolak | Akses Ditolak | ✅ |

- [ ] Semua sel di atas sesuai (uji dengan mengetik URL langsung).
- [ ] Host/Pengawas menekan **Pesan** di hasil pencarian → toast "Hanya akun Tamu yang dapat memesan kamar." (bukan halaman error).

---

## 4. Alur per Use Case

### UC-01 Registrasi — `POST /register`
- [ ] Isi semua kolom valid → sukses → toast + diarahkan ke `/masuk` dengan **email terisi otomatis** dan banner sukses.
- [ ] Kata sandi < 8 karakter → pesan di bawah kolom (tanpa request ke server).
- [ ] Konfirmasi kata sandi berbeda → pesan di bawah kolom.
- [ ] Email sudah terdaftar → **422** tampil di bawah kolom Email.
- [ ] Tautan "Sudah punya akun? Masuk" berfungsi.
- [ ] Akun baru berperan `tamu` dan berstatus `aktif`.

### UC-02 Login — `POST /login`, `GET /profile`, `POST /logout`
- [ ] Tamu → `/`; Host → `/host/ketersediaan`; Pengawas → `/pengawas/verifikasi`.
- [ ] Kata sandi salah → pesan di form, **tidak** dialihkan ke halaman lain.
- [ ] Akun `nonaktif` → ditolak dengan pesan dari API, tetap di form Login.
- [ ] Klik **Pesan** saat belum login → Login → setelah masuk kembali ke halaman pemesanan dengan tanggal terisi.
- [ ] `?redirect=//evil.com` diabaikan (hanya path internal yang diterima).
- [ ] Tautan "Daftar sebagai tamu" berfungsi. Tidak ada tombol "Akun demo".

### UC-03 Beranda — `GET /homestays`
- [ ] Daftar homestay aktif tampil dengan foto, alamat, "Mulai dari Rp… / malam".
- [ ] Foto gagal dimuat → tampil kotak "Foto belum tersedia" (tidak rusak).
- [ ] Pagination bekerja bila > 1 halaman; tidak muncul bila 1 halaman.
- [ ] Belum ada homestay → "Belum ada homestay".
- [ ] Form pencarian: check-in sebelum hari ini ditolak; check-out ≤ check-in ditolak; tamu < 1 ditolak.

### UC-04 Detail Homestay — `GET /homestays/{id}`
- [ ] Tanpa tanggal: nama, alamat, deskripsi, fasilitas, galeri, daftar kamar; tombol **Pesan** nonaktif dengan petunjuk "Pilih tanggal".
- [ ] Isi tanggal → **Cek ketersediaan** → request `GET /homestays/{id}?check_in&check_out&guests`; tiap kamar menampilkan "Tersedia · total (n malam)" atau "Tidak tersedia pada tanggal ini".
- [ ] Tamu melebihi kapasitas kamar → Pesan nonaktif dengan alasan.
- [ ] Galeri: klik thumbnail mengganti foto utama.
- [ ] ID tidak ada → "Homestay tidak ditemukan" (404).

### UC-05 Hasil Pencarian — `GET /homestays?check_in&check_out&guests&…`
- [ ] Ringkasan: "18 November 2026 sampai 20 November 2026 · 2 malam · 2 tamu".
- [ ] Filter tipe kamar, harga min/maks, fasilitas → query `room_type`, `min_price`, `max_price`, `facilities[]` terkirim; hasil sesuai.
- [ ] Harga min > maks → pesan di kolom, tidak mengirim request.
- [ ] Filter tersimpan di URL: refresh/Back mempertahankan hasil.
- [ ] **Reset** menghapus semua filter.
- [ ] **Ubah pencarian** membuka form; tanggal tidak valid di URL → form terbuka dengan peringatan.
- [ ] Tombol **Detail** membuka modal (foto, tipe, kapasitas, fasilitas, harga, estimasi total, Pesan).
- [ ] Klik nama homestay → halaman Detail Homestay membawa tanggal pencarian.
- [ ] Tidak ada hasil → "Tidak ada kamar yang cocok".

### UC-06 Pemesanan Kamar — `GET /rooms/{id}/availability`, `POST /bookings/preview`, `POST /bookings`
- [ ] Formulir menampilkan nama/telepon/email dari akun (read-only), tanggal & tamu terisi dari pencarian.
- [ ] Ubah tanggal → total biaya diperbarui (≈0,4 dtk setelah berhenti mengetik).
- [ ] Kamar tidak tersedia → peringatan dengan `reason` dari API; tombol lanjut nonaktif.
- [ ] Tamu > kapasitas → pesan "Maksimal N tamu."
- [ ] **Lanjut ke Ringkasan** → `POST /bookings/preview` → ringkasan menampilkan harga/malam, jumlah malam, total **dari backend**.
- [ ] **Ubah Data** → kembali ke form dengan isian (termasuk catatan) terjaga.
- [ ] **Batal** (Ringkasan) → modal konfirmasi → data draft dihapus, kembali ke Detail Homestay.
- [ ] **Konfirmasi Pemesanan** → `POST /bookings` → halaman berhasil: kode `GSH-YYYYMMDD-XXXX`, status Menunggu Pembayaran, batas waktu 24 jam, instruksi transfer dari `payment_instruction`.
- [ ] **Salin nomor rekening** menyalin nomor yang benar.
- [ ] Buka `/pesan/ringkasan` tanpa draft → toast + kembali ke beranda. Refresh di Ringkasan → draft tetap ada.
- [ ] Dua Tamu memesan kamar & tanggal sama → yang kedua mendapat **409** ("Kamar baru saja dipesan Tamu lain") di Ringkasan; kamar tidak terpesan ganda.
- [ ] Klik ganda Konfirmasi → hanya 1 pemesanan terbentuk.

### UC-07 Unggah Bukti Pembayaran — `POST /bookings/{id}/payment-proof`
- [ ] Hanya bisa dibuka saat status `menunggu_pembayaran` / `pembayaran_ditolak`; status lain → peringatan.
- [ ] Berkas valid (JPG/PNG/PDF ≤ 2 MB) → terkirim (multipart, field `proof`) → status menjadi `menunggu_verifikasi`, toast, diarahkan ke detail.
- [ ] Format lain (mis. SVG, GIF) → ditolak di Frontend tanpa request.
- [ ] Berkas > 2 MB → ditolak di Frontend tanpa request.
- [ ] Tanpa memilih berkas → pesan "Pilih berkas…".
- [ ] Backend menolak berkas (422) → pesan tampil di area unggah.
- [ ] Status `pembayaran_ditolak` → **alasan penolakan** tampil; unggah ulang berhasil → kembali `menunggu_verifikasi`.
- [ ] Status berubah di perangkat lain (409) → toast dan halaman menyegarkan diri.
- [ ] Klik ganda **Kirim** → hanya 1 request.

### UC-08 Riwayat & Detail Pemesanan — `GET /bookings`, `GET /bookings/{id}`
- [ ] Daftar terbaru di atas; 7 chip filter (Semua + 6 status); filter terkirim sebagai `?status=`.
- [ ] Tidak ada data → "Belum ada pemesanan" + tombol **Cari Kamar**.
- [ ] Detail: rincian, linimasa status (dengan waktu `verified_at`/`confirmed_at` bila ada), pratinjau bukti.
- [ ] Pratinjau bukti JPG/PNG tampil; PDF tampil di bingkai + tautan "Buka di tab baru".
- [ ] File bukti hilang/rusak → "File bukti tidak dapat dibuka" + **Coba lagi** (tidak melempar ke halaman error).
- [ ] Status `menunggu_pembayaran`/`pembayaran_ditolak` → tombol **Unggah Bukti / Unggah Ulang**; status lain → tanpa tombol.
- [ ] **Tidak ada** tombol "Batalkan Pemesanan".
- [ ] Alasan penolakan tampil pada `pembayaran_ditolak` dan `ditolak`.
- [ ] Membuka pemesanan milik Tamu lain → ditolak (403/404) dan ditangani.

### UC-09 Kelola Data Homestay — `GET/POST /host/homestays`, `POST …/{id}` + `_method=PUT`, `PATCH …/{id}/deactivate`
- [ ] Daftar hanya homestay milik Host yang login; pagination bila perlu.
- [ ] Tambah: kolom wajib (nama, alamat) divalidasi; foto JPG/PNG ≤ 2 MB per foto; fasilitas dipilih dari daftar resmi.
- [ ] Request tambah bertipe `multipart/form-data` dengan `facilities[]` dan `photos[]`.
- [ ] Ubah: data lama terisi; tanpa foto baru → foto lama tetap; dengan foto baru → foto lama **diganti**.
- [ ] Error 422 (mis. nama kosong, foto invalid) tampil di kolom terkait.
- [ ] **Nonaktifkan** → modal konfirmasi → sukses: status Nonaktif, hilang dari pencarian publik.
- [ ] Nonaktifkan homestay yang masih punya reservasi aktif → **409**, pesan API tampil di modal, status tidak berubah.
- [ ] Host B tidak melihat/mengubah homestay Host A (403/404).

### UC-10 Kelola Data Kamar — `GET/POST /host/rooms`, `POST …/{id}` + `_method=PUT`, `PATCH …/{id}/deactivate`
- [ ] Host belum punya homestay → pesan + tombol ke Kelola Homestay.
- [ ] Filter homestay mengirim `?homestay_id=`.
- [ ] Tambah: homestay, nama, tipe (`standard|deluxe|family`), kapasitas ≥ 1, harga > 0, deskripsi, fasilitas, foto.
- [ ] Ubah (foto opsional; diisi = menggantikan); validasi 422 per kolom.
- [ ] **Nonaktifkan** + 409 jika masih ada reservasi aktif (pesan API tampil).
- [ ] Kamar nonaktif tidak muncul di pencarian publik dan ditandai Nonaktif di kalender.

### UC-11 Konfirmasi Reservasi — `GET /host/bookings`, `POST …/confirm`, `POST …/reject`
- [ ] Buka halaman tanpa filter → default **Pembayaran Terverifikasi**; chip "Semua" menampilkan semua.
- [ ] Filter homestay (bila Host punya > 1) mengirim `homestay_id`.
- [ ] Detail: data tamu, rincian, bukti bayar, linimasa.
- [ ] **Konfirmasi** → modal → status `terkonfirmasi`, toast, data tersegarkan.
- [ ] **Tolak** tanpa alasan → pesan di modal (tanpa request); dengan alasan → status `ditolak`; alasan tampil.
- [ ] Alasan dikosongkan di sisi server (422 `reason`) → pesan tampil di modal.
- [ ] Reservasi sudah berubah status (buka di 2 tab, proses di tab pertama, lalu klik di tab kedua) → **409** → pesan + data tersegarkan, tombol hilang.
- [ ] Status selain `pembayaran_terverifikasi` → tombol Konfirmasi/Tolak tidak tampil.
- [ ] Klik ganda Konfirmasi/Tolak → hanya 1 request.

### UC-12 Pantau Ketersediaan — `GET /host/availability?month=&homestay_id=&room_type=`
- [ ] Matriks bulan berjalan: tiap kamar satu baris, tiap tanggal satu kotak; kolom "Kamar" menempel saat digulir.
- [ ] 4 status berbeda jelas: Tersedia (hijau), Ditahan **D** (oranye), Terpesan **P** (biru), Nonaktif **–** (abu); legenda tampil.
- [ ] Tanggal tanpa data → kotak putus-putus.
- [ ] Tombol bulan sebelumnya/berikutnya & **Bulan ini** mengubah `?month=YYYY-MM`.
- [ ] Filter homestay & tipe kamar bekerja dan tersimpan di URL.
- [ ] Klik tanggal berstatus terisi (ada `booking_id`) → modal detail dari `GET /host/bookings/{id}` + tombol **Buka Konfirmasi Reservasi**.
- [ ] Host tanpa kamar (`meta.total_rooms = 0`) → pesan + tombol ke Kelola Data Kamar.
- [ ] Filter tanpa hasil → "Tidak ada kamar yang cocok".
- [ ] Ponsel: kalender menggulir ke samping dan otomatis menampilkan kolom hari ini; halaman tidak ikut bergeser.
- [ ] Setelah Host mengonfirmasi reservasi, status tanggal terkait menjadi **Terpesan**; saat `menunggu_*`/`pembayaran_terverifikasi` menjadi **Ditahan** (sesuai aturan backend).

### UC-13 Laporan Pendapatan — `GET /host/reports/revenue`, `GET /admin/reports/revenue`
- [ ] Periode **Harian** (`date`), **Bulanan** (`month=YYYY-MM`), **Rentang** (`start_date`, `end_date`) mengirim parameter yang benar.
- [ ] Tanggal akhir sebelum tanggal mulai → pesan di kolom, tanpa request.
- [ ] Ringkasan: total pendapatan & jumlah reservasi **Terkonfirmasi**; angka sama dengan jumlah baris tabel.
- [ ] Periode kosong → total 0 + pesan "Tidak ada data pada periode ini".
- [ ] Hanya reservasi `terkonfirmasi` yang dihitung (reservasi `ditolak`/`menunggu_*` tidak).
- [ ] Host hanya melihat pendapatan homestay miliknya; Pengawas melihat seluruh homestay.
- [ ] Pengawas: dropdown **Host** (`host_id`) menyaring hasil; kolom **Host** muncul bila API mengirim `host_name`.
- [ ] Ponsel: tabel menggulir di dalam kotaknya; kolom **Kode** menempel.

### UC-14 Kelola Akun Pengguna — `GET/POST/PUT /admin/users`, `PATCH …/status`, `POST …/reset-password`
- [ ] Daftar akun: nama, email, telepon, peran, status; akun sendiri bertanda "(Anda)".
- [ ] Pencarian (`search`), filter peran (`role`), filter status (`status`) tersimpan di URL; pagination.
- [ ] **Tambah Akun Host**: sandi awal ≥ 8 karakter; akun baru berperan Host & aktif; email duplikat → 422 di kolom.
- [ ] **Ubah**: nama/email/telepon tersimpan; 422 tampil di kolom.
- [ ] **Nonaktifkan** akun lain → akun tersebut tidak bisa login (UC-02); **Aktifkan** memulihkan.
- [ ] Nonaktifkan **akun sendiri** → **409** "Anda tidak dapat menonaktifkan akun Anda sendiri." tampil di modal.
- [ ] **Reset Kata Sandi** → konfirmasi → modal menampilkan `temporary_password` + tombol **Salin**; setelah modal ditutup, sandi tidak tampil lagi.
- [ ] Login dengan sandi sementara berhasil; sandi lama tidak berlaku.

### UC-15 Verifikasi Pembayaran — `GET /admin/payment-verifications`, `POST …/approve`, `POST …/reject`
- [ ] Antrean hanya berisi `menunggu_verifikasi`; kosong → "Antrean kosong".
- [ ] Detail menyandingkan **Rincian tagihan** (total, batas bayar, rekening tujuan) dengan **Bukti transfer** (gambar/PDF).
- [ ] Gambar rusak / berkas hilang → "File bukti tidak dapat dibuka" + Coba lagi.
- [ ] **Terima** → modal → status `pembayaran_terverifikasi`, kembali ke antrean, item hilang dari antrean; muncul di daftar Host (UC-11).
- [ ] **Tolak** tanpa alasan → pesan di modal; dengan alasan → `pembayaran_ditolak`; Tamu melihat alasan (UC-07/08).
- [ ] Diproses Pengawas lain lebih dulu (2 tab) → **409** → pesan + halaman menunjukkan status terbaru tanpa tombol.
- [ ] Tamu belum mengunggah bukti → tombol **Terima** nonaktif.
- [ ] Klik ganda Terima/Tolak → hanya 1 request.

---

## 5. Skenario End-to-End (Satu Alur Utuh)

Jalankan berurutan dengan akun baru; centang setiap langkah.

1. [ ] Tamu A **daftar** → **login** → cari kamar (2 malam) → buka detail → **Pesan**.
2. [ ] Ringkasan → **Konfirmasi** → kode booking muncul, status *Menunggu Pembayaran*.
3. [ ] Tamu A **unggah bukti** → status *Menunggu Verifikasi*.
4. [ ] Pengawas membuka antrean → **Tolak** dengan alasan → Tamu A melihat *Pembayaran Ditolak* + alasan.
5. [ ] Tamu A **unggah ulang** → Pengawas **Terima** → *Pembayaran Terverifikasi*.
6. [ ] Host membuka Konfirmasi Reservasi → **Konfirmasi** → *Terkonfirmasi*; linimasa Tamu lengkap dengan waktu.
7. [ ] Kalender Host: tanggal menginap berstatus **Terpesan**; klik → modal detail benar.
8. [ ] Laporan Host dan Laporan Pengawas memuat reservasi ini dengan total yang sama.
9. [ ] Pengawas menonaktifkan akun Tamu A → Tamu A tidak bisa login lagi; diaktifkan → bisa login.
10. [ ] **Jalur tolak Host:** ulangi dengan Tamu B hingga *Pembayaran Terverifikasi* → Host **Tolak** dengan alasan → Tamu B melihat status *Ditolak* + alasan; tanggal kembali **Tersedia**; tidak masuk laporan.
11. [ ] **Konflik:** Tamu A dan Tamu B membuka kamar & tanggal yang sama, A konfirmasi lebih dulu → B mendapat 409 dan tidak ada pemesanan ganda.
12. [ ] **Nonaktifkan dengan reservasi aktif:** Host menonaktifkan kamar yang punya reservasi aktif → 409; setelah reservasi selesai/ditolak → berhasil.

---

## 6. Pemecahan Masalah Umum

| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| Console: *blocked by CORS policy* | Origin Frontend belum diizinkan | Tambahkan `http://localhost:5173` di `config/cors.php`, `php artisan config:clear` |
| Semua request 401 setelah login | Token tidak tersimpan / format `Bearer` salah / Sanctum belum dikonfigurasi | Cek localStorage `gsh_token` dan header di Network; cek `extractAuth()` (asumsi #1) |
| Login berhasil tetapi peran tidak dikenali (selalu "Akses Ditolak") | Nilai `role` berbeda dari `tamu/host/admin` | Sesuaikan `normalizeRole()` (asumsi #3) |
| Foto homestay tidak muncul | `storage:link` belum dijalankan / URL foto berbeda | Jalankan `php artisan storage:link`; cek URL foto di Network; sesuaikan `assetUrl()` |
| Bukti pembayaran "tidak dapat dibuka" | Endpoint 403/404, `Content-Type` salah, atau file tidak ada di disk privat | Buka `GET /api/bookings/{id}/payment-proof` di Postman dengan token yang sama |
| Unggah foto gagal 413 / 422 tanpa pesan | `upload_max_filesize` / `post_max_size` terlalu kecil | Naikkan di `php.ini`, restart server |
| Update homestay/kamar tidak mengubah data | Method spoofing tidak terbaca | Pastikan route `PUT` menerima `POST` + `_method=PUT` (multipart) |
| Tombol **Pesan** selalu nonaktif | `is_available`/tanggal tidak terbaca | Cek response `GET /homestays/{id}?check_in&check_out` dan asumsi #8 |
| Total/kapasitas kosong di form pemesanan | Response availability berbeda | Cek `GET /rooms/{id}/availability` vs `mapAvailability()` |
| Tanggal bergeser 1 hari | Server mengirim datetime UTC pada kolom tanggal | Kolom `check_in/check_out` harus `YYYY-MM-DD`; datetime lain memakai offset `+07:00` |
| Kalender kosong walau ada kamar | `dates` tidak memuat seluruh tanggal / format kunci bukan `YYYY-MM-DD` | Cek asumsi #14 |
| Halaman putih setelah deploy | `VITE_API_BASE_URL` salah / SPA fallback server belum diatur | Atur `.env` saat build; arahkan semua path ke `index.html` |

---

## 7. Kriteria Selesai

- [ ] Seluruh butir bagian 0–5 lulus, atau temuan tercatat di bagian 8 beserta keputusannya.
- [ ] `npm run build` tanpa error; `npm run preview` menjalankan seluruh skenario bagian 5 dengan baik.
- [ ] Tidak ada galat merah di Console selama skenario bagian 5.

---

## 8. Lembar Temuan

| No | UC / Halaman | Langkah | Hasil yang diharapkan | Hasil sebenarnya | Penyebab (FE/BE) | Status |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
