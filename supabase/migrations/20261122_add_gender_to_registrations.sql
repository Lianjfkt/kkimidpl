-- ==============================================================================
-- Migration: Tambah Kolom Gender pada Tabel Registrations
-- Idempotent & Aman dijalankan berulang kali
-- ==============================================================================

alter table public.registrations add column if not exists gender text default 'Laki-laki';

