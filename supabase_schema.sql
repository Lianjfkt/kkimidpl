-- SQL Migration Schema for Dojo Karate KKI DPL
-- Copy and paste this script into your Supabase SQL Editor and click RUN.

-- 1. Create Profiles Table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('owner', 'pelatih', 'ortu')),
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;
create policy "Allow public read access to profiles" on public.profiles for select using (true);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Allow owners to do anything on profiles" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- 2. Create Students Table
create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  dob date not null,
  gender text not null,
  address text,
  parent_id uuid references public.profiles(id) on delete set null,
  phone text,
  photo_url text,
  join_date date default current_date,
  current_belt text not null default 'Putih',
  status text not null check (status in ('active', 'inactive', 'pending')) default 'pending',
  nik text,
  birth_place text,
  weight numeric,
  height numeric,
  parent_name text,
  parent_job text
);

-- Enable RLS on students
alter table public.students enable row level security;
create policy "Allow read access to students" on public.students for select using (true);
create policy "Allow profiles to modify students" on public.students for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'pelatih')) 
  or parent_id = auth.uid()
);

-- 3. Create Coaches Table
create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade unique,
  full_name text not null,
  phone text,
  belt_level text not null default 'Hitam Dan I',
  join_date date default current_date,
  honor_rate numeric not null default 50000
);

-- Enable RLS on coaches
alter table public.coaches enable row level security;
create policy "Allow read access to coaches" on public.coaches for select using (true);
create policy "Allow owner to manage coaches" on public.coaches for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- 4. Create Classes Table
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  time_start time not null,
  time_end time not null,
  coach_id uuid references public.coaches(id) on delete set null,
  category text not null check (category in ('anak', 'remaja', 'kompetisi'))
);

-- Enable RLS on classes
alter table public.classes enable row level security;
create policy "Allow read access to classes" on public.classes for select using (true);
create policy "Allow owner to manage classes" on public.classes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- 5. Create Class Students Join Table
create table public.class_students (
  class_id uuid references public.classes(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  primary key (class_id, student_id)
);

alter table public.class_students enable row level security;
create policy "Allow read access to class_students" on public.class_students for select using (true);
create policy "Allow managers to write class_students" on public.class_students for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'pelatih'))
);

-- 6. Create Student Attendance Table
create table public.attendance_students (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  session_date date not null default current_date,
  status text not null check (status in ('hadir', 'izin', 'sakit', 'alpha')),
  marked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.attendance_students enable row level security;
create policy "Allow read access to attendance_students" on public.attendance_students for select using (true);
create policy "Allow managers to write attendance_students" on public.attendance_students for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'pelatih'))
);

-- 7. Create Coach Attendance Table
create table public.attendance_coaches (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.coaches(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  session_date date not null default current_date,
  status text not null check (status in ('hadir', 'izin', 'sakit', 'alpha')),
  created_at timestamptz default now()
);

alter table public.attendance_coaches enable row level security;
create policy "Allow read access to attendance_coaches" on public.attendance_coaches for select using (true);
create policy "Allow owner to manage attendance_coaches" on public.attendance_coaches for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- 8. Create Fees Table
create table public.fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  period_month integer not null check (period_month between 1 and 12),
  period_year integer not null,
  amount numeric not null,
  status text not null check (status in ('lunas', 'belum_lunas', 'sebagian')) default 'belum_lunas',
  paid_date date,
  payment_method text check (payment_method in ('tunai', 'transfer', 'qris')),
  notes text
);

alter table public.fees enable row level security;
create policy "Allow read access to fees" on public.fees for select using (true);
create policy "Allow owners to manage fees" on public.fees for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- 9. Create Finance Transactions Table
create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('pemasukan', 'pengeluaran')),
  category text not null,
  amount numeric not null,
  transaction_date date not null default current_date,
  description text,
  created_by uuid references public.profiles(id) on delete set null
);

