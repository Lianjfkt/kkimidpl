'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import PhysicalRadarChart from '@/components/PhysicalRadarChart';
import PhysicalProgressChart, { PhysicalTestRecordItem } from '@/components/PhysicalProgressChart';
import {
  calculatePhysicalAssessment,
  getAgeCategory,
  PhysicalAssessmentResult,
  PhysicalMetricsInput,
} from '@/lib/physicalScoring';
import { supabase } from '@/lib/supabaseClient';
import { Student } from '@/lib/mockData';
import { getBeltStyle, getBeltHex, OFFICIAL_BELTS } from '@/lib/constants/belts';
import Link from 'next/link';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flame,
  LineChart,
  Medal,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trophy,
  User,
  Users,
  Zap,
  Printer,
  X,
  AlertTriangle,
  ArrowRight,
  Clock,
  Activity,
  HeartPulse,
  TrendingUp,
  FileText
} from 'lucide-react';

interface RawPhysicalTest {
  id: string;
  student_id: string;
  tester_id?: string;
  test_date: string;
  push_up_30s: number;
  sit_up_30s: number;
  punches_30s: number;
  kicks_30s: number;
  skipping_sec: number;
  split_front_cm: number;
  split_side_cm: number;
  total_score: number;
  grade: string;
  notes?: string;
  created_at?: string;
}

interface CoachProfile {
  id: string;
  full_name: string;
  role: string;
}

type TabType = 'readiness' | 'leaderboard' | 'audit_log';
type LeaderboardCategory = 'general' | 'speed' | 'skipping' | 'split' | 'core';
type ReadinessFilter = 'all' | 'ready' | 'needs_attention';

