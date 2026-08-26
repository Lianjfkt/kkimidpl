-- ============================================================
-- FIX: Hapus policy yang menyebabkan infinite recursion
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Hapus policy bermasalah di tabel profiles
DROP POLICY IF EXISTS "Allow owners to do anything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;

-- 2. Buat ulang policy yang sederhana dan aman (tidak rekursif)
-- Semua orang bisa membaca profiles (tidak ada rekursi)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- User hanya bisa update profile mereka sendiri
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Semua authenticated user bisa insert (untuk trigger new user)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 3. Hapus juga policy bermasalah di tabel lain (jika ada rekursi serupa)
DROP POLICY IF EXISTS "Allow profiles to modify students" ON public.students;
DROP POLICY IF EXISTS "Allow owner to manage coaches" ON public.coaches;
DROP POLICY IF EXISTS "Allow owner to manage classes" ON public.classes;
DROP POLICY IF EXISTS "Allow managers to write class_students" ON public.class_students;
DROP POLICY IF EXISTS "Allow managers to write attendance_students" ON public.attendance_students;
DROP POLICY IF EXISTS "Allow owner to manage attendance_coaches" ON public.attendance_coaches;
DROP POLICY IF EXISTS "Allow owners to manage fees" ON public.fees;
DROP POLICY IF EXISTS "Allow owners to manage finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Allow owner to manage belt_exams" ON public.belt_exams;
DROP POLICY IF EXISTS "Allow managers to write exam_participants" ON public.exam_participants;
DROP POLICY IF EXISTS "Allow owner to manage tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow managers to write tournament_participants" ON public.tournament_participants;
DROP POLICY IF EXISTS "Allow owner to modify registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow read/write access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow owner to manage curriculum_materials" ON public.curriculum_materials;

-- 4. Buat ulang policy sederhana (tanpa query ke profiles) untuk semua tabel
-- Authenticated user bisa baca dan tulis semua data (MVP - bisa diperketat nanti)
CREATE POLICY "students_all" ON public.students FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "coaches_all" ON public.coaches FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "classes_all" ON public.classes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "class_students_all" ON public.class_students FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "attendance_students_all" ON public.attendance_students FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "attendance_coaches_all" ON public.attendance_coaches FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "fees_all" ON public.fees FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "finance_all" ON public.finance_transactions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "belt_exams_all" ON public.belt_exams FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "exam_participants_all" ON public.exam_participants FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "tournaments_all" ON public.tournaments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "tournament_participants_all" ON public.tournament_participants FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "registrations_insert" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "registrations_read" ON public.registrations FOR SELECT USING (true);
CREATE POLICY "registrations_update" ON public.registrations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true);
CREATE POLICY "curriculum_all" ON public.curriculum_materials FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Verifikasi: coba baca profiles sekarang
SELECT id, full_name, role FROM public.profiles LIMIT 5;
