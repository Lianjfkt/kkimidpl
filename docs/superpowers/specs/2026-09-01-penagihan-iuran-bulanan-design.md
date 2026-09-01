# Spesifikasi Desain: Fitur Penagihan & Pelacakan Siswa Belum Bayar Iuran Bulanan

**Tanggal:** 2026-09-01  
**Target Modul:** Modul Keuangan Dojo KKI DPL (`src/app/owner/finance/page.tsx`)  
**Status:** Draf Tervalidasi  

---

## 1. Latar Belakang & Tujuan
Saat ini pengurus/admin Dojo KKI DPL memerlukan kemudahan dalam memantau siapa saja siswa aktif yang belum melunasi iuran bulanan pada bulan tertentu serta riwayat akumulasi tunggakan. Admin membutuhkan sarana cepat untuk menagih orang tua/wali siswa secara langsung melalui WhatsApp dengan pesan resmi yang telah terformat otomatis, serta tombol konfirmasi pelunasan instan yang langsung memperbarui arus kas dojo.

---

## 2. Arsitektur & Antarmuka Pengguna (UI)

### 2.1 Penempatan Fitur
Fitur diintegrasikan ke dalam halaman Keuangan Pemilik/Admin (`/owner/finance`) dengan tab baru:
1. `📋 Pembukuan & Kas` (Pencatatan kas operasional, generate tagihan massal, jurnal transaksi)
2. `⚠️ Penagihan & Tunggakan` (Pelacakan siswa belum bayar, penagihan WA 1-klik, rincian tunggakan)
3. `📊 Analytics & Tren` (Grafik tren pendapatan, kehadiran, dan rasio retensi)

### 2.2 Komponen Tab "Penagihan & Tunggakan"
1. **Filter & Kontrol Periode:**
   - Pemilih Bulan (Januari – Desember, default ke bulan berjalan)
   - Pemilih Tahun (default ke tahun berjalan)
   - Filter Status Tagihan: `Belum Lunas (Default)` / `Sudah Lunas` / `Semua Status`
   - Filter Tingkat Sabuk (Putih, Kuning, Orange, Hijau, Biru, Coklat, Hitam, Semua)
   - Kolom Pencarian Cepat Nama Siswa / Nama Orang Tua

2. **Kartu Statistik Penagihan (KPI Cards):**
   - **Siswa Belum Bayar:** Jumlah siswa yang belum lunas pada periode terpilih
   - **Total Tagihan Tertunggak:** Total rupiah yang belum terkumpul pada periode terpilih (Rp)
   - **Tingkat Kepatuhan:** Persentase siswa yang sudah lunas terhadap total siswa aktif
   - **Menunggak > 1 Bulan:** Jumlah siswa yang memiliki akumulasi tunggakan lebih dari 1 bulan

3. **Daftar & Tabel Interaktif Siswa:**
   - Kolom:
     - **Siswa & Sabuk:** Nama lengkap siswa, badge sabuk berwarna, status aktif
     - **Orang Tua / Kontak:** Nama orang tua, nomor telepon/WhatsApp
     - **Status Periode Terpilih:** Badge Lunas / Belum Lunas beserta nominal
     - **Akumulasi Tunggakan:** Indikator apakah siswa memiliki tunggakan di bulan-bulan sebelumnya (mis. *"Menunggak 2 bulan: Rp 40.000"*)
     - **Aksi Cepat:**
       - Tombol **WhatsApp Tagih (1-Click)**: Membuka tautan WhatsApp API `https://wa.me/<nomor_hp>?text=<pesan_terenkripsi>`
       - Tombol **Salin Pesan**: Menyalin teks tagihan ke clipboard dengan notifikasi toast visual
       - Tombol **Tandai Lunas**: Membuka dialog konfirmasi pembayaran (Metode: Tunai / Transfer / QRIS) dan otomatis sinkronisasi ke tabel `fees` serta mencatat jurnal pemasukan kas `finance_transactions`
       - Tombol **Detail / Riwayat**: Melihat histori tagihan siswa tersebut

