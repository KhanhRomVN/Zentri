import { FC } from 'react';
import { Smartphone, Monitor, Battery, HardDrive, Cpu, MemoryStick, Clock } from 'lucide-react';
import { Device } from '../../../../types';
import { STATUS_CONFIG } from '../../../../constants';
import { formatBytes, formatUptime } from '../../../../utils';
import { cn } from '../../../../../../shared/lib/utils';

interface OverviewTabProps {
  device: Device;
}

const OverviewTab: FC<OverviewTabProps> = ({ device }) => {
  const statusCfg = STATUS_CONFIG[device.status] || STATUS_CONFIG.offline;
  const TypeIcon = device.type === 'mobile' ? Smartphone : Monitor;

  const rows = [
    {
      icon: TypeIcon,
      label: 'Type',
      value: `${device.type === 'mobile' ? 'Mobile' : 'Desktop'}${device.isVirtual ? ' · Virtual' : ' · Physical'}`,
    },
    {
      icon: Cpu,
      label: 'Platform',
      value: `${device.platform || '—'} ${device.osVersion ? `(${device.osVersion})` : ''}`,
    },
    { icon: Battery, label: 'Battery', value: device.battery != null ? `${device.battery}%` : '—' },
    {
      icon: HardDrive,
      label: 'Storage',
      value: `${formatBytes(device.storageUsed)} / ${formatBytes(device.storageTotal)}`,
    },
    {
      icon: MemoryStick,
      label: 'RAM',
      value: `${formatBytes(device.ramUsed)} / ${formatBytes(device.ramTotal)}`,
    },
    { icon: Cpu, label: 'CPU Usage', value: device.cpuUsage != null ? `${device.cpuUsage}%` : '—' },
    { icon: Clock, label: 'Last Seen', value: formatUptime(device.lastSeenAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={cn('size-2 rounded-full', statusCfg.dotClass)} />
        <span className={cn('text-sm font-medium', statusCfg.textClass)}>{statusCfg.label}</span>
        <span className="text-sm text-text-tertiary">· {device.groupName || 'Ungrouped'}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-2.5 rounded-md border border-border bg-panel/50 p-3"
          >
            <row.icon className="size-4 text-text-tertiary shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-text-tertiary">{row.label}</div>
              <div className="text-[13px] font-medium text-text-primary truncate">{row.value}</div>
            </div>
          </div>
        ))}
      </div>

      {device.tags && device.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {device.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-panel px-2.5 py-1 text-[11px] text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
