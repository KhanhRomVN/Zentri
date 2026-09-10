import { FC } from 'react';
import { Plus, Database, ChevronDown, Search } from 'lucide-react';
import React from 'react';
import { Account } from '../../types';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../../../components/ui/Modal';
import { useServiceDrawer } from '../../../../contexts/ServiceDrawerContext';
import { cn } from '../../../../shared/lib/utils';
import { Button } from '../../../../components/ui/Button';
import ServiceForm from './EmailModal/Services/ServiceForm';

interface AddServiceModalProps {
  isServiceDrawerOpen: boolean;
  setIsServiceDrawerOpen: (val: boolean) => void;
  linkServiceSearchQuery: string;
  setLinkServiceSearchQuery: (val: string) => void;
  focusedAccount: Account | null;
  newServiceData: any;
  setNewServiceData: React.Dispatch<React.SetStateAction<any>>;
  globalServices: any[];
  handleAddServiceLink: () => void;
  isQuickCreateModalOpen: boolean;
  setIsQuickCreateModalOpen: (val: boolean) => void;
  quickCreateData: any;
  setQuickCreateData: React.Dispatch<React.SetStateAction<any>>;
  handleQuickCreateService: () => void;
  categorySearch: string;
  setCategorySearch: (val: string) => void;
  categoryInputOpen: boolean;
  setCategoryInputOpen: (val: boolean) => void;
  isEditMode?: boolean;
  onRestoreService?: (linkId: string) => void;
  onServicesChanged?: () => void;
}

