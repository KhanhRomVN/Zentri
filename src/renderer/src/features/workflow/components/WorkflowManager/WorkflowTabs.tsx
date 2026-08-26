import { List, BarChart3, CalendarClock } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';

export type WorkflowTab = 'list' | 'analytics' | 'schedule';

interface WorkflowTabsProps {
  active: WorkflowTab;
  onChange: (tab: WorkflowTab) => void;
}

const TABS: { key: WorkflowTab; label: string; icon: typeof List }[] = [
  { key: 'list', label: 'Danh sách workflows', icon: List },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'schedule', label: 'Lịch chạy', icon: CalendarClock },
];

export const WorkflowTabs = ({ active, onChange }: WorkflowTabsProps) => {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg w-fit flex-wrap bg-background border border-border">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              active === tab.key
                ? 'bg-sidebar-item-hover text-text-primary border border-border'
                : 'text-text-secondary hover:text-text-primary border border-transparent',
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};