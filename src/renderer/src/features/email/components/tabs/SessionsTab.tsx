import { FC, useState, useEffect } from 'react';
import { Database, Clock, ExternalLink, ShieldCheck, AlertCircle, Search } from 'lucide-react';

interface SessionsTabProps {
  email: string;
}

interface SessionData {
  domain: string;
  count: number;
  expiryDate: string;
}

const SessionsTab: FC<SessionsTabProps> = ({ email }) => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-sessions', { email });
      if (result.success) {
        setSessions(result.sessions);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [email]);

  const filteredSessions = sessions.filter((s) =>
    s.domain.toLowerCase().includes(search.toLowerCase()),
  );

  const getStatusColor = (expiry: string) => {
    const exp = new Date(expiry).getTime();
    const now = new Date().getTime();
    const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);

    if (daysLeft < 0) return 'text-red-400 bg-red-400/10';
    if (daysLeft < 7) return 'text-orange-400 bg-orange-400/10';
    return 'text-emerald-400 bg-emerald-400/10';
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-64">
        <Database className="w-8 h-8 text-zinc-700 animate-bounce mb-4" />
        <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-[loading_1.5s_infinite]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Metrics */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Tổng website</p>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-zinc-100">{sessions.length}</span>
            <Database className="w-4 h-4 text-zinc-600" />
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Session rò rỉ</p>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-emerald-400">0</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Search Header */}
      <div className="px-6 py-2 sticky top-0 bg-zinc-950 z-10 border-b border-zinc-900">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm domain phiên làm việc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
            <p>Không thể đọc dữ liệu Cookies</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 italic">
            Không tìm thấy phiên làm việc nào.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((session, idx) => (
              <div
                key={idx}
                className="group bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700/50 rounded-lg p-3 flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <GlobeIcon domain={session.domain} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-zinc-200 truncate">{session.domain}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-500 mt-0.5">
                      <span className="bg-zinc-800 px-1.5 py-0.5 rounded uppercase">
                        {session.count} cookies
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Hết hạn: {new Date(session.expiryDate).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(session.expiryDate)}`}
                >
                  {new Date(session.expiryDate).getTime() > new Date().getTime()
                    ? 'ACTIVE'
                    : 'EXPIRED'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const GlobeIcon = ({ domain }: { domain: string }) => {
  const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  return (
    <img
      src={iconUrl}
      alt=""
      className="w-5 h-5 rounded-sm"
      onError={(e) => (e.currentTarget.style.display = 'none')}
    />
  );
};

export default SessionsTab;
