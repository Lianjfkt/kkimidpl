# Student Physical Intelligence & Fitness Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete physical capability and fitness tracking system for KKI Dojo Management, featuring 7 physical metrics + attendance discipline, pure responsive SVG 6-axis radar charts, automated scoring & smart drill recommendations, a coach fast-entry assistant with 30s audio timer & stopwatch, dojo leaderboards, and parent progress cards.

**Architecture:** A lightweight full-stack TypeScript + Supabase architecture. The database stores raw test records in `student_physical_tests` with strict RLS. A deterministic scoring engine `src/lib/physicalScoring.ts` converts raw scores into age & belt benchmarked dimensions, grades, exam readiness, and drill recommendations. High-performance, zero-external-dependency SVG components render the 6-axis radar and timeline charts. Clean UI pages empower coaches on mobile mats (`/pelatih/physical-tests`), enrich student profiles (`/owner/students/[id]`), and provide pride-inducing reports in the parent portal (`/ortu`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Web Audio API (for coach timer/buzzer), Supabase PostgreSQL.

## Global Constraints
- Strictly avoid heavy charting libraries (Recharts/Chart.js) to prevent peer-dependency conflicts with React 19 and unnecessary bundle size. Use Pure SVG components.
- Do not modify next.js agent rules in AGENTS.md.
- Maintain existing neumorphic dark/accent theme (`var(--neu-surface)`, `var(--neu-border)`, `var(--md-sys-color-primary)`).
- Ensure audio alerts gracefully degrade if browser autoplay is blocked (using Web Audio API AudioContext with resume on user gesture).

---

### Task 1: Supabase Database Migration & TypeScript Models

**Files:**
- Create: `supabase_migration_physical_tests.sql`
- Modify: `src/lib/mockData.ts:50-70`

**Interfaces:**
- Produces:
  ```typescript
  export interface StudentPhysicalTest {
    id: string;
    student_id: string;
    tester_id?: string;
    test_date: string;
    push_up_30s: number;
    sit_up_30s: number;
    punches_30s: number;
    kicks_30s: number;
    skipping_sec: number;
    split_front_cm: number;
    split_side_cm: number;
    total_score: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    notes?: string;
    created_at?: string;
    updated_at?: string;
  }
  ```

- [ ] **Step 1: Create SQL Migration File**

Write `supabase_migration_physical_tests.sql`:
```sql
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
```

- [ ] **Step 2: Update TypeScript Models in `src/lib/mockData.ts`**

Export `StudentPhysicalTest` interface in `src/lib/mockData.ts`.

- [ ] **Step 3: Verification**

Run `npx tsx -e "import { StudentPhysicalTest } from './src/lib/mockData'; console.log('Type check OK');"` to confirm export.

- [ ] **Step 4: Commit**

```bash
git add supabase_migration_physical_tests.sql src/lib/mockData.ts
git commit -m "feat(physical): add database migration and typescript models"
```

---

### Task 2: Scoring Engine & Smart Recommendation Module with TDD

**Files:**
- Create: `src/lib/physicalScoring.ts`
- Create: `scripts/test_physical_scoring.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface PhysicalRadarDimension {
    key: string;
    label: string;
    score: number;      // 0 - 100
    target: number;     // 0 - 100 based on belt & age
    unit: string;
    rawValue: number | string;
  }

  export interface PhysicalAssessmentResult {
    totalScore: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    radarDimensions: PhysicalRadarDimension[];
    examReadiness: {
      isEligible: boolean;
      statusText: string;
      statusColor: 'emerald' | 'amber' | 'red';
      reason: string;
    };
    recommendations: string[];
    ageCategory: 'anak' | 'remaja' | 'dewasa';
  }

  export function calculatePhysicalAssessment(
    metrics: {
      push_up_30s: number;
      sit_up_30s: number;
      punches_30s: number;
      kicks_30s: number;
      skipping_sec: number;
      split_front_cm: number;
      split_side_cm: number;
    },
    attendanceRate: number, // 0 - 100
    dob?: string,
    currentBelt?: string
  ): PhysicalAssessmentResult;
  ```

- [ ] **Step 1: Write Test Script `scripts/test_physical_scoring.ts`**

```typescript
import assert from 'node:assert';
import { calculatePhysicalAssessment } from '../src/lib/physicalScoring';

console.log('Testing calculatePhysicalAssessment...');

// 1. Test Split Inversion: 0cm should produce 100, 20cm should produce 50, >=40cm should produce 0
const perfectAthlete = calculatePhysicalAssessment(
  {
    push_up_30s: 35,
    sit_up_30s: 35,
    punches_30s: 80,
    kicks_30s: 60,
    skipping_sec: 240,
    split_front_cm: 0,
    split_side_cm: 0,
  },
  90,
  '2010-01-01',
  'Putih'
);

assert.strictEqual(perfectAthlete.grade, 'S');
assert.strictEqual(perfectAthlete.examReadiness.isEligible, true);
assert(perfectAthlete.totalScore >= 90);

// 2. Test Low Attendance Gate
const lowAttendanceAthlete = calculatePhysicalAssessment(
  {
    push_up_30s: 35,
    sit_up_30s: 35,
    punches_30s: 80,
    kicks_30s: 60,
    skipping_sec: 240,
    split_front_cm: 0,
    split_side_cm: 0,
  },
  60, // Under 75%
  '2010-01-01',
  'Putih'
);

assert.strictEqual(lowAttendanceAthlete.examReadiness.isEligible, false);
assert(lowAttendanceAthlete.examReadiness.reason.includes('Kehadiran'));

// 3. Test Inflexible Athlete Recommendations
const tightLegsAthlete = calculatePhysicalAssessment(
  {
    push_up_30s: 25,
    sit_up_30s: 25,
    punches_30s: 50,
    kicks_30s: 40,
    skipping_sec: 120,
    split_front_cm: 25,
    split_side_cm: 28,
  },
  85,
  '2012-05-15',
  'Kuning'
);

assert(tightLegsAthlete.recommendations.some(r => r.toLowerCase().includes('peregangan') || r.toLowerCase().includes('split')));

console.log('✅ All physical scoring tests passed successfully!');
```

- [ ] **Step 2: Run Test Script to Confirm Failure**

Run: `npx tsx scripts/test_physical_scoring.ts`  
Expected: Error: Cannot find module `../src/lib/physicalScoring`.

- [ ] **Step 3: Implement `src/lib/physicalScoring.ts`**

Implement `calculatePhysicalAssessment`, age categorizer, inverted split calculation, benchmark targets, and drill recommendation logic.

- [ ] **Step 4: Run Test Script to Confirm Pass**

Run: `npx tsx scripts/test_physical_scoring.ts`  
Expected: `✅ All physical scoring tests passed successfully!`

- [ ] **Step 5: Commit**

```bash
git add src/lib/physicalScoring.ts scripts/test_physical_scoring.ts
git commit -m "feat(physical): add scoring engine and smart recommendation generator"
```

---

### Task 3: Pure Responsive SVG Hexagon Radar & Progress Timeline Components

**Files:**
- Create: `src/components/PhysicalRadarChart.tsx`
- Create: `src/components/PhysicalProgressChart.tsx`

**Interfaces:**
- Consumes: `PhysicalRadarDimension` from `src/lib/physicalScoring.ts`
- Produces:
  - `<PhysicalRadarChart dimensions={dimensions} size={300} showTarget={true} />`
  - `<PhysicalProgressChart records={testHistory} />`

- [ ] **Step 1: Implement `PhysicalRadarChart.tsx`**

Create SVG radar chart with 6 axes (60-degree increments), rendering:
- Concentric polygon background webs (20%, 40%, 60%, 80%, 100%).
- Dotted target belt polygon (contrast blue/gray line).
- Filled glowing accent polygon for student performance (`rgba(239, 68, 68, 0.4)` fill and red stroke).
- Responsive labels and values on vertices.

- [ ] **Step 2: Implement `PhysicalProgressChart.tsx`**

Create lightweight SVG line chart showing:
- X-axis test dates.
- Y-axis total scores (0 - 100).
- Smooth line path with circular data points showing scores on hover/touch.

- [ ] **Step 3: Verification**

Create a quick render verification script or run type check:
`npx tsc --noEmit`
Expected: 0 type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PhysicalRadarChart.tsx src/components/PhysicalProgressChart.tsx
git commit -m "feat(physical): add pure responsive SVG radar and progress chart components"
```

---

### Task 4: Coach Physical Test Screen with Audio Timer, Stopwatch & Leaderboard

**Files:**
- Create: `src/app/pelatih/physical-tests/page.tsx`
- Modify: `src/components/Navigation.tsx` (add "Tes Fisik" link to coach menu)
- Modify: `src/app/pelatih/page.tsx` (add quick action card to Physical Tests)

**Features:**
1. **Interactive 30s Audio Timer:**
   - Web Audio API synthesizer generating 3 countdown beeps (`880Hz`, 100ms) and final whistle/buzzer (`1760Hz`, 500ms).
   - Big Tap Counter (+1) button for easy tallying on touchscreen.
2. **Stopwatch Skipping:**
   - Start / Pause / Reset with automatic time injection into `skipping_sec`.
3. **Fast Student Entry:**
   - Student selector with search by name.
   - 7 input fields.
   - Real-time preview of Radar Chart and Total Score.
   - Save to Supabase `student_physical_tests`.
4. **Dojo Leaderboard:**
   - Tabs: All, Iron Core (Sit Up), Speed Striker (Punches + Kicks), Skipping King (Duration), Rubber Master (Split).

- [ ] **Step 1: Update `Navigation.tsx`**

Add `{ label: 'Tes Fisik', href: '/pelatih/physical-tests', icon: '...' }` to the `pelatih` navigation items.

- [ ] **Step 2: Implement `src/app/pelatih/physical-tests/page.tsx`**

Build the complete mobile-friendly coach mat interface with audio synth, tap counter, stopwatch, live preview, submission form, and leaderboard.

- [ ] **Step 3: Update `src/app/pelatih/page.tsx`**

Add a shortcut card "Tes & Uji Fisik Siswa" in the coach dashboard pointing to `/pelatih/physical-tests`.

- [ ] **Step 4: Verification**

Run `npx tsc --noEmit` to ensure proper typing across the coach screen and navigation.

- [ ] **Step 5: Commit**

```bash
git add src/app/pelatih/physical-tests/page.tsx src/components/Navigation.tsx src/app/pelatih/page.tsx
git commit -m "feat(physical): add coach physical test page with audio timer and leaderboard"
```

---

### Task 5: Student Profile Physical Tab (`/owner/students/[id]`) & Belt Exam Eligibility

**Files:**
- Modify: `src/app/owner/students/[id]/page.tsx`

**Features:**
1. Add "Kemampuan Fisik" tab / section in the student detail page.
2. Fetch `student_physical_tests` for this student.
3. Compute `calculatePhysicalAssessment` incorporating current attendance record.
4. Render:
   - Hexagon Radar Chart with next belt target comparison.
   - Dual-Gate Exam Readiness badge (Physical + Attendance).
   - Timeline progress line chart.
   - Historical test log table.
   - Smart drill recommendation cards.

- [ ] **Step 1: Modify `src/app/owner/students/[id]/page.tsx`**

Add physical test query to the parallel `Promise.all` data loader.
Render the Physical Assessment section alongside Belt Journey and Attendance.

- [ ] **Step 2: Verification**

Run `npx tsc --noEmit` to verify type safety and build validity.

- [ ] **Step 3: Commit**

```bash
git add src/app/owner/students/[id]/page.tsx
git commit -m "feat(physical): integrate physical analytics and exam readiness on student detail page"
```

---

### Task 6: Parent Portal Fitness Report Card & Print-Friendly View (`/ortu`)

**Files:**
- Modify: `src/app/ortu/page.tsx`

**Features:**
1. Fetch latest `student_physical_tests` for each child.
2. Display "Rapor Kebugaran & Fisik Ananda":
   - Overall grade badge & total score.
   - 6-axis radar chart.
   - Parent support tips for home practice based on recommendations.
   - Print-friendly button for physical report card.

- [ ] **Step 1: Modify `src/app/ortu/page.tsx`**

Integrate physical assessment cards for each of the parent's enrolled children.

- [ ] **Step 2: Verification**

Run `npx tsc --noEmit` and `npm run build` to ensure the complete application builds without errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/ortu/page.tsx
git commit -m "feat(physical): add student physical progress report in parent portal"
```
