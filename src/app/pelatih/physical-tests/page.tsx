'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import PhysicalRadarChart from '@/components/PhysicalRadarChart';
import PhysicalProgressChart, { PhysicalTestRecordItem } from '@/components/PhysicalProgressChart';
import {
  calculatePhysicalAssessment,
  getAgeCategory,
  PhysicalMetricsInput,
  PhysicalAssessmentResult,
} from '@/lib/physicalScoring';
import { supabase } from '@/lib/supabaseClient';
import { Student } from '@/lib/mockData';
import { getBeltStyle } from '@/lib/constants/belts';

// ─── Web Audio Synthesizer ────────────────────────────────────────────────────
class WebAudioSynthesizer {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playBeep(freq = 880, duration = 0.1) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext policy handled gracefully
    }
  }

  public playBuzzer() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // AudioContext policy handled gracefully
    }
  }

  public playStartChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext policy handled gracefully
    }
  }
}

const audioSynth = new WebAudioSynthesizer();

const DEFAULT_METRICS: PhysicalMetricsInput = {
  push_up_30s: 0,
  sit_up_30s: 0,
  punches_30s: 0,
  kicks_30s: 0,
  skipping_sec: 0,
  split_front_cm: 0,
  split_side_cm: 0,
};

type ViewMode = 'assessment' | 'mat_tools' | 'leaderboard';
type LeaderboardTab = 'general' | 'speed' | 'skipping' | 'split' | 'core';
type MetricCopyTarget = 'push_up_30s' | 'sit_up_30s' | 'punches_30s' | 'kicks_30s';

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

