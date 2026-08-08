'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee, FinanceTransaction } from '@/lib/mockData';

export default function OwnerFinance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [txCategory, setTxCategory] = useState('iuran');
  const [txAmount, setTxAmount] = useState(0);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDescription, setTxDescription] = useState('');

  // Invoice generator period states
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genAmount, setGenAmount] = useState(150000);
  const [invoiceMsg, setInvoiceMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    const { data: studentsData } = await supabase.from('students').eq('status', 'active').select('*');
    const { data: feesData } = await supabase.from('fees').select('*');
    const { data: transactionsData } = await supabase.from('finance_transactions').select('*');

    if (studentsData) setStudents(studentsData);
    if (feesData) setFees(feesData);
    if (transactionsData) setTransactions(transactionsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceMsg('');

    // Filter active students
    const activeStudents = students.filter(s => s.status === 'active');
    if (activeStudents.length === 0) {
      setInvoiceMsg('Tidak ada siswa aktif untuk ditagih.');
      return;
    }

    // Check if invoices already generated for this period
    const existingInvoices = fees.filter(f => f.period_month === genMonth && f.period_year === genYear);
    const existingStudentIds = existingInvoices.map(f => f.student_id);

    const studentsToBill = activeStudents.filter(s => !existingStudentIds.includes(s.id));
    if (studentsToBill.length === 0) {
      setInvoiceMsg(`Tagihan periode ${genMonth}/${genYear} sudah digenerate untuk semua siswa.`);
      return;
    }

    const newInvoices = studentsToBill.map(s => ({
      student_id: s.id,
      period_month: genMonth,
      period_year: genYear,
      amount: Number(genAmount),
      status: 'belum_lunas' as const,
    }));

    await supabase.from('fees').insert(newInvoices);

    // Create notifications for parents
    const parentNotifications = studentsToBill.map(s => ({
      user_id: s.parent_id || 'user-parent-id',
      title: 'Tagihan Baru Dibuat',
      message: `Tagihan bulanan Rp ${genAmount.toLocaleString('id-ID')} periode ${genMonth}/${genYear} telah terbit untuk ${s.full_name}.`,
      type: 'iuran' as const,
      is_read: false
    }));
    await supabase.from('notifications').insert(parentNotifications);

    setInvoiceMsg(`Sukses men-generate ${newInvoices.length} tagihan iuran baru!`);
    loadData();
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    const createdBy = userData?.user?.id || 'user-owner-id';

    const newTx = {
      type: txType,
      category: txCategory,
      amount: Number(txAmount),
      transaction_date: txDate,
      description: txDescription,
      created_by: createdBy,
    };

    await supabase.from('finance_transactions').insert(newTx);
    setIsModalOpen(false);
    
    // Clear form
    setTxAmount(0);
    setTxDescription('');
    loadData();
  };

  const handleUpdateFeeStatus = async (feeId: string, status: 'lunas' | 'belum_lunas') => {
    const matchedFee = fees.find(f => f.id === feeId);
    if (!matchedFee) return;

    await supabase.from('fees').eq('id', feeId).update({
      status,
      paid_date: status === 'lunas' ? new Date().toISOString().split('T')[0] : null,
      payment_method: status === 'lunas' ? 'transfer' : null
    });

    // If marked lunas, automatically log to transactions
    if (status === 'lunas') {
      const { data: userData } = await supabase.auth.getUser();
      const createdBy = userData?.user?.id || 'user-owner-id';
      
      const student = students.find(s => s.id === matchedFee.student_id);
      
      await supabase.from('finance_transactions').insert({
        type: 'pemasukan',
        category: 'iuran',
        amount: Number(matchedFee.amount),
        transaction_date: new Date().toISOString().split('T')[0],
        description: `Iuran Bulan ${matchedFee.period_month}/${matchedFee.period_year} - ${student?.full_name || ''}`,
        created_by: createdBy
      });
    }

    loadData();
  };

  // Finance calculations
  const totalIncome = transactions.filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Keuangan Dojo
            </h2>
            <p className="body-text mt-1">
              Catat kas pemasukan dan pengeluaran dojo serta tagih iuran bulanan siswa.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="apple-btn px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            ＋ Tambah Transaksi Manual
          </button>
        </div>

        {/* Financial metrics overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="apple-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Total Pemasukan</span>
            <p className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">
              Rp {totalIncome.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="apple-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Total Pengeluaran</span>
            <p className="text-2xl font-extrabold text-red-600 mt-1">
              Rp {totalExpense.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="apple-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Sisa Kas Dojo (Net)</span>
            <p className={`text-2xl font-extrabold mt-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              Rp {netProfit.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Invoice generator & Tuition tracking columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Invoice Generator */}
          <div className="apple-card space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Generate Tagihan Bulanan
            </h3>
            {invoiceMsg && (
              <div className="p-3 rounded-lg bg-red-50 text-[var(--color-status-error)] border border-red-100 text-xs font-medium">
                {invoiceMsg}
              </div>
            )}
            <form onSubmit={handleGenerateInvoices} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Bulan</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-xs"
                    value={genMonth}
                    onChange={(e) => setGenMonth(Number(e.target.value))}
                  >
                    {months.map((m, idx) => (
                      <option key={idx} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tahun</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-xs"
                    value={genYear}
                    onChange={(e) => setGenYear(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nominal Iuran (Rp)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-xs"
                  value={genAmount}
                  onChange={(e) => setGenAmount(Number(e.target.value))}
                />
              </div>

              <button type="submit" className="apple-btn w-full py-2.5 text-xs font-semibold">
                ⚡ Generate Tagihan Siswa
              </button>
            </form>
          </div>

          {/* Student Billing tracking */}
          <div className="lg:col-span-2 apple-card space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Status Tagihan Iuran Siswa
            </h3>

            {loading ? (
              <p className="text-sm text-[var(--color-text-secondary)]">Memuat iuran...</p>
            ) : fees.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">Belum ada tagihan iuran dibuat.</p>
            ) : (
              <div className="divide-y divide-[var(--color-border-hairline)] max-h-80 overflow-y-auto pr-2">
                {fees.map((fee) => {
                  const studentName = students.find(s => s.id === fee.student_id)?.full_name || 'Siswa Terhapus';
                  return (
                    <div key={fee.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{studentName}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Periode: {months[fee.period_month - 1]} {fee.period_year} | Rp {Number(fee.amount).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {fee.status === 'lunas' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            Lunas
                          </span>
                        ) : (
                          <button
                            onClick={() => handleUpdateFeeStatus(fee.id, 'lunas')}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-accent-karate)] text-white hover:bg-[var(--color-accent-karate-hover)] cursor-pointer"
                          >
                            Tandai Lunas
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* General Transaction Ledger list */}
        <div className="apple-card">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
            Jurnal Transaksi Kas Dojo
          </h3>

          {loading ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Memuat transaksi...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">Belum ada catatan transaksi kas.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-hairline)] bg-gray-50/50">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tanggal</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tipe</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Kategori</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Keterangan</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-hairline)]">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-3.5 text-sm text-[var(--color-text-secondary)]">{tx.transaction_date}</td>
                    <td className="px-6 py-3.5 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        tx.type === 'pemasukan' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {tx.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-[var(--color-text-secondary)] capitalize">{tx.category}</td>
                    <td className="px-6 py-3.5 text-sm text-[var(--color-text-primary)]">{tx.description}</td>
                    <td className={`px-6 py-3.5 text-sm text-right font-semibold ${
                      tx.type === 'pemasukan' ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      {tx.type === 'pemasukan' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Manual entry Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl relative">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                Tambah Transaksi Kas
              </h3>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Tipe</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm"
                      value={txType}
                      onChange={(e) => {
                        const val = e.target.value as 'pemasukan' | 'pengeluaran';
                        setTxType(val);
                        setTxCategory(val === 'pemasukan' ? 'iuran' : 'sewa');
                      }}
                    >
                      <option value="pemasukan">Pemasukan</option>
                      <option value="pengeluaran">Pengeluaran</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Kategori</label>
                    {txType === 'pemasukan' ? (
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm"
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                      >
                        <option value="iuran">Iuran Siswa</option>
                        <option value="ujian">Grading Ujian</option>
                        <option value="donasi">Sponsor / Donasi</option>
                        <option value="umum">Umum</option>
                      </select>
                    ) : (
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm"
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                      >
                        <option value="sewa">Sewa Aula</option>
                        <option value="honor">Honor Pelatih</option>
                        <option value="peralatan">Peralatan Dojo</option>
                        <option value="umum">Umum</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Tanggal</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Keterangan</label>
                  <input
                    type="text"
                    required
                    placeholder="mis. Beli matras latihan baru"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                  />
                </div>

                <div className="pt-4 border-t border-[var(--color-border-hairline)] flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="apple-btn-secondary py-2 text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="apple-btn py-2 text-xs font-semibold cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
