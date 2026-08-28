-- ============================================================
-- MIGRATION: Tambah kolom parent_name & parent_job
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom ke tabel students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS parent_name text,
  ADD COLUMN IF NOT EXISTS parent_job  text;

-- 2. Tambah kolom ke tabel registrations
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS parent_job text;

-- Verifikasi (opsional)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'students'
  AND column_name  IN ('parent_name', 'parent_job');
