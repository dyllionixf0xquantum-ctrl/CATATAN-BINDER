# Binder — Catatan Kuliah (offline)

Aplikasi catatan sederhana bergaya "buku binder": beberapa **binder** (mis. per mata kuliah), tiap binder berisi banyak **catatan**. Semua data tersimpan langsung di perangkat (localStorage), jadi tidak butuh internet untuk dipakai sehari-hari.

Tidak perlu instalasi Node/npm apa pun — ini murni HTML, CSS, dan JavaScript biasa.

## Struktur file

```
catatan-kuliah/
├─ index.html      → struktur halaman
├─ style.css        → tampilan (tema "binder")
├─ app.js           → logika: simpan/edit/hapus catatan
├─ manifest.json    → supaya bisa di-install sebagai app
├─ sw.js            → bikin app bisa dipakai offline penuh
└─ icons/           → ikon app
```

## 1. Menjalankan & mengedit di VS Code (laptop)

1. Buka folder `catatan-kuliah` di VS Code (`File > Open Folder…`).
2. Install extension **Live Server** (oleh Ritwick Dey) dari tab Extensions.
3. Klik kanan pada `index.html` → **Open with Live Server**.
   - Browser akan terbuka di alamat seperti `http://127.0.0.1:5500`.
   - Kenapa tidak dibuka langsung dengan klik dua kali (`file://`)? Karena mode offline (service worker) hanya aktif di alamat `http://localhost` atau `https://`, bukan di `file://`.
4. Edit `app.js` / `style.css` sesuka hati — Live Server otomatis me-refresh browser.

Sampai di sini, aplikasi sudah 100% bisa dipakai di laptop, termasuk offline (matikan Wi-Fi lalu refresh — tetap jalan setelah dibuka minimal sekali).

## 2. Supaya bisa dipakai di HP Android, kapan pun & di mana pun

Karena ini web app biasa, cara paling praktis supaya bisa diakses dari HP **di luar rumah/kampus** (bukan cuma saat satu Wi-Fi dengan laptop) adalah meng-host-nya gratis, lalu meng-install-nya sebagai app di HP. Setelah ter-install sekali, app ini **jalan offline** — internet cuma dibutuhkan saat pertama kali membuka & saat ada pembaruan kode.

### Opsi A — GitHub Pages (gratis, disarankan)

1. Buat repository baru di GitHub, upload seluruh isi folder `catatan-kuliah`.
2. Di repo: **Settings → Pages → Source**, pilih branch `main` dan folder `/ (root)`, simpan.
3. Tunggu 1–2 menit, GitHub akan memberi alamat seperti:
   `https://namakamu.github.io/catatan-kuliah/`
4. **Di laptop**: buka alamat itu di Chrome/Edge → klik ikon install (⊕) di address bar → app terpasang sebagai aplikasi terpisah.
5. **Di Android**: buka alamat itu di Chrome → menu titik tiga → **"Tambahkan ke layar Utama" / "Install app"** → ikon binder akan muncul seperti aplikasi biasa, dan bisa dibuka tanpa internet setelahnya.

Repo boleh privat maupun publik — GitHub Pages dari repo privat butuh akun GitHub berbayar; kalau ingin tetap gratis, gunakan repo publik (isinya cuma catatan kosong/template, aman untuk publik — catatan asli kamu tersimpan di perangkat, bukan di repo).

### Opsi B — Cuma untuk dipakai di satu jaringan Wi-Fi yang sama

Kalau tidak mau upload ke internet: jalankan Live Server di laptop, lalu di HP (yang tersambung ke Wi-Fi yang sama) buka `http://<IP-laptop>:5500`. Ini hanya berfungsi selagi laptop menyala dan satu jaringan — tidak "kapan pun di mana pun", tapi cukup untuk uji coba cepat.

## 3. Penting: data TIDAK otomatis sinkron antar perangkat

App ini menyimpan catatan secara lokal di masing-masing perangkat/browser (tidak ada server/cloud). Artinya catatan yang ditulis di laptop **tidak otomatis muncul** di HP, begitu juga sebaliknya. Ini pilihan desain yang disengaja supaya app tetap sederhana dan benar-benar offline tanpa akun/login.

Untuk memindahkan catatan antar perangkat, pakai fitur di bagian bawah app:

- **Ekspor semua (.json)** — mengunduh seluruh binder & catatan jadi satu file `.json`.
- **Impor** — memuat file `.json` tadi di perangkat lain (bisa digabung dengan data yang ada, atau menggantinya).

Cara kirim filenya: lewat email ke diri sendiri, WhatsApp "Kirim ke diri sendiri", Google Drive, dsb — lalu buka file itu lewat tombol Impor.

> Kalau nanti kamu mau sinkron otomatis tanpa ekspor/impor manual, itu perlu backend/cloud (mis. Firebase) — bisa ditambahkan belakangan, tapi akan menambah kompleksitas dan butuh koneksi internet saat menyimpan.

## 4. Fitur yang ada

- Binder (kategori/mata kuliah) dengan warna label, bisa tambah/ubah/hapus.
- Catatan per binder: judul + isi bebas, tersimpan otomatis saat mengetik (jeda ±0.4 detik).
- Pencarian catatan dalam satu binder.
- Tampilan menyesuaikan: 3 kolom di laptop, mode "buka satu per satu" di layar HP.
- Mode gelap otomatis mengikuti pengaturan sistem.
- Ekspor/impor `.json` untuk cadangan atau pindah perangkat.

## 5. Ide pengembangan lanjutan (opsional)

- Tambah format teks sederhana (bold/italic/bullet).
- Lampiran gambar/foto materi.
- Sinkron otomatis lewat akun (Firebase/Supabase) kalau suatu saat butuh multi-device real-time.
