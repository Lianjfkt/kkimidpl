'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee, FinanceTransaction } from '@/lib/mockData';

function M3Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl"
        style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold mb-5" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const inputClass = 'm3-textfield-outlined text-sm';
const labelClass = 'block text-xs font-medium mb-1.5';
const fieldWrap = 'flex flex-col';

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

export default function OwnerFinance() {
  const [activeTab, setActiveTab] = useState<'kas' | 'analytics'>('kas');
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Transactions CRUD state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [txType, setTxType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [txCategory, setTxCategory] = useState('iuran');
  const [txAmount, setTxAmount] = useState(0);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDescription, setTxDescription] = useState('');

  // Transactions sorting state
  const [sortTxField, setSortTxField] = useState<'transaction_date' | 'amount' | 'type'>('transaction_date');
  const [sortTxOrder, setSortTxOrder] = useState<'asc' | 'desc'>('desc');

  const handleTxSort = (field: 'transaction_date' | 'amount' | 'type') => {
    if (sortTxField === field) {
      setSortTxOrder(sortTxOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortTxField(field);
      setSortTxOrder('desc');
    }
  };

  // Individual Fee CRUD state
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [feeStudentId, setFeeStudentId] = useState('');
  const [feeMonth, setFeeMonth] = useState(new Date().getMonth() + 1);
  const [feeYear, setFeeYear] = useState(new Date().getFullYear());
  const [feeAmount, setFeeAmount] = useState(20000);
  const [feeStatus, setFeeStatus] = useState<'lunas' | 'belum_lunas'>('belum_lunas');
  const [feePaidDate, setFeePaidDate] = useState('');
  const [feePaymentMethod, setFeePaymentMethod] = useState<'tunai' | 'transfer' | 'qris'>('transfer');
  const [feeNotes, setFeeNotes] = useState('');

  // Batch invoicing state
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genAmount, setGenAmount] = useState(20000);
  const [invoiceMsg, setInvoiceMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [studRes, feesRes, txRes] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('fees').select('*'),
      supabase.from('finance_transactions').select('*'),
    ]);
    if (studRes.data) setStudents(studRes.data);
    if (feesRes.data) setFees(feesRes.data);
    if (txRes.data) setTransactions(txRes.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceMsg('');
    const activeStudents = students.filter((s) => s.status === 'active');
    if (activeStudents.length === 0) { setInvoiceMsg('Tidak ada siswa aktif untuk ditagih.'); return; }

    const existingIds = fees.filter((f) => f.period_month === genMonth && f.period_year === genYear).map((f) => f.student_id);
    const toBill = activeStudents.filter((s) => !existingIds.includes(s.id));
    if (toBill.length === 0) { setInvoiceMsg(`Tagihan periode ${genMonth}/${genYear} sudah digenerate untuk semua siswa.`); return; }

    await supabase.from('fees').insert(toBill.map((s) => ({
      student_id: s.id, period_month: genMonth, period_year: genYear,
      amount: Number(genAmount), status: 'belum_lunas' as const,
    })));

    await supabase.from('notifications').insert(toBill.map((s) => ({
      user_id: s.parent_id || 'user-parent-id',
      title: 'Tagihan Baru Dibuat',
      message: `Tagihan bulanan Rp ${genAmount.toLocaleString('id-ID')} periode ${genMonth}/${genYear} untuk ${s.full_name}.`,
      type: 'iuran' as const, is_read: false,
    })));

    setInvoiceMsg(`Sukses men-generate ${toBill.length} tagihan iuran baru!`);
    loadData();
  };

  const openAddTxModal = () => {
    setEditingTx(null);
    setTxType('pemasukan');
    setTxCategory('iuran');
    setTxAmount(0);
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxDescription('');
    setIsModalOpen(true);
  };

  const openEditTxModal = (tx: FinanceTransaction) => {
    setEditingTx(tx);
    setTxType(tx.type as 'pemasukan' | 'pengeluaran');
    setTxCategory(tx.category);
    setTxAmount(Number(tx.amount));
    setTxDate(tx.transaction_date);
    setTxDescription(tx.description);
    setIsModalOpen(true);
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    const txData = {
      type: txType, category: txCategory, amount: Number(txAmount),
      transaction_date: txDate, description: txDescription,
      created_by: userData?.user?.id || 'user-owner-id',
    };

    if (editingTx) {
      await supabase.from('finance_transactions').eq('id', editingTx.id).update(txData);
    } else {
      await supabase.from('finance_transactions').insert({
        id: `tx-${Date.now()}`,
        ...txData
      });
    }

    setIsModalOpen(false);
    setTxAmount(0); setTxDescription('');
    setEditingTx(null);
    loadData();
  };

  const handleDeleteTx = async (txId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi kas ini?')) {
      await supabase.from('finance_transactions').eq('id', txId).delete();
      loadData();
    }
  };

  // Quick mark paid
  const handleUpdateFeeStatus = async (feeId: string, status: 'lunas' | 'belum_lunas') => {
    const matchedFee = fees.find((f) => f.id === feeId);
    if (!matchedFee) return;
    await supabase.from('fees').eq('id', feeId).update({
      status, paid_date: status === 'lunas' ? new Date().toISOString().split('T')[0] : null,
      payment_method: status === 'lunas' ? 'transfer' : null,
    });
    if (status === 'lunas') {
      const { data: userData } = await supabase.auth.getUser();
      const student = students.find((s) => s.id === matchedFee.student_id);
      await supabase.from('finance_transactions').insert({
        type: 'pemasukan', category: 'iuran', amount: Number(matchedFee.amount),
        transaction_date: new Date().toISOString().split('T')[0],
        description: `Iuran Bulan ${matchedFee.period_month}/${matchedFee.period_year} - ${student?.full_name || ''}`,
        created_by: userData?.user?.id || 'user-owner-id',
      });
    }
    loadData();
  };

  // CRUD Fee helpers
  const openAddFeeModal = () => {
    setEditingFee(null);
    setFeeStudentId(students[0]?.id || '');
    setFeeMonth(new Date().getMonth() + 1);
    setFeeYear(new Date().getFullYear());
    setFeeAmount(20000);
    setFeeStatus('belum_lunas');
    setFeePaidDate(new Date().toISOString().split('T')[0]);
    setFeePaymentMethod('transfer');
    setFeeNotes('');
    setIsFeeModalOpen(true);
  };

  const openEditFeeModal = (fee: Fee) => {
    setEditingFee(fee);
    setFeeStudentId(fee.student_id);
    setFeeMonth(fee.period_month);
    setFeeYear(fee.period_year);
    setFeeAmount(fee.amount);
    setFeeStatus(fee.status as 'lunas' | 'belum_lunas');
    setFeePaidDate(fee.paid_date || new Date().toISOString().split('T')[0]);
    setFeePaymentMethod((fee.payment_method as 'tunai' | 'transfer' | 'qris') || 'transfer');
    setFeeNotes(fee.notes || '');
    setIsFeeModalOpen(true);
  };

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const feeData = {
      student_id: feeStudentId,
      period_month: Number(feeMonth),
      period_year: Number(feeYear),
      amount: Number(feeAmount),
      status: feeStatus,
      paid_date: feeStatus === 'lunas' ? feePaidDate : null,
      payment_method: feeStatus === 'lunas' ? feePaymentMethod : null,
      notes: feeNotes,
    };

    if (editingFee) {
      // Update fee
      await supabase.from('fees').eq('id', editingFee.id).update(feeData);

      // Create transaction if transitioned to paid
      if (feeStatus === 'lunas' && editingFee.status !== 'lunas') {
        const { data: userData } = await supabase.auth.getUser();
        const student = students.find((s) => s.id === feeStudentId);
        await supabase.from('finance_transactions').insert({
          type: 'pemasukan', category: 'iuran', amount: Number(feeAmount),
          transaction_date: feePaidDate || new Date().toISOString().split('T')[0],
          description: `Iuran Bulan ${feeMonth}/${feeYear} - ${student?.full_name || ''}`,
          created_by: userData?.user?.id || 'user-owner-id',
        });
      }
    } else {
      // Insert fee
      const newId = `PAY-${Date.now()}-${Math.floor(Math.random() * 100)}`;
      await supabase.from('fees').insert({
        id: newId,
        ...feeData
      });

      // Notify parent
      const student = students.find((s) => s.id === feeStudentId);
      if (student) {
        await supabase.from('notifications').insert({
          user_id: student.parent_id || 'user-parent-id',
          title: 'Tagihan Baru Dibuat',
          message: `Tagihan bulanan Rp ${Number(feeAmount).toLocaleString('id-ID')} periode ${feeMonth}/${feeYear} untuk ${student.full_name}.`,
          type: 'iuran', is_read: false
        });
      }

      // Add to transaction cash log if paid from start
      if (feeStatus === 'lunas') {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from('finance_transactions').insert({
          type: 'pemasukan', category: 'iuran', amount: Number(feeAmount),
          transaction_date: feePaidDate || new Date().toISOString().split('T')[0],
          description: `Iuran Bulan ${feeMonth}/${feeYear} - ${student?.full_name || ''}`,
          created_by: userData?.user?.id || 'user-owner-id',
        });
      }
    }

    setIsFeeModalOpen(false);
    loadData();
  };

  const handleDeleteFee = async (feeId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus tagihan iuran ini?')) {
      await supabase.from('fees').eq('id', feeId).delete();
      loadData();
    }
  };

  // Iuran income: computed directly from lunas fees (source of truth, avoids stale transaction cache)
  const iuranIncome = fees.filter((f) => f.status === 'lunas').reduce((s, f) => s + Number(f.amount), 0);
  // Non-iuran income from transaction journal (donations, exam fees, etc.)
  const otherIncome = transactions.filter((t) => t.type === 'pemasukan' && t.category !== 'iuran').reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = iuranIncome + otherIncome;
  const totalExpense = transactions.filter((t) => t.type === 'pengeluaran').reduce((s, t) => s + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aVal: any = a[sortTxField];
    let bVal: any = b[sortTxField];
    if (sortTxField === 'amount') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }
    if (aVal < bVal) return sortTxOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortTxOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: monthsShort[d.getMonth()] };
  });
  const chartData = chartMonths.map((cm) => ({
    ...cm,
    // Income from lunas fees per month + non-iuran transactions
    income: fees.filter((f) => f.status === 'lunas' && f.period_month === cm.month && f.period_year === cm.year).reduce((s, f) => s + Number(f.amount), 0)
      + transactions.filter((t) => t.type === 'pemasukan' && t.category !== 'iuran' && new Date(t.transaction_date).getMonth() + 1 === cm.month && new Date(t.transaction_date).getFullYear() === cm.year).reduce((s, t) => s + Number(t.amount), 0),
    expense: transactions.filter((t) => t.type === 'pengeluaran' && new Date(t.transaction_date).getMonth() + 1 === cm.month && new Date(t.transaction_date).getFullYear() === cm.year).reduce((s, t) => s + Number(t.amount), 0),
  }));
  const chartMax = Math.max(...chartData.flatMap((d) => [d.income, d.expense]), 1);

  const exportCSV = () => {
    const header = 'Tanggal,Tipe,Kategori,Keterangan,Nominal';
    const rows = transactions.map((t) => `${t.transaction_date},${t.type},${t.category},"${t.description}",${t.amount}`);
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `transaksi-dojo-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: 'Total Pemasukan', value: `Rp ${totalIncome.toLocaleString('id-ID')}`, color: 'var(--md-sys-color-tertiary-container)', textColor: 'var(--md-sys-color-on-tertiary-container)', icon: '↑' },
    { label: 'Total Pengeluaran', value: `Rp ${totalExpense.toLocaleString('id-ID')}`, color: 'var(--md-sys-color-error-container)', textColor: 'var(--md-sys-color-on-error-container)', icon: '↓' },
    { label: 'Sisa Kas Dojo (Net)', value: `Rp ${netProfit.toLocaleString('id-ID')}`, color: netProfit >= 0 ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-error-container)', textColor: netProfit >= 0 ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-error-container)', icon: '=' },
  ];

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Keuangan Dojo
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Catat kas pemasukan dan pengeluaran dojo serta tagih iuran bulanan siswa.
            </p>
          </div>
          <button onClick={openAddTxModal} className="m3-btn-filled px-5 py-2.5 text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Tambah Transaksi
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 p-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] w-fit mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('kas')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'kas'
                ? 'bg-[var(--md-sys-color-primary)] text-white shadow-sm'
                : 'text-[var(--md-sys-color-on-surface-variant)]'
            }`}
          >
            📋 Pembukuan &amp; Iuran
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[var(--md-sys-color-primary)] text-white shadow-sm'
                : 'text-[var(--md-sys-color-on-surface-variant)]'
            }`}
          >
            📊 Analytics &amp; Tren
          </button>
        </div>

        {activeTab === 'kas' ? (
          <>
            {/* Finance stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statCards.map(({ label, value, color, textColor, icon }) => (
                <div key={label} className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col gap-2"
                  style={{ background: color }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: textColor, opacity: 0.8 }}>{label}</span>
                    <span className="text-lg font-bold" style={{ color: textColor }}>{icon}</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: textColor }}>{loading ? '—' : value}</p>
                </div>
              ))}
            </div>

            {/* Invoice gen + billing */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Invoice Generator */}
              <div className="rounded-[var(--md-sys-shape-corner-extra-large)]"
                style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '24px' }}>
                <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Generate Tagihan Bulanan
                </h3>
                {invoiceMsg && (
                  <div className="mb-4 p-3 rounded-[var(--md-sys-shape-corner-small)] text-xs"
                    style={{ background: invoiceMsg.startsWith('Sukses') ? 'var(--md-sys-color-tertiary-container)' : 'var(--md-sys-color-error-container)', color: invoiceMsg.startsWith('Sukses') ? 'var(--md-sys-color-on-tertiary-container)' : 'var(--md-sys-color-on-error-container)' }}>
                    {invoiceMsg}
                  </div>
                )}
                <form onSubmit={handleGenerateInvoices} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={fieldWrap}>
                      <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Bulan</label>
                      <select className={inputClass} value={genMonth} onChange={(e) => setGenMonth(Number(e.target.value))}>
                        {months.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
                      </select>
                    </div>
                    <div className={fieldWrap}>
                      <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tahun</label>
                      <input type="number" className={inputClass} value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nominal Iuran (Rp)</label>
                    <input type="number" className={inputClass} value={genAmount} onChange={(e) => setGenAmount(Number(e.target.value))} />
                  </div>
                  <button type="submit" className="m3-btn-filled w-full py-2.5 text-sm">Generate Tagihan Siswa</button>
                </form>
              </div>

              {/* Billing list */}
              <div className="lg:col-span-2 rounded-[var(--md-sys-shape-corner-extra-large)]"
                style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '24px' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Status Tagihan Iuran Siswa</h3>
                  <button onClick={openAddFeeModal} className="m3-btn-outlined px-3 py-1.5 text-xs font-semibold">Buat Tagihan</button>
                </div>
                {loading ? (
                  <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-[var(--md-sys-shape-corner-medium)] animate-pulse" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}</div>
                ) : fees.length === 0 ? (
                  <p className="text-sm py-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada tagihan iuran dibuat.</p>
                ) : (
                  <div className="divide-y max-h-80 overflow-y-auto pr-1" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    {[...fees].reverse().map((fee) => {
                      const studentName = students.find((s) => s.id === fee.student_id)?.full_name || 'Siswa Terhapus';
                      return (
                        <div key={fee.id} className="py-3 flex items-center justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{studentName}</h4>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {months[fee.period_month - 1]} {fee.period_year} · Rp {Number(fee.amount).toLocaleString('id-ID')} {fee.notes ? `· ${fee.notes}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {fee.status === 'lunas' ? (
                              <span className="px-2.5 py-0.5 rounded-[var(--md-sys-shape-corner-full)] text-[10px] font-semibold"
                                style={{ background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }}>Lunas</span>
                            ) : (
                              <>
                                <span className="px-2.5 py-0.5 rounded-[var(--md-sys-shape-corner-full)] text-[10px] font-semibold"
                                  style={{ background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }}>Belum Lunas</span>
                                <button onClick={() => handleUpdateFeeStatus(fee.id, 'lunas')}
                                  className="m3-btn-tonal px-2 py-0.5 text-[10px] font-semibold">Tandai Lunas</button>
                              </>
                            )}
                            <button onClick={() => openEditFeeModal(fee)} className="m3-btn-text py-1 px-1.5 text-xs font-semibold">Edit</button>
                            <button onClick={() => handleDeleteFee(fee.id)} className="m3-btn-text py-1 px-1.5 text-xs font-semibold" style={{ color: 'var(--md-sys-color-error)' }}>Hapus</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)]"
              style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '24px' }}>
              <h3 className="font-semibold text-base mb-5" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Tren Keuangan 6 Bulan Terakhir
              </h3>
              <div className="flex items-end gap-2 h-36">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-28">
                      <div title={`Pemasukan: Rp ${d.income.toLocaleString('id-ID')}`}
                        className="flex-1 rounded-t-[var(--md-sys-shape-corner-extra-small)] transition-all duration-500"
                        style={{ height: `${(d.income / chartMax) * 100}%`, minHeight: d.income > 0 ? '4px' : '0', background: 'var(--md-sys-color-tertiary)' }} />
                      <div title={`Pengeluaran: Rp ${d.expense.toLocaleString('id-ID')}`}
                        className="flex-1 rounded-t-[var(--md-sys-shape-corner-extra-small)] transition-all duration-500"
                        style={{ height: `${(d.expense / chartMax) * 100}%`, minHeight: d.expense > 0 ? '4px' : '0', background: 'var(--md-sys-color-error)' }} />
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{d.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: 'Pemasukan', color: 'var(--md-sys-color-tertiary)' },
                  { label: 'Pengeluaran', color: 'var(--md-sys-color-error)' },
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    <span className="w-3 h-3 rounded-[var(--md-sys-shape-corner-extra-small)] inline-block" style={{ background: color }} /> {label}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Siswa Growth Trend */}
            <div className="m3-card-elevated">
              <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Tren Pertumbuhan Siswa Karate</h3>
              <div className="flex items-end gap-3 h-44 mt-4">
                {[12, 14, 15, 16, 17, 18].map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>{count}</span>
                    <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${(count/20)*100}%`, background: 'var(--md-sys-color-primary)' }} />
                    <span className="text-[9px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Bulan {i+1}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Jumlah atlet aktif berpartisipasi meningkat secara stabil sebesar 50% dalam semester ini.</p>
            </div>

            {/* Attendance Heatmap */}
            <div className="m3-card-elevated">
              <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Tingkat Kehadiran per Hari Sesi</h3>
              <div className="grid grid-cols-7 gap-2 text-center text-xs mt-6">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="font-semibold">{day}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                      style={{
                        background: idx === 2 || idx === 6 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                        color: idx === 2 || idx === 6 ? '#ffffff' : 'var(--md-sys-color-on-surface-variant)',
                        opacity: idx === 2 || idx === 6 ? 1 : 0.4
                      }}
                    >
                      {idx === 2 || idx === 6 ? '85%' : '0%'}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-6" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Hari latihan resmi adalah Selasa (Sore) dan Sabtu (Pagi) dengan tingkat partisipasi kehadiran rata-rata mencapai 85%.</p>
            </div>

            {/* Revenue Forecast */}
            <div className="m3-card-elevated lg:col-span-2">
              <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Proyeksi Arus Kas &amp; Forecast Pendapatan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-high)]">
                  <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Potensi Bulanan Maksimal</span>
                  <p className="text-lg font-bold mt-1" style={{ color: 'var(--md-sys-color-primary)' }}>
                    Rp {(students.filter(s => s.status === 'active').length * 20000).toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] opacity-75">Berdasarkan {students.filter(s => s.status === 'active').length} siswa aktif @ Rp 20.000</p>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-high)]">
                  <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tingkat Koleksi (Kepatuhan)</span>
                  <p className="text-lg font-bold mt-1 text-emerald-500">
                    {students.filter(s => s.status === 'active').length > 0 ? Math.round((fees.filter(f => f.status === 'lunas' && f.period_month === new Date().getMonth()+1).length / students.filter(s => s.status === 'active').length) * 100) : 100}%
                  </p>
                  <p className="text-[10px] opacity-75">Rasio siswa lunas iuran pada bulan berjalan</p>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-high)]">
                  <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Rasio Retensi Atlet</span>
                  <p className="text-lg font-bold mt-1 text-blue-500">92%</p>
                  <p className="text-[10px] opacity-75">Rasio kelangsungan latihan siswa aktif dalam 6 bulan terakhir</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction ledger */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
          style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
            <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Jurnal Transaksi Kas Dojo</h3>
            <button onClick={exportCSV} className="m3-btn-outlined px-4 py-2 text-xs font-medium">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Unduh CSV
            </button>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-[var(--md-sys-shape-corner-medium)]" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}</div>
          ) : transactions.length === 0 ? (
            <p className="p-6 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada catatan transaksi kas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-white/5 select-none"
                      style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                      onClick={() => handleTxSort('transaction_date')}>
                      Tanggal {sortTxField === 'transaction_date' ? (sortTxOrder === 'asc' ? '▲' : '▼') : '⇅'}
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-white/5 select-none"
                      style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                      onClick={() => handleTxSort('type')}>
                      Tipe {sortTxField === 'type' ? (sortTxOrder === 'asc' ? '▲' : '▼') : '⇅'}
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Kategori
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Keterangan
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-right cursor-pointer hover:bg-white/5 select-none"
                      style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                      onClick={() => handleTxSort('amount')}>
                      Nominal {sortTxField === 'amount' ? (sortTxOrder === 'asc' ? '▲' : '▼') : '⇅'}
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-right"
                      style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((tx, idx) => (
                    <tr key={tx.id} style={{ borderBottom: idx < transactions.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{tx.transaction_date}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-[var(--md-sys-shape-corner-full)] text-xs font-semibold"
                          style={tx.type === 'pemasukan'
                            ? { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }
                            : { background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }
                          }>
                          {tx.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm capitalize" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{tx.category}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{tx.description}</td>
                      <td className={`px-5 py-3.5 text-sm text-right font-semibold`}
                        style={{ color: tx.type === 'pemasukan' ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-error)' }}>
                        {tx.type === 'pemasukan' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditTxModal(tx)} className="m3-btn-text py-1 px-2 font-semibold">Edit</button>
                          <button onClick={() => handleDeleteTx(tx.id)} className="m3-btn-text py-1 px-2 font-semibold" style={{ color: 'var(--md-sys-color-error)' }}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Kas Transaction */}
        <M3Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTx ? 'Edit Transaksi Kas' : 'Tambah Transaksi Kas'}>
          <form onSubmit={handleTxSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tipe</label>
                <select className={inputClass} value={txType} onChange={(e) => { const v = e.target.value as 'pemasukan' | 'pengeluaran'; setTxType(v); setTxCategory(v === 'pemasukan' ? 'iuran' : 'sewa'); }}>
                  <option value="pemasukan">Pemasukan</option>
                  <option value="pengeluaran">Pengeluaran</option>
                </select>
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kategori</label>
                <select className={inputClass} value={txCategory} onChange={(e) => setTxCategory(e.target.value)}>
                  {txType === 'pemasukan'
                    ? ['iuran', 'ujian', 'donasi', 'umum'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)
                    : ['sewa', 'honor', 'peralatan', 'umum'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)
                  }
                </select>
              </div>
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nominal (Rp) *</label>
              <input type="number" required className={inputClass} value={txAmount} onChange={(e) => setTxAmount(Number(e.target.value))} />
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal *</label>
              <input type="date" required className={inputClass} value={txDate} onChange={(e) => setTxDate(e.target.value)} />
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Keterangan *</label>
              <input type="text" required className={inputClass} placeholder="mis. Beli matras latihan baru" value={txDescription} onChange={(e) => setTxDescription(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} className="m3-btn-text px-5 py-2.5 text-sm">Batal</button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm">Simpan</button>
            </div>
          </form>
        </M3Dialog>

        {/* Modal CRUD Iuran */}
        <M3Dialog open={isFeeModalOpen} onClose={() => setIsFeeModalOpen(false)} title={editingFee ? 'Edit Tagihan Iuran' : 'Buat Tagihan Iuran Baru'}>
          <form onSubmit={handleFeeSubmit} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Siswa *</label>
              <select className={inputClass} value={feeStudentId} onChange={(e) => setFeeStudentId(e.target.value)} required>
                <option value="" disabled>Pilih Siswa</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Bulan *</label>
                <select className={inputClass} value={feeMonth} onChange={(e) => setFeeMonth(Number(e.target.value))} required>
                  {months.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
                </select>
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tahun *</label>
                <input type="number" className={inputClass} value={feeYear} onChange={(e) => setFeeYear(Number(e.target.value))} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nominal (Rp) *</label>
                <input type="number" className={inputClass} value={feeAmount} onChange={(e) => setFeeAmount(Number(e.target.value))} required />
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Status Pembayaran</label>
                <select className={inputClass} value={feeStatus} onChange={(e) => setFeeStatus(e.target.value as 'lunas' | 'belum_lunas')}>
                  <option value="belum_lunas">Belum Lunas</option>
                  <option value="lunas">Lunas</option>
                </select>
              </div>
            </div>

            {feeStatus === 'lunas' && (
              <div className="grid grid-cols-2 gap-3">
                <div className={fieldWrap}>
                  <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal Bayar</label>
                  <input type="date" className={inputClass} value={feePaidDate} onChange={(e) => setFeePaidDate(e.target.value)} />
                </div>
                <div className={fieldWrap}>
                  <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Metode Pembayaran</label>
                  <select className={inputClass} value={feePaymentMethod} onChange={(e) => setFeePaymentMethod(e.target.value as 'tunai' | 'transfer' | 'qris')}>
                    <option value="transfer">Transfer</option>
                    <option value="tunai">Tunai</option>
                    <option value="qris">QRIS</option>
                  </select>
                </div>
              </div>
            )}

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Keterangan / Catatan</label>
              <input type="text" className={inputClass} placeholder="mis. Bukti transfer sudah dicocokkan" value={feeNotes} onChange={(e) => setFeeNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button type="button" onClick={() => setIsFeeModalOpen(false)} className="m3-btn-text px-5 py-2.5 text-sm">Batal</button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm">Simpan</button>
            </div>
          </form>
        </M3Dialog>
      </div>
    </Navigation>
  );
}
