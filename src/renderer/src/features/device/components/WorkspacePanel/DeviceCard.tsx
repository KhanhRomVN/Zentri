import { FC } from 'react';
import { Smartphone, Monitor, Battery, HardDrive, Cpu, MemoryStick } from 'lucide-react';
import { Device } from '../../types';
import { STATUS_CONFIG } from '../../constants';
import { formatBytes } from '../../utils';
import { cn } from '../../../../shared/lib/utils';

interface DeviceCardProps {
  device: Device;
  onClick: (device: Device) => void;
}

const DeviceCard: FC<DeviceCardProps> = ({ device, onClick }) => {
  const statusCfg = STATUS_CONFIG[device.status] || STATUS_CONFIG.offline;
  const TypeIcon = device.type === 'mobile' ? Smartphone : Monitor;

  return (
    <button
      onClick={() => onClick(device)}
      className="text-left rounded-lg border border-border bg-panel p-4 hover:border-primary/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <TypeIcon className="size-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary truncate">{device.name}</div>
            <div className="text-[11px] text-text-tertiary truncate">
              {device.platform || 'Unknown'} · {device.osVersion || '—'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('size-2 rounded-full', statusCfg.dotClass)} />
          <span className={cn('text-[11px] font-medium', statusCfg.textClass)}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-text-secondary">
        <span className="flex items-center gap-1 truncate">
          <Battery className="size-3.5 text-text-tertiary" />
          {device.battery != null ? `${device.battery}%` : '—'}
        </span>
        <span className="flex items-center gap-1 truncate">
          <HardDrive className="size-3.5 text-text-tertiary" />
          {device.storageTotal ? formatBytes(device.storageTotal) : '—'}
        </span>
        <span className="flex items-center gap-1 truncate">
          <MemoryStick className="size-3.5 text-text-tertiary" />
          {device.ramTotal ? formatBytes(device.ramTotal) : '—'}
        </span>
        <span className="flex items-center gap-1 truncate">
          <Cpu className="size-3.5 text-text-tertiary" />
          {device.cpuUsage != null ? `${device.cpuUsage}%` : '—'}
        </span>
      </div>

      <div className="mt-2 text-[11px] text-text-tertiary truncate">
        {device.ipAddress || 'No IP'} · {device.groupName || 'Ungrouped'}
      </div>
    </button>
  );
};

export default DeviceCard;