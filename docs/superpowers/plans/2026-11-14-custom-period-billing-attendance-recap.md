# Custom-Period Billing & Attendance WhatsApp Recap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow dojo administrators to pull reports and billing recaps for custom month/year ranges, displaying student attendance performance alongside unpaid monthly dues, and generating comprehensive WhatsApp reminder messages to be sent to parents' personal numbers with 1-click actions and CSV export.

**Architecture:** 
- `src/lib/billingUtils.ts` provides core pure functions for range parsing, date bounds, attendance statistics, multi-month arrears calculation, WhatsApp message templating, and CSV generation.
- `src/app/owner/finance/page.tsx` integrates the dual range selectors, quick presets ("Bulan Ini", "3 Bulan Terakhir", "Tahun Berjalan"), integrated KPIs, enhanced table columns (attendance breakdown and unpaid dues), 1-click WhatsApp messaging, and quick payments.
- `src/app/owner/reports/page.tsx` exposes custom period range pickers for fees/attendance reports and adds a new "Rekap Terpadu Tagihan & Absensi" card with direct CSV download and shortcut to the finance penagihan tab.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Supabase JS Client.

---

## Global Constraints
- Must adhere to Next.js 16 conventions and avoid deprecated APIs.
- Must maintain dark neumorphic UI consistency (`var(--neu-surface)`, `var(--neu-shadow-flat)`, `var(--md-sys-color-*)`).
- Phone numbers must be normalized into international WhatsApp format (`62...`).
- Do not remove or break existing quick payment modals or single-month compatibility (start = end month works seamlessly).

---

## Task Decomposition

### Task 1: Extend `billingUtils.ts` with Range Computation, Attendance Aggregation, & Enhanced WhatsApp Generator

**Files:**
- Create: `scripts/test-billing-range.ts` (test harness)
- Modify: `src/lib/billingUtils.ts`

- [ ] **Step 1: Write test harness in `scripts/test-billing-range.ts`**
  Write a test script that tests:
  1. `getMonthsInRange(startMonth, startYear, endMonth, endYear)` for single-month, multi-month in same year, and cross-year range.
  2. `getDateRangeBounds(startMonth, startYear, endMonth, endYear)` for valid ISO date strings.
  3. `calculateStudentAttendanceStats` for correct counts of Hadir, Izin, Sakit, Alpha, total sessions, and percentage.
  4. `generateWhatsAppMessage` to verify proper rendering of attendance stats, unpaid dues, and Bank JAGO details.

- [ ] **Step 2: Run test harness to observe expected failure (initial state)**
  Run: `node --experimental-strip-types scripts/test-billing-range.ts`
  Verify that functions not yet exported fail with reference errors.

- [ ] **Step 3: Implement range utilities and calculation functions in `src/lib/billingUtils.ts`**
  - Implement `getMonthsInRange(startMonth: number, startYear: number, endMonth: number, endYear: number)`.
  - Implement `getDateRangeBounds(startMonth: number, startYear: number, endMonth: number, endYear: number)`.
  - Implement `AttendanceRecord` interface and `calculateStudentAttendanceStats(studentId: string, attendance: any[], startDate: string, endDate: string)`.
  - Implement `calculateStudentRangeBilling(studentId: string, allFees: Fee[], monthsRange: Array<{month: number, year: number}>, defaultMonthlyAmount?: number)`.
  - Update `WhatsAppMessageParams` and `generateWhatsAppMessage` to include attendance statistics and list of unpaid months.
  - Implement `generateIntegratedBillingCsv(items: any[], startMonth: number, startYear: number, endMonth: number, endYear: number)`.

- [ ] **Step 4: Run test harness to verify all assertions pass**
  Run: `node --experimental-strip-types scripts/test-billing-range.ts`
  Ensure all tests output `PASSED`.

- [ ] **Step 5: Commit changes**
  Run: `git add src/lib/billingUtils.ts scripts/test-billing-range.ts && git commit -m "feat(billing): add range calculations, attendance aggregation, and enhanced WhatsApp template"`

---

### Task 2: Update `/owner/finance` Penagihan Tab with Range Filter, Presets, Attendance Columns, & WhatsApp Integration

**Files:**
- Modify: `src/app/owner/finance/page.tsx`

