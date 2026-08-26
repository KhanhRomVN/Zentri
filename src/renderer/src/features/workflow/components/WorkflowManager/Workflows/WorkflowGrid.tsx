import type { Workflow } from '../../../types';
import { DEVICE_TYPE_META } from '../../../constants';

interface WorkflowGridProps {
  workflows: Workflow[];
  onOpen: (id: string) => void;
}

export const WorkflowGrid = ({ workflows, onOpen }: WorkflowGridProps) => {
  if (workflows.length === 0) {
    return <div className="py-14 text-center text-xs text-text-secondary">No workflows found.</div>;
  }

  return (
    <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
      {workflows.map((wf) => {
        const device = DEVICE_TYPE_META[wf.deviceType];
        return (
          <div
            key={wf.id}
            onClick={() => onOpen(wf.id)}
            className="rounded-xl border border-border bg-card-background p-4 cursor-pointer transition-all hover:border-border-hover hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <span
                className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold"
                style={{ background: device.bg, color: device.color }}
              >
                {device.label}
              </span>
              <span className="text-[10px] text-text-secondary">—</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-text-primary truncate">{wf.name}</h3>
            <p className="mt-1 text-xs text-text-secondary line-clamp-2">{wf.description}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${wf.successRate}%`,
                    background: wf.successRate > 90 ? '#22c55e' : wf.successRate > 70 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-[10px] text-text-secondary">{wf.successRate}%</span>
            </div>
            <div className="mt-2 text-[10px] text-text-secondary">
              {wf.nodes.length} nodes · {wf.history.length} runs
            </div>
          </div>
        );
      })}
    </div>
  );
};