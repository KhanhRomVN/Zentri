/**
 * WarningsList — severity-coded warning rows with hover fix action.
 */

import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../../../../shared/lib/utils';
import type { SecurityWarning } from './types';

interface WarningsListProps {
  warnings: SecurityWarning[];
}

export default function WarningsList({ warnings }: WarningsListProps) {
  return (
    <div className="bg-card-background border border-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warn" />
          Warnings
        </h2>
        <span className="text-[13px] font-bold text-red bg-red/10 px-2.5 py-0.5 rounded-full">
          {warnings.length} OPEN
        </span>
      </div>
      {warnings.length > 0 ? (
        <div className="flex flex-col">
          {warnings.map((warning, i) => (
            <div
              key={i}
              className={cn(
                'group flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-muted/30',
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
                  warning.severity === 'critical'
                    ? 'bg-red/10 text-red'
                    : 'bg-warn/10 text-warn',
                )}
              >
                {warning.severity === 'critical' ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-text-primary font-medium">{warning.title}</div>
                <div className="text-[12px] text-text-secondary/50 mt-1">{warning.sub}</div>
              </div>
              <span
                className={cn(
                  'shrink-0 text-[12px] font-bold uppercase tracking-wider px-2 py-1 rounded-md',
                  warning.severity === 'critical'
                    ? 'bg-red/10 text-red'
                    : 'bg-warn/10 text-warn',
                )}
              >
                {warning.severity}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-[13px] text-text-secondary/40 italic">
          No warnings detected. This account is well secured.
        </div>
      )}
    </div>
  );
}