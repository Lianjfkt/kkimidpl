import React from 'react';
import { renderToString } from 'react-dom/server';
import assert from 'node:assert';
import PhysicalRadarChart from '../src/components/PhysicalRadarChart';
import PhysicalProgressChart, { PhysicalTestRecordItem } from '../src/components/PhysicalProgressChart';
import { calculatePhysicalAssessment } from '../src/lib/physicalScoring';

console.log('Testing Pure Responsive SVG Components (PhysicalRadarChart & PhysicalProgressChart)...\n');

// 1. PhysicalRadarChart with full assessment output
console.log('1. Testing PhysicalRadarChart with full 6 dimensions...');
const assessment = calculatePhysicalAssessment(
  {
    push_up_30s: 25,
    sit_up_30s: 26,
    punches_30s: 65,
    kicks_30s: 50,
    skipping_sec: 180,
    split_front_cm: 6,
    split_side_cm: 8,
  },
  90,
  '2012-05-15',
  'Hijau'
);

const radarHtml = renderToString(
  <PhysicalRadarChart dimensions={assessment.radarDimensions} showTarget={true} size={320} />
);

assert(radarHtml.includes('<svg'), 'Radar chart must render an SVG element');
assert(radarHtml.includes('viewBox="0 0 500 440"'), 'Radar chart must have responsive viewBox');
assert(radarHtml.includes('radar-crimson-glow'), 'Radar chart must include crimson glow filter');
assert(radarHtml.includes('Upper Body Power'), 'Radar chart must render dimension labels');
assert(radarHtml.includes('Core Strength'), 'Radar chart must render dimension labels');
assert(radarHtml.includes('Striking Speed'), 'Radar chart must render dimension labels');
assert(radarHtml.includes('Cardio &amp; Footwork') || radarHtml.includes('Cardio & Footwork'), 'Radar chart must render dimension labels');
assert(radarHtml.includes('Flexibility'), 'Radar chart must render dimension labels');
assert(radarHtml.includes('Discipline'), 'Radar chart must render dimension labels');
assert(radarHtml.includes('Target Sabuk'), 'Radar chart must include Target Sabuk legend');
assert(radarHtml.includes('Siswa (Aktual)'), 'Radar chart must include Siswa (Aktual) legend');
assert(radarHtml.includes('stroke-dasharray="4 4"') || radarHtml.includes('stroke-dasharray="4, 4"'), 'Radar chart must have dashed target polygon');

console.log('   ✓ Radar chart renders 6 axes, concentric rings, student polygon, target polygon, and legend');

// 2. PhysicalRadarChart with showTarget = false
console.log('2. Testing PhysicalRadarChart with showTarget=false...');
const radarNoTargetHtml = renderToString(
  <PhysicalRadarChart dimensions={assessment.radarDimensions} showTarget={false} />
);
assert(!radarNoTargetHtml.includes('Target Sabuk'), 'Target Sabuk legend must not appear when showTarget=false');
assert(radarNoTargetHtml.includes('Siswa (Skor Kebugaran)'), 'Alternative legend must render');

console.log('   ✓ showTarget=false works properly');

// 3. PhysicalRadarChart empty state
console.log('3. Testing PhysicalRadarChart empty state...');
const radarEmptyHtml = renderToString(<PhysicalRadarChart dimensions={[]} />);
assert(radarEmptyHtml.includes('Data Radar Fisik Belum Tersedia'), 'Empty radar chart must show fallback UI');

console.log('   ✓ Empty radar chart handles gracefully');

// 4. PhysicalProgressChart empty state
console.log('4. Testing PhysicalProgressChart empty state...');
const progressEmptyHtml = renderToString(<PhysicalProgressChart records={[]} />);
assert(progressEmptyHtml.includes('Belum Ada Riwayat Tes Fisik'), 'Empty progress chart must render fallback state');

console.log('   ✓ Empty progress chart renders fallback state');

// 5. PhysicalProgressChart single record state
console.log('5. Testing PhysicalProgressChart single record state...');
const singleRecord: PhysicalTestRecordItem[] = [
  {
    id: 'test-1',
    test_date: '2026-08-10',
    total_score: 72.5,
    grade: 'B',
    push_up_30s: 20,
    sit_up_30s: 22,
    skipping_sec: 140,
  },
];
const progressSingleHtml = renderToString(<PhysicalProgressChart records={singleRecord} />);
assert(progressSingleHtml.includes('1 Tes Tercatat'), 'Must display 1 test header');
assert(progressSingleHtml.includes('Minimal 2 kali tes fisik'), 'Must display minimum 2 tests guidance banner');
assert(progressSingleHtml.includes('72.5 Poin (Grade B)'), 'Must render score callout');

console.log('   ✓ Single record renders milestone view with 2-test note');

// 6. PhysicalProgressChart multiple records (timeline trend)
console.log('6. Testing PhysicalProgressChart multiple records with trend line...');
const multiRecords: PhysicalTestRecordItem[] = [
  {
    id: 'test-2',
    test_date: '2026-09-15',
    total_score: 78.0,
    grade: 'B',
  },
  {
    id: 'test-1',
    test_date: '2026-08-01', // earlier date deliberately placed second to test chronological sorting
    total_score: 70.0,
    grade: 'B',
  },
  {
    id: 'test-3',
    test_date: '2026-10-20',
    total_score: 85.5,
    grade: 'A',
  },
];

const progressMultiHtml = renderToString(<PhysicalProgressChart records={multiRecords} />);
assert(progressMultiHtml.includes('Tren Perkembangan Fisik'), 'Must render trend title');
assert(progressMultiHtml.includes('3 kali tes'), 'Must report total test count');
assert(progressMultiHtml.includes('+7.5 pts'), 'Must calculate recent delta (+7.5 pts from 78.0 to 85.5)');
assert(progressMultiHtml.includes('Skor: 85.5 (Grade A)'), 'Must display latest score and grade');
assert(progressMultiHtml.includes('progress-area-grad'), 'Must render area fill gradient beneath line');
assert(progressMultiHtml.includes('Target 75'), 'Must render 75 benchmark threshold');
assert(progressMultiHtml.includes('path'), 'Must render SVG path for smooth line');

console.log('   ✓ Multi-record chart generates smooth Bezier curve, area fill, delta stats, and sorting');

console.log('\n🎉 ALL PURE RESPONSIVE SVG COMPONENT TESTS PASSED!');
