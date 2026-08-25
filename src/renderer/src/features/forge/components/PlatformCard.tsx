/**
 * PlatformCard — card hiển thị thông tin platform trong Dashboard.
 * Bao gồm: favicon, title, dòng 2 tóm tắt (sessions, accounts, tỉ lệ sống).
 */

import { Platform } from '../types';

export interface PlatformStats {
  sessionCount: number;
  accountCount: number;
  survivalRate: number; // 0-100
}

interface PlatformCardProps {
  platform: Platform;
  stats?: PlatformStats;
  onSelectPlatform: (platformId: string) => void;
}

const PlatformCard = ({ platform, stats, onSelectPlatform }: PlatformCardProps) => {
  const faviconUrl = platform.url
    ? `https://www.google.com/s2/favicons?domain=${platform.url}&sz=64`
    : '';

  const formatSurvivalRate = (rate: number): string => {
    if (rate === 0) return '—';
    return `${Math.round(rate)}%`;
  };

  return (
    <button
      type="button"
      onClick={() => onSelectPlatform(platform.id)}
      className="group p-4 bg-card border border-border rounded-xl text-left hover:border-primary/40 hover:-translate-y-0.5 transition-all"
    >
      {/* Header: favicon + title */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center p-1.5 border border-border shadow-sm shrink-0">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              className="w-full h-full object-contain"
              alt=""
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-[10px] font-bold text-muted-foreground">
              {platform.name?.slice(0, 2).toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold truncate">{platform.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">
            {platform.category || 'Chưa phân loại'}
          </div>
        </div>
      </div>

      {/* Dòng 2: tóm tắt sessions / accounts / tỉ lệ sống */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-background rounded-md px-2 py-1.5 text-center">
          <div className="text-sm font-bold">{stats?.sessionCount ?? '—'}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Session</div>
        </div>
        <div className="bg-background rounded-md px-2 py-1.5 text-center">
          <div className="text-sm font-bold">{stats?.accountCount ?? '—'}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Account</div>
        </div>
        <div className="bg-background rounded-md px-2 py-1.5 text-center">
          <div className="text-sm font-bold">
            {stats ? formatSurvivalRate(stats.survivalRate) : '—'}
          </div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Sống</div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors mt-3">
        Xem phiên →
      </div>
    </button>
  );
};

export default PlatformCard;