/**
 * PlatformSessions — danh sách phiên (sessions) của một nền tảng.
 * Hiển thị EmptyState khi chưa có data.
 */

import { Platform, ForgeSession } from '../../types';
import { getPlatformColor, getPlatformInitials } from '../../constants/platforms';
import { formatDate } from '../../utils/format';

interface PlatformSessionsProps {
  platform: Platform | null;
  sessions: ForgeSession[];
  isLoading?: boolean;
  onSelectSession: (sessionId: string) => void;
}

const PlatformSessions = ({
  platform,
  sessions,
  isLoading,
  onSelectSession,
}: PlatformSessionsProps) => {
  const platformName = platform?.name || '—';
  const color = platform ? getPlatformColor(platform.id) : '#6b7280';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full opacity-40">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Loading sessions...
        </span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <span
            className="flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold"
            style={{ backgroundColor: color, color: '#0a0a0c' }}
          >
            {getPlatformInitials(platformName)}
          </span>
        </div>
        <h4 className="text-sm font-bold mb-1">Chưa có phiên nào</h4>
        <p className="text-xs text-muted-foreground max-w-[280px]">
          Chưa có phiên (session) nào được tạo cho nền tảng {platformName}.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-5">
        <h2 className="text-xl font-bold font-head">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[11px] font-bold mr-2 align-middle"
            style={{ backgroundColor: color, color: '#0a0a0c' }}
          >
            {getPlatformInitials(platformName)}
          </span>
          {platformName} — Danh sách phiên
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{sessions.length} phiên</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelectSession(session.id)}
            className="group p-4 bg-card border border-border rounded-xl text-left hover:border-primary/40 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm font-bold font-head">Session #{session.id}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Tạo {formatDate(session.created_at || session.started_at)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-background rounded-md px-2.5 py-2 text-center">
                <div className="text-base font-bold">{session.accountCount ?? '—'}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  Account
                </div>
              </div>
              <div className="bg-background rounded-md px-2.5 py-2 text-center">
                <div className="text-base font-bold">—</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  Sống
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlatformSessions;