-- ============================================================
-- MIGRASI DATA SABUK - Dojo Karate KKI DPL
-- Standarisasi semua nilai sabuk ke: Putih, Kuning, Hijau,
-- Biru Muda, Biru Tua, Coklat Muda, Coklat Tua, Hitam
-- Tidak ada Geup, hanya Kyu (sistem kenaikan tingkat).
-- Jalankan script ini di Supabase SQL Editor.
-- ============================================================

-- 1. Normalisasi students.current_belt

-- "Biru" tanpa kualifikasi → Biru Muda
UPDATE students SET current_belt = 'Biru Muda'
WHERE LOWER(TRIM(current_belt)) = 'biru';

-- "Coklat" / "Cokelat" tanpa kualifikasi → Coklat Muda
UPDATE students SET current_belt = 'Coklat Muda'
WHERE LOWER(TRIM(current_belt)) IN ('coklat', 'cokelat');

-- Nilai kosong / null → Putih
UPDATE students SET current_belt = 'Putih'
WHERE current_belt IS NULL OR TRIM(current_belt) = '';

-- Format angka kyu (old system)
UPDATE students SET current_belt = 'Putih'
WHERE LOWER(TRIM(current_belt)) IN ('10 kyu', 'putih', 'white');

UPDATE students SET current_belt = 'Kuning'
WHERE LOWER(TRIM(current_belt)) IN ('9 kyu', '8 kyu', '7 kyu', 'kuning', 'yellow');

UPDATE students SET current_belt = 'Hijau'
WHERE LOWER(TRIM(current_belt)) IN ('6 kyu', '5 kyu', 'hijau', 'green');

UPDATE students SET current_belt = 'Biru Muda'
WHERE LOWER(TRIM(current_belt)) IN ('4 kyu', 'biru muda', 'biru-muda', 'blue light');

UPDATE students SET current_belt = 'Biru Tua'
WHERE LOWER(TRIM(current_belt)) IN ('3 kyu', 'biru tua', 'biru-tua', 'blue dark');

UPDATE students SET current_belt = 'Coklat Muda'
WHERE LOWER(TRIM(current_belt)) IN ('2 kyu', 'coklat muda', 'cokelat muda', 'brown light');

UPDATE students SET current_belt = 'Coklat Tua'
WHERE LOWER(TRIM(current_belt)) IN ('1 kyu', 'coklat tua', 'cokelat tua', 'brown dark');

UPDATE students SET current_belt = 'Hitam'
WHERE LOWER(TRIM(current_belt)) LIKE '%hitam%'
   OR LOWER(TRIM(current_belt)) LIKE '%dan%'
   OR LOWER(TRIM(current_belt)) LIKE '%black%';

-- 2. Normalisasi exam_participants.target_belt & current_belt (Safe Check)
UPDATE exam_participants SET target_belt = 'Biru Muda'
WHERE LOWER(TRIM(target_belt)) = 'biru';

UPDATE exam_participants SET target_belt = 'Coklat Muda'
WHERE LOWER(TRIM(target_belt)) IN ('coklat', 'cokelat');

UPDATE exam_participants SET target_belt = 'Kuning'
WHERE target_belt IS NULL OR TRIM(target_belt) = '';

-- Eksekusi aman untuk kolom current_belt di exam_participants jika ada di database Anda
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_participants' AND column_name = 'current_belt'
  ) THEN
    EXECUTE 'UPDATE exam_participants SET current_belt = ''Biru Muda'' WHERE LOWER(TRIM(current_belt)) = ''biru''';
    EXECUTE 'UPDATE exam_participants SET current_belt = ''Coklat Muda'' WHERE LOWER(TRIM(current_belt)) IN (''coklat'', ''cokelat'')';
    EXECUTE 'UPDATE exam_participants SET current_belt = ''Putih'' WHERE current_belt IS NULL OR TRIM(current_belt) = ''''';
  END IF;
END $$;

-- 3. Normalisasi coaches.belt_level (sistem Dan tetap dipertahankan)
UPDATE coaches SET belt_level = 'Dan I'
WHERE belt_level IS NULL
   OR TRIM(belt_level) = ''
   OR LOWER(TRIM(belt_level)) = 'hitam';

-- ============================================================
-- VERIFIKASI: Siswa dengan sabuk tidak standar
-- ============================================================
SELECT id, full_name, current_belt FROM students
WHERE current_belt NOT IN (
  'Putih', 'Kuning', 'Hijau', 'Biru Muda', 'Biru Tua',
  'Coklat Muda', 'Coklat Tua', 'Hitam'
)
ORDER BY current_belt;

-- Distribusi sabuk siswa setelah migrasi
SELECT current_belt, COUNT(*) AS jumlah
FROM students
GROUP BY current_belt
ORDER BY CASE current_belt
  WHEN 'Putih'       THEN 1
  WHEN 'Kuning'      THEN 2
  WHEN 'Hijau'       THEN 3
  WHEN 'Biru Muda'   THEN 4
  WHEN 'Biru Tua'    THEN 5
  WHEN 'Coklat Muda' THEN 6
  WHEN 'Coklat Tua'  THEN 7
  WHEN 'Hitam'       THEN 8
  ELSE 9
END;
