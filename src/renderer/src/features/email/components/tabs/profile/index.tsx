import { Account, ProfileMetadata, Cookie } from '../../../mock/accounts';
import { cn } from '../../../../../shared/lib/utils';
import { useState, useMemo, memo } from 'react';
import { Globe, Shield, RefreshCw } from 'lucide-react';

import { CookieViewerModal } from './components/CookieViewerModal';
import { StatsGrid } from './components/StatsGrid';
import { AutoSyncSection } from './components/AutoSyncSection';
import { ProfileDetails } from './components/ProfileDetails';

interface ProfileTabProps {
  account: Account;
  profile?: ProfileMetadata;
}

const ProfileTab = memo(({ account, profile }: ProfileTabProps) => {
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [smartSyncEnabled, setSmartSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState('12'); // hours

  const handleSyncNow = () => {
    setIsSyncing(true);

    // Simulate a sync process
    setTimeout(() => {
      setIsSyncing(false);
    }, 2000);
  };

  const statusConfig = {
    active: { color: 'text-emerald-500 bg-emerald-500/10', label: 'Healthy', icon: Shield },
    expired: { color: 'text-amber-500 bg-amber-500/10', label: 'Token Expired', icon: Shield },
    none: { color: 'text-muted-foreground bg-muted', label: 'No Session', icon: Shield },
  }[profile?.status || 'none'];

  // Mock cookies with expiration logic
  const displayCookies = useMemo(() => {
    if (profile?.cookies && profile.cookies.length > 0) return profile.cookies;

    const futureDate = (days: number) =>
      Math.floor((Date.now() + days * 24 * 60 * 60 * 1000) / 1000);

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
        expires: futureDate(0.001),
      },
      {
        name: 'SID',
        value: 'asdf78s9df789asdf789asdf',
        domain: '.google.com',
        path: '/',
        secure: true,
        httpOnly: true,
        expires: futureDate(0.04),
      },
      {
        name: 'HSID',
        value: 'asdf789asdf789asdf789',
        domain: '.google.com',
        path: '/',
        secure: true,
        httpOnly: true,
      },
    ] as Cookie[];
  }, [profile]);

  // Logic to calculate upcoming expirations
  const expiringSoonCount = useMemo(() => {
    if (!smartSyncEnabled) return 0;
    const now = Date.now() / 1000;
    const threshold = 24 * 60 * 60; // 24 hours
    return displayCookies.filter(
      (c) => c.expires !== undefined && c.expires > now && c.expires - now < threshold,
    ).length;
  }, [displayCookies, smartSyncEnabled]);

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8 custom-scrollbar animate-in fade-in duration-500">
      <CookieViewerModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        cookies={displayCookies}
      />

      <div className="space-y-6">
        {/* Header Section - Transparent & Compact */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-md flex items-center justify-center text-primary-foreground text-xl font-bold shadow-sm overflow-hidden bg-primary">
              {account.avatar?.startsWith('http') ? (
                <img
                  src={account.avatar}
                  alt={account.name || 'avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                account.avatar || account.name?.[0] || '?'
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">{account.name}</h1>
                <div
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1',
                    statusConfig.color,
                  )}
                >
                  <statusConfig.icon className="w-2.5 h-2.5" />
                  {statusConfig.label}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {account.provider}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-border" />
                  {account.email}
                </span>
                {smartSyncEnabled && expiringSoonCount > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-500 ml-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Smart Watch: {expiringSoonCount} tokens expiring
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm',
                isSyncing
                  ? 'bg-muted text-muted-foreground cursor-wait'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow active:scale-95',
              )}
            >
              <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* Stats Grid - Full Width */}
        <StatsGrid
          cookieCount={profile?.cookieCount || displayCookies.length}
          lastSync={profile?.lastSync}
          onCookieClick={() => setIsCookieModalOpen(true)}
        />

        {/* Maintenance & Auto-Sync Section */}
        <AutoSyncSection
          autoSyncEnabled={autoSyncEnabled}
          setAutoSyncEnabled={setAutoSyncEnabled}
          smartSyncEnabled={smartSyncEnabled}
          setSmartSyncEnabled={setSmartSyncEnabled}
          syncInterval={syncInterval}
          setSyncInterval={setSyncInterval}
        />

        {/* Technical Details - Full Width */}
        <ProfileDetails account={account} profile={profile} />
      </div>
    </div>
  );
});

export default ProfileTab;
