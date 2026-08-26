import type { Workflow } from '../../../types';
import { STATUS_META, DEVICE_TYPE_META } from '../../../constants';

interface AnalyticsTabProps {
  workflows: Workflow[];
}

export const AnalyticsTab = ({ workflows }: AnalyticsTabProps) => {
  const total = workflows.length;
  const active = workflows.filter((w) => w.status === 'active').length;
  const avgRate = total ? Math.round(workflows.reduce((s, w) => s + w.successRate, 0) / total) : 0;

  const statusDist = Object.entries(STATUS_META).map(([key, meta]) => ({
    key,
    count: workflows.filter((w) => w.status === key).length,
    ...meta,
  }));

  const deviceDist = Object.entries(DEVICE_TYPE_META).map(([key, meta]) => ({
    key,
    count: workflows.filter((w) => w.deviceType === key).length,
    ...meta,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card-background p-3">
          <div className="text-[10px] uppercase text-text-secondary">Total Workflows</div>
          <div className="mt-1 text-lg font-semibold text-text-primary">{total}</div>
        </div>
        <div className="rounded-lg border border-border bg-card-background p-3">
          <div className="text-[10px] uppercase text-text-secondary">Active</div>
          <div className="mt-1 text-lg font-semibold text-text-primary">{active}</div>
        </div>
        <div className="rounded-lg border border-border bg-card-background p-3">
          <div className="text-[10px] uppercase text-text-secondary">Avg Success</div>
          <div className="mt-1 text-lg font-semibold text-text-primary">{avgRate}%</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-text-primary mb-2">Phân bố trạng thái</h3>
          {statusDist.map((s) => (
            <div key={s.key} className="flex items-center gap-2 mb-1">
              <span className="w-20 text-[10px] text-text-secondary">{s.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${total ? (s.count / total) * 100 : 0}%`, background: s.color }}
                />
              </div>
              <span className="text-[10px] text-text-secondary w-6 text-right">{s.count}</span>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-text-primary mb-2">Phân bố thiết bị</h3>
          {deviceDist.map((p) => (
            <div key={p.key} className="flex items-center gap-2 mb-1">
              <span className="w-20 text-[10px] text-text-secondary">{p.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${total ? (p.count / total) * 100 : 0}%`, background: p.color }}
                />
              </div>
              <span className="text-[10px] text-text-secondary w-6 text-right">{p.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};