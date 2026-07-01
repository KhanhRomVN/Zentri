import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, GripVertical, ChevronDown, Bug, Key, Mail, Clock } from 'lucide-react';
import { cn } from '@renderer/shared/lib/utils';
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '../../../../components/ui/Drawer';
import { Button } from '../../../../components/ui/Button';
import { ServiceProviderConfig } from '../../../email/types';
import { SERVICES } from '../../../../constants/services';
import { CATEGORIES, CategoryItem } from '../../../../constants/categories';
import { useAccentColors } from '../../../../hooks/useAccentColors';
import CreateCategoryModal from '../../../../components/CreateCategoryModal';


interface ServiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Partial<ServiceProviderConfig>,
    metadata: { key: string; value: string }[],
    authMethods: string[],
  ) => void;
  editService?: Partial<ServiceProviderConfig> | null;
  isNew?: boolean;
}

const getFaviconUrl = (url: string) => {
  if (!url) return '';
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
};

const FIELD_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'array', label: 'Array' },
  { value: 'json', label: 'JSON' },
  { value: 'number', label: 'Number' },
];
const FIELD_FEATURES = [
  { value: '', label: 'None' },
  { value: 'encryption', label: 'Encryption' },
  { value: 'totp', label: 'TOTP' },
  { value: 'backup_codes', label: 'Backup Codes' },
  { value: 'url', label: 'URL' },
];
const AUTH_METHOD_OPTIONS = [
  {
    value: 'basic_auth',
    label: 'Basic Auth',
    description: 'Email & password authentication',
    icon: '',
    iconComponent: Key,
  },
  {
    value: 'google_oauth',
    label: 'Google OAuth',
    description: 'Sign in with Google account',
    icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=64',
  },
  {
    value: 'github_oauth',
    label: 'GitHub OAuth',
    description: 'Sign in with GitHub account',
    icon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
  },
  {
    value: 'facebook_oauth',
    label: 'Facebook OAuth',
    description: 'Sign in with Facebook account',
    icon: 'https://www.google.com/s2/favicons?domain=facebook.com&sz=64',
  },
  {
    value: 'twitter_oauth',
    label: 'Twitter/X OAuth',
    description: 'Sign in with Twitter/X account',
    icon: 'https://www.google.com/s2/favicons?domain=x.com&sz=64',
  },
  {
    value: 'microsoft_oauth',
    label: 'Microsoft OAuth',
    description: 'Sign in with Microsoft account',
    icon: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=64',
  },
  {
    value: 'apple_oauth',
    label: 'Apple OAuth',
    description: 'Sign in with Apple ID',
    icon: 'https://www.google.com/s2/favicons?domain=apple.com&sz=64',
  },
  {
    value: 'discord_oauth',
    label: 'Discord OAuth',
    description: 'Sign in with Discord account',
    icon: 'https://www.google.com/s2/favicons?domain=discord.com&sz=64',
  },
  {
    value: 'totp_2fa',
    label: 'TOTP 2FA',
    description: 'Time-based one-time password',
    icon: '',
    iconComponent: Clock,
  },
  {
    value: 'smtp_auth',
    label: 'SMTP Auth',
    description: 'SMTP server authentication',
    icon: '',
    iconComponent: Mail,
  },
  {
    value: 'api_key',
    label: 'API Key',
    description: 'API key/token authentication',
    icon: '',
    iconComponent: Key,
  },
];

interface MetadataField {
  name: string;
  type: string;
  feature: string;
}
const inputClass =
  'w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50';

