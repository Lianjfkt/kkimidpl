-- ============================================================
-- FIX: Hapus policy generik dan buat policy berbasis role yang aman (non-rekursif)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Hapus policy lama
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "students_all" ON public.students;
DROP POLICY IF EXISTS "attendance_students_all" ON public.attendance_students;
DROP POLICY IF EXISTS "fees_all" ON public.fees;

-- 2. Buat ulang policy tabel profiles (tanpa lookup rekursif)
-- Semua orang bisa melihat profile
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- User hanya bisa mengupdate profile mereka sendiri
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Memungkinkan proses insert saat pendaftaran
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (true);


-- 3. Policy tabel students
-- Owner dan Pelatih bisa mengakses penuh
CREATE POLICY "students_manager_all" ON public.students
  FOR ALL USING (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('owner', 'pelatih')
    )
  );

-- Orang Tua hanya bisa melihat anak mereka sendiri
CREATE POLICY "students_parent_select" ON public.students
  FOR SELECT USING (
    parent_id = auth.uid()
  );


-- 4. Policy tabel attendance_students
-- Owner dan Pelatih bisa mengelola absensi
CREATE POLICY "attendance_manager_all" ON public.attendance_students
  FOR ALL USING (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('owner', 'pelatih')
    )
  );

-- Orang Tua hanya bisa melihat absensi anak mereka sendiri
CREATE POLICY "attendance_parent_select" ON public.attendance_students
  FOR SELECT USING (
    exists (
      select 1 from public.students
      where students.id = attendance_students.student_id and students.parent_id = auth.uid()
    )
  );


-- 5. Policy tabel fees
-- Hanya Owner yang bisa mengelola tagihan iuran
CREATE POLICY "fees_owner_all" ON public.fees
  FOR ALL USING (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'owner'
    )
  );

-- Orang Tua hanya bisa melihat tagihan anak mereka sendiri
CREATE POLICY "fees_parent_select" ON public.fees
  FOR SELECT USING (
    exists (
      select 1 from public.students
      where students.id = fees.student_id and students.parent_id = auth.uid()
    )
  );

