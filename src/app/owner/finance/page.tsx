'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee, FinanceTransaction } from '@/lib/mockData';
import {
  MONTH_NAMES,
  formatWhatsAppNumber,
  generateWhatsAppMessage,
  generateWhatsAppUrl,
  calculateStudentArrears,
  generateUnpaidBillingCsv,
} from '@/lib/billingUtils';

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

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  icon?: string;
}

const inputClass = 'm3-textfield-outlined text-sm';
const labelClass = 'block text-xs font-medium mb-1.5';
const fieldWrap = 'flex flex-col';

const months = MONTH_NAMES;
const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

const BELT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Putih:       { bg: 'bg-slate-100 dark:bg-slate-800',   text: 'text-slate-800 dark:text-slate-200',  border: 'border-slate-300 dark:border-slate-600' },
  Kuning:      { bg: 'bg-yellow-100 dark:bg-yellow-900/40',  text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
  Orange:      { bg: 'bg-orange-100 dark:bg-orange-900/40',  text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
  Hijau:       { bg: 'bg-emerald-100 dark:bg-emerald-900/40',   text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
  'Biru Muda': { bg: 'bg-sky-100 dark:bg-sky-900/40',    text: 'text-sky-800 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700' },
  'Biru Tua':  { bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  'Coklat Muda':{ bg: 'bg-amber-100 dark:bg-amber-900/40',  text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
  Coklat:      { bg: 'bg-amber-100 dark:bg-amber-900/50',   text: 'text-amber-900 dark:text-amber-200', border: 'border-amber-400 dark:border-amber-700' },
  Hitam:       { bg: 'bg-gray-800 text-white',    text: 'text-gray-100',      border: 'border-red-500' },
};

function getBeltBadge(beltName?: string) {
  if (!beltName) return { bg: 'bg-slate-700', text: 'text-slate-100', border: 'border-slate-600' };
  for (const key of Object.keys(BELT_COLORS)) {
    if (beltName.toLowerCase().includes(key.toLowerCase())) {
      return BELT_COLORS[key];
    }
  }
  return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300' };
}

export default function OwnerFinance() {
  const [activeTab, setActiveTab] = useState<'kas' | 'penagihan' | 'analytics'>('kas');
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast System State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success', icon?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const defaultIcon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ️';
    const newToast: ToastNotification = { id, title, message, type, icon: icon || defaultIcon };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Transactions CRUD state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [txType, setTxType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [txCategory, setTxCategory] = useState('iuran');
  const [txAmount, setTxAmount] = useState(0);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDescription, setTxDescription] = useState('');

  // Transactions sorting & filtering
  const [sortTxField, setSortTxField] = useState<'transaction_date' | 'amount' | 'type'>('transaction_date');
  const [sortTxOrder, setSortTxOrder] = useState<'asc' | 'desc'>('desc');
  const [txFilterCategory, setTxFilterCategory] = useState<string>('all');
  const [txFilterType, setTxFilterType] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [txSearch, setTxSearch] = useState<string>('');

  const handleTxSort = (field: 'transaction_date' | 'amount' | 'type') => {
    if (sortTxField === field) {
      setSortTxOrder(sortTxOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortTxField(field);
      setSortTxOrder('desc');
    }
  };

  // -------------------------------------------------------------
  // Penagihan & Tunggakan Filter & Actions State
  // -------------------------------------------------------------
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
  const [billingYear, setBillingYear] = useState(new Date().getFullYear());
  const [billingSearch, setBillingSearch] = useState('');
  const [billingBeltFilter, setBillingBeltFilter] = useState('');
  const [billingStatusFilter, setBillingStatusFilter] = useState<'all' | 'belum_lunas' | 'lunas'>('belum_lunas');
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  // Quick Pay Modal State
  const [quickPayOpen, setQuickPayOpen] = useState(false);
  const [quickPayStudent, setQuickPayStudent] = useState<Student | null>(null);
  const [quickPayFee, setQuickPayFee] = useState<Fee | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState(20000);
  const [quickPayMethod, setQuickPayMethod] = useState<'transfer' | 'tunai' | 'qris'>('transfer');
  const [quickPayDate, setQuickPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickPayNotes, setQuickPayNotes] = useState('');
  const [quickPayMsg, setQuickPayMsg] = useState('');

  // Analytics Year Selector State
  const [analyticsYear, setAnalyticsYear] = useState<number>(new Date().getFullYear());

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
      type: txType,
      category: txCategory,
      amount: Number(txAmount),
      transaction_date: txDate,
      description: txDescription,
      created_by: userData?.user?.id || null,
    };

    if (editingTx) {
      const { error } = await supabase.from('finance_transactions').eq('id', editingTx.id).update(txData);
      if (error) {
        showToast('Gagal Memperbarui Transaksi', error.message, 'error', '✕');
        return;
      }
      showToast(
        'Transaksi Diperbarui',
        `Perubahan transaksi "${txDescription}" (Rp ${Number(txAmount).toLocaleString('id-ID')}) berhasil disimpan.`,
        'success',
        '✏️'
      );
    } else {
      const { error } = await supabase.from('finance_transactions').insert(txData);
      if (error) {
        showToast('Gagal Menambah Transaksi', error.message, 'error', '✕');
        return;
      }
      showToast(
        'Transaksi Berhasil Dicatat',
        `${txType === 'pemasukan' ? 'Pemasukan (+)' : 'Pengeluaran (-)'} sebesar Rp ${Number(txAmount).toLocaleString('id-ID')} (${txCategory}) telah masuk jurnal kas.`,
        'success',
        '💰'
      );
    }

    setIsModalOpen(false);
    setTxAmount(0); setTxDescription('');
    setEditingTx(null);
    loadData();
  };

  const handleDeleteTx = async (txId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi kas ini?')) {
      const { error } = await supabase.from('finance_transactions').eq('id', txId).delete();
      if (error) {
        showToast('Gagal Menghapus Transaksi', error.message, 'error', '✕');
        return;
      }
      showToast(
        'Transaksi Kas Dihapus',
        'Catatan transaksi telah dihapus dari pembukuan dojo.',
        'info',
        '🗑️'
      );
      loadData();
    }
  };

  // -------------------------------------------------------------
  // Quick Pay Modal Handler (Penagihan Tab)
  // -------------------------------------------------------------
  const openQuickPay = (student: Student, fee?: Fee) => {
    setQuickPayStudent(student);
    // Find existing fee for this student and period if available
    const matchedFee = fee || fees.find(
      (f) => f.student_id === student.id && Number(f.period_month) === Number(billingMonth) && Number(f.period_year) === Number(billingYear)
    ) || null;

    setQuickPayFee(matchedFee);
    setQuickPayAmount(matchedFee ? Number(matchedFee.amount) : 20000);
    setQuickPayMethod('transfer');
    setQuickPayDate(new Date().toISOString().split('T')[0]);
    setQuickPayNotes('');
    setQuickPayMsg('');
    setQuickPayOpen(true);
  };

  const handleQuickPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayStudent) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || null;

      // Find if fee row already exists for this student & selected period
      const existingFee = quickPayFee || fees.find(
        (f) => f.student_id === quickPayStudent.id && Number(f.period_month) === Number(billingMonth) && Number(f.period_year) === Number(billingYear)
      );

      if (existingFee) {
        // Update existing fee record to lunas
        const { error: updateErr } = await supabase.from('fees').eq('id', existingFee.id).update({
          status: 'lunas',
          amount: Number(quickPayAmount),
          paid_date: quickPayDate,
          payment_method: quickPayMethod,
          notes: quickPayNotes || existingFee.notes || 'Pelunasan via menu penagihan',
        });
        if (updateErr) throw new Error(updateErr.message);

        // Optimistically update local fees
        setFees((prev) =>
          prev.map((f) =>
            f.id === existingFee.id
              ? {
                  ...f,
                  status: 'lunas',
                  amount: Number(quickPayAmount),
                  paid_date: quickPayDate,
                  payment_method: quickPayMethod,
                  notes: quickPayNotes || existingFee.notes || 'Pelunasan via menu penagihan',
                }
              : f
          )
        );
      } else {
        // Insert new fee as lunas (DO NOT pass custom string ID, let Supabase generate UUID)
        const { data: insertedData, error: insertErr } = await supabase.from('fees').insert({
          student_id: quickPayStudent.id,
          period_month: Number(billingMonth),
          period_year: Number(billingYear),
          amount: Number(quickPayAmount),
          status: 'lunas',
          paid_date: quickPayDate,
          payment_method: quickPayMethod,
          notes: quickPayNotes || 'Pelunasan langsung via menu penagihan',
        }).select();

        if (insertErr) throw new Error(insertErr.message);

        const insertedFee = insertedData && insertedData.length > 0 ? insertedData[0] : null;

        // Optimistically update local fees
        if (insertedFee) {
          setFees((prev) => [...prev, insertedFee]);
        } else {
          setFees((prev) => [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              student_id: quickPayStudent.id,
              period_month: Number(billingMonth),
              period_year: Number(billingYear),
              amount: Number(quickPayAmount),
              status: 'lunas',
              paid_date: quickPayDate,
              payment_method: quickPayMethod,
              notes: quickPayNotes || 'Pelunasan langsung via menu penagihan',
            },
          ]);
        }
      }

      // Record in finance_transactions (DO NOT pass custom string ID)
      await supabase.from('finance_transactions').insert({
        type: 'pemasukan',
        category: 'iuran',
        amount: Number(quickPayAmount),
        transaction_date: quickPayDate,
        description: `Iuran Bulan ${months[billingMonth - 1]} ${billingYear} - ${quickPayStudent.full_name} (${quickPayMethod.toUpperCase()})`,
        created_by: currentUserId,
      });

      // Notify Parent if parent_id exists
      if (quickPayStudent.parent_id) {
        await supabase.from('notifications').insert({
          user_id: quickPayStudent.parent_id,
          title: 'Iuran Berhasil Dilunasi',
          message: `Pembayaran iuran bulanan Rp ${Number(quickPayAmount).toLocaleString('id-ID')} periode ${months[billingMonth - 1]} ${billingYear} untuk ${quickPayStudent.full_name} telah kami terima. Terima kasih!`,
          type: 'iuran',
          is_read: false,
        });
      }

      showToast(
        'Iuran Berhasil Dilunasi!',
        `Pelunasan Rp ${Number(quickPayAmount).toLocaleString('id-ID')} untuk ${quickPayStudent.full_name} (${months[billingMonth - 1]} ${billingYear}) via ${quickPayMethod.toUpperCase()} sukses dicatat ke kas.`,
        'success',
        '🥋'
      );

      setQuickPayOpen(false);
      // Reload full database to ensure complete sync
      loadData();
    } catch (err: any) {
      setQuickPayMsg(err?.message || 'Gagal memproses pelunasan.');
      showToast('Gagal Memproses Pelunasan', err?.message || 'Terjadi kesalahan sistem.', 'error', '✕');
    }
  };

  // WhatsApp Message Handlers
  const handleSendWhatsApp = (student: Student, arrears: ReturnType<typeof calculateStudentArrears>) => {
    const feeObj = arrears.currentMonthFee;
    const amount = feeObj ? Number(feeObj.amount) : 20000;
    const message = generateWhatsAppMessage({
      studentName: student.full_name,
      parentName: student.parent_name,
      monthName: months[billingMonth - 1],
      year: billingYear,
      amount: amount,
      totalArrearsAmount: arrears.totalUnpaidAmount,
      unpaidMonthsCount: arrears.unpaidCount,
      unpaidMonthDetails: arrears.unpaidMonthDetails,
    });

    const url = generateWhatsAppUrl(student.phone, message);
    window.open(url, '_blank');

    showToast(
      'Membuka WhatsApp Tagihan',
      `Format pesan penagihan Bank JAGO untuk ananda ${student.full_name} telah disiapkan dan dikirim ke nomor WhatsApp.`,
      'info',
      '📱'
    );
  };

  const handleCopyWhatsAppText = (student: Student, arrears: ReturnType<typeof calculateStudentArrears>) => {
    const feeObj = arrears.currentMonthFee;
    const amount = feeObj ? Number(feeObj.amount) : 20000;
    const message = generateWhatsAppMessage({
      studentName: student.full_name,
      parentName: student.parent_name,
      monthName: months[billingMonth - 1],
      year: billingYear,
      amount: amount,
      totalArrearsAmount: arrears.totalUnpaidAmount,
      unpaidMonthsCount: arrears.unpaidCount,
      unpaidMonthDetails: arrears.unpaidMonthDetails,
    });

    navigator.clipboard.writeText(message);
    setCopiedStudentId(student.id);
    setTimeout(() => {
      setCopiedStudentId(null);
    }, 2500);

    showToast(
      'Pesan Tagihan Disalin!',
      `Teks tagihan lengkap untuk ananda ${student.full_name} (${months[billingMonth - 1]} ${billingYear}) berhasil disalin ke clipboard.`,
      'success',
      '📋'
    );
  };

  // -------------------------------------------------------------
  // Computed Data & Billing Analysis
  // -------------------------------------------------------------
  const iuranIncome = fees.filter((f) => f.status === 'lunas').reduce((s, f) => s + Number(f.amount), 0);
  const otherIncome = transactions.filter((t) => t.type === 'pemasukan' && t.category !== 'iuran').reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = iuranIncome + otherIncome;
  const totalExpense = transactions.filter((t) => t.type === 'pengeluaran').reduce((s, t) => s + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;

  // Filtered & Sorted Transactions for Tab 1
  const filteredTransactions = transactions.filter((t) => {
    if (txFilterType !== 'all' && t.type !== txFilterType) return false;
    if (txFilterCategory !== 'all' && t.category !== txFilterCategory) return false;
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      if (!matchDesc && !matchCat) return false;
    }
    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
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

  // 6-Month Cash Flow Chart Data
  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: monthsShort[d.getMonth()] };
  });
  const chartData = chartMonths.map((cm) => {
    const monthFees = fees.filter((f) => f.status === 'lunas' && f.period_month === cm.month && f.period_year === cm.year);
    const monthFeeIncome = monthFees.reduce((s, f) => s + Number(f.amount), 0);
    const monthOtherIncome = transactions
      .filter((t) => t.type === 'pemasukan' && t.category !== 'iuran' && new Date(t.transaction_date).getMonth() + 1 === cm.month && new Date(t.transaction_date).getFullYear() === cm.year)
      .reduce((s, t) => s + Number(t.amount), 0);
    const monthExpense = transactions
      .filter((t) => t.type === 'pengeluaran' && new Date(t.transaction_date).getMonth() + 1 === cm.month && new Date(t.transaction_date).getFullYear() === cm.year)
      .reduce((s, t) => s + Number(t.amount), 0);

    return {
      ...cm,
      income: monthFeeIncome + monthOtherIncome,
      expense: monthExpense,
      net: (monthFeeIncome + monthOtherIncome) - monthExpense,
    };
  });
  const chartMax = Math.max(...chartData.flatMap((d) => [d.income, d.expense]), 1);

  // Active students billing aggregation
  const activeStudents = students.filter((s) => s.status === 'active');
  const studentBillingList = activeStudents.map((student) => {
    const arrears = calculateStudentArrears(student.id, fees, billingMonth, billingYear, 20000);
    return {
      student,
      arrears,
      isPaid: arrears.isCurrentMonthPaid,
      fee: arrears.currentMonthFee,
    };
  });

  // KPI Calculations for selected billing period
  const totalActive = activeStudents.length;
  const totalPaidSelectedMonth = studentBillingList.filter((d) => d.isPaid).length;
  const totalUnpaidSelectedMonth = studentBillingList.filter((d) => !d.isPaid).length;
  const billingComplianceRate = totalActive > 0 ? Math.round((totalPaidSelectedMonth / totalActive) * 100) : 100;
  const totalUnpaidNominalSelectedMonth = studentBillingList.filter((d) => !d.isPaid).reduce((sum, d) => sum + (d.fee ? Number(d.fee.amount) : 20000), 0);
  const multiMonthArrearsCount = studentBillingList.filter((d) => d.arrears.unpaidCount > 1).length;

  // Filtered list for display in Penagihan Table
  const filteredBillingList = studentBillingList.filter((item) => {
    if (billingSearch.trim()) {
      const q = billingSearch.toLowerCase();
      const matchName = item.student.full_name?.toLowerCase().includes(q);
      const matchParent = item.student.parent_name?.toLowerCase().includes(q);
      const matchPhone = item.student.phone?.toLowerCase().includes(q);
      if (!matchName && !matchParent && !matchPhone) return false;
    }
    if (billingBeltFilter && !item.student.current_belt?.toLowerCase().includes(billingBeltFilter.toLowerCase())) {
      return false;
    }
    if (billingStatusFilter === 'belum_lunas' && item.isPaid) return false;
    if (billingStatusFilter === 'lunas' && !item.isPaid) return false;
    return true;
  });

  // Export CSV handler for Penagihan Tab
  const handleExportBillingCSV = () => {
    const exportItems = filteredBillingList.map((item) => ({
      student: item.student,
      parentName: item.student.parent_name || '',
      phone: item.student.phone || '',
      belt: item.student.current_belt || 'Putih',
      currentMonthStatus: item.isPaid ? 'Lunas' : 'Belum Lunas',
      currentMonthAmount: item.fee ? Number(item.fee.amount) : 20000,
      totalArrearsAmount: item.arrears.totalUnpaidAmount,
      unpaidMonthsCount: item.arrears.unpaidCount,
      unpaidDetails: item.arrears.unpaidMonthDetails.join('; '),
    }));

    const csvContent = generateUnpaidBillingCsv(exportItems, billingMonth, billingYear);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Penagihan_Iuran_${months[billingMonth - 1]}_${billingYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(
      'Ekspor CSV Berhasil',
      `File rekap penagihan iuran periode ${months[billingMonth - 1]} ${billingYear} (${exportItems.length} data siswa) berhasil diunduh.`,
      'success',
      '📥'
    );
  };

  const exportKasCSV = () => {
    const header = 'Tanggal,Tipe,Kategori,Keterangan,Nominal';
    const rows = sortedTransactions.map((t) => `${t.transaction_date},${t.type},${t.category},"${t.description}",${t.amount}`);
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `transaksi-dojo-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);

    showToast(
      'Ekspor CSV Kas Berhasil',
      `Jurnal transaksi kas dojo (${sortedTransactions.length} baris) berhasil diunduh.`,
      'success',
      '📊'
    );
  };

  // -------------------------------------------------------------
  // Analytics & Tren Detailed Calculations (Real Dynamic Data)
  // -------------------------------------------------------------
  const yearlyAnalyticsMonths = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthFees = fees.filter((f) => f.status === 'lunas' && f.period_month === monthNum && f.period_year === analyticsYear);
    const feeIncome = monthFees.reduce((s, f) => s + Number(f.amount), 0);

    const otherInc = transactions
      .filter((t) => t.type === 'pemasukan' && t.category !== 'iuran' && new Date(t.transaction_date).getMonth() + 1 === monthNum && new Date(t.transaction_date).getFullYear() === analyticsYear)
      .reduce((s, t) => s + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === 'pengeluaran' && new Date(t.transaction_date).getMonth() + 1 === monthNum && new Date(t.transaction_date).getFullYear() === analyticsYear)
      .reduce((s, t) => s + Number(t.amount), 0);

    const paidCount = monthFees.length;
    const complianceRate = totalActive > 0 ? Math.round((paidCount / totalActive) * 100) : 0;

    return {
      monthNum,
      label: monthsShort[i],
      fullName: months[i],
      feeIncome,
      otherInc,
      totalIncome: feeIncome + otherInc,
      expense,
      net: (feeIncome + otherInc) - expense,
      paidCount,
      complianceRate,
    };
  });

  const yearlyTotalIncome = yearlyAnalyticsMonths.reduce((s, m) => s + m.totalIncome, 0);
  const yearlyTotalExpense = yearlyAnalyticsMonths.reduce((s, m) => s + m.expense, 0);
  const yearlyNetProfit = yearlyTotalIncome - yearlyTotalExpense;
  const yearlyAvgMonthlyIncome = Math.round(yearlyTotalIncome / 12);
  const yearlyAvgCompliance = Math.round(yearlyAnalyticsMonths.reduce((s, m) => s + m.complianceRate, 0) / 12);
  const yearlyChartMax = Math.max(...yearlyAnalyticsMonths.flatMap((m) => [m.totalIncome, m.expense]), 1);

  // Income Breakdown by category
  const incomeCategoryBreakdown = ['iuran', 'ujian', 'donasi', 'pendaftaran', 'umum'].map((cat) => {
    let amount = 0;
    if (cat === 'iuran') {
      amount = fees.filter((f) => f.status === 'lunas' && f.period_year === analyticsYear).reduce((s, f) => s + Number(f.amount), 0);
    } else {
      amount = transactions
        .filter((t) => t.type === 'pemasukan' && t.category === cat && new Date(t.transaction_date).getFullYear() === analyticsYear)
        .reduce((s, t) => s + Number(t.amount), 0);
    }
    const percent = yearlyTotalIncome > 0 ? Math.round((amount / yearlyTotalIncome) * 100) : 0;
    return { category: cat, amount, percent };
  }).filter((c) => c.amount > 0 || c.category === 'iuran');

  // Expense Breakdown by category
  const expenseCategoryBreakdown = ['sewa', 'honor', 'peralatan', 'konsumsi', 'umum'].map((cat) => {
    const amount = transactions
      .filter((t) => t.type === 'pengeluaran' && t.category === cat && new Date(t.transaction_date).getFullYear() === analyticsYear)
      .reduce((s, t) => s + Number(t.amount), 0);
    const percent = yearlyTotalExpense > 0 ? Math.round((amount / yearlyTotalExpense) * 100) : 0;
    return { category: cat, amount, percent };
  }).filter((c) => c.amount > 0 || c.category === 'sewa');

  // Student Demographics
  const beltDistribution = Object.keys(BELT_COLORS).map((belt) => {
    const count = students.filter((s) => s.status === 'active' && s.current_belt?.toLowerCase().includes(belt.toLowerCase())).length;
    const percent = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;
    return { belt, count, percent, style: BELT_COLORS[belt] };
  }).filter((b) => b.count > 0);

  const maleCount = students.filter((s) => s.gender?.toLowerCase().startsWith('l')).length;
  const femaleCount = students.filter((s) => s.gender?.toLowerCase().startsWith('p')).length;

  const statCards = [
    { label: 'Total Pemasukan Kas', value: `Rp ${totalIncome.toLocaleString('id-ID')}`, color: 'var(--md-sys-color-tertiary-container)', textColor: 'var(--md-sys-color-on-tertiary-container)', icon: '↑' },
    { label: 'Total Pengeluaran Kas', value: `Rp ${totalExpense.toLocaleString('id-ID')}`, color: 'var(--md-sys-color-error-container)', textColor: 'var(--md-sys-color-on-error-container)', icon: '↓' },
    { label: 'Sisa Saldo Kas (Net)', value: `Rp ${netProfit.toLocaleString('id-ID')}`, color: netProfit >= 0 ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-error-container)', textColor: netProfit >= 0 ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-error-container)', icon: '=' },
  ];

  return (
    <Navigation>
      <div className="space-y-6 pb-12 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Keuangan Dojo
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Kelola kas operasional, pantau siswa yang belum membayar iuran, dan pantau performa finansial dojo.
            </p>
          </div>
          {activeTab === 'kas' && (
            <button onClick={openAddTxModal} className="m3-btn-filled px-5 py-2.5 text-sm font-medium cursor-pointer">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Tambah Transaksi
            </button>
          )}
        </div>

        {/* 3 Main Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] w-fit mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('kas')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'kas'
                ? 'bg-[var(--md-sys-color-primary)] text-white shadow-sm'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            📋 Pembukuan &amp; Kas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('penagihan')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'penagihan'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <span>⚠️</span> Penagihan &amp; Tunggakan
            {totalUnpaidSelectedMonth > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-red-500 text-white rounded-full font-bold">
                {totalUnpaidSelectedMonth}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[var(--md-sys-color-primary)] text-white shadow-sm'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            📊 Analytics &amp; Tren
          </button>
        </div>

        {/* TAB 1: PEMBUKUAN & KAS */}
        {activeTab === 'kas' && (
          <div className="space-y-6 animate-fade-in">
            {/* Finance Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statCards.map(({ label, value, color, textColor, icon }) => (
                <div key={label} className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col gap-2"
                  style={{ background: color }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: textColor, opacity: 0.8 }}>{label}</span>
                    <span className="text-lg font-bold" style={{ color: textColor }}>{icon}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: textColor }}>{loading ? '—' : value}</p>
                </div>
              ))}
            </div>

            {/* Tren Keuangan 6 Bulan Terakhir */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)]"
              style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '24px' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Tren Arus Kas 6 Bulan Terakhir
                  </h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Perbandingan real-time antara total penerimaan kas vs pengeluaran operasional dojo.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Pemasukan
                  </span>
                  <span className="flex items-center gap-1.5 text-red-500">
                    <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Pengeluaran
                  </span>
                </div>
              </div>

              <div className="flex items-end gap-3 h-44 pt-4 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-36">
                      {/* Income Bar */}
                      <div
                        title={`Pemasukan ${d.label} ${d.year}: Rp ${d.income.toLocaleString('id-ID')}`}
                        className="w-full max-w-[28px] rounded-t-md transition-all duration-500 bg-emerald-500 hover:opacity-80 cursor-pointer"
                        style={{ height: `${(d.income / chartMax) * 100}%`, minHeight: d.income > 0 ? '6px' : '0' }}
                      />
                      {/* Expense Bar */}
                      <div
                        title={`Pengeluaran ${d.label} ${d.year}: Rp ${d.expense.toLocaleString('id-ID')}`}
                        className="w-full max-w-[28px] rounded-t-md transition-all duration-500 bg-red-500 hover:opacity-80 cursor-pointer"
                        style={{ height: `${(d.expense / chartMax) * 100}%`, minHeight: d.expense > 0 ? '6px' : '0' }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Jurnal Transaksi Kas Dojo */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Jurnal Transaksi Kas Dojo
                  </h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Catatan seluruh buku kas masuk dan keluar secara kronologis.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Type Filter */}
                  <select
                    className="m3-textfield-outlined text-xs py-1.5 px-3 rounded-lg"
                    value={txFilterType}
                    onChange={(e) => setTxFilterType(e.target.value as any)}
                  >
                    <option value="all">Semua Tipe</option>
                    <option value="pemasukan">Pemasukan (+)</option>
                    <option value="pengeluaran">Pengeluaran (-)</option>
                  </select>

                  {/* Category Filter */}
                  <select
                    className="m3-textfield-outlined text-xs py-1.5 px-3 rounded-lg"
                    value={txFilterCategory}
                    onChange={(e) => setTxFilterCategory(e.target.value)}
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="iuran">Iuran Bulanan</option>
                    <option value="ujian">Ujian Sabuk</option>
                    <option value="donasi">Donasi</option>
                    <option value="sewa">Sewa Tempat</option>
                    <option value="honor">Honor Pelatih</option>
                    <option value="peralatan">Peralatan Dojo</option>
                    <option value="umum">Umum</option>
                  </select>

                  <button onClick={exportKasCSV} className="m3-btn-outlined px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Unduh CSV Kas
                  </button>
                </div>
              </div>

              {/* Search Bar Transaksi */}
              <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <input
                  type="text"
                  placeholder="Cari transaksi berdasarkan keterangan atau kategori..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="m3-textfield-outlined w-full text-xs py-2 px-3 rounded-lg"
                />
              </div>

              {loading ? (
                <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-[var(--md-sys-shape-corner-medium)]" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}</div>
              ) : sortedTransactions.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Tidak ada catatan transaksi yang sesuai.
                </div>
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
                        <tr key={tx.id} style={{ borderBottom: idx < sortedTransactions.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}
                          className="hover:bg-white/5 transition-colors">
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
                          <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{tx.description}</td>
                          <td className={`px-5 py-3.5 text-sm text-right font-bold`}
                            style={{ color: tx.type === 'pemasukan' ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-error)' }}>
                            {tx.type === 'pemasukan' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEditTxModal(tx)} className="m3-btn-text py-1 px-2 font-semibold cursor-pointer">Edit</button>
                              <button onClick={() => handleDeleteTx(tx.id)} className="m3-btn-text py-1 px-2 font-semibold cursor-pointer" style={{ color: 'var(--md-sys-color-error)' }}>Hapus</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PENAGIHAN & TUNGGAKAN IURAN */}
        {activeTab === 'penagihan' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards Penagihan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col justify-between"
                style={{ background: 'var(--md-sys-color-error-container)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-error-container)' }}>
                    Belum Lunas ({months[billingMonth - 1]})
                  </span>
                  <span className="text-base font-bold">⚠️</span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black" style={{ color: 'var(--md-sys-color-on-error-container)' }}>
                    {loading ? '—' : `${totalUnpaidSelectedMonth} Siswa`}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-85" style={{ color: 'var(--md-sys-color-on-error-container)' }}>
                    dari total {totalActive} siswa aktif dojo
                  </p>
                </div>
              </div>

              <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col justify-between"
                style={{ background: 'var(--md-sys-color-surface-container-high)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Tertunggak Periode Ini
                  </span>
                  <span className="text-base font-bold text-amber-500">💰</span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {loading ? '—' : `Rp ${totalUnpaidNominalSelectedMonth.toLocaleString('id-ID')}`}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    potensi dana iuran bulan ini
                  </p>
                </div>
              </div>

              <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col justify-between"
                style={{ background: 'var(--md-sys-color-tertiary-container)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>
                    Kepatuhan Iuran
                  </span>
                  <span className="text-base font-bold text-emerald-600">✓</span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black" style={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>
                    {loading ? '—' : `${billingComplianceRate}%`}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-85" style={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>
                    {totalPaidSelectedMonth} dari {totalActive} siswa lunas
                  </p>
                </div>
              </div>

              <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col justify-between"
                style={{ background: multiMonthArrearsCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--md-sys-color-surface-container-high)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: multiMonthArrearsCount > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface)' }}>
                    Nunggak &gt; 1 Bulan
                  </span>
                  <span className="text-base font-bold text-red-500">🚨</span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black" style={{ color: multiMonthArrearsCount > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface)' }}>
                    {loading ? '—' : `${multiMonthArrearsCount} Siswa`}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    memiliki akumulasi tunggakan lama
                  </p>
                </div>
              </div>
            </div>

            {/* Filter & Control Bar */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col gap-4"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Period Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Periode:</span>
                    <select
                      className="m3-textfield-outlined text-xs py-1.5 px-3 rounded-lg"
                      value={billingMonth}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setBillingMonth(m);
                        showToast('Periode Diubah', `Menampilkan tagihan untuk bulan ${months[m - 1]} ${billingYear}`, 'info', '📅');
                      }}
                    >
                      {months.map((m, idx) => (
                        <option key={idx} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="m3-textfield-outlined text-xs py-1.5 px-2 w-20 rounded-lg"
                      value={billingYear}
                      onChange={(e) => {
                        const yr = Number(e.target.value);
                        setBillingYear(yr);
                        showToast('Tahun Diubah', `Menampilkan tagihan tahun ${yr}`, 'info', '📅');
                      }}
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container)] p-1 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setBillingStatusFilter('belum_lunas')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        billingStatusFilter === 'belum_lunas'
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      Belum Lunas ({totalUnpaidSelectedMonth})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingStatusFilter('lunas')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        billingStatusFilter === 'lunas'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      Lunas ({totalPaidSelectedMonth})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingStatusFilter('all')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        billingStatusFilter === 'all'
                          ? 'bg-[var(--md-sys-color-primary)] text-white shadow-sm'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      Semua ({totalActive})
                    </button>
                  </div>
                </div>

                {/* Export Action */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportBillingCSV}
                    className="m3-btn-outlined px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    title="Unduh data tagihan ke format CSV"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Ekspor CSV
                  </button>
                </div>
              </div>

              {/* Search & Belt Sub-filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="sm:col-span-2 relative">
                  <input
                    type="text"
                    placeholder="Cari nama siswa, orang tua, atau nomor telepon..."
                    value={billingSearch}
                    onChange={(e) => setBillingSearch(e.target.value)}
                    className="m3-textfield-outlined w-full text-xs py-2 pl-9 pr-3 rounded-lg"
                  />
                  <svg className="w-4 h-4 absolute left-3 top-2.5 text-[var(--md-sys-color-on-surface-variant)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {billingSearch && (
                    <button
                      onClick={() => setBillingSearch('')}
                      className="absolute right-3 top-2 text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div>
                  <select
                    className="m3-textfield-outlined w-full text-xs py-2 px-3 rounded-lg"
                    value={billingBeltFilter}
                    onChange={(e) => setBillingBeltFilter(e.target.value)}
                  >
                    <option value="">Semua Tingkat Sabuk</option>
                    {Object.keys(BELT_COLORS).map((belt) => (
                      <option key={belt} value={belt}>Sabuk {belt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Billing List Table */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden shadow-sm"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Daftar Penagihan Siswa ({months[billingMonth - 1]} {billingYear})
                  </h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Menampilkan {filteredBillingList.length} siswa sesuai kriteria filter.
                  </p>
                </div>
                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span>🏦</span>
                  <span>Rekening: <b>Bank JAGO 501072411966</b></span>
                </div>
              </div>

              {loading ? (
                <div className="p-6 space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-[var(--md-sys-shape-corner-medium)]" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}</div>
              ) : filteredBillingList.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-4xl">🎉</span>
                  <h4 className="text-base font-bold mt-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Tidak ada data siswa
                  </h4>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                    {billingStatusFilter === 'belum_lunas'
                      ? `Hebat! Semua siswa sudah melunasi iuran untuk periode ${months[billingMonth - 1]} ${billingYear}.`
                      : 'Tidak ditemukan siswa dengan filter yang dipilih.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Siswa &amp; Sabuk
                        </th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Orang Tua / Kontak WA
                        </th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Status {months[billingMonth - 1]}
                        </th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Akumulasi Tunggakan
                        </th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Aksi Penagihan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBillingList.map(({ student, arrears, isPaid, fee }, idx) => {
                        const beltStyle = getBeltBadge(student.current_belt);
                        const hasPhone = Boolean(student.phone);
                        const isCopied = copiedStudentId === student.id;

                        return (
                          <tr key={student.id} style={{ borderBottom: idx < filteredBillingList.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}
                            className="hover:bg-white/5 transition-colors">
                            {/* Student Name & Belt */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold flex items-center justify-center text-xs flex-shrink-0">
                                  {student.full_name?.slice(0, 2).toUpperCase() || 'SW'}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                    {student.full_name}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border}`}>
                                      🥋 {student.current_belt || 'Putih'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Parent & Phone */}
                            <td className="px-5 py-4">
                              <div className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                {student.parent_name ? `Bpk/Ibu ${student.parent_name}` : '— (Data ortu belum lengkap)'}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {hasPhone ? (
                                  <>
                                    <span className="font-mono text-[11px]">{student.phone}</span>
                                    <a
                                      href={`https://wa.me/${formatWhatsAppNumber(student.phone)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-500 hover:text-emerald-400 font-semibold text-[10px] flex items-center gap-0.5"
                                    >
                                      Chat WA ↗
                                    </a>
                                  </>
                                ) : (
                                  <span className="text-red-400 text-[10px]">No HP belum ada</span>
                                )}
                              </div>
                            </td>

                            {/* Status Selected Month */}
                            <td className="px-5 py-4">
                              {isPaid ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                                    style={{ background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }}>
                                    <span>✓</span> Lunas
                                  </span>
                                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                    Rp {fee ? Number(fee.amount).toLocaleString('id-ID') : '20.000'} {fee?.payment_method ? `(${fee.payment_method})` : ''}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                                    style={{ background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }}>
                                    <span>⚠️</span> Belum Lunas
                                  </span>
                                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-medium">
                                    Tagihan: Rp {fee ? Number(fee.amount).toLocaleString('id-ID') : '20.000'}
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* Arrears Summary */}
                            <td className="px-5 py-4">
                              {arrears.unpaidCount > 1 ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                    🚨 Nunggak {arrears.unpaidCount} Bulan
                                  </span>
                                  <p className="text-xs font-bold text-red-500">
                                    Total: Rp {arrears.totalUnpaidAmount.toLocaleString('id-ID')}
                                  </p>
                                  <p className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] max-w-xs truncate" title={arrears.unpaidMonthDetails.join(', ')}>
                                    {arrears.unpaidMonthDetails.join(', ')}
                                  </p>
                                </div>
                              ) : arrears.unpaidCount === 1 ? (
                                <div className="text-xs">
                                  <span className="text-[var(--md-sys-color-on-surface)] font-medium">1 Periode</span>
                                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                    Rp {arrears.totalUnpaidAmount.toLocaleString('id-ID')}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                                  <span>✨</span> Semua Lunas
                                </div>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {/* 1-Click WhatsApp Reminder */}
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsApp(student, arrears)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1 cursor-pointer"
                                  title="Kirim pesan penagihan otomatis ke WhatsApp Orang Tua"
                                >
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
                                  </svg>
                                  Tagih WA
                                </button>

                                {/* Copy Message */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyWhatsAppText(student, arrears)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] transition-all flex items-center gap-1 cursor-pointer"
                                  title="Salin teks tagihan lengkap ke clipboard"
                                >
                                  {isCopied ? (
                                    <span className="text-emerald-500 font-bold">✓ Tersalin</span>
                                  ) : (
                                    <>
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Salin
                                    </>
                                  )}
                                </button>

                                {/* Quick Pay Button */}
                                {!isPaid ? (
                                  <button
                                    type="button"
                                    onClick={() => openQuickPay(student, fee)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] hover:opacity-90 text-white transition-all cursor-pointer"
                                  >
                                    Bayar
                                  </button>
                                ) : (
                                  <span className="px-2.5 py-1 text-xs font-semibold text-emerald-500 flex items-center gap-1">
                                    ✓ Lunas
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS & TREN */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            {/* Year Selector & Summary Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container-low)]">
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Performa Finansial &amp; Analisis Dojo
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Analisis terpadu tren pemasukan, efisiensi kas operasional, dan tingkat kepatuhan atlet.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Tahun Analisis:
                </span>
                <select
                  className="m3-textfield-outlined text-xs py-1.5 px-3 rounded-lg font-bold"
                  value={analyticsYear}
                  onChange={(e) => {
                    const yr = Number(e.target.value);
                    setAnalyticsYear(yr);
                    showToast('Tahun Analisis Berubah', `Memuat visualisasi tren finansial tahun ${yr}`, 'info', '📊');
                  }}
                >
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr}>Tahun {yr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Executive KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container-high)] flex flex-col justify-between">
                <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                  Total Pemasukan ({analyticsYear})
                </span>
                <div className="mt-2">
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    Rp {yearlyTotalIncome.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Iuran: Rp {fees.filter(f => f.status === 'lunas' && f.period_year === analyticsYear).reduce((s, f) => s + Number(f.amount), 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container-high)] flex flex-col justify-between">
                <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                  Total Pengeluaran ({analyticsYear})
                </span>
                <div className="mt-2">
                  <p className="text-2xl font-black text-red-500">
                    Rp {yearlyTotalExpense.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Sewa, honor pelatih, dll
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container-high)] flex flex-col justify-between">
                <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                  Surplus / Net Profit ({analyticsYear})
                </span>
                <div className="mt-2">
                  <p className={`text-2xl font-black ${yearlyNetProfit >= 0 ? 'text-[var(--md-sys-color-primary)]' : 'text-red-500'}`}>
                    Rp {yearlyNetProfit.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Rata-rata/bln: Rp {yearlyAvgMonthlyIncome.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container-high)] flex flex-col justify-between">
                <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                  Rata-rata Kepatuhan Iuran
                </span>
                <div className="mt-2">
                  <p className="text-2xl font-black text-blue-500">
                    {yearlyAvgCompliance}%
                  </p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    dari {totalActive} atlet aktif
                  </p>
                </div>
              </div>
            </div>

            {/* 12-Month Yearly Cash Flow Chart */}
            <div className="m3-card-elevated p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h4 className="font-bold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Grafik Arus Kas Bulanan (12 Bulan {analyticsYear})
                  </h4>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Visualisasi pemasukan vs pengeluaran riil setiap bulan di tahun {analyticsYear}.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Pemasukan
                  </span>
                  <span className="flex items-center gap-1.5 text-red-500">
                    <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Pengeluaran
                  </span>
                </div>
              </div>

              <div className="flex items-end gap-2 sm:gap-3 h-52 pt-4 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                {yearlyAnalyticsMonths.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-40">
                      {/* Income Bar */}
                      <div
                        title={`${m.fullName} ${analyticsYear} Pemasukan: Rp ${m.totalIncome.toLocaleString('id-ID')}`}
                        className="w-full max-w-[20px] rounded-t-md transition-all duration-500 bg-emerald-500 hover:opacity-80 cursor-pointer"
                        style={{ height: `${(m.totalIncome / yearlyChartMax) * 100}%`, minHeight: m.totalIncome > 0 ? '4px' : '0' }}
                      />
                      {/* Expense Bar */}
                      <div
                        title={`${m.fullName} ${analyticsYear} Pengeluaran: Rp ${m.expense.toLocaleString('id-ID')}`}
                        className="w-full max-w-[20px] rounded-t-md transition-all duration-500 bg-red-500 hover:opacity-80 cursor-pointer"
                        style={{ height: `${(m.expense / yearlyChartMax) * 100}%`, minHeight: m.expense > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Income & Expense Breakdown Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Categories Breakdown */}
              <div className="m3-card-elevated p-6">
                <h4 className="font-bold text-base mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Sumber Pemasukan ({analyticsYear})
                </h4>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-4">
                  Distribusi pemasukan kas berdasarkan kategori.
                </p>

                <div className="space-y-3">
                  {incomeCategoryBreakdown.map((c) => (
                    <div key={c.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="capitalize" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                          {c.category === 'iuran' ? '🥋 Iuran Bulanan Siswa' : c.category === 'ujian' ? '📜 Ujian Kenaikan Sabuk' : c.category === 'donasi' ? '🎁 Donasi & Sponsor' : c.category}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Rp {c.amount.toLocaleString('id-ID')} ({c.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-container)] overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${c.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Categories Breakdown */}
              <div className="m3-card-elevated p-6">
                <h4 className="font-bold text-base mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Alokasi Pengeluaran ({analyticsYear})
                </h4>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-4">
                  Distribusi belanja operasional dojo berdasarkan pos anggaran.
                </p>

                {expenseCategoryBreakdown.length === 0 ? (
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] py-4">Belum ada catatan pengeluaran di tahun {analyticsYear}.</p>
                ) : (
                  <div className="space-y-3">
                    {expenseCategoryBreakdown.map((c) => (
                      <div key={c.category} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="capitalize" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            {c.category === 'sewa' ? '🏠 Sewa Gedung & Tempat' : c.category === 'honor' ? '🥋 Honor & Insentif Pelatih' : c.category === 'peralatan' ? '🥊 Peralatan & Matras' : c.category}
                          </span>
                          <span className="text-red-500">
                            Rp {c.amount.toLocaleString('id-ID')} ({c.percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-container)] overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${c.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Demographics & Belt Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Belt Distribution */}
              <div className="m3-card-elevated p-6">
                <h4 className="font-bold text-base mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Distribusi Sabuk Siswa Aktif
                </h4>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-4">
                  Komposisi tingkatan sabuk {totalActive} atlet karate aktif di Dojo KKI DPL.
                </p>

                <div className="space-y-2.5">
                  {beltDistribution.map((b) => (
                    <div key={b.belt} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${b.style.bg} ${b.style.text} ${b.style.border}`}>
                          Sabuk {b.belt}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{b.count} Atlet</span>
                        <span className="text-[var(--md-sys-color-on-surface-variant)] text-[11px]">({b.percent}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gender & Athlete Stats */}
              <div className="m3-card-elevated p-6 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-base mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Demografi &amp; Partisipasi Atlet
                  </h4>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-4">
                    Rasio gender dan status keaktifan peserta didik.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 font-bold flex items-center justify-center text-lg">
                        🥋
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Laki-laki</span>
                        <p className="text-lg font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{maleCount} Atlet</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-500 font-bold flex items-center justify-center text-lg">
                        🥋
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Perempuan</span>
                        <p className="text-lg font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{femaleCount} Atlet</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                  <div className="flex justify-between text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                    <span>Total Siswa Terdaftar: {students.length} Siswa</span>
                    <span className="text-emerald-500">{totalActive} Aktif ({students.length > 0 ? Math.round((totalActive/students.length)*100) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
              <button type="button" onClick={() => setIsModalOpen(false)} className="m3-btn-text px-5 py-2.5 text-sm cursor-pointer">Batal</button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm cursor-pointer">Simpan</button>
            </div>
          </form>
        </M3Dialog>

        {/* Modal Quick Pay (Pelunasan Cepat Penagihan) */}
        <M3Dialog
          open={quickPayOpen}
          onClose={() => setQuickPayOpen(false)}
          title={`Pelunasan Iuran: ${quickPayStudent?.full_name || ''}`}
        >
          <form onSubmit={handleQuickPaySubmit} className="space-y-4">
            {quickPayMsg && (
              <div className="p-3 rounded-lg text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                {quickPayMsg}
              </div>
            )}

            <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Periode Iuran:</span>
                <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                  {months[billingMonth - 1]} {billingYear}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Siswa:</span>
                <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                  {quickPayStudent?.full_name} ({quickPayStudent?.current_belt})
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Orang Tua:</span>
                <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                  {quickPayStudent?.parent_name || '-'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Nominal Dibayar (Rp) *
                </label>
                <input
                  type="number"
                  required
                  className={inputClass}
                  value={quickPayAmount}
                  onChange={(e) => setQuickPayAmount(Number(e.target.value))}
                />
              </div>

              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Metode Pembayaran *
                </label>
                <select
                  className={inputClass}
                  value={quickPayMethod}
                  onChange={(e) => setQuickPayMethod(e.target.value as 'transfer' | 'tunai' | 'qris')}
                >
                  <option value="transfer">Transfer Bank (JAGO)</option>
                  <option value="tunai">Tunai / Cash</option>
                  <option value="qris">QRIS Dojo</option>
                </select>
              </div>
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Tanggal Pelunasan *
              </label>
              <input
                type="date"
                required
                className={inputClass}
                value={quickPayDate}
                onChange={(e) => setQuickPayDate(e.target.value)}
              />
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Catatan Transaksi (Opsional)
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="mis. Bukti transfer WA terlampir"
                value={quickPayNotes}
                onChange={(e) => setQuickPayNotes(e.target.value)}
              />
            </div>

            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] p-2 rounded-lg bg-[var(--md-sys-color-surface-container)]">
              ℹ️ Pelunasan ini otomatis dicatat ke dalam Jurnal Pemasukan Kas Dojo dan mengirim notifikasi ke akun orang tua.
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
              <button
                type="button"
                onClick={() => setQuickPayOpen(false)}
                className="m3-btn-text px-5 py-2.5 text-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="m3-btn-filled px-5 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                Konfirmasi Lunas &amp; Catat Kas
              </button>
            </div>
          </form>
        </M3Dialog>

        {/* Floating Toast Notification Container */}
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3 transition-all duration-300 transform translate-y-0 ${
                toast.type === 'success'
                  ? 'bg-slate-900/95 text-white border-emerald-500/50 shadow-emerald-950/40'
                  : toast.type === 'error'
                  ? 'bg-slate-900/95 text-white border-red-500/50 shadow-red-950/40'
                  : toast.type === 'warning'
                  ? 'bg-slate-900/95 text-white border-amber-500/50 shadow-amber-950/40'
                  : 'bg-slate-900/95 text-white border-blue-500/50 shadow-blue-950/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : toast.type === 'error'
                  ? 'bg-red-500/20 text-red-400'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {toast.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold leading-tight tracking-wide">{toast.title}</h5>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug break-words">{toast.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-md transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </Navigation>
  );
}
