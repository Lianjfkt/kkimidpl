const https = require('https');
const fs = require('fs');
const path = require('path');

const gids = {
  siswa: '402327281',
  absensi: '255922403',
  iuran: '1764300307',
  event: '1691883426',
  peserta_event: '1427870515',
  akun_ortu: '373405173',
  config: '1809165867'
};

const docUrl = 'https://docs.google.com/spreadsheets/d/1qVF_QvLhWvRS7Pxmr1lCk8G7v8MAA9rOotUJtNQgl-Q/export?format=csv&gid=';

function fetchCsv(gid) {
  const url = docUrl + gid;
  return new Promise((resolve, reject) => {
    function get(currentUrl) {
      https.get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location);
        } else if (res.statusCode === 200) {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => resolve(data));
        } else {
          reject(new Error(`Failed to fetch ${currentUrl}: Status ${res.statusCode}`));
        }
      }).on('error', reject);
    }
    get(url);
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0 || !lines[0]) return [];
  const headers = parseCSVLine(lines[0]);
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] !== undefined ? values[index].trim() : '';
    });
    result.push(row);
  }
  return result;
}

async function main() {
  console.log('Fetching all sheets from Google Spreadsheets...');
  try {
    const siswaCsv = await fetchCsv(gids.siswa);
    const absensiCsv = await fetchCsv(gids.absensi);
    const iuranCsv = await fetchCsv(gids.iuran);
    const eventCsv = await fetchCsv(gids.event);
    const pesertaCsv = await fetchCsv(gids.peserta_event);
    const akunCsv = await fetchCsv(gids.akun_ortu);
    const configCsv = await fetchCsv(gids.config);

    console.log('Parsing CSV content...');
    const siswaRows = parseCSV(siswaCsv);
    const absensiRows = parseCSV(absensiCsv);
    const iuranRows = parseCSV(iuranCsv);
    const eventRows = parseCSV(eventCsv);
    const pesertaRows = parseCSV(pesertaCsv);
    const akunRows = parseCSV(akunCsv);
    const configRows = parseCSV(configCsv);

    console.log(`Parsed Siswa: ${siswaRows.length}`);
    console.log(`Parsed Absensi: ${absensiRows.length}`);
    console.log(`Parsed Iuran: ${iuranRows.length}`);
    console.log(`Parsed Event: ${eventRows.length}`);
    console.log(`Parsed Peserta Event: ${pesertaRows.length}`);
    console.log(`Parsed Akun Ortu: ${akunRows.length}`);
    console.log(`Parsed Config: ${configRows.length}`);

    // Map config settings
    const config = {};
    configRows.forEach(row => {
      if (row.Setting && row.Value) {
        config[row.Setting] = row.Value;
      }
    });

    // Generate Students data
    const students = siswaRows.map(row => {
      // Clean dates
      let joinDate = new Date().toISOString().split('T')[0];
      if (row.Tanggal_Daftar) {
        const parts = row.Tanggal_Daftar.split(' ');
        if (parts[0]) {
          const dateParts = parts[0].split('/');
          if (dateParts.length === 3) {
            joinDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // DD/MM/YYYY to YYYY-MM-DD
          } else {
            joinDate = parts[0];
          }
        }
      }
      return {
        id: row.ID_Siswa,
        full_name: row.Nama_Lengkap,
        dob: row.Tanggal_Lahir,
        gender: row.Jenis_Kelamin,
        address: 'Alamat tidak dispesifikasi',
        parent_id: row.No_WA_Wali ? `parent-${row.No_WA_Wali}` : 'user-parent-id',
        phone: row.No_WA_Wali || '',
        photo_url: row.Foto_URL || '',
        join_date: joinDate,
        current_belt: row.Sabuk_Saat_Ini,
        status: row.Status_Aktif === 'TRUE' ? 'active' : 'inactive',
        nik: row.NIK,
        birth_place: row.Tempat_Lahir,
        specialization: row.Spesialis || 'Kata',
        parent_name: row.Nama_Wali,
        parent_job: row.Pekerjaan_Wali,
        weight: row.Berat_Badan ? parseFloat(row.Berat_Badan) : undefined,
        height: row.Tinggi_Badan ? parseFloat(row.Tinggi_Badan) : undefined,
        medical_history: row.Riwayat_Penyakit
      };
    });

    // Generate Parents Profiles
    const parentProfiles = [];
    const parentIdsSeen = new Set();
    akunRows.forEach(row => {
      const waNumber = row.Username;
      const parentId = `parent-${waNumber}`;
      if (!parentIdsSeen.has(parentId)) {
        parentIdsSeen.add(parentId);
        // Find parent name from Siswa records
        const matchedSiswa = siswaRows.find(s => s.No_WA_Wali === waNumber);
        const parentName = matchedSiswa ? matchedSiswa.Nama_Wali : 'Wali Siswa';
        parentProfiles.push({
          id: parentId,
          full_name: parentName,
          role: 'ortu',
          phone: waNumber,
          avatar_url: '',
          created_at: new Date().toISOString(),
          password_hash: row.Password_Hash,
          status_aktif: row.Status_Aktif === 'TRUE'
        });
      }
    });

    // Combine Profiles
    const profiles = [
      {
        id: 'user-owner-id',
        full_name: 'Sensai Bambang (Owner)',
        role: 'owner',
        phone: config.KontakDojo || '081234567890',
        avatar_url: '',
        created_at: new Date().toISOString(),
        password_hash: config.AdminPassword
      },
      {
        id: 'user-coach-id',
        full_name: 'Sempai Ahmad Fauzi',
        role: 'pelatih',
        phone: '081298765432',
        avatar_url: '',
        created_at: new Date().toISOString(),
      },
      ...parentProfiles
    ];

    // Generate Fees
    const fees = iuranRows.map(row => {
      // Bulan format is YYYY-MM
      let month = 5;
      let year = 2026;
      if (row.Bulan) {
        const parts = row.Bulan.split('-');
        if (parts.length === 2) {
          year = parseInt(parts[0]);
          month = parseInt(parts[1]);
        }
      }
      let paidDate = undefined;
      if (row.Tanggal_Bayar) {
        const parts = row.Tanggal_Bayar.split(' ');
        if (parts[0]) {
          const dateParts = parts[0].split('/');
          if (dateParts.length === 3) {
            paidDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
          } else {
            paidDate = parts[0];
          }
        }
      }
      return {
        id: row.ID_Iuran,
        student_id: row.ID_Siswa,
        period_month: month,
        period_year: year,
        amount: parseFloat(row.Jumlah_Iuran) || 20000,
        status: row.Status === 'Lunas' ? 'lunas' : 'belum_lunas',
        paid_date: paidDate,
        payment_method: row.Keterangan && row.Keterangan.toLowerCase().includes('tf') ? 'transfer' : 'tunai',
        notes: row.Keterangan || ''
      };
    });

    // Generate Finance Transactions from paid fees
    const financeTransactions = [
      {
        id: 'tx-rent',
        type: 'pengeluaran',
        category: 'sewa',
        amount: 500000,
        transaction_date: '2026-05-01',
        description: 'Sewa Aula Latihan Bulanan',
        created_by: 'user-owner-id'
      }
    ];

    fees.forEach(fee => {
      if (fee.status === 'lunas') {
        const student = students.find(s => s.id === fee.student_id);
        const studentName = student ? student.full_name : 'Siswa';
        financeTransactions.push({
          id: `tx-${fee.id}`,
          type: 'pemasukan',
          category: 'iuran',
          amount: fee.amount,
          transaction_date: fee.paid_date || '2026-05-01',
          description: `Iuran Bulan ${fee.period_month}/${fee.period_year} - ${studentName}`,
          created_by: 'user-owner-id'
        });
      }
    });

    // Generate Attendance Student
    const attendanceStudents = absensiRows.map(row => {
      const rawStatus = row.Status ? row.Status.toLowerCase() : 'hadir';
      // Spreadsheet uses 'Alfa' (Indonesian), map to 'alpha' for TypeScript enum
      const mappedStatus = rawStatus === 'alfa' ? 'alpha' : rawStatus;
      return {
        id: row.ID_Absensi,
        student_id: row.ID_Siswa,
        class_id: 'class-anak-id', // default class
        session_date: row.Tanggal,
        status: mappedStatus,
        marked_by: row.Dicatat_Oleh || 'pelatih',
        created_at: new Date().toISOString()
      };
    });


    // Generate Events (split to Belt Exams and Tournaments)
    const beltExams = [];
    const tournaments = [];
    eventRows.forEach(row => {
      if (row.Tipe === 'Kenaikan_Sabuk') {
        beltExams.push({
          id: row.ID_Event,
          exam_date: row.Tanggal,
          location: row.Lokasi,
          fee: parseFloat(row.Biaya_Pendaftaran) || 250000,
          status: row.Status_Event === 'Selesai' ? 'selesai' : 'terjadwal',
          notes: row.Keterangan || ''
        });
      } else if (row.Tipe === 'Kejuaraan') {
        tournaments.push({
          id: row.ID_Event,
          name: row.Nama_Event,
          tournament_date: row.Tanggal,
          location: row.Lokasi,
          level: 'lokal', // fallback
          organizer: row.Keterangan || 'Pengprov KKI'
        });
      }
    });

    // Generate Participant Events
    const examParticipants = [];
    const tournamentParticipants = [];
    pesertaRows.forEach(row => {
      // Find event type
      const matchedEvent = eventRows.find(e => e.ID_Event === row.ID_Event);
      if (matchedEvent) {
        if (matchedEvent.Tipe === 'Kenaikan_Sabuk') {
          examParticipants.push({
            id: row.ID_Peserta,
            exam_id: row.ID_Event,
            student_id: row.ID_Siswa,
            current_belt: row.Sabuk_Saat_Ini,
            target_belt: row.Sabuk_Baru || '',
            result: row.Hasil === 'Lulus' ? 'lulus' : (row.Hasil === 'Tidak Lulus' ? 'tidak_lulus' : 'pending'),
            score_notes: row.Catatan || ''
          });
        } else if (matchedEvent.Tipe === 'Kejuaraan') {
          let medal = 'none';
          if (row.Hasil && row.Hasil.toLowerCase().includes('emas')) medal = 'emas';
          else if (row.Hasil && row.Hasil.toLowerCase().includes('perak')) medal = 'perak';
          else if (row.Hasil && row.Hasil.toLowerCase().includes('perunggu')) medal = 'perunggu';
          tournamentParticipants.push({
            id: row.ID_Peserta,
            tournament_id: row.ID_Event,
            student_id: row.ID_Siswa,
            category: 'kata', // default
            weight_class: row.Kategori_Berat || '',
            result: row.Hasil || '',
            medal: medal
          });
        }
      }
    });

    // Generate final content
    const code = `'use client';

export interface Profile {
  id: string;
  full_name: string;
  role: 'owner' | 'pelatih' | 'ortu';
  phone: string;
  avatar_url: string;
  created_at: string;
  password_hash?: string;
  status_aktif?: boolean;
}

export interface Student {
  id: string;
  full_name: string;
  dob: string;
  gender: string;
  address: string;
  parent_id: string;
  phone: string;
  photo_url: string;
  join_date: string;
  current_belt: string;
  status: 'active' | 'inactive' | 'pending';
  nik?: string;
  birth_place?: string;
  specialization?: string;
  parent_name?: string;
  parent_job?: string;
  weight?: number;
  height?: number;
  medical_history?: string;
}

export interface Coach {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string;
  belt_level: string;
  join_date: string;
  honor_rate: number;
}

export interface ClassSession {
  id: string;
  name: string;
  day_of_week: number;
  time_start: string;
  time_end: string;
  coach_id: string;
  category: 'anak' | 'remaja' | 'kompetisi';
}

export interface StudentAttendance {
  id: string;
  student_id: string;
  class_id: string;
  session_date: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alpha';
  marked_by: string;
  created_at: string;
}

export interface CoachAttendance {
  id: string;
  coach_id: string;
  class_id: string;
  session_date: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alpha';
  created_at: string;
}

export interface Fee {
  id: string;
  student_id: string;
  period_month: number;
  period_year: number;
  amount: number;
  status: 'lunas' | 'belum_lunas' | 'sebagian';
  paid_date?: string;
  payment_method?: 'tunai' | 'transfer' | 'qris';
  notes?: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'pemasukan' | 'pengeluaran';
  category: string;
  amount: number;
  transaction_date: string;
  description: string;
  created_by: string;
}

export interface BeltExam {
  id: string;
  exam_date: string;
  location: string;
  fee: number;
  status: 'terjadwal' | 'selesai' | 'dibatalkan';
  notes?: string;
}

export interface ExamParticipant {
  id: string;
  exam_id: string;
  student_id: string;
  current_belt: string;
  target_belt: string;
  result: 'lulus' | 'tidak_lulus' | 'pending';
  score_notes?: string;
}

export interface Tournament {
  id: string;
  name: string;
  tournament_date: string;
  location: string;
  level: 'lokal' | 'regional' | 'nasional';
  organizer: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  student_id: string;
  category: 'kata' | 'kumite';
  weight_class?: string;
  result: string;
  medal: 'emas' | 'perak' | 'perunggu' | 'none';
}

export interface Registration {
  id: string;
  full_name: string;
  dob: string;
  parent_name: string;
  parent_phone: string;
  address: string;
  status: 'menunggu' | 'disetujui' | 'ditolak';
  submitted_at: string;
  reviewed_by?: string;
  current_belt?: string;
  weight?: number;
  height?: number;
  birth_place?: string;
  nik?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'iuran' | 'ujian' | 'turnamen' | 'absensi' | 'umum';
  is_read: boolean;
  created_at: string;
}

export const initialProfiles: Profile[] = ${JSON.stringify(profiles, null, 2)};

export const initialCoaches: Coach[] = [
  {
    id: 'coach-ahmad-id',
    profile_id: 'user-coach-id',
    full_name: 'Sempai Ahmad Fauzi',
    phone: '081298765432',
    belt_level: 'Dan II',
    join_date: '2024-01-15',
    honor_rate: 150000
  }
];

export const initialStudents: Student[] = ${JSON.stringify(students, null, 2)};

export const initialClasses: ClassSession[] = [
  {
    id: 'class-anak-id',
    name: 'Kelas Anak Sore (Selasa)',
    day_of_week: 2,
    time_start: '16:00',
    time_end: '17:30',
    coach_id: 'coach-ahmad-id',
    category: 'anak'
  },
  {
    id: 'class-kompetisi-id',
    name: 'Kelas Kompetisi (Sabtu)',
    day_of_week: 6,
    time_start: '08:00',
    time_end: '10:30',
    coach_id: 'coach-ahmad-id',
    category: 'kompetisi'
  }
];

export const initialFees: Fee[] = ${JSON.stringify(fees, null, 2)};

export const initialFinanceTransactions: FinanceTransaction[] = ${JSON.stringify(financeTransactions, null, 2)};

export const initialRegistrations: Registration[] = [];

export const initialNotifications: Notification[] = [];

export const initialAttendanceStudents: StudentAttendance[] = ${JSON.stringify(attendanceStudents, null, 2)};

export const initialBeltExams: BeltExam[] = ${JSON.stringify(beltExams, null, 2)};

export const initialExamParticipants: ExamParticipant[] = ${JSON.stringify(examParticipants, null, 2)};

export const initialTournaments: Tournament[] = ${JSON.stringify(tournaments, null, 2)};

export const initialTournamentParticipants: TournamentParticipant[] = ${JSON.stringify(tournamentParticipants, null, 2)};
`;

    fs.writeFileSync(path.join(__dirname, '../src/lib/mockData.ts'), code, 'utf8');
    console.log('Successfully wrote and seeded data into src/lib/mockData.ts!');
  } catch (err) {
    console.error('Error generating seed data:', err);
  }
}

main();
