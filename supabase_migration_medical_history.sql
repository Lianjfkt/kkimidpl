-- ============================================================
-- MIGRATION: Tambah kolom medical_history ke tabel students
-- Jalankan di Supabase SQL Editor
-- ============================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS medical_history text;

-- Verifikasi
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'students'
  AND column_name  = 'medical_history';

