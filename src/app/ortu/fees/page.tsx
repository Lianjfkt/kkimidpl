'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee } from '@/lib/mockData';

export default function OrtuFees() {
  const [children, setChildren] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    
    if (userData?.user) {
      // Get kids
      const { data: kidsData } = await supabase
        .from('students')
        .eq('parent_id', userData.user.id)
        .select('*');

      if (kidsData) {
        setChildren(kidsData);
        
        // Load fee records for kids
        const kidIds = kidsData.map((k: Student) => k.id);
        if (kidIds.length > 0) {
          const { data: feesData } = await supabase
            .from('fees')
            .in('student_id', kidIds)
            .select('*');
          if (feesData) setFees(feesData);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStudentName = (id: string) => {
    const kid = children.find(k => k.id === id);
    return kid ? kid.full_name : '';
  };

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Rincian Iuran Bulanan
          </h2>
          <p className="body-text mt-1">
            Status tagihan dan tata cara pelunasan iuran latihan dojo KKI DPL.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Billing status table */}
          <div className="lg:col-span-2 apple-card space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Tagihan Iuran Aktif
            </h3>

            {loading ? (
              <p className="text-sm text-[var(--color-text-secondary)]">Memuat data tagihan...</p>
            ) : fees.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] py-4">Belum ada invoice tagihan diterbitkan untuk anak Anda.</p>
            ) : (
              <div className="divide-y divide-[var(--color-border-hairline)]">
                {fees.map((fee) => (
                  <div key={fee.id} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-[var(--color-accent-karate)] border border-red-100 mb-1">
                        Siswa: {getStudentName(fee.student_id)}
                      </span>
                      <h4 className="font-bold text-sm text-[var(--color-text-primary)]">
                        Iuran Sesi {months[fee.period_month - 1]} {fee.period_year}
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Nominal: Rp {Number(fee.amount).toLocaleString('id-ID')}
                      </p>
                      {fee.paid_date && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          Dibayar pada: {fee.paid_date} ({fee.payment_method})
                        </p>
                      )}
                    </div>

                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        fee.status === 'lunas'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {fee.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment instructions */}
          <div className="apple-card space-y-4 h-fit">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Instruksi Pelunasan
            </h3>
            
            <div className="space-y-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
              <div>
                <span className="block font-bold text-[var(--color-text-primary)] mb-1">Metode 1: Transfer Bank</span>
                <p>Transfer ke Rekening Resmi Dojo KKI DPL:</p>
                <p className="font-mono text-sm font-bold text-[var(--color-text-primary)] mt-1">Bank Mandiri: 123-00-987654-32</p>
                <p>a/n Dojo KKI DPL Indonesia</p>
              </div>

              <div className="border-t border-[var(--color-border-hairline)] pt-3">
                <span className="block font-bold text-[var(--color-text-primary)] mb-1">Metode 2: Tunai</span>
                <p>Bayar langsung secara tunai ke Sensai atau Sempai di aula latihan pada jadwal kelas.</p>
              </div>

              <div className="border-t border-[var(--color-border-hairline)] pt-3">
                <span className="block font-bold text-[var(--color-text-primary)] mb-1">Konfirmasi Pembayaran</span>
                <p>Setelah melakukan transfer, silakan kirim bukti pembayaran ke admin dojo via kontak pengurus di aula latihan untuk ditandai lunas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
