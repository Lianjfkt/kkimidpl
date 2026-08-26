# Dojo KKI DPL Manager — Full System Planning

**Dojo**: KKI DPL (Kushin Ryu M Karate-do Indonesia)
**Stack**: Next.js (Vercel) + Supabase (PostgreSQL + Auth + RLS)
**Lokasi**: 1 lokasi
**Role akses**: Owner, Pelatih, Ortu/Siswa
**Notifikasi**: In-app saja (tanpa WhatsApp/Email di fase awal)

---

## 1. Modul Utama

1. **Manajemen Iuran & Finance** — pencatatan iuran bulanan siswa, tracking pemasukan/pengeluaran dojo, laporan keuangan
2. **Absensi** — siswa dan pelatih (terpisah, per sesi latihan)
3. **Pendaftaran** — siswa baru, data orang tua/wali, alur approval
4. **Ujian Kenaikan Sabuk (Grading)** — sesuai Geup System KKI
5. **Turnamen** — pendaftaran peserta, hasil, riwayat kompetisi

---

## 2. Skema Database (Supabase / PostgreSQL)

### `profiles`
Extend dari `auth.users` (Supabase Auth)
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid (PK, = auth.users.id) | |
| full_name | text | |
| role | text | `owner` \| `pelatih` \| `ortu` |
| phone | text | |
| avatar_url | text | |
| created_at | timestamptz | |

### `students` (siswa)
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| full_name | text | |
| dob | date | |
| gender | text | |
| address | text | |
| parent_id | uuid FK → profiles.id | akun ortu |
| phone | text | |
| photo_url | text | |
| join_date | date | |
| current_belt | text | Geup level saat ini |
| status | text | `active` \| `inactive` \| `pending` |

### `coaches` (pelatih)
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid FK → profiles.id | akun pelatih |
| full_name | text | |
| phone | text | |
| belt_level | text | Dan/tingkat pelatih |
| join_date | date | |
| honor_rate | numeric | tarif honor per sesi |

### `classes` (sesi/kelas latihan)
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| name | text | mis. "Kelas Anak Sore" |
| day_of_week | int | 0-6 |
| time_start | time | |
| time_end | time | |
| coach_id | uuid FK → coaches.id | |
| category | text | anak/remaja/kompetisi |

### `attendance_students`
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| student_id | uuid FK → students.id | |
| class_id | uuid FK → classes.id | |
| session_date | date | |
| status | text | `hadir` \| `izin` \| `sakit` \| `alpha` |
| marked_by | uuid FK → profiles.id | |
| created_at | timestamptz | |

### `attendance_coaches`
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| coach_id | uuid FK → coaches.id | |
| class_id | uuid FK → classes.id | |
| session_date | date | |
| status | text | `hadir` \| `izin` \| `sakit` \| `alpha` |
| created_at | timestamptz | |

### `fees` (iuran)
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| student_id | uuid FK → students.id | |
| period_month | int | 1-12 |
| period_year | int | |
| amount | numeric | |
| status | text | `lunas` \| `belum_lunas` \| `sebagian` |
| paid_date | date | nullable |
| payment_method | text | tunai/transfer/qris |
| notes | text | |

### `finance_transactions`
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| type | text | `pemasukan` \| `pengeluaran` |
| category | text | iuran/honor/sewa/peralatan/dll |
| amount | numeric | |
| transaction_date | date | |
| description | text | |
| created_by | uuid FK → profiles.id | |

### `belt_exams` (ujian kenaikan sabuk)
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| exam_date | date | |
| location | text | |
| fee | numeric | biaya ujian |
| status | text | `terjadwal` \| `selesai` \| `dibatalkan` |
| notes | text | |

### `exam_participants`
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| exam_id | uuid FK → belt_exams.id | |
| student_id | uuid FK → students.id | |
| current_belt | text | |
| target_belt | text | |
| result | text | `lulus` \| `tidak_lulus` \| `pending` |
| score_notes | text | |

### `tournaments`
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| name | text | |
| tournament_date | date | |
| location | text | |
| level | text | lokal/regional/nasional |
| organizer | text | |

### `tournament_participants`
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| tournament_id | uuid FK → tournaments.id | |
| student_id | uuid FK → students.id | |
| category | text | kata/kumite |
| weight_class | text | nullable (untuk kumite) |
| result | text | |
| medal | text | emas/perak/perunggu/none |

### `registrations` (pendaftaran calon siswa baru)
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| full_name | text | |
| dob | date | |
| parent_name | text | |
| parent_phone | text | |
| address | text | |
| status | text | `menunggu` \| `disetujui` \| `ditolak` |
| submitted_at | timestamptz | |
| reviewed_by | uuid FK → profiles.id | |

