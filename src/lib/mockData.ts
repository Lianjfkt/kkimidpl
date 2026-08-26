'use client';

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

export interface ClassStudentEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
}

export interface CurriculumMaterial {
  id: string;
  belt_level: string;
  category: 'Kihon' | 'Kata' | 'Kumite';
  title: string;
  description: string;
  video_url?: string;
  checklist_items: string[];
}

export const initialProfiles: Profile[] = [
  {
    "id": "user-owner-id",
    "full_name": "Sensai Bambang (Owner)",
    "role": "owner",
    "phone": "82176721334",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "4015f83ee3f975f9376533068867fb1297e651663dad02e0c37a95a88694fb57"
  },
  {
    "id": "user-coach-id",
    "full_name": "Sempai Ahmad Fauzi",
    "role": "pelatih",
    "phone": "081298765432",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z"
  },
  {
    "id": "user-parent-id",
    "full_name": "Demo Orang Tua",
    "role": "ortu",
    "phone": "08100000001",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z"
  },
  {
    "id": "parent-89683125124",
    "full_name": "ADES SRI RAHMAT",
    "role": "ortu",
    "phone": "89683125124",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.814Z",
    "password_hash": "2dad73bfd9c0b7f2115e41ddb9afbb5e08ac2e07a36c49f11c8c544604cdaff0",
    "status_aktif": true
  },
  {
    "id": "parent-82175720671",
    "full_name": "AAN WIJAYA",
    "role": "ortu",
    "phone": "82175720671",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.814Z",
    "password_hash": "a9e9fc99845d529749ddbb7237916ae7df780fc6d4421051cae0ab6490d8fcbc",
    "status_aktif": true
  },
  {
    "id": "parent-89606105583",
    "full_name": "ABDUL MALIK",
    "role": "ortu",
    "phone": "89606105583",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "190d82c6cc749fbd2255e922ba16dd69cc86bf02df5000a4e71a70089c56e288",
    "status_aktif": true
  },
  {
    "id": "parent-85369002428",
    "full_name": "ANGGA FRANATA",
    "role": "ortu",
    "phone": "85369002428",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "70c5669770242b6cb1d6ca2571430ea3d60bece5df06c4558f108d69f4c16d4a",
    "status_aktif": true
  },
  {
    "id": "parent-82269175004",
    "full_name": "MUHTAMAR YASIN",
    "role": "ortu",
    "phone": "82269175004",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "ce749ac4e9e37a500c012bc8ba6432dd4110fa26495e5104c17c7c887b10818e",
    "status_aktif": true
  },
  {
    "id": "parent-82187811232",
    "full_name": "HAMAMI, S.E.",
    "role": "ortu",
    "phone": "82187811232",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "1c188e36e3772ba7d8316e9f04cac1c034b88dc9148b1ad9122de4805ce13820",
    "status_aktif": true
  },
  {
    "id": "parent-81367362161",
    "full_name": "HERY ISMAYANTO",
    "role": "ortu",
    "phone": "81367362161",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "392f236c529fd5edbc3bd02d58ab49420dc0e63538b5cc4bcf0cc9e7f2a11976",
    "status_aktif": true
  },
  {
    "id": "parent-895367300262",
    "full_name": "SEP AAN ANSORI, S.T",
    "role": "ortu",
    "phone": "895367300262",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "222de9349c3551eba9a783f7a018c5ca0b93692d2a19832af61ea122fa991176",
    "status_aktif": true
  },
  {
    "id": "parent-82178028198",
    "full_name": "ESTI",
    "role": "ortu",
    "phone": "82178028198",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "625a1033c392fafe188c2f0b610b8efd0a691e585758e54fed2a2f7b85c2877b",
    "status_aktif": true
  },
  {
    "id": "parent-82278301866",
    "full_name": "FITRA EKA MARTA",
    "role": "ortu",
    "phone": "82278301866",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "ffcbd9adcc9c0b6e059a0a960e48f89d4e6b3177a732f4e687c09bc59fd88b0f",
    "status_aktif": true
  },
  {
    "id": "parent-82282113331",
    "full_name": "MINARNO/LISA",
    "role": "ortu",
    "phone": "82282113331",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "93e138e7e07d060d03632fae500ca45b08cd7815a6d68068f2af63251f2602ff",
    "status_aktif": true
  },
  {
    "id": "parent-85353200056",
    "full_name": "ALMAIDAH Spd",
    "role": "ortu",
    "phone": "85353200056",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "acbe6a80fa51b36b55eb783a0997913652127a18f110c6b64f860c928a0d4164",
    "status_aktif": true
  },
  {
    "id": "parent-82183910377",
    "full_name": "ZAIDAN ANANDO",
    "role": "ortu",
    "phone": "82183910377",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "19bbcf1b610461f48e239366efe244d57762f71e2a1b47f13a8d4cb98845cdf9",
    "status_aktif": true
  },
  {
    "id": "parent-81374456989",
    "full_name": "ADY",
    "role": "ortu",
    "phone": "81374456989",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "f44c13401e6ce43f8516ad7aa335712779c1f1cd27d810f957c9b54f414a6db1",
    "status_aktif": true
  },
  {
    "id": "parent-85896876108",
    "full_name": "YOGI YOSATA",
    "role": "ortu",
    "phone": "85896876108",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "24bd61db13792dbf60e339fd90cb4f8945aad255330dc26e8b736404733f39ac",
    "status_aktif": true
  },
  {
    "id": "parent-8112717400",
    "full_name": "YAYAN SUDIBYO",
    "role": "ortu",
    "phone": "8112717400",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "271e43baf9f870ca8ea22d2237aa543287bebaca0d509fa962573a53ace28c39",
    "status_aktif": true
  },
  {
    "id": "parent-81273016348",
    "full_name": "M Yoki Hardiansyah",
    "role": "ortu",
    "phone": "81273016348",
    "avatar_url": "",
    "created_at": "2026-08-17T15:32:53.815Z",
    "password_hash": "48dd73efceccc2c2dbd42d540b337b1f701f0e97b286b185d4c405dc7ea4d9fa",
    "status_aktif": true
  }
];

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

export const initialStudents: Student[] = [
  {
    "id": "SIS-1778057445540-50",
    "full_name": "ALVARO FERNANDES",
    "dob": "2016-09-24",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-89683125124",
    "phone": "89683125124",
    "photo_url": "",
    "join_date": "2026-05-06",
    "current_belt": "Coklat Muda",
    "status": "active",
    "nik": "1871131810140002",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kata",
    "parent_name": "ADES SRI RAHMAT",
    "parent_job": "WIRASWASTA",
    "weight": 30,
    "height": 135,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778211906616-1",
    "full_name": "AGA WIJAYA",
    "dob": "2019-06-04",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-82175720671",
    "phone": "82175720671",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Kuning",
    "status": "active",
    "nik": "1809010406190003",
    "birth_place": "TAMAN SARI",
    "specialization": "Kumite",
    "parent_name": "AAN WIJAYA",
    "parent_job": "WIRASWASTA",
    "weight": 24,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778212078832-72",
    "full_name": "ANISA RAFANDA MALIK",
    "dob": "2015-10-11",
    "gender": "Perempuan",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-89606105583",
    "phone": "89606105583",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Biru Muda",
    "status": "active",
    "nik": "1809015110150003",
    "birth_place": "SUKABANJAR",
    "specialization": "Kata",
    "parent_name": "ABDUL MALIK",
    "parent_job": "BURUH",
    "weight": 33,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778212218903-61",
    "full_name": "BOBBY FATA HAMMADANI",
    "dob": "2014-12-19",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-85369002428",
    "phone": "85369002428",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Coklat Muda",
    "status": "active",
    "nik": "1806031912140001",
    "birth_place": "WONOSOBO",
    "specialization": "Kumite",
    "parent_name": "ANGGA FRANATA",
    "parent_job": "KARYAWAN SWASTA",
    "weight": 30,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778212339004-13",
    "full_name": "M. FATHAN KHAIZURAN YASIN",
    "dob": "2017-04-01",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-82269175004",
    "phone": "82269175004",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Hijau",
    "status": "active",
    "nik": "1809010104170002",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "MUHTAMAR YASIN",
    "parent_job": "SWASTA",
    "weight": 28,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778212596269-18",
    "full_name": "M. FATHIH KHAIZURAN YASIN",
    "dob": "2017-04-01",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-82269175004",
    "phone": "82269175004",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Hijau",
    "status": "active",
    "nik": "1809010104170003",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "MUHTAMAR YASIN",
    "parent_job": "SWASTA",
    "weight": 24,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778212769328-7",
    "full_name": "FEYZA HAMIZAN DZIAULHAQ",
    "dob": "2016-03-26",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-82187811232",
    "phone": "82187811232",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Biru Muda",
    "status": "active",
    "nik": "1871102603160002",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "HAMAMI, S.E.",
    "parent_job": "PNS",
    "weight": 31,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778213178621-21",
    "full_name": "HILAL DZAKIBANU ISMAYYNA",
    "dob": "2015-10-12",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-81367362161",
    "phone": "81367362161",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Biru Muda",
    "status": "active",
    "nik": "0",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "HERY ISMAYANTO",
    "parent_job": "PNS",
    "weight": 28,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778213336549-67",
    "full_name": "IRHAB NABIL AMZAN",
    "dob": "2015-12-26",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-895367300262",
    "phone": "895367300262",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Biru Muda",
    "status": "active",
    "nik": "1809012612150001",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "SEP AAN ANSORI, S.T",
    "parent_job": "SWASTA",
    "weight": 29,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778213475366-31",
    "full_name": "KIANIA ANINDITA",
    "dob": "2014-10-10",
    "gender": "Perempuan",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-82178028198",
    "phone": "82178028198",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Coklat Muda",
    "status": "active",
    "nik": "1871135010140005",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "ESTI",
    "parent_job": "KARIAWAN SWASTA",
    "weight": 46,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778213617071-48",
    "full_name": "MUHAMMAD RADINKA TSAQIB",
    "dob": "2016-02-24",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-82278301866",
    "phone": "82278301866",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Biru Tua",
    "status": "active",
    "nik": "1809052402160001",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "FITRA EKA MARTA",
    "parent_job": "PEGAWAI BUMD",
    "weight": 49,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778213744325-45",
    "full_name": "EL RAFIF NAUFALLINO RAMADHAN",
    "dob": "2014-07-05",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-82282113331",
    "phone": "82282113331",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Coklat Muda",
    "status": "active",
    "nik": "1814000050714001",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "MINARNO/LISA",
    "parent_job": "WIRASWASTA",
    "weight": 70,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778213958700-34",
    "full_name": "PUTRI KHADIJAH NUR SALIHAH",
    "dob": "2015-03-25",
    "gender": "Perempuan",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-85353200056",
    "phone": "85353200056",
    "photo_url": "",
    "join_date": "2026-05-08",
    "current_belt": "Biru Tua",
    "status": "active",
    "nik": "1809016503150002",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "ALMAIDAH Spd",
    "parent_job": "IRT",
    "weight": 27,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778335392062-22",
    "full_name": "NOUVAL SAKHI ZAIDAN",
    "dob": "2015-02-13",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-82183910377",
    "phone": "82183910377",
    "photo_url": "",
    "join_date": "2026-05-09",
    "current_belt": "Coklat Muda",
    "status": "active",
    "nik": "1871131302150003",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kata",
    "parent_name": "ZAIDAN ANANDO",
    "parent_job": "PEGAWAI SWASTA",
    "weight": 30,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778335584224-36",
    "full_name": "SULTAN IBRAHIM KUSUMA",
    "dob": "2015-03-30",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-81374456989",
    "phone": "81374456989",
    "photo_url": "",
    "join_date": "2026-05-09",
    "current_belt": "Coklat Muda",
    "status": "active",
    "nik": "1871131303150002",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "ADY",
    "parent_job": "POLRI",
    "weight": 29,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1778335763680-48",
    "full_name": "AZZAM ALFARIZKI YOSATA",
    "dob": "2016-09-24",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-85896876108",
    "phone": "85896876108",
    "photo_url": "",
    "join_date": "2026-05-09",
    "current_belt": "Hijau",
    "status": "active",
    "nik": "1803012409160003",
    "birth_place": "BANDAR LAMPUNG",
    "specialization": "Kumite",
    "parent_name": "YOGI YOSATA",
    "parent_job": "KARYAWAN SWASTA",
    "weight": 45,
    "height": 100,
    "medical_history": "NONE"
  },
  {
    "id": "SIS-1779089359268-56",
    "full_name": "MADA DZAKIANDRA ARTHANABIL",
    "dob": "2017-05-15",
    "gender": "Laki-laki",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-8112717400",
    "phone": "8112717400",
    "photo_url": "",
    "join_date": "2026-05-18",
    "current_belt": "Hijau",
    "status": "active",
    "nik": "1809011505170003",
    "birth_place": "PRINGSEWU",
    "specialization": "Kata",
    "parent_name": "YAYAN SUDIBYO",
    "parent_job": "PERAWAT",
    "weight": 23,
    "height": 100,
    "medical_history": "-"
  },
  {
    "id": "SIS-1780374619484-40",
    "full_name": "Inara Athifa Hardiansyah",
    "dob": "2015-04-15",
    "gender": "Perempuan",
    "address": "Alamat tidak dispesifikasi",
    "parent_id": "parent-81273016348",
    "phone": "81273016348",
    "photo_url": "",
    "join_date": "2026-06-02",
    "current_belt": "Biru Tua",
    "status": "active",
    "nik": "1809015904150002",
    "birth_place": "DAMC",
    "specialization": "Kata",
    "parent_name": "M Yoki Hardiansyah",
    "parent_job": "Wiraswasta",
    "weight": 34,
    "height": 100,
    "medical_history": "none"
  }
];

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

