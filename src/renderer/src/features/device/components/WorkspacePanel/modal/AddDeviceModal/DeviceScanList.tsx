import { FC } from 'react';
import { Plus, Smartphone, Monitor } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import { ScannedDevice, CONN_LABEL } from './types';

interface DeviceScanListProps {
  devices: ScannedDevice[];
  addedSerials: Set<string>;
  selectedId: string | null;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onQuickAdd: (id: string) => void;
}

const DeviceScanList: FC<DeviceScanListProps> = ({
  devices,
  addedSerials,
  selectedId,
  checkedIds,
  onSelect,
  onToggleCheck,
  onQuickAdd,
}) => {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
      {devices.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-tertiary text-xs">
          <Smartphone className="size-8 opacity-40" />
          <div>
            No matching devices found.
            <br />
            Try changing filters or rescan.
          </div>
        </div>
      ) : (
        devices.map((d) => {
          const isAdded = addedSerials.has(d.serial);
          const isSelected = selectedId === d.id;
          const isChecked = checkedIds.has(d.id);
          const DeviceIcon = d.deviceType === 'desktop' ? Monitor : Smartphone;
          return (
            <div
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={cn(
                'flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors',
                isSelected
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border bg-input-background hover:border-primary/30',
              )}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAdded) onToggleCheck(d.id);
                }}
                className={cn(
                  'size-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors',
                  isChecked ? 'bg-primary border-primary' : 'border-border bg-background',
                  isAdded && 'opacity-30 cursor-default',
                )}
              >
                {isChecked && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              <div className="size-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-secondary shrink-0">
                <DeviceIcon className="size-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{d.model}</div>
                <div className="text-[10.5px] font-mono text-text-tertiary mt-0.5 truncate">
                  {d.serial}
                </div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <span
                    className={cn(
                      'text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wide',
                      isAdded ? 'bg-white/5 text-text-tertiary' : 'bg-primary/15 text-primary',
                    )}
                  >
                    {isAdded ? 'Added' : 'New'}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wide',
                      d.connectionType === 'usb' && 'bg-blue/15 text-blue',
                      d.connectionType === 'lan' && 'bg-success/15 text-success',
                      d.connectionType === 'emulator' && 'bg-purple/15 text-purple',
                    )}
                  >
                    {CONN_LABEL[d.connectionType]}
                  </span>
                </div>
              </div>

              {!isAdded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAdd(d.id);
                  }}
                  className="size-6 rounded-md bg-background border border-border text-text-secondary hover:text-primary hover:border-primary/50 flex items-center justify-center shrink-0 transition-colors"
                  title="Quick add to Fleet"
                >
                  <Plus className="size-3.5" />
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default DeviceScanList;
