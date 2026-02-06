import { useEffect, useState, memo, useMemo, useCallback } from 'react';
import {
  X,
  Check,
  Eye,
  EyeOff,
  Globe,
  Shield,
  Cookie,
  User,
  Mail,
  Smartphone,
  Key,
  ScanLine,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { Agent, RegAccount } from '../types';
import { ProxyItem } from '../../proxy/types/types';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../shared/components/ui/dropdown';
import { Drawer } from '../../../shared/components/ui/drawer';
import { TwoFactorSection } from '../../email/components/tabs/core/components/TwoFactorSection';
import { MethodDrawer } from '../../email/components/tabs/core/components/MethodDrawer';
import { ProfileDetails } from '../../email/components/tabs/profile/components/ProfileDetails';
import { CookieViewerModal } from '../../email/components/tabs/profile/components/CookieViewerModal';

interface TwoFactorOption {
  id: string;
  name: string;
  type: string;
  placeholder: string;
}

const ALL_METHODS: TwoFactorOption[] = [
  { id: 'app', name: 'Authenticator App', type: 'app', placeholder: 'Not configured' },
  { id: 'sms', name: 'Phone Verification', type: 'sms', placeholder: 'No phone linked' },
  { id: 'email', name: 'Recovery Email', type: 'email', placeholder: 'No email added' },
  { id: 'key', name: 'Security Key', type: 'key', placeholder: 'No key added' },
  { id: 'prompt', name: 'Device Prompt', type: 'prompt', placeholder: 'Not set up' },
  { id: 'hello', name: 'Windows Hello', type: 'hello', placeholder: 'Not set up' },
  { id: 'codes', name: 'Backup Codes', type: 'codes', placeholder: 'Generate codes' },
];

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  account: Partial<RegAccount> | null;
  agents: Agent[];
  onSave: (account: Partial<RegAccount>) => void;
}

const AccountDrawer = memo(({ isOpen, onClose, account, agents, onSave }: AccountDrawerProps) => {
  // Initialize with new structure
  const [formData, setFormData] = useState<Partial<RegAccount>>({
    agentId: '',
    proxyId: '',
    metadata: {
      username: '',
      password: '',
      email: '',
      recoveryEmail: '',
      twoFactorAuth: '',
      cookies: '',
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [platform] = useState('google');
  const [proxies, setProxies] = useState<ProxyItem[]>([]);

  // 2FA State
  const [activeDrawer, setActiveDrawer] = useState<'details' | null>(null);
  const [drawerMode, setDrawerMode] = useState<'edit' | 'add'>('edit');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [newMethodTypeId, setNewMethodTypeId] = useState<string>('');
  const [drawerForm, setDrawerForm] = useState({ value: '', label: '' });

  const [activeMethods, setActiveMethods] = useState<string[]>([]);
  const [methodValues, setMethodValues] = useState<Record<string, string>>({});
  const [deletedMethods, setDeletedMethods] = useState<string[]>([]); // Track locally for UI logic

  // Track initial state for UI diffing
  const [initialActiveMethods, setInitialActiveMethods] = useState<string[]>([]);
  const [initialMethodValues, setInitialMethodValues] = useState<Record<string, string>>({});

  // Profile State
  const [profileViewMode, setProfileViewMode] = useState<'raw' | 'visual'>('visual');
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  const gitlabFolder = useMemo(() => localStorage.getItem('gitlab_repo_folder'), []);

  const extractData = (res: any) => {
    if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
      return res.data;
    }
    return res;
  };

  useEffect(() => {
    const loadProxies = async () => {
      if (!gitlabFolder) return;
      try {
        const result = await window.electron.ipcRenderer.invoke(
          'git:read-data',
          gitlabFolder,
          'proxies.json',
        );
        const data = extractData(result);
        if (data && Array.isArray(data)) {
          setProxies(data);
        }
      } catch (err) {
        console.error('Failed to load proxies:', err);
      }
    };
    loadProxies();
  }, [gitlabFolder]);

  useEffect(() => {
    if (isOpen && account) {
      setFormData({
        id: account.id,
        regSessionId: account.regSessionId,
        agentId: account.agentId || '',
        proxyId: account.proxyId || '',
        // Handle optional metadata safely
        metadata: {
          username: account.metadata?.username || '',
          password: account.metadata?.password || '',
          email: account.metadata?.email || '',
          recoveryEmail: account.metadata?.recoveryEmail || '',
          twoFactorAuth: account.metadata?.twoFactorAuth || '',
          cookies: account.metadata?.cookies || '',
          ...account.metadata,
        },
      });

      // Attempt to parse 2FA state from twoFactorAuth string if it is JSON
      try {
        const twoFactorAuth = account.metadata?.twoFactorAuth;
        if (twoFactorAuth && twoFactorAuth.startsWith('{')) {
          const parsed = JSON.parse(twoFactorAuth);
          setActiveMethods(parsed.activeMethods || []);
          setMethodValues(parsed.methodValues || {});
          setInitialActiveMethods(parsed.activeMethods || []);
          setInitialMethodValues(parsed.methodValues || {});
        } else if (twoFactorAuth) {
          // Fallback: treat as a single 'app' secret key
          setActiveMethods(['app']);
          setMethodValues({ app: twoFactorAuth });
          setInitialActiveMethods(['app']);
          setInitialMethodValues({ app: twoFactorAuth });
        } else {
          setActiveMethods([]);
          setMethodValues({});
          setInitialActiveMethods([]);
          setInitialMethodValues({});
        }
      } catch (e) {
        setActiveMethods([]);
        setMethodValues({});
        setInitialActiveMethods([]);
        setInitialMethodValues({});
      }
    } else if (isOpen) {
      // Reset for new account
      setFormData({
        agentId: '',
        proxyId: '',
        metadata: {
          username: '',
          password: '',
          email: '',
          recoveryEmail: '',
          twoFactorAuth: '',
          cookies: '',
        },
      });
      setActiveMethods([]);
      setMethodValues({});
      setDeletedMethods([]);
      setInitialActiveMethods([]);
      setInitialMethodValues({});
    }
  }, [isOpen, account]);

  const handleSave = useCallback(() => {
    // Serialize 2FA state
    const twoFactorAuthData = JSON.stringify({ activeMethods, methodValues });
    onSave({
      ...formData,
      metadata: {
        ...formData.metadata,
        username: formData.metadata?.username || '', // Ensure required fields
        twoFactorAuth: twoFactorAuthData,
      },
    });
    onClose();
  }, [formData, activeMethods, methodValues, onSave, onClose]);

  // A helper to update metadata
  const updateMetadata = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata!,
        [key]: value,
      },
    }));
  };

  // 2FA Handlers
  const availableToAdd = ALL_METHODS.filter(
    (m) => !activeMethods.includes(m.id) && !deletedMethods.includes(m.id),
  );

  const getMethodStyle = (type: string) => {
    switch (type) {
      case 'app':
        return { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: ScanLine };
      case 'sms':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: MessageSquare };
      case 'key':
        return { bg: 'bg-orange-500/10', text: 'text-orange-500', icon: Key };
      case 'prompt':
        return { bg: 'bg-red-500/10', text: 'text-red-500', icon: Smartphone };
      case 'email':
        return { bg: 'bg-purple-500/10', text: 'text-purple-500', icon: Mail };
      case 'codes':
        return { bg: 'bg-gray-500/10', text: 'text-gray-500', icon: Key };
      case 'hello':
        return { bg: 'bg-indigo-500/10', text: 'text-indigo-500', icon: User };
      default:
        return { bg: 'bg-primary/10', text: 'text-primary', icon: Shield };
    }
  };

  const handleMethodClick = (id: string) => {
    setSelectedMethodId(id);
    setDrawerMode('edit');
    const method = ALL_METHODS.find((m) => m.id === id);
    setDrawerForm({ value: methodValues[id] || '', label: method?.name || '' });
    setActiveDrawer('details');
  };

  const handleAddClick = () => {
    setDrawerMode('add');
    setNewMethodTypeId('');
    setDrawerForm({ value: '', label: '' });
    setActiveDrawer('details');
  };

  const handleSaveMethod = () => {
    if (drawerMode === 'add' && newMethodTypeId) {
      if (deletedMethods.includes(newMethodTypeId)) {
        setDeletedMethods((prev) => prev.filter((id) => id !== newMethodTypeId));
      }
      setActiveMethods((prev) => [...prev, newMethodTypeId]);
      setMethodValues((prev) => ({ ...prev, [newMethodTypeId]: drawerForm.value }));
    } else if (drawerMode === 'edit' && selectedMethodId) {
      setMethodValues((prev) => ({ ...prev, [selectedMethodId]: drawerForm.value }));
    }
    setActiveDrawer(null);
  };

  const handleRemoveMethod = () => {
    if (selectedMethodId) {
      setDeletedMethods((prev) => [...prev, selectedMethodId]);
      setActiveMethods((prev) => prev.filter((id) => id !== selectedMethodId));
      setActiveDrawer(null);
    }
  };

  const currentFocusedMethod =
    drawerMode === 'edit'
      ? ALL_METHODS.find((m) => m.id === selectedMethodId)
      : ALL_METHODS.find((m) => m.id === newMethodTypeId);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === formData.agentId),
    [agents, formData.agentId],
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      direction="right"
      width={600}
      className="!bg-drawer-background flex flex-col"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg tracking-tight">
            {account?.id ? 'Edit Account' : 'New Account'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Platform</label>
          <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/50">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium capitalize">Google</span>
          </div>
        </div>

        {platform === 'google' && (
          <>
            {/* Email / Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="text"
                value={formData.metadata?.email || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata!,
                      email: val,
                      username: val,
                    },
                  }));
                }}
                className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="example@gmail.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.metadata?.password || ''}
                  onChange={(e) => updateMetadata('password', e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 pr-9"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Recovery Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Recovery Email</label>
              <input
                type="email"
                value={formData.metadata?.recoveryEmail || ''}
                onChange={(e) => updateMetadata('recoveryEmail', e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="recovery@example.com"
              />
            </div>

            {/* 2FA Secret Section */}
            <div className="space-y-2">
              <TwoFactorSection
                activeMethods={activeMethods}
                deletedMethods={deletedMethods}
                allMethods={ALL_METHODS}
                methodValues={methodValues}
                initialActiveMethods={initialActiveMethods}
                initialMethodValues={initialMethodValues}
                selectedMethodId={selectedMethodId}
                onMethodClick={handleMethodClick}
                onAddClick={handleAddClick}
                getMethodStyle={getMethodStyle}
              />
            </div>

            {/* Profile / Cookies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Profile & Cookies</label>
                <div className="flex bg-muted/50 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setProfileViewMode('visual')}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium transition-all',
                      profileViewMode === 'visual'
                        ? 'bg-background shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Visual
                  </button>
                  <button
                    onClick={() => setProfileViewMode('raw')}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium transition-all',
                      profileViewMode === 'raw'
                        ? 'bg-background shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    JSON
                  </button>
                </div>
              </div>

              {profileViewMode === 'raw' ? (
                <div className="relative">
                  <Cookie className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    value={formData.metadata?.cookies || ''}
                    onChange={(e) => updateMetadata('cookies', e.target.value)}
                    className="w-full h-48 pl-9 pr-3 py-2 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono resize-none custom-scrollbar"
                    placeholder='[{"name":"SID","value":"..."}]'
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    let parsedCookies: any[] = [];
                    try {
                      const cookies = formData.metadata?.cookies;
                      if (cookies) parsedCookies = JSON.parse(cookies);
                    } catch (e) {}

                    // Find proxy details for display
                    const currentProxyItem = proxies.find(
                      (p) => p.id === formData.proxyId || p.proxy === formData.proxyId,
                    );
                    // The proxies state contains ProxyItem[]. ProxyItem has .proxy string.
                    // If formData.proxyId stores ID, great. If we store proxy string (legacy), we might need to match both.
                    // For now let's assume proxyId stores ID if available, or fall back to finding by proxy string if mismatched.

                    const mockProfile = {
                      id: account?.id || 'new',
                      userAgent: selectedAgent?.userAgent,
                      ip: currentProxyItem
                        ? currentProxyItem.proxy.split('@').pop()?.split(':')[0] || 'Unknown'
                        : 'Direct',
                      proxy: currentProxyItem?.proxy || 'No Proxy',
                      cookieCount: parsedCookies.length,
                    };

                    return (
                      <>
                        <ProfileDetails
                          account={{ ...account, id: account?.id || 'New Account' }}
                          profile={mockProfile}
                        />
                        {parsedCookies.length > 0 && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => setIsCookieModalOpen(true)}
                              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                            >
                              <Cookie className="w-3 h-3" /> View {parsedCookies.length} Cookies
                            </button>
                          </div>
                        )}
                        <CookieViewerModal
                          isOpen={isCookieModalOpen}
                          onClose={() => setIsCookieModalOpen(false)}
                          cookies={parsedCookies}
                        />
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </>
        )}

        {/* Agent */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Agent</label>
          <Dropdown className="w-full">
            <DropdownTrigger className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm flex items-center justify-between hover:border-primary/40 transition-colors">
              <span className="truncate">
                {selectedAgent ? (
                  selectedAgent.name
                ) : (
                  <span className="text-muted-foreground">Select Agent</span>
                )}
              </span>
            </DropdownTrigger>
            <DropdownContent className="w-[350px] max-h-[300px] overflow-y-auto">
              {agents.map((agent) => (
                <DropdownItem
                  key={agent.id}
                  onClick={() => setFormData((prev) => ({ ...prev, agentId: agent.id }))}
                  className={cn(
                    'py-2',
                    formData.agentId === agent.id && 'bg-primary/10 text-primary',
                  )}
                >
                  <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                    <span className="font-medium text-xs truncate">{agent.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate opacity-70">
                      {agent.os} • {agent.userAgent}
                    </span>
                  </div>
                </DropdownItem>
              ))}
              {agents.length === 0 && (
                <div className="p-3 text-center text-muted-foreground text-xs">No agents found</div>
              )}
            </DropdownContent>
          </Dropdown>
        </div>

        {/* Proxy */}
        {platform === 'google' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Proxy</label>
            <Dropdown className="w-full">
              <DropdownTrigger className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm flex items-center justify-between hover:border-primary/40 transition-colors">
                <span className="truncate flex-1 font-mono text-xs">
                  {(() => {
                    const p = proxies.find((px) => px.id === formData.proxyId);
                    return p ? (
                      p.proxy
                    ) : (
                      <span className="text-muted-foreground font-sans">
                        Select Proxy from List
                      </span>
                    );
                  })()}
                </span>
              </DropdownTrigger>
              <DropdownContent className="w-[500px] max-h-[300px] overflow-y-auto">
                {proxies.map((p) => (
                  <DropdownItem
                    key={p.id}
                    onClick={() => setFormData((prev) => ({ ...prev, proxyId: p.id }))}
                    className={cn(
                      'py-2',
                      formData.proxyId === p.id && 'bg-primary/10 text-primary',
                    )}
                  >
                    <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs truncate font-bold">{p.proxy}</span>
                        <span
                          className={cn(
                            'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded',
                            p.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-red-500/10 text-red-500',
                          )}
                        >
                          {p.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate opacity-70 flex items-center gap-1">
                        {p.countryCode && (
                          <img
                            src={`https://flagcdn.com/w20/${p.countryCode.toLowerCase()}.png`}
                            className="w-3 h-2 rounded-sm"
                          />
                        )}
                        {p.country} • {p.type}
                      </span>
                    </div>
                  </DropdownItem>
                ))}
                {proxies.length === 0 && (
                  <div className="p-3 text-center text-muted-foreground text-xs">
                    No proxies found via git sync
                  </div>
                )}
              </DropdownContent>
            </Dropdown>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border shrink-0 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Save Account
        </button>
      </div>

      <Drawer
        isOpen={!!activeDrawer}
        onClose={() => setActiveDrawer(null)}
        direction="right"
        width="35%"
        className="p-8 flex flex-col bg-background border-l border-border"
      >
        <button
          onClick={() => setActiveDrawer(null)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground z-50"
        >
          <X className="w-5 h-5" />
        </button>
        {activeDrawer === 'details' && (
          <MethodDrawer
            drawerMode={drawerMode}
            currentFocusedMethod={currentFocusedMethod}
            availableToAdd={availableToAdd}
            drawerForm={drawerForm}
            setDrawerForm={setDrawerForm}
            newMethodTypeId={newMethodTypeId}
            setNewMethodTypeId={setNewMethodTypeId}
            getMethodStyle={getMethodStyle}
            handleSave={handleSaveMethod}
            handleRemove={handleRemoveMethod}
            onCancel={() => setActiveDrawer(null)}
          />
        )}
      </Drawer>
    </Drawer>
  );
});

export default AccountDrawer;
