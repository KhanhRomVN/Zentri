import { useMemo } from 'react';
import { Layers, Activity, CheckCircle, Globe } from 'lucide-react';
import type { Workflow } from '../types';

interface StatsStripProps {
  workflows: Workflow[];
}

export default function StatsStrip({ workflows }: StatsStripProps) {
  const stats = useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter((wf) => wf.status === 'active').length;
    const avgRate = total
      ? Math.round(workflows.reduce((sum, wf) => sum + wf.successRate, 0) / total)
      : 0;
    const webCount = workflows.filter((wf) => wf.platform === 'website').length;
    const mobileCount = total - webCount;
    return { total, active, avgRate, webCount, mobileCount };
  }, [workflows]);

  const cards = [
    {
      label: 'Total Workflows',
      value: stats.total.toLocaleString(),
      delta: `${stats.active} active online`,
      deltaUp: true,
      icon: Layers,
      iconBg: 'bg-teal/10 text-teal',
      gradientClass: 'to-teal/[0.06]',
    },
    {
      label: 'Active',
      value: stats.active.toLocaleString(),
      delta: 'running on schedule',
      deltaUp: true,
      icon: Activity,
      iconBg: 'bg-green/10 text-green',
      gradientClass: 'to-green/[0.06]',
    },
    {
      label: 'Success Rate',
      value: `${stats.avgRate}%`,
      delta: 'average across all flows',
      deltaUp: false,
      icon: CheckCircle,
      iconBg: 'bg-yellow/10 text-yellow',
      gradientClass: 'to-yellow/[0.06]',
    },
    {
      label: 'Platform Split',
      value: `${stats.webCount}/${stats.mobileCount}`,
      delta: 'web / mobile',
      deltaUp: false,
      icon: Globe,
      iconBg: 'bg-violet/10 text-violet',
      gradientClass: 'to-violet/[0.06]',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 shrink-0 mb-3.5">
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
              {card.label === 'Success Rate' && (
                <small className="text-[11.5px] text-text-secondary font-sans font-medium">%</small>
              )}
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