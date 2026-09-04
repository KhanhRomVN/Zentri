/**
 * ScoreBreakdown — 2×2 grid of zone cards.
 */

import { BarChart3 } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import { ZONE_STYLES } from './utils';
import type { BreakdownItem } from './types';

interface ScoreBreakdownProps {
  breakdown: BreakdownItem[];
}

export default function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="bg-card-background border border-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-violet" />
          Score Breakdown
        </h2>
        <span className="text-[13px] text-text-secondary/40">4 categories</span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 max-[560px]:grid-cols-1">
        {breakdown.map((item) => {
          const zone = ZONE_STYLES[item.zone];
          const pct = (item.score / item.max) * 100;
          return (
            <div
              key={item.label}
              className="bg-muted/30 border border-border rounded-xl px-3.5 py-3.5"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="flex items-center gap-2 text-[13px] text-text-primary">
                  <span
                    className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
                      zone.iconBg,
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                <span className={cn('font-display text-[13px] font-semibold', zone.score)}>
                  {item.score}
                  <span className="text-text-secondary/40 font-normal">/{item.max}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[.06] overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', zone.fill)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