export const initialFees: Fee[] = [
  {
    "id": "PAY-1778214014890-59",
    "student_id": "SIS-1778212769328-7",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-08",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1778215102495-51",
    "student_id": "SIS-1778212218903-61",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-08",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1778226727180-88",
    "student_id": "SIS-1778211906616-1",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-08",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1778323531223-28",
    "student_id": "SIS-1778213617071-48",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-09",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1778323551488-48",
    "student_id": "SIS-1778213744325-45",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-09",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1778334917388-23",
    "student_id": "SIS-1778213475366-31",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-09",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1778334950866-7",
    "student_id": "SIS-1778213475366-31",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-09",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1778336027874-4",
    "student_id": "SIS-1778335584224-36",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-09",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1779092198454-97",
    "student_id": "SIS-1779089359268-56",
    "period_month": 5,
    "period_year": 2026,
    "amount": 10000,
    "status": "lunas",
    "paid_date": "2026-05-18",
    "payment_method": "tunai",
    "notes": "kurang 10000"
  },
  {
    "id": "PAY-1779268402087-8",
    "student_id": "SIS-1778212078832-72",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-20",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1779268442444-22",
    "student_id": "SIS-1778212078832-72",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-20",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1779272759746-94",
    "student_id": "SIS-1778213178621-21",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-20",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1779272779198-26",
    "student_id": "SIS-1778213336549-67",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-20",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1780136450969-30",
    "student_id": "SIS-1778212339004-13",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-30",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1780136468522-22",
    "student_id": "SIS-1778212596269-18",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-05-30",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1780799739617-72",
    "student_id": "SIS-1778335392062-22",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-06-07",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1781669093397-90",
    "student_id": "SIS-1778057445540-50",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-06-17",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1781669139891-99",
    "student_id": "SIS-1778213958700-34",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-06-17",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1781669185995-0",
    "student_id": "SIS-1778057445540-50",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-06-17",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1781669207507-38",
    "student_id": "SIS-1778213958700-34",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-06-17",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1781774007975-49",
    "student_id": "SIS-1780374619484-40",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-06-18",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1781774048989-66",
    "student_id": "SIS-1780374619484-40",
    "period_month": 5,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-06-18",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1781825703219-46",
    "student_id": "SIS-1778213336549-67",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-06-19",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1781879603129-36",
    "student_id": "SIS-1778213178621-21",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-06-19",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1781947171951-26",
    "student_id": "SIS-1778212339004-13",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-06-20",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1783483663466-13",
    "student_id": "SIS-1778213958700-34",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-07-08",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1783483760179-98",
    "student_id": "SIS-1778335392062-22",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-07-08",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1784032761843-12",
    "student_id": "SIS-1778335584224-36",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-07-14",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1784032781977-0",
    "student_id": "SIS-1778335584224-36",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-07-14",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1784699863228-76",
    "student_id": "SIS-1778212218903-61",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-07-22",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1784699885037-10",
    "student_id": "SIS-1778212218903-61",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-07-22",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1785132905026-10",
    "student_id": "SIS-1778212769328-7",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-07-27",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1785132931322-27",
    "student_id": "SIS-1778335763680-48",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-07-27",
    "payment_method": "tunai",
    "notes": "Tunai"
  },
  {
    "id": "PAY-1785735071592-63",
    "student_id": "SIS-1778212078832-72",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1785735852326-44",
    "student_id": "SIS-1778211906616-1",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1785735868341-6",
    "student_id": "SIS-1778211906616-1",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1785735888926-10",
    "student_id": "SIS-1778211906616-1",
    "period_month": 8,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1785735980673-53",
    "student_id": "SIS-1778213744325-45",
    "period_month": 8,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "TF"
  },
  {
    "id": "PAY-1785736015842-97",
    "student_id": "SIS-1778213744325-45",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1785736210605-12",
    "student_id": "SIS-1778212339004-13",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1785736220136-42",
    "student_id": "SIS-1778212596269-18",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1785736249038-33",
    "student_id": "SIS-1778212596269-18",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1785736385213-68",
    "student_id": "SIS-1778057445540-50",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "tunai",
    "notes": "Cash"
  },
  {
    "id": "PAY-1785736607012-74",
    "student_id": "SIS-1778213617071-48",
    "period_month": 6,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "tunai",
    "notes": "Cash"
  },
  {
    "id": "PAY-1785736719983-26",
    "student_id": "SIS-1778213336549-67",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "tunai",
    "notes": "Cash"
  },
  {
    "id": "PAY-1785736978737-93",
    "student_id": "SIS-1778335392062-22",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1785737542531-26",
    "student_id": "SIS-1778335392062-22",
    "period_month": 8,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1785737565170-60",
    "student_id": "SIS-1778335392062-22",
    "period_month": 9,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1785739703198-86",
    "student_id": "SIS-1778213475366-31",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-03",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1786191708651-16",
    "student_id": "SIS-1780374619484-40",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-08",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1786191730848-92",
    "student_id": "SIS-1780374619484-40",
    "period_month": 8,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-08",
    "payment_method": "transfer",
    "notes": "Tf"
  },
  {
    "id": "PAY-1786191791465-65",
    "student_id": "SIS-1779089359268-56",
    "period_month": 7,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-08",
    "payment_method": "tunai",
    "notes": "Cash"
  },
  {
    "id": "PAY-1786191812639-91",
    "student_id": "SIS-1779089359268-56",
    "period_month": 8,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-08",
    "payment_method": "tunai",
    "notes": "Cash"
  },
  {
    "id": "PAY-1786191907113-6",
    "student_id": "SIS-1778335763680-48",
    "period_month": 8,
    "period_year": 2026,
    "amount": 20000,
    "status": "lunas",
    "paid_date": "2026-08-08",
    "payment_method": "tunai",
    "notes": "Cash"
  }
];

