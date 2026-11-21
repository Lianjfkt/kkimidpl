'use client';

import React, { useState } from 'react';

export interface PhysicalTestRecordItem {
  id: string;
  test_date: string;
  total_score: number;
  grade: string;
  push_up_30s?: number;
  sit_up_30s?: number;
  punches_30s?: number;
  kicks_30s?: number;
  skipping_sec?: number;
  split_front_cm?: number;
  split_side_cm?: number;
}

export interface PhysicalProgressChartProps {
  records: PhysicalTestRecordItem[];
  className?: string;
}

export default function PhysicalProgressChart({
  records = [],
  className = '',
}: PhysicalProgressChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Format date helper (ID locale)
  const formatDateShort = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const formatDateFull = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Grade color theme mapping
  const getGradeStyle = (grade?: string) => {
    switch (grade?.toUpperCase()) {
      case 'S':
        return { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40', text: '#fbbf24' };
      case 'A':
        return { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', text: '#34d399' };
      case 'B':
        return { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40', text: '#60a5fa' };
      case 'C':
        return { badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40', text: '#fb923c' };
      case 'D':
      default:
        return { badge: 'bg-red-500/20 text-red-400 border-red-500/40', text: '#f87171' };
    }
  };

  // Empty state handling
  if (!records || records.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-[var(--neu-surface,#1d1918)] border border-white/5 shadow-[-4px_-4px_10px_rgba(255,255,255,0.03),5px_5px_12px_rgba(0,0,0,0.6)] ${className}`}
        style={{ minHeight: 260 }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-white/5 text-gray-400">
          <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-5 5-4-4-3 3" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-200">Belum Ada Riwayat Tes Fisik</p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          Grafik garis perkembangan fisik akan otomatis terbentuk setelah siswa menjalani tes berkala dojo.
        </p>
      </div>
    );
  }

  // Chronologically sort records ascending
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime()
  );

  // SVG dimensions
  const viewBoxWidth = 540;
  const viewBoxHeight = 240;
  const padding = { top: 35, right: 32, bottom: 45, left: 45 };
  const plotWidth = viewBoxWidth - padding.left - padding.right; // 463
  const plotHeight = viewBoxHeight - padding.top - padding.bottom; // 160
  const baselineY = padding.top + plotHeight; // 195

  // Y-axis grid levels (0, 25, 50, 75, 100)
  const yLevels = [0, 25, 50, 75, 100];
  const scoreToY = (score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    return baselineY - (clamped / 100) * plotHeight;
  };

  // Single record fallback view
  if (sortedRecords.length === 1) {
    const single = sortedRecords[0];
    const pointX = padding.left + plotWidth / 2;
    const pointY = scoreToY(single.total_score);
    const gradeStyle = getGradeStyle(single.grade);

    return (
      <div
        className={`flex flex-col p-4 sm:p-5 rounded-2xl bg-[var(--neu-surface,#1d1918)] border border-white/5 shadow-[-4px_-4px_10px_rgba(255,255,255,0.03),6px_6px_14px_rgba(0,0,0,0.65)] ${className}`}
      >
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
          <div>
            <h4 className="text-sm font-semibold text-white">Tren Perkembangan Fisik</h4>
            <p className="text-xs text-gray-400">1 Tes Tercatat ({formatDateFull(single.test_date)})</p>
          </div>
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-full border ${gradeStyle.badge}`}
          >
            Skor: {single.total_score} (Grade {single.grade})
          </span>
        </div>

        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto select-none">
          <defs>
            <filter id="single-dot-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {yLevels.map((lvl) => {
            const y = scoreToY(lvl);
            return (
              <g key={lvl}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={viewBoxWidth - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="rgba(255, 255, 255, 0.35)"
                  className="font-mono select-none"
                >
                  {lvl}
                </text>
              </g>
            );
          })}

          {/* Guide horizontal score line */}
          <line
            x1={padding.left}
            y1={pointY}
            x2={viewBoxWidth - padding.right}
            y2={pointY}
            stroke="rgba(239, 68, 68, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Single Point */}
          <circle
            cx={pointX}
            cy={pointY}
            r="12"
            fill="rgba(239, 68, 68, 0.2)"
            stroke="#ef4444"
            strokeWidth="1.5"
          />
          <circle
            cx={pointX}
            cy={pointY}
            r="6"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="2"
            filter="url(#single-dot-glow)"
          />

          {/* Data Callout Text */}
          <text
            x={pointX}
            y={pointY - 18}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#ffffff"
          >
            {`${single.total_score} Poin (Grade ${single.grade})`}
          </text>
          <text
            x={pointX}
            y={baselineY + 22}
            textAnchor="middle"
            fontSize="11"
            fill="#94a3b8"
          >
            {`${formatDateShort(single.test_date)} (Tes Pertama)`}
          </text>
        </svg>

        <div className="mt-2 p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 text-xs text-gray-300">
          <svg className="w-4 h-4 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Minimal 2 kali tes fisik untuk melihat visualisasi garis tren perkembangan.</span>
        </div>
      </div>
    );
  }

  // 2+ records: Compute points & Catmull-Rom smooth cubic bezier curve
  const points = sortedRecords.map((rec, i) => {
    const x = padding.left + (i / (sortedRecords.length - 1)) * plotWidth;
    const y = scoreToY(rec.total_score);
    return { x, y, record: rec };
  });

  // Build smooth cubic Bezier path
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    if (pts.length === 2) {
      return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;
    }

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const tension = 0.18;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePathD = buildSmoothPath(points);
  const areaPathD = `${linePathD} L ${points[points.length - 1].x.toFixed(1)} ${baselineY} L ${points[0].x.toFixed(1)} ${baselineY} Z`;

  // Calculate overall & latest progress deltas
  const firstRecord = sortedRecords[0];
  const latestRecord = sortedRecords[sortedRecords.length - 1];
  const prevRecord = sortedRecords[sortedRecords.length - 2];
  const totalDelta = Math.round((latestRecord.total_score - firstRecord.total_score) * 10) / 10;
  const recentDelta = Math.round((latestRecord.total_score - prevRecord.total_score) * 10) / 10;
  const latestGradeStyle = getGradeStyle(latestRecord.grade);

  return (
    <div
      className={`flex flex-col p-4 sm:p-5 rounded-2xl bg-[var(--neu-surface,#1d1918)] border border-white/5 shadow-[-4px_-4px_10px_rgba(255,255,255,0.03),6px_6px_14px_rgba(0,0,0,0.65)] ${className}`}
    >
      {/* Header with stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-white/5 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">Tren Perkembangan Fisik</h4>
          <p className="text-xs text-gray-400">
            {`${sortedRecords.length} kali tes (${formatDateShort(firstRecord.test_date)} – ${formatDateShort(latestRecord.test_date)})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Trend badge */}
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1 ${
              recentDelta >= 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            {recentDelta >= 0 ? (
              <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            {`${recentDelta >= 0 ? `+${recentDelta}` : recentDelta} pts`}
          </span>
          {/* Latest Grade badge */}
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${latestGradeStyle.badge}`}>
            {`Skor: ${latestRecord.total_score} (Grade ${latestRecord.grade})`}
          </span>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto select-none overflow-visible transition-all duration-300"
      >
        <defs>
          {/* Gradient for area fill beneath line */}
          <linearGradient id="progress-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.38" />
            <stop offset="85%" stopColor="#ef4444" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter for crimson path */}
          <filter id="progress-line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dot highlight filter */}
          <filter id="progress-dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Y-axis gridlines and labels */}
        {yLevels.map((lvl) => {
          const y = scoreToY(lvl);
          return (
            <g key={lvl}>
              <line
                x1={padding.left}
                y1={y}
                x2={viewBoxWidth - padding.right}
                y2={y}
                stroke={lvl === 75 ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth={lvl === 75 ? 1.2 : 1}
                strokeDasharray={lvl === 75 ? '3 3' : '4 4'}
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill={lvl === 75 ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)'}
                className="font-mono select-none"
              >
                {lvl}
              </text>
            </g>
          );
        })}

        {/* Target 75 threshold annotation */}
        <text
          x={viewBoxWidth - padding.right}
          y={scoreToY(75) - 4}
          textAnchor="end"
          fontSize="9"
          fill="rgba(56, 189, 248, 0.55)"
          className="font-mono select-none"
        >
          Target 75
        </text>

        {/* Shaded Area Fill Beneath Curve */}
        <path d={areaPathD} fill="url(#progress-area-grad)" className="transition-all duration-300" />

        {/* Smooth Crimson Curve */}
        <path
          d={linePathD}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#progress-line-glow)"
          className="transition-all duration-300"
        />

        {/* Interactive Guideline on Hover */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <line
            x1={points[hoveredIdx].x}
            y1={padding.top}
            x2={points[hoveredIdx].x}
            y2={baselineY}
            stroke="rgba(239, 68, 68, 0.5)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Data Points */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIdx === idx;
          const isLast = idx === points.length - 1;
          return (
            <g
              key={pt.record.id || idx}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setHoveredIdx(isHovered ? null : idx)}
            >
              {/* Outer halo when active or for last point */}
              {(isHovered || isLast) && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 10 : 8}
                  fill="rgba(239, 68, 68, 0.25)"
                  stroke="#ef4444"
                  strokeWidth="1"
                />
              )}
              {/* Core vertex dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : isLast ? 5 : 4}
                fill={isLast ? '#ff5252' : '#ef4444'}
                stroke="#ffffff"
                strokeWidth={isHovered ? 2 : 1.5}
                filter="url(#progress-dot-glow)"
              />
              {/* Hit area for easy tap/hover */}
              <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />
            </g>
          );
        })}

        {/* X-axis date labels */}
        {points.map((pt, idx) => {
          // Prevent overlap if there are many points
          const shouldShow =
            points.length <= 7 ||
            idx === 0 ||
            idx === points.length - 1 ||
            idx % Math.ceil(points.length / 5) === 0;

          if (!shouldShow) return null;

          return (
            <text
              key={idx}
              x={pt.x}
              y={baselineY + 20}
              textAnchor="middle"
              fontSize="10"
              fill={idx === points.length - 1 ? '#ffffff' : '#94a3b8'}
              fontWeight={idx === points.length - 1 ? '600' : '400'}
              className="select-none"
            >
              {formatDateShort(pt.record.test_date)}
            </text>
          );
        })}

        {/* Hover Tooltip Box */}
        {hoveredIdx !== null && points[hoveredIdx] && (() => {
          const pt = points[hoveredIdx];
          const rec = pt.record;
          const boxWidth = 145;
          const boxHeight = 62;

          let tooltipX = pt.x - boxWidth / 2;
          if (tooltipX < padding.left) tooltipX = padding.left;
          if (tooltipX + boxWidth > viewBoxWidth - padding.right) {
            tooltipX = viewBoxWidth - padding.right - boxWidth;
          }

          let tooltipY = pt.y - boxHeight - 12;
          if (tooltipY < padding.top - 15) {
            tooltipY = pt.y + 14;
          }

          return (
            <g className="pointer-events-none transition-all duration-150 select-none">
              {/* Tooltip Background Card */}
              <rect
                x={tooltipX}
                y={tooltipY}
                width={boxWidth}
                height={boxHeight}
                rx="8"
                fill="rgba(24, 21, 20, 0.95)"
                stroke="rgba(239, 68, 68, 0.45)"
                strokeWidth="1.2"
                filter="drop-shadow(0 4px 10px rgba(0, 0, 0, 0.8))"
              />

              {/* Date */}
              <text
                x={tooltipX + 10}
                y={tooltipY + 16}
                fontSize="10"
                fill="#94a3b8"
                fontWeight="500"
              >
                {formatDateFull(rec.test_date)}
              </text>

              {/* Score & Grade */}
              <text
                x={tooltipX + 10}
                y={tooltipY + 34}
                fontSize="13"
                fontWeight="700"
                fill="#ffffff"
              >
                {rec.total_score}{' '}
                <tspan fontSize="11" fontWeight="600" fill="#ff5252">
                  pts
                </tspan>{' '}
                <tspan fontSize="11" fontWeight="700" fill={getGradeStyle(rec.grade).text}>
                  (Grade {rec.grade})
                </tspan>
              </text>

              {/* Quick Metrics Breakdown */}
              <text
                x={tooltipX + 10}
                y={tooltipY + 50}
                fontSize="9"
                fill="rgba(255, 255, 255, 0.55)"
              >
                PU: {rec.push_up_30s ?? '-'} · SU: {rec.sit_up_30s ?? '-'} · Skip: {rec.skipping_sec ? `${rec.skipping_sec}s` : '-'}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
