import { useEffect, useState } from 'react';
import { Shield, Globe, Clock, Wifi, Hash, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface FingerprintEntry {
  domain: string;
  fingerprint_hash: string;
  fingerprint_config_json: string | null;
  public_ip: string;
  ip_info_json: string | null;
  started_at: string;
  ended_at: string | null;
}

interface FingerprintTabProps {
  email: string;
}

function ConfigPreview({ json }: { json: string | null }) {
  const [show, setShow] = useState(false);
  if (!json) return <span className="text-xs text-muted-foreground italic">no config</span>;

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
      >
        <Eye className="w-3 h-3" />
        View config ({Math.round(json.length / 1024)}KB)
      </button>
    );
  }

  let parsed: any = null;
  try { parsed = JSON.parse(json); } catch { /* raw string */ }

  return (
    <div>
      <button
        onClick={() => setShow(false)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1 transition-colors"
      >
        <EyeOff className="w-3 h-3" />
        Hide config
      </button>
      <pre className="text-[10px] font-mono bg-muted/30 rounded-lg p-2 max-h-48 overflow-auto whitespace-pre-wrap break-all">
        {parsed ? JSON.stringify(parsed, null, 2) : json}
      </pre>
    </div>
  );
}

export default function FingerprintTab({ email }: FingerprintTabProps) {
  const [entries, setEntries] = useState<FingerprintEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    window.electron.ipcRenderer
      .invoke('email:get-fingerprint-history', { email })
      .then((res: any) => {
        if (res?.success) setEntries(res.entries || []);
      })
      .finally(() => setLoading(false));
  }, [email]);

  // Group by domain
  const grouped = new Map<string, FingerprintEntry[]>();
  for (const e of entries) {
    const list = grouped.get(e.domain) || [];
    list.push(e);
    grouped.set(e.domain, list);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading fingerprint history...
      </div>
    );
  }

  if (grouped.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Shield className="w-10 h-10 opacity-30" />
        <p className="text-sm">No fingerprint history yet</p>
        <p className="text-xs opacity-60">
          Data will appear when you browse websites with a fingerprint profile.
        </p>
      </div>
    );
  }

  const domains = Array.from(grouped.entries());

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-2">
      {domains.map(([domain, domainEntries]) => {
        const isExpanded = expandedDomain === domain;
        const active = domainEntries.find((e) => !e.ended_at);
        const past = domainEntries.filter((e) => e.ended_at);

        return (
          <div key={domain} className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
            {/* Domain header */}
            <button
              onClick={() => setExpandedDomain(isExpanded ? null : domain)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
            >
              <ChevronRight
                className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
              <Globe className="w-4 h-4 text-primary/70" />
              <span className="font-semibold text-sm flex-1">{domain}</span>
              <span className="text-xs text-muted-foreground">
                {domainEntries.length} record{domainEntries.length > 1 ? 's' : ''}
              </span>
            </button>

            {/* Active entry (always visible) */}
            {active && (
              <div className="px-4 pb-3 border-t border-border/20 pt-2">
                <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active now
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Hash className="w-3 h-3 shrink-0" />
                    <span className="font-mono text-[11px] truncate" title={active.fingerprint_hash}>
                      {active.fingerprint_hash}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Wifi className="w-3 h-3 shrink-0" />
                    <span className="font-mono text-[11px]">{active.public_ip}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>Since {format(new Date(active.started_at), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <ConfigPreview json={active.fingerprint_config_json} />
                </div>
              </div>
            )}

            {/* Past entries (expandable) */}
            {isExpanded && past.length > 0 && (
              <div className="border-t border-border/20">
                {past.map((entry, i) => (
                  <div
                    key={i}
                    className="px-4 py-2.5 border-b border-border/10 last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs text-amber-500 font-medium mb-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      {entry.started_at && entry.ended_at
                        ? `${format(new Date(entry.started_at), 'MMM d, HH:mm')} → ${format(new Date(entry.ended_at), 'MMM d, HH:mm')}`
                        : 'Past session'}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs mb-1.5">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Hash className="w-3 h-3 shrink-0" />
                        <span className="font-mono text-[11px] truncate" title={entry.fingerprint_hash}>
                          {entry.fingerprint_hash}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Wifi className="w-3 h-3 shrink-0" />
                        <span className="font-mono text-[11px]">{entry.public_ip}</span>
                      </div>
                    </div>
                    <ConfigPreview json={entry.fingerprint_config_json} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}