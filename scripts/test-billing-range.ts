import assert from 'node:assert';
import {
  getMonthsInRange,
  getDateRangeBounds,
  calculateStudentAttendanceStats,
  calculateStudentRangeBilling,
  generateWhatsAppMessage,
  generateIntegratedBillingCsv,
} from '../src/lib/billingUtils.ts';

console.log('Testing billing range and recap utilities...\n');

// Test 1: getMonthsInRange
console.log('Test 1: getMonthsInRange');
const singleMonth = getMonthsInRange(3, 2026, 3, 2026);
assert.strictEqual(singleMonth.length, 1);
assert.deepStrictEqual(singleMonth[0], { month: 3, year: 2026 });

const threeMonths = getMonthsInRange(1, 2026, 3, 2026);
assert.strictEqual(threeMonths.length, 3);
assert.deepStrictEqual(threeMonths, [
  { month: 1, year: 2026 },
  { month: 2, year: 2026 },
  { month: 3, year: 2026 },
]);

const crossYear = getMonthsInRange(11, 2025, 2, 2026);
assert.strictEqual(crossYear.length, 4);
assert.deepStrictEqual(crossYear, [
  { month: 11, year: 2025 },
  { month: 12, year: 2025 },
  { month: 1, year: 2026 },
  { month: 2, year: 2026 },
]);
console.log('✓ Test 1 passed\n');

// Test 2: getDateRangeBounds
console.log('Test 2: getDateRangeBounds');
const bounds = getDateRangeBounds(1, 2026, 3, 2026);
assert.strictEqual(bounds.startDate, '2026-01-01');
assert.strictEqual(bounds.endDate, '2026-03-31');

const febBounds = getDateRangeBounds(2, 2024, 2, 2024); // leap year
assert.strictEqual(febBounds.startDate, '2024-02-01');
assert.strictEqual(febBounds.endDate, '2024-02-29');
console.log('✓ Test 2 passed\n');

// Test 3: calculateStudentAttendanceStats
console.log('Test 3: calculateStudentAttendanceStats');
const mockAttendance = [
  { id: '1', student_id: 's1', session_date: '2026-01-05', status: 'hadir' },
  { id: '2', student_id: 's1', session_date: '2026-01-12', status: 'hadir' },
  { id: '3', student_id: 's1', session_date: '2026-01-19', status: 'izin' },
  { id: '4', student_id: 's1', session_date: '2026-02-02', status: 'sakit' },
  { id: '5', student_id: 's1', session_date: '2026-02-09', status: 'alpha' },
  { id: '6', student_id: 's1', session_date: '2026-04-01', status: 'hadir' }, // outside range
  { id: '7', student_id: 's2', session_date: '2026-01-05', status: 'hadir' }, // another student
];

const stats = calculateStudentAttendanceStats('s1', mockAttendance, '2026-01-01', '2026-03-31');
assert.strictEqual(stats.totalSessions, 5);
assert.strictEqual(stats.hadir, 2);
assert.strictEqual(stats.izin, 1);
assert.strictEqual(stats.sakit, 1);
assert.strictEqual(stats.alpha, 1);
assert.strictEqual(stats.attendancePct, 40); // 2/5 * 100 = 40%
console.log('✓ Test 3 passed\n');

// Test 4: calculateStudentRangeBilling
console.log('Test 4: calculateStudentRangeBilling');
const mockFees = [
  { id: 'f1', student_id: 's1', period_month: 1, period_year: 2026, amount: 20000, status: 'lunas' },
  { id: 'f2', student_id: 's1', period_month: 2, period_year: 2026, amount: 25000, status: 'belum_lunas' },
  // Month 3 has no fee row (unbilled)
];

const billing = calculateStudentRangeBilling('s1', mockFees, [
  { month: 1, year: 2026 },
  { month: 2, year: 2026 },
  { month: 3, year: 2026 },
], 20000);

assert.strictEqual(billing.isRangeFullyPaid, false);
assert.strictEqual(billing.unpaidCount, 2);
assert.strictEqual(billing.totalUnpaidAmount, 45000); // 25000 + 20000 default
assert.deepStrictEqual(billing.unpaidMonthDetails, ['Februari 2026', 'Maret 2026']);
console.log('✓ Test 4 passed\n');

// Test 5: generateWhatsAppMessage with attendance & range
console.log('Test 5: generateWhatsAppMessage');
const waMsg = generateWhatsAppMessage({
  studentName: 'Kenji Sato',
  parentName: 'Budi Santoso',
  belt: 'Kuning',
  startMonthName: 'Januari',
  startYear: 2026,
  endMonthName: 'Maret',
  endYear: 2026,
  attendanceStats: stats,
  unpaidMonthsCount: billing.unpaidCount,
  totalArrearsAmount: billing.totalUnpaidAmount,
  unpaidMonthDetails: billing.unpaidMonthDetails,
  isRangeFullyPaid: false,
});

assert(waMsg.includes('Kenji Sato'), 'Should mention student name');
assert(waMsg.includes('Budi Santoso'), 'Should mention parent name');
assert(waMsg.includes('Januari 2026 - Maret 2026'), 'Should mention range');
assert(waMsg.includes('5 sesi latihan'), 'Should mention total sessions');
assert(waMsg.includes('Hadir: 2 kali (40%)'), 'Should mention attendance details');
assert(waMsg.includes('Februari 2026, Maret 2026'), 'Should mention unpaid months');
assert(waMsg.includes('45.000'), 'Should mention unpaid total nominal');
assert(waMsg.includes('Bank JAGO'), 'Should mention bank account');
console.log('✓ Test 5 passed\n');

// Test 6: generateIntegratedBillingCsv
console.log('Test 6: generateIntegratedBillingCsv');
const csv = generateIntegratedBillingCsv([
  {
    studentName: 'Kenji Sato',
    belt: 'Kuning',
    parentName: 'Budi Santoso',
    phone: '081234567890',
    totalSessions: 5,
    hadir: 2,
    izin: 1,
    sakit: 1,
    alpha: 1,
    attendancePct: 40,
    status: 'Belum Lunas',
    unpaidMonths: 'Februari 2026, Maret 2026',
    totalUnpaid: 45000,
  }
], 1, 2026, 3, 2026);

assert(csv.includes('Kenji Sato'), 'CSV should contain student name');
assert(csv.includes('45000'), 'CSV should contain total unpaid');
assert(csv.includes('Januari 2026 - Maret 2026'), 'CSV should mention period in header comments');
console.log('✓ Test 6 passed\n');

console.log('All tests completed successfully!');
