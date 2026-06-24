import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Trash2 } from 'lucide-react';
import { ServiceProviderConfig } from '../../../email/types';
import { cn } from '@renderer/shared/lib/utils';
import { useServiceDrawer } from '../../../../contexts/ServiceDrawerContext';

interface ServiceManagerProps {
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
}

export const ServiceManager = ({}: ServiceManagerProps) => {
  const [services, setServices] = useState<Record<string, ServiceProviderConfig>>({});
  const [loading, setLoading] = useState(true);
  const { openDrawer } = useServiceDrawer();
  const containerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [focusedServiceId, setFocusedServiceId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    serviceId: string;
  } | null>(null);

  useEffect(() => {
    loadServices();
  }, []);
  useEffect(() => {
    const h = () => {
      openDrawer(null, true);
    };
    window.addEventListener('add-service-click', h);
    return () => window.removeEventListener('add-service-click', h);
  }, [openDrawer]);

  useEffect(() => {
    const h = () => {
      loadServices();
    };
    window.addEventListener('services-changed', h);
    return () => window.removeEventListener('services-changed', h);
  }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node))
        setContextMenu(null);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke('sqlite:all', 'SELECT * FROM services');
      const mapped: Record<string, ServiceProviderConfig> = {};
      rows.forEach((row: any) => {
        mapped[row.id] = {
          id: row.id,
          name: row.name,
          websiteUrl: row.url || '',
          defaultTags: row.tags ? JSON.parse(row.tags) : [],
          defaultCategories: row.category ? JSON.parse(row.category) : [],
          metadata: row.metadata ? JSON.parse(row.metadata) : [],
        } as ServiceProviderConfig;
      });
      setServices(mapped);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices({});
    } finally {
      setLoading(false);
    }
  };

  const getFaviconUrl = (url: string) => {
    if (!url) return '';
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
    } catch {
      return '';
    }
  };

  const handleSave = async (
    data: Partial<ServiceProviderConfig>,
    metadata: { key: string; value: string }[],
    authMethods: string[],
  ) => {
    const id = editingService.id || (data.name || '').toLowerCase().replace(/\s+/g, '-');
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        `INSERT OR REPLACE INTO services (id, name, url, tags, category, description, metadata, config_json, auth_method, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          id,
          data.name,
          data.websiteUrl,
          JSON.stringify(data.defaultTags || []),
          JSON.stringify(data.defaultCategories || []),
          (data as any).description || '',
          JSON.stringify(metadata),
          JSON.stringify({}),
          JSON.stringify(authMethods),
        ],
      );
      await loadServices();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  };

  const rows = Object.values(services);
  const handleEdit = (service: ServiceProviderConfig) => {
    openDrawer(service, false);
  };

  return (
    <div className="h-full flex flex-col relative" ref={containerRef}>
      <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="border-collapse table-fixed w-full">
            <thead className="sticky top-0 z-30">
              <tr className="hover:bg-transparent border-b border-border/50 bg-table-headerBg shadow-sm">
                <th className="w-[40px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-center text-muted-foreground">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-border/50 bg-input-background accent-primary cursor-pointer"
                    checked={selectAll}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectAll(checked);
                      if (checked) {
                        const allIds = rows.map((s) => s.id);
                        setSelectedServices(new Set(allIds));
                      } else {
                        setSelectedServices(new Set());
                      }
                    }}
                  />
                </th>
                <th className="w-[50px] pl-4 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                  STT
                </th>
                <th className="text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                  Service
                </th>
                <th className="w-[150px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                  Category
                </th>
                <th className="w-[150px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                  Auth
                </th>
                <th className="w-[200px] pr-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                  Metadata Fields
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-20 text-muted-foreground/30 font-mono text-xs"
                  >
                    Loading service registry...
                  </td>
                </tr>
              ) : (
                rows
                  .filter((s) => !focusedServiceId || s.id === focusedServiceId)
                  .map((service, index) => (
                    <React.Fragment key={service.id}>
                      <tr
                        className={cn(
                          'group transition-all border-b border-border/20 h-[48px] hover:bg-table-hoverItemBodyBg/50',
                          focusedServiceId === service.id &&
                            'bg-primary/5 sticky top-0 z-40 backdrop-blur-md border-b-primary/30',
                        )}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, serviceId: service.id });
                        }}
                      >
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-border/50 bg-input-background accent-primary cursor-pointer"
                            checked={selectedServices.has(service.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedServices((prev) => {
                                const next = new Set(prev);
                                if (checked) {
                                  next.add(service.id);
                                } else {
                                  next.delete(service.id);
                                }
                                return next;
                              });
                              setSelectAll(checked && rows.every((s) => selectedServices.has(s.id) || s.id === service.id));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="text-muted-foreground font-mono text-[10px] pl-4 py-2">
                          #{String(index + 1).padStart(2, '0')}
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center transition-transform overflow-hidden shrink-0 border border-primary/5 group-hover:scale-110">
                              <img
                                src={getFaviconUrl(service.websiteUrl)}
                                alt={service.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-foreground text-[13px] font-bold tracking-tight truncate">
                                {service.name}
                              </span>
                              <span className="text-[9px] text-muted-foreground/40 font-mono truncate">
                                {service.websiteUrl}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {service.defaultCategories?.[0] && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-amber-500/30 text-[10px] uppercase font-black text-amber-500 bg-amber-500/5">
                              {service.defaultCategories[0]}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {(service as any).authMethods?.length > 0 ? (
                              (service as any).authMethods.slice(0, 2).map((method: string) => (
                                <span
                                  key={method}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded border border-border/30 text-[8px] uppercase text-muted-foreground bg-muted/20"
                                >
                                  {method.replace('_', ' ')}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-muted-foreground/30 italic">—</span>
                            )}
                          </div>
                        </td>
                        <td className="pr-6">
                          <div className="flex flex-wrap gap-1">
                            {service.metadata && service.metadata.length > 0 ? (
                              service.metadata.slice(0, 3).map((field: any) => (
                                <span
                                  key={field.key}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded border border-border/30 text-[8px] text-muted-foreground bg-muted/20"
                                >
                                  {field.key}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-muted-foreground/30 italic">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <div className="h-10 border-t border-border/50 bg-table-headerBg/80 backdrop-blur-xl flex items-center px-4 shrink-0 z-40">
          <div className="flex-1 text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.25em]">
            {rows.length} services
          </div>
        </div>
        {contextMenu &&
          createPortal(
            <div
              ref={contextMenuRef}
              className="fixed bg-modal-background border border-border rounded-lg shadow-xl py-1.5 z-[1000] min-w-[160px] animate-in fade-in zoom-in-95 duration-100 p-1 hover:border-primary transition-colors"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                onClick={() => {
                  handleEdit(services[contextMenu.serviceId]);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary/50" />
                Edit Configuration
              </button>
              <div className="h-px bg-border/20 my-1 mx-2" />
              <button
                onClick={async () => {
                  if (confirm(`Remove "${services[contextMenu.serviceId].name}"?`)) {
                    try {
                      /* @ts-ignore */ await window.electron.ipcRenderer.invoke(
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
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500/60" />
                Delete Service
              </button>
            </div>,
            document.body,
          )}
      </div>
      
    </div>
  );
};
