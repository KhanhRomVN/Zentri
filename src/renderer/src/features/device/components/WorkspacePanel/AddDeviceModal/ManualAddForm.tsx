import { FC, useState } from 'react';
import { Smartphone, Monitor, Zap } from 'lucide-react';
import { cn } from '../../../../../shared/lib/utils';
import { PRESET_TAGS } from './types';

interface ManualAddFormProps {
  onAdd: (data: {
    name: string;
    address: string;
    group: string;
    tags: string[];
    notes: string;
    deviceType: string;
  }) => void;
}

const GROUPS = ['Uncategorized', 'Farm A', 'Farm B', 'QA Lab', 'Livestream', 'Warm-up'];

const TYPE_OPTIONS = [
  { id: 'mobile-real', label: 'Real mobile', icon: Smartphone },
  { id: 'mobile-virtual', label: 'Virtual mobile', icon: Smartphone },
  { id: 'desktop-real', label: 'Real desktop', icon: Monitor },
  { id: 'desktop-virtual', label: 'Desktop VM', icon: Monitor },
];

const ManualAddForm: FC<ManualAddFormProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [group, setGroup] = useState(GROUPS[0]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [deviceType, setDeviceType] = useState('mobile-real');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    if (!address.trim()) {
      setTestResult('Please enter a connection address before testing');
      return;
    }
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 900));
    setTesting(false);
    const ok = Math.random() < 0.75;
    setTestResult(
      ok ? `Connection successful · ${15 + Math.floor(Math.random() * 75)}ms` : 'Cannot connect to this address',
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!address.trim()) return;
    onAdd({
      name: name.trim() || `NODE-${Date.now().toString().slice(-4)}`,
      address: address.trim(),
      group,
      tags: Array.from(selectedTags),
      notes: notes.trim(),
      deviceType,
    });
  };

  return (
    <div className="w-full max-w-[460px] mx-auto py-1 space-y-4">
      {/* Type picker */}
      <div className="grid grid-cols-4 gap-1.5">
        {TYPE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isVirtual = opt.id.endsWith('virtual');
          return (
            <button
              key={opt.id}
              onClick={() => setDeviceType(opt.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border text-[10.5px] font-medium transition-colors',
                deviceType === opt.id
                  ? 'border-primary/50 text-primary bg-primary/10'
                  : 'border-border bg-input-background text-text-secondary hover:text-text-primary',
              )}
            >
              <Icon className={cn('size-4', isVirtual && 'opacity-70')} strokeWidth={isVirtual ? 1.5 : 2} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Name + Address */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1.5">
          <label className="text-[11px] text-text-secondary font-medium">Device name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. PIXEL-07"
            className="w-full h-8 px-2.5 rounded-md bg-input-background border border-border text-xs text-text-primary outline-none focus:border-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-text-secondary font-medium">
            Connection address (IP:Port / ADB serial)
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="192.168.1.42:5555"
            className="w-full h-8 px-2.5 rounded-md bg-input-background border border-border text-xs text-text-primary outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Test connection */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-input-background border border-border text-xs font-semibold text-text-primary hover:bg-card-hover disabled:opacity-60"
        >
          <Zap className={cn('size-3.5', testing && 'animate-pulse')} />
          {testing ? 'Testing...' : 'Test connection'}
        </button>
        {testResult && (
          <span
            className={cn(
              'text-xs font-mono',
              testResult.startsWith('Connection') ? 'text-success' : 'text-error',
            )}
          >
            {testResult}
          </span>
        )}
      </div>

      {/* Group + Tags */}
      <div className="grid grid-cols-2 gap-2.5">
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

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-text-secondary font-medium">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. backup machine for Farm A..."
          className="w-full px-2.5 py-2 rounded-md bg-input-background border border-border text-xs text-text-primary outline-none focus:border-primary/50 resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={handleSubmit}
          className="flex items-center gap-1.5 h-8 px-4 rounded-md bg-button-solid-background text-button-solid-text text-xs font-semibold hover:bg-button-solid-background/90"
        >
          Add to Fleet
        </button>
      </div>
    </div>
  );
};

export default ManualAddForm;