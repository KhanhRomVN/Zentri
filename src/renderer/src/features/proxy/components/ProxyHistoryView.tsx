import { FC, useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, Globe, User, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryItem {
  id: string;
  proxy_id: string;
  email_id: string;
  email_address: string;
  target_site: string;
  used_at: string;
}

interface ProxyHistoryViewProps {
  proxyId: string;
  onBack: () => void;
  onClose: () => void;
}

const ProxyHistoryView: FC<ProxyHistoryViewProps> = ({ proxyId, onBack, onClose }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // @ts-ignore
        const result = await window.electron.ipcRenderer.invoke('proxy:get-history', proxyId);
        setHistory(result || []);
      } catch (err: any) {
        console.error('[ProxyHistory] Fetch error:', err);
        setError('Failed to load usage history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [proxyId]);

  return (
    <div className="flex flex-col h-full bg-background/40 backdrop-blur-3xl animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden relative border-l border-border/50">
      {/* Header Area */}
      <div className="h-[75px] shrink-0 px-10 flex items-center justify-between border-b border-border/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase  text-foreground/90 leading-none">
              Usage Chronicle
            </h2>
            <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1.5 font-mono">
              Network Routing Logs
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 h-10 bg-card/60 hover:bg-primary/20 rounded-xl transition-all text-muted-foreground/80 hover:text-primary active:scale-95 shadow-sm border border-border/10 text-[11px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            onClick={onClose}
            className="px-4 h-10 bg-muted/10 hover:bg-muted/20 text-muted-foreground text-[11px] font-black uppercase tracking-widest rounded-xl transition-all border border-border/10 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-10">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-5 opacity-50">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary/50">
              Retrieving Access Logs...
            </span>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-rose-400">
            <HistoryIcon className="w-12 h-12 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-6 opacity-30">
            <div className="w-24 h-24 rounded-[2.5rem] bg-muted/20 border border-border/50 flex items-center justify-center rotate-12 shadow-2xl">
              <HistoryIcon className="w-12 h-12 -rotate-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-widest">No Logs Found</h3>
              <p className="text-[10px] font-medium max-w-[200px] mx-auto uppercase tracking-wider">
                This node has no recorded routing activity in the registry.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center px-2">
              <h3 className="text-[12px] font-black uppercase  text-foreground/50">
                Detailed Access Log ({history.length})
              </h3>
            </div>

            <div className="space-y-2">
              {history.map((item, i) => (
                <div
                  key={item.id}
                  className="group w-full flex items-center gap-6 p-4 hover:bg-primary/5 rounded-2xl transition-all border border-border/5 cursor-default active:scale-[0.995]"
                >
                  {/* Time */}
                  <div className="min-w-[140px] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-card/50 flex items-center justify-center text-muted-foreground/40 group-hover:text-primary transition-all shadow-inner">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-foreground/80 font-mono">
                        {format(new Date(item.used_at), 'HH:mm:ss')}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                        {format(new Date(item.used_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>

                  {/* Account */}
                  <div className="flex-1 min-w-0 flex items-center gap-4 px-6 border-l border-border/10">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Authorized Account
                      </span>
                      <span className="text-[13px] font-bold text-foreground/90 truncate group-hover:text-indigo-400 transition-colors">
                        {item.email_address}
                      </span>
                    </div>
                  </div>

                  {/* Target Site */}
                  <div className="flex-1 min-w-0 flex items-center gap-4 px-6 border-l border-border/10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 overflow-hidden shadow-inner">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${new URL(item.target_site || 'https://zentri.node').hostname}&sz=64`}
                        alt=""
                        className="w-4 h-4 transition-transform group-hover:scale-110"
                        onError={(e) => (e.currentTarget.src = 'https://zentri.node/favicon.ico')}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Target Destination
                      </span>
                      <span className="text-[13px] font-bold text-foreground/90 truncate group-hover:text-emerald-400 transition-colors">
                        {item.target_site || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Action Link Icon */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all">
                    <Globe className="w-4 h-4 text-primary/40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProxyHistoryView;
