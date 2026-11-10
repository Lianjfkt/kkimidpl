# Comprehensive Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menuntaskan seluruh perbaikan arsitektur keamanan, basis data RLS, alur pembuatan akun & reset password, penghapusan data asli (tanpa localStorage hack), pencegahan fallback sembarangan ke mock data, perbaikan navigasi, dan pembersihan ESLint/React 19.

**Architecture:** 
1. Database Layer: Script SQL migrasi RLS untuk tabel `registrations`, `finance_transactions`, `coaches`, dan `notifications`.
2. Server API Layer: Next.js API Route `/api/admin/users` untuk operasi administratif Auth tanpa membajak sesi login client.
3. Client Pages: Refactor registrasi, settings, notification bell, ortu, pelatih, dan login untuk mengikuti standar Next.js 16 App Router & Supabase.

**Tech Stack:** Next.js 16.3, React 19.2, Supabase JS SDK, TypeScript, Tailwind CSS v4.

---

### Task 1: SQL Security & RLS Migration Script
- [ ] Create `supabase_security_and_rls_fix.sql` containing:
  - Policy DELETE pada `registrations` untuk role owner
  - Policy pembatasan `finance_transactions` hanya untuk owner
  - Policy pembatasan `coaches` (honor) hanya untuk owner dan pelatih bersangkutan
  - Optimasi policy `notifications`

### Task 2: Server API Route for User Management (`/api/admin/users`)
- [ ] Create `src/app/api/admin/users/route.ts` to safely create or update users with Supabase Admin API
- [ ] Support password reset via auth admin or client-side `updateUser`
- [ ] Gracefully handle environment when service role key is present or fallback to client auth

### Task 3: Refactor Registration Approval & Real DB Deletion
- [ ] Modify `src/app/owner/registrations/page.tsx`:
  - Call `/api/admin/users` during approval instead of client `rawClient.auth.signUp`
  - Remove `getDeletedIds()` / `localStorage.getItem('deleted_registration_ids')`
  - Execute genuine Supabase `delete()` query with proper error handling

### Task 4: Fix Settings Page Password & Profile Updates
- [ ] Modify `src/app/settings/page.tsx`:
  - Remove local SHA-256 hashing to `password_hash` column
  - Use `supabase.auth.updateUser({ password })` for personal password changes
  - Use `/api/admin/users` for Owner updating other users' passwords or roles

### Task 5: Fix `NotificationBell.tsx` Performance & React 19 Purity
- [ ] Modify `src/components/NotificationBell.tsx`:
  - Batch update in `markAllAsRead` with a single SQL query
  - Fix React 19 impure function error for time ago formatting
  - Support Supabase Realtime channel subscription

### Task 6: Remove Silent Mock Data Fallback in Ortu & Pelatih Pages
- [ ] Modify `src/app/ortu/page.tsx` to display proper empty state if parent has no children
- [ ] Modify `src/app/pelatih/page.tsx` to handle 0 students gracefully without injecting `initialStudents`
- [ ] Modify `src/app/owner/students/[id]/page.tsx` to remove whole-table fallback scan

### Task 7: Fix Login, Phone Normalization, and Router Navigation
- [ ] Modify `src/app/login/page.tsx`:
  - Replace `window.location.href` with `router.push()`
  - Normalize phone numbers uniformly (`+62...`, `08...`, `62...`)
  - Target actual owner UUIDs for registration notifications instead of hardcoded `'user-owner-id'`

### Task 8: ESLint & Build Verification
- [ ] Update `eslint.config.mjs` to ignore `.gemini/**` and `scripts/**`
- [ ] Run `npm run lint` and resolve any remaining warnings/errors
- [ ] Run `npm run build` to verify clean production compile
