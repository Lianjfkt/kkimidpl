# Desain Fitur: Kelola Siswa per Sesi Kelas (Owner)

## Ringkasan
Menambahkan kemampuan bagi Owner dojo untuk mengelola (melihat, menambah, dan mengeluarkan/menghapus) siswa yang terdaftar di masing-masing sesi kelas latihan secara langsung melalui modal interaktif di halaman [src/app/owner/classes/page.tsx](file:///media/lian/Ubuntu/Dojo%20Managemen/src/app/owner/classes/page.tsx).

## Komponen & Tampilan UI
1. **Kartu Sesi Kelas**:
   - Menampilkan counter jumlah siswa aktif terdaftar di kelas (contoh: `👥 8 Siswa`).
   - Menambahkan tombol aksi **"👥 Kelola Siswa"** di footer kartu kelas.
2. **Modal / Dialog "Kelola Siswa Kelas"**:
   - Header: Nama Sesi, Pelatih, Jadwal & Kategori.
   - Form Tambah Cepat: Dropdown / Autocomplete siswa dojo (hanya menampilkan siswa yang belum terdaftar di kelas ini) + tombol **"+ Tambah ke Kelas"**.
   - Input Pencarian: Filter cepat nama/sabuk siswa dalam kelas.
   - Tabel / Daftar Siswa:
     - Avatar/Foto profil siswa + Inisial
     - Nama Lengkap & No. HP / Kontak Ortu (Link WA)
     - Badge Sabuk (styling dojo KKI)
     - Tombol Aksi: **"Keluarkan"** (icon tong sampah / remove) dengan dialog konfirmasi.
   - Indikator Loading & State Kosong (Empty State).

## Skema Data & Operasi
- Memanfaatkan tabel relasi `class_students(class_id, student_id)`.
- Mengambil relasi `students` yang terdaftar di kelas: `supabase.from('class_students').select('student_id, students(*)').eq('class_id', selectedClassId)`.
- Menambah siswa: `supabase.from('class_students').insert({ class_id, student_id })`.
- Menghapus siswa: `supabase.from('class_students').delete().eq('class_id', classId).eq('student_id', studentId)`.