export const initialFinanceTransactions: FinanceTransaction[] = [
  {
    "id": "tx-rent",
    "type": "pengeluaran",
    "category": "sewa",
    "amount": 500000,
    "transaction_date": "2026-05-01",
    "description": "Sewa Aula Latihan Bulanan",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1778214014890-59",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-08",
    "description": "Iuran Bulan 5/2026 - FEYZA HAMIZAN DZIAULHAQ",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1778215102495-51",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-08",
    "description": "Iuran Bulan 5/2026 - BOBBY FATA HAMMADANI",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1778226727180-88",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-08",
    "description": "Iuran Bulan 5/2026 - AGA WIJAYA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1778323531223-28",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-09",
    "description": "Iuran Bulan 5/2026 - MUHAMMAD RADINKA TSAQIB",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1778323551488-48",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-09",
    "description": "Iuran Bulan 5/2026 - EL RAFIF NAUFALLINO RAMADHAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1778334917388-23",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-09",
    "description": "Iuran Bulan 5/2026 - KIANIA ANINDITA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1778334950866-7",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-09",
    "description": "Iuran Bulan 6/2026 - KIANIA ANINDITA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1778336027874-4",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-09",
    "description": "Iuran Bulan 5/2026 - SULTAN IBRAHIM KUSUMA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1779092198454-97",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 10000,
    "transaction_date": "2026-05-18",
    "description": "Iuran Bulan 5/2026 - MADA DZAKIANDRA ARTHANABIL",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1779268402087-8",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-20",
    "description": "Iuran Bulan 5/2026 - ANISA RAFANDA MALIK",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1779268442444-22",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-20",
    "description": "Iuran Bulan 6/2026 - ANISA RAFANDA MALIK",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1779272759746-94",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-20",
    "description": "Iuran Bulan 5/2026 - HILAL DZAKIBANU ISMAYYNA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1779272779198-26",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-20",
    "description": "Iuran Bulan 5/2026 - IRHAB NABIL AMZAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1780136450969-30",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-30",
    "description": "Iuran Bulan 5/2026 - M. FATHAN KHAIZURAN YASIN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1780136468522-22",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-05-30",
    "description": "Iuran Bulan 5/2026 - M. FATHIH KHAIZURAN YASIN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1780799739617-72",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-06-07",
    "description": "Iuran Bulan 5/2026 - NOUVAL SAKHI ZAIDAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1781669093397-90",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-06-17",
    "description": "Iuran Bulan 5/2026 - ALVARO FERNANDES",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1781669139891-99",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-06-17",
    "description": "Iuran Bulan 5/2026 - PUTRI KHADIJAH NUR SALIHAH",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1781669185995-0",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-06-17",
    "description": "Iuran Bulan 6/2026 - ALVARO FERNANDES",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1781669207507-38",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-06-17",
    "description": "Iuran Bulan 6/2026 - PUTRI KHADIJAH NUR SALIHAH",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1781774007975-49",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-06-18",
    "description": "Iuran Bulan 6/2026 - Inara Athifa Hardiansyah",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1781774048989-66",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-06-18",
    "description": "Iuran Bulan 5/2026 - Inara Athifa Hardiansyah",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1781825703219-46",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-06-19",
    "description": "Iuran Bulan 6/2026 - IRHAB NABIL AMZAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1781879603129-36",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-06-19",
    "description": "Iuran Bulan 6/2026 - HILAL DZAKIBANU ISMAYYNA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1781947171951-26",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-06-20",
    "description": "Iuran Bulan 6/2026 - M. FATHAN KHAIZURAN YASIN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1783483663466-13",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-07-08",
    "description": "Iuran Bulan 7/2026 - PUTRI KHADIJAH NUR SALIHAH",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1783483760179-98",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-07-08",
    "description": "Iuran Bulan 6/2026 - NOUVAL SAKHI ZAIDAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1784032761843-12",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-07-14",
    "description": "Iuran Bulan 6/2026 - SULTAN IBRAHIM KUSUMA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1784032781977-0",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-07-14",
    "description": "Iuran Bulan 7/2026 - SULTAN IBRAHIM KUSUMA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1784699863228-76",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-07-22",
    "description": "Iuran Bulan 6/2026 - BOBBY FATA HAMMADANI",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1784699885037-10",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-07-22",
    "description": "Iuran Bulan 7/2026 - BOBBY FATA HAMMADANI",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785132905026-10",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-07-27",
    "description": "Iuran Bulan 7/2026 - FEYZA HAMIZAN DZIAULHAQ",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785132931322-27",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-07-27",
    "description": "Iuran Bulan 7/2026 - AZZAM ALFARIZKI YOSATA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785735071592-63",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 7/2026 - ANISA RAFANDA MALIK",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785735852326-44",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 6/2026 - AGA WIJAYA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785735868341-6",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 7/2026 - AGA WIJAYA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785735888926-10",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 8/2026 - AGA WIJAYA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785735980673-53",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 8/2026 - EL RAFIF NAUFALLINO RAMADHAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785736015842-97",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 7/2026 - EL RAFIF NAUFALLINO RAMADHAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785736210605-12",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 7/2026 - M. FATHAN KHAIZURAN YASIN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785736220136-42",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 7/2026 - M. FATHIH KHAIZURAN YASIN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785736249038-33",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 6/2026 - M. FATHIH KHAIZURAN YASIN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785736385213-68",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 7/2026 - ALVARO FERNANDES",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785736607012-74",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 6/2026 - MUHAMMAD RADINKA TSAQIB",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785736719983-26",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 7/2026 - IRHAB NABIL AMZAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785736978737-93",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 7/2026 - NOUVAL SAKHI ZAIDAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785737542531-26",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 8/2026 - NOUVAL SAKHI ZAIDAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785737565170-60",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 9/2026 - NOUVAL SAKHI ZAIDAN",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1785739703198-86",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-03",
    "description": "Iuran Bulan 7/2026 - KIANIA ANINDITA",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1786191708651-16",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-08",
    "description": "Iuran Bulan 7/2026 - Inara Athifa Hardiansyah",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1786191730848-92",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-08",
    "description": "Iuran Bulan 8/2026 - Inara Athifa Hardiansyah",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1786191791465-65",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-08",
    "description": "Iuran Bulan 7/2026 - MADA DZAKIANDRA ARTHANABIL",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1786191812639-91",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-08",
    "description": "Iuran Bulan 8/2026 - MADA DZAKIANDRA ARTHANABIL",
    "created_by": "user-owner-id"
  },
  {
    "id": "tx-PAY-1786191907113-6",
    "type": "pemasukan",
    "category": "iuran",
    "amount": 20000,
    "transaction_date": "2026-08-08",
    "description": "Iuran Bulan 8/2026 - AZZAM ALFARIZKI YOSATA",
    "created_by": "user-owner-id"
  }
];


