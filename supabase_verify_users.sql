-- Jalankan di Supabase SQL Editor untuk memverifikasi dan memperbaiki data

-- 1. Cek apakah user sudah ada di auth.users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- 2. Cek apakah profiles sudah terbuat (oleh trigger)
SELECT id, full_name, role, phone FROM public.profiles;

-- 3. Jika profiles kosong, insert manual berdasarkan UUID dari auth.users
-- Ganti UUID di bawah ini dengan UUID asli dari hasil query no. 1

-- INSERT INTO public.profiles (id, full_name, role, phone, avatar_url, created_at)
-- SELECT id, split_part(email, '@', 1), 'owner', '', '', now()
-- FROM auth.users WHERE email = 'owner@dojo.com'
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO public.profiles (id, full_name, role, phone, avatar_url, created_at)
-- SELECT id, split_part(email, '@', 1), 'pelatih', '', '', now()
-- FROM auth.users WHERE email = 'pelatih@dojo.com'
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO public.profiles (id, full_name, role, phone, avatar_url, created_at)
-- SELECT id, split_part(email, '@', 1), 'ortu', '', '', now()
-- FROM auth.users WHERE email = 'ortu@dojo.com'
-- ON CONFLICT (id) DO NOTHING;

-- 4. Update role yang mungkin salah (trigger buat role 'ortu' by default)
UPDATE public.profiles 
SET role = 'owner', full_name = 'Sensai Bambang (Owner)'
WHERE id = (SELECT id FROM auth.users WHERE email = 'owner@dojo.com');

UPDATE public.profiles 
SET role = 'pelatih', full_name = 'Sempai Ahmad Fauzi'
WHERE id = (SELECT id FROM auth.users WHERE email = 'pelatih@dojo.com');

-- 5. Verifikasi akhir
SELECT u.email, p.role, p.full_name 
FROM auth.users u 
JOIN public.profiles p ON u.id = p.id;