4. **Fitur Ekspor Tagihan:**
   - Tombol **Unduh Rekap Tagihan (CSV)** untuk mengunduh daftar siswa belum bayar pada periode terpilih lengkap dengan kontak orang tua dan nominal tunggakan.

---

## 3. Format Template Pesan WhatsApp Penagihan

Pesan WhatsApp diformat rapi dan profesional dengan nomor rekening **Bank JAGO 501072411966**:

```text
🥋 *PENGINGAT IURAN BULANAN DOJO KKI DPL* 🥋

Yth. Orang Tua / Wali dari ananda *[NAMA_SISWA]*,

Semoga Bapak/Ibu senantiasa dalam keadaan sehat walafiat.
Kami dari Pengurus Dojo Karate KKI DPL ingin menginformasikan tagihan iuran bulanan latihan karate ananda untuk:

📌 *Periode:* [NAMA_BULAN] [TAHUN]
💰 *Nominal Tagihan:* Rp [NOMINAL]
[JIKA_ADA_TUNGGAKAN_LAIN: ⚠️ *Total Akumulasi Tunggakan ([JUMLAH_BULAN] Bulan):* Rp [TOTAL_TUNGGAKAN]]

Pembayaran dapat disalurkan melalui transfer ke rekening resmi dojo:
🏦 *Bank:* Bank JAGO
💳 *No. Rekening:* 501072411966
👤 *Atas Nama:* KKI DPL / Pengurus Dojo

Atau dapat dibayarkan secara tunai langsung ke kasir/pengurus saat jadwal latihan karate.
Mohon konfirmasi dengan mengirimkan bukti transfer setelah melakukan pembayaran.

Terima kasih atas kerja sama dan dukungannya untuk kelancaran latihan ananda.
_OSS! Salam Karate._ 🙏
```

---

## 4. Aliran Data & Logika Bisnis

1. **Pengambilan Data:**
   - Query `students` aktif beserta data kontak (`phone`, `parent_name`, `current_belt`).
   - Query tabel `fees` untuk mencocokkan status pembayaran per siswa pada `period_month` dan `period_year` yang dipilih.
   - Hitung riwayat tunggakan dengan memindai seluruh record `fees` berstatus `belum_lunas` milik siswa tersebut.
   - Jika siswa aktif belum memiliki tagihan pada bulan terpilih, sistem tetap mendeteksinya sebagai belum lunas (atau dapat langsung di-generate otomatis).

2. **Normalisasi Nomor Telepon:**
   - Sanitasi nomor HP orang tua/siswa ke format internasional standar WhatsApp:
     - Mengubah awalan `08...` menjadi `628...`
     - Menghapus karakter spasi, strip, atau tanda kurung.

3. **Pelunasan Cepat (Quick Settle Flow):**
   - Mengubah status fee di Supabase: `status = 'lunas'`, `paid_date = today`, `payment_method = <metode>`.
   - Menambahkan catatan transaksi kas masuk otomatis di `finance_transactions` dengan kategori `'iuran'`.
   - Mengirim notifikasi in-app kepada orang tua siswa.
   - Memperbarui state lokal secara reaktif tanpa perlu reload halaman penuh.

---

## 5. Rencana Pengujian & Verifikasi

1. **Filter & Navigasi:**
   - Pengujian ganti tab, pemilih bulan & tahun, filter sabuk, dan pencarian nama.
2. **Kalkulasi Data & Akumulasi:**
   - Verifikasi total tunggakan per siswa jika memiliki lebih dari 1 bulan tagihan belum bayar.
3. **Pengujian Link WhatsApp:**
   - Verifikasi nomor HP terformat dengan benar (`628...`) dan pesan URL-encoded memuat detail siswa, periode, nominal, dan info rekening Bank JAGO 501072411966.
4. **Pengujian Pelunasan:**
   - Verifikasi tombol 'Tandai Lunas' mengubah status fee, menambah transaksi di kas dojo, dan memperbarui angka ringkasan di dashboard.
