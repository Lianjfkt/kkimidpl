-- 1. Create Physical Tests Table
create table if not exists public.student_physical_tests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade not null,
  tester_id uuid references public.profiles(id) on delete set null,
  test_date date not null default current_date,
  
  -- 7 Indikator Fisik
  push_up_30s integer not null default 0,
  sit_up_30s integer not null default 0,
  punches_30s integer not null default 0,
  kicks_30s integer not null default 0,
  skipping_sec integer not null default 0,
  split_front_cm numeric(5,1) not null default 0,
  split_side_cm numeric(5,1) not null default 0,
  
  -- Nilai Hasil Kalkulasi
  total_score numeric(5,1) not null default 0,
  grade text not null default 'C',
  notes text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Indexes for Performance
create index if not exists idx_physical_tests_student on public.student_physical_tests(student_id);
create index if not exists idx_physical_tests_date on public.student_physical_tests(test_date desc);

-- 3. Row Level Security (RLS)
alter table public.student_physical_tests enable row level security;

-- Read policy: Coach & Owner can read all; Parent can read only their children's tests
drop policy if exists "Allow read access to physical tests" on public.student_physical_tests;
create policy "Allow read access to physical tests" on public.student_physical_tests
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('owner', 'pelatih')
    )
    or exists (
      select 1 from public.students
      where students.id = student_physical_tests.student_id
        and students.parent_id = auth.uid()
    )
  );

-- Write policy: Coach & Owner can insert/update/delete
drop policy if exists "Allow coach and owner to manage physical tests" on public.student_physical_tests;
create policy "Allow coach and owner to manage physical tests" on public.student_physical_tests
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('owner', 'pelatih')
    )
  );