### `notifications` (in-app)
| Kolom | Tipe | Ket |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles.id | |
| title | text | |
| message | text | |
| type | text | iuran/ujian/turnamen/absensi/umum |
| is_read | boolean | default false |
| created_at | timestamptz | |

---

## 3. RLS Policy per Role

**Owner**
- Full read/write ke semua tabel.

**Pelatih**
- Read/write `attendance_students` & `attendance_coaches` hanya untuk `class_id` yang menjadi tanggung jawabnya.
- Read `students` yang tergabung di kelasnya.
- Read/write `belt_exams`, `exam_participants`, `tournaments`, `tournament_participants` (input hasil/nilai).
- Read `registrations` (tidak bisa approve — hanya owner).
- **Tidak** bisa akses `finance_transactions` dan `fees` (data keuangan dojo bersifat privat ke owner), kecuali owner ingin memberi akses lihat honor mereka sendiri.
- Read/write `notifications` milik sendiri.

**Ortu/Siswa**
- Read-only pada data anak sendiri: `students` (row miliknya via `parent_id`), `attendance_students`, `fees`, `exam_participants`, `tournament_participants`.
- Insert ke `registrations` (untuk daftar siswa baru).
- Read/write `notifications` milik sendiri (mark as read).
- Tidak ada akses ke data siswa lain atau data finance dojo.

> Implementasi teknis: gunakan `auth.uid()` dicocokkan dengan `profiles.id`, lalu policy `USING`/`WITH CHECK` merujuk ke `profiles.role` dan relasi FK (mis. `parent_id = auth.uid()` untuk ortu, `coach_id IN (SELECT id FROM coaches WHERE profile_id = auth.uid())` untuk pelatih).

---

## 4. Desain UI

Karena skill desain "Apple-style" milikmu tidak otomatis terbawa ke sesi ini, gunakan prinsip berikut sebagai baseline, lalu **tempelkan isi skill .md kamu langsung di bagian awal prompt Antigravity** supaya presisi:

- Whitespace lega, grid rapi, minim elemen dekoratif berlebihan
- Rounded corners konsisten (mis. 12–16px), subtle shadow (bukan flat/neubrutalism seperti project sebelumnya)
- Tipografi hierarki jelas (system font stack / SF Pro-like: Inter/SF Pro Display)
- Warna netral (putih/abu muda) dengan 1 aksen warna dojo (mis. merah/hitam khas karate)
- Komponen: card-based dashboard, bottom nav untuk mobile (ortu sering akses via HP), sidebar untuk desktop (owner/pelatih)

---

## 5. Role & Dashboard per Pengguna

| Role | Dashboard Utama |
|---|---|
| Owner | Ringkasan finance, status iuran bulan berjalan, jadwal ujian/turnamen mendatang, jumlah siswa aktif, approval pendaftaran baru |
| Pelatih | Jadwal kelas hari ini, absensi cepat (tap hadir/izin/sakit), daftar peserta ujian/turnamen kelasnya |
| Ortu/Siswa | Status iuran anak, riwayat absensi, progress sabuk, jadwal ujian/turnamen berikutnya, notifikasi |

---

## 6. Roadmap Pengembangan (7 Fase)

**Fase 1 — Setup, Auth & Struktur Dasar**
Setup project Next.js + Supabase, skema `profiles` + auth (email/password), role-based routing/middleware, layout dasar per role.

**Fase 2 — Data Inti: Siswa, Pelatih, Kelas**
CRUD `students`, `coaches`, `classes`. Owner bisa kelola semua; pelatih lihat kelasnya; ortu lihat data anak.

**Fase 3 — Modul Pendaftaran**
Form publik/ortu untuk `registrations`, approval flow oleh owner (approve → otomatis buat row di `students`).

**Fase 4 — Modul Absensi**
`attendance_students` & `attendance_coaches`, UI cepat untuk pelatih (tap per siswa), rekap bulanan.

**Fase 5 — Modul Iuran & Finance**
`fees` (generate tagihan bulanan otomatis per siswa aktif), update status bayar, `finance_transactions` untuk pemasukan/pengeluaran umum, laporan ringkas (grafik sederhana).

**Fase 6 — Modul Ujian & Turnamen**
`belt_exams` + `exam_participants` (input hasil kelulusan, update `current_belt` siswa otomatis saat lulus), `tournaments` + `tournament_participants` (hasil & medali).

**Fase 7 — Notifikasi, Dashboard Final & Polish**
`notifications` in-app (trigger otomatis: iuran jatuh tempo, jadwal ujian, hasil turnamen), dashboard ringkasan per role, responsive polish, deploy ke Vercel.

---

## 7. Antigravity Prompts (Copy-Paste per Fase)

