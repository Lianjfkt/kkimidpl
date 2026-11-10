import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: Request) {
  try {
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

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan server internal' }, { status: 500 });
  }
}
