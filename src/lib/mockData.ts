export interface Profile {
  id: string;
  full_name: string;
  role: 'owner' | 'pelatih' | 'ortu';
  phone: string;
  avatar_url: string;
  created_at: string;
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
  day_of_week: number; // 0-6 (Ahad-Sabtu)
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

// Initial seed data
export const initialProfiles: Profile[] = [
  {
    id: "user-owner-id",
    full_name: "Sensai H. Bambang (Owner)",
    role: "owner",
    phone: "081234567890",
    avatar_url: "",
    created_at: new Date().toISOString(),
  },
  {
    id: "user-coach-id",
    full_name: "Sempai Ahmad Fauzi",
    role: "pelatih",
    phone: "081298765432",
    avatar_url: "",
    created_at: new Date().toISOString(),
  },
  {
    id: "user-parent-id",
    full_name: "Budi Santoso (Ortu)",
    role: "ortu",
    phone: "085678901234",
    avatar_url: "",
    created_at: new Date().toISOString(),
  }
];

export const initialCoaches: Coach[] = [
  {
    id: "coach-ahmad-id",
    profile_id: "user-coach-id",
    full_name: "Sempai Ahmad Fauzi",
    phone: "081298765432",
    belt_level: "Dan II",
    join_date: "2024-01-15",
    honor_rate: 150000,
  }
];

export const initialStudents: Student[] = [
  {
    id: "student-riki-id",
    full_name: "Riki Santoso",
    dob: "2015-05-10",
    gender: "Laki-laki",
    address: "Jl. Merdeka No. 12, Jakarta",
    parent_id: "user-parent-id",
    phone: "085678901234",
    photo_url: "",
    join_date: "2024-02-01",
    current_belt: "Putih (Geup 10)",
    status: "active",
  },
  {
    id: "student-siti-id",
    full_name: "Siti Rahma",
    dob: "2014-08-22",
    gender: "Perempuan",
    address: "Jl. Melati No. 4, Jakarta",
    parent_id: "user-parent-id",
    phone: "085678901234",
    photo_url: "",
    join_date: "2024-02-10",
    current_belt: "Kuning (Geup 9)",
    status: "active",
  }
];

export const initialClasses: ClassSession[] = [
  {
    id: "class-anak-id",
    name: "Kelas Anak Sore (Selasa)",
    day_of_week: 2, // Selasa
    time_start: "16:00",
    time_end: "17:30",
    coach_id: "coach-ahmad-id",
    category: "anak",
  },
  {
    id: "class-kompetisi-id",
    name: "Kelas Kompetisi (Sabtu)",
    day_of_week: 6, // Sabtu
    time_start: "08:00",
    time_end: "10:30",
    coach_id: "coach-ahmad-id",
    category: "kompetisi",
  }
];

export const initialFees: Fee[] = [
  {
    id: "fee-riki-august",
    student_id: "student-riki-id",
    period_month: 8,
    period_year: 2026,
    amount: 150000,
    status: "belum_lunas",
  },
  {
    id: "fee-siti-august",
    student_id: "student-siti-id",
    period_month: 8,
    period_year: 2026,
    amount: 150000,
    status: "lunas",
    paid_date: "2026-08-05",
    payment_method: "qris",
    notes: "Sudah bayar via scan QRIS",
  }
];

export const initialFinanceTransactions: FinanceTransaction[] = [
  {
    id: "tx-fee-siti",
    type: "pemasukan",
    category: "iuran",
    amount: 150000,
    transaction_date: "2026-08-05",
    description: "Iuran Agustus Siti Rahma",
    created_by: "user-owner-id",
  },
  {
    id: "tx-rent",
    type: "pengeluaran",
    category: "sewa",
    amount: 500000,
    transaction_date: "2026-08-01",
    description: "Sewa Aula Latihan Bulanan",
    created_by: "user-owner-id",
  }
];

export const initialRegistrations: Registration[] = [
  {
    id: "reg-tony-id",
    full_name: "Tony Wijaya",
    dob: "2016-12-01",
    parent_name: "Hendra Wijaya",
    parent_phone: "087711223344",
    address: "Jl. Kenanga Baru No. 8",
    status: "menunggu",
    submitted_at: new Date().toISOString(),
  }
];

export const initialNotifications: Notification[] = [
  {
    id: "notif-1",
    user_id: "user-parent-id",
    title: "Tagihan Iuran Baru",
    message: "Tagihan iuran bulan Agustus 2026 untuk Riki Santoso telah dibuat. Silakan selesaikan pembayaran.",
    type: "iuran",
    is_read: false,
    created_at: new Date().toISOString(),
  }
];
