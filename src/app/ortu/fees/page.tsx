'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee } from '@/lib/mockData';

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function OrtuFees() {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: kidsData } = await supabase.from('students').eq('parent_id', userData.user.id).select('*');
      if (kidsData) {
        setChildren(kidsData);
        if (kidsData.length > 0) {
          setSelectedChild(kidsData[0].id);
        }
        const kidIds = kidsData.map((k: Student) => k.id);
        if (kidIds.length > 0) {
          const { data: feesData } = await supabase.from('fees').in('student_id', kidIds).select('*');
          if (feesData) setFees(feesData);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getStudentName = (id: string) => children.find((k) => k.id === id)?.full_name ?? '';

  const filteredFees = fees.filter(f => !selectedChild || f.student_id === selectedChild);

  const totalUnpaid = filteredFees.filter((f) => f.status !== 'lunas').reduce((s, f) => s + Number(f.amount), 0);
  const totalPaid = filteredFees.filter((f) => f.status === 'lunas').reduce((s, f) => s + Number(f.amount), 0);

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Rincian Iuran Bulanan
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Status tagihan dan tata cara pelunasan iuran latihan dojo KKI DPL.
          </p>
        </div>

        {/* Summary cards */}
        {!loading && fees.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl p-5 border border-[var(--neu-border)]"
              style={{ background: 'rgba(52,211,153,0.12)' }}>
              <span className="text-xs font-medium" style={{ color: '#10b981', opacity: 0.8 }}>Total Lunas</span>
              <p className="text-xl font-bold mt-1" style={{ color: '#10b981' }}>
                Rp {totalPaid.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="rounded-3xl p-5 border border-[var(--neu-border)]"
              style={{ background: totalUnpaid > 0 ? 'rgba(248,113,113,0.12)' : 'var(--neu-surface-low)', boxShadow: totalUnpaid > 0 ? 'none' : 'var(--neu-shadow-pressed-sm)' }}>
              <span className="text-xs font-medium" style={{ color: totalUnpaid > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)', opacity: 0.8 }}>Belum Lunas</span>
              <p className="text-xl font-bold mt-1" style={{ color: totalUnpaid > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface)' }}>
                {totalUnpaid === 0 ? 'Semua Lunas' : `Rp ${totalUnpaid.toLocaleString('id-ID')}`}
              </p>
            </div>
          </div>
        )}

        {/* Segmented control for children */}
        {children.length > 1 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {children.map(k => (
              <button
                key={k.id}
                type="button"
                onClick={() => setSelectedChild(k.id)}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border border-[var(--neu-border)]"
                style={selectedChild === k.id
                  ? { background: 'var(--neu-accent-grad)', color: '#fff', boxShadow: 'var(--neu-shadow-accent)' }
                  : { background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat-sm)', color: 'var(--md-sys-color-on-surface-variant)' }
                }
              >
                🥋 {k.full_name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Billing list */}
          <div className="lg:col-span-2 rounded-3xl border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)', padding: '24px' }}>
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Tagihan Iuran Aktif</h3>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }} />)}</div>
            ) : filteredFees.length === 0 ? (
              <p className="text-sm py-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada invoice tagihan diterbitkan untuk anak Anda.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--neu-border)' }}>
                {filteredFees.map((fee) => (
                  <div key={fee.id} className="py-4 flex items-center justify-between gap-4 transition-all duration-200 rounded-2xl px-2 -mx-2"
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--neu-surface-high)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
                    <div>
                      <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold mb-1.5 border border-[var(--neu-border)]"
                        style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {getStudentName(fee.student_id)}
                      </span>
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        Iuran Sesi {months[fee.period_month - 1]} {fee.period_year}
                      </h4>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Nominal: Rp {Number(fee.amount).toLocaleString('id-ID')}
                      </p>
                      {fee.paid_date && (
                        <p className="text-[10px] mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7 }}>
                          Dibayar: {fee.paid_date} ({fee.payment_method})
                        </p>
                      )}
                    </div>
                    {fee.status === 'lunas' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0"
                        style={{ background: 'var(--neu-accent-grad)', color: '#fff', boxShadow: '0 2px 8px rgba(255,82,82,0.3)' }}>
                        Lunas
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 border border-[var(--neu-border)]"
                        style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Belum Lunas
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment instructions */}
          <div className="rounded-3xl h-fit space-y-4 border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)', padding: '24px' }}>
            <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Instruksi Pelunasan</h3>

            <div className="space-y-4">
              {[
                {
                  title: 'Transfer Bank',
                  body: 'Transfer ke Rekening Resmi Dojo KKI DPL:',
                  detail: 'Bank Mandiri: 123-00-987654-32\na/n Dojo KKI DPL Indonesia',
                },
                {
                  title: 'Bayar Tunai',
                  body: 'Bayar langsung ke Sensai atau Sempai di aula latihan pada jadwal kelas.',
                },
                {
                  title: 'Konfirmasi Pembayaran',
                  body: 'Setelah transfer, kirim bukti pembayaran ke admin dojo untuk ditandai lunas.',
                },
              ].map(({ title, body, detail }, idx) => (
                <div key={idx} className={idx > 0 ? 'pt-4' : ''} style={{ borderTop: idx > 0 ? '1px solid var(--neu-border)' : 'none' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: 'var(--neu-accent-grad)', color: '#fff', boxShadow: '0 2px 6px rgba(211,22,22,0.3)' }}>
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</span>
                  </div>
                  <p className="text-xs leading-relaxed ml-7" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{body}</p>
                  {detail && <p className="text-xs font-mono font-semibold ml-7 mt-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>{detail}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
