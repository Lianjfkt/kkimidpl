'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee, Notification } from '@/lib/mockData';

export default function OrtuDashboard() {
  const [children, setChildren] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    
    if (userData?.user) {
      // Get kids registered under this parent profile
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

      // Load parent in-app notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .select('*');
      if (notifData) setNotifications(notifData);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await supabase.from('notifications').eq('id', id).update({ is_read: true });
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Halo, Orang Tua/Siswa
          </h2>
          <p className="body-text mt-1">
            Status perkembangan latihan dan rincian iuran anak Anda.
          </p>
        </div>

        {/* Children details card */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            Profil Atlet Karate (Anak)
          </h3>

          {loading ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Memuat profil anak...</p>
          ) : children.length === 0 ? (
            <div className="apple-card text-center py-8">
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Belum ada profil anak terdaftar.
              </p>
              <a href="/register-kid" className="apple-btn text-xs font-semibold">
                Daftarkan Siswa Baru
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {children.map((kid) => {
                const kidFees = fees.filter(f => f.student_id === kid.id);
                const unpaidCount = kidFees.filter(f => f.status !== 'lunas').length;

                return (
                  <div key={kid.id} className="apple-card space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-red-50 text-[var(--color-accent-karate)] border border-red-100 flex items-center justify-center font-bold text-lg">
                        {kid.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-[var(--color-text-primary)]">{kid.full_name}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Sabuk Saat Ini: <span className="font-semibold text-[var(--color-accent-karate)]">{kid.current_belt}</span>
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[var(--color-border-hairline)] pt-4 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Tanggal Join</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{kid.join_date}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Status Tagihan</span>
                        {unpaidCount === 0 ? (
                          <span className="font-semibold text-[var(--color-status-success)]">Lunas Semua</span>
                        ) : (
                          <span className="font-semibold text-[var(--color-status-error)]">{unpaidCount} Belum Bayar</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end space-x-2">
                      <a href="/ortu/fees" className="apple-btn-secondary px-3 py-1.5 text-[11px] font-semibold">
                        💳 Rincian Iuran
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications and messages panel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 apple-card">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Pemberitahuan Terbaru
            </h3>

            {loading ? (
              <p className="text-sm text-[var(--color-text-secondary)]">Memuat pemberitahuan...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] py-4">Tidak ada pemberitahuan baru.</p>
            ) : (
              <div className="divide-y divide-[var(--color-border-hairline)]">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`py-4 flex justify-between items-start gap-4 ${
                      !notif.is_read ? 'bg-red-50/20 px-3 rounded-lg' : ''
                    }`}
                  >
                    <div>
                      <h4 className={`text-sm ${!notif.is_read ? 'font-bold' : 'font-medium'} text-[var(--color-text-primary)]`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">{notif.message}</p>
                      <span className="text-[10px] text-gray-400 mt-2 block">
                        {new Date(notif.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>

                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[10px] font-semibold text-[var(--color-accent-karate)] hover:underline cursor-pointer"
                      >
                        Tandai Dibaca
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick info panel */}
          <div className="apple-card space-y-4 h-fit">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Info Pembayaran
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Pembayaran iuran bulanan dojo KKI DPL dapat diselesaikan secara tunai melalui Sensai/Sempai di aula latihan, atau transfer via QRIS / Rekening Bank Mandiri yang tertera di menu Rincian Iuran.
            </p>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