### Prompt Fase 1 — Setup, Auth & Struktur Dasar
```
Buatkan project Next.js (App Router) yang terhubung ke Supabase untuk aplikasi "Dojo KKI DPL Manager".

Requirements:
1. Setup koneksi Supabase (env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).
2. Buat tabel `profiles` (id uuid PK = auth.users.id, full_name text, role text CHECK IN ('owner','pelatih','ortu'), phone text, avatar_url text, created_at timestamptz default now()).
3. Buat trigger Supabase agar setiap user baru di auth.users otomatis membuat row di `profiles` dengan role default 'ortu'.
4. Implementasikan auth dengan email/password (login, register, logout) menggunakan Supabase Auth.
5. Buat middleware/route protection: redirect user belum login ke /login, dan redirect otomatis ke dashboard sesuai role (/owner, /pelatih, /ortu) setelah login.
6. Buat layout dasar 3 varian dashboard kosong (owner, pelatih, ortu) dengan navigasi sidebar (desktop) dan bottom nav (mobile).
7. Desain: clean, whitespace lega, rounded corners 12-16px, subtle shadow, font Inter, warna netral putih/abu dengan aksen merah gelap khas karate.

[TEMPEL ISI SKILL DESAIN APPLE-STYLE KAMU DI SINI JIKA ADA]
```

### Prompt Fase 2 — Data Inti: Siswa, Pelatih, Kelas
```
Lanjutkan project Dojo KKI DPL Manager. Tambahkan modul data inti.

Requirements:
1. Buat tabel `students` (id, full_name, dob, gender, address, parent_id FK->profiles, phone, photo_url, join_date, current_belt, status).
2. Buat tabel `coaches` (id, profile_id FK->profiles, full_name, phone, belt_level, join_date, honor_rate).
3. Buat tabel `classes` (id, name, day_of_week, time_start, time_end, coach_id FK->coaches, category).
4. Implementasikan RLS: owner full akses; pelatih read siswa di kelasnya sendiri; ortu read hanya data anak sendiri (where parent_id = auth.uid()).
5. Buat halaman CRUD siswa & kelas untuk owner (tabel + form tambah/edit/hapus).
6. Buat halaman list kelas untuk pelatih (hanya kelas miliknya).
7. Buat halaman profil anak untuk ortu (read-only).
8. Gunakan komponen card & table yang konsisten dengan desain fase 1.
```

### Prompt Fase 3 — Modul Pendaftaran
```
Lanjutkan project Dojo KKI DPL Manager. Tambahkan modul pendaftaran siswa baru.

Requirements:
1. Buat tabel `registrations` (id, full_name, dob, parent_name, parent_phone, address, status CHECK IN ('menunggu','disetujui','ditolak'), submitted_at, reviewed_by FK->profiles).
2. Buat form pendaftaran yang bisa diakses ortu (atau publik) untuk submit calon siswa baru.
3. Buat halaman approval khusus owner: list pendaftaran status 'menunggu', tombol approve/reject.
4. Saat approve: otomatis buat row baru di tabel `students` dengan status 'active', current_belt default 'Putih' (sabuk dasar), dan update status registrasi jadi 'disetujui'.
5. RLS: ortu hanya bisa insert & lihat pendaftaran miliknya sendiri; owner full akses.
```

### Prompt Fase 4 — Modul Absensi
```
Lanjutkan project Dojo KKI DPL Manager. Tambahkan modul absensi.

Requirements:
1. Buat tabel `attendance_students` (id, student_id FK, class_id FK, session_date, status CHECK IN ('hadir','izin','sakit','alpha'), marked_by FK->profiles, created_at).
2. Buat tabel `attendance_coaches` (id, coach_id FK, class_id FK, session_date, status, created_at).
3. Buat halaman absensi cepat untuk pelatih: pilih kelas & tanggal, lalu tap status per siswa (hadir/izin/sakit/alpha) dalam satu layar, submit sekali untuk semua siswa di kelas itu.
4. Buat rekap absensi bulanan per siswa (untuk owner & ortu, read-only) dalam bentuk kalender atau tabel persentase kehadiran.
5. RLS: pelatih hanya bisa insert/update absensi untuk class_id miliknya; ortu hanya bisa lihat absensi anak sendiri; owner full akses.
```