export const initialRegistrations: Registration[] = [];

export const initialNotifications: Notification[] = [];

export const initialAttendanceStudents: StudentAttendance[] = [
  {
    "id": "ABS-1778336083375-6",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336083621-11",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336083869-67",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336084136-31",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336084403-8",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336084636-43",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336084887-98",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336085131-21",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336085385-46",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336085640-8",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336085896-47",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336086157-15",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336086463-15",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336086710-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336087314-36",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1778336087607-41",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-09",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779272998702-73",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779272998807-14",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779272999095-18",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779272999219-75",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779272999598-21",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779272999961-76",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273000197-66",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273000341-13",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273000480-10",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273001233-54",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273001465-49",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273001602-47",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273001843-22",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273001984-39",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273002204-51",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273002346-86",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779273002568-0",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-05-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779445549455-79",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779445549628-28",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779445550755-6",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.817Z"
  },
  {
    "id": "ABS-1779445551676-34",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445551880-34",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445552084-39",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445552299-93",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445552505-13",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445552709-65",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445552914-31",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445553117-21",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445553318-23",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445553502-74",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445553700-72",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445553891-75",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445554091-46",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1779445554312-88",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-05-22",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376066562-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376066757-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376066948-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376067359-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376067558-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376068638-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376068838-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376069109-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376069305-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376069536-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376069726-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376069983-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376070167-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376070364-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376070569-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376070754-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376072164-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376072360-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-05-06",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376149437-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376149633-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376149817-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376150018-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376150206-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376150400-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376150583-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376150773-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376150972-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376151175-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376151370-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376151572-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376152051-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376152249-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376152448-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376152636-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376152811-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376152997-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-05-13",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376207099-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376207365-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376207624-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376207888-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376208697-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376208985-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376209239-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376209511-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376209770-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376210053-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376210322-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376210611-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376210895-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376211179-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376212101-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376212387-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376212645-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376212910-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-05-15",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376273891-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376274109-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376274300-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376274504-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376274713-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376274924-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376275143-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376275354-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376275579-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376275806-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376276003-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376276211-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376276405-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376276605-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376276790-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376276978-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376277172-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376277364-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-05-02",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376337264-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376337559-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376337866-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376338128-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376338395-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376338665-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376339387-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376339625-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376339880-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376340160-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376340434-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376340704-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376340997-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376341252-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376341503-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376341781-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376342412-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780376342667-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-05-30",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746476361-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746476497-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746477104-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746477288-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746477447-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746477604-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746477766-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746477934-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746478119-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746478290-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746478456-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746478626-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746478809-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746478957-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746479137-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746479298-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746479458-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1780746479614-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-06-06",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670548322-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670548494-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670549335-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670550141-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670550361-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670550578-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670550821-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670551039-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670551250-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670551470-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670551669-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670551876-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670552092-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670552293-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670552522-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670552757-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670552982-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781670553232-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-06-16",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951408825-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951408943-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951409119-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951409781-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951410703-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951411303-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951411446-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951411604-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951411745-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951431065-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951431212-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951431353-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951431910-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951432047-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951432492-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951432641-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951432779-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1781951432916-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-06-20",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297336129-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297336295-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297337466-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297337637-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297337822-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297337999-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297338179-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297338350-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297338529-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297338704-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297338884-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297339060-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297339253-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297339432-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297339616-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297339787-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297340589-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1782297340771-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-06-24",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1783160570949-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1783160571093-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1783160572007-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1783160572172-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1783160572336-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1783160572494-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.818Z"
  },
  {
    "id": "ABS-1783160572660-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160572808-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160572965-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160573868-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160574042-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160574232-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160574404-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160574604-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160574770-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160575294-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160575493-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1783160575663-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-07-04",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133050033-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133050197-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133050843-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133051907-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133052102-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133052269-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133052456-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133052636-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133052811-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133052981-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133053146-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133053379-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133053550-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133053725-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133053914-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133054095-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133054279-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133054456-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-07-25",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133220219-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133220356-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133220543-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133220716-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133220869-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133221036-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133221185-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133221638-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133221787-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133221944-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133222103-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133222252-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133222405-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133222550-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133222694-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133222868-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133223025-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785133223183-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-07-18",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673362937-0",
    "student_id": "SIS-1778057445540-50",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673363053-1",
    "student_id": "SIS-1778211906616-1",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673363877-2",
    "student_id": "SIS-1778212078832-72",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673364061-3",
    "student_id": "SIS-1778212218903-61",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673365162-4",
    "student_id": "SIS-1778212339004-13",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673365299-5",
    "student_id": "SIS-1778212596269-18",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "izin",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673365433-6",
    "student_id": "SIS-1778212769328-7",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673365559-7",
    "student_id": "SIS-1778213178621-21",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673365685-8",
    "student_id": "SIS-1778213336549-67",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673365817-9",
    "student_id": "SIS-1778213475366-31",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673365939-10",
    "student_id": "SIS-1778213617071-48",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673366068-11",
    "student_id": "SIS-1778213744325-45",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673366683-12",
    "student_id": "SIS-1778213958700-34",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673366823-13",
    "student_id": "SIS-1778335392062-22",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673366967-14",
    "student_id": "SIS-1778335584224-36",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673367088-15",
    "student_id": "SIS-1778335763680-48",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "alpha",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673367215-16",
    "student_id": "SIS-1779089359268-56",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  },
  {
    "id": "ABS-1785673367348-17",
    "student_id": "SIS-1780374619484-40",
    "class_id": "class-anak-id",
    "session_date": "2026-07-31",
    "status": "hadir",
    "marked_by": "pelatih",
    "created_at": "2026-08-17T15:32:53.819Z"
  }
];

