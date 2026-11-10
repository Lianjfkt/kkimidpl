-- ============================================================
-- FIX EVENTS & EXAMS SCHEMA & POLICIES
-- Dojo Karate KKI DPL
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================

-- 1. Perbarui tabel belt_exams
ALTER TABLE public.belt_exams 
  ADD COLUMN IF NOT EXISTS fee numeric DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS notes text;

-- Sinkronkan fee dengan registration_fee jika salah satu ada isinya
UPDATE public.belt_exams 
SET fee = registration_fee 
WHERE fee IS NULL AND registration_fee IS NOT NULL;

UPDATE public.belt_exams 
SET registration_fee = fee 
WHERE registration_fee IS NULL AND fee IS NOT NULL;

-- Perbarui check constraint status di belt_exams agar menerima 'terjadwal' dan 'mendatang'
ALTER TABLE public.belt_exams DROP CONSTRAINT IF EXISTS belt_exams_status_check;
ALTER TABLE public.belt_exams ADD CONSTRAINT belt_exams_status_check 
  CHECK (status IN ('terjadwal', 'mendatang', 'selesai', 'dibatalkan'));

-- Normalisasi status 'mendatang' menjadi 'terjadwal' agar seragam dengan frontend
UPDATE public.belt_exams 
SET status = 'terjadwal' 
WHERE status = 'mendatang';

-- 2. Perbarui tabel tournaments
ALTER TABLE public.tournaments 
  ADD COLUMN IF NOT EXISTS tournament_date date,
  ADD COLUMN IF NOT EXISTS level text DEFAULT 'lokal',
  ADD COLUMN IF NOT EXISTS organizer text;

-- Sinkronkan tournament_date dari start_date jika start_date ada
UPDATE public.tournaments 
SET tournament_date = start_date 
WHERE tournament_date IS NULL AND start_date IS NOT NULL;

UPDATE public.tournaments 
SET start_date = tournament_date 
WHERE start_date IS NULL AND tournament_date IS NOT NULL;

UPDATE public.tournaments 
SET end_date = COALESCE(end_date, tournament_date, start_date) 
WHERE end_date IS NULL;

-- Jadikan start_date dan end_date opsional (DROP NOT NULL)
ALTER TABLE public.tournaments 
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN end_date DROP NOT NULL;

-- 3. Perbarui tabel exam_participants
ALTER TABLE public.exam_participants 
  ADD COLUMN IF NOT EXISTS current_belt text,
  ADD COLUMN IF NOT EXISTS result text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS score_notes text;

-- Sinkronkan result dan status pada exam_participants jika diperlukan
UPDATE public.exam_participants
SET result = CASE 
  WHEN status = 'lulus' THEN 'lulus'
  WHEN status = 'tidak_lulus' THEN 'tidak_lulus'
  ELSE 'pending'
END
WHERE result IS NULL OR result = '';

-- 4. Perbarui tabel tournament_participants
ALTER TABLE public.tournament_participants 
  ADD COLUMN IF NOT EXISTS medal text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS weight_class text;

-- 5. Perbaiki tabel notifications (ID otomatis & foreign key toleran)
ALTER TABLE public.notifications 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 6. RLS Policies yang Bersih dan Aman (Non-rekursif) untuk Event & Ujian
-- Tabel belt_exams
DROP POLICY IF EXISTS "Allow read access to belt_exams" ON public.belt_exams;
DROP POLICY IF EXISTS "Allow owner to manage belt_exams" ON public.belt_exams;
DROP POLICY IF EXISTS "belt_exams_read_all" ON public.belt_exams;
DROP POLICY IF EXISTS "belt_exams_manager_all" ON public.belt_exams;

CREATE POLICY "belt_exams_read_all" ON public.belt_exams
  FOR SELECT USING (true);

CREATE POLICY "belt_exams_manager_all" ON public.belt_exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'pelatih')
    )
  );

-- Tabel tournaments
DROP POLICY IF EXISTS "Allow read access to tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow owner to manage tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_read_all" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_manager_all" ON public.tournaments;

CREATE POLICY "tournaments_read_all" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "tournaments_manager_all" ON public.tournaments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'pelatih')
    )
  );

-- Tabel exam_participants
DROP POLICY IF EXISTS "Allow read access to exam_participants" ON public.exam_participants;
DROP POLICY IF EXISTS "Allow managers to write exam_participants" ON public.exam_participants;
DROP POLICY IF EXISTS "exam_participants_read_all" ON public.exam_participants;
DROP POLICY IF EXISTS "exam_participants_manager_all" ON public.exam_participants;

CREATE POLICY "exam_participants_read_all" ON public.exam_participants
  FOR SELECT USING (true);

CREATE POLICY "exam_participants_manager_all" ON public.exam_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'pelatih')
    )
  );

-- Tabel tournament_participants
DROP POLICY IF EXISTS "Allow read access to tournament_participants" ON public.tournament_participants;
DROP POLICY IF EXISTS "Allow managers to write tournament_participants" ON public.tournament_participants;
DROP POLICY IF EXISTS "tournament_participants_read_all" ON public.tournament_participants;
DROP POLICY IF EXISTS "tournament_participants_manager_all" ON public.tournament_participants;

CREATE POLICY "tournament_participants_read_all" ON public.tournament_participants
  FOR SELECT USING (true);

CREATE POLICY "tournament_participants_manager_all" ON public.tournament_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'pelatih')
    )
  );