### Prompt Fase 5 — Modul Iuran & Finance
```
Lanjutkan project Dojo KKI DPL Manager. Tambahkan modul iuran dan finance.

Requirements:
1. Buat tabel `fees` (id, student_id FK, period_month int, period_year int, amount numeric, status CHECK IN ('lunas','belum_lunas','sebagian'), paid_date, payment_method, notes).
2. Buat tabel `finance_transactions` (id, type CHECK IN ('pemasukan','pengeluaran'), category, amount, transaction_date, description, created_by FK->profiles).
3. Buat fungsi/tombol "Generate Tagihan Bulanan" (owner) yang otomatis membuat row `fees` untuk semua siswa aktif pada bulan berjalan dengan nominal default yang bisa diubah.
4. Buat halaman kelola iuran untuk owner: update status bayar per siswa, catat metode pembayaran & tanggal.
5. Buat halaman finance umum untuk owner: input pemasukan/pengeluaran manual (honor pelatih, sewa tempat, peralatan, dll), dengan ringkasan total pemasukan vs pengeluaran per bulan (grafik sederhana bar/line chart).
6. Buat halaman status iuran untuk ortu: lihat status lunas/belum lunas anak sendiri per bulan.
7. RLS: hanya owner yang bisa akses `fees` dan `finance_transactions` secara penuh; ortu hanya read status iuran anak sendiri; pelatih tidak punya akses ke modul ini.
```

### Prompt Fase 6 — Modul Ujian & Turnamen
```
Lanjutkan project Dojo KKI DPL Manager. Tambahkan modul ujian kenaikan sabuk dan turnamen.

Requirements:
1. Buat tabel `belt_exams` (id, exam_date, location, fee numeric, status CHECK IN ('terjadwal','selesai','dibatalkan'), notes).
2. Buat tabel `exam_participants` (id, exam_id FK, student_id FK, current_belt, target_belt, result CHECK IN ('lulus','tidak_lulus','pending'), score_notes).
3. Buat tabel `tournaments` (id, name, tournament_date, location, level, organizer).
4. Buat tabel `tournament_participants` (id, tournament_id FK, student_id FK, category CHECK IN ('kata','kumite'), weight_class, result, medal).
5. Buat halaman kelola ujian untuk owner & pelatih: buat jadwal ujian, daftarkan peserta, input hasil kelulusan. Saat hasil = 'lulus', otomatis update `current_belt` siswa di tabel students sesuai target_belt.
6. Buat halaman kelola turnamen untuk owner & pelatih: buat event, daftarkan peserta, input hasil & medali.
7. Buat halaman riwayat untuk ortu: histori ujian & turnamen anak sendiri (progress sabuk, medali yang pernah didapat).
8. RLS: owner & pelatih bisa insert/update; ortu hanya read data anak sendiri.
```

### Prompt Fase 7 — Notifikasi, Dashboard Final & Polish
```
Lanjutkan project Dojo KKI DPL Manager. Finalisasi dengan notifikasi in-app dan dashboard ringkasan.

Requirements:
1. Buat tabel `notifications` (id, user_id FK->profiles, title, message, type, is_read boolean default false, created_at).
2. Buat trigger/fungsi otomatis untuk generate notifikasi:
   - Ke ortu: saat iuran belum dibayar mendekati akhir bulan, saat ada jadwal ujian/turnamen baru untuk anaknya, saat hasil ujian/turnamen keluar.
   - Ke pelatih: saat ada peserta baru terdaftar di kelasnya.
   - Ke owner: saat ada pendaftaran baru menunggu approval.
3. Buat komponen bell icon notifikasi dengan badge jumlah unread, dropdown list, mark as read.
4. Buat dashboard ringkasan final:
   - Owner: total siswa aktif, status iuran bulan ini (lunas/belum), jadwal ujian & turnamen mendatang, pendaftaran menunggu approval.
   - Pelatih: jadwal kelas hari ini, ringkasan kehadiran minggu ini.
   - Ortu: status iuran anak, progress sabuk, jadwal terdekat.
5. Rapikan responsive design (mobile-first untuk ortu, desktop-friendly untuk owner/pelatih).
6. Siapkan untuk deploy ke Vercel (pastikan env variables terdokumentasi di README).
```

---

## 8. Catatan Tambahan

- Geup System / urutan sabuk KKI mengikuti data yang sudah kamu tentukan sebelumnya di dokumen silabus Dojo KKI DPL — pastikan urutan `current_belt`/`target_belt` di prompt Fase 6 disamakan persis dengan urutan resmi tersebut saat implementasi (bisa dimasukkan sebagai enum/check constraint atau tabel referensi `belt_levels`).
- Karena hanya 1 lokasi, tidak perlu tabel `branches`/multi-tenant — bisa disederhanakan jika suatu saat ingin ekspansi ke cabang lain.
- Struktur role & RLS sengaja dibuat mirip dengan Siger Taekwondo Club Manager supaya kamu familiar dengan pola development-nya, tapi desain UI dibedakan (Apple-style vs neubrutalism) sesuai preferensi masing-masing brand.
