import type { Workflow } from '../../../types';
import { DEVICE_TYPE_META } from '../../../constants';

interface WorkflowTableProps {
  workflows: Workflow[];
  onOpen: (id: string) => void;
}

const parseDuration = (d: string): number => {
  let sec = 0;
  const minMatch = d.match(/(\d+)p/);
  const secMatch = d.match(/(\d+)s/);
  if (minMatch) sec += parseInt(minMatch[1], 10) * 60;
  if (secMatch) sec += parseInt(secMatch[1], 10);
  return sec;
};

const formatDuration = (sec: number): string => {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}p${sec % 60 ? ` ${sec % 60}s` : ''}`;
};

export const WorkflowTable = ({ workflows, onOpen }: WorkflowTableProps) => {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-card-background">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-3 py-2.5 text-[10px] uppercase text-text-secondary font-semibold">Workflow</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase text-text-secondary font-semibold">Service</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase text-text-secondary font-semibold">Device</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase text-text-secondary font-semibold">Node</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase text-text-secondary font-semibold">Lượt chạy</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase text-text-secondary font-semibold">TG chạy TB</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase text-text-secondary font-semibold">Chạy gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf) => {
              const device = DEVICE_TYPE_META[wf.deviceType];
              const runs = wf.history.length;
              const avgSec = runs
                ? wf.history.reduce((sum, h) => sum + parseDuration(h.duration), 0) / runs
                : 0;
              return (
                <tr
                  key={wf.id}
                  onClick={() => onOpen(wf.id)}
                  className="cursor-pointer hover:bg-sidebar-item-hover border-b border-border last:border-0"
                >
                  <td className="px-3 py-2.5 max-w-[240px]">
                    <div className="text-xs font-semibold text-text-primary truncate">{wf.name}</div>
                    <div className="text-[10px] text-text-secondary truncate">{wf.tags.join(', ')}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[11px] text-text-secondary">—</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ background: device.bg, color: device.color }}
                    >
                      {device.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-text-secondary">{wf.nodes.length}</td>
                  <td className="px-3 py-2.5 text-[11px] text-text-secondary">{runs}</td>
                  <td className="px-3 py-2.5 text-[11px] text-text-secondary">
                    {runs ? formatDuration(Math.round(avgSec)) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-text-secondary">{wf.lastRun.time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {workflows.length === 0 && (
        <div className="py-10 text-center text-xs text-text-secondary">No workflows found.</div>
      )}
    </div>
  );
};