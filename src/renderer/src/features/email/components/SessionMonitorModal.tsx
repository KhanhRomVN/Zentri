import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, Database } from 'lucide-react';

interface SessionStats {
  cookies: number;
  localStorage: number;
  sessionStorage: number;
}

interface SessionMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

// Simple Modal Component
export default function SessionMonitorModal({
  isOpen,
  onClose,
  accountId,
}: SessionMonitorModalProps) {
  const [status, setStatus] = useState<'waiting' | 'complete'>('waiting');
  const [stats, setStats] = useState<SessionStats | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('waiting');
      setStats(null);
    }

    const handleBrowserClosed = (_event: any, data: { accountId: string; stats: SessionStats }) => {
      if (data.accountId === accountId) {
        setStats(data.stats);
        setStatus('complete');
      }
    };

    // @ts-ignore
    const removeListener = window.electron.ipcRenderer.on(
      'email:browser-closed',
      handleBrowserClosed,
    );

    return () => {
      removeListener();
    };
  }, [isOpen, accountId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[400px] bg-background border border-border rounded-xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Session Monitor
        </h2>

        {status === 'waiting' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">LIVE</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Browser is active</p>
              <p className="text-xs text-muted-foreground">Waiting for session data capture...</p>
            </div>
            <div className="text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
              Do not close the application
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-green-500">Sync Completed Successfully</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-muted/50 rounded-xl text-center border border-border shadow-sm">
                <div className="text-3xl font-bold text-primary">
                  {stats?.cookies !== -1 ? stats?.cookies || 0 : '0'}
                </div>
                <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mt-1">
                  Cookies Captured
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl text-center border border-border shadow-sm">
                <div className="text-sm font-bold text-foreground h-full flex items-center justify-center">
                  <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[10px]">
                    SECURED
                  </span>
                </div>
                <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mt-1">
                  Profile Data
                </div>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground text-center italic">
              * All Gmail sync, history, and website data are stored in your private profile.
            </div>

            <button
              onClick={onClose}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
