'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee, Notification, BeltExam, Tournament } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';

export default function OrtuDashboard() {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<BeltExam[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: kidsData } = await supabase.from('students').eq('parent_id', userData.user.id).select('*');
      if (kidsData) {
        setChildren(kidsData);
        const kidIds = kidsData.map((k: Student) => k.id);
        if (kidIds.length > 0) {
          const { data: feesData } = await supabase.from('fees').in('student_id', kidIds).select('*');
          if (feesData) setFees(feesData);
        }
      }
      const today = new Date().toISOString().split('T')[0];
      const [examsRes, tournsRes, notifRes] = await Promise.all([
        supabase.from('belt_exams').eq('status', 'terjadwal').select('*'),
        supabase.from('tournaments').select('*'),
        supabase.from('notifications').eq('user_id', userData.user.id).order('created_at', { ascending: false }).select('*'),
      ]);
      if (examsRes.data) setUpcomingExams((examsRes.data as BeltExam[]).filter((e) => e.exam_date >= today));
      if (tournsRes.data) setUpcomingTournaments((tournsRes.data as Tournament[]).filter((t) => t.tournament_date >= today));
      if (notifRes.data) setNotifications(notifRes.data);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await supabase.from('notifications').eq('id', id).update({ is_read: true });
    loadData();
  };

  useEffect(() => { loadData(); }, []);

  const notifTypeColor = (type: string): React.CSSProperties => {
    if (type === 'iuran') return { background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' };
    if (type === 'ujian') return { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' };
    return { background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' };
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Halo, {profile ? profile.full_name.split(' ')[0] : 'Orang Tua'} 👋
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Status perkembangan latihan dan rincian iuran anak Anda.
          </p>
        </div>

        {/* Children profiles */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Profil Atlet Karate</h3>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => <div key={i} className="h-44 rounded-[var(--md-sys-shape-corner-extra-large)] animate-pulse" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}
            </div>
          ) : children.length === 0 ? (
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-8 text-center"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <p className="text-sm mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada profil anak terdaftar.</p>
              <a href="/login" className="m3-btn-tonal px-5 py-2.5 text-sm">Daftarkan Siswa Baru</a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((kid) => {
                const kidFees = fees.filter((f) => f.student_id === kid.id);
                const unpaidCount = kidFees.filter((f) => f.status !== 'lunas').length;
                return (
                  <div key={kid.id} className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col gap-4"
                    style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[var(--md-sys-shape-corner-full)] flex items-center justify-center text-xl font-bold flex-shrink-0"
                        style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                        {kid.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>{kid.full_name}</h4>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Sabuk: <span className="font-semibold" style={{ color: 'var(--md-sys-color-primary)' }}>{kid.current_belt}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                      <div>
                        <span className="block text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal Join</span>
                        <span className="font-medium text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{kid.join_date}</span>
                      </div>
                      <div>
                        <span className="block text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Status Tagihan</span>
                        <span className="font-semibold text-sm"
                          style={{ color: unpaidCount === 0 ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-error)' }}>
                          {unpaidCount === 0 ? 'Lunas Semua' : `${unpaidCount} Belum Bayar`}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a href="/ortu/attendance" className="m3-btn-outlined flex-1 py-2 text-xs font-medium text-center">
                        Absensi
                      </a>
                      <a href="/ortu/fees" className="m3-btn-tonal flex-1 py-2 text-xs font-medium text-center">
                        Rincian Iuran
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications + Info grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-[var(--md-sys-shape-corner-extra-large)]"
            style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '24px' }}>
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Pemberitahuan Terbaru</h3>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-[var(--md-sys-shape-corner-medium)] animate-pulse" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}</div>
            ) : notifications.length === 0 ? (
              <p className="text-sm py-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada pemberitahuan baru.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                {notifications.map((notif) => (
                  <div key={notif.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ background: !notif.is_read ? 'var(--md-sys-color-primary)' : 'transparent', border: notif.is_read ? '2px solid var(--md-sys-color-outline-variant)' : 'none' }} />
                      <div>
                        <h4 className={`text-sm ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}
                          style={{ color: 'var(--md-sys-color-on-surface)' }}>{notif.title}</h4>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{notif.message}</p>
                        <span className="text-[10px] mt-1 block" style={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>
                          {new Date(notif.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                    {!notif.is_read && (
                      <button onClick={() => handleMarkAsRead(notif.id)} className="m3-btn-text py-1 px-2 text-xs font-medium flex-shrink-0">
                        Baca
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[var(--md-sys-shape-corner-extra-large)] h-fit"
            style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '24px' }}>
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Info Pembayaran</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Iuran bulanan dapat dibayar tunai ke Sensai/Sempai di aula, atau transfer via QRIS/Rekening Bank Mandiri yang tertera di Rincian Iuran.
            </p>
            <a href="/ortu/fees" className="m3-btn-filled w-full py-2.5 text-sm mt-5">
              Lihat Rincian Iuran
            </a>
          </div>
        </div>

        {/* Upcoming events */}
        {(upcomingExams.length > 0 || upcomingTournaments.length > 0) && (
          <div className="rounded-[var(--md-sys-shape-corner-extra-large)]"
            style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '24px' }}>
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Jadwal Mendatang</h3>
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center gap-4 p-3 rounded-[var(--md-sys-shape-corner-large)]"
                  style={{ background: 'var(--md-sys-color-tertiary-container)' }}>
                  <div className="w-9 h-9 rounded-[var(--md-sys-shape-corner-medium)] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,0,0,0.1)', color: 'var(--md-sys-color-on-tertiary-container)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>Ujian Kenaikan Sabuk</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-tertiary-container)', opacity: 0.8 }}>
                      {new Date(exam.exam_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {exam.location}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingTournaments.map((tourn) => (
                <div key={tourn.id} className="flex items-center gap-4 p-3 rounded-[var(--md-sys-shape-corner-large)]"
                  style={{ background: 'var(--md-sys-color-primary-container)' }}>
                  <div className="w-9 h-9 rounded-[var(--md-sys-shape-corner-medium)] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,0,0,0.1)', color: 'var(--md-sys-color-on-primary-container)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>{tourn.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.8 }}>
                      {new Date(tourn.tournament_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {tourn.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
