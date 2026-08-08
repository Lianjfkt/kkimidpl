'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Registration, Fee, FinanceTransaction } from '@/lib/mockData';

export default function OwnerDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats calculation
  const activeStudentsCount = students.filter(s => s.status === 'active').length;
  const pendingRegistrationsCount = registrations.filter(r => r.status === 'menunggu').length;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Get total income and expense this month
  const getMonthlyFinance = () => {
    let income = 0;
    let expense = 0;
    transactions.forEach(tx => {
      const txDate = new Date(tx.transaction_date);
      if (txDate.getMonth() + 1 === currentMonth && txDate.getFullYear() === currentYear) {
        if (tx.type === 'pemasukan') {
          income += Number(tx.amount);
        } else {
          expense += Number(tx.amount);
        }
      }
    });
    return { income, expense };
  };

  const { income: monthlyIncome, expense: monthlyExpense } = getMonthlyFinance();

  const loadData = async () => {
    setLoading(true);
    const { data: studentsData } = await supabase.from('students').select('*');
    const { data: registrationsData } = await supabase.from('registrations').select('*');
    const { data: feesData } = await supabase.from('fees').select('*');
    const { data: transactionsData } = await supabase.from('finance_transactions').select('*');

    if (studentsData) setStudents(studentsData);
    if (registrationsData) setRegistrations(registrationsData);
    if (feesData) setFees(feesData);
    if (transactionsData) setTransactions(transactionsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveRegistration = async (reg: Registration) => {
    // 1. Update registration status
    await supabase.from('registrations').eq('id', reg.id).update({ status: 'disetujui' });

    // 2. Create student record
    const newStudent: Omit<Student, 'id'> = {
      full_name: reg.full_name,
      dob: reg.dob,
      gender: 'Laki-laki', // Default fallback
      address: reg.address,
      parent_id: 'user-parent-id', // Simulated parent account linking
      phone: reg.parent_phone,
      photo_url: '',
      join_date: new Date().toISOString().split('T')[0],
      current_belt: 'Putih (Geup 10)',
      status: 'active',
    };
    await supabase.from('students').insert(newStudent);

    // 3. Create success notification
    await supabase.from('notifications').insert({
      user_id: 'user-owner-id',
      title: 'Pendaftaran Disetujui',
      message: `Calon siswa ${reg.full_name} berhasil terdaftar sebagai siswa aktif.`,
      type: 'umum',
      is_read: false,
    });

    loadData();
  };

  const handleRejectRegistration = async (regId: string) => {
    await supabase.from('registrations').eq('id', regId).update({ status: 'ditolak' });
    loadData();
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Halo, Owner
          </h2>
          <p className="body-text mt-1">
            Ringkasan status operasional dojo KKI DPL saat ini.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="apple-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Siswa Aktif</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">{loading ? '...' : activeStudentsCount}</span>
              <span className="text-xs font-medium text-emerald-600">Siswa</span>
            </div>
          </div>

          <div className="apple-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Persetujuan Pendaftaran</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">{loading ? '...' : pendingRegistrationsCount}</span>
              {pendingRegistrationsCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-[var(--color-status-error)]">
                  Butuh Approval
                </span>
              )}
            </div>
          </div>

          <div className="apple-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Pemasukan Bulan Ini</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight">
                {loading ? '...' : `Rp ${monthlyIncome.toLocaleString('id-ID')}`}
              </span>
            </div>
          </div>

          <div className="apple-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Pengeluaran Bulan Ini</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight text-red-600">
                {loading ? '...' : `Rp ${monthlyExpense.toLocaleString('id-ID')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Panel and Approvals Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* List of registrations awaiting approval */}
          <div className="lg:col-span-2 apple-card">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Persetujuan Pendaftaran Baru
            </h3>
            
            {loading ? (
              <p className="text-sm text-[var(--color-text-secondary)] py-4">Memuat data...</p>
            ) : registrations.filter(r => r.status === 'menunggu').length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] py-4">Tidak ada pendaftaran baru yang menunggu persetujuan.</p>
            ) : (
              <div className="divide-y divide-[var(--color-border-hairline)]">
                {registrations
                  .filter(r => r.status === 'menunggu')
                  .map((reg) => (
                    <div key={reg.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{reg.full_name}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                          Ortu: {reg.parent_name} ({reg.parent_phone}) | TTL: {reg.dob}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Alamat: {reg.address}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApproveRegistration(reg)}
                          className="px-3 py-1.5 rounded-full bg-[var(--color-accent-karate)] hover:bg-[var(--color-accent-karate-hover)] text-white text-xs font-semibold transition-all cursor-pointer"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleRejectRegistration(reg.id)}
                          className="px-3 py-1.5 rounded-full border border-[var(--color-border-hairline)] hover:bg-black/5 text-[var(--color-text-secondary)] text-xs font-semibold transition-all cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Quick links & dojo stats */}
          <div className="apple-card space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Menu Cepat
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <a href="/owner/students" className="apple-btn-secondary py-3 text-sm font-semibold justify-start pl-4">
                📁 Kelola Data Siswa
              </a>
              <a href="/owner/classes" className="apple-btn-secondary py-3 text-sm font-semibold justify-start pl-4">
                🗓️ Jadwal Latihan Dojo
              </a>
              <a href="/owner/finance" className="apple-btn-secondary py-3 text-sm font-semibold justify-start pl-4">
                💰 Tagih & Input Keuangan
              </a>
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
