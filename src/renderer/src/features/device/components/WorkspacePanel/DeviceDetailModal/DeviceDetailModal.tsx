import { FC, useState } from 'react';
import { X } from 'lucide-react';
import { Device } from '../../../types';
import OverviewTab from './OverviewTab';
import { cn } from '../../../../../shared/lib/utils';
import NetworkTab from './NetworkTab';

interface DeviceDetailModalProps {
  device: Device | null;
  onClose: () => void;
}

type TabId = 'overview' | 'network';

const DeviceDetailModal: FC<DeviceDetailModalProps> = ({ device, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  if (!device) return null;

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'network', label: 'Network' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-panel shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-[16px] font-semibold text-text-primary">
            {device.name}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-2 text-[13px] font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {activeTab === 'overview' && <OverviewTab device={device} />}
          {activeTab === 'network' && <NetworkTab device={device} />}
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailModal;