const SearchableServiceSelect: FC<{
  services: any[];
  selectedServiceId: string;
  selectedServiceName: string;
  onSelect: (service: any) => void;
  placeholder?: string;
}> = ({ services, selectedServiceId, selectedServiceName, onSelect, placeholder = 'Search services...' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 pl-3 pr-8 rounded-md bg-input-background border border-border text-sm text-foreground outline-none hover:border-primary/50 transition-colors flex items-center gap-2 whitespace-nowrap w-full"
      >
        {selectedService?.url && (
          <img
            src={`https://www.google.com/s2/favicons?domain=${new URL(selectedService.url).hostname}&sz=64`}
            alt=""
            className="w-4 h-4 rounded-sm"
          />
        )}
        <span className={!selectedServiceId ? 'text-muted-foreground/40' : ''}>
          {selectedServiceId ? selectedServiceName : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground/50 absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-dropdown-background border border-border/50 rounded-md py-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-[280px] overflow-y-auto hover:border-primary transition-colors">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 z-10" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-input-background text-xs text-foreground placeholder:text-muted-foreground/40 outline-none"
              autoFocus
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground/50">
              No services found
            </div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelect(s);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2',
                  s.id === selectedServiceId
                    ? 'text-foreground bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-dropdown-item-hover',
                )}
              >
                <div className="w-5 h-5 flex items-center justify-center p-1 rounded-md bg-muted/50 border border-border/50">
                  <img
                    src={
                      s.url
                        ? `https://www.google.com/s2/favicons?domain=${new URL(s.url).hostname}&sz=64`
                        : ''
                    }
                    alt=""
                    className="w-4 h-4 object-contain"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-foreground/80 truncate">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground/40 truncate">{s.url}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const AddServiceModal: FC<AddServiceModalProps> = ({
  isServiceDrawerOpen,
  setIsServiceDrawerOpen,
  linkServiceSearchQuery: _linkServiceSearchQuery,
  setLinkServiceSearchQuery,
  focusedAccount,
  newServiceData,
  setNewServiceData,
  globalServices,
  handleAddServiceLink,
  isEditMode,
  onRestoreService,
  onServicesChanged,
}) => {
  const { openDrawer } = useServiceDrawer();

  return (
    <Modal
      isOpen={isServiceDrawerOpen}
      onClose={() => {
        setIsServiceDrawerOpen(false);
        setLinkServiceSearchQuery('');
      }}
      className="w-[720px] max-w-[90vw] h-[85vh]"
    >
      <ModalHeader
        title={isEditMode ? 'Edit Service' : 'Add Service'}
        description={
          isEditMode
            ? `Update credentials for ${newServiceData.serviceName}`
            : `Associate service with ${focusedAccount?.email || ''}`
        }
        onClose={() => {
          setIsServiceDrawerOpen(false);
          setLinkServiceSearchQuery('');
        }}
      />

      <ModalBody className="space-y-6 overflow-y-auto">
        {/* Service Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground/80">Select Service</label>
            {!isEditMode && (
              <button
                onClick={() => {
                  openDrawer(null, true, () => {
                    setIsServiceDrawerOpen(true);
                  });
                  setIsServiceDrawerOpen(false);
                  if (onServicesChanged) onServicesChanged();
                }}
                className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
              >
                + New Service
              </button>
            )}
          </div>
          <div className="relative">
            {isEditMode ? (
              <div className="flex items-center gap-3 rounded-md bg-card-background border border-border px-3 py-2.5">
                {(() => {
                  const svc = globalServices.find((s: any) => s.id === newServiceData.serviceId);
                  const url = newServiceData.serviceUrl || svc?.url;
                  if (!url) return null;
                  try {
                    return (
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center p-1.5 border border-white/5 shadow-sm shrink-0">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`}
                          alt=""
                          className="w-full h-full object-contain"
                          onError={(e: any) => (e.target.style.display = 'none')}
                        />
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-foreground/90 leading-tight truncate">
                    {newServiceData.serviceName}
                  </span>
                  {(() => {
                    const svc = globalServices.find((s: any) => s.id === newServiceData.serviceId);
                    const url = newServiceData.serviceUrl || svc?.url;
                    if (!url) return null;
                    try {
                      return (
                        <span className="text-[10px] text-text-secondary font-mono truncate">
                          {new URL(url).hostname}
                        </span>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            ) : (
              <SearchableServiceSelect
                services={globalServices}
                selectedServiceId={newServiceData.serviceId || ''}
                selectedServiceName={newServiceData.serviceName || ''}
                onSelect={(service) => {
                  const existingInTrash = focusedAccount?.services?.find(
                    (link: any) =>
                      link.serviceId === service.id && link.status === 'deleting',
                  );
                  if (existingInTrash) {
                    setNewServiceData((prev: any) => ({
                      ...prev,
                      serviceId: service.id,
                      serviceName: service.name,
                      username: existingInTrash.username || '',
                      password: existingInTrash.password || '',
                      notes: existingInTrash.notes || '',
                      linkId: existingInTrash.id,
                    }));
                  } else {
                    setNewServiceData((prev: any) => ({
                      ...prev,
                      serviceId: service.id,
                      serviceName: service.name,
                    }));
                  }
                  setLinkServiceSearchQuery(service.name);
                }}
              />
            )}
          </div>

          {/* Trash Warning */}
          {(() => {
            const existingLink = focusedAccount?.services?.find(
              (link: any) => link.serviceId === newServiceData.serviceId,
            );
            if (existingLink?.status === 'deleting') {
              return (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-3">
                    <Plus className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 rotate-45" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Link in Trash
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        This service link is in the trash. Restore it to continue.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onRestoreService && existingLink.id) {
                        onRestoreService(existingLink.id);
                        setIsServiceDrawerOpen(false);
                      }
                    }}
                    className="w-full py-2.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Database className="w-3.5 h-3.5" />
                    Restore Connection
                  </button>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Editable security + metadata form */}
        <div className="relative">
          <ServiceForm
            service={{
              id: newServiceData.linkId,
              serviceId: newServiceData.serviceId,
              twoFa: newServiceData.twoFa || {},
              metadata: newServiceData.metadata || {},
            }}
            autoSave={false}
            onChange={(data) =>
              setNewServiceData((d: any) => ({
                ...d,
                twoFa: data.twoFa,
                metadata: data.metadata,
              }))
            }
          />
          {!newServiceData.serviceId && (
            <div className="absolute inset-0 z-10 rounded-md bg-card/50 backdrop-blur-sm pointer-events-auto" />
          )}
        </div>
      </ModalBody>

      <ModalFooter className="justify-end">
        <Button variant="outline" onClick={() => setIsServiceDrawerOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="soft"
          disabled={!newServiceData.serviceId}
          onClick={handleAddServiceLink}
        >
          {isEditMode ? 'Update Service' : 'Secure Connection'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddServiceModal;