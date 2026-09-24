/**
 * ------------------------------------------------------------------
 * IPAddressTab
 * ------------------------------------------------------------------
 * Tab IP Address hiển thị danh sách các IP đã sử dụng
 * ------------------------------------------------------------------
 */

import { FingerprintEntry } from '../FootprintTable';
import { MapPin, Globe } from 'lucide-react';
import { format } from 'date-fns';

interface IPAddressTabProps {
  entries: FingerprintEntry[];
}

function parseIpInfo(json: string | null): Record<string, any> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function countryCodeToFlag(code: string | undefined): string {
  if (!code) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

export default function IPAddressTab({ entries }: IPAddressTabProps) {
  // Group entries by IP
  const ipGroups = new Map<string, FingerprintEntry[]>();
  entries.forEach((entry) => {
    const ip = entry.public_ip;
    if (!ipGroups.has(ip)) {
      ipGroups.set(ip, []);
    }
    ipGroups.get(ip)!.push(entry);
  });

  // Convert to array and sort by most recent
  const ipList = Array.from(ipGroups.entries())
    .map(([ip, entries]) => ({
      ip,
      entries,
      lastUsed: entries[0].started_at,
      timesUsed: entries.length,
      ipInfo: parseIpInfo(entries[0].ip_info_json),
    }))
    .sort((a, b) => b.lastUsed.localeCompare(a.lastUsed));

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-secondary/60 uppercase tracking-wider">
          IP Addresses ({ipList.length})
        </h3>
        <p className="text-xs text-text-secondary/50 mt-1">
          All IP addresses used to access this domain
        </p>
      </div>

      <div className="space-y-3">
        {ipList.map(({ ip, entries, lastUsed, timesUsed, ipInfo }) => {
          const isActive = entries.some((e) => !e.ended_at);

          return (
            <div
              key={ip}
              className="p-4 rounded-lg border border-border bg-card-background hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* IP Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-base font-bold text-text-primary">{ip}</span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green/10 text-green border border-green/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-green" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-sm text-text-primary mb-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="font-semibold">
                          {countryCodeToFlag(ipInfo.countryCode)} {ipInfo.city || 'Unknown'},{' '}
                          {ipInfo.country || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary/60 pl-5">
                        {ipInfo.isp || 'Unknown ISP'}
                        {ipInfo.as && (
                          <span className="ml-2 text-text-secondary/40">({ipInfo.as})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs">
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
                </div>

                {/* Additional Info */}
                <div className="shrink-0 text-right">
                  <div className="inline-flex flex-col items-end gap-1.5">
                    {ipInfo.timezone && (
                      <div className="text-[10px] text-text-secondary/50">
                        <Globe className="inline w-3 h-3 mr-1" />
                        {ipInfo.timezone}
                      </div>
                    )}
                    {ipInfo.lat && ipInfo.lon && (
                      <div className="text-[10px] font-mono text-text-secondary/40">
                        {ipInfo.lat}, {ipInfo.lon}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Session Timeline for this IP */}
              {timesUsed > 1 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="text-[10px] text-text-secondary/50 uppercase tracking-wider mb-2">
                    Sessions with this IP
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

      {ipList.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-text-secondary/20 mx-auto mb-3" />
          <p className="text-sm text-text-secondary/50">No IP addresses recorded</p>
        </div>
      )}
    </div>
  );
}
