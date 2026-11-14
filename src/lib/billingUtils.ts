import type { Fee, Student } from './mockData';

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Normalizes an Indonesian phone number to international WhatsApp format (e.g. 628123456789)
 */
export function formatWhatsAppNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Generates an array of { month, year } objects between start and end period inclusive
 */
export function getMonthsInRange(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): Array<{ month: number; year: number }> {
  let sMonth = Number(startMonth);
  let sYear = Number(startYear);
  let eMonth = Number(endMonth);
  let eYear = Number(endYear);

  // If start is after end, swap them
  if (sYear > eYear || (sYear === eYear && sMonth > eMonth)) {
    const tempM = sMonth;
    const tempY = sYear;
    sMonth = eMonth;
    sYear = eYear;
    eMonth = tempM;
    eYear = tempY;
  }

  const results: Array<{ month: number; year: number }> = [];
  let curYear = sYear;
  let curMonth = sMonth;

  while (curYear < eYear || (curYear === eYear && curMonth <= eMonth)) {
    results.push({ month: curMonth, year: curYear });
    curMonth++;
    if (curMonth > 12) {
      curMonth = 1;
      curYear++;
    }
  }

  return results;
}

/**
 * Returns ISO date strings for the first day of start month and last day of end month
 */
export function getDateRangeBounds(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): { startDate: string; endDate: string } {
  let sMonth = Number(startMonth);
  let sYear = Number(startYear);
  let eMonth = Number(endMonth);
  let eYear = Number(endYear);

  if (sYear > eYear || (sYear === eYear && sMonth > eMonth)) {
    const tempM = sMonth;
    const tempY = sYear;
    sMonth = eMonth;
    sYear = eYear;
    eMonth = tempM;
    eYear = tempY;
  }

  const startDate = `${sYear}-${String(sMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(eYear, eMonth, 0)).getUTCDate();
  const endDate = `${eYear}-${String(eMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return { startDate, endDate };
}

export interface AttendanceStats {
  totalSessions: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  attendancePct: number;
}

/**
 * Calculates student attendance statistics within a given date range
 */
export function calculateStudentAttendanceStats(
  studentId: string,
  attendanceList: Array<{ student_id?: string; session_date?: string; status?: string }>,
  startDate: string,
  endDate: string
): AttendanceStats {
  const filtered = attendanceList.filter((a) => {
    if (a.student_id !== studentId) return false;
    if (!a.session_date) return false;
    const d = a.session_date.slice(0, 10);
    return d >= startDate && d <= endDate;
  });

  let hadir = 0;
  let izin = 0;
  let sakit = 0;
  let alpha = 0;

  for (const item of filtered) {
    const st = item.status?.toLowerCase();
    if (st === 'hadir') hadir++;
    else if (st === 'izin') izin++;
    else if (st === 'sakit') sakit++;
    else if (st === 'alpha') alpha++;
  }

  const totalSessions = hadir + izin + sakit + alpha;
  const attendancePct = totalSessions > 0 ? Math.round((hadir / totalSessions) * 100) : 0;

  return {
    totalSessions,
    hadir,
    izin,
    sakit,
    alpha,
    attendancePct,
  };
}

export interface StudentRangeBillingInfo {
  monthsRange: Array<{ month: number; year: number }>;
  paidMonthsCount: number;
  unpaidCount: number;
  totalUnpaidAmount: number;
  unpaidFees: Fee[];
  unpaidMonthDetails: string[];
  isRangeFullyPaid: boolean;
  periodDetails: Array<{
    month: number;
    year: number;
    monthName: string;
    isPaid: boolean;
    fee?: Fee;
    amount: number;
  }>;
}

/**
 * Calculates fee status across a custom range of months for a student
 */
export function calculateStudentRangeBilling(
  studentId: string,
  allFees: Fee[],
  monthsRange: Array<{ month: number; year: number }>,
  defaultMonthlyAmount: number = 20000
): StudentRangeBillingInfo {
  const studentFees = allFees.filter((f) => f.student_id === studentId);

  let paidMonthsCount = 0;
  let unpaidCount = 0;
  let totalUnpaidAmount = 0;
  const unpaidFees: Fee[] = [];
  const unpaidMonthDetails: string[] = [];

  const periodDetails = monthsRange.map(({ month, year }) => {
    const monthName = `${MONTH_NAMES[month - 1] || month} ${year}`;
    // Look for fee record
    const feeRecord = studentFees.find(
      (f) => Number(f.period_month) === Number(month) && Number(f.period_year) === Number(year) && f.status === 'lunas'
    ) || studentFees.find(
      (f) => Number(f.period_month) === Number(month) && Number(f.period_year) === Number(year)
    );

    const isPaid = feeRecord ? feeRecord.status === 'lunas' : false;
    const amount = feeRecord ? Number(feeRecord.amount) : defaultMonthlyAmount;

    if (isPaid) {
      paidMonthsCount++;
    } else {
      unpaidCount++;
      totalUnpaidAmount += amount;
      if (feeRecord) unpaidFees.push(feeRecord);
      unpaidMonthDetails.push(monthName);
    }

    return {
      month,
      year,
      monthName,
      isPaid,
      fee: feeRecord,
      amount,
    };
  });

  return {
    monthsRange,
    paidMonthsCount,
    unpaidCount,
    totalUnpaidAmount,
    unpaidFees,
    unpaidMonthDetails,
    isRangeFullyPaid: unpaidCount === 0,
    periodDetails,
  };
}

export interface WhatsAppMessageParams {
  studentName: string;
  parentName?: string;
  belt?: string;
  monthName?: string;
  year?: number;
  amount?: number;
  // Multi-period / Range parameters
  startMonthName?: string;
  startYear?: number;
  endMonthName?: string;
  endYear?: number;
  attendanceStats?: AttendanceStats;
  isRangeFullyPaid?: boolean;
  totalArrearsAmount?: number;
  unpaidMonthsCount?: number;
  unpaidMonthDetails?: string[];
}

/**
 * Generates official & polite WhatsApp recap & billing reminder message
 */
export function generateWhatsAppMessage(params: WhatsAppMessageParams): string {
  const {
    studentName,
    parentName,
    belt,
    monthName,
    year,
    amount,
    startMonthName,
    startYear,
    endMonthName,
    endYear,
    attendanceStats,
    isRangeFullyPaid,
    totalArrearsAmount,
    unpaidMonthsCount,
    unpaidMonthDetails,
  } = params;

  const parentGreeting = parentName ? parentName : 'Orang Tua / Wali';
  const beltInfo = belt ? ` - Sabuk *${belt}*` : '';

  // Determine period label
  let periodString = '';
  if (startMonthName && startYear && endMonthName && endYear) {
    if (startMonthName === endMonthName && startYear === endYear) {
      periodString = `${startMonthName} ${startYear}`;
    } else {
      periodString = `${startMonthName} ${startYear} - ${endMonthName} ${endYear}`;
    }
  } else if (monthName && year) {
    periodString = `${monthName} ${year}`;
  } else {
    periodString = 'Periode Latihan';
  }

  // If attendance stats are provided, render the comprehensive recap format
  if (attendanceStats) {
    let duesSection = '';
    const totalDue = totalArrearsAmount !== undefined ? totalArrearsAmount : (amount || 0);

    if (isRangeFullyPaid || (unpaidMonthsCount === 0 && totalDue === 0)) {
      duesSection = `• Status Iuran: *LUNAS* (Seluruh iuran periode ini telah terbayar. Terima kasih banyak!) ✨`;
    } else {
      const detailsList = unpaidMonthDetails && unpaidMonthDetails.length > 0
        ? unpaidMonthDetails.join(', ')
        : `${unpaidMonthsCount || 1} Bulan`;
      duesSection = `• Bulan Belum Terbayar: ${detailsList} (${unpaidMonthsCount || 1} Bulan)\n• Total Tagihan yang Perlu Diselesaikan: *Rp ${totalDue.toLocaleString('id-ID')}*`;
    }

    return `🥋 *REKAP KEHADIRAN & IURAN DOJO KKI DPL* 🥋

Yth. Bapak/Ibu *${parentGreeting}* (Wali dari ananda *${studentName}*${beltInfo}),

Semoga Bapak/Ibu senantiasa dalam keadaan sehat walafiat.
Berikut kami sampaikan laporan kehadiran latihan karate serta rincian iuran ananda untuk periode *${periodString}*:

📊 *REKAP KEHADIRAN LATIHAN:*
• Total Sesi: ${attendanceStats.totalSessions} sesi latihan
• Hadir: ${attendanceStats.hadir} kali (${attendanceStats.attendancePct}%)
• Izin: ${attendanceStats.izin} kali
• Sakit: ${attendanceStats.sakit} kali
• Alpha (Tanpa Keterangan): ${attendanceStats.alpha} kali

💳 *RINCIAN IURAN:*
${duesSection}

Pembayaran dapat ditransfer melalui rekening resmi dojo:
🏦 *Bank:* Bank JAGO
💳 *No. Rekening:* 501072411966
👤 *A.N:* KKI DPL / Pengurus Dojo
(Atau dapat dibayar tunai saat jadwal latihan di dojo).

Mohon konfirmasi dengan mengirimkan bukti transfer jika sudah membayar.
Terima kasih atas kerja sama dan dukungannya dalam pembinaan karate ananda.

_OSS! Salam Karate._ 🙏`;
  }

  // Legacy single-period fallback if no attendanceStats supplied
  const singleMonthName = monthName || startMonthName || 'Bulan Ini';
  const singleYear = year || startYear || new Date().getFullYear();
  const singleAmount = amount !== undefined ? amount : 20000;

  let arrearsSection = '';
  if (unpaidMonthsCount && unpaidMonthsCount > 1 && totalArrearsAmount) {
    const periodList = unpaidMonthDetails && unpaidMonthDetails.length > 0
      ? ` (${unpaidMonthDetails.join(', ')})`
      : ` (${unpaidMonthsCount} Bulan)`;
    arrearsSection = `\n⚠️ *Total Akumulasi Tunggakan${periodList}:* Rp ${totalArrearsAmount.toLocaleString('id-ID')}`;
  }

  return `🥋 *PENGINGAT IURAN BULANAN DOJO KKI DPL* 🥋

Yth. Bapak/Ibu *${parentGreeting}* (Wali dari ananda *${studentName}*${beltInfo}),

Semoga Bapak/Ibu senantiasa dalam keadaan sehat walafiat.
Kami dari Pengurus Dojo Karate KKI DPL ingin menginformasikan tagihan iuran bulanan latihan karate ananda untuk:

📌 *Periode:* ${singleMonthName} ${singleYear}
💰 *Nominal Tagihan:* Rp ${singleAmount.toLocaleString('id-ID')}${arrearsSection}

Pembayaran dapat disalurkan melalui transfer ke rekening resmi dojo:
🏦 *Bank:* Bank JAGO
💳 *No. Rekening:* 501072411966
👤 *Atas Nama:* KKI DPL / Pengurus Dojo

Atau dapat dibayarkan secara tunai langsung ke kasir/pengurus saat jadwal latihan karate.
Mohon konfirmasi dengan mengirimkan bukti transfer setelah melakukan pembayaran.

Terima kasih atas kerja sama dan dukungannya untuk kelancaran latihan ananda.
_OSS! Salam Karate._ 🙏`;
}

/**
 * Generates direct WhatsApp URL
 */
export function generateWhatsAppUrl(phone: string | undefined | null, message: string): string {
  const cleanPhone = formatWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(message);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export interface StudentArrearsInfo {
  unpaidCount: number;
  totalUnpaidAmount: number;
  unpaidFees: Fee[];
  unpaidMonthDetails: string[];
  isCurrentMonthPaid: boolean;
  currentMonthFee?: Fee;
}

/**
 * Calculates arrears and payment status for a student across all fees for a single month (legacy compatibility)
 */
export function calculateStudentArrears(
  studentId: string,
  allFees: Fee[],
  selectedMonth: number,
  selectedYear: number,
  defaultMonthlyAmount: number = 20000
): StudentArrearsInfo {
  const studentFees = allFees.filter((f) => f.student_id === studentId);

  const currentMonthFee =
    studentFees.find(
      (f) => Number(f.period_month) === Number(selectedMonth) && Number(f.period_year) === Number(selectedYear) && f.status === 'lunas'
    ) ||
    studentFees.find(
      (f) => Number(f.period_month) === Number(selectedMonth) && Number(f.period_year) === Number(selectedYear)
    );

  const isCurrentMonthPaid = currentMonthFee ? currentMonthFee.status === 'lunas' : false;

  const unpaidFees = studentFees.filter(
    (f) => f.status !== 'lunas' && !(Number(f.period_month) === Number(selectedMonth) && Number(f.period_year) === Number(selectedYear) && isCurrentMonthPaid)
  );

  const unpaidMonthDetails = unpaidFees.map(
    (f) => `${MONTH_NAMES[f.period_month - 1] || f.period_month} ${f.period_year}`
  );

  let totalUnpaidAmount = unpaidFees.reduce((sum, f) => sum + Number(f.amount), 0);
  let unpaidCount = unpaidFees.length;

  if (!currentMonthFee) {
    totalUnpaidAmount += defaultMonthlyAmount;
    unpaidCount += 1;
    unpaidMonthDetails.push(`${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`);
  }

  return {
    unpaidCount,
    totalUnpaidAmount,
    unpaidFees,
    unpaidMonthDetails,
    isCurrentMonthPaid,
    currentMonthFee
  };
}

/**
 * Generates CSV content for single-month unpaid billing (legacy)
 */
export function generateUnpaidBillingCsv(
  items: Array<{
    student: Student;
    parentName: string;
    phone: string;
    belt: string;
    currentMonthStatus: string;
    currentMonthAmount: number;
    totalArrearsAmount: number;
    unpaidMonthsCount: number;
    unpaidDetails: string;
  }>,
  _month?: number,
  _year?: number
): string {
  const header = 'Nama Siswa,Sabuk,Nama Orang Tua / Wali,No. Telepon / WA,Status Periode Ini,Nominal Periode Ini,Total Akumulasi Tunggakan,Jumlah Bulan Nunggak,Rincian Periode Tunggakan\n';
  
  const rows = items.map((item) => {
    return [
      `"${item.student.full_name}"`,
      `"${item.belt}"`,
      `"${item.parentName || '-'}"`,
      `"${item.phone || '-'}"`,
      `"${item.currentMonthStatus}"`,
      item.currentMonthAmount,
      item.totalArrearsAmount,
      item.unpaidMonthsCount,
      `"${item.unpaidDetails}"`
    ].join(',');
  }).join('\n');

  return header + rows;
}

/**
 * Generates comprehensive CSV content for range-based attendance & billing recap
 */
export function generateIntegratedBillingCsv(
  items: Array<{
    studentName: string;
    belt: string;
    parentName?: string;
    phone?: string;
    totalSessions: number;
    hadir: number;
    izin: number;
    sakit: number;
    alpha: number;
    attendancePct: number;
    status: string;
    unpaidMonths: string;
    totalUnpaid: number;
  }>,
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): string {
  const periodLabel = startMonth === endMonth && startYear === endYear
    ? `${MONTH_NAMES[startMonth - 1]} ${startYear}`
    : `${MONTH_NAMES[startMonth - 1]} ${startYear} - ${MONTH_NAMES[endMonth - 1]} ${endYear}`;

  const metaHeader = `# REKAP TERPADU TAGIHAN & ABSENSI DOJO KKI DPL (${periodLabel})\n`;
  const columns = 'Nama Siswa,Sabuk,Orang Tua / Wali,No. WA / Telp,Total Sesi,Hadir,Izin,Sakit,Alpha,Kehadiran (%),Status Tagihan,Bulan Tertunggak,Total Tagihan (Rp)\n';

  const rows = items.map((item) => {
    return [
      `"${item.studentName.replace(/"/g, '""')}"`,
      `"${(item.belt || 'Putih').replace(/"/g, '""')}"`,
      `"${(item.parentName || '-').replace(/"/g, '""')}"`,
      `"${(item.phone || '-').replace(/"/g, '""')}"`,
      item.totalSessions,
      item.hadir,
      item.izin,
      item.sakit,
      item.alpha,
      `${item.attendancePct}%`,
      `"${item.status}"`,
      `"${(item.unpaidMonths || '-').replace(/"/g, '""')}"`,
      item.totalUnpaid,
    ].join(',');
  }).join('\n');

  return metaHeader + columns + rows;
}
