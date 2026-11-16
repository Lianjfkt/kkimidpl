-- ============================================================
-- FIX: Hapus Infinite Recursion pada RLS tabel profiles
-- Jalankan query ini di Supabase SQL Editor
-- ============================================================

-- 1. Hapus policy yang menyebabkan rekursi tak hingga
DROP POLICY IF EXISTS "Allow owners to do anything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow owners to update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow owners to delete any profile" ON public.profiles;

-- 2. Buat fungsi helper SECURITY DEFINER (bypass RLS, bebas dari rekursi)
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
  );
$$;

-- 3. Pasang policy baru yang aman
-- Siapa pun dapat membaca profil (penting agar sesi login dapat membaca nama & role)
CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

-- User dapat mengupdate profil miliknya sendiri
CREATE POLICY "Allow users to update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Mengizinkan insert profil saat ada pendaftaran user baru
CREATE POLICY "Allow public insert to profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Owner dapat mengupdate & menghapus profil lain lewat helper function
CREATE POLICY "Allow owners to update any profile" ON public.profiles
  FOR UPDATE USING (public.is_owner());

CREATE POLICY "Allow owners to delete any profile" ON public.profiles
  FOR DELETE USING (public.is_owner());

-- 4. Verifikasi: Tes query membaca profiles (tidak boleh error 42P17)
SELECT id, full_name, role FROM public.profiles;