function calculateAge(dob?: string): number {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export default function PelatihPhysicalTestsPage() {
  // Navigation / View state
  const [viewMode, setViewMode] = useState<ViewMode>('assessment');

  // Supabase data states
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentAttendanceRate, setStudentAttendanceRate] = useState<number>(85);
  const [studentHistory, setStudentHistory] = useState<PhysicalTestRecordItem[]>([]);
  const [allTests, setAllTests] = useState<RawPhysicalTest[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Form Inputs
  const [metrics, setMetrics] = useState<PhysicalMetricsInput>(DEFAULT_METRICS);
  const [testDate, setTestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [savingTest, setSavingTest] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audio & Timer states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerPrevSecRef = useRef<number>(30);

  // Tap Counter states
  const [tapCount, setTapCount] = useState(0);
  const [copyTarget, setCopyTarget] = useState<MetricCopyTarget>('push_up_30s');
  const [copiedAnimation, setCopiedAnimation] = useState(false);

  // Skipping Stopwatch states
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const stopwatchStartRef = useRef<number>(0);
  const stopwatchAccumulatedRef = useRef<number>(0);
  const [stopwatchCopiedAnimation, setStopwatchCopiedAnimation] = useState(false);

  // Leaderboard filters
  const [lbCategory, setLbCategory] = useState<LeaderboardTab>('general');
  const [lbAgeFilter, setLbAgeFilter] = useState<'all' | 'anak' | 'remaja' | 'dewasa'>('all');

  // ─── Fetch Students & Authenticated User ──────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setCurrentUserId(userData.user.id);
      }

      const { data: stData } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

      if (stData) {
        const active = (stData as Student[]).filter(
          (s) => !s.status || s.status === 'active'
        );
        setStudents(active);
        if (active.length > 0 && !selectedStudent) {
          setSelectedStudent(active[0]);
        }
      }

      await loadLeaderboardData();
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const loadLeaderboardData = async () => {
    try {
      const { data: testData } = await supabase
        .from('student_physical_tests')
        .select('*')
        .order('test_date', { ascending: false });

      if (testData) {
        setAllTests(testData as RawPhysicalTest[]);
      }
    } catch (err) {
      console.error('Error fetching leaderboard tests:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ─── Load Selected Student History & Attendance ──────────────────────────────
  useEffect(() => {
    if (!selectedStudent) return;

    let isMounted = true;

    async function fetchStudentDetails() {
      try {
        // Attendance rate
        const { data: attData } = await supabase
          .from('attendance_students')
          .select('status')
          .eq('student_id', selectedStudent!.id);

        if (isMounted) {
          if (attData && attData.length > 0) {
            const hadir = attData.filter((a: any) => a.status === 'hadir').length;
            const rate = Math.round((hadir / attData.length) * 100);
            setStudentAttendanceRate(rate);
          } else {
            setStudentAttendanceRate(85); // reasonable default for new students
          }
        }

        // Test history for this student
        const { data: historyData } = await supabase
          .from('student_physical_tests')
          .select('*')
          .eq('student_id', selectedStudent!.id)
          .order('test_date', { ascending: true });

        if (isMounted && historyData) {
          const formattedHistory: PhysicalTestRecordItem[] = historyData.map((h: any) => ({
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
          setStudentHistory(formattedHistory);
        }
      } catch (err) {
        console.error('Error fetching student history:', err);
      }
    }

    fetchStudentDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedStudent]);

  // ─── Real-Time Physical Scoring Calculation ──────────────────────────────────
  const assessment: PhysicalAssessmentResult = useMemo(() => {
    return calculatePhysicalAssessment(
      metrics,
      studentAttendanceRate,
      selectedStudent?.dob,
      selectedStudent?.current_belt
    );
  }, [metrics, studentAttendanceRate, selectedStudent]);

  // ─── 30s Audio Timer Countdown Logic ─────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  // Handle timer reaching zero — side effects extracted from updater for purity
  useEffect(() => {
    if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      audioSynth.playBuzzer();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } else if (timerSeconds > 0 && timerSeconds <= 3 && timerRunning && timerSeconds !== timerPrevSecRef.current) {
      audioSynth.playBeep(880, 0.12);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(80);
      }
      timerPrevSecRef.current = timerSeconds;
    }
  }, [timerSeconds, timerRunning]);

  const handleStartTimer = () => {
    if (timerSeconds === 0) {
      setTimerSeconds(30);
      timerPrevSecRef.current = 30;
    }
    audioSynth.playStartChime();
    setTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setTimerRunning(false);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(30);
    timerPrevSecRef.current = 30;
  };

  const toggleAudioMute = () => {
    const nextMuted = !isAudioMuted;
    audioSynth.isMuted = nextMuted;
    setIsAudioMuted(nextMuted);
  };

  // ─── Tap Counter Logic ────────────────────────────────────────────────────────
  const handleTapCount = () => {
    setTapCount((prev) => prev + 1);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
  };

  const handleCopyTapToMetric = () => {
    setMetrics((prev) => ({
      ...prev,
      [copyTarget]: tapCount,
    }));
    setCopiedAnimation(true);
    setTimeout(() => setCopiedAnimation(false), 1500);
  };

  // ─── Skipping Stopwatch Logic ────────────────────────────────────────────────
  useEffect(() => {
    let animId: number;

    const tick = () => {
      if (stopwatchRunning) {
        const now = performance.now();
        const elapsed = stopwatchAccumulatedRef.current + (now - stopwatchStartRef.current);
        setStopwatchMs(elapsed);
        animId = requestAnimationFrame(tick);
      }
    };

    if (stopwatchRunning) {
      stopwatchStartRef.current = performance.now();
      animId = requestAnimationFrame(tick);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [stopwatchRunning]);

  const handleStartStopwatch = () => {
    if (!stopwatchRunning) {
      stopwatchStartRef.current = performance.now();
      setStopwatchRunning(true);
      audioSynth.playStartChime();
    }
  };

  const handlePauseStopwatch = () => {
    if (stopwatchRunning) {
      const now = performance.now();
      stopwatchAccumulatedRef.current += now - stopwatchStartRef.current;
      setStopwatchMs(stopwatchAccumulatedRef.current);
      setStopwatchRunning(false);
    }
  };

  const handleResetStopwatch = () => {
    setStopwatchRunning(false);
    stopwatchAccumulatedRef.current = 0;
    setStopwatchMs(0);
  };

  const handleApplyStopwatchToSkipping = () => {
    const seconds = Math.round(stopwatchMs / 1000);
    setMetrics((prev) => ({
      ...prev,
      skipping_sec: seconds,
    }));
    setStopwatchCopiedAnimation(true);
    setTimeout(() => setStopwatchCopiedAnimation(false), 1500);
  };

  const formatStopwatchTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  // ─── Form Submission ──────────────────────────────────────────────────────────
  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setToastMessage({ type: 'error', text: 'Pilih siswa terlebih dahulu.' });
      return;
    }

    setSavingTest(true);
    try {
      const payload = {
        student_id: selectedStudent.id,
        tester_id: currentUserId,
        test_date: testDate,
        push_up_30s: Number(metrics.push_up_30s) || 0,
        sit_up_30s: Number(metrics.sit_up_30s) || 0,
        punches_30s: Number(metrics.punches_30s) || 0,
        kicks_30s: Number(metrics.kicks_30s) || 0,
        skipping_sec: Number(metrics.skipping_sec) || 0,
        split_front_cm: Number(metrics.split_front_cm) || 0,
        split_side_cm: Number(metrics.split_side_cm) || 0,
        total_score: assessment.totalScore,
        grade: assessment.grade,
        notes: notes.trim() || null,
      };

      const { data, error } = await supabase
        .from('student_physical_tests')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setToastMessage({
        type: 'success',
        text: `Asesmen fisik ${selectedStudent.full_name} berhasil disimpan! (Skor: ${assessment.totalScore}, Grade: ${assessment.grade})`,
      });

      // Append to student history immediately
      if (data) {
        setStudentHistory((prev) => [
          ...prev,
          {
            id: data.id,
            test_date: data.test_date,
            total_score: Number(data.total_score) || 0,
            grade: data.grade || 'C',
            push_up_30s: data.push_up_30s,
            sit_up_30s: data.sit_up_30s,
            punches_30s: data.punches_30s,
            kicks_30s: data.kicks_30s,
            skipping_sec: data.skipping_sec,
            split_front_cm: data.split_front_cm,
            split_side_cm: data.split_side_cm,
          },
        ]);
      }

      await loadLeaderboardData();

      // Reset tools and form for next test
      setTapCount(0);
      handleResetStopwatch();
      handleResetTimer();
      setMetrics(DEFAULT_METRICS);
      setNotes('');
    } catch (err: any) {
      console.error('Error saving physical test:', err);
      setToastMessage({
        type: 'error',
        text: err?.message || 'Gagal menyimpan hasil tes fisik siswa.',
      });
    } finally {
      setSavingTest(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // ─── Filtered Students for Search ─────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.current_belt && s.current_belt.toLowerCase().includes(q))
    );
  }, [students, studentSearch]);

  // ─── Leaderboard Calculations ─────────────────────────────────────────────────
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const leaderboardEntries = useMemo(() => {
    if (!allTests || allTests.length === 0) return [];

    // Map best or latest test per student
    const studentTestMap = new Map<string, RawPhysicalTest>();

    allTests.forEach((t) => {
      const existing = studentTestMap.get(t.student_id);
      if (!existing) {
        studentTestMap.set(t.student_id, t);
      } else {
        // Compare based on active leaderboard category
        let shouldReplace = false;
        if (lbCategory === 'general') {
          shouldReplace = Number(t.total_score) > Number(existing.total_score);
        } else if (lbCategory === 'speed') {
          const valNew = (t.punches_30s || 0) + (t.kicks_30s || 0);
          const valOld = (existing.punches_30s || 0) + (existing.kicks_30s || 0);
          shouldReplace = valNew > valOld;
        } else if (lbCategory === 'skipping') {
          shouldReplace = (t.skipping_sec || 0) > (existing.skipping_sec || 0);
        } else if (lbCategory === 'split') {
          const valNew = ((t.split_front_cm || 0) + (t.split_side_cm || 0)) / 2;
          const valOld = ((existing.split_front_cm || 0) + (existing.split_side_cm || 0)) / 2;
          shouldReplace = valNew < valOld; // smaller cm distance is better
        } else if (lbCategory === 'core') {
          shouldReplace = (t.sit_up_30s || 0) > (existing.sit_up_30s || 0);
        }

        if (shouldReplace) {
          studentTestMap.set(t.student_id, t);
        }
      }
    });

    const list = Array.from(studentTestMap.values()).map((test) => {
      const student = studentMap.get(test.student_id);
      const ageCategory = student ? getAgeCategory(student.dob) : 'remaja';
      const age = student ? calculateAge(student.dob) : 0;
      return {
        test,
        student,
        ageCategory,
        age,
      };
    });

    // Filter by Age Category
    const ageFiltered = list.filter((item) => {
      if (!item.student) return false; // skip tests with no matching student
      if (lbAgeFilter === 'all') return true;
      return item.ageCategory === lbAgeFilter;
    });

    // Sort based on category
    ageFiltered.sort((a, b) => {
      const ta = a.test;
      const tb = b.test;
      if (lbCategory === 'general') {
        return Number(tb.total_score) - Number(ta.total_score);
      } else if (lbCategory === 'speed') {
        const speedA = (ta.punches_30s || 0) + (ta.kicks_30s || 0);
        const speedB = (tb.punches_30s || 0) + (tb.kicks_30s || 0);
        return speedB - speedA;
      } else if (lbCategory === 'skipping') {
        return (tb.skipping_sec || 0) - (ta.skipping_sec || 0);
      } else if (lbCategory === 'split') {
        const splitA = ((ta.split_front_cm || 0) + (ta.split_side_cm || 0)) / 2;
        const splitB = ((tb.split_front_cm || 0) + (tb.split_side_cm || 0)) / 2;
        return splitA - splitB; // ascending (closer to 0 is best)
      } else if (lbCategory === 'core') {
        return (tb.sit_up_30s || 0) - (ta.sit_up_30s || 0);
      }
      return 0;
    });

    return ageFiltered;
  }, [allTests, studentMap, lbCategory, lbAgeFilter]);

  // Copy target labels
  const targetLabelMap: Record<MetricCopyTarget, string> = {
    push_up_30s: 'Push Up (30s)',
    sit_up_30s: 'Sit Up (30s)',
    punches_30s: 'Pukulan (30s)',
    kicks_30s: 'Tendangan (30s)',
  };


  return (
    <Navigation>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div
            className={`fixed top-24 right-4 sm:right-8 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
                : 'bg-red-950/90 text-red-200 border-red-500/50'
            }`}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <span>{toastMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <span className="text-sm font-semibold">{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─── Header & Mode Switcher ───────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-[var(--neu-accent-grad)] text-white shadow-[var(--neu-shadow-accent)]">
                ⚡
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                  Uji & Asesmen Fisik Siswa
                </h1>
                <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Dojo Physical Intelligence · 6 Pilar Kebugaran · Timer Matras & Leaderboard
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher Pills */}
          <div
            className="flex p-1.5 rounded-2xl gap-1 border border-[var(--neu-border)] bg-[var(--neu-surface-low)] w-full md:w-auto"
            style={{ boxShadow: 'var(--neu-shadow-pressed)' }}
          >
            <button
              type="button"
              onClick={() => setViewMode('assessment')}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                viewMode === 'assessment'
                  ? 'text-white shadow-md'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              style={
                viewMode === 'assessment'
                  ? { background: 'var(--neu-accent-grad)', boxShadow: 'var(--neu-shadow-accent)' }
                  : {}
              }
            >
              📝 Input & Asesmen
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mat_tools')}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                viewMode === 'mat_tools'
                  ? 'text-white shadow-md'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              style={
                viewMode === 'mat_tools'
                  ? { background: 'var(--neu-accent-grad)', boxShadow: 'var(--neu-shadow-accent)' }
                  : {}
              }
            >
              ⏱️ Alat Matras
            </button>
            <button
              type="button"
              onClick={() => setViewMode('leaderboard')}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                viewMode === 'leaderboard'
                  ? 'text-white shadow-md'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              style={
                viewMode === 'leaderboard'
                  ? { background: 'var(--neu-accent-grad)', boxShadow: 'var(--neu-shadow-accent)' }
                  : {}
              }
            >
              🏆 Leaderboard
            </button>
          </div>
        </div>

        {/* ─── VIEW 1 & 2: MAT TOOLS (AUDIO TIMER, TAP COUNTER & STOPWATCH) ───── */}
        {(viewMode === 'mat_tools' || viewMode === 'assessment') && (
          <div
            className={`rounded-3xl p-5 border border-[var(--neu-border)] transition-all ${
              viewMode === 'mat_tools' ? 'ring-2 ring-[var(--md-sys-color-primary)]' : ''
            }`}
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--neu-border)]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🥋</span>
                <h3 className="text-sm sm:text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Alat Ukur Matras (Audio Timer & Tally Counter)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAudioMute}
                  title={isAudioMuted ? 'Suara Senyap (Klik untuk Bunyi)' : 'Suara Aktif (Klik untuk Mute)'}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--neu-border)] flex items-center gap-1.5 cursor-pointer bg-[var(--neu-surface-low)]"
                  style={{ boxShadow: 'var(--neu-shadow-pressed-sm)' }}
                >
                  <span>{isAudioMuted ? '🔇 Muted' : '🔊 Sound On'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* 1. 30-Second Audio Timer */}
              <div
                className="rounded-2xl p-4 flex flex-col justify-between items-center text-center border border-[var(--neu-border)] bg-[var(--neu-surface-low)] relative overflow-hidden"
                style={{ boxShadow: 'var(--neu-shadow-pressed-sm)' }}
              >
                <div className="w-full flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] mb-2">
                  <span className="font-bold uppercase tracking-wider">Countdown 30s</span>
                  {timerRunning && (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Berjalan
                    </span>
                  )}
                </div>

                {/* Big Digital Display with Progress Ring */}
                <div className="relative my-2 w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={timerSeconds <= 5 ? '#ef4444' : '#ff5252'}
                      strokeWidth="8"
                      strokeDasharray={263.89}
                      strokeDashoffset={263.89 - (timerSeconds / 30) * 263.89}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className={`text-4xl font-extrabold tracking-tighter ${
                        timerSeconds <= 5 && timerSeconds > 0
                          ? 'text-red-500 scale-110 animate-pulse'
                          : timerSeconds === 0
                          ? 'text-red-400'
                          : 'text-[var(--md-sys-color-on-surface)]'
                      } transition-all`}
                    >
                      {timerSeconds}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--md-sys-color-on-surface-variant)]">
                      Detik
                    </span>
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="flex items-center gap-2 w-full mt-2">
                  {!timerRunning ? (
                    <button
                      type="button"
                      onClick={handleStartTimer}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95 transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                      }}
                    >
                      ▶ Mulai (30s)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePauseTimer}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95 transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                      }}
                    >
                      ⏸ Jeda
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] border border-[var(--neu-border)] bg-[var(--neu-surface)] hover:text-white cursor-pointer active:scale-95 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* 2. Giant Mat-Side Tap Counter */}
              <div
                className="rounded-2xl p-4 flex flex-col justify-between border border-[var(--neu-border)] bg-[var(--neu-surface-low)]"
                style={{ boxShadow: 'var(--neu-shadow-pressed-sm)' }}
              >
                <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  <span className="font-bold uppercase tracking-wider">Tap Counter (+1)</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTapCount((p) => Math.max(0, p - 1))}
                      className="px-2 py-0.5 rounded text-[11px] font-bold border border-[var(--neu-border)] bg-[var(--neu-surface)] hover:text-white"
                      title="Kurangi 1"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => setTapCount(0)}
                      className="px-2 py-0.5 rounded text-[11px] font-bold border border-[var(--neu-border)] bg-[var(--neu-surface)] hover:text-white"
                      title="Reset 0"
                    >
                      0
                    </button>
                  </div>
                </div>

                {/* Big Tap Area */}
                <button
                  type="button"
                  onClick={handleTapCount}
                  className="w-full py-5 rounded-2xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all select-none border border-red-500/30 group my-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(185,28,28,0.15) 100%)',
                    boxShadow: 'var(--neu-shadow-flat-sm)',
                  }}
                >
                  <span className="text-4xl sm:text-5xl font-black text-white group-hover:scale-105 transition-transform">
                    {tapCount}
                  </span>
                  <span className="text-[11px] uppercase font-bold tracking-widest text-red-400 mt-1">
                    Tap Repetisi (+1)
                  </span>
                </button>

                {/* Target Metric Injector */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={copyTarget}
                      onChange={(e) => setCopyTarget(e.target.value as MetricCopyTarget)}
                      className="flex-1 bg-[var(--neu-surface)] border border-[var(--neu-border)] text-xs text-[var(--md-sys-color-on-surface)] rounded-xl px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="push_up_30s">Push Up (30s)</option>
                      <option value="sit_up_30s">Sit Up (30s)</option>
                      <option value="punches_30s">Pukulan (30s)</option>
                      <option value="kicks_30s">Tendangan (30s)</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleCopyTapToMetric}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        copiedAnimation
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[var(--md-sys-color-primary)] text-white hover:opacity-90 active:scale-95'
                      }`}
                    >
                      {copiedAnimation ? '✓ Tersalin!' : 'Salin ke Form'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Skipping Rope Stopwatch */}
              <div
                className="rounded-2xl p-4 flex flex-col justify-between border border-[var(--neu-border)] bg-[var(--neu-surface-low)]"
                style={{ boxShadow: 'var(--neu-shadow-pressed-sm)' }}
              >
                <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  <span className="font-bold uppercase tracking-wider">Stopwatch Skipping</span>
                  <span className="text-xs text-sky-400 font-semibold">
                    {Math.round(stopwatchMs / 1000)} detik
                  </span>
                </div>

                {/* Stopwatch display */}
                <div
                  className="w-full py-5 rounded-2xl flex flex-col items-center justify-center my-2 border border-sky-500/20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(14,165,233,0.06) 100%)',
                    boxShadow: 'var(--neu-shadow-flat-sm)',
                  }}
                >
                  <span className="text-3xl sm:text-4xl font-mono font-black text-sky-300 tracking-wider">
                    {formatStopwatchTime(stopwatchMs)}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400/80 mt-1">
                    Durasi Lompat Tali
                  </span>
                </div>

                {/* Controls & Injector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {!stopwatchRunning ? (
                      <button
                        type="button"
                        onClick={handleStartStopwatch}
                        className="flex-1 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95 transition-all bg-sky-600 hover:bg-sky-500"
                      >
                        ▶ Mulai
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePauseStopwatch}
                        className="flex-1 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95 transition-all bg-amber-600 hover:bg-amber-500"
                      >
                        ⏸ Jeda
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleResetStopwatch}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] border border-[var(--neu-border)] bg-[var(--neu-surface)] hover:text-white cursor-pointer active:scale-95"
                    >
                      Reset
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyStopwatchToSkipping}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      stopwatchCopiedAnimation
                        ? 'bg-emerald-600 text-white'
                        : 'border border-sky-500/40 text-sky-300 hover:bg-sky-500/20 active:scale-95'
                    }`}
                  >
                    {stopwatchCopiedAnimation
                      ? '✓ Masuk ke Skipping Sec!'
                      : `Gunakan Hasil (${Math.round(stopwatchMs / 1000)}s) ke Form`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── VIEW 1: FAST STUDENT ENTRY & LIVE RADAR EVALUATION ────────────── */}
        {viewMode === 'assessment' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form & Student Selector (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <form onSubmit={handleSubmitTest} className="space-y-6">
                {/* 1. Student Selector Card */}
                <div
                  className="rounded-3xl p-5 border border-[var(--neu-border)]"
                  style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                      <span>👤</span> Pilih Siswa yang Diuji
                    </h3>
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {students.length} Siswa Aktif
                    </span>
                  </div>

                  {/* Search input */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Cari nama siswa atau sabuk..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full px-3.5 py-2 pl-9 text-xs rounded-xl bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                    />
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Horizontal / Grid of selectable students */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {loadingStudents ? (
                      <p className="text-xs text-gray-400 py-3 text-center">Memuat daftar siswa...</p>
                    ) : filteredStudents.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">Tidak ada siswa ditemukan.</p>
                    ) : (
                      filteredStudents.map((s) => {
                        const isSelected = selectedStudent?.id === s.id;
                        const beltStyle = getBeltStyle(s.current_belt);
                        const age = calculateAge(s.dob);
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedStudent(s)}
                            className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer border transition-all ${
                              isSelected
                                ? 'bg-red-500/15 border-red-500/50 shadow-sm'
                                : 'bg-[var(--neu-surface-low)] border-[var(--neu-border)] hover:bg-[var(--neu-surface-high)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                                style={{
                                  background: beltStyle.hex + '33',
                                  color: beltStyle.hex,
                                  border: `1px solid ${beltStyle.hex}66`,
                                }}
                              >
                                {s.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
                                  {s.full_name}
                                </p>
                                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                                  {s.current_belt || 'Putih'} · {age ? `${age} thn` : '-'}
                                </p>
                              </div>
                            </div>

                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                              style={{
                                background: beltStyle.hex + '22',
                                color: beltStyle.hex,
                                borderColor: beltStyle.hex + '44',
                              }}
                            >
                              {s.current_belt || 'Putih'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selected Student Banner */}
                  {selectedStudent && (
                    <div
                      className="mt-3 p-3 rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-surface-low)] flex items-center justify-between"
                      style={{ boxShadow: 'var(--neu-shadow-pressed-sm)' }}
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--md-sys-color-primary)]">
                          Siswa Terpilih
                        </span>
                        <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                          {selectedStudent.full_name}
                        </p>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                          Usia: {calculateAge(selectedStudent.dob)} thn ({assessment.ageCategory}) · Sabuk: {selectedStudent.current_belt || 'Putih'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Kehadiran: {studentAttendanceRate}%
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {studentHistory.length} kali tes sebelumnya
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Seven Metric Inputs */}
                <div
                  className="rounded-3xl p-5 border border-[var(--neu-border)]"
                  style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--neu-border)]">
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                      <span>📊</span> Input 7 Indikator Fisik
                    </h3>
                    <button
                      type="button"
                      onClick={() => setMetrics(DEFAULT_METRICS)}
                      className="text-xs text-[var(--md-sys-color-primary)] hover:underline"
                    >
                      Reset Form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Push Up */}
                    <div className="p-3 rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-surface-low)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
                          <span>💪</span> Push Up (30 Detik)
                        </label>
                        <span className="text-[10px] text-gray-400">Repetisi</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={metrics.push_up_30s || ''}
                        onChange={(e) =>
                          setMetrics((prev) => ({
                            ...prev,
                            push_up_30s: Math.max(0, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                        className="w-full text-lg font-bold px-3 py-1.5 rounded-xl bg-[var(--neu-surface)] border border-[var(--neu-border)] text-white focus:outline-none focus:border-red-500"
                        placeholder="0"
                      />
                    </div>

                    {/* Sit Up */}
                    <div className="p-3 rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-surface-low)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
                          <span>🛡️</span> Sit Up (30 Detik)
                        </label>
                        <span className="text-[10px] text-gray-400">Repetisi</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={metrics.sit_up_30s || ''}
                        onChange={(e) =>
                          setMetrics((prev) => ({
                            ...prev,
                            sit_up_30s: Math.max(0, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                        className="w-full text-lg font-bold px-3 py-1.5 rounded-xl bg-[var(--neu-surface)] border border-[var(--neu-border)] text-white focus:outline-none focus:border-red-500"
                        placeholder="0"
                      />
                    </div>

                    {/* Pukulan Tsuki */}
                    <div className="p-3 rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-surface-low)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
                          <span>👊</span> Pukulan Tsuki (30 Detik)
                        </label>
                        <span className="text-[10px] text-gray-400">Pukulan Cepat</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="300"
                        value={metrics.punches_30s || ''}
                        onChange={(e) =>
                          setMetrics((prev) => ({
                            ...prev,
                            punches_30s: Math.max(0, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                        className="w-full text-lg font-bold px-3 py-1.5 rounded-xl bg-[var(--neu-surface)] border border-[var(--neu-border)] text-white focus:outline-none focus:border-red-500"
                        placeholder="0"
                      />
                    </div>

                    {/* Tendangan Keri */}
                    <div className="p-3 rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-surface-low)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
                          <span>🦵</span> Tendangan Keri (30 Detik)
                        </label>
                        <span className="text-[10px] text-gray-400">Mawashi/Mae Geri</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="300"
                        value={metrics.kicks_30s || ''}
                        onChange={(e) =>
                          setMetrics((prev) => ({
                            ...prev,
                            kicks_30s: Math.max(0, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                        className="w-full text-lg font-bold px-3 py-1.5 rounded-xl bg-[var(--neu-surface)] border border-[var(--neu-border)] text-white focus:outline-none focus:border-red-500"
                        placeholder="0"
                      />
                    </div>

                    {/* Skipping */}
                    <div className="p-3 rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-surface-low)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
                          <span>🦘</span> Skipping Lompat Tali
                        </label>
                        <span className="text-[10px] text-sky-400 font-semibold">Detik</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="600"
                        value={metrics.skipping_sec || ''}
                        onChange={(e) =>
                          setMetrics((prev) => ({
                            ...prev,
                            skipping_sec: Math.max(0, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                        className="w-full text-lg font-bold px-3 py-1.5 rounded-xl bg-[var(--neu-surface)] border border-[var(--neu-border)] text-sky-300 focus:outline-none focus:border-sky-500"
                        placeholder="0 detik"
                      />
                    </div>

                    {/* Split Depan */}
                    <div className="p-3 rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-surface-low)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
                          <span>🧘</span> Split Depan (cm ke lantai)
                        </label>
                        <span className="text-[10px] text-gray-400">0cm = Flat</span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="60"
                        value={metrics.split_front_cm || ''}
                        onChange={(e) =>
                          setMetrics((prev) => ({
                            ...prev,
                            split_front_cm: Math.max(0, parseFloat(e.target.value) || 0),
                          }))
                        }
                        className="w-full text-lg font-bold px-3 py-1.5 rounded-xl bg-[var(--neu-surface)] border border-[var(--neu-border)] text-white focus:outline-none focus:border-red-500"
                        placeholder="0 cm"
                      />
                    </div>

                    {/* Split Samping */}
                    <div className="p-3 rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-surface-low)] sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
                          <span>🧘</span> Split Samping (cm ke lantai)
                        </label>
                        <span className="text-[10px] text-gray-400">0cm = Flat / Sempurna</span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="60"
                        value={metrics.split_side_cm || ''}
                        onChange={(e) =>
                          setMetrics((prev) => ({
                            ...prev,
                            split_side_cm: Math.max(0, parseFloat(e.target.value) || 0),
                          }))
                        }
                        className="w-full text-lg font-bold px-3 py-1.5 rounded-xl bg-[var(--neu-surface)] border border-[var(--neu-border)] text-white focus:outline-none focus:border-red-500"
                        placeholder="0 cm"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Date, Notes & Save Button */}
                <div
                  className="rounded-3xl p-5 border border-[var(--neu-border)] space-y-4"
                  style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1.5">
                        Tanggal Tes Fisik
                      </label>
                      <input
                        type="date"
                        value={testDate}
                        onChange={(e) => setTestDate(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1.5">
                        Evaluasi / Catatan Pelatih
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Kuda-kuda kokoh, tingkatkan fleksibilitas..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingTest || !selectedStudent}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                    style={{
                      background: 'var(--neu-accent-grad)',
                      boxShadow: 'var(--neu-shadow-accent)',
                    }}
                  >
                    {savingTest ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Menyimpan Hasil Asesmen...
                      </>
                    ) : (
                      <>
                        <span>💾</span> Simpan Hasil Asesmen Fisik Siswa
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Live Real-Time Radar Preview & Dual-Gate Readiness (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Composite Score & Grade Card */}
              <div
                className="rounded-3xl p-5 border border-[var(--neu-border)] text-center relative overflow-hidden"
                style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
              >
                <div className="flex items-center justify-between mb-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <span className="font-bold uppercase tracking-wider">Live Preview Kebugaran</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 border border-white/10">
                    Grade {assessment.grade}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 my-2">
                  <div className="text-5xl font-black tracking-tight text-[var(--md-sys-color-on-surface)]">
                    {assessment.totalScore}
                  </div>
                  <div className="text-left">
                    <span className="text-xs uppercase font-bold text-[var(--md-sys-color-primary)]">
                      Total Skor
                    </span>
                    <div
                      className={`text-xl font-black px-2.5 py-0.5 rounded-lg border inline-block ${
                        assessment.grade === 'S'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : assessment.grade === 'A'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : assessment.grade === 'B'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : assessment.grade === 'C'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}
                    >
                      {assessment.grade}
                    </div>
                  </div>
                </div>

                {/* Dual-Gate Readiness Pill */}
                <div
                  className={`mt-3 p-3 rounded-2xl border text-xs font-semibold text-left flex items-start gap-2.5 ${
                    assessment.examReadiness.statusColor === 'emerald'
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                      : assessment.examReadiness.statusColor === 'amber'
                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                      : 'bg-red-950/40 text-red-300 border-red-500/40'
                  }`}
                >
                  <span className="text-base leading-none">
                    {assessment.examReadiness.statusColor === 'emerald'
                      ? '✅'
                      : assessment.examReadiness.statusColor === 'amber'
                      ? '⚠️'
                      : '🛑'}
                  </span>
                  <div>
                    <p className="font-bold text-white leading-tight">
                      {assessment.examReadiness.statusText}
                    </p>
                    <p className="opacity-80 text-[11px] mt-0.5">
                      {assessment.examReadiness.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini Radar Chart */}
              <div
                className="rounded-3xl p-4 border border-[var(--neu-border)] flex flex-col items-center"
                style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
              >
                <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[var(--neu-border)] text-xs">
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                    Radar 6 Dimensi
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    Target Sabuk: {selectedStudent?.current_belt || 'Putih'}
                  </span>
                </div>
                <PhysicalRadarChart dimensions={assessment.radarDimensions} size={360} />
              </div>

              {/* Recommendations Box */}
              {assessment.recommendations.length > 0 && (
                <div
                  className="rounded-3xl p-5 border border-[var(--neu-border)] space-y-2.5"
                  style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
                    <span>🎯</span> Rekomendasi Latihan Pelatih
                  </h4>
                  <div className="space-y-2">
                    {assessment.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl text-xs text-gray-200 border border-white/5 bg-[var(--neu-surface-low)]"
                      >
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past History Chart of Selected Student */}
              {studentHistory.length > 0 && (
                <div
                  className="rounded-3xl p-4 border border-[var(--neu-border)]"
                  style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Riwayat Tes Fisik {selectedStudent?.full_name}
                  </h4>
                  <PhysicalProgressChart records={studentHistory} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 3: DOJO LEADERBOARD ───────────────────────────────────────── */}
        {viewMode === 'leaderboard' && (
          <div className="space-y-6">
            {/* Category Tabs */}
            <div
              className="rounded-3xl p-4 border border-[var(--neu-border)] flex flex-wrap gap-2 items-center justify-between"
              style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
            >
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'general', label: '🏆 Peringkat Umum', desc: 'Skor Tertinggi' },
                  { id: 'speed', label: '⚡ Speed Striker', desc: 'Pukulan + Tendangan' },
                  { id: 'skipping', label: '🦘 Skipping Master', desc: 'Detik Terlama' },
                  { id: 'split', label: '🧘 Rubber Master', desc: 'Split Terendah (cm)' },
                  { id: 'core', label: '🛡️ Iron Core', desc: 'Sit Up 30s' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setLbCategory(cat.id as LeaderboardTab)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      lbCategory === cat.id
                        ? 'bg-[var(--md-sys-color-primary)] text-white shadow-md'
                        : 'bg-[var(--neu-surface-low)] text-[var(--md-sys-color-on-surface-variant)] hover:text-white border border-[var(--neu-border)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Age Category Filter */}
              <div className="flex items-center gap-1 bg-[var(--neu-surface-low)] p-1 rounded-2xl border border-[var(--neu-border)]">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'anak', label: 'Anak (<12)' },
                  { id: 'remaja', label: 'Remaja (12-16)' },
                  { id: 'dewasa', label: 'Dewasa (>16)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLbAgeFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      lbAgeFilter === f.id
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Table / Card List */}
            <div
              className="rounded-3xl p-5 border border-[var(--neu-border)]"
              style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--neu-border)]">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {lbCategory === 'general' && '🏆 Peringkat Umum (Skor Komposit 6 Pilar)'}
                    {lbCategory === 'speed' && '⚡ Speed Striker (Kombinasi Pukulan & Tendangan)'}
                    {lbCategory === 'skipping' && '🦘 Skipping Master (Daya Tahan Kardio Lompat Tali)'}
                    {lbCategory === 'split' && '🧘 Rubber Master (Kelenturan Split Paling Rapat)'}
                    {lbCategory === 'core' && '🛡️ Iron Core (Kekuatan Otot Perut Sit Up)'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Menampilkan {leaderboardEntries.length} siswa terbaik
                  </p>
                </div>
              </div>

              {leaderboardEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-3xl mb-2">🏅</p>
                  <p className="text-sm font-semibold">Belum ada data tes fisik untuk kategori ini.</p>
                  <p className="text-xs mt-1">Lakukan tes fisik untuk memunculkan nama siswa di papan peringkat dojo.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {leaderboardEntries.map((item, idx) => {
                    const { test, student, age, ageCategory } = item;
                    const beltStyle = student
                      ? getBeltStyle(student.current_belt)
                      : { hex: '#94a3b8', bg: '', text: '', border: '', emoji: '🥋' };

                    // Formatted primary metric value
                    let metricDisplay = '';
                    let metricSub = '';

                    if (lbCategory === 'general') {
                      metricDisplay = `${test.total_score} Pts`;
                      metricSub = `Grade ${test.grade}`;
                    } else if (lbCategory === 'speed') {
                      const totalStrikes = (test.punches_30s || 0) + (test.kicks_30s || 0);
                      metricDisplay = `${totalStrikes} Serangan`;
                      metricSub = `${test.punches_30s} Tsuki + ${test.kicks_30s} Keri`;
                    } else if (lbCategory === 'skipping') {
                      metricDisplay = `${test.skipping_sec} Detik`;
                      metricSub = `${Math.floor((test.skipping_sec || 0) / 60)}m ${(test.skipping_sec || 0) % 60}s`;
                    } else if (lbCategory === 'split') {
                      const avgSplit = (((test.split_front_cm || 0) + (test.split_side_cm || 0)) / 2).toFixed(1);
                      metricDisplay = `${avgSplit} cm`;
                      metricSub = `Depan: ${test.split_front_cm}cm · Samping: ${test.split_side_cm}cm`;
                    } else if (lbCategory === 'core') {
                      metricDisplay = `${test.sit_up_30s} Reps`;
                      metricSub = `Sit Up 30 Detik`;
                    }

                    return (
                      <div
                        key={test.id || idx}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          idx === 0
                            ? 'bg-amber-950/25 border-amber-500/40 shadow-md'
                            : idx === 1
                            ? 'bg-slate-800/30 border-slate-400/40'
                            : idx === 2
                            ? 'bg-amber-900/20 border-amber-700/40'
                            : 'bg-[var(--neu-surface-low)] border-[var(--neu-border)] hover:bg-[var(--neu-surface-high)]'
                        }`}
                      >
                        {/* Rank Badge + Student Info */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm border flex-shrink-0 ${
                              idx === 0
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                                : idx === 1
                                ? 'bg-slate-300/20 text-slate-200 border-slate-300/60'
                                : idx === 2
                                ? 'bg-amber-700/20 text-amber-500 border-amber-700/60'
                                : 'bg-white/5 text-gray-400 border-white/10'
                            }`}
                          >
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-white leading-tight">
                                {student?.full_name || 'Siswa Dojo'}
                              </p>
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                                style={{
                                  background: beltStyle.hex + '22',
                                  color: beltStyle.hex,
                                  borderColor: beltStyle.hex + '44',
                                }}
                              >
                                {student?.current_belt || 'Putih'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {age ? `${age} thn` : ''} ({ageCategory}) · Tes: {test.test_date}
                            </p>
                          </div>
                        </div>

                        {/* Metric Highlight & Action */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`text-base font-black ${
                                idx === 0
                                  ? 'text-amber-400'
                                  : idx === 1
                                  ? 'text-slate-200'
                                  : idx === 2
                                  ? 'text-amber-500'
                                  : 'text-[var(--md-sys-color-primary)]'
                              }`}
                            >
                              {metricDisplay}
                            </span>
                            <p className="text-[10px] text-gray-400 mt-0.5">{metricSub}</p>
                          </div>

                          {student && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudent(student);
                                setViewMode('assessment');
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--neu-border)] bg-[var(--neu-surface)] hover:text-white active:scale-95 transition-all text-gray-300"
                              title="Pilih dan Uji Siswa Ini"
                            >
                              Uji ➔
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
        )}
      </div>
    </Navigation>
  );
}
