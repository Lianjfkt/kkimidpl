import { Fee, Student } from './mockData';

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

export interface WhatsAppMessageParams {
  studentName: string;
  parentName?: string;
  monthName: string;
  year: number;
  amount: number;
  totalArrearsAmount?: number;
  unpaidMonthsCount?: number;
  unpaidMonthDetails?: string[];
}

/**
 * Generates official & polite WhatsApp billing reminder message
 */
export function generateWhatsAppMessage(params: WhatsAppMessageParams): string {
  const {
    studentName,
    parentName,
    monthName,
    year,
    amount,
    totalArrearsAmount,
    unpaidMonthsCount,
    unpaidMonthDetails
  } = params;

  const greetingTarget = parentName
    ? `Yth. Bapak/Ibu *${parentName}* (Orang Tua / Wali dari ananda *${studentName}*),`
    : `Yth. Orang Tua / Wali dari ananda *${studentName}*,`;

  let arrearsSection = '';
  if (unpaidMonthsCount && unpaidMonthsCount > 1 && totalArrearsAmount) {
    const periodList = unpaidMonthDetails && unpaidMonthDetails.length > 0
      ? ` (${unpaidMonthDetails.join(', ')})`
      : ` (${unpaidMonthsCount} Bulan)`;
    arrearsSection = `\n⚠️ *Total Akumulasi Tunggakan${periodList}:* Rp ${totalArrearsAmount.toLocaleString('id-ID')}`;
  }

  return `🥋 *PENGINGAT IURAN BULANAN DOJO KKI DPL* 🥋

${greetingTarget}

Semoga Bapak/Ibu senantiasa dalam keadaan sehat walafiat.
Kami dari Pengurus Dojo Karate KKI DPL ingin menginformasikan tagihan iuran bulanan latihan karate ananda untuk:

📌 *Periode:* ${monthName} ${year}
💰 *Nominal Tagihan:* Rp ${amount.toLocaleString('id-ID')}${arrearsSection}

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
 * Calculates arrears and payment status for a student across all fees
 */
export function calculateStudentArrears(
  studentId: string,
  allFees: Fee[],
  selectedMonth: number,
  selectedYear: number,
  defaultMonthlyAmount: number = 20000
): StudentArrearsInfo {
  // All fees for this student
  const studentFees = allFees.filter((f) => f.student_id === studentId);

  // Find fee for selected month (prioritize 'lunas' if multiple records exist)
  const currentMonthFee =
    studentFees.find(
      (f) => Number(f.period_month) === Number(selectedMonth) && Number(f.period_year) === Number(selectedYear) && f.status === 'lunas'
    ) ||
    studentFees.find(
      (f) => Number(f.period_month) === Number(selectedMonth) && Number(f.period_year) === Number(selectedYear)
    );

  const isCurrentMonthPaid = currentMonthFee ? currentMonthFee.status === 'lunas' : false;

  // Unpaid fees (excluding selected month if it's already lunas)
  const unpaidFees = studentFees.filter(
    (f) => f.status !== 'lunas' && !(Number(f.period_month) === Number(selectedMonth) && Number(f.period_year) === Number(selectedYear) && isCurrentMonthPaid)
  );

  const unpaidMonthDetails = unpaidFees.map(
    (f) => `${MONTH_NAMES[f.period_month - 1] || f.period_month} ${f.period_year}`
  );

  let totalUnpaidAmount = unpaidFees.reduce((sum, f) => sum + Number(f.amount), 0);
  let unpaidCount = unpaidFees.length;

  // If current month has no fee row at all in database, treat it as unbilled/unpaid
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
 * Generates CSV content for downloading the unpaid list
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
  month: number,
  year: number
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
