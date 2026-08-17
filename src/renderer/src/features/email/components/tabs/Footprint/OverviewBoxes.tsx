/**
 * OverviewBoxes — 3 summary boxes for Footprint tab.
 */

import { Globe, Gauge, AlertTriangle } from 'lucide-react';
import { cn } from '../../../../../shared/lib/utils';

interface OverviewBoxesProps {
  totalSites: number;
  avgScore: number;
  ipChanges: number;
}

export default function OverviewBoxes({
  totalSites,
  avgScore,
  ipChanges,
}: OverviewBoxesProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Total Sites */}
      <div className="rounded-md border border-border bg-card-background px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-secondary/60 font-bold">
          <Globe className="w-3 h-3 text-teal" />
          Total Sites
        </div>
        <div className="mt-1.5 font-display text-xl font-bold text-text-primary">
          {totalSites}
        </div>
        <div className="mt-0.5 text-[10px] text-text-secondary/40">domains visited</div>
      </div>

      {/* Avg Security Score */}
      <div className="rounded-md border border-border bg-card-background px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-secondary/60 font-bold">
          <Gauge className="w-3 h-3 text-violet" />
          Avg Score
        </div>
        <div
          className={cn(
            'mt-1.5 font-display text-xl font-bold',
            avgScore >= 80 ? 'text-green' : avgScore >= 50 ? 'text-warn' : 'text-red',
          )}
        >
          {avgScore}
        </div>
        <div className="mt-0.5 text-[10px] text-text-secondary/40">composite security score</div>
      </div>

      {/* IP Changes */}
      <div className="rounded-md border border-border bg-card-background px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-secondary/60 font-bold">
          <AlertTriangle className="w-3 h-3 text-red" />
          IP Changes
        </div>
        <div className="mt-1.5 font-display text-xl font-bold text-text-primary">{ipChanges}</div>
        <div className="mt-0.5 text-[10px] text-text-secondary/40">domains with rotation</div>
      </div>
    </div>
  );
}