export const initialBeltExams: BeltExam[] = [
  {
    "id": "EVT-1778034887573",
    "exam_date": "2026-05-24",
    "location": "Pringsewu",
    "fee": 250000,
    "status": "selesai",
    "notes": "UPT SDN2 BANYU URIP, BANYUMAS, PRINGSEWU"
  }
];

export const initialExamParticipants: ExamParticipant[] = [
  {
    "id": "REG-1780379661396-SIS-1778212339004-13",
    "exam_id": "EVT-1778034887573",
    "student_id": "SIS-1778212339004-13",
    "current_belt": "Kuning",
    "target_belt": "Hijau",
    "result": "lulus",
    "score_notes": ""
  },
  {
    "id": "REG-1780379661397-SIS-1778212596269-18",
    "exam_id": "EVT-1778034887573",
    "student_id": "SIS-1778212596269-18",
    "current_belt": "Kuning",
    "target_belt": "Hijau",
    "result": "lulus",
    "score_notes": ""
  },
  {
    "id": "REG-1780379661398-SIS-1778213617071-48",
    "exam_id": "EVT-1778034887573",
    "student_id": "SIS-1778213617071-48",
    "current_belt": "Biru Muda",
    "target_belt": "Biru Tua",
    "result": "lulus",
    "score_notes": ""
  },
  {
    "id": "REG-1780379661399-SIS-1778213744325-45",
    "exam_id": "EVT-1778034887573",
    "student_id": "SIS-1778213744325-45",
    "current_belt": "Biru Tua",
    "target_belt": "Coklat Muda",
    "result": "lulus",
    "score_notes": ""
  },
  {
    "id": "REG-1780379661400-SIS-1778213958700-34",
    "exam_id": "EVT-1778034887573",
    "student_id": "SIS-1778213958700-34",
    "current_belt": "Biru Muda",
    "target_belt": "Biru Tua",
    "result": "lulus",
    "score_notes": ""
  },
  {
    "id": "REG-1780379661401-SIS-1778335763680-48",
    "exam_id": "EVT-1778034887573",
    "student_id": "SIS-1778335763680-48",
    "current_belt": "Kuning",
    "target_belt": "Hijau",
    "result": "lulus",
    "score_notes": ""
  },
  {
    "id": "REG-1780379661402-SIS-1779089359268-56",
    "exam_id": "EVT-1778034887573",
    "student_id": "SIS-1779089359268-56",
    "current_belt": "Kuning",
    "target_belt": "Hijau",
    "result": "lulus",
    "score_notes": ""
  },
  {
    "id": "REG-1780380037770-SIS-1780374619484-40",
    "exam_id": "EVT-1778034887573",
    "student_id": "SIS-1780374619484-40",
    "current_belt": "Biru Muda",
    "target_belt": "Biru Tua",
    "result": "lulus",
    "score_notes": ""
  }
];