alter table public.finance_transactions enable row level security;
create policy "Allow read access to finance_transactions" on public.finance_transactions for select using (true);
create policy "Allow owners to manage finance_transactions" on public.finance_transactions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- 10. Create Belt Exams Table
create table public.belt_exams (
  id uuid primary key default gen_random_uuid(),
  exam_date date not null,
  location text not null,
  status text not null check (status in ('mendatang', 'selesai', 'dibatalkan')) default 'mendatang',
  examiner text,
  registration_fee numeric not null default 100000,
  created_at timestamptz default now()
);

alter table public.belt_exams enable row level security;
create policy "Allow read access to belt_exams" on public.belt_exams for select using (true);
create policy "Allow owner to manage belt_exams" on public.belt_exams for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- 11. Create Exam Participants Table
create table public.exam_participants (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.belt_exams(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  target_belt text not null,
  status text not null check (status in ('daftar', 'lulus', 'tidak_lulus', 'menunggu')) default 'daftar',
  grade text,
  notes text,
  updated_at timestamptz default now()
);

alter table public.exam_participants enable row level security;
create policy "Allow read access to exam_participants" on public.exam_participants for select using (true);
create policy "Allow managers to write exam_participants" on public.exam_participants for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'pelatih'))
);

-- 12. Create Tournaments Table
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  start_date date not null,
  end_date date not null,
  registration_fee numeric not null default 150000,
  status text not null check (status in ('aktif', 'selesai', 'dibatalkan')) default 'aktif',
  created_at timestamptz default now()
);

alter table public.tournaments enable row level security;
create policy "Allow read access to tournaments" on public.tournaments for select using (true);
create policy "Allow owner to manage tournaments" on public.tournaments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- 13. Create Tournament Participants Table
create table public.tournament_participants (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  category text not null,
  status text not null check (status in ('daftar', 'berangkat', 'selesai', 'batal')) default 'daftar',
  result text,
  notes text
);

alter table public.tournament_participants enable row level security;
create policy "Allow read access to tournament_participants" on public.tournament_participants for select using (true);
create policy "Allow managers to write tournament_participants" on public.tournament_participants for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'pelatih'))
);

-- 14. Create Registrations (Public Registrations) Table
create table public.registrations (
  id text primary key, -- Custom text key (e.g., reg-xxxxx)
  full_name text not null,
  dob date not null,
  birth_place text,
  nik text not null,
  current_belt text not null default 'Putih',
  weight numeric,
  height numeric,
  parent_name text not null,
  parent_phone text not null,
  parent_job text,
  address text,
  status text not null check (status in ('menunggu', 'disetujui', 'ditolak')) default 'menunggu',
  submitted_at timestamptz default now()
);

alter table public.registrations enable row level security;
create policy "Allow anyone to insert registrations" on public.registrations for insert with check (true);
create policy "Allow read access to registrations" on public.registrations for select using (true);
create policy "Allow owner to modify registrations" on public.registrations for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- 15. Create Notifications Table
create table public.notifications (
  id text primary key, -- Custom text key
  user_id text, -- Custom text or uuid
  title text not null,
  message text not null,
  type text not null default 'umum',
  is_read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;
create policy "Allow read access to notifications" on public.notifications for select using (true);
create policy "Allow read/write access to notifications" on public.notifications for all using (true);

-- 16. Create Curriculum Materials Table
create table public.curriculum_materials (
  id uuid primary key default gen_random_uuid(),
  belt_level text not null,
  title text not null,
  type text not null check (type in ('video', 'pdf', 'teks')),
  url text,
  description text,
  created_at timestamptz default now()
);

alter table public.curriculum_materials enable row level security;
create policy "Allow read access to curriculum_materials" on public.curriculum_materials for select using (true);
create policy "Allow owner to manage curriculum_materials" on public.curriculum_materials for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);


-- ==================== AUTH TRIGGERS ====================
-- Trigger to automatically create a public profile for a new auth user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, phone, avatar_url, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'ortu'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    '',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
