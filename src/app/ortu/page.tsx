'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee, Notification, BeltExam, Tournament, StudentPhysicalTest } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import PhysicalRadarChart from '@/components/PhysicalRadarChart';
import { calculatePhysicalAssessment, PhysicalAssessmentResult } from '@/lib/physicalScoring';
import { getBeltStyle } from '@/lib/constants/belts';

export default function OrtuDashboard() {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<BeltExam[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [physicalTests, setPhysicalTests] = useState<StudentPhysicalTest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: kidsData } = await supabase.from('students').eq('parent_id', userData.user.id).select('*');
      const kids = (kidsData && kidsData.length > 0) ? (kidsData as Student[]) : [];
      setChildren(kids);
      if (kids.length > 0 && !selectedChildId) {
        setSelectedChildId(kids[0].id);
      }
      const kidIds = kids.map((k: Student) => k.id);
      if (kidIds.length > 0) {
        const [feesRes, physicalRes, attRes] = await Promise.all([
          supabase.from('fees').in('student_id', kidIds).select('*'),
          supabase.from('student_physical_tests').in('student_id', kidIds).order('test_date', { ascending: false }).select('*'),
          supabase.from('attendance_students').in('student_id', kidIds).select('*'),
        ]);

        if (feesRes.data) setFees(feesRes.data as Fee[]);
        if (physicalRes.data) setPhysicalTests(physicalRes.data as StudentPhysicalTest[]);
        if (attRes.data) setAttendanceRecords(attRes.data);
      }
      const today = new Date().toISOString().split('T')[0];
      const [examsRes, tournsRes, notifRes] = await Promise.all([
        supabase.from('belt_exams').in('status', ['terjadwal', 'mendatang']).select('*'),
        supabase.from('tournaments').select('*'),
        supabase.from('notifications').eq('user_id', userData.user.id).order('created_at', { ascending: false }).select('*'),
      ]);
      if (examsRes.data) setUpcomingExams((examsRes.data as BeltExam[]).filter((e) => e.exam_date >= today));
      if (tournsRes.data) setUpcomingTournaments((tournsRes.data as Tournament[]).filter((t) => (t.tournament_date || t.start_date || '') >= today));
      if (notifRes.data) setNotifications(notifRes.data);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await supabase.from('notifications').eq('id', id).update({ is_read: true });
    loadData();
  };

  useEffect(() => { loadData(); }, []);

  const activeChild = useMemo(() => {
    return children.find(c => c.id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId]);

  const activeChildPhysicalData = useMemo(() => {
    if (!activeChild) return null;
    const childTests = physicalTests.filter(t => t.student_id === activeChild.id);
    const latestTest = childTests[0] || null;

    const childAtt = attendanceRecords.filter(a => a.student_id === activeChild.id);
    const totalAtt = childAtt.length;
    const hadirAtt = childAtt.filter(a => a.status === 'hadir').length;
    const attendanceRate = totalAtt > 0 ? Math.round((hadirAtt / totalAtt) * 100) : 0;

    let assessment: PhysicalAssessmentResult | null = null;
    if (latestTest) {
      assessment = calculatePhysicalAssessment(
        {
          push_up_30s: latestTest.push_up_30s,
          sit_up_30s: latestTest.sit_up_30s,
          punches_30s: latestTest.punches_30s,
          kicks_30s: latestTest.kicks_30s,
          skipping_sec: latestTest.skipping_sec,
          split_front_cm: latestTest.split_front_cm,
          split_side_cm: latestTest.split_side_cm,
        },
        attendanceRate,
        activeChild.dob,
        activeChild.current_belt
      );
    }

    return {
      tests: childTests,
      latestTest,
      attendanceRate,
      hadirAtt,
      totalAtt,
      assessment,
    };
  }, [activeChild, physicalTests, attendanceRecords]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Halo, {profile ? profile.full_name.split(' ')[0] : 'Orang Tua'} 👋
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Status perkembangan latihan, kebugaran fisik, dan rincian iuran ananda di Dojo.
          </p>
        </div>

        {/* Children profiles */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Profil Atlet Karate</h3>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => <div key={i} className="h-44 rounded-3xl animate-pulse" style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }} />)}
            </div>
          ) : children.length === 0 ? (
            <div className="rounded-3xl p-8 text-center border border-[var(--neu-border)]"
              style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}>
              <p className="text-sm mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada profil anak terdaftar.</p>
              <a href="/login" className="apple-btn px-5 py-2.5 text-sm">Daftarkan Siswa Baru</a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((kid) => {
                const kidFees = fees.filter((f) => f.student_id === kid.id);
                const unpaidCount = kidFees.filter((f) => f.status !== 'lunas').length;
                const isSelected = activeChild?.id === kid.id;
                const beltStyle = getBeltStyle(kid.current_belt);

                return (
                  <div key={kid.id}
                    onClick={() => setSelectedChildId(kid.id)}
                    className="rounded-3xl p-5 flex flex-col gap-4 border transition-all duration-200 cursor-pointer"
                    style={{
                      background: 'var(--neu-surface)',
                      boxShadow: isSelected ? '0 0 0 2px var(--md-sys-color-primary), var(--neu-shadow-flat)' : 'var(--neu-shadow-flat)',
                      borderColor: isSelected ? 'var(--md-sys-color-primary)' : 'var(--neu-border)'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 border border-[var(--neu-border)]"
                        style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-on-surface)' }}>
                        {kid.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg truncate" style={{ color: 'var(--md-sys-color-on-surface)' }}>{kid.full_name}</h4>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--md-sys-color-primary)' }}>
                              Aktif Dipilih
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          <span>Sabuk:</span>
                          <span className="font-semibold px-2 py-0.5 rounded-md text-[11px]" style={{ background: beltStyle.bg || 'rgba(239,68,68,0.15)', color: beltStyle.hex }}>
                            {beltStyle.emoji} {kid.current_belt}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: '1px solid var(--neu-border)' }}>
                      <div className="rounded-2xl px-3 py-2.5 border border-[var(--neu-border)]"
                        style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                        <span className="block text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal Join</span>
                        <span className="font-medium text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{kid.join_date}</span>
                      </div>
                      <div className="rounded-2xl px-3 py-2.5 border border-[var(--neu-border)]"
                        style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                        <span className="block text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Status Tagihan</span>
                        {unpaidCount === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5"
                            style={{ background: 'var(--neu-accent-grad)', color: '#fff', boxShadow: '0 2px 8px rgba(255,82,82,0.3)' }}>
                            Lunas Semua
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 border border-[var(--neu-border)]"
                            style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--md-sys-color-error)' }}>
                            {unpaidCount} Belum Bayar
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a href="/ortu/attendance"
                        className="apple-btn-secondary flex-1 py-2 text-xs font-medium text-center rounded-2xl transition-all duration-200">
                        Absensi
                      </a>
                      <a href="/ortu/fees"
                        className="apple-btn flex-1 py-2 text-xs font-medium text-center rounded-2xl transition-all duration-200">
                        Rincian Iuran
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Rapor Kebugaran & Fisik Ananda ──────────────────────────────────── */}
        {activeChild && (
          <div className="rounded-3xl p-6 border border-[var(--neu-border)] space-y-6"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--neu-border)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Rapor Kebugaran &amp; Fisik: {activeChild.full_name}
                  </h3>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Evaluasi kemampuan fisik berkala dan kesiapan ujian kenaikan sabuk.
                </p>
              </div>

              {activeChildPhysicalData?.latestTest && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="apple-btn-secondary px-3.5 py-2 text-xs font-semibold rounded-2xl flex items-center gap-2 cursor-pointer transition-all duration-200"
                  >
                    <span>🖨️</span>
                    <span>Cetak Rapor Fisik</span>
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="h-48 rounded-2xl animate-pulse" style={{ background: 'var(--neu-surface-low)' }} />
            ) : !activeChildPhysicalData?.latestTest || !activeChildPhysicalData.assessment ? (
              <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-[var(--neu-border)]"
                style={{ background: 'var(--neu-surface-low)' }}>
                <span className="text-4xl block mb-3">🥋</span>
                <h4 className="font-bold text-base mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Belum Ada Catatan Tes Fisik
                </h4>
                <p className="text-xs max-w-md mx-auto leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Pelatih dojo akan mencatat hasil tes fisik (push up, sit up, pukulan, tendangan, skipping, dan split) saat sesi evaluasi berkala.
                </p>
                <div className="mt-4 p-3 rounded-xl max-w-md mx-auto text-left text-xs space-y-1.5"
                  style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  <p className="font-semibold text-xs" style={{ color: 'var(--md-sys-color-on-surface)' }}>💡 Dukungan Orang Tua di Rumah:</p>
                  <p>• Ajak ananda peregangan kaki ringan 10 menit setiap pagi.</p>
                  <p>• Jaga hidrasi air putih dan tidur cukup minimal 8 jam sebelum jadwal latihan dojo.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Highlights Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Score & Grade */}
                  <div className="p-4 rounded-2xl border border-[var(--neu-border)] text-center flex flex-col justify-center"
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      Total Skor Kebugaran
                    </span>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-3xl font-black" style={{ color: 'var(--md-sys-color-primary)' }}>
                        {activeChildPhysicalData.assessment.totalScore}
                      </span>
                      <span className="text-xs opacity-50">/ 100</span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-black"
                        style={{
                          background:
                            activeChildPhysicalData.assessment.grade === 'S' || activeChildPhysicalData.assessment.grade === 'A'
                              ? 'rgba(52,211,153,0.2)'
                              : activeChildPhysicalData.assessment.grade === 'B'
                              ? 'rgba(96,165,250,0.2)'
                              : 'rgba(251,191,36,0.2)',
                          color:
                            activeChildPhysicalData.assessment.grade === 'S' || activeChildPhysicalData.assessment.grade === 'A'
                              ? '#34d399'
                              : activeChildPhysicalData.assessment.grade === 'B'
                              ? '#60a5fa'
                              : '#fbbf24',
                        }}
                      >
                        Grade {activeChildPhysicalData.assessment.grade}
                      </span>
                    </div>
                    <span className="text-[10px] mt-1 opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      Tes: {new Date(activeChildPhysicalData.latestTest.test_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Exam Readiness Status */}
                  <div className="p-4 rounded-2xl border border-[var(--neu-border)] text-center flex flex-col justify-center sm:col-span-2"
                    style={{
                      background:
                        activeChildPhysicalData.assessment.examReadiness.statusColor === 'emerald'
                          ? 'rgba(52,211,153,0.1)'
                          : activeChildPhysicalData.assessment.examReadiness.statusColor === 'amber'
                          ? 'rgba(251,191,36,0.1)'
                          : 'rgba(248,113,113,0.1)',
                      borderColor:
                        activeChildPhysicalData.assessment.examReadiness.statusColor === 'emerald'
                          ? 'rgba(52,211,153,0.3)'
                          : activeChildPhysicalData.assessment.examReadiness.statusColor === 'amber'
                          ? 'rgba(251,191,36,0.3)'
                          : 'rgba(248,113,113,0.3)',
                    }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color:
                          activeChildPhysicalData.assessment.examReadiness.statusColor === 'emerald'
                            ? '#34d399'
                            : activeChildPhysicalData.assessment.examReadiness.statusColor === 'amber'
                            ? '#fbbf24'
                            : '#f87171',
                      }}>
                      Status Kesiapan Ujian Kenaikan Sabuk
                    </span>
                    <p className="font-bold text-sm mt-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {activeChildPhysicalData.assessment.examReadiness.statusText}
                    </p>
                    <p className="text-xs mt-0.5 opacity-80" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {activeChildPhysicalData.assessment.examReadiness.reason}
                    </p>
                  </div>
                </div>

                {/* Radar Chart & Drill Support Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[var(--neu-border)]"
                    style={{ background: 'var(--neu-surface-low)' }}>
                    <span className="text-xs font-bold mb-2 opacity-75" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      Grafik Karakteristik Kemampuan 6 Dimensi
                    </span>
                    <PhysicalRadarChart
                      dimensions={activeChildPhysicalData.assessment.radarDimensions}
                      showTarget={true}
                      size={290}
                    />
                  </div>

                  <div className="space-y-4">
                    {/* Raw Metrics Summary */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5 opacity-70" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        Rincian Capaian Latihan
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-xl border border-[var(--neu-border)]" style={{ background: 'var(--neu-surface-low)' }}>
                          <span className="block text-[10px] opacity-60">Push Up (30d)</span>
                          <span className="font-bold text-sm" style={{ color: 'var(--md-sys-color-primary)' }}>
                            {activeChildPhysicalData.latestTest.push_up_30s}x
                          </span>
                        </div>
                        <div className="p-2 rounded-xl border border-[var(--neu-border)]" style={{ background: 'var(--neu-surface-low)' }}>
                          <span className="block text-[10px] opacity-60">Sit Up (30d)</span>
                          <span className="font-bold text-sm" style={{ color: 'var(--md-sys-color-primary)' }}>
                            {activeChildPhysicalData.latestTest.sit_up_30s}x
                          </span>
                        </div>
                        <div className="p-2 rounded-xl border border-[var(--neu-border)]" style={{ background: 'var(--neu-surface-low)' }}>
                          <span className="block text-[10px] opacity-60">Pukulan (30d)</span>
                          <span className="font-bold text-sm" style={{ color: 'var(--md-sys-color-primary)' }}>
                            {activeChildPhysicalData.latestTest.punches_30s}x
                          </span>
                        </div>
                        <div className="p-2 rounded-xl border border-[var(--neu-border)]" style={{ background: 'var(--neu-surface-low)' }}>
                          <span className="block text-[10px] opacity-60">Tendangan (30d)</span>
                          <span className="font-bold text-sm" style={{ color: 'var(--md-sys-color-primary)' }}>
                            {activeChildPhysicalData.latestTest.kicks_30s}x
                          </span>
                        </div>
                        <div className="p-2 rounded-xl border border-[var(--neu-border)]" style={{ background: 'var(--neu-surface-low)' }}>
                          <span className="block text-[10px] opacity-60">Skipping</span>
                          <span className="font-bold text-sm" style={{ color: 'var(--md-sys-color-primary)' }}>
                            {activeChildPhysicalData.latestTest.skipping_sec} detik
                          </span>
                        </div>
                        <div className="p-2 rounded-xl border border-[var(--neu-border)]" style={{ background: 'var(--neu-surface-low)' }}>
                          <span className="block text-[10px] opacity-60">Split (Depan / Samping)</span>
                          <span className="font-bold text-sm" style={{ color: 'var(--md-sys-color-primary)' }}>
                            {activeChildPhysicalData.latestTest.split_front_cm} / {activeChildPhysicalData.latestTest.split_side_cm} cm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Home Support Guidance */}
                    <div className="p-4 rounded-2xl border border-[var(--neu-border)] space-y-2.5"
                      style={{ background: 'var(--neu-surface-low)' }}>
                      <div className="flex items-center gap-2">
                        <span>🏡</span>
                        <h4 className="font-bold text-xs" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                          Panduan Pendampingan Orang Tua di Rumah
                        </h4>
                      </div>
                      <div className="space-y-1.5 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {activeChildPhysicalData.assessment.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <p className="leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {activeChildPhysicalData.latestTest.notes && (
                      <div className="p-3 rounded-xl border border-dashed border-[var(--neu-border)] text-xs"
                        style={{ background: 'var(--neu-surface)' }}>
                        <span className="font-semibold block mb-0.5" style={{ color: 'var(--md-sys-color-on-surface)' }}>Catatan Pelatih:</span>
                        <p className="italic opacity-80" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          &ldquo;{activeChildPhysicalData.latestTest.notes}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications + Info grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)', padding: '24px' }}>
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Pemberitahuan Terbaru</h3>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }} />)}</div>
            ) : notifications.length === 0 ? (
              <p className="text-sm py-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada pemberitahuan baru.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--neu-border)' }}>
                {notifications.map((notif) => (
                  <div key={notif.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ background: !notif.is_read ? 'var(--md-sys-color-primary)' : 'transparent', border: notif.is_read ? '2px solid var(--neu-border)' : 'none' }} />
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
                      <button onClick={() => handleMarkAsRead(notif.id)} className="apple-btn-secondary py-1 px-2 text-xs font-medium flex-shrink-0 rounded-xl cursor-pointer transition-all duration-200">
                        Baca
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl h-fit border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)', padding: '24px' }}>
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Info Pembayaran</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Iuran bulanan dapat dibayar tunai ke Sensai/Sempai di aula, atau transfer via QRIS/Rekening Bank Mandiri yang tertera di Rincian Iuran.
            </p>
            <a href="/ortu/fees" className="apple-btn w-full py-2.5 text-sm mt-5 block text-center rounded-2xl transition-all duration-200">
              Lihat Rincian Iuran
            </a>
          </div>
        </div>

        {/* Upcoming events */}
        {(upcomingExams.length > 0 || upcomingTournaments.length > 0) && (
          <div className="rounded-3xl border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)', padding: '24px' }}>
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Jadwal Mendatang</h3>
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center gap-4 p-3 rounded-2xl border border-[var(--neu-border)]"
                  style={{ background: 'rgba(52,211,153,0.12)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(52,211,153,0.2)', color: '#10b981' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: '#10b981' }}>Ujian Kenaikan Sabuk</p>
                    <p className="text-xs mt-0.5" style={{ color: '#10b981', opacity: 0.8 }}>
                      {new Date(exam.exam_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {exam.location}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingTournaments.map((tourn) => (
                <div key={tourn.id} className="flex items-center gap-4 p-3 rounded-2xl border border-[var(--neu-border)]"
                  style={{ background: 'rgba(211,22,22,0.1)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(211,22,22,0.15)', color: 'var(--md-sys-color-primary)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-primary)' }}>{tourn.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-primary)', opacity: 0.8 }}>
                      {tourn.tournament_date || tourn.start_date ? new Date(tourn.tournament_date || tourn.start_date || '').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'} · {tourn.location}
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
