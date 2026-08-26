import { memo } from 'react';
import { Layers, Play, MoreVertical } from 'lucide-react';
import type { Workflow } from '../../types';
import { DEVICE_TYPE_META, STATUS_META } from '../../constants';

interface WorkflowCardProps {
  workflow: Workflow;
  onOpen: (id: string) => void;
  onQuickRun: (id: string) => void;
  onMenu: (id: string, anchor: DOMRect) => void;
}

function successColor(rate: number): string {
  if (rate >= 90) return '#22c55e';
  if (rate >= 70) return '#f59e0b';
  return '#ef4444';
}

export const WorkflowCard = memo(
  ({ workflow: wf, onOpen, onQuickRun, onMenu }: WorkflowCardProps) => {
    const status = STATUS_META[wf.status];
    const platform = DEVICE_TYPE_META[wf.deviceType];
    const shownTags = wf.tags.slice(0, 3);
    const extraTags = wf.tags.length - 3;

    return (
      <div
        onClick={() => onOpen(wf.id)}
        className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card-background p-4 cursor-pointer transition-all duration-150 hover:border-border-hover hover:shadow-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold"
            style={{ background: platform.bg, color: platform.color }}
          >
            {platform.label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenu(wf.id, e.currentTarget.getBoundingClientRect());
            }}
            className="rounded-md p-1 text-text-secondary opacity-0 transition-opacity hover:bg-sidebar-item-hover hover:text-text-primary group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Name + status */}
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: status.color }} />
          <h3 className="truncate text-sm font-semibold text-text-primary">{wf.name}</h3>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">{wf.description}</p>

        {/* Tags */}
        {shownTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {shownTags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-background px-1.5 py-0.5 text-[10px] text-text-secondary border border-border"
              >
                #{tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-text-secondary border border-border">
                +{extraTags}
              </span>
            )}
          </div>
        )}

        {/* Success rate */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${wf.successRate}%`, background: successColor(wf.successRate) }}
            />
          </div>
          <span className="text-[10px] text-text-secondary">{wf.successRate}%</span>
        </div>

        {/* Meta footer */}
        <div className="flex items-center justify-between border-t border-border pt-2 text-[10px] text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {wf.nodes.length} steps
            </span>
            <span>{wf.updatedAt}</span>
          </div>
          <span>{wf.owner.initials}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(wf.id);
            }}
            className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
          >
            Open Canvas
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickRun(wf.id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
            title="Quick Run"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  },
);

WorkflowCard.displayName = 'WorkflowCard';
