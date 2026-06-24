import { FC } from 'react';
import { Plus, X, Check, Database } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { Account } from '../types';
import React from 'react';
import { useServiceDrawer } from '../../../contexts/ServiceDrawerContext';

interface ServiceDrawersProps {
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

const ServiceDrawers: FC<ServiceDrawersProps> = ({
  isServiceDrawerOpen,
  setIsServiceDrawerOpen,
  linkServiceSearchQuery,
  setLinkServiceSearchQuery,
  focusedAccount,
  newServiceData,
  setNewServiceData,
  globalServices,
  handleAddServiceLink,
  isQuickCreateModalOpen,
  setIsQuickCreateModalOpen,
  quickCreateData,
  setQuickCreateData,
  handleQuickCreateService,
  categorySearch,
  setCategorySearch,
  categoryInputOpen,
  setCategoryInputOpen,
  isEditMode,
  onRestoreService,
  onServicesChanged,
}) => {
  const { openDrawer } = useServiceDrawer();
  const [servicePopoverOpen, setServicePopoverOpen] = React.useState(false);

  return (
    <>
      {/* Add/Edit Service Link Drawer */}
      {isServiceDrawerOpen && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setIsServiceDrawerOpen(false);
              setLinkServiceSearchQuery('');
            }}
          />
          <div className="relative w-[500px] h-full bg-drawer-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 shrink-0">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isEditMode
                    ? 'Edit Connection'
                    : 'Link Account'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEditMode
                    ? `Update credentials for ${newServiceData.serviceName}`
                    : `Associate service with ${focusedAccount?.email || ''}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsServiceDrawerOpen(false);
                  setLinkServiceSearchQuery('');
                }}
                className="w-7 h-7 flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-error hover:bg-error/10 transition-all border border-border"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Service Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground/80">
                    Select Service
                  </label>
                  {!isEditMode && (
                    <button
                      onClick={() => {
                        // Open the full Service Drawer
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
                    <input
                      type="text"
                      readOnly
                      value={newServiceData.serviceName}
                      className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 transition-colors"
                    />
                  ) : (
                    <>
                      <div className="relative">
                        {(() => {
                          const selectedService = globalServices.find(
                            (s) => s.name.toLowerCase() === linkServiceSearchQuery.toLowerCase(),
                          );
                          return selectedService?.url ? (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center">
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${new URL(selectedService.url).hostname}&sz=64`}
                                alt=""
                                className="w-4 h-4 object-contain"
                              />
                            </div>
                          ) : null;
                        })()}
                        <input
                          type="text"
                          placeholder="Search services..."
                          value={linkServiceSearchQuery}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setLinkServiceSearchQuery(e.target.value)
                          }
                          onFocus={() => setServicePopoverOpen(true)}
                          onBlur={() => setTimeout(() => setServicePopoverOpen(false), 200)}
                          className={cn(
                            "w-full h-10 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 transition-colors",
                            (() => {
                              const selectedService = globalServices.find(
                                (s) => s.name.toLowerCase() === linkServiceSearchQuery.toLowerCase(),
                              );
                              return selectedService?.url ? "pl-10" : "pl-3";
                            })()
                          )}
                        />
                      </div>
                      {servicePopoverOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-dropdown-background border border-border rounded-md shadow-2xl z-50 max-h-[250px] overflow-y-auto hover:border-primary transition-colors">
                          {globalServices
                            .filter((s) =>
                              s.name.toLowerCase().includes(linkServiceSearchQuery.toLowerCase()),
                            )
                            .map((s) => (
                              <button
                                key={s.id}
                                onMouseDown={() => {
                                  const existingInTrash = focusedAccount?.services?.find(
                                    (link: any) =>
                                      link.serviceId === s.id && link.status === 'deleting',
                                  );
                                  if (existingInTrash) {
                                    setNewServiceData((prev: any) => ({
                                      ...prev,
                                      serviceId: s.id,
                                      serviceName: s.name,
                                      username: existingInTrash.username || '',
                                      password: existingInTrash.password || '',
                                      notes: existingInTrash.notes || '',
                                      linkId: existingInTrash.id,
                                    }));
                                  } else {
                                    setNewServiceData((prev: any) => ({
                                      ...prev,
                                      serviceId: s.id,
                                      serviceName: s.name,
                                    }));
                                  }
                                  setLinkServiceSearchQuery(s.name);
                                  setServicePopoverOpen(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-1.5 text-sm hover:bg-muted text-left transition-colors"
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
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground/80">{s.name}</span>
                                  <span className="text-[10px] text-muted-foreground/40">
                                    {s.url}
                                  </span>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </>
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

              {/* Dynamic Metadata - only show when a service is selected */}
              {newServiceData.serviceId && (() => {
                const selectedService = globalServices.find(
                  (s: any) => s.id === newServiceData.serviceId,
                );
                const metadataDefinitions: any[] = selectedService?.metadata
                  ? typeof selectedService.metadata === 'string'
                    ? JSON.parse(selectedService.metadata)
                    : selectedService.metadata
                  : [];
                if (metadataDefinitions.length === 0) return null;
                return (
                  <div className="space-y-4 pt-4 animate-in slide-in-from-bottom-2 duration-300">
                    {metadataDefinitions.map((item: any) => (
                      <div key={item.key} className="space-y-2.5">
                        <label className="text-sm font-semibold text-foreground/80">
                          {item.key}
                          {item.type === 'array' && (
                            <span className="text-[10px] lowercase font-normal opacity-50">
                              (comma separated)
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={`Enter ${item.key.toLowerCase()}...`}
                          value={
                            item.type === 'array'
                              ? Array.isArray(newServiceData.metadata?.[item.key])
                                ? newServiceData.metadata[item.key].join(', ')
                                : newServiceData.metadata?.[item.key] || ''
                              : newServiceData.metadata?.[item.key] || ''
                          }
                          onChange={(e) =>
                            setNewServiceData((d: any) => ({
                              ...d,
                              metadata: {
                                ...(d.metadata || {}),
                                [item.key]:
                                  item.type === 'array'
                                    ? e.target.value.split(',').map((s: string) => s.trim())
                                    : e.target.value,
                              },
                            }))
                          }
                          className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-3 w-full px-4 py-2 border-t border-border bg-card/50 shrink-0 justify-end">
              <button
                onClick={() => setIsServiceDrawerOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-semibold border border-border text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddServiceLink}
                disabled={!newServiceData.serviceId}
                className={cn(
                  'px-5 py-2.5 rounded-lg transition-all font-semibold text-xs',
                  !newServiceData.serviceId
                    ? 'bg-card-background text-text-secondary cursor-not-allowed'
                    : 'bg-primary/30 text-primary hover:bg-primary/40 shadow-lg shadow-primary/10',
                )}
              >
                {isEditMode
                  ? 'Update Link'
                  : 'Secure Connection'}
              </button>
            </div>
          </div>
        </div>
      )}

      
    </>
  );
};

export default ServiceDrawers;