// ─── CustomSelect ──────────────────────────────────────────────────────────
const CustomSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon?: string }[];
  placeholder?: string;
  showFavicon?: boolean;
}> = ({ value, onChange, options, placeholder = 'Select...', showFavicon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const sel = options.find((o) => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 pl-3 pr-8 rounded-md bg-input-background border border-border text-sm text-foreground outline-none hover:border-primary/50 transition-colors flex items-center gap-2 whitespace-nowrap w-full"
      >
        {showFavicon && sel?.icon && (
          <img
            src={sel.icon}
            alt=""
            className="w-4 h-4 rounded-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <span className={!sel ? 'text-muted-foreground/40' : ''}>{sel?.label || placeholder}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground/50 absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-dropdown-background border border-border/50 rounded-md py-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-[280px] overflow-y-auto hover:border-primary transition-colors">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2',
                opt.value === value
                  ? 'text-foreground bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-dropdown-item-hover',
              )}
            >
              {showFavicon && opt.icon && (
                <img
                  src={opt.icon}
                  alt=""
                  className="w-4 h-4 rounded-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── CategoryDropdown ──────────────────────────────────────────────────────
const getCatColor = (
  title: string,
  accentColors: string[],
  UNIFIED_ACCENT: string,
  parseRgb: (c: string) => { r: number; g: number; b: number } | null,
) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const colors = accentColors.length > 0 ? accentColors : [UNIFIED_ACCENT];
  const color = colors[Math.abs(hash) % colors.length] || UNIFIED_ACCENT;
  const rgb = parseRgb(color);
  if (rgb)
    return {
      base: color,
      bg: `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`,
      border: `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`,
    };
  return { base: color, bg: 'rgba(54,134,255,0.15)', border: 'rgba(54,134,255,0.3)' };
};

const CategoryDropdown: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onCreateNew: (t: string) => void;
  categories: CategoryItem[];
  accentColors: string[];
  UNIFIED_ACCENT: string;
  parseRgb: (c: string) => { r: number; g: number; b: number } | null;
}> = ({ value, onChange, onCreateNew, categories, accentColors, UNIFIED_ACCENT, parseRgb }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = categories.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
  const selectedCat = categories.find((c) => c.title === value);
  const showCreate =
    search && !filtered.some((c) => c.title.toLowerCase() === search.toLowerCase());
  const selectedColor = value ? getCatColor(value, accentColors, UNIFIED_ACCENT, parseRgb) : null;
  return (
    <div ref={ref} className="relative">
      <div className="flex items-center relative">
        {selectedCat && selectedColor && (
          <div
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center"
            style={{ backgroundColor: selectedColor.bg }}
          >
            <selectedCat.icon className="w-3 h-3" style={{ color: selectedColor.base }} />
          </div>
        )}
        <input
          type="text"
          value={isOpen ? search : value}
          placeholder="Search or select category..."
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setSearch('');
            setIsOpen(true);
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className={cn(inputClass, selectedCat && 'pl-9')}
        />
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-dropdown-background border border-border/50 rounded-md py-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-[280px] overflow-y-auto hover:border-primary transition-colors">
          {showCreate && (
            <button
              onMouseDown={() => {
                onCreateNew(search);
                setIsOpen(false);
                setSearch('');
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-primary hover:bg-dropdown-item-hover flex items-center gap-2 transition-colors border-b border-border/20"
            >
              <Plus className="w-3.5 h-3.5" />+ {search}
            </button>
          )}
          {filtered.map((cat) => {
            const catColor = getCatColor(cat.title, accentColors, UNIFIED_ACCENT, parseRgb);
            return (
              <button
                key={cat.id}
                onMouseDown={() => {
                  onChange(cat.title);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full text-left px-3 py-2.5 transition-colors flex items-start gap-3',
                  cat.title === value
                    ? 'text-foreground bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-dropdown-item-hover',
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border"
                  style={{ backgroundColor: catColor.bg, borderColor: catColor.border }}
                >
                  <cat.icon className="w-4 h-4" style={{ color: catColor.base }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{cat.title}</div>
                  <div className="text-[11px] text-muted-foreground/50 truncate">
                    {cat.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── AuthMethodDropdown ────────────────────────────────────────────────────
const AuthMethodDropdown: React.FC<{ selected: string[]; onToggle: (v: string) => void }> = ({
  selected,
  onToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = AUTH_METHOD_OPTIONS.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground/80">Auth Methods</label>
      <div ref={ref} className="relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search auth methods..."
            value={isOpen ? search : selected.length ? `${selected.length} selected` : ''}
            readOnly={!isOpen}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setSearch('');
              setIsOpen(true);
            }}
            className={inputClass}
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
        </div>
        {isOpen && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-dropdown-background border border-border/50 rounded-md py-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-[280px] overflow-y-auto hover:border-primary transition-colors">
            {filtered.map((opt) => {
              const active = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onToggle(opt.value);
                  }}
                  className={cn(
                    'group w-full text-left px-3 py-2.5 transition-colors flex items-center gap-3',
                    active
                      ? 'text-foreground bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-dropdown-item-hover',
                  )}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted/20">
                    {opt.icon ? (
                      <img
                        src={opt.icon}
                        alt=""
                        className="w-4 h-4 rounded-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : opt.iconComponent ? (
                      <opt.iconComponent className="w-4 h-4 text-muted-foreground/60" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground/50 truncate">
                      {opt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((val) => {
            const opt = AUTH_METHOD_OPTIONS.find((o) => o.value === val);
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-primary/10 border-primary/20 text-primary"
              >
                {opt?.icon ? (
                  <img
                    src={opt.icon}
                    alt=""
                    className="w-3.5 h-3.5 rounded-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  opt?.iconComponent && <opt.iconComponent className="w-3.5 h-3.5" />
                )}
                {opt?.label || val}
                <button
                  onClick={() => onToggle(val)}
                  className="ml-0.5 hover:text-error transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SERVICE_TEMPLATE_OPTIONS = [
  { value: '', label: 'Custom service...', icon: '' },
  ...SERVICES.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.category || 'Other'})`,
    icon: s.url ? getFaviconUrl(s.url) : '',
  })),
];

// ─── Main Component ────────────────────────────────────────────────────────
const ServiceDrawer: React.FC<ServiceDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editService,
  isNew,
}) => {
  const { accentColors, UNIFIED_ACCENT, parseRgb } = useAccentColors();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [expandedFieldIdx, setExpandedFieldIdx] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingServiceWarning, setExistingServiceWarning] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [faviconLoaded, setFaviconLoaded] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [authMethods, setAuthMethods] = useState<string[]>([]);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

useEffect(() => {
    if (isOpen) {
      if (editService && !isNew) {
        setName(editService.name || '');
        setUrl(editService.websiteUrl || '');
        setCategory(editService.defaultCategories?.[0] || '');
        setTagsList(editService.defaultTags || []);
        setDescription((editService as any).description || '');
        setAuthMethods((editService as any).authMethods || []);
        const meta = editService.metadata || [];
        setMetadataFields(
          Array.isArray(meta)
            ? meta.map((m: any) => ({
                name: m.key || m.name || '',
                type: m.type || 'string',
                feature: m.feature || '',
              }))
            : [],
        );
      } else {
        setName('');
        setUrl('');
        setCategory('');
        setTagsList([]);
        setDescription('');
        setMetadataFields([]);
        setSelectedTemplate('');
        setAuthMethods([]);
      }
      setErrors({});
      setExistingServiceWarning(null);
      setExpandedFieldIdx(null);
      setTagInput('');
    }
  }, [isOpen, editService, isNew]);
  useEffect(() => {
    if (!url) {
      setFaviconLoaded(false);
      setFaviconError(false);
      return;
    }
    setFaviconError(false);
    const favUrl = getFaviconUrl(url);
    if (!favUrl) {
      setFaviconLoaded(false);
      setFaviconError(true);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setFaviconLoaded(true);
      setFaviconError(false);
    };
    img.onerror = () => {
      setFaviconLoaded(false);
      setFaviconError(true);
    };
    img.src = favUrl;
  }, [url]);

  useEffect(() => {
    setName('');
    setUrl('');
    setCategory('');
    setTagsList([]);
    setDescription('');
    setMetadataFields([]);
    setAuthMethods([]);
    setExistingServiceWarning(null);
    if (selectedTemplate) {
      const template = SERVICES.find((s) => s.id === selectedTemplate);
      if (template) {
        setName(template.name);
        setUrl(template.url || '');
        setCategory(template.category || '');
        setTagsList(template.tags || []);
        setDescription(template.description || '');
        if (template.metadata?.fields)
          setMetadataFields(
            template.metadata.fields.map((f: any) => ({
              name: f.name,
              type: f.type || 'string',
              feature: f.feature || '',
            })),
          );
        if (template.auth_method?.length) setAuthMethods(template.auth_method);
        // Check for existing service with same name or URL
        checkExistingService(template.name, template.url || '');
      }
    }
  }, [selectedTemplate]);

  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { name: '', type: 'string', feature: '' }]);
    setExpandedFieldIdx(metadataFields.length);
  };
  const removeMetadataField = (idx: number) => {
    setMetadataFields(metadataFields.filter((_, i) => i !== idx));
    if (expandedFieldIdx === idx) setExpandedFieldIdx(null);
  };
  const updateMetadataField = (idx: number, u: Partial<MetadataField>) => {
    setMetadataFields(metadataFields.map((f, i) => (i === idx ? { ...f, ...u } : f)));
  };
  const handleAddTag = (val: string) => {
    const t = val.trim();
    if (t && !tagsList.includes(t)) setTagsList([...tagsList, t]);
    setTagInput('');
  };
  const handleRemoveTag = (tag: string) => {
    setTagsList(tagsList.filter((t) => t !== tag));
  };
  const toggleAuthMethod = (method: string) => {
    setAuthMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  };

  const checkExistingService = async (name: string, url: string) => {
    if (!name && !url) {
      setExistingServiceWarning(null);
      return;
    }
    setIsChecking(true);
    try {
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        'SELECT id, name, url FROM services WHERE name = ? OR url = ?',
        [name, url],
      );
      if (rows.length > 0) {
        const existing = rows[0];
        if (existing.id !== editService?.id) {
          setExistingServiceWarning(
            `A service with ${existing.name === name ? `name "${name}"` : `URL "${url}"`} already exists.`,
          );
        } else {
          setExistingServiceWarning(null);
        }
      } else {
        setExistingServiceWarning(null);
      }
    } catch (error) {
      console.error('Failed to check existing service:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    checkExistingService(value, url);
    if (errors.name) setErrors((p) => ({ ...p, name: '' }));
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    checkExistingService(name, value);
    if (errors.url) setErrors((p) => ({ ...p, url: '' }));
  };
  const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    const colors = accentColors.length > 0 ? accentColors : [UNIFIED_ACCENT];
    const color = colors[Math.abs(hash) % colors.length] || UNIFIED_ACCENT;
    const rgb = parseRgb(color);
    if (rgb)
      return {
        base: color,
        bg: `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`,
        border: `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`,
      };
    return { base: color, bg: 'rgba(54,134,255,0.15)', border: 'rgba(54,134,255,0.3)' };
  };

  

  if (!isOpen) return null;
  const validFields = metadataFields.filter((f) => f.name.trim());

  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="right" width="560px">
      <DrawerHeader
        title={isNew ? 'Initialize New Service' : 'Edit Service Configuration'}
        description={
          isNew
            ? 'Configure a new service provider for Zentri'
            : `Review and update settings for ${name}`
        }
        onClose={onClose}
      />
      <DrawerBody className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Service Template</label>
            <CustomSelect
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              options={SERVICE_TEMPLATE_OPTIONS}
              placeholder="Choose a template..."
              showFavicon
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Google Cloud"
              className={cn(inputClass, errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-[11px] font-bold text-destructive">{errors.name}</p>}
            {existingServiceWarning && (
              <p className="text-[11px] font-bold text-amber-500">{existingServiceWarning}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">
              URL <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div
                className={cn(
                  'w-10 h-10 shrink-0 rounded-md border flex items-center justify-center',
                  faviconLoaded
                    ? 'border-border bg-input-background'
                    : 'border-red-500/30 bg-red-500/10',
                )}
              >
                {faviconLoaded ? (
                  <img src={getFaviconUrl(url)} alt="" className="w-5 h-5 rounded-sm" />
                ) : faviconError ? (
                  <Bug className="w-4 h-4 text-red-500/70" />
                ) : null}
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com"
                className={cn(inputClass, 'flex-1', errors.url && 'border-destructive')}
              />
            </div>
            {errors.url && <p className="text-[11px] font-bold text-destructive">{errors.url}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Category</label>
            <CategoryDropdown
              value={category}
              onChange={setCategory}
              onCreateNew={(t) => {
                setNewCategoryTitle(t);
                setShowCreateCategory(true);
              }}
              categories={CATEGORIES}
              accentColors={accentColors}
              UNIFIED_ACCENT={UNIFIED_ACCENT}
              parseRgb={parseRgb}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Tags</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
              placeholder="Type tag and press Enter..."
              className={inputClass}
            />
            {tagsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tagsList.map((tag) => {
                  const color = getTagColor(tag);
                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0 px-2 py-0.5 rounded-md text-[11px] font-medium border group/tag transition-all"
                      style={{
                        backgroundColor: color.bg,
                        color: color.base,
                        borderColor: color.border,
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="w-0 overflow-hidden opacity-0 group-hover/tag:w-auto group-hover/tag:overflow-visible group-hover/tag:opacity-100 group-hover/tag:ml-0.5 hover:text-error transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <AuthMethodDropdown selected={authMethods} onToggle={toggleAuthMethod} />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about this service..."
              className="w-full h-24 px-3 py-2 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50 resize-none"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground/80">Metadata Fields</label>
              <button
                onClick={addMetadataField}
                className="w-7 h-7 flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-primary hover:bg-primary/50 transition-all active:scale-90 border border-border"
                title="Add Field"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {metadataFields.map((field, idx) => {
                const isExpanded = expandedFieldIdx === idx;
                const featureColors = {
                  encryption: 'border-amber-500/30 bg-amber-500/5',
                  totp: 'border-emerald-500/30 bg-emerald-500/5',
                  backup_codes: 'border-blue-500/30 bg-blue-500/5',
                  url: 'border-purple-500/30 bg-purple-500/5',
                };
                const featureBadgeClasses = {
                  encryption: 'bg-amber-500/10 text-amber-500/70 border-amber-500/20',
                  totp: 'bg-emerald-500/10 text-emerald-500/70 border-emerald-500/20',
                  backup_codes: 'bg-blue-500/10 text-blue-500/70 border-blue-500/20',
                  url: 'bg-purple-500/10 text-purple-500/70 border-purple-500/20',
                };
                const featureIcon = {
                  encryption: '🔒',
                  totp: '⏰',
                  backup_codes: '📋',
                  url: '🔗',
                };
                const featureColor = field.feature ? featureColors[field.feature as keyof typeof featureColors] : '';
                const badgeClass = field.feature ? featureBadgeClasses[field.feature as keyof typeof featureBadgeClasses] : '';
                const icon = field.feature ? featureIcon[field.feature as keyof typeof featureIcon] : '';
                return (
                  <div
                    key={idx}
                    className={cn(
                      'group bg-muted/20 border rounded-md transition-all hover:bg-muted/30',
                      featureColor || 'border-border/50',
                    )}
                  >
                    <button
                      onClick={() => setExpandedFieldIdx(isExpanded ? null : idx)}
                      className="w-full flex items-center gap-3 p-3 text-left cursor-pointer"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                      <div className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                        field.feature ? 'bg-primary/5 border' : 'bg-primary/10',
                        field.feature === 'encryption' && 'border-amber-500/30',
                        field.feature === 'totp' && 'border-emerald-500/30',
                        field.feature === 'backup_codes' && 'border-blue-500/30',
                        field.feature === 'url' && 'border-purple-500/30',
                      )}>
                        {icon ? (
                          <span className="text-[12px]">{icon}</span>
                        ) : (
                          <span className="text-[10px] font-black text-primary/60 uppercase">
                            {field.type?.slice(0, 3) || 'STR'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground truncate">
                            {field.name || 'Unnamed Field'}
                          </span>
                          {field.feature && (
                            <span className={cn(
                              'text-[10px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded border',
                              badgeClass,
                            )}>
                              {field.feature.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMetadataField(idx);
                        }}
                        className="p-1 text-muted-foreground/20 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </button>
                    {isExpanded && (
                      <>
                        <div className="border-t border-divider" />
                        <div className="px-3 pb-3 pt-2 space-y-3">
                          <div>
                            <label className="text-[11px] uppercase tracking-wider text-muted-foreground/50 font-black">
                              Field Name
                            </label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => updateMetadataField(idx, { name: e.target.value })}
                              placeholder="e.g. username"
                              className={cn(inputClass, 'h-8 mt-1')}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/50 font-black">
                                Type
                              </label>
                              <div className="mt-1">
                                <CustomSelect
                                  value={field.type}
                                  onChange={(v) => updateMetadataField(idx, { type: v })}
                                  options={FIELD_TYPES}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/50 font-black">
                                Feature
                              </label>
                              <div className="mt-1">
                                <CustomSelect
                                  value={field.feature}
                                  onChange={(v) => updateMetadataField(idx, { feature: v })}
                                  options={FIELD_FEATURES}
                                  placeholder="None"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DrawerBody>
      <DrawerFooter className="justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="soft"
            size="sm"
            disabled={!name || !url || !!existingServiceWarning || isChecking}
            onClick={() => {
              if (isNew) {
                const data: Partial<ServiceProviderConfig> = {
                  name: name.trim(),
                  websiteUrl: url.trim(),
                  defaultCategories: category ? [category.trim()] : [],
                  defaultTags: tagsList,
                  description: description.trim(),
                };
                const metadata = metadataFields
                  .filter((f) => f.name.trim())
                  .map((f) => ({
                    key: f.name.trim(),
                    value: JSON.stringify({ type: f.type, feature: f.feature || undefined }),
                  }));
                onSave(data, metadata, authMethods);
              } else {
                const data: Partial<ServiceProviderConfig> = {
                  name: name.trim(),
                  websiteUrl: url.trim(),
                  defaultCategories: category ? [category.trim()] : [],
                  defaultTags: tagsList,
                  description: description.trim(),
                };
                const metadata = metadataFields
                  .filter((f) => f.name.trim())
                  .map((f) => ({
                    key: f.name.trim(),
                    value: JSON.stringify({ type: f.type, feature: f.feature || undefined }),
                  }));
                onSave(data, metadata, authMethods);
              }
            }}
          >
            {isNew ? 'Create Service' : 'Save Changes'}
          </Button>
        </DrawerFooter>
      <CreateCategoryModal
        isOpen={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        onCreate={(t) => {
          setCategory(t);
          setShowCreateCategory(false);
        }}
        initialTitle={newCategoryTitle}
      />
    </Drawer>
  );
};

export default ServiceDrawer;
