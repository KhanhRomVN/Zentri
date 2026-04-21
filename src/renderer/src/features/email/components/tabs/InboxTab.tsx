import { FC, useState, useEffect } from 'react';
import {
  Mail,
  RefreshCw,
  Search,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Bug,
} from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
import Input from '../../../../shared/components/ui/input/Input';

interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  isUnread: boolean;
  hasOtp: boolean;
  otpCode?: string;
}

interface InboxTabProps {
  email: string;
}

const InboxTab: FC<InboxTabProps> = ({ email }) => {
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedEmail, setLastFetchedEmail] = useState<string | null>(null);

  const loadCache = async () => {
    if (!email) return;
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-inbox-cache', { email });
      if (result.success && result.messages.length > 0) {
        setMessages(result.messages);
        setLastFetchedEmail(email); // So we don't double auto-fetch immediately if cache is fresh
      }
    } catch (e) {
      console.error('Failed to load inbox cache', e);
    }
  };

  const fetchInbox = async (isManual = false) => {
    if (!email) return;
    setIsRefreshing(true);
    setError(null);
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-inbox', { email });
      if (result.success) {
        setMessages(result.messages);
        setError(null);
        setLastFetchedEmail(email);
      } else if (result.error === 'FETCH_IN_PROGRESS') {
        // Silently wait for the existing fetch to complete
        console.log('Fetch already in progress, ignoring duplicate signal.');
      } else {
        if (result.error === 'NOT_LOGGED_IN') {
          setError('Vui lòng đăng nhập vào Gmail trên trình duyệt trước khi xem nhanh Inbox.');
        } else {
          setError('Không thể lấy thư. Vui lòng thử lại sau.');
        }
      }
    } catch (err) {
      console.error('Failed to fetch inbox', err);
      setError('Lỗi kết nối bộ phận Agent.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDebug = async () => {
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('email:open-inbox-debug', { email });
    } catch (err) {
      console.error('Failed to open debug inbox', err);
    }
  };

  useEffect(() => {
    if (email) {
      // 1. Load from cache immediately for "Zero-load" feel
      loadCache();

      // 2. Refresh in background after a short delay
      const timer = setTimeout(() => {
        fetchInbox();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [email]);

  const handleCopyOtp = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEmails = messages.filter(
    (m) =>
      m.sender.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-card/5 backdrop-blur-sm animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
      {/* Inbox Navbar */}
      <div className="h-14 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-8 gap-4 shrink-0">
        <div className="w-80 flex items-center">
          <Input
            size="sm"
            placeholder="Search inbox..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
            className="!h-9 bg-muted/5 border-border/10 focus:bg-muted/10 transition-all duration-300 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDebug}
            className="w-9 h-9 flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500/20 transition-all active:scale-90 border border-amber-500/20 group"
            title="Debug: Open Visible Browser"
          >
            <Bug className="w-4 h-4" />
          </button>
          <button
            onClick={() => fetchInbox(true)}
            disabled={isRefreshing}
            className={cn(
              'w-9 h-9 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all active:scale-90 border border-primary/20 group',
              isRefreshing && 'opacity-50 cursor-not-allowed',
            )}
            title="Refresh Inbox"
          >
            <RefreshCw className={cn('w-4 h-4 transition-all', isRefreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Lock className="w-8 h-8 text-amber-500/60" />
            </div>
            <div className="text-center max-w-[280px]">
              <h3 className="text-[14px] font-black uppercase tracking-widest text-foreground/90 mb-2">
                Authentication Required
              </h3>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">{error}</p>
            </div>
          </div>
        ) : isRefreshing && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <RefreshCw className="w-10 h-10 text-primary animate-spin opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] animate-pulse">
              Syncing Tactical Inbox...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-3">
                <Mail className="w-12 h-12" />
                <p className="text-[12px] font-black uppercase tracking-[0.2em]">
                  {isRefreshing ? 'Refreshing...' : 'No Messages Found'}
                </p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={cn(
                    'group p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden',
                    email.isUnread
                      ? 'bg-primary/5 border-primary/30 shadow-[0_4px_20px_-10px_rgba(var(--primary-rgb),0.2)]'
                      : 'bg-muted/5 border-border/50 hover:bg-muted/10',
                  )}
                >
                  {email.isUnread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'text-[13px] font-black truncate',
                            email.isUnread ? 'text-foreground' : 'text-foreground/70',
                          )}
                        >
                          {email.sender}
                        </span>
                        {email.isUnread && (
                          <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <h4
                        className={cn(
                          'text-[12px] font-bold mb-1 truncate',
                          email.isUnread ? 'text-primary' : 'text-foreground/90',
                        )}
                      >
                        {email.subject}
                      </h4>
                      <p className="text-[11px] text-muted-foreground/60 line-clamp-1">
                        {email.preview}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/40 font-mono uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {email.time}
                      </div>

                      {email.hasOtp && email.otpCode && (
                        <button
                          onClick={() => handleCopyOtp(email.id, email.otpCode!)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 border',
                            copiedId === email.id
                              ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                              : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white',
                          )}
                        >
                          {copiedId === email.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              COPIED
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              OTP: {email.otpCode}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator for Security Alerts */}
                  {email.sender.toLowerCase().includes('security') && (
                    <div className="mt-3 pt-3 border-t border-border/10 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500/60" />
                      <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">
                        Action Required
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border/30 bg-muted/2 shrink-0">
        <div className="flex items-center gap-3 bg-muted/10 p-3 rounded-xl border border-border/20">
          <AlertCircle className="w-4 h-4 text-primary/50" />
          <p className="text-[10px] text-muted-foreground/60 font-medium leading-relaxed">
            Dữ liệu được trích xuất từ giao diện Gmail Mobile thông qua Profile hiện có. Không yêu
            cầu mật khẩu hoặc đăng nhập lại.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InboxTab;
