/**
 * Dojo Physical Intelligence & Fitness Scoring Engine
 * 
 * Provides deterministic normalization, 6-axis radar dimension calculation,
 * composite scoring, grade assignment, dual-gate exam readiness check, and
 * smart drill recommendations.
 */

export interface PhysicalRadarDimension {
  key: string;
  label: string;
  score: number;      // 0 - 100
  target: number;     // 0 - 100 based on belt & age
  unit: string;
  rawValue: number | string;
}

export interface PhysicalAssessmentResult {
  totalScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  radarDimensions: PhysicalRadarDimension[];
  examReadiness: {
    isEligible: boolean;
    statusText: string;
    statusColor: 'emerald' | 'amber' | 'red';
    reason: string;
  };
  recommendations: string[];
  ageCategory: 'anak' | 'remaja' | 'dewasa';
}

export interface PhysicalMetricsInput {
  push_up_30s: number;
  sit_up_30s: number;
  punches_30s: number;
  kicks_30s: number;
  skipping_sec: number;
  split_front_cm: number;
  split_side_cm: number;
}

/**
 * Categorize student age group from Date of Birth.
 * - anak: < 12 years
 * - remaja: 12 - 16 years
 * - dewasa: > 16 years
 */
export function getAgeCategory(dob?: string): 'anak' | 'remaja' | 'dewasa' {
  if (!dob) return 'remaja';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 'remaja';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 12) return 'anak';
  if (age <= 16) return 'remaja';
  return 'dewasa';
}

/**
 * Inverted split calculation:
 * 0 cm = 100 points
 * 10 cm = 75 points
 * 20 cm = 50 points
 * >= 40 cm = 0 points
 * Formula: max(0, min(100, 100 - (cm * 2.5)))
 */
