# Lap. Keuangan Pribadi — Struktur Multi-File

Aplikasi ini sudah dipecah dari 1 file HTML raksasa jadi struktur rapi per fungsi,
supaya gampang di-maintain dan gampang minta Claude edit cuma bagian tertentu
(gak perlu generate ulang semua kode tiap kali).

## Struktur Folder

```
site/
├─ index.html              ← shell: header, sidebar, modal, memuat semua script
├─ css/
│  └─ style.css             ← semua CSS
├─ js/
│  ├─ config.js              ← URL & API key Supabase
│  ├─ supabase-client.js     ← fungsi sbG/sbI/sbU/sbD (GET/POST/PATCH/DELETE)
│  ├─ state.js                ← semua state global (DB, CHS, filter, dsb)
│  ├─ utils.js                 ← fRp, format tanggal, i18n, toast, dll
│  ├─ crud-engine.js           ← engine tabel (sort/pagination) + modal tambah/edit generik + kelola kategori
│  ├─ charts-shared.js         ← chart-chart di Dashboard
│  ├─ reports.js               ← Laporan Posisi Keuangan, Laba Rugi, Arus Kas + export PDF
│  ├─ app-core.js              ← boot aplikasi + router nav() (fetch halaman)
│  └─ pages/
│     ├─ current-asset.js
│     ├─ cash-equivalent.js    (Piutang + Inventory)
│     ├─ non-current-asset.js (PPE + Intangible)
│     ├─ investment.js
│     ├─ hutang.js
│     ├─ transaksi.js         (Pemasukan & Pengeluaran — logic dua-duanya, karena sangat mirip)
│     └─ settings.js
└─ pages/                     ← FRAGMENT html (bukan file HTML lengkap), di-fetch oleh router
   ├─ dashboard.html
   ├─ laporan-posisi.html
   ├─ laporan-labarugi.html
   ├─ laporan-aruskas.html
   ├─ current-asset.html
   ├─ cash-equivalent.html
   ├─ non-current-asset.html
   ├─ investment.html
   ├─ hutang.html
   ├─ pengeluaran.html
   ├─ pemasukan.html
   └─ settings.html
```

## Cara Kerja

`index.html` cuma render shell (header + sidebar + modal). Konten halaman
(`<div id="app">`) diisi via JavaScript `nav(id)` di `app-core.js`, yang:
1. `fetch('pages/<nama>.html')` → ambil fragment HTML
2. Suntik ke `#app`
3. Panggil fungsi render halaman terkait (misal `renderIncPage()`, `rCA()`, dst — sudah ada di `js/pages/*.js`)

Karena pakai `<script src="...">` biasa (bukan ES module `import`), semua file
saling berbagi variabel global apa adanya — persis seperti kode aslinya, cuma
dipecah lokasinya. Jadi urutan `<script>` di `index.html` **penting**, jangan diubah urutannya.

## Kalau Mau Edit 1 Halaman Saja

Contoh: mau ubah tampilan/logic halaman **Pemasukan**.
Cukup kasih tau 2 file ini ke Claude:
- `pages/pemasukan.html` (tampilan)
- `js/pages/transaksi.js` (logic — perhatian: file ini juga dipakai Pengeluaran)

Gak perlu upload/generate ulang `index.html`, `crud-engine.js`, atau halaman lain.

## Menjalankan Lokal (WAJIB pakai server, gak bisa buka file langsung)

`fetch()` diblokir browser kalau dibuka lewat `file://`. Jalankan salah satu:

```bash
npx serve .
# atau
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000` (atau port yang muncul).

## Deploy ke GitHub Pages

1. Push seluruh isi folder `site/` ke root repo (atau ke folder `/docs`).
2. Repo → Settings → Pages → Source: pilih branch & folder yang sesuai.
3. Selesai — `fetch()` otomatis jalan normal karena sudah diakses via `https://`.

## Supabase — Tabel yang Dibutuhkan

Lihat `supabase-schema.sql` di folder ini untuk semua tabel & kolom yang perlu ada
(termasuk `income`, `expenses`, `debts`, `debt_payments`, dan kolom `note` di
`current_assets`, `accounts_receivable`, `inventory`,
`property_plant_equipment`, `intangible_assets`, `investments`).
