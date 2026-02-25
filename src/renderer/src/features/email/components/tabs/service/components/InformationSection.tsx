import {
  Database,
  Globe,
  ExternalLink,
  EyeOff,
  Eye,
  Mail,
  ScanLine,
  ChevronRight,
} from 'lucide-react';
import { ServiceItem, Email } from '../../../../mock/accounts';
import { ReactNode, useState, useEffect, useMemo, memo, useCallback } from 'react';
import Input from '../../../../../../shared/components/ui/input/Input';
import Combobox from '../../../../../../shared/components/ui/combobox/Combobox';
import { SERVICE_PROVIDERS, ServiceProviderConfig } from '../utils/servicePresets';
import Modal from '../../../../../../shared/components/ui/modal/Modal';

// Static utility functions and components extracted to prevent re-creation
const getFaviconUrl = (url: string) => {
  if (!url) return '';
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
};

const FaviconIcon = memo(({ url, DefaultIcon }: { url: string; DefaultIcon: any }) => {
  const [error, setError] = useState(false);
  const faviconUrl = useMemo(() => getFaviconUrl(url), [url]);

  if (error || !faviconUrl) {
    return <DefaultIcon className="h-4 w-4 text-muted-foreground" />;
  }

  return (
    <img
      src={faviconUrl}
      alt="favicon"
      className="w-4 h-4 object-contain"
      onError={() => setError(true)}
    />
  );
});
FaviconIcon.displayName = 'FaviconIcon';

export const SectionHeader = memo(({ label }: { label: string }) => (
  <div className="flex items-center gap-2 text-foreground/80 pb-4 border-b border-border/50 mb-6">
    <span className="text-base font-semibold tracking-tight">{label}</span>
  </div>
));
SectionHeader.displayName = 'SectionHeader';

