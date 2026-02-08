import {
  Database,
  Globe,
  ExternalLink,
  EyeOff,
  Eye,
  AlertCircle,
  Mail,
  ScanLine,
} from 'lucide-react';
import { ServiceItem } from '../../../../mock/accounts';
import { ReactNode, useState, useEffect, useMemo } from 'react';
import Input from '../../../../../../shared/components/ui/input/Input';
import Combobox from '../../../../../../shared/components/ui/combobox/Combobox';
import { DEFAULT_TAGS } from '../../../../../../../../shared/constant';
import { findServiceByUrl } from '../utils/serviceMapping';
import {
  POPULAR_SERVICE_NAMES,
  POPULAR_CATEGORIES,
  SERVICE_PROVIDERS,
} from '../utils/servicePresets';

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
}

export const InformationSection = ({
  selectedService,
  showPassword,
  setShowPassword,
  onChange,
}: InformationSectionProps) => {
  const [serviceNameSearch, setServiceNameSearch] = useState('');
  const [serviceNameInputOpen, setServiceNameInputOpen] = useState(false);
  const [websiteUrlSearch, setWebsiteUrlSearch] = useState('');
  const [websiteUrlInputOpen, setWebsiteUrlInputOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryInputOpen, setCategoryInputOpen] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);

  // Helper function to find service by name or ID
  const findServiceByName = (name: string) => {
    return Object.values(SERVICE_PROVIDERS).find(
      (service) => service.name.toLowerCase() === name.toLowerCase(),
    );
  };

  const currentProviderConfig = useMemo(() => {
    return selectedService.serviceProviderId
      ? SERVICE_PROVIDERS[selectedService.serviceProviderId]
      : (selectedService as any).name // Fallback for transition
        ? findServiceByName((selectedService as any).name)
        : null;
  }, [selectedService.serviceProviderId, (selectedService as any).name]);

  // Auto-detect service and suggest tags/categories when URL changes
  useEffect(() => {
    const websiteUrl = currentProviderConfig?.websiteUrl || selectedService.metadata?.websiteUrl;
    if (websiteUrl) {
      const detectedService = findServiceByUrl(websiteUrl);
      if (detectedService) {
        setSuggestedTags(detectedService.defaultTags || []);
        setSuggestedCategories(detectedService.defaultCategories || []);

        // Auto-fill serviceProviderId if empty
        if (!selectedService.serviceProviderId && onChange) {
          onChange('serviceProviderId', detectedService.id);
        }
      } else {
        setSuggestedTags([]);
        setSuggestedCategories([]);
      }
    }
  }, [currentProviderConfig?.websiteUrl, selectedService.metadata?.websiteUrl]);

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

  return (
    <div>
      <SectionHeader label="Information" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <InputGroup label="Service Name (Required)">
          <Input
            type="combobox"
            placeholder="Enter service name..."
            value={serviceNameInputOpen ? serviceNameSearch : currentProviderConfig?.name || ''}
            onChange={(e) => setServiceNameSearch(e.target.value)}
            leftIcon={
              <FaviconIcon url={currentProviderConfig?.websiteUrl || ''} DefaultIcon={Database} />
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && serviceNameSearch.trim()) {
                onChange?.('serviceProviderId', serviceNameSearch.trim().toLowerCase());
                setServiceNameSearch('');
                setServiceNameInputOpen(false);
              }
            }}
            popoverOpen={serviceNameInputOpen}
            onPopoverOpenChange={setServiceNameInputOpen}
            popoverContent={
              <Combobox
                searchQuery={serviceNameSearch}
                options={POPULAR_SERVICE_NAMES.map((name: string) => {
                  const service = findServiceByName(name);
                  return {
                    value: name,
                    label: name,
                    icon: service?.websiteUrl ? (
                      <img
                        src={getFaviconUrl(service.websiteUrl)}
                        alt={name}
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
                  onChange?.('serviceProviderId', newName.toLowerCase());
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
            value={websiteUrlInputOpen ? websiteUrlSearch : currentProviderConfig?.websiteUrl || ''}
            onChange={(e) => setWebsiteUrlSearch(e.target.value)}
            leftIcon={
              <FaviconIcon url={currentProviderConfig?.websiteUrl || ''} DefaultIcon={Globe} />
            }
            multiValue={false}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && websiteUrlSearch.trim()) {
                const newMetadata = {
                  ...(selectedService.metadata || {}),
                  websiteUrl: websiteUrlSearch.trim(),
                };
                onChange?.('metadata', newMetadata as any);
                setWebsiteUrlSearch('');
                setWebsiteUrlInputOpen(false);
              }
            }}
            rightIcon={
              currentProviderConfig?.websiteUrl ? (
                <ExternalLink
                  className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(currentProviderConfig.websiteUrl, '_blank');
                  }}
                />
              ) : undefined
            }
            popoverOpen={websiteUrlInputOpen}
            onPopoverOpenChange={setWebsiteUrlInputOpen}
            popoverContent={
              <Combobox
                searchQuery={websiteUrlSearch}
                options={Object.values(SERVICE_PROVIDERS).map((service: any) => ({
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
                  onChange?.('metadata', newMetadata as any);
                  setWebsiteUrlSearch('');
                  setWebsiteUrlInputOpen(false);
                }}
                onChange={(val: string) => {
                  const newMetadata = {
                    ...(selectedService.metadata || {}),
                    websiteUrl: val,
                  };
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
              const allTagOptions = [
                ...suggestedTags.map((t: string) => ({ value: t, label: `${t} (suggested)` })),
                ...DEFAULT_TAGS.map((t: string) => ({ value: t, label: t })),
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
              const allCategoryOptions = [
                ...suggestedCategories.map((c: string) => ({
                  value: c,
                  label: `${c} (suggested)`,
                })),
                ...POPULAR_CATEGORIES.map((c: string) => ({ value: c, label: c })),
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

        <InputGroup label="Link to Email (ID)">
          <div className="relative group">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              value={selectedService.emailId || ''}
              onChange={(e) => onChange?.('emailId', e.target.value)}
              placeholder="Email record ID..."
            />
          </div>
        </InputGroup>

        <InputGroup label="Linked Service (ID)">
          <div className="relative group">
            <ScanLine className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              value={selectedService.linkedServiceId || ''}
              onChange={(e) => onChange?.('linkedServiceId', e.target.value)}
              placeholder="Linked service ID..."
            />
          </div>
        </InputGroup>

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
    </div>
  );
};
