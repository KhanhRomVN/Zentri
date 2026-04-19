import { useState, useEffect, useCallback } from 'react';
import { SchemaField } from './SchemaBuilder';
import {
  Table,
  TableBody,
  TableCell,
  HeaderCell,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table';
import { Drawer } from '../../../shared/components/ui/drawer';
import Input from '../../../shared/components/ui/input/Input';
import Combobox from '../../../shared/components/ui/combobox/Combobox';
import { Database, Edit2, Check, X } from 'lucide-react';
import { ServiceProviderConfig } from '../../email/components/tabs/service/utils/servicePresets';
import { cn } from '@renderer/shared/lib/utils';
import { Modal } from '../../../shared/components/ui/modal';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '../../../shared/components/ui/badge';
import Avatar from '../../../shared/components/ui/avatar/Avatar';

export const ServiceManager = () => {
  const [services, setServices] = useState<Record<string, ServiceProviderConfig>>({});
  const [loading, setLoading] = useState(true);

  // Edit/Create State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceProviderConfig>>({});
  const [isNew, setIsNew] = useState(false);

  // Combobox states for tags and categories
  const [tagSearch, setTagSearch] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryInputOpen, setCategoryInputOpen] = useState(false);

  // Combined Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allDetectedServices, setAllDetectedServices] = useState<any[]>([]);
  const [isSyncView, setIsSyncView] = useState(false);
  const [pendingEditedValues, setPendingEditedValues] = useState<Record<string, any>>({});

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    const handleAddService = () => {
      setEditingService({});
      setIsNew(true);
      setIsModalOpen(true);
    };

    window.addEventListener('add-service-click', handleAddService);
    return () => window.removeEventListener('add-service-click', handleAddService);
  }, []);

  // Reset validation errors when drawer opens/closes
  useEffect(() => {
    if (!isModalOpen) {
      setErrors({});
      setTagSearch('');
      setCategorySearch('');
      setTagInputOpen(false);
      setCategoryInputOpen(false);
    }
  }, [isModalOpen]);

  const loadServices = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke('sqlite:all', 'SELECT * FROM services');

      const mappedServices: Record<string, ServiceProviderConfig> = {};
      rows.forEach((row: any) => {
        let config = {};
        try {
          config = row.config_json ? JSON.parse(row.config_json) : {};
        } catch (e) {
          console.error('Failed to parse config_json for service', row.id, e);
        }

        mappedServices[row.id] = {
          id: row.id,
          name: row.name,
          websiteUrl: row.url || '',
          defaultTags: row.tags ? JSON.parse(row.tags) : [],
          defaultCategories: row.category ? JSON.parse(row.category) : [],
          ...config,
        } as ServiceProviderConfig;
      });

      setServices(mappedServices);
      console.log('[ServiceManager] Loaded services from SQLite:', mappedServices);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices({});
    } finally {
      setLoading(false);
    }
  };

  const scanAllChromeServices = async () => {
    try {
      // @ts-ignore
      const accounts = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        'SELECT * FROM emails WHERE status = "active"',
      );
      const allDetected: any[] = [];

      for (const acc of accounts) {
        // @ts-ignore
        const detected = await window.electron.ipcRenderer.invoke('email:get-services', {
          email: acc.email,
        });
        allDetected.push(
          ...detected.map((d: any) => ({ ...d, accountId: acc.id, accountEmail: acc.email })),
        );
      }

      // Filter uniques by URL
      const uniqueDetected = Array.from(
        new Map(allDetected.map((item) => [item['url'], item])).values(),
      );

      // Filter out already registered
      const registeredUrls = new Set(Object.values(services).map((s) => s.websiteUrl));
      const pending = uniqueDetected.filter((s) => !registeredUrls.has(s.url));

      setAllDetectedServices(pending);

      // Initialize edited values
      const initialValues: Record<string, any> = {};
      pending.forEach((s: any) => {
        initialValues[s.url] = {
          name: s.name,
          category: '',
          url: s.url,
          tags: '',
          description: '',
        };
      });
      setPendingEditedValues(initialValues);

      // Emit event to parent index.tsx
      window.dispatchEvent(
        new CustomEvent('zentri:services-pending-count', {
          detail: { count: pending.length },
        }),
      );
    } catch (err) {
      console.error('Failed to scan chrome services:', err);
    }
  };

  useEffect(() => {
    if (!loading) {
      scanAllChromeServices();
    }
  }, [loading, services]);

  useEffect(() => {
    const handleDetectClick = () => {
      setIsSyncView(true);
    };
    window.addEventListener('detect-services-click', handleDetectClick);
    return () => window.removeEventListener('detect-services-click', handleDetectClick);
  }, []);

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

  // Helper component for favicon display with fallback
  const FaviconIcon = ({ url }: { url: string }) => {
    const [error, setError] = useState(false);
    const faviconUrl = getFaviconUrl(url);

    if (error || !faviconUrl) {
      return <Database className="h-5 w-5 text-muted-foreground" />;
    }

    return (
      <img
        src={faviconUrl}
        alt="favicon"
        className="w-5 h-5 object-contain"
        onError={() => setError(true)}
      />
    );
  };

  // Validation function for individual fields
  const validateField = useCallback(
    (name: string, value: string) => {
      let error = '';
      if (name === 'name') {
        if (!value.trim()) error = 'Service name is required';
        else {
          const duplicateName = Object.values(services).find(
            (s) =>
              s.name.toLowerCase().trim() === value.toLowerCase().trim() &&
              s.id !== editingService.id,
          );
          if (duplicateName) error = `Service "${duplicateName.name}" already exists`;
        }
      } else if (name === 'websiteUrl') {
        if (value && value.trim()) {
          const duplicateUrl = Object.values(services).find(
            (s) =>
              s.websiteUrl.toLowerCase().trim() === value.toLowerCase().trim() &&
              s.id !== editingService.id,
          );
          if (duplicateUrl) error = `URL already used by "${duplicateUrl.name}"`;
        }
      }
      setErrors((prev) => ({ ...prev, [name]: error }));
      return !error;
    },
    [services, editingService.id],
  );

  // Validation function to check for duplicates (for handleSave)
  const validateService = (name: string, url: string, currentId?: string) => {
    const newErrors: Record<string, string> = {};

    // Check for duplicate name if name is provided
    if (!name || !name.trim()) {
      newErrors.name = 'Service name is required';
    } else {
      const duplicateName = Object.values(services).find(
        (s) => s.name.toLowerCase().trim() === name.toLowerCase().trim() && s.id !== currentId,
      );
      if (duplicateName) {
        newErrors.name = `Service "${duplicateName.name}" already exists`;
      }
    }

    // Check for duplicate URL if URL is provided
    if (url && url.trim()) {
      const duplicateUrl = Object.values(services).find(
        (s) => s.websiteUrl.toLowerCase().trim() === url.toLowerCase().trim() && s.id !== currentId,
      );
      if (duplicateUrl) {
        newErrors.websiteUrl = `URL already used by "${duplicateUrl.name}"`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!editingService.name || !editingService.websiteUrl) {
      alert('Please fill in Service Name and Website URL');
      return;
    }

    // Validate for duplicates
    const validateSchema = (fields: SchemaField[]): boolean => {
      if (!fields || fields.length === 0) return true;
      for (const field of fields) {
        if (!field.label || !field.key) return false;
        if (field.type === 'array') {
          if (!field.itemType) return false;
          if (field.itemType === 'object') {
            if (!field.children || field.children.length === 0) return false;
            if (!validateSchema(field.children)) return false;
          }
        }
        if (field.type === 'object') {
          if (!field.children || field.children.length === 0) return false;
          if (!validateSchema(field.children)) return false;
        }
      }
      return true;
    };

    if (
      !validateService(
        editingService.name || '',
        editingService.websiteUrl || '',
        editingService.id,
      ) ||
      (editingService.commonFields && !validateSchema(editingService.commonFields as any))
    ) {
      return;
    }

    const id = editingService.id || editingService.name.toLowerCase().replace(/\s+/g, '-');

    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        `INSERT OR REPLACE INTO services (id, name, url, tags, category, description, config_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          id,
          editingService.name,
          editingService.websiteUrl,
          JSON.stringify(editingService.defaultTags || []),
          JSON.stringify(editingService.defaultCategories || []),
          (editingService as any).description || '',
          JSON.stringify({}), // Empty config for now as we simplified
        ],
      );

      await loadServices();
      setIsModalOpen(false);

      // Trigger sync status change
      window.dispatchEvent(
        new CustomEvent('zentri:sync-status-changed', { detail: { isDirty: true } }),
      );

      console.log('[ServiceManager] Saved service to SQLite:', editingService.name);
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Failed to save service. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('sqlite:run', 'DELETE FROM services WHERE id = ?', [
        id,
      ]);

      await loadServices();

      // Trigger sync status change
      window.dispatchEvent(
        new CustomEvent('zentri:sync-status-changed', { detail: { isDirty: true } }),
      );

      console.log('[ServiceManager] Deleted service from SQLite:', id);
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };

  const getBadgeColor = (text: string) => {
    const colors = [
      { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
      { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
      { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
      { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
      { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20' },
      { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
      { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
      { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20' },
    ];
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleRegisterAllGlobal = async () => {
    for (const service of allDetectedServices) {
      const edits = pendingEditedValues[service.url] || {
        name: service.name,
        url: service.url,
        tags: 'Chrome, Sync',
        category: 'Imported',
        description: '',
      };
      const serviceId = uuidv4();
      try {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke(
          'sqlite:run',
          `INSERT OR REPLACE INTO services (id, name, url, tags, category, description, config_json, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            serviceId,
            edits.name,
            edits.url,
            JSON.stringify(edits.tags.split(',').map((t: string) => t.trim())),
            JSON.stringify([edits.category]),
            edits.description,
            JSON.stringify({}),
          ],
        );
      } catch (e) {
        console.error('Failed to register global service:', service.url, e);
      }
    }
    await loadServices();
    setIsSyncView(false);
    scanAllChromeServices();
  };

  const rows = Object.values(services);

  const handleEdit = (service: ServiceProviderConfig) => {
    setEditingService(service);
    setIsNew(false);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Render Table or Sync View */}
      {!isSyncView ? (
        <div className="flex-1 overflow-auto custom-scrollbar bg-card/10 backdrop-blur-md border-l border-border/50">
          <Table className="border-collapse table-fixed w-full">
            <TableHeader className="sticky top-0 z-30">
              <TableRow className="hover:bg-transparent border-b border-border/50 bg-table-headerBg shadow-sm">
                <HeaderCell className="pl-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10">
                  Service
                </HeaderCell>
                <HeaderCell className="w-[180px] text-[10px] uppercase tracking-[0.2em] font-bold h-10">
                  Tags
                </HeaderCell>
                <HeaderCell className="w-[180px] pr-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10">
                  Categories
                </HeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-20 text-muted-foreground/30 font-mono text-xs"
                  >
                    Loading service registry...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Database className="w-16 h-16" />
                      <span className="text-[12px] font-black uppercase tracking-[0.3em]">
                        No services found. Add one to get started.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((service) => (
                  <TableRow
                    key={service.id}
                    className="group transition-all cursor-pointer border-b border-border/20 h-[56px] hover:bg-table-hoverItemBodyBg/50"
                    onClick={() => handleEdit(service)}
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden shrink-0">
                          <img
                            src={getFaviconUrl(service.websiteUrl)}
                            alt={service.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-foreground text-[14px] font-bold tracking-tight truncate">
                            {service.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground/40 font-mono truncate">
                            {service.websiteUrl}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 overflow-hidden">
                        {(service.defaultTags || [])
                          .filter((t) => t.trim())
                          .slice(0, 3)
                          .map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-[9px] uppercase">
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      {service.defaultCategories?.[0] && (
                        <Badge variant="ghost-warning" className="text-[10px] uppercase font-black">
                          {service.defaultCategories[0]}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="px-8 pt-8 pb-4">
              {allDetectedServices.map((service: any, index: number) => (
                <div key={service.url} className="group/card relative py-12 first:pt-4 last:pb-24">
                  {index > 0 && (
                    <div className="absolute top-0 -left-8 -right-8 h-px bg-white/10" />
                  )}
                  <div className="flex flex-col gap-6">
                    {/* Header: Favicon & Numbering */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 backdrop-blur-sm">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${service.url}&sz=64`}
                          alt="favicon"
                          className="w-6 h-6 group-hover/card:scale-110 transition-transform"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-primary/80 uppercase tracking-[0.2em]">
                          Service #{String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] text-muted-foreground/40 font-mono">
                            {service.url}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Form Sections */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            Service Name <span className="text-destructive ml-1">*</span>
                          </label>
                          <Input
                            value={pendingEditedValues[service.url]?.name || service.name}
                            onChange={(e) =>
                              setPendingEditedValues((prev) => ({
                                ...prev,
                                [service.url]: { ...prev[service.url], name: e.target.value },
                              }))
                            }
                            placeholder="e.g. OpenAI"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            Category
                          </label>
                          <Input
                            value={pendingEditedValues[service.url]?.category || ''}
                            onChange={(e) =>
                              setPendingEditedValues((prev) => ({
                                ...prev,
                                [service.url]: { ...prev[service.url], category: e.target.value },
                              }))
                            }
                            placeholder="Development"
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          URL <span className="text-destructive ml-1">*</span>
                        </label>
                        <Input
                          value={pendingEditedValues[service.url]?.url || service.url}
                          onChange={(e) =>
                            setPendingEditedValues((prev) => ({
                              ...prev,
                              [service.url]: { ...prev[service.url], url: e.target.value },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          Tags
                        </label>
                        <Input
                          value={pendingEditedValues[service.url]?.tags || ''}
                          onChange={(e) =>
                            setPendingEditedValues((prev) => ({
                              ...prev,
                              [service.url]: { ...prev[service.url], tags: e.target.value },
                            }))
                          }
                          placeholder="AI, Dev, Private (comma separated)"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          Description
                        </label>
                        <textarea
                          value={pendingEditedValues[service.url]?.description || ''}
                          onChange={(e) =>
                            setPendingEditedValues((prev) => ({
                              ...prev,
                              [service.url]: { ...prev[service.url], description: e.target.value },
                            }))
                          }
                          className="w-full bg-input-background border border-border/50 rounded-2xl px-5 py-3 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all h-24 resize-none"
                          placeholder="Brief details about this service..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Footer for Sync View */}
          <div className="h-16 bg-background/80 backdrop-blur-3xl border-t border-border/50 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {allDetectedServices.length} Pending Services
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsSyncView(false)}
                className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-button-secondBg hover:bg-button-secondBgHover transition-colors text-foreground/80"
              >
                Cancel
              </button>
              <button
                onClick={handleRegisterAllGlobal}
                className="px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Migrate All to Zentri
              </button>
            </div>
          </div>
        </div>
      )}

      <Drawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isNew ? 'Initialize New Service' : 'Edit Service Configuration'}
        subtitle={
          isNew
            ? 'Configure a new cloud deployment provider for Zentri'
            : `Review and update settings for ${editingService.name}`
        }
        direction="right"
        width={500}
        footerActions={
          <div className="flex gap-4 w-full">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-button-secondBg hover:bg-button-secondBgHover transition-colors border border-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editingService.name}
              className={cn(
                'flex-1 px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg',
                !editingService.name
                  ? 'bg-button-bg/50 text-button-bgText cursor-not-allowed opacity-70'
                  : 'bg-button-bg text-button-bgText hover:bg-button-bgHover shadow-primary/20',
              )}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="p-4 space-y-4">
          {/* Service Identity */}
          <div className="space-y-4">
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Name
                <span className="text-destructive ml-1">*</span>
              </label>
              <Input
                type="text"
                value={editingService.name || ''}
                onChange={(e) => {
                  setEditingService((prev) => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                onBlur={() => validateField('name', editingService.name || '')}
                placeholder="e.g. Google Cloud"
                error={errors.name}
              />
            </div>

            {/* URL */}
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                URL
              </label>
              <Input
                type="text"
                value={editingService.websiteUrl || ''}
                onChange={(e) => {
                  setEditingService((prev) => ({ ...prev, websiteUrl: e.target.value }));
                  if (errors.websiteUrl) setErrors((prev) => ({ ...prev, websiteUrl: '' }));
                }}
                onBlur={() => validateField('websiteUrl', editingService.websiteUrl || '')}
                placeholder="https://console.cloud.google.com"
                error={errors.websiteUrl}
              />
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-4">
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Category
              </label>
              <Input
                type="combobox"
                placeholder="Select or create category..."
                value={categorySearch || editingService.defaultCategories?.[0] || ''}
                onChange={(e) => setCategorySearch(e.target.value)}
                multiValue={false}
                badges={[]} // Don't show badges for single-select category
                rightIcon={
                  editingService.defaultCategories?.[0] ? (
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingService((prev) => ({ ...prev, defaultCategories: [] }));
                      }}
                    />
                  ) : undefined
                }
                popoverOpen={categoryInputOpen}
                onPopoverOpenChange={setCategoryInputOpen}
                popoverContent={(() => {
                  const allCategories = Array.from(
                    new Set(Object.values(services).flatMap((s) => s.defaultCategories || [])),
                  ).sort();

                  return (
                    <div className="flex flex-col max-h-[200px] overflow-y-auto">
                      {allCategories
                        .filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()))
                        .map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              setEditingService((prev) => ({
                                ...prev,
                                defaultCategories: [category],
                              }));
                              setCategorySearch(''); // Clear search so input shows the selected value
                              setCategoryInputOpen(false);
                            }}
                            className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-muted text-left transition-colors"
                          >
                            <span>{category}</span>
                            {(editingService.defaultCategories || []).includes(category) && (
                              <Check className="w-3 h-3 text-primary" />
                            )}
                          </button>
                        ))}
                      {categorySearch && !allCategories.includes(categorySearch) && (
                        <button
                          onClick={() => {
                            setEditingService((prev) => ({
                              ...prev,
                              defaultCategories: [categorySearch],
                            }));
                            setCategorySearch(''); // Clear search so input shows the new value
                            setCategoryInputOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-primary hover:bg-muted text-left transition-colors border-t border-border/50"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Create "{categorySearch}"</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
                onBlur={() =>
                  validateField('category', editingService.defaultCategories?.[0] || '')
                }
                error={errors.category}
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Tags
              </label>
              <Input
                type="combobox"
                placeholder="Add tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                multiValue={true}
                badgeColorMode="diverse"
                badgeVariant="neon"
                badges={(editingService.defaultTags || []).map((t) => ({
                  id: t,
                  label: t,
                }))}
                onBadgeRemove={(id: string | number) => {
                  const newTags = (editingService.defaultTags || []).filter((t) => t !== id);
                  setEditingService((prev) => ({ ...prev, defaultTags: newTags }));
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' && tagSearch.trim()) {
                    const currentTags = editingService.defaultTags || [];
                    const newVal = tagSearch.trim();
                    if (!currentTags.includes(newVal)) {
                      setEditingService((prev) => ({
                        ...prev,
                        defaultTags: [...currentTags, newVal],
                      }));
                    }
                    setTagSearch('');
                    setTagInputOpen(false);
                  }
                }}
                popoverOpen={tagInputOpen}
                onPopoverOpenChange={setTagInputOpen}
                popoverContent={(() => {
                  const currentTags = editingService.defaultTags || [];
                  const existingTags = Array.from(
                    new Set(Object.values(services).flatMap((s) => s.defaultTags || [])),
                  ).sort();

                  return (
                    <Combobox
                      searchQuery={tagSearch}
                      options={existingTags
                        .map((t: string) => ({ value: t, label: t }))
                        .filter((o) => !currentTags.includes(o.value))}
                      creatable={true}
                      onCreate={(val: string) => {
                        if (!currentTags.includes(val)) {
                          setEditingService((prev) => ({
                            ...prev,
                            defaultTags: [...currentTags, val],
                          }));
                        }
                        setTagSearch('');
                        setTagInputOpen(false);
                      }}
                      onChange={(val: string) => {
                        if (!currentTags.includes(val)) {
                          setEditingService((prev) => ({
                            ...prev,
                            defaultTags: [...currentTags, val],
                          }));
                        }
                        setTagSearch('');
                        setTagInputOpen(false);
                      }}
                    />
                  );
                })()}
                onBlur={() => validateField('tags', (editingService.defaultTags || []).join(','))}
                error={errors.tags}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Description
            </label>
            <textarea
              value={(editingService as any).description || ''}
              onChange={(e) => {
                setEditingService((prev) => ({ ...prev, description: e.target.value }));
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              onBlur={() => validateField('description', (editingService as any).description || '')}
              placeholder="Detailed description of the service and its purpose..."
              className={cn(
                'w-full bg-input-background border rounded-xl px-4 py-3 text-sm focus:outline-none min-h-[120px] resize-none transition-all',
                errors.description ? 'border-destructive' : 'border-border focus:border-primary/50',
              )}
            />
            {errors.description && (
              <p className="mt-1.5 text-[11px] font-bold text-destructive ml-1">
                {errors.description}
              </p>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
};
