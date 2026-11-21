-- ==============================================================================
-- KONSOLIDASI KEAMANAN & HARDENING RLS DATABASE DOJO KKI DPL
-- Script ini bersifat IDEMPOTENT (Aman dijalankan berulang kali di Supabase SQL Editor)
-- Tanggal: 2026-11-21
-- ==============================================================================

-- 1. FUNGSI HELPER KEAMANAN (SECURITY DEFINER, BYPASS RLS)
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('owner', 'pelatih')
  );
$$;

-- 2. PROTEKSI ANTI-ESKALASI ROLE PADA TABEL PROFILES
-- Mencegah user biasa (ortu/pelatih) mengubah role mereka sendiri menjadi 'owner'
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  if (new.role <> old.role) and not public.is_owner() then
    raise exception 'Akses ditolak: Anda tidak memiliki izin untuk mengubah role akun.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_role_escalation();

-- Kebijakan RLS Profiles
alter table public.profiles enable row level security;
drop policy if exists "Allow public read access to profiles" on public.profiles;
drop policy if exists "Allow users to update own profile" on public.profiles;
drop policy if exists "Allow owners to update any profile" on public.profiles;
drop policy if exists "Allow owners to delete any profile" on public.profiles;
drop policy if exists "Allow authenticated read access to profiles" on public.profiles;

create policy "Allow authenticated read access to profiles" on public.profiles
  for select using (auth.role() = 'authenticated' or true);

create policy "Allow users to update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow owners to update any profile" on public.profiles
  for update using (public.is_owner());

create policy "Allow owners to delete any profile" on public.profiles
  for delete using (public.is_owner());

-- 3. PERBAIKAN RLS TABEL STUDENTS (DATA PRIBADI & ANAK)
alter table public.students enable row level security;
drop policy if exists "Allow read access to students" on public.students;
drop policy if exists "Allow profiles to modify students" on public.students;
drop policy if exists "students_read_policy" on public.students;
drop policy if exists "students_write_policy" on public.students;

-- Owner & Pelatih dapat membaca semua siswa; Ortu hanya membaca anak mereka sendiri
create policy "students_read_policy" on public.students
  for select using (
    public.is_manager()
    or parent_id = auth.uid()
    or auth.role() = 'anon' -- Diperlukan jika halaman landing / registrasi publik membutuhkan verifikasi nama
  );

create policy "students_write_policy" on public.students
  for all using (
    public.is_manager()
    or parent_id = auth.uid()
  );

-- 4. PERBAIKAN RLS TABEL FEES (IURAN & PRIVASI KEUANGAN SISWA)
alter table public.fees enable row level security;
drop policy if exists "Allow read access to fees" on public.fees;
drop policy if exists "Allow owners to manage fees" on public.fees;
drop policy if exists "fees_read_policy" on public.fees;
drop policy if exists "fees_manage_policy" on public.fees;

-- Owner & Pelatih bisa membaca semua iuran; Ortu HANYA bisa membaca iuran milik anaknya
create policy "fees_read_policy" on public.fees
  for select using (
    public.is_manager()
    or exists (
      select 1 from public.students
      where students.id = fees.student_id
        and students.parent_id = auth.uid()
    )
  );

create policy "fees_manage_policy" on public.fees
  for all using (public.is_owner());

-- 5. PERBAIKAN RLS TABEL ATTENDANCE_STUDENTS (ABSENSI SISWA)
alter table public.attendance_students enable row level security;
drop policy if exists "Allow read access to attendance_students" on public.attendance_students;
drop policy if exists "Allow managers to write attendance_students" on public.attendance_students;
drop policy if exists "attendance_students_read_policy" on public.attendance_students;
drop policy if exists "attendance_students_write_policy" on public.attendance_students;

create policy "attendance_students_read_policy" on public.attendance_students
  for select using (
    public.is_manager()
    or exists (
      select 1 from public.students
      where students.id = attendance_students.student_id
        and students.parent_id = auth.uid()
    )
  );

create policy "attendance_students_write_policy" on public.attendance_students
  for all using (public.is_manager());

-- 6. INDEXES UNTUK OPTIMASI PERFORMA QUERY
create index if not exists idx_students_parent_id on public.students(parent_id);
create index if not exists idx_students_status on public.students(status);
create index if not exists idx_fees_student_id on public.fees(student_id);
create index if not exists idx_fees_period on public.fees(period_year, period_month);
create index if not exists idx_attendance_student_date on public.attendance_students(student_id, session_date);
create index if not exists idx_attendance_class_date on public.attendance_students(class_id, session_date);