export const InputGroup = memo(({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
));
InputGroup.displayName = 'InputGroup';

interface InformationSectionProps {
  selectedService: ServiceItem;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  onChange?: (field: string, value: string) => void;
  availableEmails?: Email[];
  availableServices?: ServiceItem[];
  providers?: Record<string, ServiceProviderConfig>;
  onSaveNewProvider?: (provider: ServiceProviderConfig) => void;
}

export const InformationSection = memo((props: InformationSectionProps) => {
  const {
    selectedService,
    showPassword,
    setShowPassword,
    onChange,
    availableEmails = [],
    availableServices = [],
    providers = SERVICE_PROVIDERS,
    onSaveNewProvider,
  } = props;

  // Input states
  const [serviceNameSearch, setServiceNameSearch] = useState('');
  const [serviceNameInputOpen, setServiceNameInputOpen] = useState(false);
  const [websiteUrlSearch, setWebsiteUrlSearch] = useState('');
  const [websiteUrlInputOpen, setWebsiteUrlInputOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryInputOpen, setCategoryInputOpen] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [emailInputOpen, setEmailInputOpen] = useState(false);
  const [linkedProviderId, setLinkedProviderId] = useState<string>('');
  const [linkedProviderSearch, setLinkedProviderSearch] = useState('');
  const [linkedProviderInputOpen, setLinkedProviderInputOpen] = useState(false);
  const [linkedAccountInputOpen, setLinkedAccountInputOpen] = useState(false);

  const [modalName, setModalName] = useState('');
  const [modalUrl, setModalUrl] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [newProviderData, setNewProviderData] = useState<Partial<ServiceProviderConfig>>({});

  // Detection states
  const [isUnknownUrl, setIsUnknownUrl] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);

  // Sync modal values
  useEffect(() => {
    if (confirmModalOpen) {
      setModalName(newProviderData.name || '');
      setModalUrl(newProviderData.websiteUrl || '');
    }
  }, [confirmModalOpen, newProviderData.name, newProviderData.websiteUrl]);

  // Sync linked provider
  useEffect(() => {
    if (selectedService.linkedServiceId && !linkedProviderId) {
      const linkedService = availableServices.find((s) => s.id === selectedService.linkedServiceId);
      if (linkedService) {
        setLinkedProviderId(linkedService.serviceProviderId);
      }
    }
  }, [selectedService.linkedServiceId, availableServices, linkedProviderId]);

  const currentProviderConfig = useMemo(() => {
    if (!selectedService.serviceProviderId) return null;
    return providers[selectedService.serviceProviderId] || null;
  }, [selectedService.serviceProviderId, providers]);

  // Auto-detect service logic optimized with debounce
  useEffect(() => {
    const websiteUrl = currentProviderConfig?.websiteUrl || selectedService.metadata?.websiteUrl;
    if (!websiteUrl) {
      setIsUnknownUrl(false);
      return;
    }

    const timer = setTimeout(() => {
      let detectedService: ServiceProviderConfig | undefined;
      try {
        const urlObj = new URL(websiteUrl);
        const host = urlObj.hostname.replace('www.', '');
        detectedService = Object.values(providers).find((p) => p.websiteUrl.includes(host));
      } catch {
        /* ignore invalid URL */
      }

      if (detectedService) {
        setSuggestedTags(detectedService.defaultTags || []);
        setSuggestedCategories(detectedService.defaultCategories || []);
        setIsUnknownUrl(false);
        if (!selectedService.serviceProviderId && onChange) {
          onChange('serviceProviderId', detectedService.id);
        }
      } else {
        setSuggestedTags([]);
        setSuggestedCategories([]);
        setIsUnknownUrl(!selectedService.serviceProviderId);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [
    currentProviderConfig?.websiteUrl,
    selectedService.metadata?.websiteUrl,
    providers,
    selectedService.serviceProviderId,
    onChange,
  ]);

  // Memoized handlers
  const handleSaveConfirmed = useCallback(() => {
    if (modalName && modalUrl && onSaveNewProvider) {
      const newConfig: ServiceProviderConfig = {
        id: modalName.toLowerCase().replace(/\s+/g, '-'),
        name: modalName,
        websiteUrl: modalUrl,
        defaultTags: newProviderData.defaultTags || selectedService.tags || [],
        defaultCategories: newProviderData.defaultCategories || selectedService.categories || [],
        commonFields: [
          { label: 'Username', key: 'username', type: 'text', placeholder: 'Username' },
          { label: 'Password', key: 'password', type: 'password', placeholder: 'Password' },
        ],
      };
      onChange?.('serviceProviderId', newConfig.id);
      if (newProviderData.defaultTags) onChange?.('tags', newProviderData.defaultTags.join(', '));
      if (newProviderData.defaultCategories)
        onChange?.('categories', newProviderData.defaultCategories.join(', '));
      onSaveNewProvider(newConfig);
    }
    setConfirmModalOpen(false);
    setIsUnknownUrl(false);
  }, [modalName, modalUrl, newProviderData, selectedService, onSaveNewProvider, onChange]);

  // Memoized Combobox Options - THE BIG PERFORMANCE WIN
  // Removed JSX from options to keep them lightweight
  const serviceNameOptions = useMemo(
    () =>
      Object.values(providers).map((service) => ({
        value: service.name,
        label: service.name,
        websiteUrl: service.websiteUrl, // Store data instead of JSX
      })),
    [providers],
  );

  const websiteUrlOptions = useMemo(
    () =>
      Object.values(providers).map((service) => ({
        value: service.websiteUrl,
        label: service.websiteUrl,
      })),
    [providers],
  );

  // Tag & Category Options Calculation - Very Heavy otherwise
  const allTagOptions = useMemo(() => {
    const currentTags = selectedService.tags || [];
    const existingTags = Array.from(
      new Set(Object.values(providers).flatMap((p) => p.defaultTags || [])),
    ).sort();

    return [
      ...suggestedTags.map((t) => ({ value: t, label: `${t} (suggested)` })),
      ...existingTags.map((t) => ({ value: t, label: t })),
    ].filter(
      (option, index, self) =>
        index === self.findIndex((o) => o.value === option.value) &&
        !currentTags.includes(option.value),
    );
  }, [providers, suggestedTags, selectedService.tags]);

  const allCategoryOptions = useMemo(() => {
    const currentCats = selectedService.categories || [];
    const existingCategories = Array.from(
      new Set(Object.values(providers).flatMap((p) => p.defaultCategories || [])),
    ).sort();

    return [
      ...suggestedCategories.map((c) => ({ value: c, label: `${c} (suggested)` })),
      ...existingCategories.map((c) => ({ value: c, label: c })),
    ].filter(
      (option, index, self) =>
        index === self.findIndex((o) => o.value === option.value) &&
        !currentCats.includes(option.value),
    );
  }, [providers, suggestedCategories, selectedService.categories]);

  const emailOptions = useMemo(
    () =>
      availableEmails.map((e) => ({
        value: e.id,
        label: e.email,
        domain: e.email.split('@')[1],
      })),
    [availableEmails],
  );

  const linkedProviderOptions = useMemo(
    () =>
      Object.values(providers).map((p) => ({
        value: p.id,
        label: p.name,
        websiteUrl: p.websiteUrl,
      })),
    [providers],
  );

  return (
    <div>
      <SectionHeader label="Information" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <InputGroup label="Service Name (Required)">
          <Input
            type="combobox"
            className={isUnknownUrl ? 'ring-1 ring-red-500 rounded-md' : ''}
            placeholder="Enter service name..."
            value={
              serviceNameInputOpen
                ? serviceNameSearch
                : currentProviderConfig?.name || selectedService.serviceProviderId || ''
            }
            onChange={(e) => {
              setServiceNameSearch(e.target.value);
              setNewProviderData((prev) => ({ ...prev, name: e.target.value }));
            }}
            onBlur={() => {
              setTimeout(() => {
                if (
                  isUnknownUrl &&
                  serviceNameSearch &&
                  !currentProviderConfig &&
                  !serviceNameInputOpen
                ) {
                  setNewProviderData({
                    name: serviceNameSearch,
                    websiteUrl: selectedService.metadata?.websiteUrl,
                    defaultTags: selectedService.tags || [],
                    defaultCategories: selectedService.categories || [],
                  });
                  setConfirmModalOpen(true);
                }
              }, 200);
            }}
            leftIcon={
              <FaviconIcon
                url={
                  currentProviderConfig?.websiteUrl || selectedService.metadata?.websiteUrl || ''
                }
                DefaultIcon={Database}
              />
            }
            popoverOpen={serviceNameInputOpen}
            onPopoverOpenChange={setServiceNameInputOpen}
            popoverContent={
              <Combobox
                searchQuery={serviceNameSearch}
                options={serviceNameOptions}
                creatable={true}
                onCreate={(newName) => {
                  if (isUnknownUrl) {
                    setNewProviderData({
                      name: newName,
                      websiteUrl: selectedService.metadata?.websiteUrl,
                    });
                    setConfirmModalOpen(true);
                  } else {
                    onChange?.('serviceProviderId', newName.toLowerCase());
                  }
                  setServiceNameSearch('');
                  setServiceNameInputOpen(false);
                }}
                onChange={(val) => {
                  const provider = Object.values(providers).find((p) => p.name === val);
                  onChange?.('serviceProviderId', provider?.id || val.toLowerCase());
                  if (provider) {
                    if (provider.defaultTags) onChange?.('tags', provider.defaultTags.join(', '));
                    if (provider.defaultCategories)
                      onChange?.('categories', provider.defaultCategories.join(', '));
                  }
                  setServiceNameSearch('');
                  setServiceNameInputOpen(false);
                }}
              />
            }
          />
        </InputGroup>

        <InputGroup label="Website URL">
          <Input
            type="combobox"
            placeholder="https://example.com"
            value={
              websiteUrlInputOpen
                ? websiteUrlSearch
                : currentProviderConfig?.websiteUrl || selectedService.metadata?.websiteUrl || ''
            }
            onChange={(e) => setWebsiteUrlSearch(e.target.value)}
            leftIcon={
              <FaviconIcon
                url={
                  currentProviderConfig?.websiteUrl ||
                  selectedService.metadata?.websiteUrl ||
                  websiteUrlSearch ||
                  ''
                }
                DefaultIcon={Globe}
              />
            }
            popoverOpen={websiteUrlInputOpen}
            onPopoverOpenChange={setWebsiteUrlInputOpen}
            popoverContent={
              <Combobox
                searchQuery={websiteUrlSearch}
                options={websiteUrlOptions}
                creatable={true}
                onCreate={(newUrl) => {
                  const newMetadata = { ...(selectedService.metadata || {}), websiteUrl: newUrl };
                  if (currentProviderConfig && newUrl !== currentProviderConfig.websiteUrl)
                    onChange?.('serviceProviderId', '');
                  onChange?.('metadata', newMetadata as any);
                  setWebsiteUrlInputOpen(false);
                }}
                onChange={(val) => {
                  const newMetadata = { ...(selectedService.metadata || {}), websiteUrl: val };
                  if (currentProviderConfig && val !== currentProviderConfig.websiteUrl)
                    onChange?.('serviceProviderId', '');
                  onChange?.('metadata', newMetadata as any);
                  setWebsiteUrlInputOpen(false);
                }}
              />
            }
            rightIcon={
              currentProviderConfig?.websiteUrl || selectedService.metadata?.websiteUrl ? (
                <ExternalLink
                  className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() =>
                    window.open(
                      currentProviderConfig?.websiteUrl || selectedService.metadata?.websiteUrl,
                      '_blank',
                    )
                  }
                />
              ) : undefined
            }
          />
        </InputGroup>

        <InputGroup label="Tags">
          <Input
            type="combobox"
            placeholder="Add tags..."
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            multiValue={true}
            badges={(selectedService.tags || []).map((t) => ({ id: t, label: t }))}
            onBadgeRemove={(id) =>
              onChange?.('tags', selectedService.tags!.filter((t) => t !== id).join(', '))
            }
            popoverOpen={tagInputOpen}
            onPopoverOpenChange={setTagInputOpen}
            popoverContent={
              <Combobox
                searchQuery={tagSearch}
                options={allTagOptions}
                creatable={true}
                onCreate={(newTag) => {
                  if (!selectedService.tags?.includes(newTag))
                    onChange?.('tags', [...(selectedService.tags || []), newTag].join(', '));
                  setTagSearch('');
                  setTagInputOpen(false);
                }}
                onChange={(val) => {
                  if (!selectedService.tags?.includes(val))
                    onChange?.('tags', [...(selectedService.tags || []), val].join(', '));
                  setTagSearch('');
                  setTagInputOpen(false);
                }}
              />
            }
          />
        </InputGroup>

        <InputGroup label="Categories">
          <Input
            type="combobox"
            placeholder="Select categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            multiValue={true}
            badges={(selectedService.categories || []).map((c) => ({ id: c, label: c }))}
            onBadgeRemove={(id) =>
              onChange?.(
                'categories',
                selectedService.categories!.filter((c) => c !== id).join(', '),
              )
            }
            popoverOpen={categoryInputOpen}
            onPopoverOpenChange={setCategoryInputOpen}
            popoverContent={
              <Combobox
                searchQuery={categorySearch}
                options={allCategoryOptions}
                creatable={true}
                onCreate={(newCat) => {
                  if (!selectedService.categories?.includes(newCat))
                    onChange?.(
                      'categories',
                      [...(selectedService.categories || []), newCat].join(', '),
                    );
                  setCategorySearch('');
                  setCategoryInputOpen(false);
                }}
                onChange={(val) => {
                  if (!selectedService.categories?.includes(val))
                    onChange?.(
                      'categories',
                      [...(selectedService.categories || []), val].join(', '),
                    );
                  setCategorySearch('');
                  setCategoryInputOpen(false);
                }}
              />
            }
          />
        </InputGroup>

        <InputGroup label="Email">
          <Input
            type="combobox"
            placeholder="Select email..."
            value={
              emailInputOpen
                ? emailSearch
                : availableEmails.find((e) => e.id === selectedService.emailId)?.email || ''
            }
            onChange={(e) => setEmailSearch(e.target.value)}
            leftIcon={<Mail className="h-4 w-4 text-muted-foreground" />}
            popoverOpen={emailInputOpen}
            onPopoverOpenChange={setEmailInputOpen}
            popoverContent={
              <Combobox
                searchQuery={emailSearch}
                options={emailOptions}
                creatable={false}
                onChange={(val) => {
                  onChange?.('emailId', val);
                  setEmailInputOpen(false);
                }}
              />
            }
          />
        </InputGroup>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InputGroup label="Linked Service (Provider)">
            <Input
              type="combobox"
              placeholder="Service..."
              value={
                linkedProviderInputOpen
                  ? linkedProviderSearch
                  : providers[linkedProviderId]?.name || ''
              }
              onChange={(e) => setLinkedProviderSearch(e.target.value)}
              leftIcon={<ScanLine className="h-4 w-4 text-muted-foreground" />}
              popoverOpen={linkedProviderInputOpen}
              onPopoverOpenChange={setLinkedProviderInputOpen}
              popoverContent={
                <Combobox
                  searchQuery={linkedProviderSearch}
                  options={linkedProviderOptions}
                  creatable={false}
                  onChange={(val) => {
                    setLinkedProviderId(val);
                    setLinkedProviderInputOpen(false);
                    onChange?.('linkedServiceId', '');
                  }}
                />
              }
            />
          </InputGroup>

          <InputGroup label="Linked Service (Account)">
            <Input
              type="combobox"
              placeholder="Account..."
              disabled={!linkedProviderId}
              value={
                linkedAccountInputOpen
                  ? ''
                  : availableServices.find((s) => s.id === selectedService.linkedServiceId)
                      ?.metadata?.username ||
                    availableServices.find((s) => s.id === selectedService.linkedServiceId)?.id ||
                    ''
              }
              rightIcon={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
              popoverOpen={linkedAccountInputOpen}
              onPopoverOpenChange={setLinkedAccountInputOpen}
              popoverContent={
                <Combobox
                  searchQuery=""
                  options={availableServices
                    .filter((s) => s.serviceProviderId === linkedProviderId)
                    .map((s) => ({
                      value: s.id,
                      label: s.metadata?.username || s.id,
                      description: availableEmails.find((e) => e.id === s.emailId)?.email,
                      icon: (
                        <div className="w-4 h-4 flex items-center justify-center bg-primary/10 rounded overflow-hidden text-primary text-[10px] font-bold">
                          {(s.metadata?.username?.[0] || s.id[0]).toUpperCase()}
                        </div>
                      ),
                    }))}
                  creatable={false}
                  onChange={(val) => {
                    onChange?.('linkedServiceId', val);
                    setLinkedAccountInputOpen(false);
                  }}
                />
              }
            />
          </InputGroup>
        </div>

        {currentProviderConfig?.commonFields?.map((field) => (
          <InputGroup key={field.key} label={field.label}>
            <div className="relative group">
              <input
                type={
                  field.type === 'password'
                    ? showPassword
                      ? 'text'
                      : 'password'
                    : field.type === 'text' || field.type === 'string'
                      ? 'text'
                      : 'text' // Fallback for array/object if they reach here
                }
                className="flex h-11 w-full rounded-lg border border-border bg-input px-4 pr-10 text-sm focus:border-primary/50 transition-all font-mono outline-none"
                value={selectedService.metadata?.[field.key] || ''}
                onChange={(e) =>
                  onChange?.('metadata', {
                    ...(selectedService.metadata || {}),
                    [field.key]: e.target.value,
                  } as any)
                }
                placeholder={field.placeholder}
              />
              {field.type === 'password' && (
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </InputGroup>
        ))}
      </div>

      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Save New Service Configuration"
        size="md"
      >
        <div className="py-2 space-y-4">
          <InputGroup label="Service Name">
            <Input
              type="text"
              value={modalName}
              onChange={(e) => setModalName(e.target.value)}
              placeholder="Service Name"
              leftIcon={<FaviconIcon url={modalUrl || ''} DefaultIcon={Database} />}
            />
          </InputGroup>
          <InputGroup label="Website URL">
            <Input
              type="text"
              value={modalUrl}
              onChange={(e) => setModalUrl(e.target.value)}
              placeholder="https://example.com"
              leftIcon={<Globe size={16} className="text-muted-foreground" />}
            />
          </InputGroup>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2 rounded-md hover:bg-muted text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfirmed}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-lg hover:bg-primary/90 transition-all"
            >
              Save Config
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
});

InformationSection.displayName = 'InformationSection';
export default InformationSection;