- [ ] **Step 1: Inspect and prepare state in `src/app/owner/finance/page.tsx`**
  - Add state for `billingStartMonth`, `billingStartYear`, `billingEndMonth`, `billingEndYear`.
  - Add `attendance: StudentAttendance[]` to fetched datasets in `loadData()` by calling `supabase.from('attendance_students').select('*')`.
  - Set default range to current month (`startMonth = currentMonth`, `endMonth = currentMonth`).

- [ ] **Step 2: Update Filter Bar & Quick Preset Buttons**
  - Replace the single month/year selector with dual selectors:
    - "Dari: [Bulan] [Tahun]"
    - "Sampai: [Bulan] [Tahun]"
  - Add 3 preset buttons:
    - "Bulan Ini" (`start = currentMonth, end = currentMonth, year = currentYear`)
    - "3 Bulan Terakhir" (`start = currentMonth - 2, end = currentMonth`)
    - "Tahun Berjalan" (`start = 1, end = 12, year = currentYear`)

- [ ] **Step 3: Update KPI calculations for the selected range**
  - Filter and calculate:
    - Number of active students with at least 1 unpaid month in range.
    - Total unpaid amount across the range.
    - Dojo average attendance percentage across all active students in the range.
    - Number of students with > 1 month arrears.

- [ ] **Step 4: Update Billing Table Columns**
  - Add Column **"Rekap Absensi (Periode Ini)"**:
    - Display attendance rate badge (`%` and sessions attended/total) with conditional color coding (green >= 80%, yellow 60-79%, red < 60%).
    - Display sub-breakdown: `H: [hadir] · I: [izin] · S: [sakit] · A: [alpha]`.
  - Update Column **"Status Iuran Rentang Ini"**:
    - Display whether all months in range are paid or show badges for unpaid months (e.g. `⚠️ 2 Bulan Belum Bayar (Feb, Mar 2026)`).
  - Update Actions:
    - "Tagih WA" calls `handleSendWhatsApp` with range attendance + dues parameters.
    - "Salin" calls `handleCopyWhatsAppText` with range parameters.
    - Update CSV export button to call `generateIntegratedBillingCsv`.

- [ ] **Step 5: Verify build and compile stability**
  Run: `npm run build`
  Verify that TypeScript compiles with 0 errors.

- [ ] **Step 6: Commit changes**
  Run: `git add src/app/owner/finance/page.tsx && git commit -m "feat(finance): add period range selector, attendance stats, and enhanced WhatsApp billing in penagihan tab"`

---

### Task 3: Update `/owner/reports` with Range Filters & Integrated Report Card

**Files:**
- Modify: `src/app/owner/reports/page.tsx`

- [ ] **Step 1: Add Range Selection State in `src/app/owner/reports/page.tsx`**
  - Add `startMonth`, `startYear`, `endMonth`, `endYear` states (or separate states for fees and attendance).
  - Add quick presets or synchronize default to current month.

- [ ] **Step 2: Update Fee and Attendance Export Cards to Support Range**
  - In "Laporan Iuran Bulanan" card: allow selecting Dari Bulan/Tahun s/d Sampai Bulan/Tahun.
  - In "Laporan Absensi Siswa" card: allow selecting Dari Bulan/Tahun s/d Sampai Bulan/Tahun.
  - Update `exportFees` and `exportAttendance` filter logic to filter across the selected range.

- [ ] **Step 3: Add "Laporan Terpadu Tagihan & Absensi Siswa" Card**
  - Create a new 4th card (or featured section) that integrates both dues and attendance.
  - Add button "📥 Unduh Rekap Terpadu (CSV)" using `generateIntegratedBillingCsv`.
  - Add button "↗ Buka Menu Penagihan WA" linking to `/owner/finance` (with activeTab = 'penagihan').

- [ ] **Step 4: Verify build and compile stability**
  Run: `npm run build`
  Verify no syntax, typing, or compilation errors.

- [ ] **Step 5: Commit changes**
  Run: `git add src/app/owner/reports/page.tsx && git commit -m "feat(reports): add range-based exports and integrated billing & attendance recap card"`

---

### Task 4: End-to-End Verification & Documentation

**Files:**
- Test scripts and build artifacts

- [ ] **Step 1: Run comprehensive tests**
  Run: `node --experimental-strip-types scripts/test-billing-range.ts`
  Verify all assertions pass.

- [ ] **Step 2: Run Next.js production build**
  Run: `npm run build`
  Ensure production bundle builds cleanly.

- [ ] **Step 3: Review git status and final commit**
  Run: `git status`
  Ensure working directory is clean and documented.
