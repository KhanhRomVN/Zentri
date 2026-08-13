import { useEffect, useState } from 'react';
import { X, Copy } from 'lucide-react';
import { Proxy } from '../../../types/db';
import { deriveDisplayStatus, DISPLAY_STATUS_CONFIG } from '../constants';
import { toast } from 'sonner';

interface ProxyDrawerProps {
  isOpen: boolean;
  proxy: Proxy | null;
  onClose: () => void;
}

interface HealthRecord {
  id: string;
  proxyId: string;
  timestamp: string;
  isHealthy: boolean;
  latency: number | null;
}

export default function ProxyDrawer({ isOpen, proxy, onClose }: ProxyDrawerProps) {
  const [healthHistory, setHealthHistory] = useState<HealthRecord[]>([]);

  useEffect(() => {
    if (isOpen && proxy) {
      // @ts-ignore
      window.electron.ipcRenderer
        .invoke('proxy:get-health-history', proxy.id)
        .then((data: any[]) => setHealthHistory(data || []))
        .catch(() => setHealthHistory([]));
    }
  }, [isOpen, proxy?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!proxy) return null;

  const ds = deriveDisplayStatus(proxy);
  const dsCfg = DISPLAY_STATUS_CONFIG[ds];

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success('Copied');
  };

  // Sparkline from health history (last 24 records, reversed to chronological)
  const pulseData = [...healthHistory].reverse().map((r) => r.latency ?? 0);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[420px] bg-background border-l border-border z-50 transition-transform duration-200 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-4 border-b border-border shrink-0">
          <div>
            <div className="font-mono text-base font-semibold text-text-primary">
              {proxy.host}:{proxy.port}
            </div>
            <div className="text-[11.5px] text-text-secondary/60 mt-1">
              <span className={dsCfg.textClass}>●</span> {dsCfg.label} · {proxy.protocol?.toUpperCase()} ·{' '}
              {proxy.last_seen_min != null ? `updated ${proxy.last_seen_min}m ago` : 'not yet checked'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-md border border-border bg-card-background text-text-secondary hover:text-text-primary shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Latency Chart */}
          <div>
            <h4 className="text-[11px] uppercase tracking-wider text-text-secondary/60 font-bold mb-2.5">
              Latency History (last 24 checks)
            </h4>
            <div className="bg-card-background border border-border rounded-lg p-3">
              <svg width="100%" height="70" viewBox="0 0 380 70">
                {pulseData.length > 0 ? (
                  <>
                    <polyline
                      points={pulseData
                        .map(
                          (v, i) =>
                            `${(i / Math.max(pulseData.length - 1, 1)) * 380},${70 - (v / 100) * 70}`,
                        )
                        .join(' ')}
                      fill="none"
                      stroke="rgb(var(--teal))"
                      strokeWidth="2"
                    />
                    <polygon
                      points={`${pulseData
                        .map(
                          (v, i) =>
                            `${(i / Math.max(pulseData.length - 1, 1)) * 380},${70 - (v / 100) * 70}`,
                        )
                        .join(' ')} 380,70 0,70`}
                      fill="rgb(var(--teal) / 0.12)"
                    />
                  </>
                ) : (
                  <text x="190" y="38" textAnchor="middle" className="text-[11px] fill-text-secondary/40">
                    No data yet
                  </text>
                )}
              </svg>
            </div>
          </div>

          {/* Connection Info */}
          <div>
            <h4 className="text-[11px] uppercase tracking-wider text-text-secondary/60 font-bold mb-2.5">
              Connection Info
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Host" value={proxy.host || '—'} copyable onCopy={() => copyToClipboard(proxy.host || '')} />
              <Field label="Port" value={proxy.port?.toString() || '—'} />
              <Field label="Username" value={proxy.username || '—'} />
              <Field label="Password" value="••••••••" />
              <Field label="Protocol" value={proxy.protocol?.toUpperCase() || '—'} />
              <Field label="Type" value={proxy.proxy_type === 'private' ? 'Private' : 'Shared'} />
            </div>
          </div>

          {/* Infrastructure */}
          <div>
            <h4 className="text-[11px] uppercase tracking-wider text-text-secondary/60 font-bold mb-2.5">
              Infrastructure
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="ISP" value={proxy.isp || '—'} />
              <Field
                label="Location"
                value={[proxy.city, proxy.country].filter(Boolean).join(', ') || '—'}
              />
              <Field label="Source" value={proxy.source_type || '—'} />
              <Field
                label="Quota"
                value={
                  proxy.quota_total === '∞' || !proxy.quota_total
                    ? 'Unlimited'
                    : `${proxy.quota_used ?? 0} / ${proxy.quota_total} GB`
                }
              />
            </div>
          </div>

          {/* Sticky Sessions */}
          <div>
            <h4 className="text-[11px] uppercase tracking-wider text-text-secondary/60 font-bold mb-2.5">
              Sticky Sessions ({healthHistory.length})
            </h4>
            {healthHistory.length === 0 ? (
              <div className="text-xs text-text-secondary/60">No sessions bound to this IP.</div>
            ) : (
              <div className="space-y-2">
                {healthHistory.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-xs">
                    <div className="size-6 rounded-full bg-card-background border border-border flex items-center justify-center text-[10px] font-bold text-teal shrink-0">
                      {h.proxyId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">Session #{h.id.slice(0, 8)}</div>
                      <div className="text-[10.5px] text-text-secondary/60">
                        {h.isHealthy ? '✅ healthy' : '❌ failed'} · {h.latency ?? '—'}ms
                      </div>
                    </div>
                    <span className="text-[10.5px] font-mono text-text-secondary/60">
                      {new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  copyable,
  onCopy,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="bg-card-background border border-border rounded-lg px-2.5 py-2">
      <label className="block text-[10px] text-text-secondary/60 uppercase tracking-wider mb-0.5">{label}</label>
      <div className="font-mono text-[12.5px] text-text-primary flex items-center gap-1.5 break-all">
        {value}
        {copyable && (
          <button onClick={onCopy} className="text-text-secondary/40 hover:text-text-secondary">
            <Copy className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}