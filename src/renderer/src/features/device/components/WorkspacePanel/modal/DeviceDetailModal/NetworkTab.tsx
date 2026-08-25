import { FC } from 'react';
import { Globe, Network } from 'lucide-react';
import { Device } from '../../../../types';

interface NetworkTabProps {
  device: Device;
}

const NetworkTab: FC<NetworkTabProps> = ({ device }) => {
  const rows = [
    { icon: Globe, label: 'IP Address', value: device.ipAddress || '—' },
    { icon: Network, label: 'MAC Address', value: device.macAddress || '—' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center gap-2.5 rounded-md border border-border bg-panel/50 p-3"
        >
          <row.icon className="size-4 text-text-tertiary shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] text-text-tertiary">{row.label}</div>
            <div className="text-[13px] font-medium text-text-primary">{row.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NetworkTab;
