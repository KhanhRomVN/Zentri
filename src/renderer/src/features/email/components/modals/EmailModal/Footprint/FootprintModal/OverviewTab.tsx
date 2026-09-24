/**
 * ------------------------------------------------------------------
 * OverviewTab
 * ------------------------------------------------------------------
 * Tab Overview hiển thị thống kê tổng quan và timeline sessions
 * ------------------------------------------------------------------
 */

import { FingerprintEntry } from '../FootprintTable';
import { Shield, Globe, MapPin, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../../../../../shared/lib/utils';

interface OverviewTabProps {
  domain: string;
  entries: FingerprintEntry[];
  onDeleteSession?: (id: string) => void | Promise<void>;
}

function parseFingerprintConfig(json: string | null): Record<string, any> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
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

export default function OverviewTab({ domain, entries, onDeleteSession }: OverviewTabProps) {
  // Tính toán thống kê
  const totalSessions = entries.length;
  const uniqueIPs = new Set(entries.map((e) => e.public_ip)).size;
  const uniqueFingerprints = new Set(entries.map((e) => e.fingerprint_hash)).size;
  const activeSessions = entries.filter((e) => !e.ended_at).length;

  const stats = [
    { label: 'Total', value: totalSessions, icon: Globe },
    { label: 'Active', value: activeSessions, icon: Shield },
    { label: 'IPs', value: uniqueIPs, icon: MapPin },
    { label: 'Fingerprints', value: uniqueFingerprints, icon: Monitor },
  ];

  // Lấy session gần nhất
  const latestEntry = entries[0];
  const latestConfig = parseFingerprintConfig(latestEntry?.fingerprint_config_json);
  const latestIpInfo = parseIpInfo(latestEntry?.ip_info_json);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="relative px-4 py-3 rounded-lg border border-border bg-card-background hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-secondary/60 uppercase tracking-wider">
                  {stat.label}
                </span>
                <Icon className="w-4 h-4 text-text-secondary/40" />
              </div>
              <div className="text-2xl font-bold font-mono text-text-primary">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Latest Session Info */}
      {latestEntry && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary/60 uppercase tracking-wider">
            Latest Session
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Location */}
            <div className="p-4 rounded-lg border border-border bg-card-background">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-text-secondary/60 uppercase tracking-wider">
                  Location
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-lg font-semibold text-text-primary">
                    {countryCodeToFlag(latestIpInfo.countryCode)} {latestIpInfo.city || 'Unknown'},{' '}
                    {latestIpInfo.country || 'Unknown'}
                  </div>
                  <div className="text-xs text-text-secondary/60 mt-1">
                    {latestIpInfo.isp || 'Unknown ISP'}
                  </div>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <div className="text-[10px] text-text-secondary/50 uppercase tracking-wider mb-1">
                    IP Address
                  </div>
                  <div className="font-mono text-sm text-text-primary">{latestEntry.public_ip}</div>
                </div>
              </div>
            </div>

            {/* Device */}
            <div className="p-4 rounded-lg border border-border bg-card-background">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-text-secondary/60 uppercase tracking-wider">
                  Device
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-lg font-semibold text-text-primary">
                    {latestConfig.platform || 'Unknown'} •{' '}
                    {latestConfig.userAgent?.includes('Chrome')
                      ? 'Chrome'
                      : latestConfig.userAgent?.includes('Firefox')
                        ? 'Firefox'
                        : latestConfig.userAgent?.includes('Safari')
                          ? 'Safari'
                          : 'Unknown'}
                  </div>
                  <div className="text-xs text-text-secondary/60 mt-1">
                    {latestConfig.hardwareConcurrency || '?'} cores
                    {latestConfig.deviceMemory ? ` • ${latestConfig.deviceMemory}GB RAM` : ''}
                  </div>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <div className="text-[10px] text-text-secondary/50 uppercase tracking-wider mb-1">
                    Screen
                  </div>
                  <div className="font-mono text-sm text-text-primary">
                    {latestConfig.screenWidth || latestConfig.screen?.width || '?'} ×{' '}
                    {latestConfig.screenHeight || latestConfig.screen?.height || '?'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary/60 uppercase tracking-wider">
          Recent Sessions
        </h3>
        <div className="space-y-2">
          {entries.slice(0, 5).map((entry) => {
            const config = parseFingerprintConfig(entry.fingerprint_config_json);
            const ipInfo = parseIpInfo(entry.ip_info_json);
            const isActive = !entry.ended_at;

            return (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border bg-card-background',
                  isActive ? 'border-green/30 bg-green/5' : 'border-border',
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    isActive ? 'bg-green' : 'bg-text-secondary/30',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-text-primary">
                      {format(new Date(entry.started_at), 'MMM dd, HH:mm:ss')}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-semibold text-green uppercase">Active</span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-secondary/60 mt-0.5">
                    {countryCodeToFlag(ipInfo.countryCode)} {ipInfo.city || 'Unknown'} •{' '}
                    {config.platform || 'Unknown'}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-text-secondary/50">
                  {entry.public_ip}
                </div>
              </div>
            );
          })}
        </div>
        {entries.length > 5 && (
          <div className="text-center text-xs text-text-secondary/50 pt-2">
            +{entries.length - 5} more sessions
          </div>
        )}
      </div>
    </div>
  );
}
