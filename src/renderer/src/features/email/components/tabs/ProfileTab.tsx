import { Account, ProfileMetadata, Cookie } from '../../mock/accounts';
import { cn } from '../../../../shared/lib/utils';
import { useState, useMemo } from 'react';
import {
  User,
  Chrome,
  Database,
  RefreshCw,
  ShieldCheck,
  HardDrive,
  FolderOpen,
  Calendar,
  Layers,
  Activity,
  Globe,
  X,
  Search,
  Copy,
  Download,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Settings2,
  Bell,
  Zap,
} from 'lucide-react';

interface ProfileTabProps {
  account: Account;
  profile?: ProfileMetadata;
  repoPath?: string;
}

const SectionHeader = ({ label, icon: Icon }: { label: string; icon?: any }) => (
  <div className="flex items-center gap-2 text-foreground/80 pb-4 border-b border-border/50 mb-6">
    {Icon && <Icon className="w-4 h-4 text-primary" />}
    <span className="text-base font-semibold tracking-tight">{label}</span>
  </div>
);

const MetadataCard = ({
  label,
  value,
  icon: Icon,
  colorClass,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: any;
  colorClass?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      'flex flex-col gap-3 p-4 rounded-xl border border-border bg-card shadow-sm transition-all duration-300',
      onClick ? 'cursor-pointer hover:border-primary/40 hover:shadow-md' : '',
    )}
  >
    <div className="flex items-center justify-between">
      <div className={cn('p-2 rounded-lg bg-primary/10', colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
    <div className="text-xl font-bold tracking-tight">{value}</div>
  </div>
);

const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
  <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm font-semibold truncate max-w-[200px]" title={value}>
      {value}
    </span>
  </div>
);

