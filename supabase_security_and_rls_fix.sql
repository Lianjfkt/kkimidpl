-- ==============================================================================
-- MIGRASI KEAMANAN & PERBAIKAN RLS (ROW LEVEL SECURITY)
-- Dojo Karate KKI DPL
-- Jalankan script ini di Supabase SQL Editor untuk memperbarui izin database.
-- ==============================================================================

-- 1. PERBAIKAN TABEL REGISTRATIONS
-- Aktifkan RLS dan pastikan Owner dapat menghapus data registrasi secara permanen
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registrations_owner_delete" ON public.registrations;
CREATE POLICY "registrations_owner_delete" ON public.registrations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "registrations_owner_update" ON public.registrations;
CREATE POLICY "registrations_owner_update" ON public.registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );

-- 2. PERBAIKAN TABEL FINANCE_TRANSACTIONS
-- Data kas/keuangan dojo bersifat privat, hanya dapat dibaca dan dikelola oleh Owner
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Allow owners to manage finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_owner_all" ON public.finance_transactions;

CREATE POLICY "finance_transactions_owner_all" ON public.finance_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );

-- 3. PERBAIKAN TABEL COACHES (PELATIH & HONOR)
-- Lindungi tarif honor pelatih agar tidak terbaca publik (hanya Owner & Pelatih yang bersangkutan)
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to coaches" ON public.coaches;
DROP POLICY IF EXISTS "Allow owner to manage coaches" ON public.coaches;
DROP POLICY IF EXISTS "coaches_read_restricted" ON public.coaches;
DROP POLICY IF EXISTS "coaches_owner_all" ON public.coaches;

CREATE POLICY "coaches_read_restricted" ON public.coaches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
    OR profile_id = auth.uid()
  );

CREATE POLICY "coaches_owner_all" ON public.coaches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );

-- 4. PERBAIKAN TABEL NOTIFICATIONS
-- Setiap user hanya boleh melihat notifikasi miliknya sendiri, kecuali Owner
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow read/write access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_user" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_user" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;

-- Siapa saja (termasuk pendaftar publik anonim) dapat memasukkan notifikasi baru (misal notifikasi pendaftaran baru)
CREATE POLICY "notifications_insert_all" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- User membaca notifikasi miliknya sendiri atau jika user adalah Owner
CREATE POLICY "notifications_select_user" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );

-- User memperbarui status baca (is_read) pada notifikasi miliknya sendiri
CREATE POLICY "notifications_update_user" ON public.notifications
  FOR UPDATE USING (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );
