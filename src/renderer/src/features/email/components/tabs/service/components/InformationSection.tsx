import {
  Database,
  Globe,
  ExternalLink,
  EyeOff,
  Eye,
  AlertCircle,
  Mail,
  ScanLine,
  ChevronRight,
} from 'lucide-react';
import { ServiceItem, Email } from '../../../../mock/accounts';
import { ReactNode, useState, useEffect, useMemo } from 'react';
import Input from '../../../../../../shared/components/ui/input/Input';
import Combobox from '../../../../../../shared/components/ui/combobox/Combobox';
import { DEFAULT_TAGS } from '../../../../../../../../shared/constant';
import {
  POPULAR_CATEGORIES,
  SERVICE_PROVIDERS,
  ServiceProviderConfig,
} from '../utils/servicePresets';
import Modal from '../../../../../../shared/components/ui/modal/Modal';

export const SectionHeader = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 text-foreground/80 pb-4 border-b border-border/50 mb-6">
    <span className="text-base font-semibold tracking-tight">{label}</span>
  </div>
);

export const InputGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

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

export const InformationSection = (props: InformationSectionProps) => {
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
  const [linkedProviderId, setLinkedProviderId] = useState<string>(''); // Initialize with ID
  const [linkedProviderSearch, setLinkedProviderSearch] = useState('');
  const [linkedProviderInputOpen, setLinkedProviderInputOpen] = useState(false);
  const [linkedAccountInputOpen, setLinkedAccountInputOpen] = useState(false);

  // Modal Input States
  const [modalTagSearch, setModalTagSearch] = useState('');
  const [modalTagInputOpen, setModalTagInputOpen] = useState(false);
  const [modalCategorySearch, setModalCategorySearch] = useState('');
  const [modalCategoryInputOpen, setModalCategoryInputOpen] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalUrl, setModalUrl] = useState('');

  // New Service Detection State
  const [isUnknownUrl, setIsUnknownUrl] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [newProviderData, setNewProviderData] = useState<Partial<ServiceProviderConfig>>({});

  useEffect(() => {
    if (confirmModalOpen) {
      setModalName(newProviderData.name || '');
      setModalUrl(newProviderData.websiteUrl || '');
    }
  }, [confirmModalOpen, newProviderData.name, newProviderData.websiteUrl]);

  // Find linked provider if already has linkedServiceId
  useEffect(() => {
    if (selectedService.linkedServiceId && !linkedProviderId) {
      const linkedService = availableServices.find((s) => s.id === selectedService.linkedServiceId);
      if (linkedService) {
        setLinkedProviderId(linkedService.serviceProviderId);
      }
    }
  }, [selectedService.linkedServiceId, availableServices, linkedProviderId]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);

  // Helper function to find service by name or ID
  const findServiceByName = (name: string) => {
    return Object.values(providers).find(
      (service) => service.name.toLowerCase() === name.toLowerCase(),
    );
  };

  const currentProviderConfig = useMemo(() => {
    return selectedService.serviceProviderId
      ? providers[selectedService.serviceProviderId]
      : (selectedService as any).name // Fallback for transition
        ? findServiceByName((selectedService as any).name)
        : null;
  }, [selectedService.serviceProviderId, (selectedService as any).name, providers]);

  // Auto-detect service and suggest tags/categories when URL changes
  useEffect(() => {
    const websiteUrl = currentProviderConfig?.websiteUrl || selectedService.metadata?.websiteUrl;
    if (websiteUrl) {
      // Logic for new detection
      // Check if URL matches any known provider
      let detectedService: ServiceProviderConfig | undefined;

      try {
        const urlObj = new URL(websiteUrl);
        const host = urlObj.hostname.replace('www.', '');
        detectedService = Object.values(providers).find((p) => {
          try {
            return p.websiteUrl.includes(host);
          } catch {
            return false;
          }
        });
      } catch {
        // Invalid URL
      }

      if (detectedService) {
        setSuggestedTags(detectedService.defaultTags || []);
        setSuggestedCategories(detectedService.defaultCategories || []);
        setIsUnknownUrl(false);

        // Auto-fill serviceProviderId if empty
        if (!selectedService.serviceProviderId && onChange) {
          onChange('serviceProviderId', detectedService.id);
        }
      } else {
        setSuggestedTags([]);
        setSuggestedCategories([]);
        // If has URL but no service found -> New Service Candidate
        // Only mark unknown if user actively changing things
        setIsUnknownUrl(!!websiteUrl && !selectedService.serviceProviderId);
      }
    } else {
      setIsUnknownUrl(false);
    }
  }, [
    currentProviderConfig?.websiteUrl,
    selectedService.metadata?.websiteUrl,
    providers,
    selectedService.serviceProviderId,
  ]);

  // Helper function to get favicon URL
  const getFaviconUrl = (url: string) => {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  // Helper component to render favicon with fallback
  const FaviconIcon = ({ url, DefaultIcon }: { url: string; DefaultIcon: any }) => {
    const [error, setError] = useState(false);
    const faviconUrl = getFaviconUrl(url);

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
  };

  const handleSaveConfirmed = () => {
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
      // Before calling onSave, ensure we set the provider ID in the selected service
      onChange?.('serviceProviderId', newConfig.id);

      // Also update the service instance with the new tags/categories
      if (newProviderData.defaultTags) onChange?.('tags', newProviderData.defaultTags.join(', '));
      if (newProviderData.defaultCategories)
        onChange?.('categories', newProviderData.defaultCategories.join(', '));

      onSaveNewProvider(newConfig);
    }
    setConfirmModalOpen(false);
    setIsUnknownUrl(false);
  };

  // Logic to determine value for Service Name Input
  const serviceNameValue = serviceNameInputOpen
    ? serviceNameSearch
    : currentProviderConfig?.name ||
      selectedService.serviceProviderId ||
      newProviderData.name ||
      serviceNameSearch ||
      '';

  return (
    <div>
      <SectionHeader label="Information" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <InputGroup label="Service Name (Required)">
          <Input
            type="combobox"
            className={isUnknownUrl ? 'ring-1 ring-red-500 rounded-md' : ''}
            placeholder="Enter service name..."
            value={serviceNameValue}
            onChange={(e) => {
              setServiceNameSearch(e.target.value);
              setNewProviderData((prev) => ({ ...prev, name: e.target.value }));
            }}
            onBlur={() => {
              // Trigger modal if unknown URL and name is provided
              // Use settimeout to allow onCreate to fire if clicking option
              setTimeout(() => {
                if (
                  isUnknownUrl &&
                  serviceNameSearch &&
                  !currentProviderConfig &&
                  !serviceNameInputOpen
                ) {
                  setNewProviderData((prev) => ({
                    ...prev,
                    name: serviceNameSearch,
                    websiteUrl: selectedService.metadata?.websiteUrl,
                    defaultTags: selectedService.tags || [],
                    defaultCategories: selectedService.categories || [],
                  }));
                  setConfirmModalOpen(true);
                }
              }, 200);
            }}
            leftIcon={
              <FaviconIcon
                url={
                  currentProviderConfig?.websiteUrl ||
                  selectedService.metadata?.websiteUrl ||
                  newProviderData.websiteUrl ||
                  ''
                }
                DefaultIcon={Database}
              />
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && serviceNameSearch.trim()) {
                if (isUnknownUrl) {
                  // Trigger new service flow
                  setNewProviderData((prev) => ({
                    ...prev,
                    name: serviceNameSearch.trim(),
                    websiteUrl: selectedService.metadata?.websiteUrl,
                    defaultTags: selectedService.tags || [],
                    defaultCategories: selectedService.categories || [],
                  }));
                  setConfirmModalOpen(true);
                } else {
                  onChange?.('serviceProviderId', serviceNameSearch.trim().toLowerCase());
                }

                setServiceNameSearch('');
                setServiceNameInputOpen(false);
              }
            }}
            popoverOpen={serviceNameInputOpen}
            onPopoverOpenChange={setServiceNameInputOpen}
            popoverContent={
              <Combobox
                searchQuery={serviceNameSearch}
                options={Object.values(providers).map((service) => {
                  return {
                    value: service.name,
                    label: service.name,
                    icon: service?.websiteUrl ? (
                      <img
                        src={getFaviconUrl(service.websiteUrl)}
                        alt={service.name}
                        className="w-4 h-4 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : undefined,
                  };
                })}
                creatable={true}
                onCreate={(newName: string) => {
                  // Start creation flow if unknown
                  if (isUnknownUrl) {
                    setNewProviderData((prev) => ({
                      ...prev,
                      name: newName,
                      websiteUrl: selectedService.metadata?.websiteUrl,
                      defaultTags: selectedService.tags || [],
                      defaultCategories: selectedService.categories || [],
                    }));
                    setConfirmModalOpen(true);
                  } else {
                    onChange?.('serviceProviderId', newName.toLowerCase());
                  }
                  setServiceNameSearch('');
                  setServiceNameInputOpen(false);
                }}
                onChange={(val: string) => {
                  const provider = findServiceByName(val);
                  onChange?.('serviceProviderId', provider?.id || val.toLowerCase());

                  // Auto-fill from provider config
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
            multiValue={false}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && websiteUrlSearch.trim()) {
                const newMetadata = {
                  ...(selectedService.metadata || {}),
                  websiteUrl: websiteUrlSearch.trim(),
                };

                // Check if this URL deviates from current provider to clear it
                if (
                  currentProviderConfig &&
                  websiteUrlSearch.trim() !== currentProviderConfig.websiteUrl
                ) {
                  onChange?.('serviceProviderId', '');
                }

                onChange?.('metadata', newMetadata as any);
                setWebsiteUrlSearch('');
                setWebsiteUrlInputOpen(false);
              }
            }}
            rightIcon={
              currentProviderConfig?.websiteUrl || selectedService.metadata?.websiteUrl ? (
                <ExternalLink
                  className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const url =
                      currentProviderConfig?.websiteUrl || selectedService.metadata?.websiteUrl;
                    if (url) window.open(url, '_blank');
                  }}
                />
              ) : undefined
            }
            popoverOpen={websiteUrlInputOpen}
            onPopoverOpenChange={setWebsiteUrlInputOpen}
            popoverContent={
              <Combobox
                searchQuery={websiteUrlSearch}
                options={Object.values(providers).map((service: any) => ({
                  value: service.websiteUrl,
                  label: service.websiteUrl,
                  icon: (
                    <img
                      src={getFaviconUrl(service.websiteUrl)}
                      alt={service.name}
                      className="w-4 h-4 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ),
                }))}
                creatable={true}
                onCreate={(newUrl: string) => {
                  const newMetadata = {
                    ...(selectedService.metadata || {}),
                    websiteUrl: newUrl,
                  };

                  // Check if this URL deviates from current provider to clear it
                  if (currentProviderConfig && newUrl !== currentProviderConfig.websiteUrl) {
                    onChange?.('serviceProviderId', '');
                  }

                  onChange?.('metadata', newMetadata as any);
                  setWebsiteUrlSearch('');
                  setWebsiteUrlInputOpen(false);
                }}
                onChange={(val: string) => {
                  const newMetadata = {
                    ...(selectedService.metadata || {}),
                    websiteUrl: val,
                  };
                  // Check if this URL deviates from current provider to clear it
                  if (currentProviderConfig && val !== currentProviderConfig.websiteUrl) {
                    onChange?.('serviceProviderId', '');
                  }
                  onChange?.('metadata', newMetadata as any);
                  setWebsiteUrlSearch('');
                  setWebsiteUrlInputOpen(false);
                }}
              />
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
            badgeVariant="neon"
            badgeColorMode="diverse"
            badges={(selectedService.tags || []).map((t: string) => ({ id: t, label: t }))}
            onBadgeRemove={(id: string | number) => {
              if (onChange) {
                const newTags = (selectedService.tags || []).filter((t: string) => t !== id);
                onChange('tags', newTags.join(', '));
              }
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && tagSearch.trim()) {
                const currentTags = selectedService.tags || [];
                const newTag = tagSearch.trim();

                if (!currentTags.includes(newTag)) {
                  onChange?.('tags', [...currentTags, newTag].join(', '));
                }

                setTagSearch('');
                setTagInputOpen(false);
              }
            }}
            popoverOpen={tagInputOpen}
            onPopoverOpenChange={setTagInputOpen}
            popoverContent={(() => {
              const currentTags = selectedService.tags || [];
              const isDuplicate = currentTags.includes(tagSearch.trim());

              // Merge suggested tags with DEFAULT_TAGS
              // Calculate existing tags from providers
              const existingTags = Array.from(
                new Set(Object.values(providers).flatMap((p) => p.defaultTags || [])),
              ).sort();

              const allTagOptions = [
                ...suggestedTags.map((t: string) => ({ value: t, label: `${t} (suggested)` })),
                ...existingTags.map((t: string) => ({ value: t, label: t })),
              ].filter(
                (option, index, self) =>
                  index === self.findIndex((o) => o.value === option.value) &&
                  !currentTags.includes(option.value),
              );

              return (
                <Combobox
                  searchQuery={tagSearch}
                  options={allTagOptions}
                  creatable={true}
                  creatableMessage={isDuplicate ? 'Tag "%s" already exists' : 'Create "%s"'}
                  creatableClassName={isDuplicate ? 'text-red-500 bg-red-500/5' : ''}
                  creatableIcon={
                    isDuplicate ? (
                      <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
                    ) : null
                  }
                  onCreate={(newTag: string) => {
                    if (!currentTags.includes(newTag)) {
                      onChange?.('tags', [...currentTags, newTag].join(', '));
                    }
                    setTagSearch('');
                    setTagInputOpen(false);
                  }}
                  onChange={(val: string) => {
                    if (!currentTags.includes(val)) {
                      onChange?.('tags', [...currentTags, val].join(', '));
                    }
                    setTagSearch('');
                    setTagInputOpen(false);
                  }}
                />
              );
            })()}
          />
        </InputGroup>
        <InputGroup label="Categories">
          <Input
            type="combobox"
            placeholder="Select categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            multiValue={true}
            badgeVariant="neon"
            badgeColorMode="diverse"
            badges={(selectedService.categories || []).map((c: string) => ({ id: c, label: c }))}
            onBadgeRemove={(id: string | number) => {
              if (onChange) {
                const newCats = (selectedService.categories || []).filter((c: string) => c !== id);
                onChange('categories', newCats.join(', '));
              }
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && categorySearch.trim()) {
                const currentCats = selectedService.categories || [];
                const newCat = categorySearch.trim();

                if (!currentCats.includes(newCat)) {
                  onChange?.('categories', [...currentCats, newCat].join(', '));
                }

                setCategorySearch('');
                setCategoryInputOpen(false);
              }
            }}
            popoverOpen={categoryInputOpen}
            onPopoverOpenChange={setCategoryInputOpen}
            popoverContent={(() => {
              const currentCats = selectedService.categories || [];
              const isDuplicate = currentCats.includes(categorySearch.trim());

              // Merge suggested categories with POPULAR_CATEGORIES
              // Calculate existing categories from providers
              const existingCategories = Array.from(
                new Set(Object.values(providers).flatMap((p) => p.defaultCategories || [])),
              ).sort();

              const allCategoryOptions = [
                ...suggestedCategories.map((c: string) => ({
                  value: c,
                  label: `${c} (suggested)`,
                })),
                ...existingCategories.map((c: string) => ({ value: c, label: c })),
              ].filter(
                (option, index, self) =>
                  index === self.findIndex((o) => o.value === option.value) &&
                  !currentCats.includes(option.value),
              );

              return (
                <Combobox
                  searchQuery={categorySearch}
                  options={allCategoryOptions}
                  creatable={true}
                  creatableMessage={isDuplicate ? 'Category "%s" already exists' : 'Create "%s"'}
                  creatableClassName={isDuplicate ? 'text-red-500 bg-red-500/5' : ''}
                  creatableIcon={
                    isDuplicate ? (
                      <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
                    ) : null
                  }
                  onCreate={(newCat: string) => {
                    if (!currentCats.includes(newCat)) {
                      onChange?.('categories', [...currentCats, newCat].join(', '));
                    }
                    setCategorySearch('');
                    setCategoryInputOpen(false);
                  }}
                  onChange={(val: string) => {
                    if (!currentCats.includes(val)) {
                      onChange?.('categories', [...currentCats, val].join(', '));
                    }
                    setCategorySearch('');
                    setCategoryInputOpen(false);
                  }}
                />
              );
            })()}
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
                options={availableEmails.map((e) => ({
                  value: e.id,
                  label: e.email,
                  icon: (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=https://${e.email.split('@')[1]}&sz=32`}
                      alt="provider"
                      className="w-4 h-4 rounded-full opacity-70"
                    />
                  ),
                }))}
                creatable={false}
                onChange={(val: string) => {
                  onChange?.('emailId', val);
                  setEmailSearch('');
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
                  options={Object.values(providers).map((p) => ({
                    value: p.id,
                    label: p.name,
                    icon: (
                      <img
                        src={getFaviconUrl(p.websiteUrl)}
                        alt={p.name}
                        className="w-4 h-4 object-contain"
                      />
                    ),
                  }))}
                  creatable={false}
                  onChange={(val: string) => {
                    setLinkedProviderId(val);
                    setLinkedProviderInputOpen(false);
                    // Reset linked service if provider changes
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
                    .sort((a, b) => {
                      // Priority: accounts with same emailId
                      const aMatch = a.emailId === selectedService.emailId ? 1 : 0;
                      const bMatch = b.emailId === selectedService.emailId ? 1 : 0;
                      return bMatch - aMatch;
                    })
                    .map((s) => {
                      const email = availableEmails.find((e) => e.id === s.emailId)?.email;
                      return {
                        value: s.id,
                        label: s.metadata?.username || s.id,
                        description: email ? `Linked to ${email}` : undefined,
                        icon: (
                          <div className="w-4 h-4 flex items-center justify-center bg-primary/10 rounded overflow-hidden">
                            <span className="text-[10px] uppercase font-bold text-primary">
                              {(s.metadata?.username?.[0] || s.id[0]).toUpperCase()}
                            </span>
                          </div>
                        ),
                      };
                    })}
                  creatable={false}
                  onChange={(val: string) => {
                    onChange?.('linkedServiceId', val);
                    setLinkedAccountInputOpen(false);
                  }}
                />
              }
            />
          </InputGroup>
        </div>

        {/* Dynamic Preset Fields */}
        {currentProviderConfig?.commonFields?.map((field) => (
          <InputGroup key={field.key} label={field.label}>
            <div className="relative group">
              <input
                type={field.type === 'password' ? (showPassword ? 'text' : 'password') : field.type}
                className="flex h-11 w-full rounded-lg border border-border bg-input px-4 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-mono"
                value={selectedService.metadata?.[field.key] || ''}
                onChange={(e) => {
                  const newMetadata = {
                    ...(selectedService.metadata || {}),
                    [field.key]: e.target.value,
                  };
                  onChange?.('metadata', newMetadata as any);
                }}
                placeholder={field.placeholder}
              />
              {field.type === 'password' && (
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfirmed}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg"
            >
              Save Configuration
            </button>
          </div>
        }
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
              leftIcon={<Globe className="h-4 w-4 text-muted-foreground" />}
            />
          </InputGroup>

          <InputGroup label="Default Tags">
            <Input
              type="combobox"
              placeholder="Add default tags..."
              value={modalTagSearch}
              onChange={(e) => setModalTagSearch(e.target.value)}
              multiValue={true}
              badgeVariant="neon"
              badgeColorMode="diverse"
              badges={(newProviderData.defaultTags || []).map((t) => ({
                id: t,
                label: t,
              }))}
              onBadgeRemove={(id) => {
                setNewProviderData((prev) => ({
                  ...prev,
                  defaultTags: (prev.defaultTags || []).filter((t) => t !== id),
                }));
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && modalTagSearch.trim()) {
                  const currentTags = newProviderData.defaultTags || [];
                  const newTag = modalTagSearch.trim();
                  if (!currentTags.includes(newTag)) {
                    setNewProviderData((prev) => ({
                      ...prev,
                      defaultTags: [...currentTags, newTag],
                    }));
                  }
                  setModalTagSearch('');
                  setModalTagInputOpen(false);
                }
              }}
              popoverOpen={modalTagInputOpen}
              onPopoverOpenChange={setModalTagInputOpen}
              popoverContent={
                <Combobox
                  searchQuery={modalTagSearch}
                  options={DEFAULT_TAGS.map((t) => ({ value: t, label: t })).filter(
                    (o) => !(newProviderData.defaultTags || []).includes(o.value),
                  )}
                  creatable={true}
                  onCreate={(newTag) => {
                    const currentTags = newProviderData.defaultTags || [];
                    if (!currentTags.includes(newTag)) {
                      setNewProviderData((prev) => ({
                        ...prev,
                        defaultTags: [...currentTags, newTag],
                      }));
                    }
                    setModalTagSearch('');
                    setModalTagInputOpen(false);
                  }}
                  onChange={(val) => {
                    const currentTags = newProviderData.defaultTags || [];
                    if (!currentTags.includes(val)) {
                      setNewProviderData((prev) => ({
                        ...prev,
                        defaultTags: [...currentTags, val],
                      }));
                    }
                    setModalTagSearch('');
                    setModalTagInputOpen(false);
                  }}
                />
              }
            />
          </InputGroup>

          <InputGroup label="Default Categories">
            <Input
              type="combobox"
              placeholder="Select default categories..."
              value={modalCategorySearch}
              onChange={(e) => setModalCategorySearch(e.target.value)}
              multiValue={true}
              badgeVariant="neon"
              badgeColorMode="diverse"
              badges={(newProviderData.defaultCategories || []).map((c) => ({
                id: c,
                label: c,
              }))}
              onBadgeRemove={(id) => {
                setNewProviderData((prev) => ({
                  ...prev,
                  defaultCategories: (prev.defaultCategories || []).filter((c) => c !== id),
                }));
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && modalCategorySearch.trim()) {
                  const currentCats = newProviderData.defaultCategories || [];
                  const newCat = modalCategorySearch.trim();
                  if (!currentCats.includes(newCat)) {
                    setNewProviderData((prev) => ({
                      ...prev,
                      defaultCategories: [...currentCats, newCat],
                    }));
                  }
                  setModalCategorySearch('');
                  setModalCategoryInputOpen(false);
                }
              }}
              popoverOpen={modalCategoryInputOpen}
              onPopoverOpenChange={setModalCategoryInputOpen}
              popoverContent={
                <Combobox
                  searchQuery={modalCategorySearch}
                  options={POPULAR_CATEGORIES.map((c) => ({
                    value: c,
                    label: c,
                  })).filter((o) => !(newProviderData.defaultCategories || []).includes(o.value))}
                  creatable={true}
                  onCreate={(newCat) => {
                    const currentCats = newProviderData.defaultCategories || [];
                    if (!currentCats.includes(newCat)) {
                      setNewProviderData((prev) => ({
                        ...prev,
                        defaultCategories: [...currentCats, newCat],
                      }));
                    }
                    setModalCategorySearch('');
                    setModalCategoryInputOpen(false);
                  }}
                  onChange={(val) => {
                    const currentCats = newProviderData.defaultCategories || [];
                    if (!currentCats.includes(val)) {
                      setNewProviderData((prev) => ({
                        ...prev,
                        defaultCategories: [...currentCats, val],
                      }));
                    }
                    setModalCategorySearch('');
                    setModalCategoryInputOpen(false);
                  }}
                />
              }
            />
          </InputGroup>

          <p className="text-muted-foreground text-xs pt-2">
            This configuration will be saved for future use.
          </p>
        </div>
      </Modal>
    </div>
  );
};
