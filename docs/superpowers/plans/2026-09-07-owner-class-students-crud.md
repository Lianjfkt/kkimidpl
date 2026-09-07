# Fitur CRUD Siswa di Sesi Kelas - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan antarmuka dan logika pengelolaan siswa (melihat daftar siswa, menambah siswa ke kelas, dan menghapus siswa dari kelas) langsung dari halaman Manajemen Kelas Owner.

**Architecture:** Memanfaatkan tabel relasi `class_students` dan `students` di Supabase. Pada kartu kelas ditampilkan badge jumlah siswa dan tombol "Kelola Siswa", yang membuka modal dialog interaktif Material 3 untuk CRUD siswa di kelas tersebut.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, TailwindCSS / Material 3 CSS variables, Supabase Client.

---

### Task 1: Update Halaman Owner Classes dengan Logika Fetch Siswa & Class Students

**Files:**
- Modify: `src/app/owner/classes/page.tsx`

**Interfaces & States:**
- Menambahkan state:
  - `classStudentsMap: Record<string, string[]>` (pemetaan class_id ke array student_id)
  - `allStudents: Student[]` (daftar seluruh siswa aktif dojo)
  - `selectedClassForStudents: ClassSession | null` (kelas yang sedang dikelola siswanya di modal)
  - `isStudentModalOpen: boolean`
  - `studentModalLoading: boolean`
  - `searchStudentQuery: string`
  - `selectedStudentToAdd: string`
  - `studentActionLoading: boolean`

- [ ] **Step 1: Fetch data `class_students` dan `students` pada fungsi `loadData`**
- [ ] **Step 2: Tambahkan fungsi helper enroll student (`handleAddStudentToClass`) dan unenroll student (`handleRemoveStudentFromClass`)**
- [ ] **Step 3: Tampilkan badge jumlah siswa dan tombol "Kelola Siswa" di kartu kelas**
- [ ] **Step 4: Buat komponen Modal Kelola Siswa (`M3Dialog` khusus kelola siswa) lengkap dengan search, list siswa terdaftar, dan dropdown penambahan siswa**
- [ ] **Step 5: Verifikasi build dan pengujian interaktif**

---

### Task 2: Verifikasi & Testing Alur CRUD Siswa Kelas

**Files:**
- Verify: `src/app/owner/classes/page.tsx`

- [ ] **Step 1: Jalankan typecheck / build test (`npm run build` atau Next lint)**
- [ ] **Step 2: Pastikan UX responsif, error handling jelas jika ada kendala koneksi Supabase, dan modal tertutup/terbuka dengan halus.**
