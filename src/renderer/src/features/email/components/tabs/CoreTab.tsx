import { Account } from '../../mock/accounts';
import { cn } from '../../../../shared/lib/utils';
import { useState, useMemo } from 'react';
import {
  User,
  Mail,
  Shield,
  Smartphone,
  Key,
  AtSign,
  Copy,
  Eye,
  EyeOff,
  Plus,
  ScanLine,
  MessageSquare,
  X,
  Save,
  Trash2,
} from 'lucide-react';

interface CoreTabProps {
  account: Account;
  onUpdate?: (account: Account) => void;
}

interface TwoFactorOption {
  id: string;
  name: string;
  type: string;
  placeholder: string;
}

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

const CoreTab = ({ account, onUpdate }: CoreTabProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'details' | 'review' | null>(null);
  const [drawerMode, setDrawerMode] = useState<'edit' | 'add'>('edit');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [newMethodTypeId, setNewMethodTypeId] = useState<string>('');

  const [form, setForm] = useState({
    name: account.name || '',
    username: '',
    email: account.email || '',
    password: account.password || '',
    recoveryEmail: account.recoveryEmail || '',
    phoneNumber: account.phone || '',
  });

  const initialForm = useMemo(
    () => ({
      name: account.name || '',
      username: '',
      email: account.email || '',
      password: account.password || '',
      recoveryEmail: account.recoveryEmail || '',
      phoneNumber: account.phone || '',
    }),
    [account],
  );

  const [drawerForm, setDrawerForm] = useState({ value: '', label: '' });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const ALL_METHODS: TwoFactorOption[] = [
    { id: 'app', name: 'Authenticator App', type: 'app', placeholder: 'Not configured' },
    { id: 'sms', name: 'Phone Verification', type: 'sms', placeholder: 'No phone linked' },
    { id: 'email', name: 'Recovery Email', type: 'email', placeholder: 'No email added' },
    { id: 'key', name: 'Security Key', type: 'key', placeholder: 'No key added' },
    { id: 'prompt', name: 'Device Prompt', type: 'prompt', placeholder: 'Not set up' },
    { id: 'hello', name: 'Windows Hello', type: 'hello', placeholder: 'Not set up' },
    { id: 'codes', name: 'Backup Codes', type: 'codes', placeholder: 'Generate codes' },
  ];

  const [activeMethods, setActiveMethods] = useState<string[]>([]);
  const [initialActiveMethods] = useState<string[]>([]);

  const [methodValues, setMethodValues] = useState<Record<string, string>>({
    app: '',
    sms: account.phone || '',
    email: account.recoveryEmail || '',
    key: '',
    prompt: '',
    codes: '',
    hello: '',
  });
  const [initialMethodValues] = useState<Record<string, string>>({
    app: '',
    sms: account.phone || '',
    email: account.recoveryEmail || '',
    key: '',
    prompt: '',
    codes: '',
    hello: '',
  });

  const [deletedMethods, setDeletedMethods] = useState<string[]>([]);

  const availableToAdd = ALL_METHODS.filter(
    (m) => !activeMethods.includes(m.id) && !deletedMethods.includes(m.id),
  );

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

  const handleSave = () => {
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

  const handleRemove = () => {
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

  const getChanges = () => {
    const changes: {
      type: 'modify' | 'add' | 'delete';
      area: string;
      label: string;
      oldValue?: string;
      newValue?: string;
      methodId?: string;
    }[] = [];
    (Object.keys(form) as Array<keyof typeof form>).forEach((key) => {
      if (form[key] !== initialForm[key]) {
        changes.push({
          type: form[key] === '' ? 'delete' : 'modify',
          area: 'Information',
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          oldValue: initialForm[key],
          newValue: form[key],
        });
      }
    });

    activeMethods.forEach((id) => {
      const isAdded = !initialActiveMethods.includes(id);
      const isModified =
        initialActiveMethods.includes(id) && methodValues[id] !== initialMethodValues[id];
      if (isAdded) {
        changes.push({
          type: 'add',
          area: 'Two-Factor Authentication',
          label: ALL_METHODS.find((m) => m.id === id)?.name || id,
          newValue: methodValues[id],
          methodId: id,
        });
      } else if (isModified) {
        changes.push({
          type: 'modify',
          area: 'Two-Factor Authentication',
          label: ALL_METHODS.find((m) => m.id === id)?.name || id,
          oldValue: initialMethodValues[id],
          newValue: methodValues[id],
          methodId: id,
        });
      }
    });

    deletedMethods.forEach((id) => {
      changes.push({
        type: 'delete',
        area: 'Two-Factor Authentication',
        label: ALL_METHODS.find((m) => m.id === id)?.name || id,
        oldValue: initialMethodValues[id],
        methodId: id,
      });
    });
    return changes;
  };

  const pendingChanges = getChanges();

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

  const currentFocusedMethod =
    drawerMode === 'edit'
      ? ALL_METHODS.find((m) => m.id === selectedMethodId)
      : ALL_METHODS.find((m) => m.id === newMethodTypeId);

  return (
    <div className="relative h-full overflow-hidden">
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="flex flex-col gap-10">
          <div className="animate-in slide-in-from-bottom-2 duration-500 delay-100">
            <SectionHeader label="Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <InputGroup label="Email Address">
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    className={cn(
                      'flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                      form.email !== initialForm.email &&
                        (form.email === ''
                          ? 'border-red-500 border-dashed'
                          : 'border-yellow-500 border-dashed'),
                    )}
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </InputGroup>
              <InputGroup label="Password">
                <div className="relative group">
                  <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={cn(
                      'flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-10 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary font-mono tracking-widest',
                      form.password !== initialForm.password &&
                        (form.password === ''
                          ? 'border-red-500 border-dashed'
                          : 'border-yellow-500 border-dashed'),
                    )}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </InputGroup>
              <InputGroup label="Username">
                <div className="relative group">
                  <AtSign className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    className={cn(
                      'flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                      form.username !== initialForm.username &&
                        (form.username === ''
                          ? 'border-red-500 border-dashed'
                          : 'border-yellow-500 border-dashed'),
                    )}
                    value={form.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                  />
                </div>
              </InputGroup>
              <InputGroup label="Full Name">
                <div className="relative group">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    className={cn(
                      'flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                      form.name !== initialForm.name &&
                        (form.name === ''
                          ? 'border-red-500 border-dashed'
                          : 'border-yellow-500 border-dashed'),
                    )}
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>
              </InputGroup>
            </div>
          </div>

          <div className="animate-in slide-in-from-bottom-2 duration-500 delay-200">
            <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
              <span className="text-base font-semibold tracking-tight">
                Two-Factor Authentication
              </span>
              <button
                onClick={handleAddClick}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md"
              >
                <Plus className="w-3.5 h-3.5" /> Add Method
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...activeMethods, ...deletedMethods].map((id) => {
                const method = ALL_METHODS.find((m) => m.id === id)!;
                const value = methodValues[id];
                const style = getMethodStyle(method.type);
                const Icon = style.icon;
                const isAdded = !initialActiveMethods.includes(id);
                const isDeleted = deletedMethods.includes(id);
                const isModified =
                  initialActiveMethods.includes(id) && methodValues[id] !== initialMethodValues[id];

                return (
                  <div
                    key={id}
                    onClick={() => !isDeleted && handleMethodClick(id)}
                    className={cn(
                      'group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300',
                      !isDeleted
                        ? 'cursor-pointer border-border hover:border-primary/40'
                        : 'cursor-not-allowed border-red-500 border-dashed bg-red-500/5 opacity-60',
                      'bg-card shadow-sm',
                      isAdded && 'border-green-500 border-dashed',
                      isModified && !isDeleted && 'border-yellow-500 border-dashed',
                      selectedMethodId === id && 'ring-2 ring-primary border-primary',
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        style.bg,
                        style.text,
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col min-w-0 pr-4">
                      <h3 className="font-medium text-sm truncate">{method.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {value || method.placeholder}
                      </p>
                    </div>
                    {!isDeleted ? (
                      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
                    ) : (
                      <Trash2 className="absolute top-4 right-4 w-3 h-3 text-red-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {pendingChanges.length > 0 && (
        <button
          onClick={() => setActiveDrawer('review')}
          className="absolute bottom-6 right-6 bg-primary text-primary-foreground h-10 px-6 rounded-md shadow-xl flex items-center justify-center text-sm font-bold z-[45] transform active:scale-95 transition-all"
        >
          Update {pendingChanges.length}
        </button>
      )}

      {activeDrawer && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[50] animate-in fade-in duration-300"
          onClick={() => setActiveDrawer(null)}
        />
      )}

      <div
        className={cn(
          'absolute top-0 right-0 h-full w-[35%] bg-background border-l border-border z-[60] shadow-2xl transition-transform duration-500 flex flex-col p-8',
          activeDrawer ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <button
          onClick={() => setActiveDrawer(null)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {activeDrawer === 'details' && (
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
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      {currentFocusedMethod.name}
                    </h2>
                    <span
                      className={cn(
                        'inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase',
                        drawerMode === 'edit'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-primary/10 text-primary',
                      )}
                    >
                      {drawerMode === 'edit' ? 'Active' : 'New Configuration'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                    <Plus className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Add 2FA Method</h2>
                    <p className="text-xs text-muted-foreground">Select a method to configure</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-6 flex-1">
              {drawerMode === 'add' && !newMethodTypeId ? (
                <div className="grid gap-3">
                  {availableToAdd.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setNewMethodTypeId(m.id)}
                      className="flex items-center gap-4 p-3 rounded-xl border hover:border-primary/40 hover:bg-muted/30 text-left transition-all"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          getMethodStyle(m.type).bg,
                          getMethodStyle(m.type).text,
                        )}
                      >
                        {(() => {
                          const Icon = getMethodStyle(m.type).icon;
                          return <Icon className="w-5 h-5" />;
                        })()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{m.name}</div>
                        <div className="text-xs text-muted-foreground">Click to configure</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Identifier / Value</label>
                  <input
                    className="flex h-11 w-full rounded-lg border border-border bg-input px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={drawerForm.value}
                    onChange={(e) => setDrawerForm((p) => ({ ...p, value: e.target.value }))}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground italic">
                    Detailed configuration value (unmasked).
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t flex items-center gap-3">
              {drawerMode === 'edit' && (
                <button
                  onClick={handleRemove}
                  className="h-11 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 mr-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSave}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={() => setActiveDrawer(null)}
                className="h-11 px-6 rounded-lg border hover:bg-muted"
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
                <p className="text-xs text-muted-foreground">Verify your updates</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              {['Information', 'Two-Factor Authentication'].map((area) => {
                const areaChanges = pendingChanges.filter((c) => c.area === area);
                if (areaChanges.length === 0) return null;
                return (
                  <div key={area} className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                      {area}
                    </h3>
                    <div className="space-y-3">
                      {areaChanges.map((c, i) => {
                        if (area === 'Two-Factor Authentication' && c.methodId) {
                          const method = ALL_METHODS.find((m) => m.id === c.methodId)!;
                          const style = getMethodStyle(method.type);
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
                                      <span className="text-muted-foreground w-8 shrink-0">TO</span>
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
                                {c.type === 'modify' ? 'Modified' : c.type}
                              </span>
                            </div>
                            <div className="grid gap-1 px-1 text-[11px]">
                              {(c.type === 'modify' || c.type === 'delete') && (
                                <div className="flex gap-2 min-w-0">
                                  <span className="text-muted-foreground w-10 shrink-0">FROM</span>
                                  <span className="text-red-500 line-through truncate">
                                    {c.oldValue || '—'}
                                  </span>
                                </div>
                              )}
                              {(c.type === 'modify' || c.type === 'add') && (
                                <div className="flex gap-2 min-w-0">
                                  <span className="text-muted-foreground w-10 shrink-0">TO</span>
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
            <button
              onClick={() => {
                setActiveDrawer(null);
                if (onUpdate) {
                  const updatedAccount: Account = {
                    ...account,
                    name: form.name,
                    email: form.email,
                    recoveryEmail: form.recoveryEmail,
                    phone: form.phoneNumber,
                  };
                  onUpdate(updatedAccount);
                }
              }}
              className="mt-8 w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all"
            >
              <Save className="w-5 h-5" />
              Complete Update
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoreTab;
