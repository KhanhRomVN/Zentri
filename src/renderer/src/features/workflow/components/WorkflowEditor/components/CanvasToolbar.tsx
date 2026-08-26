import { ArrowLeft } from 'lucide-react';
import type { Workflow } from '../../../types';
import { DEVICE_TYPE_META } from '../../../constants';

interface CanvasToolbarProps {
  workflow: Workflow;
  onBack: () => void;
}

export const CanvasToolbar = ({ workflow, onBack }: CanvasToolbarProps) => {
  const platform = DEVICE_TYPE_META[workflow.deviceType];
  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b border-t border-r border-border px-3">
      <button
        onClick={onBack}
        className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
        title="Back to list"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <span className="text-xs text-text-secondary">Workflow /</span>
      <span className="text-sm font-bold text-text-primary">{workflow.name}</span>
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{ background: platform.bg, color: platform.color }}
      >
        {platform.label}
      </span>
    </div>
  );
};
