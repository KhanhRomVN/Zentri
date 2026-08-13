/**
 * ------------------------------------------------------------------
 * StatsStrip
 * ------------------------------------------------------------------
 * Summary statistics bar for the Email Manager dashboard.
 * Displays total accounts, health rate, linked services count,
 * and a placeholder for average latency.
 *
 * Main features:
 * - Total accounts with banned/deleting breakdown
 * - Health rate percentage with active count
 * - Linked services aggregate across all accounts
 * - Color-coded stat cards with gradient backgrounds
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { useMemo } from 'react';

// ── UI ──
import { Shield, Activity, Clock, Link } from 'lucide-react';

// ── Types ──
import { Account } from '../types';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface StatsStripProps {
  accounts: Account[];
}

// ─── Component ──────────────────────────────────────────────────────────
export default function StatsStrip({ accounts }: StatsStripProps) {
  // ── Derived ──
  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.status === 'active').length;
    const banned = accounts.filter((a) => a.status === 'banned').length;
    const deleting = accounts.filter((a) => a.status === 'deleting').length;
    const healthyPct = total > 0 ? ((active / total) * 100).toFixed(1) : '0.0';

    // Tổng số linked services (tương tự sticky sessions bên proxy)
    const linkedServices = accounts.reduce((sum, a) => sum + (a.services?.length ?? 0), 0);

    return { total, active, banned, deleting, healthyPct, linkedServices };
  }, [accounts]);

  const cards = [
    {
      label: 'Total Accounts',
      value: stats.total.toLocaleString(),
      delta: `${stats.banned.toLocaleString()} banned · ${stats.deleting.toLocaleString()} deleting`,
      deltaUp: false,
      icon: Shield,
      iconBg: 'bg-teal/10 text-teal',
      gradientClass: 'to-teal/[0.06]',
    },
    {
      label: 'Health Rate',
      value: `${stats.healthyPct}%`,
      delta: `${stats.active.toLocaleString()} active online`,
      deltaUp: true,
      icon: Activity,
      iconBg: 'bg-green/10 text-green',
      gradientClass: 'to-green/[0.06]',
    },
    {
      label: 'Avg Latency',
      value: '—',
      delta: 'not available for accounts',
      deltaUp: false,
      icon: Clock,
      iconBg: 'bg-yellow/10 text-yellow',
      gradientClass: 'to-yellow/[0.06]',
    },
    {
      label: 'Linked Services',
      value: stats.linkedServices.toLocaleString(),
      delta: 'across all accounts',
      deltaUp: false,
      icon: Link,
      iconBg: 'bg-violet/10 text-violet',
      gradientClass: 'to-violet/[0.06]',
    },
  ];

  // ── Render ──
  return (
    <div className="grid grid-cols-4 gap-2.5 shrink-0">
      {cards.map((card, i) => (
        <div
          key={i}
          className="relative bg-card-background border border-border rounded-lg px-3.5 py-3 overflow-hidden"
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent ${card.gradientClass}`}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-text-secondary uppercase tracking-wider font-semibold">
                {card.label}
              </span>
              <div className={`size-7 rounded-md flex items-center justify-center ${card.iconBg}`}>
                <card.icon className="size-4" />
              </div>
            </div>
            <div className="font-display text-[22px] font-semibold text-text-primary flex items-baseline gap-1.5">
              {card.value}
            </div>
            <div
              className={`text-[11px] mt-1.5 font-mono ${
                card.deltaUp ? 'text-green' : 'text-text-secondary'
              }`}
            >
              {card.delta}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
