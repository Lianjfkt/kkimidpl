# Fitur CRUD Pendaftaran Siswa Baru (/owner/registrations)

## Ringkasan
Dokumen desain ini menjelaskan penambahan fitur CRUD (Create, Read, Update, Delete) lengkap pada modul Pendaftaran Siswa Baru di workspace Owner (`/owner/registrations`).

## Kebutuhan & Fitur
1. **Create (Tambah Pendaftaran Baru)**
   - Owner dapat menambahkan calon siswa secara manual melalui tombol `+ Tambah Pendaftaran`.
   - Mengisi data calon siswa dan data orang tua/wali.
2. **Read (Tampil Data Pendaftaran)**
   - Menampilkan daftar pendaftaran dengan filter status (Semua, Menunggu, Disetujui, Ditolak).
3. **Update (Edit Pendaftaran)**
   - Owner dapat memperbarui detail pendaftaran (misal memperbaiki ejaan nama, nomor telepon, tanggal lahir, sabuk, alamat, dll).
4. **Delete (Hapus Pendaftaran)**
   - Owner dapat menghapus data pendaftaran jika terjadi kesalahan input atau pembatalan.

## Detail Implementasi UI & Component

### 1. Reusable Modal Form (`M3Dialog`)
- Form dialog untuk Create & Edit data pendaftaran dengan field berikut:
  - **Nama Lengkap Siswa**: `full_name` (string, required)
  - **Tanggal Lahir**: `dob` (date, required)
  - **Tempat Lahir**: `birth_place` (string)
  - **NIK (KK)**: `nik` (string)
  - **Sabuk Saat Ini**: `current_belt` (select option: Putih, Kuning, Hijau, Biru Muda, Biru Tua, Coklat, Hitam)
  - **Berat & Tinggi**: `weight`, `height` (number)
  - **Nama Wali**: `parent_name` (string, required)
  - **No. HP Wali**: `parent_phone` (string, required)
  - **Pekerjaan Wali**: `parent_job` (string)
  - **Alamat**: `address` (string, required)
  - **Status Pendaftaran**: `status` ('menunggu' | 'disetujui' | 'ditolak')

### 2. Modal Konfirmasi Hapus (`M3Dialog`)
- Peringatan konfirmasi hapus data pendaftaran dengan pilihan "Batal" dan "Hapus".

### 3. Operasi Database Supabase (`registrations` table)
- `Create`: `supabase.from('registrations').insert([newData])`
- `Update`: `supabase.from('registrations').update(updatedData).eq('id', id)`
- `Delete`: `supabase.from('registrations').delete().eq('id', id)`

## Rencana Pengujian (Verification Plan)
- Memastikan tombol `+ Tambah Pendaftaran` dapat menambah data ke database Supabase dan memperbarui antarmuka secara instan.
- Memastikan tombol `Edit` membuka modal dengan data terisi dan perubahan berhasil tersimpan saat disubmit.
- Memastikan tombol `Hapus` memunculkan konfirmasi dan menghapus record yang bersangkutan.
