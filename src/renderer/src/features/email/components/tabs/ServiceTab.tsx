import { useState } from 'react';
import {
  Search,
  Globe,
  Key,
  Shield,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Plus,
  ScanLine,
  MessageSquare,
  User,
  Database,
  Lock,
  X,
  Save,
  Trash2,
  Smartphone,
  Mail,
  Check,
} from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
// import { mockServices, Service } from '../../mock/services'; // Removed mock

const SectionHeader = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 text-foreground/80 pb-4 border-b border-border/50 mb-6">
    <span className="text-base font-semibold tracking-tight">{label}</span>
  </div>
);

const InputGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

import { ServiceItem } from '../../mock/accounts';

interface ServiceTabProps {
  services: ServiceItem[];
  onUpdate?: (services: ServiceItem[]) => void;
}

const ServiceTab = ({ services }: ServiceTabProps) => {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(
    services && services.length > 0 ? services[0] : null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 1. Global 2FA Methods Definition
  const ALL_METHODS = [
    { id: 'app', name: 'Authenticator App', type: 'app', placeholder: 'Not configured' },
    { id: 'sms', name: 'Phone Verification', type: 'sms', placeholder: 'No phone linked' },
    { id: 'email', name: 'Recovery Email', type: 'email', placeholder: 'No email added' },
    { id: 'key', name: 'Security Key', type: 'key', placeholder: 'No key added' },
    { id: 'prompt', name: 'Device Prompt', type: 'prompt', placeholder: 'Not set up' },
    { id: 'hello', name: 'Windows Hello', type: 'hello', placeholder: 'Not set up' },
    { id: 'codes', name: 'Backup Codes', type: 'codes', placeholder: 'Generate codes' },
  ];

  // 2. States for 2FA and Secrets
  const [activeMethods, setActiveMethods] = useState<string[]>([]);
  const [initialActiveMethods] = useState<string[]>([]);

  const [methodValues, setMethodValues] = useState<Record<string, string>>({});
  const [initialMethodValues] = useState<Record<string, string>>({});

  const [secrets, setSecrets] = useState<any[]>([]);
  const [initialSecrets] = useState<any[]>([]);

  const [deletedMethods, setDeletedMethods] = useState<string[]>([]);
  const [deletedSecrets, setDeletedSecrets] = useState<string[]>([]);

  // 3. Unified Drawer Logic
  const [activeDrawer, setActiveDrawer] = useState<'2fa' | 'secret' | 'review' | null>(null);

  // 2FA Drawer State
  const [drawer2FAMode, setDrawer2FAMode] = useState<'edit' | 'add'>('edit');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [newMethodTypeId, setNewMethodTypeId] = useState<string>('');
  const [drawer2FAValue, setDrawer2FAValue] = useState('');

  // Secret Drawer State
  const [secretDrawerMode, setSecretDrawerMode] = useState<'edit' | 'add'>('edit');
  const [selectedSecretId, setSelectedSecretId] = useState<string | null>(null);
  const [secretForm, setSecretForm] = useState({ key: '', value: '' });

  // --- Handlers ---
  const handleMethodClick = (id: string) => {
    setSelectedMethodId(id);
    setDrawer2FAMode('edit');
    setDrawer2FAValue(methodValues[id] || '');
    setActiveDrawer('2fa');
  };

  const handleAdd2FAClick = () => {
    setDrawer2FAMode('add');
    setNewMethodTypeId('');
    setDrawer2FAValue('');
    setActiveDrawer('2fa');
  };

  const handleSave2FA = () => {
    if (drawer2FAMode === 'add' && newMethodTypeId) {
      if (deletedMethods.includes(newMethodTypeId)) {
        setDeletedMethods((prev) => prev.filter((id) => id !== newMethodTypeId));
      }
      setActiveMethods((prev) => [...prev, newMethodTypeId]);
      setMethodValues((prev) => ({ ...prev, [newMethodTypeId]: drawer2FAValue }));
    } else if (drawer2FAMode === 'edit' && selectedMethodId) {
      setMethodValues((prev) => ({ ...prev, [selectedMethodId]: drawer2FAValue }));
    }
    setActiveDrawer(null);
  };

  const handleDelete2FA = () => {
    if (selectedMethodId) {
      if (initialActiveMethods.includes(selectedMethodId)) {
        setDeletedMethods((prev) => [...prev, selectedMethodId]);
        setActiveMethods((prev) => prev.filter((id) => id !== selectedMethodId));
      } else {
        setActiveMethods((prev) => prev.filter((id) => id !== selectedMethodId));
      }
      setActiveDrawer(null);
    }
  };

  const handleSecretClick = (id: string) => {
    const secret = secrets.find((s) => s.id === id);
    if (secret) {
      setSelectedSecretId(id);
      setSecretForm({ key: secret.key, value: secret.value });
      setSecretDrawerMode('edit');
      setActiveDrawer('secret');
    }
  };

  const handleAddSecretClick = () => {
    setSelectedSecretId(null);
    setSecretForm({ key: '', value: '' });
    setSecretDrawerMode('add');
    setActiveDrawer('secret');
  };

  const handleSaveSecret = () => {
    if (secretDrawerMode === 'add') {
      const newSecret = {
        id: Math.random().toString(36).substr(2, 9),
        key: secretForm.key || 'NEW_KEY',
        value: secretForm.value,
        active: true,
      };
      setSecrets((prev) => [...prev, newSecret]);
    } else if (secretDrawerMode === 'edit' && selectedSecretId) {
      if (deletedSecrets.includes(selectedSecretId)) {
        setDeletedSecrets((prev) => prev.filter((id) => id !== selectedSecretId));
      }
      setSecrets((prev) =>
        prev.map((s) =>
          s.id === selectedSecretId ? { ...s, key: secretForm.key, value: secretForm.value } : s,
        ),
      );
    }
    setActiveDrawer(null);
  };

  const handleDeleteSecret = () => {
    if (selectedSecretId) {
      const isInitial = initialSecrets.some((s) => s.id === selectedSecretId);
      if (isInitial) {
        setDeletedSecrets((prev) => [...prev, selectedSecretId]);
        setSecrets((prev) => prev.filter((s) => s.id !== selectedSecretId));
      } else {
        setSecrets((prev) => prev.filter((s) => s.id !== selectedSecretId));
      }
      setActiveDrawer(null);
    }
  };

  const getChanges = () => {
    const changes: {
      type: 'modify' | 'add' | 'delete';
      area: string;
      label: string;
      oldValue?: string;
      newValue?: string;
      methodId?: string;
      isSecret?: boolean;
    }[] = [];

    // 2FA changes
    activeMethods.forEach((id) => {
      const isAdded = !initialActiveMethods.includes(id);
      const isModified =
        initialActiveMethods.includes(id) && methodValues[id] !== initialMethodValues[id];

      if (isAdded) {
        const method = ALL_METHODS.find((m) => m.id === id);
        changes.push({
          type: 'add',
          area: 'Two-Factor Authentication',
          label: method?.name || id,
          newValue: methodValues[id],
          methodId: id,
        });
      } else if (isModified) {
        const method = ALL_METHODS.find((m) => m.id === id);
        changes.push({
          type: 'modify',
          area: 'Two-Factor Authentication',
          label: method?.name || id,
          oldValue: initialMethodValues[id],
          newValue: methodValues[id],
          methodId: id,
        });
      }
    });

    deletedMethods.forEach((id) => {
      const method = ALL_METHODS.find((m) => m.id === id);
      changes.push({
        type: 'delete',
        area: 'Two-Factor Authentication',
        label: method?.name || id,
        oldValue: initialMethodValues[id],
        methodId: id,
      });
    });

    // Secrets changes
    secrets.forEach((secret) => {
      const initial = initialSecrets.find((s) => s.id === secret.id);
      if (!initial) {
        changes.push({
          type: 'add',
          area: 'Secrets & Keys',
          label: secret.key || 'Secret',
          newValue: secret.value,
          isSecret: true,
        });
      } else if (secret.key !== initial.key || secret.value !== initial.value) {
        changes.push({
          type: 'modify',
          area: 'Secrets & Keys',
          label: secret.key || 'Secret',
          oldValue: initial.value,
          newValue: secret.value,
          isSecret: true,
        });
      }
    });

    deletedSecrets.forEach((id) => {
      const initial = initialSecrets.find((s) => s.id === id);
      changes.push({
        type: 'delete',
        area: 'Secrets & Keys',
        label: initial?.key || 'Secret',
        oldValue: initial?.value,
        isSecret: true,
      });
    });

    return changes;
  };

  const pendingChanges = getChanges();

  // Helpers
  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getFaviconUrl = (url: string) => {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=https://${domain}&sz=64`;
    } catch {
      return '';
    }
  };

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
        return { bg: 'bg-gray-500/10', text: 'text-gray-500', icon: Copy };
      case 'hello':
        return { bg: 'bg-indigo-500/10', text: 'text-indigo-500', icon: User };
      default:
        return { bg: 'bg-primary/10', text: 'text-primary', icon: Shield };
    }
  };

  const availableToAdd = ALL_METHODS.filter((m) => !activeMethods.includes(m.id));
  const currentFocusedMethod =
    drawer2FAMode === 'edit'
      ? ALL_METHODS.find((m) => m.id === selectedMethodId)
      : ALL_METHODS.find((m) => m.id === newMethodTypeId);

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="flex h-full w-full overflow-hidden">
        {/* Sidebar */}
        <div className="w-[300px] border-r border-border flex flex-col bg-muted/5 shrink-0">
          <div className="p-3 border-b border-border">
            <div className="relative group">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search services..."
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-background border border-input text-sm focus-visible:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={cn(
                  'group p-3 rounded-lg cursor-pointer flex items-center gap-3 border transition-all',
                  selectedService?.id === service.id
                    ? 'bg-background border-border shadow-sm'
                    : 'border-transparent hover:bg-muted/50',
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 p-2 overflow-hidden">
                  <img
                    src={getFaviconUrl(service.websiteUrl)}
                    alt={service.name}
                    className="w-full h-full object-contain opacity-80"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={cn(
                      'font-medium text-sm truncate',
                      selectedService?.id === service.id ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {service.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate opacity-80">
                    {service.username}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-background relative">
          {selectedService ? (
            <div className="flex flex-col gap-10 max-w-5xl">
              {/* Information */}
              <div>
                <SectionHeader label="Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <InputGroup label="Service Name">
                    <div className="relative group">
                      <Database className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <input
                        className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        value={selectedService.name}
                        readOnly
                      />
                    </div>
                  </InputGroup>
                  <InputGroup label="Website URL">
                    <div className="relative group">
                      <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <input
                        className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-10 text-sm focus-visible:outline-none text-blue-500 hover:underline cursor-pointer"
                        value={selectedService.websiteUrl}
                        readOnly
                        onClick={() => window.open(selectedService.websiteUrl, '_blank')}
                      />
                      <ExternalLink className="absolute right-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                    </div>
                  </InputGroup>
                  <InputGroup label="Username / Email">
                    <div className="relative group">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <input
                        className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-10 text-sm focus-visible:outline-none"
                        value={selectedService.username}
                        readOnly
                      />
                      <Copy className="absolute right-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                    </div>
                  </InputGroup>
                  <InputGroup label="Password">
                    <div className="relative group">
                      <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-20 text-sm focus-visible:outline-none font-mono tracking-widest"
                        value={selectedService.password || ''}
                        readOnly
                      />
                      <div className="absolute right-3.5 top-3.5 flex items-center gap-2">
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </InputGroup>
                </div>
              </div>

              {/* 2FA Section */}
              <div>
                <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
                  <span className="text-base font-semibold tracking-tight">
                    Two-Factor Authentication
                  </span>
                  <button
                    onClick={handleAdd2FAClick}
                    className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Method
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...activeMethods, ...deletedMethods].map((id) => {
                    const method = ALL_METHODS.find((m) => m.id === id)!;
                    const value = methodValues[id];
                    const isDeleted = deletedMethods.includes(id);
                    const isAdded = !initialActiveMethods.includes(id);
                    const isModified =
                      initialActiveMethods.includes(id) &&
                      methodValues[id] !== initialMethodValues[id];

                    return (
                      <div
                        key={method.id}
                        onClick={() => !isDeleted && handleMethodClick(method.id)}
                        className={cn(
                          'group relative flex items-center gap-4 py-3 px-4 rounded-xl border transition-all',
                          !isDeleted
                            ? 'cursor-pointer border-border hover:border-primary/40'
                            : 'cursor-not-allowed border-red-500 border-dashed bg-red-500/5 opacity-60',
                          'bg-card shadow-sm',
                          isAdded && 'border-green-500 border-dashed',
                          isModified && !isDeleted && 'border-yellow-500 border-dashed',
                        )}
                      >
                        <div className="w-12 h-12 flex items-center justify-center shrink-0">
                          <img
                            src={getFaviconUrl(selectedService.websiteUrl)}
                            alt={selectedService.name}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-medium text-sm text-foreground">{method.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {value || method.placeholder}
                          </p>
                        </div>
                        {!isDeleted && (
                          <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500" />
                        )}
                        {isDeleted && (
                          <div className="absolute top-3 right-3 text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Secrets Section */}
              <div>
                <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
                  <span className="text-base font-semibold tracking-tight">Secrets & Keys</span>
                  <button
                    onClick={handleAddSecretClick}
                    className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Secret
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    ...secrets,
                    ...initialSecrets
                      .filter((is) => deletedSecrets.includes(is.id))
                      .map((is) => ({ ...is, status: 'deleted' })),
                  ].map((secret) => {
                    const isDeleted = 'status' in secret && secret.status === 'deleted';
                    const initialSecret = initialSecrets.find((is) => is.id === secret.id);
                    const isAdded = !initialSecret;
                    const isModified =
                      initialSecret &&
                      (secret.key !== initialSecret.key || secret.value !== initialSecret.value);

                    return (
                      <div
                        key={secret.id}
                        onClick={() => !isDeleted && handleSecretClick(secret.id)}
                        className={cn(
                          'group relative flex items-center gap-4 py-3 px-4 rounded-xl border transition-all',
                          !isDeleted
                            ? 'cursor-pointer border-border hover:border-primary/40'
                            : 'cursor-not-allowed border-red-500 border-dashed bg-red-500/5 opacity-60',
                          'bg-card shadow-sm',
                          selectedSecretId === secret.id && 'ring-2 ring-primary border-primary',
                          isAdded && 'border-green-500 border-dashed',
                          isModified && !isDeleted && 'border-yellow-500 border-dashed',
                        )}
                      >
                        <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-amber-500/10 rounded-xl text-amber-500">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <h3 className="font-medium text-sm text-foreground truncate">
                            {secret.key}
                          </h3>
                          <p className="text-xs text-muted-foreground font-mono truncate opacity-80">
                            {secret.value}
                          </p>
                        </div>
                        {secret.active && !isDeleted && (
                          <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500" />
                        )}
                        {isDeleted && (
                          <div className="absolute top-3 right-3 text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <Globe className="w-12 h-12 opacity-20" />
              <p>Select a service to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* --- DRAWERS --- */}

      {/* Backdrop */}
      {activeDrawer && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in transition-all"
          onClick={() => setActiveDrawer(null)}
        />
      )}

      {/* Unified Drawer Container */}
      <div
        className={cn(
          'absolute top-0 right-0 h-full w-[35%] bg-background border-l border-border z-50 shadow-2xl transition-transform duration-500 ease-in-out transform p-8 flex flex-col',
          activeDrawer ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <button
          onClick={() => setActiveDrawer(null)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {activeDrawer === '2fa' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-4 mb-8">
              {currentFocusedMethod ? (
                <>
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                      getMethodStyle(currentFocusedMethod.type).bg,
                      getMethodStyle(currentFocusedMethod.type).text,
                    )}
                  >
                    {(() => {
                      const Icon = getMethodStyle(currentFocusedMethod.type).icon;
                      return <Icon className="w-7 h-7" />;
                    })()}
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">{currentFocusedMethod.name}</h2>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                    <Plus className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Add 2FA Method</h2>
                    <p className="text-xs text-muted-foreground">Select a method</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6 flex-1">
              {drawer2FAMode === 'add' && !newMethodTypeId ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase border-b border-border/40 pb-2">
                    Available Methods
                  </h3>
                  {activeMethods.length >= 2 ? (
                    <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                      <p className="text-sm font-medium text-orange-500">Limit Reached</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {availableToAdd.map((m) => {
                        const style = getMethodStyle(m.type);
                        const Icon = style.icon;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setNewMethodTypeId(m.id)}
                            className="flex items-center gap-4 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left"
                          >
                            <div
                              className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                style.bg,
                                style.text,
                              )}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{m.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Click to configure
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase border-b border-border/40 pb-2">
                    Configuration
                  </h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Identifier / Value</label>
                    <input
                      className="flex h-11 w-full rounded-lg border border-border bg-input px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={drawer2FAValue}
                      onChange={(e) => setDrawer2FAValue(e.target.value)}
                      placeholder={currentFocusedMethod?.placeholder}
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border mt-auto flex items-center gap-3">
              {drawer2FAMode === 'edit' && (
                <button
                  onClick={handleDelete2FA}
                  className="h-11 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors mr-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                disabled={drawer2FAMode === 'add' && !newMethodTypeId}
                onClick={handleSave2FA}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {drawer2FAMode === 'add' ? 'Add Method' : 'Save Changes'}
              </button>
              <button
                onClick={() => setActiveDrawer(null)}
                className="h-11 px-6 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeDrawer === 'secret' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
                <Key className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {secretDrawerMode === 'add' ? 'Add New Secret' : 'Edit Secret'}
              </h2>
            </div>
            <div className="space-y-6 flex-1">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase border-b border-border/40 pb-2">
                  Configuration
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Key Name</label>
                  <input
                    className="flex h-11 w-full rounded-lg border border-border bg-input px-4 text-sm font-mono focus-visible:outline-none"
                    value={secretForm.key}
                    onChange={(e) => setSecretForm((p) => ({ ...p, key: e.target.value }))}
                    placeholder="e.g. API_KEY"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Value</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-lg border border-border bg-input px-4 py-3 text-sm font-mono resize-none focus-visible:outline-none"
                    value={secretForm.value}
                    onChange={(e) => setSecretForm((p) => ({ ...p, value: e.target.value }))}
                    placeholder="Paste secret here..."
                  />
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-border mt-auto flex items-center gap-3">
              {secretDrawerMode === 'edit' && (
                <button
                  onClick={handleDeleteSecret}
                  className="h-11 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors mr-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSaveSecret}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Secret
              </button>
              <button
                onClick={() => setActiveDrawer(null)}
                className="h-11 px-6 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeDrawer === 'review' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Review Changes</h2>
                <p className="text-xs text-muted-foreground">Verify your service updates</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {pendingChanges.length > 0 ? (
                <div className="space-y-6">
                  {['Two-Factor Authentication', 'Secrets & Keys'].map((area) => {
                    const areaChanges = pendingChanges.filter((c) => c.area === area);
                    if (areaChanges.length === 0) return null;

                    return (
                      <div key={area} className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          {area}
                        </h3>
                        <div className="space-y-3">
                          {areaChanges.map((c, i) => {
                            const is2FA = area === 'Two-Factor Authentication';
                            const isSecret = area === 'Secrets & Keys';

                            if (is2FA || isSecret) {
                              const style = is2FA
                                ? getMethodStyle(ALL_METHODS.find((m) => m.id === c.methodId)!.type)
                                : { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Lock };
                              const Icon = style.icon;

                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    'flex items-start gap-4 p-3 rounded-lg border',
                                    c.type === 'add'
                                      ? 'border-green-500/30 bg-green-500/5'
                                      : c.type === 'modify'
                                        ? 'border-yellow-500/30 bg-yellow-500/5'
                                        : 'border-red-500/30 bg-red-500/5',
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                                      style.bg,
                                      style.text,
                                    )}
                                  >
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-sm truncate text-foreground/90">
                                        {c.label}
                                      </span>
                                      <span
                                        className={cn(
                                          'text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter shrink-0',
                                          c.type === 'add' && 'text-green-600 bg-green-500/10',
                                          c.type === 'modify' && 'text-yellow-600 bg-yellow-500/10',
                                          c.type === 'delete' && 'text-red-600 bg-red-500/10',
                                        )}
                                      >
                                        {c.type === 'modify' ? 'Modified' : c.type}
                                      </span>
                                    </div>
                                    <div className="grid gap-1 px-1 text-[11px]">
                                      {(c.type === 'modify' || c.type === 'delete') && (
                                        <div className="flex gap-2 min-w-0">
                                          <span className="text-muted-foreground w-8 shrink-0">
                                            FROM
                                          </span>
                                          <span className="text-red-500 line-through truncate">
                                            {c.oldValue || '—'}
                                          </span>
                                        </div>
                                      )}
                                      {(c.type === 'modify' || c.type === 'add') && (
                                        <div className="flex gap-2 min-w-0">
                                          <span className="text-muted-foreground w-8 shrink-0">
                                            TO
                                          </span>
                                          <span className="text-green-600 font-semibold truncate">
                                            {c.newValue || '—'}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={i}
                                className={cn(
                                  'flex flex-col gap-2 p-3 rounded-lg border',
                                  c.type === 'add'
                                    ? 'border-green-500/30 bg-green-500/5'
                                    : c.type === 'modify'
                                      ? 'border-yellow-500/30 bg-yellow-500/5'
                                      : 'border-red-500/30 bg-red-500/5',
                                )}
                              >
                                <div className="flex justify-between items-center pr-1">
                                  <span className="font-bold text-sm truncate text-foreground/90">
                                    {c.label}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter shrink-0',
                                      c.type === 'add' && 'text-green-600 bg-green-500/10',
                                      c.type === 'modify' && 'text-yellow-600 bg-yellow-500/10',
                                      c.type === 'delete' && 'text-red-600 bg-red-500/10',
                                    )}
                                  >
                                    {c.type}
                                  </span>
                                </div>
                                <div className="grid gap-1 px-1 text-[11px]">
                                  {(c.type === 'modify' || c.type === 'delete') && (
                                    <div className="flex gap-2 min-w-0">
                                      <span className="text-muted-foreground w-10 shrink-0">
                                        FROM
                                      </span>
                                      <span className="text-red-500 line-through truncate">
                                        {c.oldValue || '—'}
                                      </span>
                                    </div>
                                  )}
                                  {(c.type === 'modify' || c.type === 'add') && (
                                    <div className="flex gap-2 min-w-0">
                                      <span className="text-muted-foreground w-10 shrink-0">
                                        TO
                                      </span>
                                      <span className="text-green-600 font-semibold truncate">
                                        {c.newValue || '—'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Check className="w-8 h-8 opacity-20" />
                  <p>No changes to review</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border mt-auto flex flex-col gap-3">
              <button
                onClick={() => {
                  setActiveDrawer(null);
                  alert('Success: Service changes updated!');
                }}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Complete Update
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Update Floating Button */}
      {pendingChanges.length > 0 && (
        <button
          onClick={() => setActiveDrawer('review')}
          className="absolute bottom-6 right-6 bg-primary text-primary-foreground h-10 px-6 rounded-md shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-[45] text-sm font-bold animate-in slide-in-from-bottom-5 border border-primary/20"
        >
          Update {pendingChanges.length}
        </button>
      )}
    </div>
  );
};

export default ServiceTab;
