'use client';

import React, { useState } from 'react';
import { PhysicalRadarDimension } from '@/lib/physicalScoring';

export interface PhysicalRadarChartProps {
  dimensions: PhysicalRadarDimension[];
  size?: number; // default 300 or responsive viewBox
  showTarget?: boolean; // default true
  className?: string;
}

export default function PhysicalRadarChart({
  dimensions = [],
  size,
  showTarget = true,
  className = '',
}: PhysicalRadarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!dimensions || dimensions.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-[var(--neu-surface,#1d1918)] border border-white/5 shadow-[-4px_-4px_10px_rgba(255,255,255,0.03),5px_5px_12px_rgba(0,0,0,0.6)] ${className}`}
        style={size ? { width: size, minHeight: size } : { minHeight: 280 }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-white/5 text-gray-400">
          <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-200">Data Radar Fisik Belum Tersedia</p>
        <p className="text-xs text-gray-400 mt-1">Lakukan asesmen tes fisik untuk memetakan 6 dimensi pilar kebugaran.</p>
      </div>
    );
  }

  // Geometry configurations
  const viewBoxWidth = 500;
  const viewBoxHeight = 440;
  const cx = viewBoxWidth / 2; // 250
  const cy = 200;
  const maxRadius = 125;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const numAxes = dimensions.length;
  const angleStep = (2 * Math.PI) / numAxes;
  const startAngle = -Math.PI / 2; // -90 deg (top vertex)

  // Calculate polygon points for each concentric ring
  const getRingPoints = (levelRatio: number) => {
    return dimensions.map((_, i) => {
      const angle = startAngle + i * angleStep;
      const r = maxRadius * levelRatio;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
  };

  // Convert points array to SVG polygon string
  const pointsToString = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Ring polygons
  const ringPolygons = levels.map((lvl) => ({
    level: Math.round(lvl * 100),
    points: pointsToString(getRingPoints(lvl)),
  }));

  // Axis grid lines (from center to outermost 100% vertex)
  const axisLines = dimensions.map((_, i) => {
    const angle = startAngle + i * angleStep;
    return {
      x2: cx + maxRadius * Math.cos(angle),
      y2: cy + maxRadius * Math.sin(angle),
    };
  });

  // Target Polygon (Belt Benchmark)
  const targetPoints = dimensions.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const clampedScore = Math.max(0, Math.min(100, d.target || 0));
    const r = maxRadius * (clampedScore / 100);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
  const targetPolygonString = pointsToString(targetPoints);

  // Student Actual Polygon
  const studentPoints = dimensions.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const clampedScore = Math.max(0, Math.min(100, d.score || 0));
    const r = maxRadius * (clampedScore / 100);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      score: clampedScore,
      target: d.target,
      label: d.label,
      rawValue: d.rawValue,
      unit: d.unit,
    };
  });
  const studentPolygonString = pointsToString(studentPoints);

  // External Label Coordinates
  const labelPositions = dimensions.map((dim, i) => {
    const angle = startAngle + i * angleStep;
    const labelDistance = maxRadius + 26;
    const lx = cx + labelDistance * Math.cos(angle);
    const ly = cy + labelDistance * Math.sin(angle);

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    if (cos > 0.25) {
      textAnchor = 'start';
    } else if (cos < -0.25) {
      textAnchor = 'end';
    }

    let yOffset = 0;
    if (sin < -0.75) {
      yOffset = -8; // top label
    } else if (sin > 0.75) {
      yOffset = 14; // bottom label
    }

    return {
      x: lx,
      y: ly + yOffset,
      textAnchor,
      dim,
    };
  });

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-2xl bg-[var(--neu-surface,#1d1918)] border border-white/5 shadow-[-4px_-4px_10px_rgba(255,255,255,0.03),6px_6px_14px_rgba(0,0,0,0.65)] ${className}`}
      style={size ? { width: size, maxWidth: '100%' } : undefined}
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto overflow-visible select-none transition-all duration-300"
        style={{ maxHeight: size ? size * 0.95 : 440 }}
      >
        <defs>
          {/* Crimson glow for student polygon */}
          <filter id="radar-crimson-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dot highlight filter */}
          <filter id="radar-dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial gradient background */}
          <radialGradient id="radar-bg-gradient" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.06" />
            <stop offset="70%" stopColor="#ef4444" stopOpacity="0.01" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft radial backdrop behind hexagon */}
        <circle cx={cx} cy={cy} r={maxRadius} fill="url(#radar-bg-gradient)" />

        {/* Concentric Hexagon Rings (20%, 40%, 60%, 80%, 100%) */}
        {ringPolygons.map((ring, idx) => {
          const isOuter = idx === ringPolygons.length - 1;
          return (
            <g key={ring.level}>
              <polygon
                points={ring.points}
                fill={idx % 2 === 1 ? 'rgba(255, 255, 255, 0.015)' : 'none'}
                stroke={isOuter ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.07)'}
                strokeWidth={isOuter ? 1.5 : 1}
              />
              {/* Ring scale percentage tick on top vertical axis */}
              <text
                x={cx + 4}
                y={cy - maxRadius * (ring.level / 100) + 4}
                fontSize="9"
                fill="rgba(255, 255, 255, 0.3)"
                textAnchor="start"
                className="font-mono select-none"
              >
                {ring.level}
              </text>
            </g>
          );
        })}

        {/* 6 Grid Axes */}
        {axisLines.map((axis, idx) => (
          <line
            key={idx}
            x1={cx}
            y1={cy}
            x2={axis.x2}
            y2={axis.y2}
            stroke="rgba(255, 255, 255, 0.09)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        ))}

        {/* Target Polygon (Dashed Sky-Blue Belt Standard) */}
        {showTarget && (
          <polygon
            points={targetPolygonString}
            fill="rgba(56, 189, 248, 0.08)"
            stroke="#38bdf8"
            strokeWidth="1.75"
            strokeDasharray="4 4"
            strokeLinejoin="round"
            className="transition-all duration-300 pointer-events-none"
          />
        )}

        {/* Actual Student Performance Polygon (Glowing Crimson Red) */}
        <polygon
          points={studentPolygonString}
          fill="rgba(239, 68, 68, 0.35)"
          stroke="#ef4444"
          strokeWidth="2.5"
          strokeLinejoin="round"
          filter="url(#radar-crimson-glow)"
          className="transition-all duration-300"
        />

        {/* Interactive Vertex Dots & Tooltip Hit Areas */}
        {studentPoints.map((pt, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g
              key={idx}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Outer halo on hover */}
              {isHovered && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="9"
                  fill="rgba(239, 68, 68, 0.3)"
                  stroke="#ef4444"
                  strokeWidth="1"
                />
              )}
              {/* Vertex Dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : 4.5}
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth={isHovered ? 2 : 1.5}
                filter="url(#radar-dot-glow)"
              />
              {/* Invisible large touch/hover hit area */}
              <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />
            </g>
          );
        })}

        {/* Vertex Labels, Raw Values & Scores */}
        {labelPositions.map((pos, idx) => {
          const isHovered = hoveredIdx === idx;
          const { dim } = pos;
          return (
            <g
              key={dim.key || idx}
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <text
                x={pos.x}
                y={pos.y}
                textAnchor={pos.textAnchor}
                className="select-none"
              >
                {/* Dimension Title */}
                <tspan
                  x={pos.x}
                  dy="-6"
                  fontSize="11"
                  fontWeight={isHovered ? '700' : '600'}
                  fill={isHovered ? '#ff5252' : 'var(--md-sys-color-on-surface, #f0dfdd)'}
                >
                  {dim.label}
                </tspan>
                {/* Score & Raw Value */}
                <tspan
                  x={pos.x}
                  dy="15"
                  fontSize="10"
                  fontWeight="500"
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
                >
                  {dim.score} pts
                  {dim.rawValue !== undefined && dim.rawValue !== null && (
                    <tspan fill="rgba(255, 255, 255, 0.45)">
                      {` · ${dim.rawValue} ${dim.unit || ''}`}
                    </tspan>
                  )}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* Bottom Legend */}
        <g transform={`translate(${cx}, ${viewBoxHeight - 22})`} className="select-none">
          {showTarget ? (
            <>
              {/* Siswa (Actual) */}
              <g transform="translate(-105, 0)">
                <circle cx="-8" cy="-4" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                <text x="3" y="0" fontSize="11" fontWeight="500" fill="#f0dfdd">
                  Siswa (Aktual)
                </text>
              </g>

              {/* Target Sabuk */}
              <g transform="translate(45, 0)">
                <line x1="-16" y1="-4" x2="4" y2="-4" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
                <text x="12" y="0" fontSize="11" fontWeight="500" fill="#38bdf8">
                  Target Sabuk
                </text>
              </g>
            </>
          ) : (
            <g transform="translate(-40, 0)">
              <circle cx="-8" cy="-4" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
              <text x="3" y="0" fontSize="11" fontWeight="500" fill="#f0dfdd">
                Siswa (Skor Kebugaran)
              </text>
            </g>
          )}
        </g>
      </svg>

      {/* Floating active dimension summary pill on hover */}
      {hoveredIdx !== null && dimensions[hoveredIdx] && (
        <div className="mt-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-xs text-center backdrop-blur-sm shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
          <span className="font-semibold text-white">{dimensions[hoveredIdx].label}:</span>
          <span className="text-[#ff5252] font-bold">{dimensions[hoveredIdx].score} Poin</span>
          {showTarget && dimensions[hoveredIdx].target && (
            <span className="text-sky-400">
              (Target: {dimensions[hoveredIdx].target} pts)
            </span>
          )}
          {dimensions[hoveredIdx].rawValue !== undefined && (
            <span className="text-gray-400">
              [{dimensions[hoveredIdx].rawValue} {dimensions[hoveredIdx].unit}]
            </span>
          )}
        </div>
      )}
    </div>
  );
}
