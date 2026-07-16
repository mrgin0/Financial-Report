# Lap. Keuangan Pribadi — Multi-Akun (Firebase Auth + Firestore)

Setiap akun (login) punya data keuangan yang benar-benar terpisah — Dashboard, Current Asset,
Non Current Asset, Investment, Hutang, Pemasukan, Pengeluaran, Laporan, semuanya di-scope
otomatis per akun yang lagi login.

Sistem pendaftaran **invite-only**: user baru gak bisa asal daftar sendiri — wajib diapprove
manual sama kamu (master) dulu lewat halaman Admin di dalam app.

## 1. Setup Firebase Project (sekali di awal)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Build → Authentication → Get started** → tab **Sign-in method** → aktifkan **Email/Password**.
3. **Build → Firestore Database → Create database** → pilih lokasi (`asia-southeast2` kalau ada)
   → **Start in production mode**.
4. Tab **Rules** di Firestore → hapus isinya, ganti dengan isi file `firestore-rules.txt`
   (jangan lupa ganti `GANTI_EMAIL_MASTER` di dalamnya jadi email kamu sendiri) → **Publish**.
5. ⚙️ **Project Settings** → **Your apps** → klik `</>` (Web) → daftar app → copy config →
   tempel ke `js/config.js` (gantikan semua yang bertuliskan `GANTI...`).
6. Di `js/config.js`, ganti juga `MASTER_EMAIL` jadi email kamu sendiri — **harus sama persis**
   dengan yang kamu isi di `firestore-rules.txt` langkah 4.

## 2. Bikin Akun Master Pertama (kamu sendiri)

Karena sistemnya invite-only, gak ada yang bisa approve akun pertama — jadi kamu daftar
manual lewat Firebase Console:

1. **Authentication → Users tab → Add user**.
2. Isi email (harus sama persis dengan `MASTER_EMAIL`) + password.
3. Selesai — buka app, login pakai email+password itu. Menu **Admin** otomatis muncul di
   sidebar karena email kamu cocok dengan `MASTER_EMAIL`.

## 3. Alur Invite-Only buat User Baru

1. User baru buka app → **Daftar** → isi Nama Usaha + Email → **"1. Ajukan Akses"**.
   (ini BELUM bikin akun, cuma nyatet permintaan di Firestore koleksi `access_requests`)
2. Kamu (master) login → sidebar **Admin** → lihat daftar permintaan pending → klik **✅ Approve**
   (atau ✕ Tolak).
3. User balik ke halaman Daftar → klik **"Lanjut buat akun"** → isi email yang sama + set
   password → **"2. Buat Akun"**. Baru di titik ini akun Firebase Auth beneran dibuat.
4. Selesai, user bisa login dan datanya otomatis terpisah dari akun lain (di-scope by `uid`).

## 4. Lupa Password / Ganti Password

- **Lupa password** (di halaman Login) → kirim link reset ke email user sendiri, gratis,
  gak ada OTP manual.
- **Reset Password** (di popup Profile, kanan atas header) → kirim link reset ke email
  akun yang lagi login.
- **Edit Email** (di popup Profile) → cuma ganti **email akun kamu sendiri**
  (`CURRENT_USER.updateEmail()`), sama sekali gak menyentuh `MASTER_EMAIL` di config
  (itu cuma bisa diganti manual di `js/config.js`, sesuai permintaan awal).

> Kalau ganti email gagal dengan pesan "requires-recent-login": itu proteksi keamanan bawaan
> Firebase (device kamu login-nya udah lama). Logout dulu, login ulang, baru coba ganti lagi.

## 5. Kenapa Datanya Otomatis Terpisah per Akun?

Semua panggilan database lewat `sbG/sbI/sbU/sbD` di `js/firebase-client.js` — dan di situ
udah otomatis:
- `sbG` → nambahin `.where('uid','==', uid yang login)` ke query.
- `sbI` → nambahin field `uid: uid yang login` ke setiap data baru.

Jadi **semua file lain (crud-engine.js, semua js/pages/*.js) gak tau-menau soal multi-akun**
— mereka tetap manggil `sbG('current_assets')` seperti biasa, isolasi datanya kejadian
otomatis di lapisan client Firebase. Plus `firestore-rules.txt` jadi lapisan proteksi kedua
di sisi server (kalau ada yang coba akal-akalan lewat DevTools sekalipun, tetap ke-block).

## 6. ⚠️ Composite Index (WAJIB, sekali doang)

Firestore butuh "index" tiap kali ada query `where(...) + orderBy(...)` yang beda field.
Cara paling gampang:
1. Buka app, login, pakai semua menu (Dashboard, Hutang, Pemasukan, dst) satu-satu.
2. Buka DevTools Console (F12) — kalau ada query yang butuh index, Firestore nongolin
   **link langsung** di error message buat bikin index itu otomatis.
3. Klik link-nya → tunggu ±1 menit → refresh app → ulangi buat tiap collection yang error.

Ini cuma perlu dilakuin **sekali** per collection, gak akan diminta lagi setelahnya.

## 7. Struktur Folder

```
site/
├─ index.html                 shell: auth-shell (login/register) + app-shell (header+sidebar+app)
├─ firestore-rules.txt        rules keamanan Firestore (multi-tenant + admin)
├─ css/style.css
├─ js/
│  ├─ config.js                config Firebase + MASTER_EMAIL
│  ├─ firebase-client.js       sbG/sbI/sbU/sbD → Firestore, auto-scope per uid
│  ├─ auth.js                  login/register 2-tahap/logout/reset password/gerbang auth
│  ├─ state.js, utils.js, crud-engine.js, charts-shared.js, reports.js, app-core.js
│  └─ pages/                   logic tiap halaman (current-asset.js, hutang.js, dst, + admin.js)
└─ pages/                      fragment HTML tiap halaman (di-fetch router), + login.html/register.html/admin.html
```

## 8. Jalanin Lokal / Deploy

Sama seperti sebelumnya — **wajib lewat server**, gak bisa buka `file://` langsung
(karena `fetch()` dan Firebase Auth butuh origin http/https):

```bash
npx serve .
# atau
python3 -m http.server 8000
```

Push ke GitHub → GitHub Pages otomatis serve via https, semuanya jalan normal.
