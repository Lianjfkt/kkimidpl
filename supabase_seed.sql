-- ============================================================
-- SEED DEMO USERS - Jalankan ini di Supabase SQL Editor
-- ============================================================
-- Script ini membuat 3 akun demo dengan menggunakan fitur
-- Supabase Auth admin. Karena kita tidak bisa langsung INSERT
-- ke auth.users, kita perlu membuat user lewat Authentication
-- UI atau menggunakan script ini.
-- ============================================================

-- LANGKAH 1: Buat tabel profiles dulu (jalankan supabase_schema.sql lebih dulu)
-- LANGKAH 2: Setelah tabel dibuat, masukkan data profiles untuk akun yang
--            sudah dibuat lewat Supabase Auth Dashboard.

-- ============================================================
-- Jika Anda sudah membuat user lewat Authentication Dashboard,
-- ganti UUID di bawah ini dengan UUID asli dari user tersebut.
-- ============================================================

-- Untuk sementara, tambahkan seed data profiles (tanpa auth.users)
-- ini berguna jika Anda menonaktifkan RLS atau menggunakan Service Role Key

-- Setelah membuat user via Authentication > Add User di Supabase Dashboard:
-- 1. owner@dojo.com / Owner123!
-- 2. pelatih@dojo.com / Pelatih123!
-- 3. ortu@dojo.com / Ortu123!

-- Kemudian jalankan UPDATE berikut untuk set role mereka:
-- (Ganti UUID sesuai UUID yang tertera di Supabase Authentication)

-- UPDATE public.profiles SET role = 'owner' WHERE id = 'UUID_OWNER_DI_SINI';
-- UPDATE public.profiles SET role = 'pelatih' WHERE id = 'UUID_PELATIH_DI_SINI';
-- UPDATE public.profiles SET role = 'ortu' WHERE id = 'UUID_ORTU_DI_SINI';
