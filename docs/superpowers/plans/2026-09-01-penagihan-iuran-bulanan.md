# Rencana Implementasi: Fitur Pelacakan Siswa Belum Bayar Iuran & Penagihan WhatsApp Otomatis

> **Untuk agentic workers:** REQUIRED SUB-SKILL: Gunakan superpowers:subagent-driven-development (direkomendasikan) atau superpowers:executing-plans untuk mengimplementasikan rencana ini task-by-task.

**Goal:** Membangun fitur pelacakan siswa aktif yang belum membayar iuran bulanan per periode tertentu (bulan/tahun), dilengkapi dengan ringkasan KPI tunggakan, deteksi akumulasi tunggakan lebih dari 1 bulan, penagihan WhatsApp 1-klik dengan nomor rekening resmi Bank JAGO 501072411966, tombol salin pesan, aksi cepat pelunasan tunai/transfer/QRIS yang terhubung ke pembukuan kas dojo, dan ekspor CSV.

**Arsitektur:**
- Menambahkan modul utilitas `src/lib/billingUtils.ts` untuk pemformatan nomor WhatsApp, pembuatan template pesan tagihan yang sopan & profesional, kalkulasi multi-bulan tunggakan, serta pembuatan tautan `wa.me`.
- Mengintegrasikan tab baru `⚠️ Penagihan & Tunggakan` di halaman Keuangan Admin/Owner (`src/app/owner/finance/page.tsx`).
- Menghubungkan aksi pelunasan cepat langsung dengan Supabase `fees` dan `finance_transactions`.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS / Material 3 Design System, Supabase Client.

## Global Constraints
- Rekening pembayaran tagihan: **Bank JAGO 501072411966** a.n. KKI DPL / Pengurus Dojo.
- Format nomor WhatsApp harus dinormalisasi secara otomatis (`08...` -> `628...`).
- Desain mengikuti Material 3 Design System (`m3-card-elevated`, `m3-btn-filled`, `m3-btn-tonal`, tokens CSS variabel warna tema dojo).

---

### Task 1: Membuat Utilitas Penagihan (`src/lib/billingUtils.ts`)

**Files:**
- Create: `src/lib/billingUtils.ts`

**Interfaces:**
- `formatWhatsAppNumber(phone: string): string`
- `generateWhatsAppMessage(params: { studentName: string; parentName?: string; monthName: string; year: number; amount: number; totalArrearsAmount?: number; unpaidMonthsCount?: number; unpaidMonthNames?: string[] }): string`
- `generateWhatsAppUrl(phone: string, message: string): string`
- `calculateStudentArrears(studentId: string, fees: Fee[], currentMonth: number, currentYear: number)`

- [ ] **Step 1: Buat file `src/lib/billingUtils.ts`**
Menuliskan fungsi normalisasi nomor telepon Indonesia, generator template pesan penagihan dengan rekening Bank JAGO 501072411966, pembuat URL WhatsApp Web/App, serta fungsi kalkulasi akumulasi tunggakan.

- [ ] **Step 2: Verifikasi fungsi utilitas**
Membuat script verifikasi di scratch directory atau unit check untuk memastikan format output teks dan nomor `628xxx` sesuai standar.

- [ ] **Step 3: Commit task 1**
```bash
git add src/lib/billingUtils.ts
git commit -m "feat(finance): add billing utilities for WhatsApp message generation and arrears tracking"
```

---

### Task 2: Mengintegrasikan Tab "Penagihan & Tunggakan" di `src/app/owner/finance/page.tsx`

**Files:**
- Modify: `src/app/owner/finance/page.tsx`

**Interfaces:**
- Menggunakan `src/lib/billingUtils.ts`
- State baru untuk `activeTab`: `'kas' | 'penagihan' | 'analytics'`
- State filter: `selectedBillingMonth`, `selectedBillingYear`, `billingSearchQuery`, `billingBeltFilter`, `billingStatusFilter`
- Modal konfirmasi pelunasan cepat (`quickPayModalOpen`, `quickPayFee`, `quickPayStudent`, `quickPayMethod`)

- [ ] **Step 1: Tambahkan tab switch "⚠️ Penagihan & Tunggakan"**
Tambahkan tombol tab ke-3 di bilah tab `/owner/finance`.

- [ ] **Step 2: Buat UI Filter & Ringkasan KPI Penagihan**
- Filter Bulan, Tahun, Pencarian Nama, Filter Sabuk, dan Filter Status.
- 4 Kartu KPI: Total Siswa Belum Bayar, Total Tagihan Tertunggak (Rp), Persentase Kepatuhan (%), dan Total Siswa Menunggak > 1 Bulan.

- [ ] **Step 3: Buat Tabel & Kartu Interaktif Siswa Penagihan**
- Menampilkan profil siswa, sabuk, nama ortu, kontak HP.
- Badge status (Lunas / Belum Lunas) dan badge peringatan akumulasi tunggakan (jika ada tunggakan di bulan lain).
- Tombol Kirim WhatsApp (1-klik buka WA Web/App).
- Tombol Salin Pesan (dengan feedback visual tooltip / toast tersalin).
- Tombol Tandai Lunas Cepat (buka modal pilihan metode bayar, simpan ke Supabase `fees` & `finance_transactions`).

- [ ] **Step 4: Tambahkan Fitur Ekspor Rekap Penagihan (CSV)**
Tombol ekspor khusus data siswa yang belum bayar pada bulan terpilih ke format CSV.

- [ ] **Step 5: Commit task 2**
```bash
git add src/app/owner/finance/page.tsx
git commit -m "feat(finance): implement unpaid dues tracking and 1-click WhatsApp billing tab"
```

---

### Task 3: Verifikasi Sistem & Build Check

**Files:**
- Test/Verify: `src/app/owner/finance/page.tsx`, `src/lib/billingUtils.ts`

- [ ] **Step 1: Jalankan typecheck & build Next.js**
Jalankan `npm run build` untuk memverifikasi tidak ada error kompilasi TypeScript atau syntax.

- [ ] **Step 2: Verifikasi interaksi di browser**
Memastikan UI responsif, transisi tab mulus, filter bekerja akurat, dan format pesan WhatsApp rapi.

- [ ] **Step 3: Commit final & dokumentasi walkthrough**
```bash
git commit -m "chore: complete monthly dues billing and tracking feature verification"
```
