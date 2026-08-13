import { useMemo } from 'react';
import { Shield, Activity, Clock, Link } from 'lucide-react';
import { Proxy } from '../../../types/db';
import { deriveDisplayStatus } from '../constants';

interface StatsStripProps {
  proxies: Proxy[];
}

export default function StatsStrip({ proxies }: StatsStripProps) {
  const stats = useMemo(() => {
    const total = proxies.length;
    const healthy = proxies.filter((p) => deriveDisplayStatus(p) === 'healthy').length;
    const degraded = proxies.filter((p) => deriveDisplayStatus(p) === 'degraded').length;
    const dead = proxies.filter((p) => deriveDisplayStatus(p) === 'dead').length;
    const healthyPct = total > 0 ? ((healthy / total) * 100).toFixed(1) : '0.0';

    const latencies = proxies.filter((p) => p.latency != null).map((p) => p.latency!);
    const avgLat =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null;

    // Active leases (sticky sessions) — estimate from proxy_type='private' and status='active'
    const leases = proxies.filter(
      (p) => p.proxy_type === 'private' && p.status === 'active',
    ).length;

    return { total, healthy, degraded, dead, healthyPct, avgLat, leases };
  }, [proxies]);

  const cards = [
    {
      label: 'Total Proxies',
      value: stats.total.toLocaleString(),
      delta: `${stats.degraded.toLocaleString()} degraded · ${stats.dead.toLocaleString()} dead`,
      deltaUp: false,
      icon: Shield,
      iconBg: 'bg-teal/10 text-teal',
      gradientClass: 'to-teal/[0.06]',
    },
    {
      label: 'Health Rate',
      value: `${stats.healthyPct}%`,
      delta: `${stats.healthy.toLocaleString()} healthy online`,
      deltaUp: true,
      icon: Activity,
      iconBg: 'bg-green/10 text-green',
      gradientClass: 'to-green/[0.06]',
    },
    {
      label: 'Avg Latency',
      value: stats.avgLat != null ? `${stats.avgLat}ms` : '—',
      delta: 'across active nodes',
      deltaUp: false,
      icon: Clock,
      iconBg: 'bg-yellow/10 text-yellow',
      gradientClass: 'to-yellow/[0.06]',
    },
    {
      label: 'Sticky Sessions',
      value: stats.leases.toLocaleString(),
      delta: 'bound to operational accounts',
      deltaUp: false,
      icon: Link,
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
              {card.label === 'Avg Latency' && stats.avgLat != null && (
                <small className="text-[11.5px] text-text-secondary font-sans font-medium">
                  ms
                </small>
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