export default function OwnerPhysicalTestsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('readiness');
  const [loading, setLoading] = useState(true);

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [allTests, setAllTests] = useState<RawPhysicalTest[]>([]);
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [attendanceRates, setAttendanceRates] = useState<Record<string, number>>({});

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [beltFilter, setBeltFilter] = useState('all');
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('all');
  const [lbCategory, setLbCategory] = useState<LeaderboardCategory>('general');

  // Inspection modal state
  const [inspectStudent, setInspectStudent] = useState<Student | null>(null);
  const [inspectHistory, setInspectHistory] = useState<PhysicalTestRecordItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ─── Fetch All Data ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, testsRes, profilesRes, attendanceRes] = await Promise.all([
        supabase.from('students').select('*').order('full_name', { ascending: true }),
        supabase.from('student_physical_tests').select('*').order('test_date', { ascending: false }),
        supabase.from('profiles').select('id, full_name, role'),
        supabase.from('attendance_students').select('student_id, status'),
      ]);

      if (studentsRes.data) {
        setStudents((studentsRes.data as Student[]).filter(s => !s.status || s.status === 'active'));
      }

      if (testsRes.data) {
        setAllTests(testsRes.data as RawPhysicalTest[]);
      }

      if (profilesRes.data) {
        setCoaches(profilesRes.data as CoachProfile[]);
      }

      // Compute attendance rates per student
      if (attendanceRes.data) {
        const counts: Record<string, { total: number; hadir: number }> = {};
        for (const row of attendanceRes.data) {
          if (!counts[row.student_id]) counts[row.student_id] = { total: 0, hadir: 0 };
          counts[row.student_id].total++;
          if (row.status === 'hadir') counts[row.student_id].hadir++;
        }

        const rates: Record<string, number> = {};
        for (const [stId, c] of Object.entries(counts)) {
          rates[stId] = c.total > 0 ? Math.round((c.hadir / c.total) * 100) : 85;
        }
        setAttendanceRates(rates);
      }
    } catch (err) {
      console.error('Error loading physical tests data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Compute Student Assessments ─────────────────────────────────────────────
  // Map each student to their latest physical test record + computed assessment
  const studentEvaluations = useMemo(() => {
    const latestTestMap = new Map<string, RawPhysicalTest>();
    for (const t of allTests) {
      if (!latestTestMap.has(t.student_id)) {
        latestTestMap.set(t.student_id, t);
      }
    }

    return students.map(student => {
      const latestTest = latestTestMap.get(student.id);
      const attRate = attendanceRates[student.id] ?? 85;

      let assessment: PhysicalAssessmentResult | null = null;
      if (latestTest) {
        const metrics: PhysicalMetricsInput = {
          push_up_30s: latestTest.push_up_30s,
          sit_up_30s: latestTest.sit_up_30s,
          punches_30s: latestTest.punches_30s,
          kicks_30s: latestTest.kicks_30s,
          skipping_sec: latestTest.skipping_sec,
          split_front_cm: latestTest.split_front_cm,
          split_side_cm: latestTest.split_side_cm,
        };
        assessment = calculatePhysicalAssessment(metrics, attRate, student.dob, student.current_belt);
      }

      return {
        student,
        latestTest,
        attendanceRate: attRate,
        assessment,
      };
    });
  }, [students, allTests, attendanceRates]);

  // ─── Executive KPIs ──────────────────────────────────────────────────────────
  const testedEvaluations = useMemo(() => {
    return studentEvaluations.filter(e => e.latestTest !== undefined && e.assessment !== null);
  }, [studentEvaluations]);

  const kpiStats = useMemo(() => {
    if (testedEvaluations.length === 0) {
      return {
        avgScore: 0,
        grade: '—',
        readyCount: 0,
        needsAttentionCount: 0,
        testedIn30Days: 0,
        gradeCounts: { S: 0, A: 0, B: 0, C: 0, D: 0 },
      };
    }

    const totalScoreSum = testedEvaluations.reduce((sum, e) => sum + (e.assessment?.totalScore || 0), 0);
    const avgScore = Math.round((totalScoreSum / testedEvaluations.length) * 10) / 10;

    let grade = 'C';
    if (avgScore >= 90) grade = 'S';
    else if (avgScore >= 80) grade = 'A';
    else if (avgScore >= 70) grade = 'B';
    else if (avgScore >= 60) grade = 'C';
    else grade = 'D';

    const readyCount = testedEvaluations.filter(e => e.assessment?.examReadiness.isEligible).length;
    const needsAttentionCount = testedEvaluations.filter(e => !e.assessment?.examReadiness.isEligible).length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const testedIn30Days = testedEvaluations.filter(e => {
      if (!e.latestTest?.test_date) return false;
      return new Date(e.latestTest.test_date) >= thirtyDaysAgo;
    }).length;

    const gradeCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    for (const e of testedEvaluations) {
      const g = e.assessment?.grade as 'S' | 'A' | 'B' | 'C' | 'D';
      if (g && gradeCounts[g] !== undefined) {
        gradeCounts[g]++;
      }
    }

    return {
      avgScore,
      grade,
      readyCount,
      needsAttentionCount,
      testedIn30Days,
      gradeCounts,
    };
  }, [testedEvaluations]);

  // ─── Filtered Readiness List ────────────────────────────────────────────────
  const filteredReadinessList = useMemo(() => {
    return testedEvaluations.filter(item => {
      // Search by student name
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.student.full_name.toLowerCase().includes(q)) return false;
      }

      // Belt filter
      if (beltFilter !== 'all') {
        if (item.student.current_belt !== beltFilter) return false;
      }

      // Readiness filter
      if (readinessFilter === 'ready') {
        return item.assessment?.examReadiness.isEligible === true;
      } else if (readinessFilter === 'needs_attention') {
        return item.assessment?.examReadiness.isEligible === false;
      }

      return true;
    });
  }, [testedEvaluations, searchQuery, beltFilter, readinessFilter]);

  // ─── Leaderboard Lists ──────────────────────────────────────────────────────
  const leaderboardList = useMemo(() => {
    const list = [...testedEvaluations];

    switch (lbCategory) {
      case 'general':
        return list.sort((a, b) => (b.assessment?.totalScore || 0) - (a.assessment?.totalScore || 0));
      case 'speed':
        return list.sort((a, b) => {
          const scoreA = (a.latestTest?.punches_30s || 0) + (a.latestTest?.kicks_30s || 0);
          const scoreB = (b.latestTest?.punches_30s || 0) + (b.latestTest?.kicks_30s || 0);
          return scoreB - scoreA;
        });
      case 'skipping':
        return list.sort((a, b) => (b.latestTest?.skipping_sec || 0) - (a.latestTest?.skipping_sec || 0));
      case 'split':
        return list.sort((a, b) => {
          const scoreA = (a.latestTest?.split_front_cm || 0) + (a.latestTest?.split_side_cm || 0);
          const scoreB = (b.latestTest?.split_front_cm || 0) + (b.latestTest?.split_side_cm || 0);
          return scoreA - scoreB; // Lower split cm is better
        });
      case 'core':
        return list.sort((a, b) => {
          const scoreA = (a.latestTest?.push_up_30s || 0) + (a.latestTest?.sit_up_30s || 0);
          const scoreB = (b.latestTest?.push_up_30s || 0) + (b.latestTest?.sit_up_30s || 0);
          return scoreB - scoreA;
        });
      default:
        return list;
    }
  }, [testedEvaluations, lbCategory]);

  // ─── Modal Inspection: Load Student History ─────────────────────────────────
  const openStudentInspection = async (student: Student) => {
    setInspectStudent(student);
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('student_physical_tests')
        .select('*')
        .eq('student_id', student.id)
        .order('test_date', { ascending: true });

      if (data) {
        const formatted: PhysicalTestRecordItem[] = data.map((h: any) => ({
          id: h.id,
          test_date: h.test_date,
          total_score: Number(h.total_score) || 0,
          grade: h.grade || 'C',
          push_up_30s: h.push_up_30s,
          sit_up_30s: h.sit_up_30s,
          punches_30s: h.punches_30s,
          kicks_30s: h.kicks_30s,
          skipping_sec: h.skipping_sec,
          split_front_cm: h.split_front_cm,
          split_side_cm: h.split_side_cm,
        }));
        setInspectHistory(formatted);
      }
    } catch (err) {
      console.error('Error fetching student inspection history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectedEvaluation = useMemo(() => {
    if (!inspectStudent) return null;
    return testedEvaluations.find(e => e.student.id === inspectStudent.id);
  }, [inspectStudent, testedEvaluations]);

  // Coach name lookup helper
  const getCoachName = (testerId?: string) => {
    if (!testerId) return 'Pelatih Dojo';
    const found = coaches.find(c => c.id === testerId);
    return found ? found.full_name : 'Pelatih Dojo';
  };

  return (
    <Navigation>
      <div className="space-y-6 animate-m3-page-enter">
        
        {/* ─── 1. Executive Top Header Bar ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                style={{
                  background: 'var(--neu-accent-grad)',
                  boxShadow: 'var(--neu-shadow-accent)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Zap className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)]">
                  Analisis Kebugaran Atlet
                </h1>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Executive Physical Fitness Intelligence &amp; Belt Exam Monitoring
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadData()}
              className="apple-btn-secondary px-3.5 py-2 text-xs font-semibold rounded-2xl flex items-center gap-1.5 cursor-pointer"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => window.print()}
              className="apple-btn-secondary px-3.5 py-2 text-xs font-semibold rounded-2xl flex items-center gap-1.5 cursor-pointer"
              title="Cetak Rekap Kebugaran"
            >
              <Printer className="w-3.5 h-3.5 text-gray-300" />
              <span>Cetak Rekap</span>
            </button>

            <Link
              href="/owner/exams"
              className="apple-btn px-4 py-2 text-xs font-bold rounded-2xl flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ Buat Ujian Sabuk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ─── 2. KPI Executive Summary Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Rata-Rata Skor Fisik Dojo */}
          <div 
            className="p-5 rounded-3xl border border-[var(--neu-border)] flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--neu-surface)',
              boxShadow: 'var(--neu-shadow-flat)'
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Indeks Kebugaran Dojo
              </span>
              <div 
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-[var(--md-sys-color-primary)]"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--md-sys-color-on-surface)]">
                  {loading ? '—' : kpiStats.avgScore}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-[var(--md-sys-color-primary)] border border-red-500/20">
                  Grade {kpiStats.grade}
                </span>
              </div>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                Berdasarkan 7 parameter fisik standar Kushin Ryu
              </p>
            </div>
          </div>

          {/* Card 2: Kesiapan Ujian Kenaikan Sabuk */}
          <div 
            className="p-5 rounded-3xl border border-[var(--neu-border)] flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--neu-surface)',
              boxShadow: 'var(--neu-shadow-flat)'
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Kesiapan Ujian Sabuk
              </span>
              <div 
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-emerald-400"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400">
                  {loading ? '—' : kpiStats.readyCount}
                </span>
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                  / {testedEvaluations.length} Siswa Teruji
                </span>
              </div>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                Lolos ambang skor fisik &amp; kehadiran ≥75%
              </p>
            </div>
          </div>

          {/* Card 3: Evaluasi Khusus (Needs Attention) */}
          <div 
            className="p-5 rounded-3xl border border-[var(--neu-border)] flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--neu-surface)',
              boxShadow: 'var(--neu-shadow-flat)'
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Perlu Pembinaan
              </span>
              <div 
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-amber-400"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400">
                  {loading ? '—' : kpiStats.needsAttentionCount}
                </span>
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                  Siswa
                </span>
              </div>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                Fisik di bawah target sabuk atau kehadiran kurang
              </p>
            </div>
          </div>

          {/* Card 4: Distribusi Grade Kebugaran */}
          <div 
            className="p-5 rounded-3xl border border-[var(--neu-border)] flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--neu-surface)',
              boxShadow: 'var(--neu-shadow-flat)'
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Distribusi Grade
              </span>
              <div 
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-blue-400"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-400">S: {kpiStats.gradeCounts.S}</span>
                <span className="text-blue-400">A: {kpiStats.gradeCounts.A}</span>
                <span className="text-amber-400">B: {kpiStats.gradeCounts.B}</span>
                <span className="text-rose-400">C/D: {kpiStats.gradeCounts.C + kpiStats.gradeCounts.D}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden flex mt-2">
                <div style={{ width: `${(kpiStats.gradeCounts.S / (testedEvaluations.length || 1)) * 100}%` }} className="bg-emerald-400" />
                <div style={{ width: `${(kpiStats.gradeCounts.A / (testedEvaluations.length || 1)) * 100}%` }} className="bg-blue-400" />
                <div style={{ width: `${(kpiStats.gradeCounts.B / (testedEvaluations.length || 1)) * 100}%` }} className="bg-amber-400" />
                <div style={{ width: `${((kpiStats.gradeCounts.C + kpiStats.gradeCounts.D) / (testedEvaluations.length || 1)) * 100}%` }} className="bg-rose-500" />
              </div>
            </div>
          </div>

        </div>

        {/* ─── 3. Segmented Navigation Tabs ──────────────────────────────────────── */}
        <div 
          className="flex p-1.5 rounded-2xl border border-[var(--neu-border)] max-w-xl"
          style={{
            backgroundColor: 'var(--neu-surface-low)',
            boxShadow: 'var(--neu-shadow-pressed)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('readiness')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'readiness'
                ? 'text-white'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-white'
            }`}
            style={
              activeTab === 'readiness'
                ? {
                    background: 'var(--neu-accent-grad)',
                    boxShadow: 'var(--neu-shadow-accent)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }
                : { background: 'transparent' }
            }
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Kesiapan Ujian Sabuk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'text-white'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-white'
            }`}
            style={
              activeTab === 'leaderboard'
                ? {
                    background: 'var(--neu-accent-grad)',
                    boxShadow: 'var(--neu-shadow-accent)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }
                : { background: 'transparent' }
            }
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Papan Rekor &amp; Atlet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit_log')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'audit_log'
                ? 'text-white'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-white'
            }`}
            style={
              activeTab === 'audit_log'
                ? {
                    background: 'var(--neu-accent-grad)',
                    boxShadow: 'var(--neu-shadow-accent)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }
                : { background: 'transparent' }
            }
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Log Audit Pelatih</span>
          </button>
        </div>

        {/* ─── 4. TAB CONTENT 1: Kesiapan Ujian & Pembinaan ─────────────────────── */}
        {activeTab === 'readiness' && (
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <div 
              className="p-4 rounded-3xl border border-[var(--neu-border)] flex flex-col md:flex-row md:items-center justify-between gap-3"
              style={{
                backgroundColor: 'var(--neu-surface)',
                boxShadow: 'var(--neu-shadow-flat-sm)'
              }}
            >
              {/* Search box */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                <input
                  type="text"
                  placeholder="Cari nama atlet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-xs text-[var(--md-sys-color-on-surface)] rounded-2xl outline-none focus:border-[var(--md-sys-color-primary)]"
                />
              </div>

              {/* Belt filter & Readiness toggle pills */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={beltFilter}
                  onChange={(e) => setBeltFilter(e.target.value)}
                  className="px-3 py-2 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] rounded-2xl outline-none cursor-pointer"
                >
                  <option value="all">Semua Sabuk</option>
                  {OFFICIAL_BELTS.map(b => (
                    <option key={b} value={b}>Sabuk {b}</option>
                  ))}
                </select>

                <div 
                  className="flex p-1 rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-surface-low)]"
                >
                  <button
                    type="button"
                    onClick={() => setReadinessFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      readinessFilter === 'all'
                        ? 'bg-[var(--neu-surface-high)] text-white shadow-sm'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-white'
                    }`}
                  >
                    Semua ({testedEvaluations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadinessFilter('ready')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      readinessFilter === 'ready'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-emerald-400'
                    }`}
                  >
                    Siap Ujian ({kpiStats.readyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadinessFilter('needs_attention')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      readinessFilter === 'needs_attention'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-amber-400'
                    }`}
                  >
                    Perlu Pembinaan ({kpiStats.needsAttentionCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Evaluation Table */}
            <div 
              className="rounded-3xl border border-[var(--neu-border)] overflow-hidden"
              style={{
                backgroundColor: 'var(--neu-surface)',
                boxShadow: 'var(--neu-shadow-flat)'
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-low)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 font-bold">Nama Atlet</th>
                      <th className="py-3.5 px-4 font-bold">Tingkat Sabuk</th>
                      <th className="py-3.5 px-4 font-bold">Skor Fisik &amp; Grade</th>
                      <th className="py-3.5 px-4 font-bold">Kehadiran</th>
                      <th className="py-3.5 px-4 font-bold">Status Kelayakan Ujian</th>
                      <th className="py-3.5 px-4 font-bold text-right">Rapor &amp; Rekomendasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--neu-border)]">
                    {filteredReadinessList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
                          Belum ada data evaluasi fisik yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredReadinessList.map(({ student, latestTest, attendanceRate, assessment }) => {
                        const isReady = assessment?.examReadiness.isEligible;
                        const beltStyle = getBeltStyle(student.current_belt);

                        return (
                          <tr 
                            key={student.id}
                            className="hover:bg-[var(--neu-surface-high)]/50 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div 
                                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                                  style={{ background: 'var(--neu-accent-grad)' }}
                                >
                                  {student.full_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-[var(--md-sys-color-on-surface)]">
                                    {student.full_name}
                                  </p>
                                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                    Tes Terakhir: {latestTest?.test_date || '—'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                style={{
                                  backgroundColor: beltStyle.bg,
                                  borderColor: beltStyle.border,
                                  color: beltStyle.text,
                                }}
                              >
                                <span 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: getBeltHex(student.current_belt) }} 
                                />
                                Sabuk {student.current_belt}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-extrabold text-[var(--md-sys-color-on-surface)]">
                                  {assessment?.totalScore}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  assessment?.grade === 'S' || assessment?.grade === 'A'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                                    : assessment?.grade === 'B'
                                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                                    : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                                }`}>
                                  Grade {assessment?.grade}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                                  {attendanceRate}%
                                </span>
                                <span className={`w-2 h-2 rounded-full ${
                                  attendanceRate >= 75 ? 'bg-emerald-400' : 'bg-rose-500'
                                }`} />
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {isReady ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Siap Ujian Sabuk
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  <AlertTriangle className="w-3 h-3" />
                                  {assessment?.examReadiness.statusText || 'Perlu Peningkatan'}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => openStudentInspection(student)}
                                className="apple-btn-secondary px-3 py-1.5 text-[11px] font-bold rounded-xl cursor-pointer inline-flex items-center gap-1"
                              >
                                <LineChart className="w-3 h-3" />
                                <span>Lihat Rapor Radar</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ─── 5. TAB CONTENT 2: Papan Rekor & Scouting Atlet ──────────────────── */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            
            {/* Category Filter Pills */}
            <div 
              className="p-3 rounded-2xl border border-[var(--neu-border)] flex flex-wrap gap-2"
              style={{ backgroundColor: 'var(--neu-surface)' }}
            >
              {[
                { id: 'general', label: '🏆 Overall Performer', icon: Trophy },
                { id: 'speed', label: '🥊 Striking Speed (Tsuki & Keri)', icon: Zap },
                { id: 'skipping', label: '🏃 Kardio Skipping (Detik)', icon: Flame },
                { id: 'split', label: '🤸 Kelenturan Split (cm)', icon: Activity },
                { id: 'core', label: '💪 Kekuatan Core (Push & Sit Up)', icon: Shield },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setLbCategory(cat.id as LeaderboardCategory)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    lbCategory === cat.id
                      ? 'bg-[var(--md-sys-color-primary)] text-white shadow-sm'
                      : 'bg-[var(--neu-surface-low)] text-[var(--md-sys-color-on-surface-variant)] hover:text-white'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Podium Cards for Top 3 */}
            {leaderboardList.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 pb-2">
                
                {/* Juara 2 (Perak) */}
                <div 
                  className="p-5 rounded-3xl border border-[var(--neu-border)] flex flex-col items-center text-center relative"
                  style={{
                    backgroundColor: 'var(--neu-surface)',
                    boxShadow: 'var(--neu-shadow-flat)'
                  }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gray-400/20 text-gray-300 font-extrabold flex items-center justify-center text-sm border border-gray-400/30 mb-2">
                    #2
                  </div>
                  <h4 className="font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate max-w-full">
                    {leaderboardList[1].student.full_name}
                  </h4>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Sabuk {leaderboardList[1].student.current_belt}
                  </p>
                  <div className="mt-3 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-extrabold">
                    {lbCategory === 'general' ? `Skor ${leaderboardList[1].assessment?.totalScore}` :
                     lbCategory === 'speed' ? `${(leaderboardList[1].latestTest?.punches_30s || 0) + (leaderboardList[1].latestTest?.kicks_30s || 0)} Pukulan/Tendangan` :
                     lbCategory === 'skipping' ? `${leaderboardList[1].latestTest?.skipping_sec} Detik` :
                     lbCategory === 'split' ? `${(leaderboardList[1].latestTest?.split_front_cm || 0) + (leaderboardList[1].latestTest?.split_side_cm || 0)} cm (Total Split)` :
                     `${(leaderboardList[1].latestTest?.push_up_30s || 0) + (leaderboardList[1].latestTest?.sit_up_30s || 0)} Repetisi`}
                  </div>
                  <button
                    type="button"
                    onClick={() => openStudentInspection(leaderboardList[1].student)}
                    className="mt-3 text-[10px] text-[var(--md-sys-color-primary)] font-bold hover:underline cursor-pointer"
                  >
                    Buka Rapor Radar →
                  </button>
                </div>

                {/* Juara 1 (Emas) */}
                <div 
                  className="p-6 rounded-3xl border border-amber-500/30 flex flex-col items-center text-center relative -translate-y-1"
                  style={{
                    backgroundColor: 'var(--neu-surface-high)',
                    boxShadow: 'var(--neu-shadow-accent)'
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 font-extrabold flex items-center justify-center text-base border border-amber-400/40 mb-2 shadow-sm">
                    👑 #1
                  </div>
                  <h4 className="font-extrabold text-base text-[var(--md-sys-color-on-surface)] truncate max-w-full">
                    {leaderboardList[0].student.full_name}
                  </h4>
                  <p className="text-xs text-amber-300 font-semibold mt-0.5">
                    Sabuk {leaderboardList[0].student.current_belt} · Top Dojo Athlete
                  </p>
                  <div className="mt-3 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-sm font-extrabold text-amber-300">
                    {lbCategory === 'general' ? `Skor ${leaderboardList[0].assessment?.totalScore}` :
                     lbCategory === 'speed' ? `${(leaderboardList[0].latestTest?.punches_30s || 0) + (leaderboardList[0].latestTest?.kicks_30s || 0)} Pukulan/Tendangan` :
                     lbCategory === 'skipping' ? `${leaderboardList[0].latestTest?.skipping_sec} Detik` :
                     lbCategory === 'split' ? `${(leaderboardList[0].latestTest?.split_front_cm || 0) + (leaderboardList[0].latestTest?.split_side_cm || 0)} cm (Total Split)` :
                     `${(leaderboardList[0].latestTest?.push_up_30s || 0) + (leaderboardList[0].latestTest?.sit_up_30s || 0)} Repetisi`}
                  </div>
                  <button
                    type="button"
                    onClick={() => openStudentInspection(leaderboardList[0].student)}
                    className="mt-3 text-[10px] text-amber-300 font-bold hover:underline cursor-pointer"
                  >
                    Buka Rapor Radar →
                  </button>
                </div>

                {/* Juara 3 (Perunggu) */}
                <div 
                  className="p-5 rounded-3xl border border-[var(--neu-border)] flex flex-col items-center text-center relative"
                  style={{
                    backgroundColor: 'var(--neu-surface)',
                    boxShadow: 'var(--neu-shadow-flat)'
                  }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-700/20 text-amber-600 font-extrabold flex items-center justify-center text-sm border border-amber-700/30 mb-2">
                    #3
                  </div>
                  <h4 className="font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate max-w-full">
                    {leaderboardList[2].student.full_name}
                  </h4>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Sabuk {leaderboardList[2].student.current_belt}
                  </p>
                  <div className="mt-3 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-extrabold">
                    {lbCategory === 'general' ? `Skor ${leaderboardList[2].assessment?.totalScore}` :
                     lbCategory === 'speed' ? `${(leaderboardList[2].latestTest?.punches_30s || 0) + (leaderboardList[2].latestTest?.kicks_30s || 0)} Pukulan/Tendangan` :
                     lbCategory === 'skipping' ? `${leaderboardList[2].latestTest?.skipping_sec} Detik` :
                     lbCategory === 'split' ? `${(leaderboardList[2].latestTest?.split_front_cm || 0) + (leaderboardList[2].latestTest?.split_side_cm || 0)} cm (Total Split)` :
                     `${(leaderboardList[2].latestTest?.push_up_30s || 0) + (leaderboardList[2].latestTest?.sit_up_30s || 0)} Repetisi`}
                  </div>
                  <button
                    type="button"
                    onClick={() => openStudentInspection(leaderboardList[2].student)}
                    className="mt-3 text-[10px] text-[var(--md-sys-color-primary)] font-bold hover:underline cursor-pointer"
                  >
                    Buka Rapor Radar →
                  </button>
                </div>

              </div>
            )}

            {/* Complete Leaderboard Table */}
            <div 
              className="rounded-3xl border border-[var(--neu-border)] overflow-hidden"
              style={{
                backgroundColor: 'var(--neu-surface)',
                boxShadow: 'var(--neu-shadow-flat)'
              }}
            >
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-low)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-bold text-center w-14">Rank</th>
                    <th className="py-3.5 px-4 font-bold">Nama Atlet</th>
                    <th className="py-3.5 px-4 font-bold">Tingkat Sabuk</th>
                    <th className="py-3.5 px-4 font-bold">Skor Fisik &amp; Grade</th>
                    <th className="py-3.5 px-4 font-bold">Statistik Kategori</th>
                    <th className="py-3.5 px-4 font-bold text-right">Rapor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--neu-border)]">
                  {leaderboardList.map(({ student, latestTest, assessment }, idx) => (
                    <tr 
                      key={student.id}
                      className="hover:bg-[var(--neu-surface-high)]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-extrabold text-sm text-[var(--md-sys-color-on-surface)]">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[var(--md-sys-color-on-surface)]">{student.full_name}</p>
                        <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                          {student.dob ? `Usia ${new Date().getFullYear() - new Date(student.dob).getFullYear()} Th` : 'Usia —'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[11px] text-[var(--md-sys-color-on-surface)]">
                          Sabuk {student.current_belt}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">{assessment?.totalScore}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5">
                            {assessment?.grade}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {lbCategory === 'general' ? `Skor Total: ${assessment?.totalScore}` :
                         lbCategory === 'speed' ? `Pukulan: ${latestTest?.punches_30s} · Tendangan: ${latestTest?.kicks_30s}` :
                         lbCategory === 'skipping' ? `Skipping: ${latestTest?.skipping_sec}s` :
                         lbCategory === 'split' ? `Depan: ${latestTest?.split_front_cm}cm · Samping: ${latestTest?.split_side_cm}cm` :
                         `Push Up: ${latestTest?.push_up_30s} · Sit Up: ${latestTest?.sit_up_30s}`}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openStudentInspection(student)}
                          className="apple-btn-secondary px-3 py-1 text-[11px] font-bold rounded-xl cursor-pointer"
                        >
                          Rapor
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ─── 6. TAB CONTENT 3: Log Audit Tes Fisik oleh Pelatih ───────────────── */}
        {activeTab === 'audit_log' && (
          <div className="space-y-4">
            
            <div 
              className="p-4 rounded-3xl border border-[var(--neu-border)] flex items-center justify-between"
              style={{ backgroundColor: 'var(--neu-surface)' }}
            >
              <div>
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  Log Audit &amp; Catatan Pengujian
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Daftar riwayat seluruh sesi asesmen fisik siswa yang diinput oleh tim pelatih dojo.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 border border-[var(--neu-border)]">
                Total Sesi: {allTests.length}
              </span>
            </div>

            <div 
              className="rounded-3xl border border-[var(--neu-border)] overflow-hidden"
              style={{
                backgroundColor: 'var(--neu-surface)',
                boxShadow: 'var(--neu-shadow-flat)'
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-low)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 font-bold">Tanggal</th>
                      <th className="py-3.5 px-4 font-bold">Nama Atlet</th>
                      <th className="py-3.5 px-4 font-bold">Pelatih Penguji</th>
                      <th className="py-3.5 px-4 font-bold">Skor &amp; Grade</th>
                      <th className="py-3.5 px-4 font-bold">Rincian Nilai 7 Parameter</th>
                      <th className="py-3.5 px-4 font-bold">Catatan Pelatih</th>
                      <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--neu-border)]">
                    {allTests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
                          Belum ada riwayat tes fisik tersimpan di database.
                        </td>
                      </tr>
                    ) : (
                      allTests.map(test => {
                        const student = students.find(s => s.id === test.student_id);
                        return (
                          <tr key={test.id} className="hover:bg-[var(--neu-surface-high)]/50 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                              {test.test_date}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-[var(--md-sys-color-on-surface)] truncate max-w-[150px]">
                                {student?.full_name || 'Siswa Dojo'}
                              </p>
                              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                Sabuk {student?.current_belt || 'Putih'}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                              {getCoachName(test.tester_id)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-extrabold text-sm">{test.total_score}</span>
                              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5">
                                Grade {test.grade}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                              PU: {test.push_up_30s} | SU: {test.sit_up_30s} | Tsuki: {test.punches_30s} | Keri: {test.kicks_30s} | Skip: {test.skipping_sec}s | Split: {test.split_front_cm}/{test.split_side_cm}cm
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[var(--md-sys-color-on-surface-variant)] max-w-[200px] truncate">
                              {test.notes || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {student && (
                                <button
                                  type="button"
                                  onClick={() => openStudentInspection(student)}
                                  className="apple-btn-secondary px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer"
                                >
                                  Rapor
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ─── 7. MODAL INSPEKSI ATLET (RADAR & PROGRES CHART) ─────────────────────── */}
      {inspectStudent && selectedEvaluation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setInspectStudent(null)}
        >
          <div 
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-[var(--neu-border)] space-y-6"
            style={{
              backgroundColor: 'var(--neu-surface-high)',
              boxShadow: 'var(--neu-shadow-flat-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-base shadow"
                  style={{ background: 'var(--neu-accent-grad)' }}
                >
                  {inspectStudent.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-[var(--md-sys-color-on-surface)]">
                    {inspectStudent.full_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                      style={getBeltStyle(inspectStudent.current_belt)}
                    >
                      Sabuk {inspectStudent.current_belt}
                    </span>
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {inspectStudent.dob ? `Usia: ${new Date().getFullYear() - new Date(inspectStudent.dob).getFullYear()} Tahun` : ''}
                    </span>
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      · Kehadiran: <strong>{selectedEvaluation.attendanceRate}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="apple-btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectStudent(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white bg-[var(--neu-surface)] border border-[var(--neu-border)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Exam Readiness Status Banner */}
            <div 
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                selectedEvaluation.assessment?.examReadiness.isEligible
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {selectedEvaluation.assessment?.examReadiness.isEligible ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-sm">
                  {selectedEvaluation.assessment?.examReadiness.statusText}
                </p>
                <p className="text-xs leading-relaxed opacity-90">
                  {selectedEvaluation.assessment?.examReadiness.reason}
                </p>
              </div>
            </div>

            {/* Visual Charts: Radar & Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              
              {/* Radar Chart 6 Dimensi */}
              <div 
                className="p-5 rounded-3xl border border-[var(--neu-border)] flex flex-col items-center"
                style={{ backgroundColor: 'var(--neu-surface)' }}
              >
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
                  Pemetaan 6 Dimensi Pilar Kebugaran
                </h4>
                <div className="w-full max-w-[340px]">
                  <PhysicalRadarChart 
                    dimensions={selectedEvaluation.assessment?.radarDimensions || []} 
                  />
                </div>
              </div>

              {/* Grafik Tren Progres */}
              <div 
                className="p-5 rounded-3xl border border-[var(--neu-border)] flex flex-col"
                style={{ backgroundColor: 'var(--neu-surface)' }}
              >
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
                  Riwayat &amp; Tren Progres Fisik Siswa
                </h4>
                {loadingHistory ? (
                  <div className="py-20 text-center text-xs text-gray-400">Memuat riwayat tes...</div>
                ) : (
                  <PhysicalProgressChart records={inspectHistory} />
                )}
              </div>

            </div>

            {/* Breakdown 7 Indikator Fisik */}
            {selectedEvaluation.latestTest && (
              <div 
                className="p-4 rounded-2xl border border-[var(--neu-border)] space-y-2.5"
                style={{ backgroundColor: 'var(--neu-surface-low)' }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Rincian Parameter Fisik Terkini ({selectedEvaluation.latestTest.test_date})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-400">Push Up (30s)</p>
                    <p className="font-extrabold text-base text-white mt-0.5">{selectedEvaluation.latestTest.push_up_30s} Reps</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-400">Sit Up (30s)</p>
                    <p className="font-extrabold text-base text-white mt-0.5">{selectedEvaluation.latestTest.sit_up_30s} Reps</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-400">Pukulan (Tsuki 30s)</p>
                    <p className="font-extrabold text-base text-white mt-0.5">{selectedEvaluation.latestTest.punches_30s} Kali</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-400">Tendangan (Keri 30s)</p>
                    <p className="font-extrabold text-base text-white mt-0.5">{selectedEvaluation.latestTest.kicks_30s} Kali</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-400">Skipping (Kardio)</p>
                    <p className="font-extrabold text-base text-white mt-0.5">{selectedEvaluation.latestTest.skipping_sec} Detik</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-400">Split Depan</p>
                    <p className="font-extrabold text-base text-white mt-0.5">{selectedEvaluation.latestTest.split_front_cm} cm</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-400">Split Samping</p>
                    <p className="font-extrabold text-base text-white mt-0.5">{selectedEvaluation.latestTest.split_side_cm} cm</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-400">Skor Total</p>
                    <p className="font-extrabold text-base text-emerald-400 mt-0.5">{selectedEvaluation.assessment?.totalScore} / 100</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {selectedEvaluation.assessment?.recommendations && selectedEvaluation.assessment.recommendations.length > 0 && (
              <div 
                className="p-4 rounded-2xl border border-[var(--neu-border)] space-y-2"
                style={{ backgroundColor: 'var(--neu-surface)' }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Rekomendasi Porsi Latihan dari Sistem
                </span>
                <ul className="space-y-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  {selectedEvaluation.assessment.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[var(--md-sys-color-primary)] font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectStudent(null)}
                className="apple-btn-secondary px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup Rapor
              </button>
            </div>

          </div>
        </div>
      )}

    </Navigation>
  );
}
