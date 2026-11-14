# Design Spec: Custom-Period Billing & Attendance WhatsApp Recap

- **Date:** 2026-11-14
- **Status:** Approved by User
- **Author:** Antigravity (Dojo KKI DPL System)

---

## 1. Problem Statement & Motivation
Currently, reports and billing reminders in Dojo KKI DPL are restricted to single-month snapshots (e.g. only "Maret 2026"). Dojo administrators need to:
1. Pull data across customizable period ranges (e.g., from *Januari 2026* to *Maret 2026*).
2. Generate comprehensive billing reminders via WhatsApp sent directly to parents' personal numbers.
3. Provide parents with a clear overview of both **attendance performance** (total sessions, attended, excused, sick, unexcused/alpha) and **unpaid dues** (which specific months remain unpaid and the total nominal).
4. Download integrated CSV reports for offline bookkeeping across both the Finance (`/owner/finance`) and Reports (`/owner/reports`) sections.

---

## 2. Requirements & Key Decisions

- **Range Selection Mode:** Month-Year Range (Option A approved):
  - Start Period: `[Start Month]` + `[Start Year]`
  - End Period: `[End Month]` + `[End Year]`
  - Quick Presets: "Bulan Ini" (Current Month), "3 Bulan Terakhir" (Last 3 Months), "Tahun Berjalan" (Current Year).
- **Placement & Integration:** Option 3 approved:
  - Primary execution center in `/owner/finance` (Penagihan & Tunggakan tab) with 1-click WhatsApp buttons, message copying, and quick payment processing.
  - Secondary/archive center in `/owner/reports` with range-enabled fee/attendance exports and an integrated "Rekap Terpadu Tagihan & Absensi" card.
- **WhatsApp Message Format:** Polished, professional karate dojo notification featuring student belt, session attendance statistics with percentage, unpaid month breakdown, Bank JAGO bank account information, and polite closing with "OSS!".

---

## 3. Data Flow & Business Logic Architecture

### 3.1 Range Calculation (`billingUtils.ts`)
1. **`getMonthsInRange(startMonth, startYear, endMonth, endYear)`**:
   Returns an array of `{ month: number, year: number }` objects between start and end inclusive. Handles crossing year boundaries (e.g., Nov 2025 to Feb 2026).
2. **`getDateRangeBounds(startMonth, startYear, endMonth, endYear)`**:
   Returns `startDate` (e.g. `2026-01-01`) and `endDate` (last day of end month, e.g. `2026-03-31`) as ISO date strings for querying and filtering `attendance_students`.

### 3.2 Attendance Aggregation
Given `studentId`, `attendance_students` array, and date bounds:
- Filter entries where `student_id === studentId` and `session_date >= startDate` and `session_date <= endDate`.
- Count:
  - `hadir`: status === 'hadir'
  - `izin`: status === 'izin'
  - `sakit`: status === 'sakit'
  - `alpha`: status === 'alpha'
- `totalSessions`: `hadir + izin + sakit + alpha`
- `attendancePct`: `totalSessions > 0 ? Math.round((hadir / totalSessions) * 100) : 0`

### 3.3 Dues & Arrears Aggregation
For each `{ month, year }` in the selected range:
- Search student fee records in `fees`.
- If a record exists with `status === 'lunas'`, that month is marked as paid.
- If a record exists with `status !== 'lunas'`, or if no record exists at all (unbilled), that month is marked unpaid with nominal (record amount or default Rp 20.000).
- Produce:
  - `unpaidMonthsInPeriod`: string array of unpaid months in range (e.g., `["Februari 2026", "Maret 2026"]`).
  - `totalPeriodUnpaidAmount`: sum of unpaid fees within the range.
  - `totalAllTimeArrears`: sum of all unpaid fees across all historical records for full visibility.
  - `isRangeFullyPaid`: boolean indicating whether all months in range are paid.

