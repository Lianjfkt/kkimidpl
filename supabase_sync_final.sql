-- ============================================================
-- SYNC FINAL - Jalankan seluruh script ini di Supabase SQL Editor
-- ============================================================

-- STEP 1: Pastikan email user sudah dikonfirmasi (tidak perlu verifikasi email)
UPDATE auth.users 
SET email_confirmed_at = now(),
    confirmation_token = ''
WHERE email IN ('owner@dojo.com', 'pelatih@dojo.com', 'ortu@dojo.com')
  AND email_confirmed_at IS NULL;

-- STEP 2: Reset password agar cocok dengan kode aplikasi
UPDATE auth.users 
SET encrypted_password = crypt('owner123', gen_salt('bf'))
WHERE email = 'owner@dojo.com';

UPDATE auth.users 
SET encrypted_password = crypt('pelatih123', gen_salt('bf'))
WHERE email = 'pelatih@dojo.com';

UPDATE auth.users 
SET encrypted_password = crypt('ortu123', gen_salt('bf'))
WHERE email = 'ortu@dojo.com';

-- STEP 3: Pastikan profiles ada dan role benar
-- Insert jika belum ada
INSERT INTO public.profiles (id, full_name, role, phone, avatar_url, created_at)
SELECT id, 'Sensai Bambang (Owner)', 'owner', '08121234567', '', now()
FROM auth.users WHERE email = 'owner@dojo.com'
ON CONFLICT (id) DO UPDATE SET role = 'owner', full_name = 'Sensai Bambang (Owner)';

INSERT INTO public.profiles (id, full_name, role, phone, avatar_url, created_at)
SELECT id, 'Sempai Ahmad Fauzi', 'pelatih', '08129876543', '', now()
FROM auth.users WHERE email = 'pelatih@dojo.com'
ON CONFLICT (id) DO UPDATE SET role = 'pelatih', full_name = 'Sempai Ahmad Fauzi';

INSERT INTO public.profiles (id, full_name, role, phone, avatar_url, created_at)
SELECT id, 'Demo Orang Tua', 'ortu', '08100000001', '', now()
FROM auth.users WHERE email = 'ortu@dojo.com'
ON CONFLICT (id) DO UPDATE SET role = 'ortu', full_name = 'Demo Orang Tua';

-- STEP 4: Verifikasi - hasil harus menunjukkan 3 baris dengan role yang benar
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as is_confirmed,
  p.full_name,
  p.role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email IN ('owner@dojo.com', 'pelatih@dojo.com', 'ortu@dojo.com')
ORDER BY p.role;
