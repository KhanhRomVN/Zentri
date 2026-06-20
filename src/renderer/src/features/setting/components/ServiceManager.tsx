import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SchemaField } from './SchemaBuilder';
import { Database, Edit2, Check, X, Lock, Trash2, Loader2, Search } from 'lucide-react';
import { ServiceProviderConfig } from '../../email/types';
import { cn } from '@renderer/shared/lib/utils';
import { v4 as uuidv4 } from 'uuid';

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

  const containerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [focusedServiceId, setFocusedServiceId] = useState<string | null>(null);
  const [secretSearch, setSecretSearch] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    serviceId: string;
  } | null>(null);
  const [serviceSecrets, setServiceSecrets] = useState<any[]>([]);
  const [loadingSecrets, setLoadingSecrets] = useState(false);

  // Metadata editor state (replaces ServiceMetadataBuilder)
  const [metadataFields, setMetadataFields] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    const handleAddService = () => {
      setEditingService({});
      setIsNew(true);
      setIsModalOpen(true);
      setMetadataFields([]);
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

  useEffect(() => {
    const fetchSecrets = async () => {
      if (!focusedServiceId) {
        setServiceSecrets([]);
        return;
      }
      setLoadingSecrets(true);
      try {
        // @ts-ignore
        const secrets = await window.electron.ipcRenderer.invoke(
          'sqlite:all',
          `SELECT ses.*, se.username, e.email as accountEmail 
           FROM service_emails_secrets ses
           JOIN service_emails se ON ses.service_email_id = se.id
           JOIN emails e ON se.email_id = e.id
           WHERE se.service_id = ?`,
          [focusedServiceId],
        );
        setServiceSecrets(secrets || []);
      } catch (err) {
        console.error('Failed to load service secrets', err);
      } finally {
        setLoadingSecrets(false);
      }
    };
    fetchSecrets();
  }, [focusedServiceId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          metadata: row.metadata ? JSON.parse(row.metadata) : [],
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

      const uniqueDetected = Array.from(
        new Map(allDetected.map((item) => [item['url'], item])).values(),
      );

      const registeredUrls = new Set(Object.values(services).map((s) => s.websiteUrl));
      const pending = uniqueDetected.filter((s) => !registeredUrls.has(s.url));

      setAllDetectedServices(pending);

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

  const getFaviconUrl = (url: string) => {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

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

  const validateService = (name: string, url: string, currentId?: string) => {
    const newErrors: Record<string, string> = {};

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
      )
    ) {
      return;
    }

    const id = editingService.id || editingService.name.toLowerCase().replace(/\s+/g, '-');

    // Convert metadata fields back to metadata array
    const metadata = metadataFields
      .filter((f) => f.key.trim())
      .map((f) => ({ key: f.key.trim(), value: f.value }));

    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        `INSERT OR REPLACE INTO services (id, name, url, tags, category, description, metadata, config_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          id,
          editingService.name,
          editingService.websiteUrl,
          JSON.stringify(editingService.defaultTags || []),
          JSON.stringify(editingService.defaultCategories || []),
          (editingService as any).description || '',
          JSON.stringify(metadata),
          JSON.stringify({}),
        ],
      );

      await loadServices();
      setIsModalOpen(false);

      window.dispatchEvent(
        new CustomEvent('zentri:sync-status-changed', { detail: { isDirty: true } }),
      );

      console.log('[ServiceManager] Saved service to SQLite:', editingService.name);
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Failed to save service. Please try again.');
    }
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
          `INSERT OR REPLACE INTO services (id, name, url, tags, category, description, metadata, config_json, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            serviceId,
            edits.name,
            edits.url,
            JSON.stringify(edits.tags.split(',').map((t: string) => t.trim())),
            JSON.stringify([edits.category]),
            edits.description,
            JSON.stringify([]),
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
    // Convert metadata object to fields array
    const meta = service.metadata || [];
    setMetadataFields(
      Array.isArray(meta)
        ? meta.map((m: any) => ({
            key: m.key || m.label || '',
            value: m.value || '',
          }))
        : [],
    );
  };

  // Derived data for tag/category suggestions
  const allExistingTags = Array.from(
    new Set(Object.values(services).flatMap((s) => s.defaultTags || [])),
  ).sort();
  const allExistingCategories = Array.from(
    new Set(Object.values(services).flatMap((s) => s.defaultCategories || [])),
  ).sort();

  return (
    <div className="h-full flex flex-col relative" ref={containerRef}>
      {/* Render Table or Sync View */}
      {!isSyncView ? (
        <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="border-collapse table-fixed w-full">
              <thead className="sticky top-0 z-30">
                <tr className="hover:bg-transparent border-b border-border/50 bg-table-headerBg shadow-sm">
                  <th className="pl-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left">
                    Service
                  </th>
                  <th className="w-[180px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left">
                    Tags
                  </th>
                  <th className="w-[180px] pr-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left">
                    Categories
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-center py-20 text-muted-foreground/30 font-mono text-xs"
                    >
                      Loading service registry...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr className="hover:bg-transparent border-none">
                    <td colSpan={3} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Database className="w-16 h-16" />
                        <span className="text-[12px] font-black uppercase tracking-[0.3em]">
                          No services found. Add one to get started.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows
                    .filter((s) => !focusedServiceId || s.id === focusedServiceId)
                    .map((service) => (
                      <React.Fragment key={service.id}>
                        <tr
                          className={cn(
                            'group transition-all cursor-pointer border-b border-border/20 h-[56px] hover:bg-table-hoverItemBodyBg/50',
                            focusedServiceId === service.id &&
                              'bg-primary/5 sticky top-0 z-40 backdrop-blur-md border-b-primary/30',
                          )}
                          onClick={() =>
                            setFocusedServiceId(focusedServiceId === service.id ? null : service.id)
                          }
                          onContextMenu={(e: React.MouseEvent) => {
                            e.preventDefault();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              serviceId: service.id,
                            });
                          }}
                        >
                          <td className="pl-6">
                            <div className="flex items-center gap-4">
                              {focusedServiceId === service.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFocusedServiceId(null);
                                  }}
                                  className="p-1 px-2 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all mr-2"
                                >
                                  Back
                                </button>
                              )}
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
                          </td>
                          <td>
                            <div className="flex gap-1 overflow-hidden">
                              {(service.defaultTags || [])
                                .filter((t) => t.trim())
                                .slice(0, 3)
                                .map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md border border-border/50 text-[9px] uppercase text-muted-foreground bg-muted/30"
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td className="pr-6">
                            {service.defaultCategories?.[0] && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-amber-500/30 text-[10px] uppercase font-black text-amber-500 bg-amber-500/5">
                                {service.defaultCategories[0]}
                              </span>
                            )}
                          </td>
                        </tr>

                        {focusedServiceId === service.id && (
                          <tr className="hover:bg-transparent border-none">
                            <td colSpan={3} className="p-0">
                              <div className="bg-background/20 backdrop-blur-xl border-b border-border/10 animate-in fade-in duration-300">
                                <div className="h-12 px-10 flex items-center justify-between gap-4 border-b border-border/5 bg-white/[0.01]">
                                  <div className="flex-1 max-w-sm">
                                    <div className="relative flex items-center">
                                      <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground/50" />
                                      <input
                                        type="text"
                                        placeholder={`Search registry vault for ${service.name}...`}
                                        value={secretSearch}
                                        onChange={(e) => setSecretSearch(e.target.value)}
                                        className="w-full h-8 pl-9 pr-3 bg-muted/5 border border-border/5 focus:bg-muted/10 rounded-lg text-[11px] text-foreground placeholder:text-muted-foreground/40 outline-none"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => handleEdit(service)}
                                      className="px-4 py-1.5 rounded-lg bg-muted/50 text-foreground text-[9px] font-black uppercase tracking-widest hover:bg-muted transition-all border border-border/50"
                                    >
                                      Configure
                                    </button>
                                  </div>
                                </div>

                                <div className="bg-transparent overflow-hidden">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-muted/5 hover:bg-muted/5 border-b border-border/10 h-10">
                                        <th className="text-[10px] font-black uppercase tracking-widest pl-10 text-left">
                                          Account Identity
                                        </th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-left">
                                          Credential Key
                                        </th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-left">
                                          Value
                                        </th>
                                        <th className="text-[10px] font-black uppercase tracking-widest pr-10 text-right">
                                          Actions
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {loadingSecrets ? (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="text-center py-16 opacity-30"
                                          >
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                          </td>
                                        </tr>
                                      ) : serviceSecrets.filter(
                                          (s) =>
                                            s.secret_name
                                              .toLowerCase()
                                              .includes(secretSearch.toLowerCase()) ||
                                            s.username
                                              .toLowerCase()
                                              .includes(secretSearch.toLowerCase()) ||
                                            s.accountEmail
                                              .toLowerCase()
                                              .includes(secretSearch.toLowerCase()),
                                        ).length === 0 ? (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="text-center py-16 opacity-20"
                                          >
                                            <div className="flex flex-col items-center gap-2">
                                              <Database className="w-8 h-8 mb-1 opacity-20" />
                                              <p className="text-[10px] font-black uppercase tracking-widest">
                                                {secretSearch
                                                  ? 'No matching registry records'
                                                  : 'No active links'}
                                              </p>
                                            </div>
                                          </td>
                                        </tr>
                                      ) : (
                                        serviceSecrets
                                          .filter(
                                            (s) =>
                                              s.secret_name
                                                .toLowerCase()
                                                .includes(secretSearch.toLowerCase()) ||
                                              s.username
                                                .toLowerCase()
                                                .includes(secretSearch.toLowerCase()) ||
                                              s.accountEmail
                                                .toLowerCase()
                                                .includes(secretSearch.toLowerCase()),
                                          )
                                          .map((secret) => (
                                            <tr
                                              key={secret.id}
                                              className="group/item border-b border-border/10 last:border-0 hover:bg-white/[0.03] transition-colors h-14"
                                            >
                                              <td className="pl-10 font-mono text-[11px] py-3">
                                                <div className="flex flex-col">
                                                  <span className="text-foreground/90 font-bold leading-none">
                                                    {secret.username}
                                                  </span>
                                                  <span className="text-muted-foreground/40 text-[9px] mt-1">
                                                    {secret.accountEmail}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="font-mono text-[11px] py-3 text-primary/70">
                                                {secret.secret_name}
                                              </td>
                                              <td className="font-mono text-[11px] py-3">
                                                <div className="flex items-center gap-3">
                                                  <span className="tracking-[0.3em] opacity-20 group-hover/item:opacity-60 transition-opacity">
                                                    ••••••••
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="pr-10 text-right py-3">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover/item:opacity-100 transition-all translate-x-2 group-hover/item:translate-x-0">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      navigator.clipboard.writeText(
                                                        secret.secret_value,
                                                      );
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-primary/20 text-primary transition-all"
                                                    title="Copy secret value"
                                                  >
                                                    <Database className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Service Footer */}
          <div className="h-12 border-t border-border/50 bg-table-headerBg/80 backdrop-blur-xl flex items-center px-6 shrink-0 z-40">
            <div className="flex-1 text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.25em]">
              Service Registry Capacity
            </div>
            <div className="text-[11px] text-foreground font-mono font-black tracking-tighter">
              {rows.length}{' '}
              <span className="text-[9px] text-primary/70 ml-1 tracking-widest font-black uppercase">
                Registered
              </span>
            </div>
          </div>

          {/* Context Menu */}
          {contextMenu &&
            createPortal(
              <div
                ref={contextMenuRef}
                className="fixed bg-popover border border-border/50 rounded-xl shadow-2xl py-1.5 z-[1000] min-w-[160px] animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl"
                style={{ top: contextMenu.y, left: contextMenu.x }}
              >
                <button
                  onClick={() => {
                    handleEdit(services[contextMenu.serviceId]);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-muted/50 flex items-center gap-3 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-primary" />
                  Edit Configuration
                </button>
                <button
                  onClick={() => {
                    setFocusedServiceId(contextMenu.serviceId);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-muted/50 flex items-center gap-3 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-orange-500" />
                  Manage Secrets
                </button>
                <div className="h-px bg-border/30 my-1 mx-2" />
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        `Are you sure you want to remove "${services[contextMenu.serviceId].name}"?`,
                      )
                    ) {
                      try {
                        // @ts-ignore
                        await window.electron.ipcRenderer.invoke(
                          'sqlite:run',
                          'DELETE FROM services WHERE id = ?',
                          [contextMenu.serviceId],
                        );
                        await loadServices();
                      } catch (e) {
                        console.error('Delete failed', e);
                      }
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-destructive/10 text-destructive/80 hover:text-destructive flex items-center gap-3 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Service
                </button>
              </div>,
              document.body,
            )}
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

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            Service Name <span className="text-destructive ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            value={pendingEditedValues[service.url]?.name || service.name}
                            onChange={(e) =>
                              setPendingEditedValues((prev) => ({
                                ...prev,
                                [service.url]: { ...prev[service.url], name: e.target.value },
                              }))
                            }
                            placeholder="e.g. OpenAI"
                            className="w-full h-10 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            Category
                          </label>
                          <input
                            type="text"
                            value={pendingEditedValues[service.url]?.category || ''}
                            onChange={(e) =>
                              setPendingEditedValues((prev) => ({
                                ...prev,
                                [service.url]: { ...prev[service.url], category: e.target.value },
                              }))
                            }
                            placeholder="Development"
                            className="w-full h-10 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          URL <span className="text-destructive ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={pendingEditedValues[service.url]?.url || service.url}
                          onChange={(e) =>
                            setPendingEditedValues((prev) => ({
                              ...prev,
                              [service.url]: { ...prev[service.url], url: e.target.value },
                            }))
                          }
                          className="w-full h-10 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          Tags
                        </label>
                        <input
                          type="text"
                          value={pendingEditedValues[service.url]?.tags || ''}
                          onChange={(e) =>
                            setPendingEditedValues((prev) => ({
                              ...prev,
                              [service.url]: { ...prev[service.url], tags: e.target.value },
                            }))
                          }
                          placeholder="AI, Dev, Private (comma separated)"
                          className="w-full h-10 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
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

      {/* Edit Service Drawer - Native */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-[500px] h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {isNew ? 'Initialize New Service' : 'Edit Service Configuration'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isNew
                    ? 'Configure a new cloud deployment provider for Zentri'
                    : `Review and update settings for ${editingService.name}`}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              {/* Service Identity */}
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Name
                    <span className="text-destructive ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingService.name || ''}
                    onChange={(e) => {
                      setEditingService((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    onBlur={() => validateField('name', editingService.name || '')}
                    placeholder="e.g. Google Cloud"
                    className={cn(
                      'w-full h-10 px-3 rounded-xl bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50',
                      errors.name ? 'border-destructive' : 'border-border',
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[11px] font-bold text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    URL
                  </label>
                  <input
                    type="text"
                    value={editingService.websiteUrl || ''}
                    onChange={(e) => {
                      setEditingService((prev) => ({ ...prev, websiteUrl: e.target.value }));
                      if (errors.websiteUrl) setErrors((prev) => ({ ...prev, websiteUrl: '' }));
                    }}
                    onBlur={() => validateField('websiteUrl', editingService.websiteUrl || '')}
                    placeholder="https://console.cloud.google.com"
                    className={cn(
                      'w-full h-10 px-3 rounded-xl bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50',
                      errors.websiteUrl ? 'border-destructive' : 'border-border',
                    )}
                  />
                  {errors.websiteUrl && (
                    <p className="mt-1 text-[11px] font-bold text-destructive">
                      {errors.websiteUrl}
                    </p>
                  )}
                </div>
              </div>

              {/* Category - Native Combobox */}
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Category
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="Select or create category..."
                        value={
                          categorySearch ||
                          editingService.defaultCategories?.[0] ||
                          ''
                        }
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setCategoryInputOpen(true);
                        }}
                        onFocus={() => setCategoryInputOpen(true)}
                        onBlur={() => setTimeout(() => setCategoryInputOpen(false), 200)}
                        className="w-full h-10 px-3 pr-8 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
                      />
                      {editingService.defaultCategories?.[0] && (
                        <button
                          onClick={() => {
                            setEditingService((prev) => ({ ...prev, defaultCategories: [] }));
                          }}
                          className="absolute right-3 p-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {categoryInputOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-2xl z-50 max-h-[200px] overflow-y-auto">
                        {allExistingCategories
                          .filter((c) =>
                            c.toLowerCase().includes(categorySearch.toLowerCase()),
                          )
                          .map((category) => (
                            <button
                              key={category}
                              onMouseDown={() => {
                                setEditingService((prev) => ({
                                  ...prev,
                                  defaultCategories: [category],
                                }));
                                setCategorySearch('');
                                setCategoryInputOpen(false);
                              }}
                              className="flex items-center justify-between w-full px-4 py-2.5 text-xs hover:bg-muted text-left transition-colors"
                            >
                              <span>{category}</span>
                              {(editingService.defaultCategories || []).includes(category) && (
                                <Check className="w-3 h-3 text-primary" />
                              )}
                            </button>
                          ))}
                        {categorySearch &&
                          !allExistingCategories.includes(categorySearch) && (
                            <button
                              onMouseDown={() => {
                                setEditingService((prev) => ({
                                  ...prev,
                                  defaultCategories: [categorySearch],
                                }));
                                setCategorySearch('');
                                setCategoryInputOpen(false);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-primary hover:bg-muted text-left transition-colors border-t border-border/50"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Create "{categorySearch}"</span>
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags - Native Tag Input */}
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Tags
                  </label>
                  <div className="relative">
                    <div className="bg-input-background border border-border rounded-xl">
                      {(editingService.defaultTags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 pb-0">
                          {(editingService.defaultTags || []).map((tag, idx) => {
                            const colors = [
                              'bg-blue-500/20 text-blue-400 border-blue-500/30',
                              'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                              'bg-amber-500/20 text-amber-400 border-amber-500/30',
                              'bg-pink-500/20 text-pink-400 border-pink-500/30',
                              'bg-purple-500/20 text-purple-400 border-purple-500/30',
                              'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                            ];
                            const colorClass = colors[idx % colors.length];
                            return (
                              <span
                                key={tag}
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border',
                                  colorClass,
                                )}
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newTags = (editingService.defaultTags || []).filter(
                                      (t) => t !== tag,
                                    );
                                    setEditingService((prev) => ({
                                      ...prev,
                                      defaultTags: newTags,
                                    }));
                                  }}
                                  className="hover:opacity-70 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Add tags..."
                        value={tagSearch}
                        onChange={(e) => {
                          setTagSearch(e.target.value);
                          setTagInputOpen(true);
                        }}
                        onFocus={() => setTagInputOpen(true)}
                        onBlur={() => setTimeout(() => setTagInputOpen(false), 200)}
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
                        className="w-full h-10 px-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none rounded-xl"
                      />
                    </div>
                    {tagInputOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-2xl z-50 max-h-[200px] overflow-y-auto">
                        {allExistingTags
                          .filter(
                            (t) =>
                              !(editingService.defaultTags || []).includes(t) &&
                              t.toLowerCase().includes(tagSearch.toLowerCase()),
                          )
                          .map((tag) => (
                            <button
                              key={tag}
                              onMouseDown={() => {
                                const currentTags = editingService.defaultTags || [];
                                if (!currentTags.includes(tag)) {
                                  setEditingService((prev) => ({
                                    ...prev,
                                    defaultTags: [...currentTags, tag],
                                  }));
                                }
                                setTagSearch('');
                                setTagInputOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-xs hover:bg-muted text-left transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                        {tagSearch &&
                          !allExistingTags.includes(tagSearch) &&
                          !(editingService.defaultTags || []).includes(tagSearch) && (
                            <button
                              onMouseDown={() => {
                                const currentTags = editingService.defaultTags || [];
                                if (!currentTags.includes(tagSearch)) {
                                  setEditingService((prev) => ({
                                    ...prev,
                                    defaultTags: [...currentTags, tagSearch],
                                  }));
                                }
                                setTagSearch('');
                                setTagInputOpen(false);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-primary hover:bg-muted text-left transition-colors border-t border-border/50"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Create "{tagSearch}"</span>
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                  {errors.tags && (
                    <p className="mt-1 text-[11px] font-bold text-destructive">{errors.tags}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
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
                    onBlur={() =>
                      validateField('description', (editingService as any).description || '')
                    }
                    placeholder="Detailed description of the service and its purpose..."
                    className={cn(
                      'w-full bg-input-background border rounded-xl px-4 py-3 text-sm focus:outline-none min-h-[120px] resize-none transition-all',
                      errors.description
                        ? 'border-destructive'
                        : 'border-border focus:border-primary/50',
                    )}
                  />
                  {errors.description && (
                    <p className="mt-1.5 text-[11px] font-bold text-destructive ml-1">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Metadata Key-Value Editor (replaces ServiceMetadataBuilder) */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Metadata Fields
                  </label>
                  <button
                    onClick={() =>
                      setMetadataFields((prev) => [...prev, { key: '', value: '' }])
                    }
                    className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[10px] font-black uppercase"
                  >
                    + Add
                  </button>
                </div>
                {metadataFields.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/40 italic">
                    No metadata fields defined. Add key-value pairs for additional service configuration.
                  </p>
                )}
                {metadataFields.map((field, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <input
                      type="text"
                      placeholder="Key"
                      value={field.key}
                      onChange={(e) => {
                        const updated = [...metadataFields];
                        updated[idx] = { ...updated[idx], key: e.target.value };
                        setMetadataFields(updated);
                      }}
                      className="flex-1 h-9 px-3 rounded-lg bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) => {
                        const updated = [...metadataFields];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        setMetadataFields(updated);
                      }}
                      className="flex-1 h-9 px-3 rounded-lg bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={() =>
                        setMetadataFields((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-muted-foreground/30 hover:text-destructive transition-colors shrink-0 mt-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex gap-4 w-full p-4 border-t border-border bg-card/50 shrink-0">
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
          </div>
        </div>
      )}
    </div>
  );
};