### 3.4 WhatsApp Message Template
```text
🥋 *REKAP KEHADIRAN & IURAN DOJO KKI DPL* 🥋

Yth. Bapak/Ibu *[Nama Orang Tua]* (Wali dari ananda *[Nama Siswa]* - Sabuk [Sabuk]),

Semoga Bapak/Ibu senantiasa dalam keadaan sehat walafiat.
Berikut kami sampaikan laporan kehadiran latihan karate serta rincian iuran ananda untuk periode *[Bulan Mulai Tahun - Bulan Selesai Tahun]*:

📊 *REKAP KEHADIRAN LATIHAN:*
• Total Sesi: [totalSessions] sesi latihan
• Hadir: [hadir] kali ([attendancePct]%)
• Izin: [izin] kali
• Sakit: [sakit] kali
• Alpha (Tanpa Keterangan): [alpha] kali

💳 *RINCIAN IURAN:*
• Status: [Semua Lunas / Belum Lunas: Daftar Bulan]
• Total Tagihan yang Perlu Diselesaikan: *Rp [totalUnpaidAmount]*

Pembayaran dapat ditransfer melalui:
🏦 *Bank:* Bank JAGO
💳 *No. Rekening:* 501072411966
👤 *A.N:* KKI DPL / Pengurus Dojo
(Atau dapat dibayar tunai saat jadwal latihan di dojo).

Mohon konfirmasi dengan mengirimkan bukti transfer jika sudah membayar.
Terima kasih atas kerja sama dan dukungannya dalam pembinaan karate ananda.

_OSS! Salam Karate._ 🙏
```

---

## 4. UI/UX Specifications

### 4.1 `/owner/finance` - Tab Penagihan & Tunggakan
- **Period Filter Controls:**
  - `Dari: [Bulan Dropdown] [Tahun Input]`
  - `Sampai: [Bulan Dropdown] [Tahun Input]`
  - Quick buttons: "Bulan Ini", "3 Bulan Terakhir", "Tahun Berjalan".
- **KPI Summary Cards:**
  1. *Siswa Tertunggak*: Total active students with >= 1 unpaid month in range.
  2. *Total Tagihan Tertunggak*: Total unpaid rupiah in range.
  3. *Tingkat Kehadiran*: Dojo-wide average attendance rate in range.
  4. *Nunggak Multi-Periode*: Count of students with > 1 unpaid month.
- **Table Columns:**
  1. *Siswa & Sabuk*: Name, avatar, official belt badge.
  2. *Orang Tua & Kontak*: Parent name, phone number, direct WA link.
  3. *Rekap Absensi*: Attendance % badge (`bg-emerald-500/20` for >= 80%, `bg-amber-500/20` for 60-79%, `bg-red-500/20` for < 60%) + breakdown `H: X · I: Y · S: Z · A: W`.
  4. *Status Iuran*: Badge `Lunas` or `N Bulan Belum Bayar` with specific unpaid months listed.
  5. *Aksi*:
     - `Tagih WA` (Green button): opens `https://wa.me/{phone}?text={encodedMsg}`
     - `Salin` (Secondary button): copies message text to clipboard with toast notification.
     - `Bayar` (Accent button): quick pay modal to record payment.
- **Export Action:**
  - "Ekspor CSV Rekap" generates full combined spreadsheet.

### 4.2 `/owner/reports` - Laporan & Ekspor Data
- Update **Laporan Iuran Bulanan** card to have start and end month/year pickers.
- Update **Laporan Absensi Siswa** card to have start and end month/year pickers.
- Add **Laporan Terpadu Tagihan & Absensi (Siap Tagih WA)** card with range picker, download CSV button, and shortcut button to `/owner/finance?tab=penagihan`.

---

## 5. Implementation Files
1. `src/lib/billingUtils.ts`
   - Add range helpers (`getMonthsInRange`, `getDateRangeBounds`).
   - Add `calculateStudentRangeBillingAndAttendance`.
   - Update `generateWhatsAppMessage` to include attendance stats.
   - Add `generateIntegratedBillingCsv`.
2. `src/app/owner/finance/page.tsx`
   - Add state for `startMonth`, `startYear`, `endMonth`, `endYear`.
   - Update calculation memos to fetch attendance data and process range metrics.
   - Update filter bar, KPI cards, table columns, and action handlers.
3. `src/app/owner/reports/page.tsx`
   - Add range controls for fees and attendance exports.
   - Add integrated combined billing & attendance report card and CSV generator.

---

## 6. Verification & Testing Plan
1. **Unit/Logic Validation:**
   - Verify range calculations across normal range (e.g. Jan 2026 - Mar 2026) and cross-year range (e.g. Nov 2025 - Feb 2026).
   - Verify attendance counts accurately reflect records in `attendance_students`.
   - Verify WhatsApp messages format correctly with properly encoded URLs.
2. **UI Verification:**
   - Test preset buttons ("Bulan Ini", "3 Bulan Terakhir", "Tahun Berjalan").
   - Test "Tagih WA" and "Salin Pesan" buttons.
   - Verify CSV exports download and contain expected columns and UTF-8 encoding.
3. **Build Check:**
   - Run `npm run build` or `npx next build` to ensure zero TypeScript or bundling errors.

