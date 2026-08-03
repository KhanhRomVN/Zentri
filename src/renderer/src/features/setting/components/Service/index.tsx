import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, Loader2, PackageOpen } from 'lucide-react';
import { ServiceProviderConfig } from '../../../email/types';
import { cn } from '@renderer/shared/lib/utils';
import { useServiceDrawer } from '../../../../contexts/ServiceDrawerContext';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../components/ui/Dropdown';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/EmptyState';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
          description: row.description || '',
          metadata: row.metadata ? JSON.parse(row.metadata) : [],
          authMethods: row.auth_method ? JSON.parse(row.auth_method) : [],
          two_fa: row.two_fa ? JSON.parse(row.two_fa) : { has_totp: false, has_backup_codes: false },
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

  const handleDeleteService = async () => {
    if (!deleteConfirmId) return;
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('sqlite:run', 'DELETE FROM services WHERE id = ?', [
        deleteConfirmId,
      ]);
      await loadServices();
    } catch (e) {
      console.error('Delete failed', e);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const rows = Object.values(services);
  const handleEdit = (service: ServiceProviderConfig) => {
    openDrawer(service, false);
  };

  const showEmptyState = loading || rows.length === 0;

  return (
    <div className="h-full flex flex-col relative" ref={containerRef}>
      <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="border-collapse table-fixed w-full">
            <thead className="sticky top-0 z-30">
              <tr className="hover:bg-transparent border-b border-border/50 bg-table-header-background shadow-sm">
                <th className="w-[40px] text-sm font-bold h-10 text-center text-text-primary">
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
                <th className="w-auto pl-4 text-sm font-bold h-10 text-left text-text-primary">
                  STT
                </th>
                <th className="text-sm font-bold h-10 text-left text-text-primary">Service</th>
                <th className="w-[150px] text-sm font-bold h-10 text-left text-text-primary">
                  Category
                </th>
              </tr>
            </thead>
            {!showEmptyState && (
              <tbody>
                {rows
                  .filter((s) => !focusedServiceId || s.id === focusedServiceId)
                  .map((service, index) => {
                    const isSelected = selectedServices.has(service.id);
                    return (
                      <React.Fragment key={service.id}>
                        <tr
                          className={cn(
                            'group transition-all border-b border-border/20 h-[48px] hover:bg-table-row-hover',
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
                              checked={isSelected}
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
                                setSelectAll(
                                  checked &&
                                    rows.every(
                                      (s) => selectedServices.has(s.id) || s.id === service.id,
                                    ),
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="text-muted-foreground font-mono text-xs pl-4 py-2 whitespace-nowrap">
                            #{String(index + 1).padStart(2, '0')}
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <img
                                src={getFaviconUrl(service.websiteUrl)}
                                alt={service.name}
                                className="w-5 h-5 rounded-sm shrink-0"
                              />
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
                            <span className="text-[13px] text-foreground/70 truncate">
                              {service.defaultCategories?.[0] || '—'}
                            </span>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
              </tbody>
            )}
          </table>

          {/* Empty/Loading overlay — absolutely centered in scroll container */}
          {showEmptyState && (
            <div className="absolute inset-0 flex items-center justify-center">
              <EmptyState
                icon={loading ? <Loader2 className="animate-spin" /> : <PackageOpen />}
                title={loading ? 'Loading services...' : 'No services yet'}
                description={
                  loading
                    ? 'Fetching service registry from database.'
                    : 'Add your first service to get started with the registry.'
                }
              />
            </div>
          )}
        </div>
        <div className="h-10 border-t border-border/50 bg-table-headerBg/80 backdrop-blur-xl flex items-center px-4 shrink-0 z-40">
          <div className="flex-1 text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.25em]">
            {rows.length} services
          </div>
        </div>
        {contextMenu &&
          createPortal(
            <Dropdown
              open={true}
              onOpenChange={() => setContextMenu(null)}
              position={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <DropdownTrigger asChild>
                <div className="fixed" />
              </DropdownTrigger>
              <DropdownContent>
                <DropdownItem
                  onClick={() => {
                    handleEdit(services[contextMenu.serviceId]);
                    setContextMenu(null);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5 text-primary/50" />
                  Edit Configuration
                </DropdownItem>
                <div className="h-px bg-border/20 my-1 mx-2" />
                <DropdownItem
                  className="text-error focus:text-error focus:bg-error/10"
                  onClick={() => {
                    setDeleteConfirmId(contextMenu.serviceId);
                    setContextMenu(null);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500/60" />
                  Delete Service
                </DropdownItem>
              </DropdownContent>
            </Dropdown>,
            document.body,
          )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)}>
        <ModalHeader title="Delete Service" onClose={() => setDeleteConfirmId(null)} />
        <ModalBody>
          <EmptyState
            variant="soft-error"
            icon={<Trash2 className="w-10 h-10" />}
            title="Delete Service"
            description={`Are you sure you want to delete "${deleteConfirmId ? services[deleteConfirmId]?.name : ''}"? This action cannot be undone.`}
            className="h-auto py-6"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button variant="soft-error" onClick={handleDeleteService}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
