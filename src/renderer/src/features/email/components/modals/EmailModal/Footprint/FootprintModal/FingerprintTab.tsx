/**
 * ------------------------------------------------------------------
 * FingerprintTab
 * ------------------------------------------------------------------
 * Tab Fingerprint hiển thị danh sách các fingerprint đã sử dụng
 * ------------------------------------------------------------------
 */

import { FingerprintEntry } from '../FootprintTable';
import { Monitor, Cpu, HardDrive } from 'lucide-react';
import { format } from 'date-fns';

interface FingerprintTabProps {
  entries: FingerprintEntry[];
}

function parseFingerprintConfig(json: string | null): Record<string, any> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function parseBrowser(ua: string | undefined): string {
  if (!ua) return 'Unknown';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/')) return 'Safari';
  return 'Unknown';
}

export default function FingerprintTab({ entries }: FingerprintTabProps) {
  // Group entries by fingerprint hash
  const fpGroups = new Map<string, FingerprintEntry[]>();
  entries.forEach((entry) => {
    const hash = entry.fingerprint_hash;
    if (!fpGroups.has(hash)) {
      fpGroups.set(hash, []);
    }
    fpGroups.get(hash)!.push(entry);
  });

  // Convert to array and sort by most recent
  const fpList = Array.from(fpGroups.entries())
    .map(([hash, entries]) => ({
      hash,
      entries,
      lastUsed: entries[0].started_at,
      timesUsed: entries.length,
      config: parseFingerprintConfig(entries[0].fingerprint_config_json),
    }))
    .sort((a, b) => b.lastUsed.localeCompare(a.lastUsed));

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-secondary/60 uppercase tracking-wider">
          Fingerprints ({fpList.length})
        </h3>
        <p className="text-xs text-text-secondary/50 mt-1">
          All browser fingerprints used to access this domain
        </p>
      </div>

      <div className="space-y-4">
        {fpList.map(({ hash, entries, lastUsed, timesUsed, config }) => {
          const isActive = entries.some((e) => !e.ended_at);
          const browser = parseBrowser(config.userAgent);
          const platform = config.platform || 'Unknown';

          return (
            <div
              key={hash}
              className="p-4 rounded-lg border border-border bg-card-background hover:border-primary/30 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Monitor className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-text-primary">
                      {platform} • {browser}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green/10 text-green border border-green/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-green" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-text-secondary/50 truncate">
                    Hash: {hash.slice(0, 16)}...{hash.slice(-8)}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-2.5 rounded-md bg-muted/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-text-secondary/50 uppercase tracking-wider">
                      CPU
                    </span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-text-primary">
                    {config.hardwareConcurrency || '?'} cores
                  </div>
                </div>

                <div className="p-2.5 rounded-md bg-muted/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-text-secondary/50 uppercase tracking-wider">
                      RAM
                    </span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-text-primary">
                    {config.deviceMemory ? `${config.deviceMemory} GB` : '?'}
                  </div>
                </div>

                <div className="p-2.5 rounded-md bg-muted/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Monitor className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-text-secondary/50 uppercase tracking-wider">
                      Screen
                    </span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-text-primary">
                    {config.screenWidth || config.screen?.width || '?'} ×{' '}
                    {config.screenHeight || config.screen?.height || '?'}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-xs">
                {config.webglRenderer && (
                  <div className="flex items-start gap-2">
                    <span className="text-text-secondary/50 w-20 shrink-0">GPU:</span>
                    <span className="font-mono text-text-primary">{config.webglRenderer}</span>
                  </div>
                )}
                {config.languages && (
                  <div className="flex items-start gap-2">
                    <span className="text-text-secondary/50 w-20 shrink-0">Languages:</span>
                    <span className="font-mono text-text-primary">
                      {Array.isArray(config.languages)
                        ? config.languages.join(', ')
                        : config.languages}
                    </span>
                  </div>
                )}
                {config.timezone && (
                  <div className="flex items-start gap-2">
                    <span className="text-text-secondary/50 w-20 shrink-0">Timezone:</span>
                    <span className="font-mono text-text-primary">{config.timezone}</span>
                  </div>
                )}
              </div>

              {/* Usage Stats */}
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-4 text-xs">
                <div>
                  <span className="text-text-secondary/50">Used:</span>{' '}
                  <span className="font-mono font-semibold text-text-primary">
                    {timesUsed} time{timesUsed !== 1 ? 's' : ''}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary/50">Last:</span>{' '}
                  <span className="font-mono text-text-primary">
                    {format(new Date(lastUsed), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              </div>

              {/* Session Timeline */}
              {timesUsed > 1 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="text-[10px] text-text-secondary/50 uppercase tracking-wider mb-2">
                    Sessions with this fingerprint
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entries.slice(0, 10).map((entry) => (
                      <div
                        key={entry.id}
                        className="px-2 py-1 rounded text-[10px] font-mono bg-muted/20 text-text-secondary/70"
                      >
                        {format(new Date(entry.started_at), 'MM/dd HH:mm')}
                      </div>
                    ))}
                    {entries.length > 10 && (
                      <div className="px-2 py-1 text-[10px] text-text-secondary/40">
                        +{entries.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {fpList.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="w-12 h-12 text-text-secondary/20 mx-auto mb-3" />
          <p className="text-sm text-text-secondary/50">No fingerprints recorded</p>
        </div>
      )}
    </div>
  );
}