export const initialTournaments: Tournament[] = [
  {
    "id": "EVT-1778141585703-82",
    "name": "Piala Presiden 2026",
    "tournament_date": "2026-06-26",
    "location": "GSG UNILA",
    "level": "lokal",
    "organizer": "Pengprov KKI"
  },
  {
    "id": "EVT-1782877759461-28",
    "name": "LSO (LAMPUNG STUDENT OLIMPIC) 31 JULI - 2 AGUSTUS",
    "tournament_date": "2026-07-31",
    "location": "Gor Siger",
    "level": "lokal",
    "organizer": "Pengprov KKI"
  }
];

export const initialTournamentParticipants: TournamentParticipant[] = [
  {
    "id": "REG-1780380702369-SIS-1778057445540-50",
    "tournament_id": "EVT-1778141585703-82",
    "student_id": "SIS-1778057445540-50",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1780380702370-SIS-1778212078832-72",
    "tournament_id": "EVT-1778141585703-82",
    "student_id": "SIS-1778212078832-72",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1780380702371-SIS-1778212218903-61",
    "tournament_id": "EVT-1778141585703-82",
    "student_id": "SIS-1778212218903-61",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1780380702372-SIS-1778213178621-21",
    "tournament_id": "EVT-1778141585703-82",
    "student_id": "SIS-1778213178621-21",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1780380702373-SIS-1778213336549-67",
    "tournament_id": "EVT-1778141585703-82",
    "student_id": "SIS-1778213336549-67",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1780380702374-SIS-1778213475366-31",
    "tournament_id": "EVT-1778141585703-82",
    "student_id": "SIS-1778213475366-31",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1780380702375-SIS-1778213617071-48",
    "tournament_id": "EVT-1778141585703-82",
    "student_id": "SIS-1778213617071-48",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1780380702376-SIS-1778213958700-34",
    "tournament_id": "EVT-1778141585703-82",
    "student_id": "SIS-1778213958700-34",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363523-SIS-1778057445540-50",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778057445540-50",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363524-SIS-1778211906616-1",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778211906616-1",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363525-SIS-1778212078832-72",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778212078832-72",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363526-SIS-1778212218903-61",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778212218903-61",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363527-SIS-1778213178621-21",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778213178621-21",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363528-SIS-1778213336549-67",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778213336549-67",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363529-SIS-1778213475366-31",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778213475366-31",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363530-SIS-1778213617071-48",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778213617071-48",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363531-SIS-1778213958700-34",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778213958700-34",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363532-SIS-1778335392062-22",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778335392062-22",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363533-SIS-1778335584224-36",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1778335584224-36",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  },
  {
    "id": "REG-1784761363534-SIS-1780374619484-40",
    "tournament_id": "EVT-1782877759461-28",
    "student_id": "SIS-1780374619484-40",
    "category": "kata",
    "weight_class": "",
    "result": "-",
    "medal": "none"
  }
];

