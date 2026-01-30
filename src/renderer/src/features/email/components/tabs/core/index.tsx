import { Account } from '../../../mock/accounts';
import { cn } from '../../../../../shared/lib/utils';
import { useState, useMemo } from 'react';
import { User, Mail, Shield, Smartphone, Key, ScanLine, MessageSquare, X } from 'lucide-react';

import { InfoSection } from './components/InfoSection';
import { TwoFactorSection } from './components/TwoFactorSection';
import { ReviewDrawer } from './components/ReviewDrawer';
import { MethodDrawer } from './components/MethodDrawer';

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
    const changes: any[] = [];
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
        return { bg: 'bg-gray-500/10', text: 'text-gray-500', icon: Key }; // Fallback
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
          <InfoSection
            form={form}
            initialForm={initialForm}
            onChange={handleChange}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

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
          <MethodDrawer
            drawerMode={drawerMode}
            currentFocusedMethod={currentFocusedMethod}
            availableToAdd={availableToAdd}
            drawerForm={drawerForm}
            setDrawerForm={setDrawerForm}
            newMethodTypeId={newMethodTypeId}
            setNewMethodTypeId={setNewMethodTypeId}
            getMethodStyle={getMethodStyle}
            handleSave={handleSave}
            handleRemove={handleRemove}
            onCancel={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'review' && (
          <ReviewDrawer
            pendingChanges={pendingChanges}
            allMethods={ALL_METHODS}
            getMethodStyle={getMethodStyle}
            onComplete={() => {
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
          />
        )}
      </div>
    </div>
  );
};

export default CoreTab;
