import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import AccountWorkspace from './components/AccountWorkspace';
import AccountItem from './components/AccountItem';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Mail,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  User,
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';
import { Account, ServiceItem, ActivityItem, ProfileMetadata } from './mock/accounts';
import { v4 as uuidv4 } from 'uuid';
import {
  SERVICE_PROVIDERS,
  ServiceProviderConfig,
} from './components/tabs/service/utils/servicePresets';

// Domain mapping for email provider favicons
const DOMAIN_MAP: Record<string, string> = {
  'gmail.com': 'google.com',
  'googlemail.com': 'google.com',
  'hotmail.com': 'microsoft.com',
  'outlook.com': 'microsoft.com',
  'live.com': 'microsoft.com',
  'yahoo.com': 'yahoo.com',
  'protonmail.com': 'proton.me',
  'proton.me': 'proton.me',
  'icloud.com': 'apple.com',
  'me.com': 'apple.com',
};

const AccountManager = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileMetadata[]>([]);

  // Custom Providers State
  const [customProviders, setCustomProviders] = useState<Record<string, ServiceProviderConfig>>({});

  // Use refs to avoid closure traps in listeners without triggering loops
  const accountsRef = useRef(accounts);
  const servicesRef = useRef(services);
  const activitiesRef = useRef(activities);

  // Sync refs with state (consolidated for performance)
  useLayoutEffect(() => {
    accountsRef.current = accounts;
    servicesRef.current = services;
    activitiesRef.current = activities;
  }, [accounts, services, activities]);

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gitlabFolder = useMemo(() => {
    return localStorage.getItem('gitlab_repo_folder');
  }, []);

  const getAvatarColor = useCallback((identifier: string) => {
    const colors = [
      { bg: 'bg-red-500/15', text: 'text-red-500', hex: '#ef4444' }, // red-500
      { bg: 'bg-orange-500/15', text: 'text-orange-500', hex: '#f97316' }, // orange-500
      { bg: 'bg-amber-500/15', text: 'text-amber-500', hex: '#f59e0b' }, // amber-500
      { bg: 'bg-green-500/15', text: 'text-green-500', hex: '#22c55e' }, // green-500
      { bg: 'bg-emerald-500/15', text: 'text-emerald-500', hex: '#10b981' }, // emerald-500
      { bg: 'bg-teal-500/15', text: 'text-teal-500', hex: '#14b8a6' }, // teal-500
      { bg: 'bg-cyan-500/15', text: 'text-cyan-500', hex: '#06b6d4' }, // cyan-500
      { bg: 'bg-sky-500/15', text: 'text-sky-500', hex: '#0ea5e9' }, // sky-500
      { bg: 'bg-blue-500/15', text: 'text-blue-500', hex: '#3b82f6' }, // blue-500
      { bg: 'bg-indigo-500/15', text: 'text-indigo-500', hex: '#6366f1' }, // indigo-500
      { bg: 'bg-violet-500/15', text: 'text-violet-500', hex: '#8b5cf6' }, // violet-500
      { bg: 'bg-purple-500/15', text: 'text-purple-500', hex: '#a855f7' }, // purple-500
      { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-500', hex: '#d946ef' }, // fuchsia-500
      { bg: 'bg-pink-500/15', text: 'text-pink-500', hex: '#ec4899' }, // pink-500
      { bg: 'bg-rose-500/15', text: 'text-rose-500', hex: '#f43f5e' }, // rose-500
    ];

    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!gitlabFolder) {
        console.warn('[Email] No gitlabFolder found in localStorage');
        setError('Please select a Git Repository Folder in Settings');
        return;
      }

      console.log('[Email] Loading data from:', gitlabFolder);

      console.log('[Email] Loading data in parallel from:', gitlabFolder);

      // Load all physical files on disk in parallel
      const [emailsRes, servicesRes, activitiesRes, profilesRes, customProvidersRes] =
        await Promise.all([
          window.electron.ipcRenderer.invoke('git:read-data', gitlabFolder, 'emails.json'),
          window.electron.ipcRenderer.invoke('git:read-data', gitlabFolder, 'services.json'),
          window.electron.ipcRenderer.invoke(
            'git:read-data',
            gitlabFolder,
            'recent_activities.json',
          ),
          window.electron.ipcRenderer.invoke('git:read-data', gitlabFolder, 'profiles.json'),
          window.electron.ipcRenderer.invoke(
            'git:read-data',
            gitlabFolder,
            'custom_providers.json',
          ),
        ]);

      const extractData = (res: any) => {
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return Array.isArray(res.data) ? res.data : typeof res.data === 'object' ? res.data : [];
        }
        return Array.isArray(res) ? res : res && typeof res === 'object' ? res : null;
      };

      const loadedAccounts = extractData(emailsRes) || [];
      const loadedServices = extractData(servicesRes) || [];
      const loadedActivities = extractData(activitiesRes) || [];
      const loadedProfiles = extractData(profilesRes) || [];
      const loadedCustomProviders = extractData(customProvidersRes);

      console.log('[Email] Parallel load complete. Accounts:', loadedAccounts.length);

      setAccounts(loadedAccounts);
      setServices(loadedServices);
      setActivities(loadedActivities);
      setProfiles(loadedProfiles);

      setCustomProviders(
        loadedCustomProviders && !Array.isArray(loadedCustomProviders) ? loadedCustomProviders : {},
      );

      if (loadedAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(loadedAccounts[0]);
      }
    } catch (err: any) {
      console.error('[Email] Load error:', err);
      setError(`Failed to read data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [gitlabFolder, selectedAccount]);

  const handleSyncComplete = useCallback(() => {
    setError(null);
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();

    const handleBrowserClosed = (_event: any, data: { accountId: string; stats: any }) => {
      const newProfile: ProfileMetadata = {
        accountId: data.accountId,
        cookieCount: data.stats.cookies,
        lastSync: new Date().toISOString(),
        status: data.stats.cookies > 0 ? 'active' : 'none',
      };

      setProfiles((prev) => {
        const existing = prev.find((p) => p.accountId === data.accountId);
        let updated;
        if (existing) {
          updated = prev.map((p) => (p.accountId === data.accountId ? newProfile : p));
        } else {
          updated = [...prev, newProfile];
        }
        // Use updated values directly for markAsDirty via REFS
        markAsDirty(accountsRef.current, servicesRef.current, activitiesRef.current, updated);
        return updated;
      });
    };

    window.addEventListener('zentri:sync-status-changed', handleSyncComplete);
    const removeBrowserListener = window.electron.ipcRenderer.on(
      'email:browser-closed',
      handleBrowserClosed,
    );

    return () => {
      window.removeEventListener('zentri:sync-status-changed', handleSyncComplete);
      removeBrowserListener();
    };
  }, [gitlabFolder, loadData, handleSyncComplete]);

  const markAsDirty = useCallback(
    async (
      updatedAccounts: Account[],
      updatedServices: ServiceItem[],
      updatedActivities: ActivityItem[],
      updatedProfiles: ProfileMetadata[] = profiles,
    ) => {
      // Write to physical files in parallel
      if (gitlabFolder) {
        await Promise.all([
          window.electron.ipcRenderer.invoke('git:write-data', {
            folderPath: gitlabFolder,
            filename: 'emails.json',
            data: updatedAccounts,
          }),
          window.electron.ipcRenderer.invoke('git:write-data', {
            folderPath: gitlabFolder,
            filename: 'services.json',
            data: updatedServices,
          }),
          window.electron.ipcRenderer.invoke('git:write-data', {
            folderPath: gitlabFolder,
            filename: 'recent_activities.json',
            data: updatedActivities,
          }),
          window.electron.ipcRenderer.invoke('git:write-data', {
            folderPath: gitlabFolder,
            filename: 'profiles.json',
            data: updatedProfiles,
          }),
        ]);
      }

      window.dispatchEvent(
        new CustomEvent('zentri:sync-status-changed', { detail: { isDirty: true } }),
      );
    },
    [gitlabFolder, profiles],
  );

  const handleAddAccount = useCallback(
    async (accountData: Partial<Account>) => {
      const account: Account = {
        id: uuidv4(),
        email: accountData.email || '',
        password: accountData.password || '',
        name: accountData.name || '',
        avatar: '',
        provider: (accountData.provider as Account['provider']) || 'gmail',
        recoveryEmail: accountData.recoveryEmail || '',
        phoneNumber: '',
        twoFactorEnabled: false,
        status: 'active',
      };

      const updatedAccounts = [...accounts, account];
      setAccounts(updatedAccounts);
      setSelectedAccount(account);
      setIsCreating(false);
      markAsDirty(updatedAccounts, services, activities, profiles);
    },
    [accounts, services, activities, profiles, markAsDirty],
  );

  const handleDeleteAccount = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const updatedAccounts = (Array.isArray(accounts) ? accounts : []).filter((a) => a.id !== id);
      const updatedServices = (Array.isArray(services) ? services : []).filter(
        (s) => s.emailId !== id,
      );
      const updatedActivities = (Array.isArray(activities) ? activities : []).filter(
        (a) => a.emailId !== id,
      );

      setAccounts(updatedAccounts);
      setServices(updatedServices);
      setActivities(updatedActivities);

      if (selectedAccount?.id === id) {
        setSelectedAccount(updatedAccounts[0] || null);
      }
      markAsDirty(updatedAccounts, updatedServices, updatedActivities, profiles);
    },
    [accounts, services, activities, profiles, selectedAccount, markAsDirty],
  );

  const handleUpdateAccount = useCallback(
    async (updatedAccount: Account) => {
      if (isCreating) {
        handleAddAccount(updatedAccount);
        return;
      }
      const updated = (Array.isArray(accounts) ? accounts : []).map((a) =>
        a.id === updatedAccount.id ? updatedAccount : a,
      );
      setAccounts(updated);
      setSelectedAccount(updatedAccount);
      markAsDirty(updated, services, activities, profiles);
    },
    [accounts, services, activities, profiles, markAsDirty, isCreating, handleAddAccount],
  );

  const handleUpdateServices = useCallback(
    async (updatedAccountServices: ServiceItem[]) => {
      const updatedAllServices = (Array.isArray(services) ? services : []).filter(
        (s) => s.emailId !== selectedAccount?.id,
      );
      updatedAllServices.push(...updatedAccountServices);

      setServices(updatedAllServices);
      markAsDirty(accounts, updatedAllServices, activities, profiles);
    },
    [accounts, services, activities, profiles, selectedAccount, markAsDirty],
  );

  const handleSaveNewProvider = useCallback(
    async (newProvider: ServiceProviderConfig) => {
      const updatedCustom = { ...customProviders, [newProvider.id]: newProvider };
      setCustomProviders(updatedCustom);

      // Save to custom_providers.json
      if (gitlabFolder) {
        try {
          await window.electron.ipcRenderer.invoke('git:write-data', {
            folderPath: gitlabFolder,
            filename: 'custom_providers.json',
            data: updatedCustom,
          });
          console.log('[Email] Saved new custom provider:', newProvider.name);
        } catch (e) {
          console.error('[Email] Failed to save custom provider', e);
        }
      }
    },
    [customProviders, gitlabFolder],
  );

  // Merge default providers with custom providers
  const allProviders = useMemo(() => {
    return { ...SERVICE_PROVIDERS, ...customProviders };
  }, [customProviders]);

  const filteredAccounts = useMemo(
    () =>
      (Array.isArray(accounts) ? accounts : []).filter(
        (account) =>
          account.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.email.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [accounts, searchQuery],
  );

  const handleSelectAccount = useCallback((account: Account) => {
    setIsCreating(false);
    setSelectedAccount(account);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Panel: Account List */}
      <div className="w-[350px] flex flex-col border-r border-border h-full bg-background/50 shrink-0">
        {/* Header & Search */}
        <div className="h-16 shrink-0 flex items-center gap-2 px-3 border-b border-border bg-background relative">
          <div className="relative flex-1 group">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-input border border-border focus:border-primary/40 text-sm shadow-sm transition-all focus-visible:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => {
              if (localStorage.getItem('zentri_is_dirty') === 'true') {
                if (!confirm('You have unsaved changes. Overwrite with Cloud data?')) return;
              }
              loadData();
            }}
            disabled={loading}
            className={cn(
              'p-2 text-muted-foreground hover:text-primary hover:bg-primary/50 rounded-lg transition-all',
              loading && 'animate-spin',
            )}
            title="Force Sync from Cloud"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Sync Status Banner */}
        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2 text-[10px] text-red-500 animate-in slide-in-from-top-1">
            <AlertCircle className="w-3 h-3" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-0 custom-scrollbar py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground opacity-50">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Loading Cloud Data...</span>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground opacity-40 p-8 text-center">
              <Mail className="w-12 h-12" />
              <p className="text-xs">No accounts found. Click "Add Account" to start.</p>
            </div>
          ) : (
            filteredAccounts.map((account) => (
              <AccountItem
                key={account.id}
                account={account}
                isSelected={selectedAccount?.id === account.id}
                onSelect={handleSelectAccount}
                onDelete={handleDeleteAccount}
                getAvatarColor={getAvatarColor}
                DOMAIN_MAP={DOMAIN_MAP}
              />
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <button
          onClick={() => {
            setIsCreating(true);
            const tempAccount: Account = {
              id: 'temp',
              email: '',
              password: '',
              name: '',
              avatar: '',
              provider: 'gmail',
              recoveryEmail: '',
              phoneNumber: '',
              twoFactorEnabled: false,
              status: 'active',
            };
            setSelectedAccount(tempAccount);
          }}
          disabled={isCreating}
          className={cn(
            'w-full py-2.5 flex items-center justify-center gap-2 border-t border-border  backdrop-blur-md transition-all hover:bg-primary/10 text-muted-foreground hover:text-primary group',
            isCreating && 'opacity-50 cursor-not-allowed',
          )}
        >
          <Plus className="h-4 w-4 transition-colors group-hover:text-primary" />
          <span className="font-bold text-sm">Add Account</span>
        </button>
      </div>

      {/* Right Panel */}
      <div className="flex-1 h-full overflow-hidden bg-background relative">
        {selectedAccount ? (
          <AccountWorkspace
            account={selectedAccount}
            services={services}
            profiles={profiles}
            repoPath={gitlabFolder || undefined}
            onUpdate={handleUpdateAccount}
            onUpdateServices={handleUpdateServices}
            onDelete={handleDeleteAccount}
            isCreating={isCreating}
            onCancelCreate={() => {
              setIsCreating(false);
              setSelectedAccount(accounts[0] || null);
            }}
            allAccounts={accounts}
            providers={allProviders}
            onSaveNewProvider={handleSaveNewProvider}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground grayscale opacity-20">
            <Mail className="w-24 h-24" />
            <p className="text-sm font-medium">Select an account to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManager;
