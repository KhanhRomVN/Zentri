import { useState, useEffect, useMemo, useRef } from 'react';
import AccountWorkspace from './components/AccountWorkspace';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Key,
  Mail,
  X,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';
import { Account, ServiceItem, ActivityItem, ProfileMetadata } from './mock/accounts';
import { v4 as uuidv4 } from 'uuid';

const AccountManager = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileMetadata[]>([]);

  // Use refs to avoid closure traps in listeners without triggering loops
  const accountsRef = useRef(accounts);
  const servicesRef = useRef(services);
  const activitiesRef = useRef(activities);

  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);
  useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    name: '',
    provider: 'gmail' as Account['provider'],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gitlabFolder = useMemo(() => {
    return localStorage.getItem('gitlab_repo_folder');
  }, []);

  const loadData = async (forceCloud = false) => {
    setLoading(true);
    setError(null);
    try {
      if (!gitlabFolder) {
        setError('Please select a Git Repository Folder in Settings');
        return;
      }

      // Load from physical files on disk
      // @ts-ignore
      const emailsData = await window.electron.ipcRenderer.invoke(
        'git:read-data',
        gitlabFolder,
        'emails.json',
      );
      // @ts-ignore
      const servicesData = await window.electron.ipcRenderer.invoke(
        'git:read-data',
        gitlabFolder,
        'services.json',
      );
      // @ts-ignore
      const activitiesData = await window.electron.ipcRenderer.invoke(
        'git:read-data',
        gitlabFolder,
        'recent_activities.json',
      );
      // @ts-ignore
      const profilesData = await window.electron.ipcRenderer.invoke(
        'git:read-data',
        gitlabFolder,
        'profiles.json',
      );

      const loadedAccounts = emailsData || [];
      setAccounts(loadedAccounts);
      setServices(servicesData || []);
      setActivities(activitiesData || []);
      setProfiles(profilesData || []);

      if (loadedAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(loadedAccounts[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to read data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSyncComplete = () => {
      setError(null);
      loadData();
    };

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
    // @ts-ignore
    const removeBrowserListener = window.electron.ipcRenderer.on(
      'email:browser-closed',
      handleBrowserClosed,
    );

    return () => {
      window.removeEventListener('zentri:sync-status-changed', handleSyncComplete);
      removeBrowserListener();
    };
  }, [gitlabFolder]);

  const markAsDirty = async (
    updatedAccounts: Account[],
    updatedServices: ServiceItem[],
    updatedActivities: ActivityItem[],
    updatedProfiles: ProfileMetadata[] = profiles,
  ) => {
    // Write to physical files immediately
    if (gitlabFolder) {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: gitlabFolder,
        filename: 'emails.json',
        data: updatedAccounts,
      });
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: gitlabFolder,
        filename: 'services.json',
        data: updatedServices,
      });
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: gitlabFolder,
        filename: 'recent_activities.json',
        data: updatedActivities,
      });
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: gitlabFolder,
        filename: 'profiles.json',
        data: updatedProfiles,
      });
    }

    window.dispatchEvent(
      new CustomEvent('zentri:sync-status-changed', { detail: { isDirty: true } }),
    );
  };

  const handleAddAccount = async () => {
    const account: Account = {
      id: uuidv4(),
      email: newAccount.email,
      password: newAccount.password,
      name: newAccount.name || '',
      avatar: '',
      provider: newAccount.provider,
      recoveryEmail: '',
      phone: '',
      twoFactorEnabled: false,
      status: 'active',
    };

    const updatedAccounts = [...accounts, account];
    setAccounts(updatedAccounts);
    setSelectedAccount(account);
    setIsModalOpen(false);
    setNewAccount({ email: '', password: '', name: '', provider: 'gmail' });
    markAsDirty(updatedAccounts, services, activities, profiles);
  };

  const handleDeleteAccount = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedAccounts = accounts.filter((a) => a.id !== id);
    const updatedServices = services.filter((s) => s.accountId !== id);
    const updatedActivities = activities.filter((a) => a.accountId !== id);

    setAccounts(updatedAccounts);
    setServices(updatedServices);
    setActivities(updatedActivities);

    if (selectedAccount?.id === id) {
      setSelectedAccount(updatedAccounts[0] || null);
    }
    markAsDirty(updatedAccounts, updatedServices, updatedActivities, profiles);
  };

  const handleUpdateAccount = async (updatedAccount: Account) => {
    const updated = accounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a));
    setAccounts(updated);
    setSelectedAccount(updatedAccount);
    markAsDirty(updated, services, activities, profiles);
  };

  const filteredAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getProviderTheme = (provider: Account['provider']) => {
    switch (provider) {
      case 'gmail':
        return {
          color: 'text-red-600',
          hex: '#dc2626',
          bg: 'bg-gradient-to-br from-red-600/10 to-transparent',
          border: 'border-red-600/20',
          avatar: 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20',
        };
      case 'hotmail':
        return {
          color: 'text-blue-600',
          hex: '#2563eb',
          bg: 'bg-gradient-to-br from-blue-600/10 to-transparent',
          border: 'border-blue-600/20',
          avatar: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20',
        };
      case 'protonmail':
        return {
          color: 'text-purple-600',
          hex: '#9333ea',
          bg: 'bg-gradient-to-br from-purple-600/10 to-transparent',
          border: 'border-purple-600/20',
          avatar: 'bg-gradient-to-br from-purple-600 to-indigo-700 shadow-purple-500/20',
        };
      default:
        return {
          color: 'text-gray-600',
          hex: '#4b5563',
          bg: 'bg-muted/30',
          border: 'border-border',
          avatar: 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-gray-500/20',
        };
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Panel: Account List */}
      <div className="w-[350px] flex flex-col border-r border-border h-full bg-muted/10 backdrop-blur-xl shrink-0">
        {/* Header & Search */}
        <div className="h-16 shrink-0 flex items-center gap-2 px-3 border-b border-border bg-card/20 relative">
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
              loadData(true);
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
            filteredAccounts.map((account) => {
              let domain = account.email.split('@')[1] || 'google.com';

              // Map email providers to their actual favicon domains
              const domainMap: Record<string, string> = {
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

              domain = domainMap[domain] || domain;
              const faviconUrl = `https://www.google.com/s2/favicons?domain=https://${domain}&sz=32`;
              const theme = getProviderTheme(account.provider);
              const isSelected = selectedAccount?.id === account.id;

              return (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className={cn(
                    'group relative flex flex-col gap-2 p-3 cursor-pointer transition-all duration-300 border-r-2',
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/30',
                  )}
                  style={{
                    borderRightColor: isSelected ? theme.hex : 'transparent',
                  }}
                >
                  {/* Delete Icon */}
                  <button
                    onClick={(e) => handleDeleteAccount(account.id, e)}
                    className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md z-10 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-start gap-3 pl-2 relative z-10">
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg transition-transform group-hover:scale-105 overflow-hidden',
                          !account.avatar?.startsWith('http') && theme.avatar,
                          account.avatar?.startsWith('http') &&
                            'bg-background border border-border',
                        )}
                      >
                        {account.avatar?.startsWith('http') ? (
                          <img
                            src={account.avatar}
                            alt={account.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          account.avatar || account.name[0]
                        )}
                      </div>
                      <div
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                          account.status === 'active' ? 'bg-emerald-500' : 'bg-yellow-500',
                        )}
                      />
                    </div>

                    <div className="flex-1 overflow-hidden min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 mb-1">
                        <img
                          src={faviconUrl}
                          alt="provider"
                          className="w-3 h-3 rounded-full opacity-70"
                        />
                        <h4
                          className={cn(
                            'text-sm font-semibold truncate transition-colors',
                            isSelected
                              ? 'text-foreground'
                              : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        >
                          {account.email}
                        </h4>
                      </div>
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-background/50 border border-border w-fit">
                        {account.twoFactorEnabled ? (
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                        ) : (
                          <ShieldAlert className="w-2.5 h-2.5 text-red-500" />
                        )}
                        <span className="text-[9px] text-muted-foreground font-bold">2FA</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-card/30 backdrop-blur-md">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </button>
        </div>
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
            onDelete={handleDeleteAccount}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground grayscale opacity-20">
            <Mail className="w-24 h-24" />
            <p className="text-sm font-medium">Select an account to view details</p>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-[600px] bg-background border border-border shadow-2xl rounded-md flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-border">
              <h2 className="text-xl font-bold tracking-tight">Add New Account</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full h-11 pl-11 pr-4 rounded-md bg-input border border-border focus:border-primary outline-none transition-all text-sm"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Password</label>
                <div className="relative group">
                  <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-11 pl-11 pr-4 rounded-md bg-input border border-border focus:border-primary outline-none transition-all text-sm"
                    value={newAccount.password}
                    onChange={(e) => setNewAccount((p) => ({ ...p, password: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 h-10 rounded-md border border-border font-bold text-sm hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                className="px-6 h-10 rounded-md bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