export const initialClassStudents: ClassStudentEnrollment[] = [
  { id: 'cs-1', class_id: 'class-anak-id', student_id: 'SIS-1778057445540-50', enrolled_at: '2026-05-06' },
  { id: 'cs-2', class_id: 'class-anak-id', student_id: 'SIS-1778211906616-1', enrolled_at: '2026-05-08' },
  { id: 'cs-3', class_id: 'class-anak-id', student_id: 'SIS-1778212078832-72', enrolled_at: '2026-05-08' },
  { id: 'cs-4', class_id: 'class-anak-id', student_id: 'SIS-1778212218903-61', enrolled_at: '2026-05-08' },
  { id: 'cs-5', class_id: 'class-anak-id', student_id: 'SIS-1778212339004-13', enrolled_at: '2026-05-08' },
  { id: 'cs-6', class_id: 'class-anak-id', student_id: 'SIS-1778212596269-18', enrolled_at: '2026-05-08' },
  { id: 'cs-7', class_id: 'class-anak-id', student_id: 'SIS-1778212769328-7', enrolled_at: '2026-05-08' },
  { id: 'cs-8', class_id: 'class-anak-id', student_id: 'SIS-1778213178621-21', enrolled_at: '2026-05-08' },
  { id: 'cs-9', class_id: 'class-anak-id', student_id: 'SIS-1778213336549-67', enrolled_at: '2026-05-08' },
  { id: 'cs-10', class_id: 'class-anak-id', student_id: 'SIS-1778213475366-31', enrolled_at: '2026-05-08' },
  { id: 'cs-11', class_id: 'class-kompetisi-id', student_id: 'SIS-1778213617071-48', enrolled_at: '2026-05-08' },
  { id: 'cs-12', class_id: 'class-kompetisi-id', student_id: 'SIS-1778213744325-45', enrolled_at: '2026-05-08' },
  { id: 'cs-13', class_id: 'class-kompetisi-id', student_id: 'SIS-1778213958700-34', enrolled_at: '2026-05-08' },
  { id: 'cs-14', class_id: 'class-kompetisi-id', student_id: 'SIS-1778335392062-22', enrolled_at: '2026-05-09' },
  { id: 'cs-15', class_id: 'class-kompetisi-id', student_id: 'SIS-1778335584224-36', enrolled_at: '2026-05-09' },
  { id: 'cs-16', class_id: 'class-kompetisi-id', student_id: 'SIS-1778335763680-48', enrolled_at: '2026-05-09' },
  { id: 'cs-17', class_id: 'class-kompetisi-id', student_id: 'SIS-1779089359268-56', enrolled_at: '2026-05-18' },
  { id: 'cs-18', class_id: 'class-kompetisi-id', student_id: 'SIS-1780374619484-40', enrolled_at: '2026-06-02' }
];

export const initialCurriculumMaterials: CurriculumMaterial[] = [
  {
    id: 'mat-1',
    belt_level: 'Putih',
    category: 'Kihon',
    title: 'Dachi (Sikap Kuda-kuda)',
    description: 'Menguasai Zenkutsu-dachi, Kokutsu-dachi, dan Kiba-dachi dengan stabil.',
    checklist_items: ['Zenkutsu-dachi (Kuda-kuda depan)', 'Kokutsu-dachi (Kuda-kuda belakang)', 'Kiba-dachi (Kuda-kuda penunggang kuda)']
  },
  {
    id: 'mat-2',
    belt_level: 'Putih',
    category: 'Kata',
    title: 'Heian Shodan',
    description: 'Kata dasar pertama Karate Kushin Ryu / Shotokan.',
    video_url: 'https://www.youtube.com/watch?v=gCO5aU_Q2pM',
    checklist_items: ['Gerakan 1-10 dengan benar', 'Gerakan 11-21 dengan benar', 'Kiai pada gerakan 9 dan 21']
  },
  {
    id: 'mat-3',
    belt_level: 'Kuning',
    category: 'Kihon',
    title: 'Tsuki & Geri (Pukulan & Tendangan)',
    description: 'Oi-tsuki, Gyaku-tsuki, Mae-geri Keage.',
    checklist_items: ['Gyaku-tsuki di tempat', 'Mae-geri dengan snap balik kaki', 'Kombinasi langkah depan + pukulan']
  },
  {
    id: 'mat-4',
    belt_level: 'Kuning',
    category: 'Kata',
    title: 'Heian Nidan',
    description: 'Kata dasar kedua Karate dengan teknik bertahan tingkat menengah.',
    video_url: 'https://www.youtube.com/watch?v=p0Z3tD1F8_8',
    checklist_items: ['Teknik Gyaku-hanmi', 'Yoko-geri Keage + Uraken Uchi', 'Kiai pada gerakan 10 dan 26']
  },
  {
    id: 'mat-5',
    belt_level: 'Hijau',
    category: 'Kumite',
    title: 'Gohon Kumite',
    description: 'Latihan tanding 5 langkah dasar menyerang dan bertahan.',
    checklist_items: ['Langkah serang Jodan Tsuki', 'Tangkisan Age-uke + Gyaku-tsuki konter', 'Timing dan jarak (Ma-ai) yang tepat']
  }
];
