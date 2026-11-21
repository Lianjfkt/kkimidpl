import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizePhoneToAuthEmail } from '@/lib/authUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Admin client with service role key if provided
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder-dojo.supabase.co',
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    // -------------------------------------------------------------
    // Security Guard: Authenticate and authorize Owner
    // -------------------------------------------------------------
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    let isOwner = false;

    if (token && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && userData?.user?.id) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', userData.user.id)
          .maybeSingle();

        if (profile?.role === 'owner') {
          isOwner = true;
        }
      }
    }

    // Secondary fallback: check user_role cookie if service role key is absent or in local dev
    if (!isOwner) {
      const roleCookie = request.cookies.get('user_role')?.value;
      if (roleCookie === 'owner') {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Akses ditolak. Tindakan ini memerlukan hak akses Pengelola / Pemilik (Owner).' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action = 'create', email, password, fullName, phone, role = 'ortu', userId } = body;

    // Action 1: Create new user
    if (action === 'create') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email dan kata sandi wajib diisi' }, { status: 400 });
      }

      // Check if service role key is configured
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Fallback: If service role key is not yet in .env, create user profile directly
        // and return instruction
        const tempId = crypto.randomUUID();
        const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
          id: tempId,
          full_name: fullName || email.split('@')[0],
          role,
          phone: phone || '',
          avatar_url: '',
          created_at: new Date().toISOString(),
        });

        if (profileErr) {
          return NextResponse.json({ 
            error: 'Gagal membuat profil: ' + profileErr.message,
            notice: 'Untuk pembuatan akun auth otomatis tanpa konfirmasi email, konfigurasikan SUPABASE_SERVICE_ROLE_KEY di .env.local.'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          userId: tempId,
          message: 'Profil pengguna berhasil dibuat.',
        });
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
          phone: phone || '',
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Ensure profile exists in public.profiles (if trigger hasn't fired yet)
      if (data?.user?.id) {
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          await supabaseAdmin.from('profiles').insert({
            id: data.user.id,
            full_name: fullName || '',
            role,
            phone: phone || '',
            avatar_url: '',
            created_at: new Date().toISOString(),
          });
        }
      }

      return NextResponse.json({
        success: true,
        user: data.user,
        userId: data.user?.id,
      });
    }

    // Action 2: Update password or user by Admin
    if (action === 'update_password') {
      if (!userId || !password) {
        return NextResponse.json({ error: 'User ID dan kata sandi baru wajib diisi' }, { status: 400 });
      }

      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({
          error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di .env.local untuk update password pengguna oleh admin.',
        }, { status: 400 });
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
    }

    // Action 3: Delete user by Admin
    if (action === 'delete_user') {
      if (!userId) {
        return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 });
      }

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      await supabaseAdmin.from('profiles').delete().eq('id', userId);

      return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus.' });
    }

    // Action 4: Sync/Provision all parent accounts from students table
    if (action === 'sync_parents') {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({
          error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di .env.local untuk auto-sync akun orang tua.',
        }, { status: 400 });
      }

      const { data: students, error: studErr } = await supabaseAdmin
        .from('students')
        .select('id, full_name, parent_name, phone, parent_id');

      if (studErr) {
        return NextResponse.json({ error: studErr.message }, { status: 400 });
      }

      const parentMap = new Map<string, { phone: string; parentName: string; studentIds: string[] }>();
      students?.forEach((s) => {
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

      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
      let createdCount = 0;
      let linkedCount = 0;

      for (const [email, info] of Array.from(parentMap.entries())) {
        const password = info.phone; // default password is phone number
        let userId: string | null = null;
        const existingAuth = usersList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

        if (existingAuth) {
          userId = existingAuth.id;
        } else {
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

          if (!createErr && newUser?.user?.id) {
            userId = newUser.user.id;
            createdCount++;
          }
        }

        if (!userId) continue;

        // Ensure profile
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
        } else if (existingProfile.role !== 'ortu') {
          await supabaseAdmin.from('profiles').update({ role: 'ortu', phone: info.phone }).eq('id', userId);
        }

        // Link student
        for (const studentId of info.studentIds) {
          const { error: linkErr } = await supabaseAdmin
            .from('students')
            .update({ parent_id: userId })
            .eq('id', studentId);
          if (!linkErr) linkedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Sinkronisasi selesai. ${createdCount} akun baru dibuat, ${linkedCount} penautan data siswa berhasil.`,
        createdCount,
        linkedCount,
        totalParents: parentMap.size,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan server internal' }, { status: 500 });
  }
}