export function calculateSplitScore(cm: number): number {
  if (cm <= 0) return 100;
  const score = 100 - (cm * 2.5);
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

/**
 * Minimum benchmark target score based on official belt and age group.
 */
export function getBeltTargetScore(currentBelt?: string, ageCategory: 'anak' | 'remaja' | 'dewasa' = 'remaja'): number {
  let base = 60;
  if (currentBelt) {
    const belt = currentBelt.toLowerCase().trim();
    if (belt.includes('hitam')) base = 85;
    else if (belt.includes('coklat tua') || belt.includes('cokelat tua')) base = 82;
    else if (belt.includes('coklat') || belt.includes('cokelat')) base = 80;
    else if (belt.includes('biru tua')) base = 75;
    else if (belt.includes('biru')) base = 70;
    else if (belt.includes('hijau')) base = 70;
    else if (belt.includes('kuning') || belt.includes('oranye')) base = 65;
    else if (belt.includes('putih')) base = 60;
  }

  if (ageCategory === 'anak') {
    return Math.max(50, base - 5);
  } else if (ageCategory === 'dewasa') {
    return Math.min(90, base + 2);
  }
  return base;
}

/**
 * Assign grade based on composite score:
 * S: >= 90
 * A: 80 - 89.9
 * B: 70 - 79.9
 * C: 60 - 69.9
 * D: < 60
 */
export function getGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

/**
 * Baseline maximum raw capacities for score normalization (maps to 100 points).
 */
const AGE_MAX_CAPACITIES = {
  anak: {
    push_up: 22,
    sit_up: 22,
    punches: 55,
    kicks: 40,
    skipping: 120, // 2 minutes
  },
  remaja: {
    push_up: 30,
    sit_up: 30,
    punches: 75,
    kicks: 55,
    skipping: 200, // 3 min 20 sec
  },
  dewasa: {
    push_up: 35,
    sit_up: 35,
    punches: 80,
    kicks: 60,
    skipping: 240, // 4 minutes
  },
};

/**
 * Pure calculation function for Student Physical Intelligence Assessment.
 */
export function calculatePhysicalAssessment(
  metrics: PhysicalMetricsInput,
  attendanceRate: number, // 0 - 100
  dob?: string,
  currentBelt?: string
): PhysicalAssessmentResult {
  const ageCategory = getAgeCategory(dob);
  const caps = AGE_MAX_CAPACITIES[ageCategory];
  const targetScore = getBeltTargetScore(currentBelt, ageCategory);

  // 1. Upper Body Power (push_up_30s)
  const upperBodyScore = Math.max(0, Math.min(100, Math.round(((metrics.push_up_30s || 0) / caps.push_up) * 100)));

  // 2. Core Strength (sit_up_30s)
  const coreScore = Math.max(0, Math.min(100, Math.round(((metrics.sit_up_30s || 0) / caps.sit_up) * 100)));

  // 3. Striking Speed (average of normalized punches & kicks)
  const punchNorm = Math.max(0, Math.min(100, ((metrics.punches_30s || 0) / caps.punches) * 100));
  const kickNorm = Math.max(0, Math.min(100, ((metrics.kicks_30s || 0) / caps.kicks) * 100));
  const strikingScore = Math.round((punchNorm + kickNorm) / 2);

  // 4. Cardio & Footwork (skipping_sec)
  const cardioScore = Math.max(0, Math.min(100, Math.round(((metrics.skipping_sec || 0) / caps.skipping) * 100)));

  // 5. Flexibility (average of inverted front and side splits)
  const frontSplitScore = calculateSplitScore(metrics.split_front_cm || 0);
  const sideSplitScore = calculateSplitScore(metrics.split_side_cm || 0);
  const flexibilityScore = Math.round(((frontSplitScore + sideSplitScore) / 2) * 10) / 10;

  // 6. Discipline (attendanceRate, clamped 0 - 100)
  const disciplineScore = Math.max(0, Math.min(100, Math.round(attendanceRate || 0)));

  // Radar Dimensions
  const radarDimensions: PhysicalRadarDimension[] = [
    {
      key: 'upper_body',
      label: 'Upper Body Power',
      score: upperBodyScore,
      target: targetScore,
      unit: 'reps',
      rawValue: metrics.push_up_30s,
    },
    {
      key: 'core_strength',
      label: 'Core Strength',
      score: coreScore,
      target: targetScore,
      unit: 'reps',
      rawValue: metrics.sit_up_30s,
    },
    {
      key: 'striking_speed',
      label: 'Striking Speed',
      score: strikingScore,
      target: targetScore,
      unit: 'reps',
      rawValue: Math.round(((metrics.punches_30s || 0) + (metrics.kicks_30s || 0)) / 2),
    },
    {
      key: 'cardio_footwork',
      label: 'Cardio & Footwork',
      score: cardioScore,
      target: targetScore,
      unit: 'detik',
      rawValue: metrics.skipping_sec,
    },
    {
      key: 'flexibility',
      label: 'Flexibility',
      score: flexibilityScore,
      target: targetScore,
      unit: 'cm',
      rawValue: Number((((metrics.split_front_cm || 0) + (metrics.split_side_cm || 0)) / 2).toFixed(1)),
    },
    {
      key: 'discipline',
      label: 'Discipline',
      score: disciplineScore,
      target: 75,
      unit: '%',
      rawValue: Math.round(attendanceRate),
    },
  ];

  // Composite Total Score (average of 6 dimensions)
  const sumScores = upperBodyScore + coreScore + strikingScore + cardioScore + flexibilityScore + disciplineScore;
  const totalScore = Math.round((sumScores / 6) * 10) / 10;
  const grade = getGrade(totalScore);

  // Dual-Gate Exam Readiness
  const isPhysicalReady = totalScore >= targetScore;
  const isAttendanceReady = attendanceRate >= 75;
  const isEligible = isPhysicalReady && isAttendanceReady;

  let statusText = '';
  let statusColor: 'emerald' | 'amber' | 'red' = 'red';
  let reason = '';

  if (isEligible) {
    statusText = 'Siap Ujian Sabuk';
    statusColor = 'emerald';
    reason = 'Memenuhi syarat fisik dan kedisiplinan kehadiran minimum untuk ujian sabuk.';
  } else if (isPhysicalReady && !isAttendanceReady) {
    statusText = 'Perhatian Kehadiran';
    statusColor = 'amber';
    reason = `Kehadiran (${Math.round(attendanceRate)}%) belum mencapai batas minimum 75% untuk rekomendasi ujian sabuk.`;
  } else if (!isPhysicalReady && isAttendanceReady) {
    statusText = 'Perlu Peningkatan Fisik';
    statusColor = totalScore >= targetScore - 10 ? 'amber' : 'red';
    reason = `Skor fisik (${totalScore}) belum mencapai target standar sabuk (${targetScore}).`;
  } else {
    statusText = 'Perlu Peningkatan Fisik & Kehadiran';
    statusColor = 'red';
    reason = `Skor fisik (${totalScore}/${targetScore}) dan Kehadiran (${Math.round(attendanceRate)}%/75%) belum memenuhi syarat ujian sabuk.`;
  }

  // Smart Drill Recommendations (identify weakest dimensions < 70)
  const drillMap: Record<string, string> = {
    flexibility: 'Fokus Fleksibilitas: Rutinkan peregangan hamstring, butterfly stretch, dan latihan split bertahap 10-15 menit setelah pemanasan.',
    cardio_footwork: 'Fokus Kardio & Footwork: Tingkatkan durasi skipping bertahap (target 3 menit non-stop) dan latihan interval sprint untuk kelincahan gerak.',
    striking_speed: 'Fokus Kecepatan Serangan: Latihan kombinasi tsuki & keri pada target pads cepat serta plyometrics untuk akselerasi daya ledak.',
    upper_body: 'Fokus Kekuatan Tubuh Atas: Latihan push-up harian terstruktur (3 set x 10-15 repetisi) untuk menguatkan daya dorong pukulan.',
    core_strength: 'Fokus Kekuatan Otot Inti: Latihan plank progresif (3 x 45 detik) dan sit-up untuk memperkokoh stabilitas kuda-kuda (dachi).',
    discipline: 'Fokus Kedisiplinan: Tingkatkan konsistensi kehadiran latihan reguler di dojo (target minimal 75%) demi menjaga ritme perkembangan teknik.',
  };

  const weakDimensions = radarDimensions
    .filter(d => d.score < 70)
    .sort((a, b) => a.score - b.score);

  let recommendations: string[] = [];
  if (weakDimensions.length === 0) {
    recommendations = [
      'Kondisi fisik prima! Pertahankan rutinitas latihan fisik dan tingkatkan variasi teknik kumite/kata.'
    ];
  } else {
    recommendations = weakDimensions.slice(0, 3).map(d => drillMap[d.key]).filter(Boolean);
  }

  return {
    totalScore,
    grade,
    radarDimensions,
    examReadiness: {
      isEligible,
      statusText,
      statusColor,
      reason,
    },
    recommendations,
    ageCategory,
  };
}
