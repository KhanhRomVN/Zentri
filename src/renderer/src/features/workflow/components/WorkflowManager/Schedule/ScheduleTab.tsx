import type { Workflow } from '../../../types';
import { STATUS_META } from '../../../constants';

interface ScheduleTabProps {
  workflows: Workflow[];
  onOpen: (id: string) => void;
}

export const ScheduleTab = ({ workflows, onOpen }: ScheduleTabProps) => {
  const sorted = [...workflows].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="space-y-2">
      {sorted.length === 0 ? (
        <div className="py-10 text-center text-xs text-text-secondary">Chưa có dữ liệu lịch chạy.</div>
      ) : (
        sorted.map((wf) => {
          const status = STATUS_META[wf.status];
          return (
            <div
              key={wf.id}
              onClick={() => onOpen(wf.id)}
              className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-card-background cursor-pointer hover:bg-sidebar-item-hover"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary truncate">{wf.name}</div>
                <div className="text-[10px] text-text-secondary">Last run: {wf.lastRun.time}</div>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold"
                style={{ background: status.bg, color: status.color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
                {status.label}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};