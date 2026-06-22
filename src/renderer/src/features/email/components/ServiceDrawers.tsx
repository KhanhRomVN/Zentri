import { FC } from 'react';
import { Plus, X, Check, Database } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { Account } from '../types';
import React from 'react';

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
}) => {
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
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Service Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-muted-foreground/70">
                    Select Service
                  </label>
                  {!isEditMode && (
                    <button
                      onClick={() => setIsQuickCreateModalOpen(true)}
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
                      className="w-full h-12 px-3 rounded-md bg-input-background border border-border text-sm text-foreground outline-none"
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={linkServiceSearchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLinkServiceSearchQuery(e.target.value)
                        }
                        onFocus={() => setServicePopoverOpen(true)}
                        onBlur={() => setTimeout(() => setServicePopoverOpen(false), 200)}
                        className="w-full h-12 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                      />
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
                                className="flex items-center gap-3 w-full px-4 py-3 text-xs hover:bg-muted text-left transition-colors"
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

              {/* Credentials */}
              <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold text-muted-foreground/70">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="identity@example.com"
                    value={newServiceData.username}
                    onChange={(e) =>
                      setNewServiceData((prev: any) => ({ ...prev, username: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold text-muted-foreground/70">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={newServiceData.password}
                    onChange={(e) =>
                      setNewServiceData((prev: any) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold text-muted-foreground/70">
                    Notes
                  </label>
                  <textarea
                    placeholder="Add notes about this service..."
                    value={newServiceData.notes}
                    onChange={(e) =>
                      setNewServiceData((prev: any) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full bg-input-background border border-border rounded-md px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 min-h-[100px] resize-none"
                  />
                </div>
              </div>

              {/* Dynamic Metadata */}
              {(() => {
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
                  <div className="space-y-4 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-primary" />
                      <h3 className="text-xs font-bold text-foreground/90">
                        Service-Specific Metadata
                      </h3>
                    </div>
                    {metadataDefinitions.map((item: any) => (
                      <div key={item.key} className="space-y-2.5">
                        <label className="text-[12px] font-bold text-muted-foreground/70">
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
                          className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
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

      {/* Quick Create Service Drawer */}
      {isQuickCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsQuickCreateModalOpen(false)}
          />
          <div className="relative w-[500px] h-full bg-drawer-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 shrink-0">
              <div>
                <h3 className="text-base font-bold text-foreground">Quick Create Service</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add a new service to the global library
                </p>
              </div>
              <button
                onClick={() => setIsQuickCreateModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div className="space-y-2.5">
                <label className="text-[12px] font-bold text-muted-foreground/70">
                  Service Name <span className="text-destructive ml-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google, GitHub..."
                  value={quickCreateData.name}
                  onChange={(e) => setQuickCreateData((d: any) => ({ ...d, name: e.target.value }))}
                  autoFocus
                  className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[12px] font-bold text-muted-foreground/70">
                  URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={quickCreateData.url}
                  onChange={(e) => setQuickCreateData((d: any) => ({ ...d, url: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[12px] font-bold text-muted-foreground/70">
                  Category
                </label>
                <div className="relative">
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="Search or create category..."
                      value={categorySearch || quickCreateData.category}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCategorySearch(e.target.value)
                      }
                      onFocus={() => setCategoryInputOpen(true)}
                      onBlur={() => setTimeout(() => setCategoryInputOpen(false), 200)}
                      className="w-full h-10 px-3 pr-8 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                    />
                    {quickCreateData.category && (
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setQuickCreateData((d: any) => ({ ...d, category: '' }));
                        }}
                        className="absolute right-3 p-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {categoryInputOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-dropdown-background border border-border rounded-md shadow-2xl z-50 max-h-[200px] overflow-y-auto hover:border-primary transition-colors">
                      {(() => {
                        const allCategories = Array.from(
                          new Set(
                            globalServices.flatMap((s: any) => {
                              try {
                                return s.category ? JSON.parse(s.category) : [];
                              } catch {
                                return [];
                              }
                            }),
                          ),
                        ).sort() as string[];
                        return allCategories
                          .filter((c: string) =>
                            c.toLowerCase().includes(categorySearch.toLowerCase()),
                          )
                          .map((category: string) => (
                            <button
                              key={category}
                              onMouseDown={() => {
                                setQuickCreateData((d: any) => ({ ...d, category }));
                                setCategorySearch('');
                                setCategoryInputOpen(false);
                              }}
                              className="flex items-center justify-between w-full px-4 py-2.5 text-xs hover:bg-muted text-left transition-colors"
                            >
                              <span>{category}</span>
                              {quickCreateData.category === category && (
                                <Check className="w-3 h-3 text-primary" />
                              )}
                            </button>
                          ));
                      })()}
                      {categorySearch && (
                        <button
                          onMouseDown={() => {
                            setQuickCreateData((d: any) => ({ ...d, category: categorySearch }));
                            setCategorySearch('');
                            setCategoryInputOpen(false);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-xs hover:bg-muted text-primary transition-colors text-left"
                        >
                          <Plus className="w-3 h-3" />
                          <span>
                            Create "{categorySearch}"
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="text-[12px] font-bold text-muted-foreground/70">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="tag1, tag2, tag3..."
                  value={quickCreateData.tags}
                  onChange={(e) => setQuickCreateData((d: any) => ({ ...d, tags: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[12px] font-bold text-muted-foreground/70">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of this service..."
                  value={quickCreateData.description}
                  onChange={(e) =>
                    setQuickCreateData((d: any) => ({ ...d, description: e.target.value }))
                  }
                  className="w-full bg-input-background border border-border rounded-md px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 min-h-[100px] resize-none"
                />
              </div>
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-muted-foreground/70">
                    Metadata Fields
                  </label>
                  <button
                    onClick={() =>
                      setQuickCreateData((d: any) => ({
                        ...d,
                        metadata: [...(d.metadata || []), { key: '', value: '' }],
                      }))
                    }
                    className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[10px] font-black"
                  >
                    + Add
                  </button>
                </div>
                {(quickCreateData.metadata || []).length === 0 && (
                  <p className="text-[10px] text-muted-foreground/40 italic">
                    No metadata fields defined.
                  </p>
                )}
                {(quickCreateData.metadata || []).map((field: any, idx: number) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <input
                      type="text"
                      placeholder="Key"
                      value={field.key || ''}
                      onChange={(e) => {
                        const updated = [...(quickCreateData.metadata || [])];
                        updated[idx] = { ...updated[idx], key: e.target.value };
                        setQuickCreateData((d: any) => ({ ...d, metadata: updated }));
                      }}
                      className="flex-1 h-9 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={field.value || ''}
                      onChange={(e) => {
                        const updated = [...(quickCreateData.metadata || [])];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        setQuickCreateData((d: any) => ({ ...d, metadata: updated }));
                      }}
                      className="flex-1 h-9 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={() =>
                        setQuickCreateData((d: any) => ({
                          ...d,
                          metadata: (d.metadata || []).filter((_: any, i: number) => i !== idx),
                        }))
                      }
                      className="p-1.5 text-muted-foreground/30 hover:text-destructive transition-colors shrink-0 mt-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 w-full px-4 py-2 border-t border-border bg-card/50 shrink-0 justify-end">
              <button
                onClick={() => {
                  setIsQuickCreateModalOpen(false);
                  setQuickCreateData({
                    name: '',
                    url: '',
                    category: '',
                    tags: '',
                    description: '',
                    metadata: [],
                  });
                  setCategorySearch('');
                }}
                className="px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-semibold border border-border text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickCreateService}
                disabled={!quickCreateData.name}
                className={cn(
                  'px-5 py-2.5 rounded-lg transition-all font-semibold text-xs',
                  !quickCreateData.name
                    ? 'bg-card-background text-text-secondary cursor-not-allowed'
                    : 'bg-primary/30 text-primary hover:bg-primary/40 shadow-lg shadow-primary/10',
                )}
              >
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceDrawers;