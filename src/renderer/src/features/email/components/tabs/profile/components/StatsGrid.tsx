import { Database, RefreshCw, Activity } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';

export const MetadataCard = ({
  label,
  value,
  icon: Icon,
  colorClass,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: any;
  colorClass?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      'flex flex-col gap-3 p-4 rounded-xl border border-border bg-card shadow-sm transition-all duration-300',
      onClick ? 'cursor-pointer hover:border-primary/40 hover:shadow-md' : '',
    )}
  >
    <div className="flex items-center justify-between">
      <div className={cn('p-2 rounded-lg bg-primary/10', colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
    <div className="text-xl font-bold tracking-tight">{value}</div>
  </div>
);

interface StatsGridProps {
  cookieCount: number;
  lastSync?: string | number;
  onCookieClick: () => void;
}

export const StatsGrid = ({ cookieCount, lastSync, onCookieClick }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetadataCard
        label="Cookies"
        value={cookieCount}
        icon={Database}
        colorClass="text-blue-500"
        onClick={onCookieClick}
      />
      <MetadataCard
        label="Last Sync"
        value={lastSync ? new Date(lastSync).toLocaleDateString() : 'Never'}
        icon={RefreshCw}
        colorClass="text-purple-500"
      />
      <MetadataCard
        label="Success Rate"
        value="98.4%"
        icon={Activity}
        colorClass="text-emerald-500"
      />
      <MetadataCard
        label="Profile Score"
        value="92/100"
        icon={Activity}
        colorClass="text-orange-500"
      />
    </div>
  );
};
