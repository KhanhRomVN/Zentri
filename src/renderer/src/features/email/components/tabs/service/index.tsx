import { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
import { cn } from '../../../../../shared/lib/utils';
import { ServiceItem } from '../../../mock/accounts';

import { ServiceSidebar } from './components/ServiceSidebar';
import { InformationSection } from './components/InformationSection';
import { TwoFactorSection } from './components/TwoFactorSection';
import { SecretsSection } from './components/SecretsSection';
import { UnifiedDrawer } from './components/UnifiedDrawer';
import { SERVICE_PROVIDERS, ServiceProviderConfig } from './utils/servicePresets';
import { Email } from '../../../../../../../shared/types';

interface ServiceTabProps {
  services: ServiceItem[];
  onUpdate?: (services: ServiceItem[]) => void;
  currentAccountId?: string;
  onCreatingModeChange?: (isCreating: boolean) => void;
  availableEmails?: Email[];
  availableServices?: ServiceItem[];
  providers?: Record<string, ServiceProviderConfig>;
  onSaveNewProvider?: (provider: ServiceProviderConfig) => void;
}

const ServiceTab = memo(
  ({
    services,
    onUpdate,
    currentAccountId,
    onCreatingModeChange,
    availableEmails = [],
    availableServices = [],
    providers = SERVICE_PROVIDERS,
    onSaveNewProvider,
  }: ServiceTabProps) => {
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(
      services && services.length > 0 ? services[0] : null,
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Global 2FA Methods Definition - useMemo to stabilize
    const ALL_METHODS = useMemo(
      () => [
        { id: 'app', name: 'Authenticator App', type: 'app', placeholder: 'Not configured' },
        { id: 'sms', name: 'Phone Verification', type: 'sms', placeholder: 'No phone linked' },
        { id: 'email', name: 'Recovery Email', type: 'email', placeholder: 'No email added' },
        { id: 'key', name: 'Security Key', type: 'key', placeholder: 'No key added' },
        { id: 'prompt', name: 'Device Prompt', type: 'prompt', placeholder: 'Not set up' },
        { id: 'hello', name: 'Windows Hello', type: 'hello', placeholder: 'Not set up' },
        { id: 'codes', name: 'Backup Codes', type: 'codes', placeholder: 'Generate codes' },
      ],
      [],
    );

    // States for 2FA and Secrets
    const [activeMethods, setActiveMethods] = useState<string[]>([]);
    const [initialActiveMethods, setInitialActiveMethods] = useState<string[]>([]);
    const [methodValues, setMethodValues] = useState<Record<string, string>>({});
    const [initialMethodValues, setInitialMethodValues] = useState<Record<string, string>>({});

    const [secretKeys, setSecretKeys] = useState<any[]>([]);
    const [initialSecretKeys, setInitialSecretKeys] = useState<any[]>([]);
    const [deletedMethods, setDeletedMethods] = useState<string[]>([]);
    const [deletedSecrets, setDeletedSecrets] = useState<string[]>([]);

    // Creation Mode State
    const [isCreating, setIsCreating] = useState(false);

    // Sync state when selected service changes
    useEffect(() => {
      if (selectedService) {
        const methods = (selectedService.twoFactorMethods || []).map((m) => m.type as string);
        const values = (selectedService.twoFactorMethods || []).reduce(
          (acc, m) => ({ ...acc, [m.type as string]: m.value }),
          {},
        );
        const secrets = selectedService.secretKeys || [];

        setActiveMethods(methods);
        setInitialActiveMethods(methods);
        setMethodValues(values);
        setInitialMethodValues(values);
        setSecretKeys(secrets);
        setInitialSecretKeys(secrets);
        setDeletedMethods([]);
        setDeletedSecrets([]);
      } else if (isCreating) {
        setActiveMethods([]);
        setInitialActiveMethods([]);
        setMethodValues({});
        setInitialMethodValues({});
        setSecretKeys([]);
        setInitialSecretKeys([]);
        setDeletedMethods([]);
        setDeletedSecrets([]);
      }
    }, [selectedService?.id, isCreating]);

    // Unified Drawer State
    const [activeDrawer, setActiveDrawer] = useState<'2fa' | 'secret' | 'review' | null>(null);

    // 2FA Drawer State
    const [drawer2FAMode, setDrawer2FAMode] = useState<'edit' | 'add'>('edit');
    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
    const [newMethodTypeId, setNewMethodTypeId] = useState<string>('');
    const [drawer2FAValue, setDrawer2FAValue] = useState('');

    // Creation Mode State
    const [newServiceForm, setNewServiceForm] = useState<ServiceItem>({
      id: '',
      serviceProviderId: '',
      emailId: '',
      linkedServiceId: '',
      tags: [],
      categories: [],
      metadata: {},
      twoFactorMethods: [],
      secretKeys: [],
    });

    // Secret Drawer State
    const [secretDrawerMode, setSecretDrawerMode] = useState<'edit' | 'add'>('edit');
    const [selectedSecretId, setSelectedSecretId] = useState<string | null>(null);
    const [secretForm, setSecretForm] = useState({ key: '', value: '' });

    // Memoized Handlers
    const handleMethodClick = useCallback(
      (id: string) => {
        setSelectedMethodId(id);
        setDrawer2FAMode('edit');
        setDrawer2FAValue(methodValues[id] || '');
        setActiveDrawer('2fa');
      },
      [methodValues],
    );

    const handleAdd2FAClick = useCallback(() => {
      setDrawer2FAMode('add');
      setNewMethodTypeId('');
      setDrawer2FAValue('');
      setActiveDrawer('2fa');
    }, []);

    const handleSave2FA = useCallback(() => {
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
    }, [drawer2FAMode, newMethodTypeId, selectedMethodId, drawer2FAValue, deletedMethods]);

    const handleDelete2FA = useCallback(() => {
      if (selectedMethodId) {
        if (initialActiveMethods.includes(selectedMethodId)) {
          setDeletedMethods((prev) => [...prev, selectedMethodId]);
          setActiveMethods((prev) => prev.filter((id) => id !== selectedMethodId));
        } else {
          setActiveMethods((prev) => prev.filter((id) => id !== selectedMethodId));
        }
        setActiveDrawer(null);
      }
    }, [selectedMethodId, initialActiveMethods]);

    const handleSecretClick = useCallback(
      (id: string) => {
        const secret = secretKeys.find((s) => s.id === id);
        if (secret) {
          setSelectedSecretId(id);
          setSecretForm({ key: secret.key, value: secret.value });
          setSecretDrawerMode('edit');
          setActiveDrawer('secret');
        }
      },
      [secretKeys],
    );

    const handleAddSecretClick = useCallback(() => {
      setSelectedSecretId(null);
      setSecretForm({ key: '', value: '' });
      setSecretDrawerMode('add');
      setActiveDrawer('secret');
    }, []);

    const handleSaveSecret = useCallback(() => {
      if (secretDrawerMode === 'add') {
        const newSecret = {
          id: Math.random().toString(36).substr(2, 9),
          key: secretForm.key || 'NEW_KEY',
          value: secretForm.value,
          active: true,
        };
        setSecretKeys((prev) => [...prev, newSecret]);
      } else if (secretDrawerMode === 'edit' && selectedSecretId) {
        if (deletedSecrets.includes(selectedSecretId)) {
          setDeletedSecrets((prev) => prev.filter((id) => id !== selectedSecretId));
        }
        setSecretKeys((prev) =>
          prev.map((s) =>
            s.id === selectedSecretId ? { ...s, key: secretForm.key, value: secretForm.value } : s,
          ),
        );
      }
      setActiveDrawer(null);
    }, [secretDrawerMode, secretForm, selectedSecretId, deletedSecrets]);

    const handleDeleteSecret = useCallback(() => {
      if (selectedSecretId) {
        const isInitial = initialSecretKeys.some((s) => s.id === selectedSecretId);
        if (isInitial) {
          setDeletedSecrets((prev) => [...prev, selectedSecretId]);
          setSecretKeys((prev) => prev.filter((s) => s.id !== selectedSecretId));
        } else {
          setSecretKeys((prev) => prev.filter((s) => s.id !== selectedSecretId));
        }
        setActiveDrawer(null);
      }
    }, [selectedSecretId, initialSecretKeys]);

    const handleSelectService = useCallback(
      (service: ServiceItem) => {
        setIsCreating(false);
        onCreatingModeChange?.(false);
        setSelectedService(service);
      },
      [onCreatingModeChange],
    );

    const handleDeleteService = useCallback(
      (id: string) => {
        if (onUpdate) {
          onUpdate(services.filter((s) => s.id !== id));
        }
      },
      [onUpdate, services],
    );

    const pendingChanges = useMemo(() => {
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

      secretKeys.forEach((secret) => {
        const initial = initialSecretKeys.find((s) => s.id === secret.id);
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
        const initial = initialSecretKeys.find((s) => s.id === id);
        changes.push({
          type: 'delete',
          area: 'Secrets & Keys',
          label: initial?.key || 'Secret',
          oldValue: initial?.value,
        });
      });

      return changes;
    }, [
      activeMethods,
      initialActiveMethods,
      methodValues,
      initialMethodValues,
      secretKeys,
      initialSecretKeys,
      deletedMethods,
      deletedSecrets,
      ALL_METHODS,
    ]);

    const getFaviconUrl = useCallback((url: string) => {
      if (!url) return '';
      try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=https://${domain}&sz=64`;
      } catch {
        return '';
      }
    }, []);

    const getMethodStyle = useCallback((type: string) => {
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
    }, []);

    const filteredServices = useMemo(
      () =>
        services.filter((s) => {
          const provider = s.serviceProviderId ? providers[s.serviceProviderId] : null;
          const name = provider?.name || s.serviceProviderId || '';
          return name.toLowerCase().includes(searchQuery.toLowerCase());
        }),
      [services, providers, searchQuery],
    );

    const currentFocusedMethod = useMemo(
      () =>
        drawer2FAMode === 'edit'
          ? ALL_METHODS.find((m) => m.id === selectedMethodId)
          : ALL_METHODS.find((m) => m.id === newMethodTypeId),
      [drawer2FAMode, selectedMethodId, newMethodTypeId, ALL_METHODS],
    );

    const handleAddService = useCallback(() => {
      setIsCreating(true);
      onCreatingModeChange?.(true);
      setSelectedService(null);
      setNewServiceForm({
        id: Math.random().toString(36).substr(2, 9),
        serviceProviderId: '',
        emailId: currentAccountId || '',
        linkedServiceId: '',
        tags: [],
        categories: [],
        metadata: {},
        twoFactorMethods: [],
        secretKeys: [],
      });
    }, [currentAccountId, onCreatingModeChange]);

    const handleCancelCreate = useCallback(() => {
      setIsCreating(false);
      onCreatingModeChange?.(false);
      if (services.length > 0) {
        setSelectedService(services[0]);
      }
    }, [services, onCreatingModeChange]);

    const handleCreateService = useCallback(() => {
      if (onUpdate) {
        onUpdate([...services, newServiceForm]);
      }
      setIsCreating(false);
      onCreatingModeChange?.(false);
      setSelectedService(newServiceForm);
    }, [onUpdate, services, newServiceForm, onCreatingModeChange]);

    const handleInformationChange = useCallback(
      (field: string, value: string) => {
        if (field === 'tags' || field === 'categories') {
          const arrayVal = value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          if (isCreating) {
            setNewServiceForm((prev) => ({ ...prev, [field]: arrayVal }));
          } else if (selectedService) {
            setSelectedService((prev) => (prev ? { ...prev, [field]: arrayVal } : null));
          }
        } else {
          if (isCreating) {
            setNewServiceForm((prev) => ({ ...prev, [field]: value }));
          } else if (selectedService) {
            setSelectedService((prev) => (prev ? { ...prev, [field]: value } : null));
          }
        }
      },
      [isCreating, selectedService],
    );

    return (
      <div className="relative h-full w-full overflow-hidden flex flex-col">
        <div className="flex h-full w-full overflow-hidden">
          <ServiceSidebar
            services={filteredServices}
            selectedService={selectedService || undefined}
            onSelectService={handleSelectService}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            getFaviconUrl={getFaviconUrl}
            onAddService={handleAddService}
            onDeleteService={handleDeleteService}
          />

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-background relative">
            {isCreating || selectedService ? (
              <div
                className={cn(
                  'flex flex-col gap-10 max-w-5xl transition-all duration-300',
                  isCreating &&
                    'bg-background shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] rounded-xl p-6 border border-border/50',
                )}
              >
                <InformationSection
                  selectedService={isCreating ? newServiceForm : selectedService!}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  availableEmails={availableEmails}
                  availableServices={availableServices}
                  providers={providers}
                  onSaveNewProvider={onSaveNewProvider}
                  onChange={handleInformationChange}
                />

                {!isCreating && (
                  <>
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
                      websiteUrl={providers[selectedService!.serviceProviderId]?.websiteUrl || ''}
                    />

                    <SecretsSection
                      secrets={secretKeys}
                      initialSecrets={initialSecretKeys}
                      deletedSecrets={deletedSecrets}
                      onSecretClick={handleSecretClick}
                      onAddClick={handleAddSecretClick}
                      selectedSecretId={selectedSecretId}
                    />
                  </>
                )}
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

        {isCreating && (
          <div className="absolute bottom-6 right-6 flex items-center gap-3 z-[45]">
            <button
              onClick={handleCancelCreate}
              className="bg-button-secondBg text-button-text h-10 px-6 rounded-md flex items-center justify-center text-sm font-bold shadow-sm hover:bg-muted/80 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateService}
              disabled={!newServiceForm.serviceProviderId.trim()}
              className="bg-primary text-primary-foreground h-10 px-6 rounded-md shadow-xl flex items-center justify-center text-sm font-bold active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Service
            </button>
          </div>
        )}

        {!isCreating && pendingChanges.length > 0 && (
          <button
            onClick={() => setActiveDrawer('review')}
            className="bg-primary text-primary-foreground h-10 px-6 rounded-md shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-[45] text-sm font-bold animate-in slide-in-from-bottom-5 border border-primary/20 absolute bottom-6 right-6"
          >
            Update {pendingChanges.length}
          </button>
        )}
      </div>
    );
  },
);

export default ServiceTab;