const CookieViewerModal = ({
  isOpen,
  onClose,
  cookies = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  cookies?: Cookie[];
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const filteredCookies = useMemo(() => {
    return cookies.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.domain.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [cookies, searchTerm]);

  if (!isOpen) return null;

  const handleCopy = (cookie: Cookie) => {
    navigator.clipboard.writeText(JSON.stringify(cookie, null, 2));
    setCopied(cookie.name);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cookies, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'cookies.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const formatExpires = (expires?: number) => {
    if (!expires) return { label: 'Session', class: 'text-blue-500 bg-blue-500/10' };

    const now = Date.now();
    const diff = expires * 1000 - now; // Chrome expires are usually in seconds

    if (diff <= 0) return { label: 'Expired', class: 'text-red-500 bg-red-500/10' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) {
      const color =
        days < 7 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';
      return { label: `${days}d left`, class: color };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    return { label: `${hours}h left`, class: 'text-red-500 bg-red-500/10 animate-pulse' };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4 md:p-8">
      <div className="w-full max-w-5xl h-[85vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Cookie Explorer</h2>
              <p className="text-xs text-muted-foreground">
                Manage and view captured session cookies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadJson}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold hover:bg-muted transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border bg-card">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredCookies.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10 border-b border-border">
                <tr className="text-left text-muted-foreground font-medium uppercase text-[10px] tracking-wider">
                  <th className="px-6 py-4 w-[20%]">Name</th>
                  <th className="px-6 py-4 w-[25%]">Value</th>
                  <th className="px-6 py-4 w-[15%]">Domain</th>
                  <th className="px-6 py-4 w-[15%]">Expires</th>
                  <th className="px-6 py-4 w-[10%] text-center">Flags</th>
                  <th className="px-6 py-4 w-[15%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredCookies.map((cookie, idx) => {
                  const expiry = formatExpires(cookie.expires);
                  return (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground/90">
                        {cookie.name}
                      </td>
                      <td className="px-6 py-4 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-[11px] truncate max-w-[150px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                            {showValues[cookie.name] ? cookie.value : '•'.repeat(16)}
                          </div>
                          <button
                            onClick={() =>
                              setShowValues((p) => ({ ...p, [cookie.name]: !p[cookie.name] }))
                            }
                            className="p-1 rounded hover:bg-muted text-muted-foreground transition-all shrink-0"
                          >
                            {showValues[cookie.name] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                        {cookie.domain}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap',
                            expiry.class,
                          )}
                        >
                          {expiry.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          {cookie.httpOnly && (
                            <div
                              className="w-5 h-5 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-[8px] font-bold"
                              title="HttpOnly"
                            >
                              H
                            </div>
                          )}
                          {cookie.secure && (
                            <div
                              className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[8px] font-bold"
                              title="Secure"
                            >
                              S
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleCopy(cookie)}
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all',
                            copied === cookie.name
                              ? 'bg-emerald-500 text-white'
                              : 'bg-primary/5 text-primary hover:bg-primary/10',
                          )}
                        >
                          {copied === cookie.name ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">No cookies found</p>
              <p className="text-xs">Try adjusting your search filters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex gap-4">
            <span>
              Total: <strong>{cookies.length}</strong> cookies
            </span>
            <span>
              Search results: <strong>{filteredCookies.length}</strong>
            </span>
          </div>
          <div className="italic">Tip: Click the eyeball icon to unmask cookie values.</div>
        </div>
      </div>
    </div>
  );
};

const ProfileTab = ({ account, profile, repoPath }: ProfileTabProps) => {
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState('12'); // hours

  const profilePath = repoPath ? `${repoPath}/profiles/${account.id}` : 'Local storage';

  const handleSyncNow = () => {
    setIsSyncing(true);
    setSyncProgress(0);

    // Simulate a sync process
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSyncing(false);
            setSyncProgress(0);
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const statusConfig = {
    active: { color: 'text-emerald-500 bg-emerald-500/10', label: 'Healthy' },
    expired: { color: 'text-amber-500 bg-amber-500/10', label: 'Token Expired' },
    none: { color: 'text-muted-foreground bg-muted', label: 'No Session' },
  }[profile?.status || 'none'];

  // Mock cookies if none exist for demo
  const displayCookies = useMemo(() => {
    if (profile?.cookies && profile.cookies.length > 0) return profile.cookies;

    const futureDate = (days: number) =>
      Math.floor((Date.now() + days * 24 * 60 * 60 * 1000) / 1000);

    // Provide some mock data for the UI
    return [
      {
        name: 'session_id',
        value: '78f9asd08f7asd908f7sdf',
        domain: '.google.com',
        path: '/',
        secure: true,
        httpOnly: true,
        expires: futureDate(30),
      },
      {
        name: 'NID',
        value: '511=asdf87fsd9f8asd7f9asd',
        domain: '.google.com',
        path: '/',
        secure: true,
        httpOnly: true,
        expires: futureDate(180),
      },
      {
        name: '_ga',
        value: 'GA1.1.123456789.123456789',
        domain: '.google.com',
        path: '/',
        secure: false,
        httpOnly: false,
        expires: futureDate(2),
      },
      {
        name: 'SID',
        value: 'asdf78s9df789asdf789asdf',
        domain: '.google.com',
        path: '/',
        secure: true,
        httpOnly: true,
        expires: futureDate(0.04),
      }, // ~1 hour
      {
        name: 'HSID',
        value: 'asdf789asdf789asdf789',
        domain: '.google.com',
        path: '/',
        secure: true,
        httpOnly: true,
      }, // Session
    ] as Cookie[];
  }, [profile]);

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar animate-in fade-in duration-500">
      <CookieViewerModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        cookies={displayCookies}
      />

      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header Profile Info */}
        <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent border border-border/50 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg ring-4 ring-background">
            {account.avatar || account.name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight mb-1">{account.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {account.provider}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{account.email}</span>
            </div>
          </div>
          <div
            className={cn('px-4 py-1.5 rounded-full text-xs font-bold border', statusConfig.color)}
          >
            {statusConfig.label}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetadataCard
            label="Cookies"
            value={profile?.cookieCount || displayCookies.length}
            icon={Database}
            colorClass="text-blue-500"
            onClick={() => setIsCookieModalOpen(true)}
          />
          <MetadataCard
            label="Last Sync"
            value={profile?.lastSync ? new Date(profile.lastSync).toLocaleDateString() : 'Never'}
            icon={RefreshCw}
            colorClass="text-purple-500"
          />
          <MetadataCard
            label="Success Rate"
            value="98.4%"
            icon={Activity}
            colorClass="text-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Information */}
          <section className="animate-in slide-in-from-bottom-4 duration-700">
            <SectionHeader label="System Configuration" icon={Layers} />
            <div className="bg-card rounded-xl border border-border p-5 space-y-1 shadow-sm">
              <InfoRow label="Browser Instance" value="Chromium 120" icon={Chrome} />
              <InfoRow label="Profile ID" value={account.id} icon={User} />
              <InfoRow label="Environment" value="Antigravity-Prod" icon={ShieldCheck} />
              <InfoRow label="Storage Path" value={profilePath} icon={FolderOpen} />
            </div>
          </section>

          {/* Performance & Quota */}
          <section className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
            <SectionHeader label="Resource Usage" icon={Activity} />
            <div className="bg-card rounded-xl border border-border p-5 space-y-1 shadow-sm">
              <InfoRow label="Cache Size" value="24.5 MB" icon={HardDrive} />
              <InfoRow label="Total Storage" value="156 MB" icon={Database} />
              <InfoRow label="Created Date" value="Jan 15, 2024" icon={Calendar} />
              <InfoRow label="Last Launch" value="3 hours ago" icon={Activity} />
            </div>
          </section>
        </div>

        {/* Maintenance & Auto-Sync Section */}
        <section className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <SectionHeader label="Maintenance & Auto-Sync" icon={Settings2} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Background Sync
                  </h3>
                  <p className="text-xs text-muted-foreground">Keep sessions alive automatically</p>
                </div>
                <button
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-all duration-300 relative px-1 flex items-center',
                    autoSyncEnabled ? 'bg-primary' : 'bg-muted',
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300',
                      autoSyncEnabled ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Sync Interval
                  </h3>
                  <p className="text-xs text-muted-foreground">How often to refresh data</p>
                </div>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  disabled={!autoSyncEnabled}
                  className="bg-muted/50 border border-border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  <option value="6">Every 6 hrs</option>
                  <option value="12">Every 12 hrs</option>
                  <option value="24">Every 24 hrs</option>
                </select>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <RefreshCw
                        className={cn('w-4 h-4 text-purple-500', isSyncing && 'animate-spin')}
                      />
                      Manual Sync
                    </h3>
                    <p className="text-xs text-muted-foreground">Trigger an instant check-in</p>
                  </div>
                  {autoSyncEnabled && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                      <Bell className="w-3 h-3" /> Scheduled
                    </div>
                  )}
                </div>

                {isSyncing ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-primary italic">Synchronizing profile...</span>
                      <span>{syncProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-muted-foreground">Next sync:</span>
                    <span className="text-sm font-bold text-foreground">In ~3h 24m</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className={cn(
                  'mt-4 w-full h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border',
                  isSyncing
                    ? 'bg-muted border-border cursor-not-allowed'
                    : 'bg-primary text-primary-foreground border-primary hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]',
                )}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Sync Now
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfileTab;
