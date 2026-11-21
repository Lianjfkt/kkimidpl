import { createClient } from '@supabase/supabase-js';
import { normalizePhoneToAuthEmail } from '../src/lib/authUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function syncParentAccounts() {
  console.log('--- Memulai Sinkronisasi Akun Orang Tua ---');

  // 1. Ambil semua siswa dari database
  const { data: students, error: studErr } = await supabaseAdmin
    .from('students')
    .select('id, full_name, parent_name, phone, parent_id');

  if (studErr) {
    console.error('Gagal mengambil data siswa:', studErr);
    return;
  }

  console.log(`Ditemukan ${students.length} data siswa.`);

  // 2. Kumpulkan grup nomor telepon orang tua unik
  const parentMap = new Map<string, { phone: string; parentName: string; studentIds: string[] }>();

  students.forEach((s) => {
    const rawPhone = (s.phone || '').trim();
    if (!rawPhone) return;

    const email = normalizePhoneToAuthEmail(rawPhone);
    const cleanDigits = email.split('@')[0];

    if (!parentMap.has(email)) {
      parentMap.set(email, {
        phone: cleanDigits,
        parentName: s.parent_name || `Orang Tua ${s.full_name}`,
        studentIds: [],
      });
    }
    parentMap.get(email)!.studentIds.push(s.id);
  });

  console.log(`Ditemukan ${parentMap.size} nomor HP orang tua unik untuk disinkronkan.\n`);

  let createdCount = 0;
  let linkedCount = 0;

  for (const [email, info] of Array.from(parentMap.entries())) {
    const password = info.phone; // Default password: Nomor HP (cth: 082178028198)

    // A. Cek apakah user auth sudah ada di auth.users
    let userId: string | null = null;
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuth = usersList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existingAuth) {
      userId = existingAuth.id;
      console.log(`[SUDAH ADA] User auth ${email} (ID: ${userId})`);
    } else {
      // Buat akun baru via Supabase Admin
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: info.parentName,
          phone: info.phone,
          role: 'ortu',
        },
      });

      if (createErr) {
        console.error(`[ERROR] Gagal membuat user auth ${email}:`, createErr.message);
        continue;
      }

      userId = newUser.user.id;
      createdCount++;
      console.log(`[BERHASIL DIBUAT] User auth ${email} (Password: ${password}, ID: ${userId})`);
    }

    if (!userId) continue;

    // B. Pastikan profil di public.profiles ada dengan role 'ortu'
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        full_name: info.parentName,
        role: 'ortu',
        phone: info.phone,
        avatar_url: '',
        created_at: new Date().toISOString(),
      });
      console.log(`[PROFIL DIBUAT] Profil role 'ortu' dibuat untuk ${info.parentName}`);
    } else if (existingProfile.role !== 'ortu') {
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'ortu', phone: info.phone })
        .eq('id', userId);
      console.log(`[PROFIL DIPERBARUI] Role profil diupdate ke 'ortu' untuk ${info.parentName}`);
    }

    // C. Hubungkan parent_id pada tabel students ke ID akun orang tua ini
    for (const studentId of info.studentIds) {
      const { error: linkErr } = await supabaseAdmin
        .from('students')
        .update({ parent_id: userId })
        .eq('id', studentId);

      if (linkErr) {
        console.error(`[ERROR LINK] Gagal menautkan siswa ${studentId}:`, linkErr.message);
      } else {
        linkedCount++;
      }
    }
  }

  console.log('\n--- Selesai Sinkronisasi ---');
  console.log(`Akun Auth Baru Dibuat: ${createdCount}`);
  console.log(`Siswa Ditautkan ke Akun Ortu: ${linkedCount}`);
}

if (require.main === module) {
  syncParentAccounts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

