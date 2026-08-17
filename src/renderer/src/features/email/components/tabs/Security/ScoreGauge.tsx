/**
 * ScoreGauge — circular SVG gauge with risk pill.
 */

import { ShieldCheck } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
}

const R = 86;
const CIRC = 2 * Math.PI * R;

export default function ScoreGauge({ score }: ScoreGaugeProps) {
  const scorePct = (score / 100) * 100;
  const dash = (scorePct / 100) * CIRC;

  const scoreRingColor = score >= 80 ? '#4fd18c' : score >= 50 ? '#f2a94f' : '#f2495c';

  const riskPill =
    score >= 80
      ? { text: 'STRONG', color: 'var(--ok)', bg: 'rgba(79,209,140,.12)' }
      : score >= 50
        ? { text: 'MODERATE — ATTENTION', color: 'var(--warn)', bg: 'rgba(242,169,79,.12)' }
        : { text: 'WEAK — ACTION NEEDED', color: 'var(--danger)', bg: 'rgba(242,73,92,.12)' };

  const riskDesc =
    score >= 80
      ? 'Well secured. Account has strong protection measures in place.'
      : score >= 50
        ? 'Moderate security. Some areas need attention to reduce exposure.'
        : 'Missing email 2FA and recovery methods leave this identity highly exposed to takeover.';

  return (
    <div className="bg-card-background border border-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" />
          Security Score
        </h2>
      </div>
      <div className="flex flex-col items-center px-4 py-5">
        <div className="relative w-[200px] h-[200px]">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,.06)"
              strokeWidth="10"
            />
            <circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={scoreRingColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC}`}
              strokeDashoffset="0"
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dasharray .5s ease, stroke .5s ease' }}
            />
            <circle
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke="rgba(255,255,255,.03)"
              strokeWidth="1"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[46px] font-bold leading-none tracking-tight">
              {score}
            </span>
            <span className="text-[12px] text-text-secondary/60 mt-1">/ 100</span>
          </div>
        </div>

        <div
          className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-bold tracking-wide"
          style={{ background: riskPill.bg, color: riskPill.color }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: riskPill.color, boxShadow: `0 0 0 3px ${riskPill.bg}` }}
          />
          {riskPill.text}
        </div>
        <p className="mt-2.5 text-[11.5px] text-text-secondary/50 text-center max-w-[230px] leading-relaxed">
          {riskDesc}
        </p>
      </div>
    </div>
  );
}