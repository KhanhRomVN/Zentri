/**
 * CreateServiceModal
 * Form tạo service mới — UI theo AccountForm/ServiceEmailForm, dùng Dropdown component.
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ChevronDown,
  Bug,
  Key,
  Mail,
  Clock,
  Globe,
  Tags,
  ShieldCheck,
  List,
} from 'lucide-react';
import { Modal, ModalHeader, ModalBody } from '../../../../components/ui/Modal';
import { cn } from '../../../../shared/lib/utils';
import { Button } from '../../../../components/ui/Button';
import { Switch } from '../../../../components/ui/Switch';
import Input from '../../../../components/ui/Input/Input';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../components/ui/Dropdown';
import { SERVICES } from '../../constants/services';
import { CATEGORIES } from '../../constants/categories';
import { useAccentColors } from '../../../../hooks/useAccentColors';
import CreateCategoryModal from './CreateCategoryModal';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const SERVICE_TEMPLATE_OPTIONS = [
  {
    value: '',
    label: 'Custom service',
    icon: '',
    description: 'Create a service from scratch',
    category: 'Custom',
  },
  ...SERVICES.map((s: any) => ({
    value: s.id,
    label: s.name,
    icon: s.url ? getFaviconUrl(s.url) : '',
    description: s.description || '',
    category: s.category || 'Other',
  })),
];

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({ isOpen, onClose }) => {
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
  const [twoFa, setTwoFa] = useState({ has_totp: false, has_backup_codes: false });
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingServices, setExistingServices] = useState<any[]>([]);

  useEffect(() => {
    const loadExistingServices = async () => {
      try {
        // @ts-ignore
        const rows = await window.electron.ipcRenderer.invoke(
          'sqlite:all',
          'SELECT id, name, url FROM services',
        );
        setExistingServices(rows || []);
      } catch {
        setExistingServices([]);
      }
    };
    loadExistingServices();
  }, []);

  const getHost = (url: string) => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  };

  const existingHosts = new Set(existingServices.map((s: any) => getHost(s.url || '')));
  const availableTemplateOptions = SERVICE_TEMPLATE_OPTIONS.filter((opt) => {
    if (!opt.value) return true;
    const originalService = SERVICES.find((s: any) => s.id === opt.value) as any;
    const host = originalService?.url ? getHost(originalService.url) : '';
    return !host || !existingHosts.has(host);
  });

  const selectedTemplateOption = availableTemplateOptions.find((o) => o.value === selectedTemplate);
  const selectedCategory = CATEGORIES.find((c: any) => c.title === category);

  const getCatColor = (title: string) => {
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
      const template = SERVICES.find((s: any) => s.id === selectedTemplate) as any;
      if (template) {
        setName(template.name || '');
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
        if (template.two_fa) setTwoFa(template.two_fa);
        else setTwoFa({ has_totp: false, has_backup_codes: false });
        checkExistingService(template.name || '', template.url || '');
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
        setExistingServiceWarning(
          `A service with ${existing.name === name ? `name "${name}"` : `URL "${url}"`} already exists.`,
        );
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

  const handleSave = async () => {
    if (!name.trim() || !url.trim() || saving) return;
    setSaving(true);
    try {
      const id = name.trim().toLowerCase().replace(/\s+/g, '-');
      const metadata = metadataFields
        .filter((f) => f.name.trim())
        .map((f) => ({
          key: f.name.trim(),
          value: JSON.stringify({ type: f.type, feature: f.feature || undefined }),
        }));
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        `INSERT OR REPLACE INTO services (id, name, url, tags, category, description, metadata, config_json, auth_method, two_fa, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          id,
          name.trim(),
          url.trim(),
          JSON.stringify(tagsList),
          JSON.stringify(category ? [category.trim()] : []),
          description.trim(),
          JSON.stringify(metadata),
          JSON.stringify({}),
          JSON.stringify(authMethods),
          JSON.stringify(twoFa),
        ],
      );
      window.dispatchEvent(new CustomEvent('services-changed'));
      onClose();
    } catch (error) {
      console.error('Failed to create service:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl h-[80vh]" hideCloseButton>
      <ModalHeader
        title="Service Registry"
        description="Manage available services for your email accounts"
        onClose={onClose}
      />
      <ModalBody className="p-0 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
            <div className="w-full p-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-8">
                {/* Identity */}
                <section className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-foreground">Identity</h3>
                      <p className="text-sm text-text-secondary">Service name, URL and template</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text-primary">
                        Service Template
                      </label>
                      <Dropdown
                        trigger="click"
                        align="start"
                        side="bottom"
                        closeOnSelect
                        fullWidth
                        searchable
                        className="w-full"
                      >
                        <DropdownTrigger asChild>
                          <button className="w-full max-w-full min-h-10 px-3 py-2 rounded-md bg-input-background border border-border text-sm text-foreground flex items-center gap-2 outline-none hover:border-primary/50 transition-colors">
                            {selectedTemplateOption?.icon && (
                              <img
                                src={selectedTemplateOption.icon}
                                alt=""
                                className="w-4 h-4 rounded-sm shrink-0"
                              />
                            )}
                            <div className="flex flex-col min-w-0 flex-1 text-left">
                              <span
                                className={cn(
                                  'text-sm font-bold truncate',
                                  !selectedTemplateOption?.label && 'text-muted-foreground/40',
                                )}
                              >
                                {selectedTemplateOption?.label || 'Choose a template...'}
                              </span>
                              <span className="text-[11px] text-text-secondary truncate">
                                {selectedTemplateOption?.description ||
                                  'Select a pre-defined service template'}
                              </span>
                            </div>
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto shrink-0" />
                          </button>
                        </DropdownTrigger>
                        <DropdownContent className="max-h-[280px] overflow-y-auto min-w-[280px]">
                          {availableTemplateOptions.map((opt) => {
                            const catColor = getCatColor(opt.category);
                            return (
                              <DropdownItem
                                key={opt.value}
                                onClick={() => setSelectedTemplate(opt.value)}
                              >
                                <div className="flex items-center gap-2.5 px-1 py-1">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-muted/50">
                                    {opt.icon ? (
                                      <img src={opt.icon} alt="" className="w-5 h-5 rounded-sm" />
                                    ) : (
                                      <Plus className="w-4 h-4 text-text-secondary" />
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold truncate">
                                        {opt.label}
                                      </span>
                                      <span
                                        className="shrink-0 px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wider"
                                        style={{
                                          backgroundColor: catColor.bg,
                                          color: catColor.base,
                                        }}
                                      >
                                        {opt.category}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-text-secondary truncate">
                                      {opt.description}
                                    </span>
                                  </div>
                                </div>
                              </DropdownItem>
                            );
                          })}
                        </DropdownContent>
                      </Dropdown>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Name"
                        value={name}
                        onChange={(e: any) => handleNameChange(e.target.value)}
                        placeholder="e.g. Google Cloud"
                        error={errors.name}
                      />
                      <Input
                        label="URL"
                        value={url}
                        onChange={(e: any) => handleUrlChange(e.target.value)}
                        placeholder="https://example.com"
                        error={errors.url}
                        leftIcon={
                          <div
                            className={cn(
                              'w-5 h-5 rounded flex items-center justify-center',
                              faviconLoaded ? 'bg-input-background' : 'bg-red-500/10',
                            )}
                          >
                            {faviconLoaded ? (
                              <img src={getFaviconUrl(url)} alt="" className="w-4 h-4 rounded-sm" />
                            ) : faviconError ? (
                              <Bug className="w-4 h-4 text-red-500/70" />
                            ) : null}
                          </div>
                        }
                      />
                    </div>
                    {existingServiceWarning && (
                      <p className="text-[11px] font-bold text-amber-500">
                        {existingServiceWarning}
                      </p>
                    )}
                  </div>
                </section>

                {/* Classification */}
                <section className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-warn/10 text-warn flex items-center justify-center shrink-0">
                      <Tags className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-foreground">Classification</h3>
                      <p className="text-sm text-text-secondary">Category and tags for filtering</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text-primary">Category</label>
                      <Dropdown
                        trigger="click"
                        align="start"
                        side="bottom"
                        closeOnSelect
                        fullWidth
                        className="w-full"
                      >
                        <DropdownTrigger asChild>
                          <button className="w-full max-w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground flex items-center gap-2 outline-none hover:border-primary/50 transition-colors">
                            {selectedCategory && <selectedCategory.icon className="w-4 h-4" />}
                            <span className={!selectedCategory ? 'text-muted-foreground/40' : ''}>
                              {selectedCategory ? selectedCategory.title : 'Select category...'}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto" />
                          </button>
                        </DropdownTrigger>
                        <DropdownContent className="max-h-[280px] overflow-y-auto min-w-[280px]">
                          <DropdownItem
                            onClick={() => {
                              setNewCategoryTitle('');
                              setShowCreateCategory(true);
                            }}
                          >
                            <Plus className="w-3.5 h-3.5 text-primary/70" />
                            Create category
                          </DropdownItem>
                          <div className="h-px bg-divider my-1" />
                          {CATEGORIES.map((cat: any) => {
                            const catColor = getCatColor(cat.title);
                            return (
                              <DropdownItem key={cat.id} onClick={() => setCategory(cat.title)}>
                                <div className="flex items-center gap-2.5 px-1 py-1">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                                    style={{
                                      backgroundColor: catColor.bg,
                                      borderColor: catColor.border,
                                    }}
                                  >
                                    <cat.icon
                                      className="w-4 h-4"
                                      style={{ color: catColor.base }}
                                    />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold">{cat.title}</span>
                                    <span className="text-[10px] text-muted-foreground/50 truncate">
                                      {cat.description}
                                    </span>
                                  </div>
                                </div>
                              </DropdownItem>
                            );
                          })}
                        </DropdownContent>
                      </Dropdown>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text-primary">Tags</label>
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
                          {tagsList.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-text-secondary/10 border-text-secondary/20 text-text-secondary"
                            >
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-error transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Authentication */}
                <section className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-foreground">Authentication</h3>
                      <p className="text-sm text-text-secondary">
                        Supported auth methods and 2FA options
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/80">Auth Methods</label>
                    <Dropdown
                      trigger="click"
                      align="start"
                      side="bottom"
                      closeOnSelect
                      fullWidth
                      className="w-full"
                    >
                      <DropdownTrigger asChild>
                        <button className="w-full max-w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground flex items-center gap-2 outline-none hover:border-primary/50 transition-colors">
                          <span
                            className={authMethods.length === 0 ? 'text-muted-foreground/40' : ''}
                          >
                            {authMethods.length > 0
                              ? `${authMethods.length} selected`
                              : 'Select auth methods...'}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto" />
                        </button>
                      </DropdownTrigger>
                      <DropdownContent className="max-h-[280px] overflow-y-auto min-w-[280px]">
                        {AUTH_METHOD_OPTIONS.map((opt) => {
                          const active = authMethods.includes(opt.value);
                          return (
                            <DropdownItem
                              key={opt.value}
                              onClick={() => toggleAuthMethod(opt.value)}
                            >
                              <div className="flex items-center gap-2.5 px-1 py-1">
                                {opt.icon ? (
                                  <img src={opt.icon} alt="" className="w-4 h-4 rounded-sm" />
                                ) : opt.iconComponent ? (
                                  <opt.iconComponent className="w-4 h-4 text-muted-foreground/60" />
                                ) : (
                                  <Clock className="w-4 h-4 text-muted-foreground/40" />
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span
                                    className={cn('text-xs font-bold', active && 'text-primary')}
                                  >
                                    {opt.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/50 truncate">
                                    {opt.description}
                                  </span>
                                </div>
                                {active && <span className="ml-auto text-primary text-xs">✓</span>}
                              </div>
                            </DropdownItem>
                          );
                        })}
                      </DropdownContent>
                    </Dropdown>
                    {authMethods.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {authMethods.map((val) => {
                          const opt = AUTH_METHOD_OPTIONS.find((o) => o.value === val);
                          return (
                            <span
                              key={val}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium border bg-text-secondary/10 border-text-secondary/20 text-text-secondary"
                            >
                              {opt?.label || val}
                              <button
                                onClick={() => toggleAuthMethod(val)}
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
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/80">
                      Two-Factor Authentication (2FA)
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-3 bg-muted/20 border border-border/50 rounded-md cursor-pointer hover:bg-muted/30 transition-all">
                        <div>
                          <span className="text-sm font-bold text-foreground">TOTP</span>
                          <p className="text-[10px] text-muted-foreground/50">
                            Time-based One-Time Password
                          </p>
                        </div>
                        <Switch
                          checked={twoFa.has_totp}
                          onCheckedChange={(checked) =>
                            setTwoFa((prev) => ({ ...prev, has_totp: checked }))
                          }
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-muted/20 border border-border/50 rounded-md cursor-pointer hover:bg-muted/30 transition-all">
                        <div>
                          <span className="text-sm font-bold text-foreground">Backup Codes</span>
                          <p className="text-[10px] text-muted-foreground/50">
                            One-time use recovery codes
                          </p>
                        </div>
                        <Switch
                          checked={twoFa.has_backup_codes}
                          onCheckedChange={(checked) =>
                            setTwoFa((prev) => ({ ...prev, has_backup_codes: checked }))
                          }
                        />
                      </label>
                    </div>
                  </div>
                </section>

                {/* Metadata */}
                <section className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0">
                      <List className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-foreground">Metadata Fields</h3>
                      <p className="text-sm text-text-secondary">Custom fields for this service</p>
                    </div>
                    <button
                      onClick={addMetadataField}
                      className="ml-auto w-7 h-7 flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-primary hover:bg-primary/50 transition-all active:scale-90 border border-border shrink-0"
                      title="Add Field"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {metadataFields.map((field, idx) => {
                      const isExpanded = expandedFieldIdx === idx;
                      return (
                        <div
                          key={idx}
                          className="group bg-muted/20 border border-border/50 rounded-md transition-all hover:bg-muted/30"
                        >
                          <button
                            onClick={() => setExpandedFieldIdx(isExpanded ? null : idx)}
                            className="w-full flex items-center gap-3 p-3 text-left cursor-pointer"
                          >
                            <span className="font-bold text-sm text-foreground truncate">
                              {field.name || 'Unnamed Field'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMetadataField(idx);
                              }}
                              className="ml-auto p-1 text-muted-foreground/20 hover:text-error transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-3 pt-2 space-y-3 border-t border-divider">
                              <Input
                                label="Field Name"
                                value={field.name}
                                onChange={(e: any) =>
                                  updateMetadataField(idx, { name: e.target.value })
                                }
                                placeholder="e.g. username"
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground/50 font-black">
                                    Type
                                  </label>
                                  <Dropdown
                                    trigger="click"
                                    align="start"
                                    side="bottom"
                                    closeOnSelect
                                    fullWidth
                                    searchable
                                  >
                                    <DropdownTrigger asChild>
                                      <button className={cn(inputClass, 'text-left', 'max-w-full')}>
                                        {field.type || 'String'}
                                      </button>
                                    </DropdownTrigger>
                                    <DropdownContent>
                                      {FIELD_TYPES.map((t) => (
                                        <DropdownItem
                                          key={t.value}
                                          onClick={() =>
                                            updateMetadataField(idx, { type: t.value })
                                          }
                                        >
                                          {t.label}
                                        </DropdownItem>
                                      ))}
                                    </DropdownContent>
                                  </Dropdown>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground/50 font-black">
                                    Feature
                                  </label>
                                  <Dropdown
                                    trigger="click"
                                    align="start"
                                    side="bottom"
                                    closeOnSelect
                                    fullWidth
                                  >
                                    <DropdownTrigger asChild>
                                      <button className={cn(inputClass, 'text-left', 'max-w-full')}>
                                        {field.feature ? field.feature.replace('_', ' ') : 'None'}
                                      </button>
                                    </DropdownTrigger>
                                    <DropdownContent>
                                      {FIELD_FEATURES.map((f) => (
                                        <DropdownItem
                                          key={f.value}
                                          onClick={() =>
                                            updateMetadataField(idx, { feature: f.value })
                                          }
                                        >
                                          {f.label}
                                        </DropdownItem>
                                      ))}
                                    </DropdownContent>
                                  </Dropdown>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
                <div className="h-10" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border shrink-0 bg-card-background/80">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="soft"
              disabled={!name || !url || !!existingServiceWarning || isChecking || saving}
              onClick={handleSave}
            >
              {saving ? 'Saving...' : 'Create Service'}
            </Button>
          </div>
          <CreateCategoryModal
            isOpen={showCreateCategory}
            onClose={() => setShowCreateCategory(false)}
            onCreate={(t) => {
              setCategory(t);
              setShowCreateCategory(false);
            }}
            initialTitle={newCategoryTitle}
          />
        </div>
      </ModalBody>
    </Modal>
  );
};

export default CreateServiceModal;
