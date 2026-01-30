import { useState } from 'react';
import {
  Globe,
  ScanLine,
  MessageSquare,
  Key,
  Mail,
  Copy,
  User,
  Shield,
  Smartphone,
} from 'lucide-react';
import { ServiceItem } from '../../../mock/accounts';

import { ServiceSidebar } from './components/ServiceSidebar';
import { InformationSection } from './components/InformationSection';
import { TwoFactorSection } from './components/TwoFactorSection';
import { SecretsSection } from './components/SecretsSection';
import { UnifiedDrawer } from './components/UnifiedDrawer';

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

  // Global 2FA Methods Definition
  const ALL_METHODS = [
    { id: 'app', name: 'Authenticator App', type: 'app', placeholder: 'Not configured' },
    { id: 'sms', name: 'Phone Verification', type: 'sms', placeholder: 'No phone linked' },
    { id: 'email', name: 'Recovery Email', type: 'email', placeholder: 'No email added' },
    { id: 'key', name: 'Security Key', type: 'key', placeholder: 'No key added' },
    { id: 'prompt', name: 'Device Prompt', type: 'prompt', placeholder: 'Not set up' },
    { id: 'hello', name: 'Windows Hello', type: 'hello', placeholder: 'Not set up' },
    { id: 'codes', name: 'Backup Codes', type: 'codes', placeholder: 'Generate codes' },
  ];

  // States for 2FA and Secrets
  const [activeMethods, setActiveMethods] = useState<string[]>([]);
  const [initialActiveMethods] = useState<string[]>([]);
  const [methodValues, setMethodValues] = useState<Record<string, string>>({});
  const [initialMethodValues] = useState<Record<string, string>>({});

  const [secrets, setSecrets] = useState<any[]>([]);
  const [initialSecrets] = useState<any[]>([]);
  const [deletedMethods, setDeletedMethods] = useState<string[]>([]);
  const [deletedSecrets, setDeletedSecrets] = useState<string[]>([]);

  // Unified Drawer State
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

  // Handlers
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
    const changes: any[] = [];
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

    secrets.forEach((secret) => {
      const initial = initialSecrets.find((s) => s.id === secret.id);
      if (!initial) {
        changes.push({
          type: 'add',
          area: 'Secrets & Keys',
          label: secret.key || 'Secret',
          newValue: secret.value,
        });
      } else if (secret.key !== initial.key || secret.value !== initial.value) {
        changes.push({
          type: 'modify',
          area: 'Secrets & Keys',
          label: secret.key || 'Secret',
          oldValue: initial.value,
          newValue: secret.value,
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
      });
    });

    return changes;
  };

  const pendingChanges = getChanges();

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

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const currentFocusedMethod =
    drawer2FAMode === 'edit'
      ? ALL_METHODS.find((m) => m.id === selectedMethodId)
      : ALL_METHODS.find((m) => m.id === newMethodTypeId);

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="flex h-full w-full overflow-hidden">
        <ServiceSidebar
          services={filteredServices}
          selectedServiceId={selectedService?.id}
          onSelectService={setSelectedService}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          getFaviconUrl={getFaviconUrl}
        />

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-background relative">
          {selectedService ? (
            <div className="flex flex-col gap-10 max-w-5xl">
              <InformationSection
                selectedService={selectedService}
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
                onMethodClick={handleMethodClick}
                onAddClick={handleAdd2FAClick}
                getFaviconUrl={getFaviconUrl}
                websiteUrl={selectedService.websiteUrl}
              />

              <SecretsSection
                secrets={secrets}
                initialSecrets={initialSecrets}
                deletedSecrets={deletedSecrets}
                onSecretClick={handleSecretClick}
                onAddClick={handleAddSecretClick}
                selectedSecretId={selectedSecretId}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <Globe className="w-12 h-12 opacity-20" />
              <p>Select a service to view details</p>
            </div>
          )}
        </div>
      </div>

      <UnifiedDrawer
        activeDrawer={activeDrawer}
        onClose={() => setActiveDrawer(null)}
        drawer2FAMode={drawer2FAMode}
        currentFocusedMethod={currentFocusedMethod}
        availableToAdd={ALL_METHODS.filter((m) => !activeMethods.includes(m.id))}
        drawer2FAValue={drawer2FAValue}
        setDrawer2FAValue={setDrawer2FAValue}
        newMethodTypeId={newMethodTypeId}
        setNewMethodTypeId={setNewMethodTypeId}
        getMethodStyle={getMethodStyle}
        handleSave2FA={handleSave2FA}
        handleDelete2FA={handleDelete2FA}
        secretDrawerMode={secretDrawerMode}
        secretForm={secretForm}
        setSecretForm={setSecretForm}
        handleSaveSecret={handleSaveSecret}
        handleDeleteSecret={handleDeleteSecret}
        pendingChanges={pendingChanges}
        allMethods={ALL_METHODS}
        onCompleteReview={() => {
          setActiveDrawer(null);
          alert('Success: Service changes updated!');
        }}
      />

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
