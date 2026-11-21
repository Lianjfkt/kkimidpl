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
  marked_by?: string | null;
  created_at: string;
}

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
  registration_fee?: number;
  examiner?: string;
  status: 'terjadwal' | 'mendatang' | 'selesai' | 'dibatalkan';
  notes?: string;
}

export interface ExamParticipant {
  id: string;
  exam_id: string;
  student_id: string;
  current_belt?: string;
  target_belt: string;
  result: 'lulus' | 'tidak_lulus' | 'pending';
  status?: string;
  score_notes?: string;
  grade?: string;
  notes?: string;
}

export interface Tournament {
  id: string;
  name: string;
  tournament_date: string;
  start_date?: string;
  end_date?: string;
  location: string;
  level: 'lokal' | 'regional' | 'nasional';
  organizer: string;
  registration_fee?: number;
  status?: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  student_id: string;
  category: 'kata' | 'kumite';
  weight_class?: string;
  result: string;
  medal: 'emas' | 'perak' | 'perunggu' | 'none';
  status?: string;
  notes?: string;
}

export interface Registration {
  id: string;
  full_name: string;
  dob: string;
  parent_name: string;
  parent_phone: string;
  parent_job?: string;
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

export interface ClassStudentEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
}

export interface CurriculumMaterial {
  id: string;
  belt_level: string;
  title: string;
  description: string;
  type?: 'video' | 'pdf' | 'teks';
  url?: string | null;
  category?: 'Kihon' | 'Kata' | 'Kumite';
  video_url?: string;
  checklist_items?: string[];
  created_at?: string;
}

