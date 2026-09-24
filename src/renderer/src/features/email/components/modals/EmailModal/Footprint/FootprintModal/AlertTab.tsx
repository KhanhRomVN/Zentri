/**
 * ------------------------------------------------------------------
 * AlertTab
 * ------------------------------------------------------------------
 * Tab Alert hiển thị các cảnh báo và vấn đề bảo mật
 * ------------------------------------------------------------------
 */

import { FingerprintEntry } from '../FootprintTable';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../../../../../shared/lib/utils';

interface AlertTabProps {
  domain: string;
  entries: FingerprintEntry[];
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  relatedEntries?: FingerprintEntry[];
}

function parseIpInfo(json: string | null): Record<string, any> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function parseFingerprintConfig(json: string | null): Record<string, any> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function generateAlerts(entries: FingerprintEntry[]): Alert[] {
  const alerts: Alert[] = [];

  // Check for multiple IPs
  const uniqueIPs = new Set(entries.map((e) => e.public_ip));
  if (uniqueIPs.size > 3) {
    alerts.push({
      id: 'multiple-ips',
      type: 'warning',
      title: 'Multiple IP Addresses Detected',
      description: `This domain has been accessed from ${uniqueIPs.size} different IP addresses. This may indicate account sharing or security concerns.`,
      timestamp: new Date(entries[0].started_at),
      relatedEntries: entries.slice(0, 3),
    });
  }

  // Check for multiple fingerprints
  const uniqueFingerprints = new Set(entries.map((e) => e.fingerprint_hash));
  if (uniqueFingerprints.size > 2) {
    alerts.push({
      id: 'multiple-fingerprints',
      type: 'warning',
      title: 'Multiple Fingerprints Detected',
      description: `This domain has been accessed with ${uniqueFingerprints.size} different browser fingerprints. This is unusual and may indicate suspicious activity.`,
      timestamp: new Date(entries[0].started_at),
      relatedEntries: entries.slice(0, 3),
    });
  }

  // Check for location changes
  const locations = entries
    .map((e) => {
      const ipInfo = parseIpInfo(e.ip_info_json);
      return ipInfo.country;
    })
    .filter(Boolean);
  const uniqueCountries = new Set(locations);
  if (uniqueCountries.size > 1) {
    alerts.push({
      id: 'location-change',
      type: 'info',
      title: 'Multiple Locations Detected',
      description: `Access from ${uniqueCountries.size} different countries: ${Array.from(uniqueCountries).join(', ')}.`,
      timestamp: new Date(entries[0].started_at),
    });
  }

  // Check for rapid succession logins
  if (entries.length >= 2) {
    const firstTwo = entries.slice(0, 2);
    const timeDiff =
      new Date(firstTwo[0].started_at).getTime() - new Date(firstTwo[1].started_at).getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff < 5 && minutesDiff >= 0) {
      alerts.push({
        id: 'rapid-login',
        type: 'critical',
        title: 'Rapid Login Activity',
        description: `Two login sessions started within ${minutesDiff} minute(s). This could indicate automated access or credential compromise.`,
        timestamp: new Date(entries[0].started_at),
        relatedEntries: firstTwo,
      });
    }
  }

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export default function AlertTab({ domain, entries }: AlertTabProps) {
  const alerts = generateAlerts(entries);

  const criticalCount = alerts.filter((a) => a.type === 'critical').length;
  const warningCount = alerts.filter((a) => a.type === 'warning').length;
  const infoCount = alerts.filter((a) => a.type === 'info').length;

  return (
    <div className="p-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div
          className={cn(
            'p-4 rounded-lg border-2',
            criticalCount > 0 ? 'border-red/30 bg-red/5' : 'border-border bg-card-background',
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle
              className={cn('w-4 h-4', criticalCount > 0 ? 'text-red' : 'text-text-secondary/40')}
            />
            <span className="text-xs font-semibold text-text-secondary/60 uppercase tracking-wider">
              Critical
            </span>
          </div>
          <div
            className={cn(
              'text-2xl font-bold font-mono',
              criticalCount > 0 ? 'text-red' : 'text-text-primary',
            )}
          >
            {criticalCount}
          </div>
        </div>

        <div
          className={cn(
            'p-4 rounded-lg border-2',
            warningCount > 0 ? 'border-warn/30 bg-warn/5' : 'border-border bg-card-background',
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle
              className={cn('w-4 h-4', warningCount > 0 ? 'text-warn' : 'text-text-secondary/40')}
            />
            <span className="text-xs font-semibold text-text-secondary/60 uppercase tracking-wider">
              Warning
            </span>
          </div>
          <div
            className={cn(
              'text-2xl font-bold font-mono',
              warningCount > 0 ? 'text-warn' : 'text-text-primary',
            )}
          >
            {warningCount}
          </div>
        </div>

        <div
          className={cn(
            'p-4 rounded-lg border-2',
            infoCount > 0 ? 'border-primary/30 bg-primary/5' : 'border-border bg-card-background',
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Info
              className={cn('w-4 h-4', infoCount > 0 ? 'text-primary' : 'text-text-secondary/40')}
            />
            <span className="text-xs font-semibold text-text-secondary/60 uppercase tracking-wider">
              Info
            </span>
          </div>
          <div
            className={cn(
              'text-2xl font-bold font-mono',
              infoCount > 0 ? 'text-primary' : 'text-text-primary',
            )}
          >
            {infoCount}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green/30 mx-auto mb-3" />
          <p className="text-base font-semibold text-text-primary mb-1">All Clear!</p>
          <p className="text-sm text-text-secondary/50">
            No security alerts or suspicious activity detected.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary/60 uppercase tracking-wider">
            Recent Alerts ({alerts.length})
          </h3>
          {alerts.map((alert) => {
            const Icon =
              alert.type === 'critical' ? XCircle : alert.type === 'warning' ? AlertTriangle : Info;
            const color =
              alert.type === 'critical' ? 'red' : alert.type === 'warning' ? 'warn' : 'primary';

            return (
              <div
                key={alert.id}
                className={cn(
                  'p-4 rounded-lg border-l-4',
                  alert.type === 'critical' && 'border-l-red bg-red/5',
                  alert.type === 'warning' && 'border-l-warn bg-warn/5',
                  alert.type === 'info' && 'border-l-primary bg-primary/5',
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', `text-${color}`)} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-text-primary mb-1">{alert.title}</h4>
                    <p className="text-xs text-text-secondary/70 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-text-secondary/50">
                      <span>{format(alert.timestamp, 'MMM dd, yyyy HH:mm')}</span>
                      {alert.relatedEntries && (
                        <span>• {alert.relatedEntries.length} related sessions</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
