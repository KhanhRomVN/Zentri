import { FC } from 'react';
import { Smartphone, Monitor, MoreHorizontal } from 'lucide-react';
import { Device } from '../../types';
import { STATUS_CONFIG } from '../../constants';
import { formatBytes, formatUptime } from '../../utils';
import { cn } from '../../../../shared/lib/utils';

interface DeviceTableProps {
  devices: Device[];
  onRowClick: (device: Device) => void;
}

const DeviceTable: FC<DeviceTableProps> = ({ devices, onRowClick }) => {
  if (devices.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-tertiary">
        No devices found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-panel/50 text-left text-[11px] uppercase tracking-wider text-text-tertiary">
            <th className="px-3 py-2.5">Name</th>
            <th className="px-3 py-2.5">Type</th>
            <th className="px-3 py-2.5">Platform</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">IP Address</th>
            <th className="px-3 py-2.5">Battery</th>
            <th className="px-3 py-2.5">Storage</th>
            <th className="px-3 py-2.5">RAM</th>
            <th className="px-3 py-2.5">CPU</th>
            <th className="px-3 py-2.5">Last Seen</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => {
            const statusCfg = STATUS_CONFIG[device.status] || STATUS_CONFIG.offline;
            const TypeIcon = device.type === 'mobile' ? Smartphone : Monitor;
            return (
              <tr
                key={device.id}
                onClick={() => onRowClick(device)}
                className="border-b border-border/50 last:border-0 hover:bg-sidebar-item-hover cursor-pointer transition-colors"
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="size-4 text-primary" />
                    <span className="font-medium text-text-primary">{device.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-text-secondary">
                  {device.type === 'mobile' ? 'Mobile' : 'Desktop'}
                  {device.isVirtual ? ' · Virtual' : ' · Physical'}
                </td>
                <td className="px-3 py-2.5 text-text-secondary">
                  {device.platform || '—'} {device.osVersion ? `(${device.osVersion})` : ''}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('size-2 rounded-full', statusCfg.dotClass)} />
                    <span className={cn('text-[12px] font-medium', statusCfg.textClass)}>
                      {statusCfg.label}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-text-secondary">{device.ipAddress || '—'}</td>
                <td className="px-3 py-2.5 text-text-secondary">
                  {device.battery != null ? `${device.battery}%` : '—'}
                </td>
                <td className="px-3 py-2.5 text-text-secondary">
                  {formatBytes(device.storageTotal)}
                </td>
                <td className="px-3 py-2.5 text-text-secondary">{formatBytes(device.ramTotal)}</td>
                <td className="px-3 py-2.5 text-text-secondary">
                  {device.cpuUsage != null ? `${device.cpuUsage}%` : '—'}
                </td>
                <td className="px-3 py-2.5 text-text-secondary">
                  {formatUptime(device.lastSeenAt)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button className="text-text-tertiary hover:text-text-primary">
                    <MoreHorizontal className="size-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceTable;