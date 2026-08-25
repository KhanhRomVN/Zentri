import { FC, useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { cn } from '../../../../../shared/lib/utils';
import { ScannedDevice, DetailTab, CONN_LABEL, PRESET_TAGS } from './types';

interface DeviceDetailPanelProps {
  device: ScannedDevice | null;
  isAdded: boolean;
  onAdd: (data: { name: string; group: string; tags: string[]; notes: string }) => void;
}

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'network', label: 'Network & Proxy' },
  { id: 'apps', label: 'Apps' },
  { id: 'security', label: 'Security' },
];

const GROUPS = ['Uncategorized', 'Farm A', 'Farm B', 'QA Lab', 'Livestream', 'Warm-up'];

const DeviceDetailPanel: FC<DeviceDetailPanelProps> = ({ device, isAdded, onAdd }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [name, setName] = useState('');
  const [group, setGroup] = useState(GROUPS[0]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  if (!device) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-text-tertiary py-12">
        <Smartphone className="size-9 opacity-35" />
        <h4 className="text-text-secondary font-display text-sm font-semibold">No device selected</h4>
        <p className="text-xs max-w-[240px] text-center">
          Select a device from the list on the left to view full information and add it to Fleet.
        </p>
      </div>
    );
  }

  const DeviceIcon = device.deviceType === 'desktop' ? Monitor : Smartphone;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border">
        <div className="size-9 rounded-lg bg-input-background border border-border flex items-center justify-center text-text-secondary shrink-0">
          <DeviceIcon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[15px] truncate">{name || device.model}</div>
          <div className="font-mono text-[10.5px] text-text-tertiary mt-0.5 truncate">
            {device.model} · {CONN_LABEL[device.connectionType]}
          </div>
        </div>
        <span
          className={cn(
            'text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide shrink-0',
            isAdded ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary',
          )}
        >
          {isAdded ? 'Already in Fleet' : 'Not added'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 px-3.5 border-b border-border overflow-x-auto shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-2.5 text-xs whitespace-nowrap font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary text-text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3.5">
        {activeTab === 'overview' ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3.5">
              <InfoCell k="Model" v={device.model} />
              <InfoCell k="Serial" v={device.serial} />
              <InfoCell k="Connection type" v={CONN_LABEL[device.connectionType]} />
              <InfoCell k="ADB state" v={device.adbState} />
            </div>
            <div className="text-[10.5px] text-text-tertiary uppercase tracking-wide font-semibold mb-2">
              Additional information
            </div>
            <p className="text-xs text-text-tertiary">
              Detailed information (OS, resolution, battery...) will be collected after the device is
              added to Fleet.
            </p>
          </>
        ) : (
          <div className="text-center py-8 text-text-tertiary text-xs">
            Detailed information will be collected after the device is added to Fleet.
          </div>
        )}
      </div>

      {/* Assignment */}
      {!isAdded && (
        <div className="border-t border-border p-3.5 shrink-0 bg-card-background">
          <div className="text-[10.5px] text-text-tertiary uppercase tracking-wide font-semibold mb-2.5">
            Assign to Fleet
          </div>
          <div className="space-y-1.5 mb-2.5">
            <label className="text-[11px] text-text-secondary font-medium">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={device.model}
              className="w-full h-8 px-2.5 rounded-md bg-input-background border border-border text-xs text-text-primary outline-none focus:border-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <div className="space-y-1.5">
              <label className="text-[11px] text-text-secondary font-medium">Group</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full h-8 px-2 rounded-md bg-input-background border border-border text-xs text-text-primary outline-none"
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-text-secondary font-medium">Tags</label>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'text-[11px] px-2 py-1 rounded-md border transition-colors',
                      selectedTags.has(tag)
                        ? 'border-primary/50 text-primary bg-primary/10'
                        : 'border-border bg-input-background text-text-secondary hover:text-text-primary',
                    )}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5 mb-3">
            <label className="text-[11px] text-text-secondary font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. used for warming up new accounts..."
              className="w-full px-2.5 py-2 rounded-md bg-input-background border border-border text-xs text-text-primary outline-none focus:border-primary/50 resize-none"
            />
          </div>
          <button
            onClick={() => onAdd({ name: name.trim() || device.model, group, tags: Array.from(selectedTags), notes })}
            className="w-full h-8 rounded-md bg-button-solid-background text-button-solid-text text-xs font-semibold hover:bg-button-solid-background/90"
          >
            Add to Fleet
          </button>
        </div>
      )}
    </div>
  );
};

function InfoCell({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-input-background border border-border rounded-lg p-2.5">
      <div className="text-[9.5px] text-text-tertiary uppercase tracking-wide mb-1">{k}</div>
      <div className="font-mono text-xs font-medium truncate">{v}</div>
    </div>
  );
}

export default DeviceDetailPanel;