/**
 * ------------------------------------------------------------------
 * SyncTab
 * ------------------------------------------------------------------
 * Tab Sync hiển thị trạng thái đồng bộ cookie và session
 * ------------------------------------------------------------------
 */

import { useState, useEffect } from 'react';
import { FingerprintEntry } from '../FootprintTable';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../../../../../shared/lib/utils';

interface SyncTabProps {
  domain: string;
  entries: FingerprintEntry[];
}

interface SyncStatus {
  hasSession: boolean;
  cookieCount: number;
  lastCheck: Date;
  expiresAt?: Date;
  status: 'active' | 'expiring' | 'expired';
}

export default function SyncTab({ domain, entries }: SyncTabProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSyncStatus = async () => {
    setLoading(true);
    try {
      // TODO: Call IPC to check domain session
      // const result: any = await window.electron.ipcRenderer.invoke('email:check-domain-session', { email, domain });

      // Mock data for now
      const activeEntry = entries.find((e) => !e.ended_at);
      const hasSession = !!activeEntry;

      let status: 'active' | 'expiring' | 'expired' = 'expired';
      let expiresAt: Date | undefined;

      if (hasSession && activeEntry) {
        const startedAt = new Date(activeEntry.started_at);
        const now = new Date();
        const daysSinceStart = Math.floor(
          (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        const expirationDays = 60;
        const daysRemaining = expirationDays - daysSinceStart;

        if (daysRemaining > 14) {
          status = 'active';
        } else if (daysRemaining > 0) {
          status = 'expiring';
        } else {
          status = 'expired';
        }

        expiresAt = new Date(startedAt.getTime() + expirationDays * 24 * 60 * 60 * 1000);
      }

      setSyncStatus({
        hasSession,
        cookieCount: hasSession ? Math.floor(Math.random() * 20) + 5 : 0,
        lastCheck: new Date(),
        expiresAt,
        status,
      });
    } catch (error) {
      console.error('Failed to check sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSyncStatus();
  }, [domain, entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!syncStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary/50">
        <XCircle className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Failed to load sync status</p>
      </div>
    );
  }

  const { hasSession, cookieCount, lastCheck, expiresAt, status } = syncStatus;

  return (
    <div className="p-6">
      {/* Status Card */}
      <div
        className={cn(
          'p-5 rounded-lg border-2 mb-6',
          status === 'active' && 'border-green/30 bg-green/5',
          status === 'expiring' && 'border-warn/30 bg-warn/5',
          status === 'expired' && 'border-red/30 bg-red/5',
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
              status === 'active' && 'bg-green/20',
              status === 'expiring' && 'bg-warn/20',
              status === 'expired' && 'bg-red/20',
            )}
          >
            {status === 'active' && <CheckCircle className="w-6 h-6 text-green" />}
            {status === 'expiring' && <AlertTriangle className="w-6 h-6 text-warn" />}
            {status === 'expired' && <XCircle className="w-6 h-6 text-red" />}
          </div>
          <div className="flex-1">
            <h3
              className={cn(
                'text-lg font-bold mb-1',
                status === 'active' && 'text-green',
                status === 'expiring' && 'text-warn',
                status === 'expired' && 'text-red',
              )}
            >
              {status === 'active' && 'Session Active'}
              {status === 'expiring' && 'Session Expiring Soon'}
              {status === 'expired' && 'Session Expired'}
            </h3>
            <p className="text-sm text-text-secondary/70">
              {hasSession
                ? `You are currently logged in to ${domain}`
                : `No active session found for ${domain}`}
            </p>
          </div>
          <button
            onClick={checkSyncStatus}
            className="shrink-0 p-2 rounded-md hover:bg-muted/20 text-text-secondary/60 hover:text-text-primary transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-border bg-card-background">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-text-secondary/60 uppercase tracking-wider">
              Last Checked
            </span>
          </div>
          <div className="text-base font-mono font-semibold text-text-primary">
            {format(lastCheck, 'MMM dd, HH:mm:ss')}
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card-background">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-text-secondary/60 uppercase tracking-wider">
              Cookies
            </span>
          </div>
          <div className="text-base font-mono font-semibold text-text-primary">
            {cookieCount} active
          </div>
        </div>
      </div>

      {/* Expiration Info */}
      {expiresAt && (
        <div className="p-4 rounded-lg border border-border bg-card-background mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle
              className={cn(
                'w-4 h-4',
                status === 'active' && 'text-green',
                status === 'expiring' && 'text-warn',
                status === 'expired' && 'text-red',
              )}
            />
            <span className="text-xs font-semibold text-text-secondary/60 uppercase tracking-wider">
              Session Expiration
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-text-secondary/60">Expires on:</span>
              <span className="text-base font-mono font-semibold text-text-primary">
                {format(expiresAt, 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-text-secondary/60">Time remaining:</span>
              <span
                className={cn(
                  'text-base font-mono font-semibold',
                  status === 'active' && 'text-green',
                  status === 'expiring' && 'text-warn',
                  status === 'expired' && 'text-red',
                )}
              >
                {Math.max(
                  0,
                  Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                )}{' '}
                days
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-text-secondary/60 uppercase tracking-wider">
          Session History
        </h4>
        <div className="space-y-2">
          {entries.slice(0, 5).map((entry) => {
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
                  <div className="font-mono text-xs text-text-primary">
                    {format(new Date(entry.started_at), 'MMM dd, HH:mm:ss')}
                    {entry.ended_at && (
                      <span className="text-text-secondary/50">
                        {' '}
                        → {format(new Date(entry.ended_at), 'HH:mm:ss')}
                      </span>
                    )}
                  </div>
                </div>
                {isActive && (
                  <span className="text-[10px] font-semibold text-green uppercase">Active</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
