# 🚨 Sahabat SOS - Web Command Center (Dashboard Admin)

Sahabat SOS Web adalah portal Command Center dan Dashboard Admin untuk platform inklusi & tanggap darurat difabel mandiri. Aplikasi ini dirancang khusus untuk memonitor kasus darurat (SOS) secara *real-time*, melacak posisi relawan menggunakan Peta GIS, serta melakukan *dispatch* (penugasan) relawan ke lokasi kejadian.

## ✨ Fitur Utama

1. **Dashboard & Statistik Terpusat**: Memantau jumlah SOS aktif, relawan bertugas, dan kasus yang menunggu penanganan.
2. **Pemantauan Geospasial (GIS) Real-time**: Peta interaktif berbasis koordinat yang menampilkan posisi pengguna darurat dan pergerakan unit relawan secara langsung (tanpa perlu *refresh* halaman).
3. **Sistem Dispatch Relawan**: Menampilkan daftar relawan siaga yang berada dalam radius terdekat untuk segera dihubungi dan ditugaskan.
4. **Manajemen Riwayat & Laporan**: Arsip lengkap untuk melihat rekam jejak penyelesaian kasus SOS.
5. **Verifikasi Relawan**: Sistem untuk memeriksa dan menyetujui pendaftaran relawan baru.

## 🛠️ Tech Stack & Teknologi yang Digunakan

*   **Framework Inti**: [React.js](https://react.dev/) (dengan build tool [Vite](https://vitejs.dev/))
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Sistem Peta (GIS)**: [Leaflet.js](https://leafletjs.com/) dengan penyedia Basemap **CartoDB Voyager**
*   **Real-time & WebSocket**: [Laravel Echo](https://github.com/laravel/echo) & [Pusher JS](https://github.com/pusher/pusher-js) (untuk komunikasi dengan backend Laravel Reverb/Pusher).
*   **Iconography**: [Lucide React](https://lucide.dev/)

## 🚀 Panduan Instalasi & Menjalankan Aplikasi Lokal

Pastikan Anda sudah menginstal **Node.js** di komputer Anda.

1. **Clone repository atau buka folder project ini**.
2. **Buka terminal** di dalam folder `sahabat-sos-web` (misal di Laragon: `C:\laragon\www\sahabat-sos-web`).
3. **Install dependensi / library** dengan perintah:
   ```bash
   npm install
   ```
4. **Siapkan file environment**:
   Buat file bernama `.env` di *root* folder aplikasi, lalu isi konfigurasi API dan WebSocket yang mengarah ke Backend Laravel Anda. Contoh:
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_PUSHER_APP_KEY=isi_dengan_pusher_key_dari_backend
   VITE_PUSHER_HOST=localhost
   VITE_PUSHER_PORT=6001
   VITE_PUSHER_APP_CLUSTER=mt1
   ```
5. **Jalankan local server** dengan perintah:
   ```bash
   npm run dev
   ```
6. Buka browser dan akses aplikasi melalui `http://localhost:5173` (atau port yang diberikan oleh Vite).

---

*Sahabat SOS - Mewujudkan respon darurat yang cepat, inklusif, dan peduli sesama.*
