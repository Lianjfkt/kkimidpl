import assert from 'node:assert';
import { 
  calculatePhysicalAssessment, 
  getAgeCategory, 
  calculateSplitScore,
  getBeltTargetScore,
  getGrade 
} from '../src/lib/physicalScoring';

console.log('Testing calculatePhysicalAssessment & helper functions...\n');

// --- Helper unit tests ---
console.log('1. Testing getAgeCategory...');
// System year is 2026.
// Anak: < 12 (born 2015 -> 11 yo)
assert.strictEqual(getAgeCategory('2015-05-10'), 'anak');
// Remaja: 12-16 (born 2012 -> 14 yo, born 2010 -> 16 yo)
assert.strictEqual(getAgeCategory('2012-05-15'), 'remaja');
assert.strictEqual(getAgeCategory('2010-01-01'), 'remaja');
// Dewasa: > 16 (born 2005 -> 21 yo)
assert.strictEqual(getAgeCategory('2005-01-01'), 'dewasa');
// Default fallback
assert.strictEqual(getAgeCategory(undefined), 'remaja');

console.log('2. Testing calculateSplitScore (Inverted Split: 100 - (cm * 2.5))...');
assert.strictEqual(calculateSplitScore(0), 100);
assert.strictEqual(calculateSplitScore(10), 75);
assert.strictEqual(calculateSplitScore(20), 50);
assert.strictEqual(calculateSplitScore(40), 0);
assert.strictEqual(calculateSplitScore(50), 0); // clamped to 0
assert.strictEqual(calculateSplitScore(-5), 100); // clamped to 100

console.log('3. Testing getBeltTargetScore across belts and age categories...');
assert.strictEqual(getBeltTargetScore('Putih', 'anak'), 55);
assert.strictEqual(getBeltTargetScore('Putih', 'remaja'), 60);
assert.strictEqual(getBeltTargetScore('Putih', 'dewasa'), 62);
assert.strictEqual(getBeltTargetScore('Kuning', 'remaja'), 65);
assert.strictEqual(getBeltTargetScore('Hijau', 'remaja'), 70);
assert.strictEqual(getBeltTargetScore('Biru Muda', 'remaja'), 70);
assert.strictEqual(getBeltTargetScore('Biru Tua', 'remaja'), 75);
assert.strictEqual(getBeltTargetScore('Coklat Muda', 'remaja'), 80);
assert.strictEqual(getBeltTargetScore('Coklat Tua', 'remaja'), 82);
assert.strictEqual(getBeltTargetScore('Hitam', 'remaja'), 85);
assert.strictEqual(getBeltTargetScore(undefined, 'remaja'), 60);

console.log('4. Testing getGrade thresholds...');
assert.strictEqual(getGrade(95), 'S');
assert.strictEqual(getGrade(90), 'S');
assert.strictEqual(getGrade(89.9), 'A');
assert.strictEqual(getGrade(80), 'A');
assert.strictEqual(getGrade(79.9), 'B');
assert.strictEqual(getGrade(70), 'B');
assert.strictEqual(getGrade(69.9), 'C');
assert.strictEqual(getGrade(60), 'C');
assert.strictEqual(getGrade(59.9), 'D');
assert.strictEqual(getGrade(0), 'D');

// --- Integration tests for calculatePhysicalAssessment ---
console.log('5. Testing Perfect Athlete (Grade S & Exam Eligible)...');
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
assert.strictEqual(perfectAthlete.examReadiness.statusColor, 'emerald');
assert(perfectAthlete.totalScore >= 90);
assert.strictEqual(perfectAthlete.radarDimensions.length, 6);
assert.strictEqual(perfectAthlete.recommendations.length, 1);
assert(perfectAthlete.recommendations[0].includes('prima'));

console.log('6. Testing Low Attendance Gate (< 75%)...');
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
assert.strictEqual(lowAttendanceAthlete.examReadiness.statusColor, 'amber');
assert(lowAttendanceAthlete.examReadiness.reason.includes('Kehadiran'));

console.log('7. Testing Inflexible Athlete Recommendations...');
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

console.log('8. Testing Low Physical Score (Grade D / Below Target)...');
const lowScoreAthlete = calculatePhysicalAssessment(
  {
    push_up_30s: 5,
    sit_up_30s: 5,
    punches_30s: 15,
    kicks_30s: 10,
    skipping_sec: 20,
    split_front_cm: 35,
    split_side_cm: 38,
  },
  80,
  '2008-01-01',
  'Hijau'
);

assert.strictEqual(lowScoreAthlete.examReadiness.isEligible, false);
assert(lowScoreAthlete.totalScore < 60);
assert.strictEqual(lowScoreAthlete.grade, 'D');
assert(lowScoreAthlete.examReadiness.reason.toLowerCase().includes('skor fisik'));

console.log('9. Testing Low Physical Score AND Low Attendance...');
const doubleDeficitAthlete = calculatePhysicalAssessment(
  {
    push_up_30s: 5,
    sit_up_30s: 5,
    punches_30s: 15,
    kicks_30s: 10,
    skipping_sec: 20,
    split_front_cm: 35,
    split_side_cm: 38,
  },
  50,
  '2008-01-01',
  'Hijau'
);

assert.strictEqual(doubleDeficitAthlete.examReadiness.isEligible, false);
assert.strictEqual(doubleDeficitAthlete.examReadiness.statusColor, 'red');
assert(doubleDeficitAthlete.examReadiness.reason.includes('Kehadiran'));

console.log('10. Testing Child Category (< 12yo) Benchmarks...');
const childAthlete = calculatePhysicalAssessment(
  {
    push_up_30s: 20,
    sit_up_30s: 20,
    punches_30s: 50,
    kicks_30s: 38,
    skipping_sec: 110,
    split_front_cm: 5,
    split_side_cm: 5,
  },
  85,
  '2016-03-20',
  'Kuning'
);

assert.strictEqual(childAthlete.ageCategory, 'anak');
assert(childAthlete.totalScore >= 80);
assert.strictEqual(childAthlete.examReadiness.isEligible, true);

console.log('\n✅ All physical scoring tests passed successfully!');
