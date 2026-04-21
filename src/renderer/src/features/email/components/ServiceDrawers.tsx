import { FC } from 'react';
import { Plus, X, Check, Database } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { Drawer } from '../../../shared/components/ui/drawer';
import Input from '../../../shared/components/ui/input/Input';
import Combobox from '../../../shared/components/ui/combobox/Combobox';
import Textarea from '../../../shared/components/ui/textarea/Textarea';
import { Modal } from '@renderer/shared/components/ui/modal';
import ServiceMetadataBuilder, {
  MetadataItem,
} from '../../../shared/components/ui/service/ServiceMetadataBuilder';
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
      <Drawer
        isOpen={isServiceDrawerOpen}
        onClose={() => {
          setIsServiceDrawerOpen(false);
          setLinkServiceSearchQuery('');
        }}
        direction="right"
        width={500}
        title={isEditMode ? 'Edit Service Connection' : 'Link Service Account'}
        subtitle={
          isEditMode
            ? `Update credentials and notes for ${newServiceData.serviceName || 'this service'}`
            : `Associate a registered service with ${focusedAccount?.email || 'this account'}`
        }
        footerActions={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsServiceDrawerOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-button-secondBg hover:bg-button-secondBgHover transition-colors border border-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleAddServiceLink}
              disabled={!newServiceData.serviceId}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-lg',
                !newServiceData.serviceId
                  ? 'bg-button-bg/50 text-button-bgText cursor-not-allowed opacity-70'
                  : 'bg-button-bg text-button-bgText hover:bg-button-bgHover shadow-primary/20',
              )}
            >
              {isEditMode ? 'Update Link' : 'Secure Connection'}
            </button>
          </div>
        }
      >
        <div className="p-4 space-y-6 h-full overflow-auto custom-scrollbar">
          {/* Service Selector Block */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Select Service
              </label>
              {!isEditMode && (
                <button
                  onClick={() => setIsQuickCreateModalOpen(true)}
                  className="text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                >
                  New Service
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <Input
                  type={isEditMode ? 'text' : 'combobox'}
                  size="lg"
                  readOnly={isEditMode}
                  placeholder={isEditMode ? '' : 'Search registered services...'}
                  value={isEditMode ? newServiceData.serviceName : linkServiceSearchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    !isEditMode && setLinkServiceSearchQuery(e.target.value)
                  }
                  popoverOpen={servicePopoverOpen}
                  onPopoverOpenChange={setServicePopoverOpen}
                  popoverContent={
                    <Combobox
                      value={newServiceData.serviceId}
                      options={globalServices.map((s) => ({
                        value: s.id,
                        label: s.name,
                        icon: (
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
                        ),
                      }))}
                      searchQuery={linkServiceSearchQuery}
                      onChange={(id) => {
                        const s = globalServices.find((srv) => srv.id === id);
                        if (s) {
                          // Check if this service is already linked and in trash
                          const existingInTrash = focusedAccount?.services?.find(
                            (link) => link.serviceId === s.id && link.status === 'deleting',
                          );

                          if (existingInTrash) {
                            setNewServiceData((prev: any) => ({
                              ...prev,
                              serviceId: s.id,
                              serviceName: s.name,
                              username: existingInTrash.username || '',
                              password: existingInTrash.password || '',
                              notes: existingInTrash.notes || '',
                              linkId: existingInTrash.id, // Keep the old link ID for restoration
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
                        }
                      }}
                    />
                  }
                  className="bg-input-background border-border rounded-xl"
                />
              </div>
            </div>

            {/* Trash Warning & Restore */}
            {(() => {
              const existingLink = focusedAccount?.services?.find(
                (link) => link.serviceId === newServiceData.serviceId,
              );

              if (existingLink?.status === 'deleting') {
                return (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <Plus className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 rotate-45" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          Service Link in Trash
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          This connection is currently in the trash. Restore it to reactivate access
                          without creating a duplicate.
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
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
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

          {/* Credentials Block */}
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Username
              </label>
              <Input
                placeholder="identity@example.com"
                value={newServiceData.username}
                onChange={(e) =>
                  setNewServiceData((prev: any) => ({ ...prev, username: e.target.value }))
                }
                className="bg-input-background border-border rounded-xl"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={newServiceData.password}
                onChange={(e) =>
                  setNewServiceData((prev: any) => ({ ...prev, password: e.target.value }))
                }
                className="bg-input-background border-border rounded-xl"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Notes
              </label>
              <Textarea
                placeholder="Specific instructions or environment details..."
                value={newServiceData.notes}
                onChange={(val) => setNewServiceData((prev: any) => ({ ...prev, notes: val }))}
                className="bg-input-background border-border rounded-xl min-h-[100px]"
              />
            </div>
          </div>

          {/* Dynamic Metadata Block */}
          {(() => {
            const selectedService = globalServices.find((s) => s.id === newServiceData.serviceId);
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90">
                    Service specific Metadata
                  </h3>
                </div>
                {metadataDefinitions.map((item) => (
                  <div key={item.key} className="space-y-2.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      {item.key}{' '}
                      {item.type === 'array' && (
                        <span className="text-[10px] lowercase font-normal opacity-50">
                          (comma separated)
                        </span>
                      )}
                    </label>
                    <Input
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
                                ? e.target.value.split(',').map((s) => s.trim())
                                : e.target.value,
                          },
                        }))
                      }
                      className="bg-input-background border-border rounded-xl"
                    />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </Drawer>

      {/* Quick Create Service Modal */}
      <Modal
        open={isQuickCreateModalOpen}
        onClose={() => setIsQuickCreateModalOpen(false)}
        title="Initialize New Service"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
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
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-button-secondBg hover:bg-button-secondBgHover transition-colors border border-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleQuickCreateService}
              disabled={!quickCreateData.name}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-lg',
                !quickCreateData.name
                  ? 'bg-button-bg/50 text-button-bgText cursor-not-allowed opacity-70'
                  : 'bg-button-bg text-button-bgText hover:bg-button-bgHover shadow-primary/20',
              )}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="py-4 space-y-5">
          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Name <span className="text-destructive ml-1">*</span>
            </label>
            <Input
              placeholder="e.g. Google Cloud"
              value={quickCreateData.name}
              onChange={(e) => setQuickCreateData((d: any) => ({ ...d, name: e.target.value }))}
              autoFocus
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              URL
            </label>
            <Input
              placeholder="https://console.cloud.google.com"
              value={quickCreateData.url}
              onChange={(e) => setQuickCreateData((d: any) => ({ ...d, url: e.target.value }))}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Category
            </label>
            <Input
              type="combobox"
              placeholder="Select or create category..."
              value={categorySearch || quickCreateData.category}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCategorySearch(e.target.value)
              }
              multiValue={false}
              badges={[]}
              rightIcon={
                quickCreateData.category ? (
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setQuickCreateData((d: any) => ({ ...d, category: '' }));
                    }}
                  />
                ) : undefined
              }
              popoverOpen={categoryInputOpen}
              onPopoverOpenChange={setCategoryInputOpen}
              popoverContent={(() => {
                const allCategories = Array.from(
                  new Set(
                    globalServices.flatMap((s) => {
                      try {
                        return s.category ? JSON.parse(s.category) : [];
                      } catch {
                        return [];
                      }
                    }),
                  ),
                ).sort();

                return (
                  <div className="flex flex-col max-h-[200px] overflow-y-auto">
                    {allCategories
                      .filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setQuickCreateData((d: any) => ({ ...d, category }));
                            setCategorySearch('');
                            setCategoryInputOpen(false);
                          }}
                          className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-muted text-left transition-colors"
                        >
                          <span>{category}</span>
                          {quickCreateData.category === category && (
                            <Check className="w-3 h-3 text-primary" />
                          )}
                        </button>
                      ))}
                    {categorySearch && !allCategories.includes(categorySearch) && (
                      <button
                        onClick={() => {
                          setQuickCreateData((d: any) => ({ ...d, category: categorySearch }));
                          setCategorySearch('');
                          setCategoryInputOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-muted text-primary transition-colors text-left"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Create "{categorySearch}"</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Tags
            </label>
            <Input
              placeholder="Add tags (comma separated)..."
              value={quickCreateData.tags}
              onChange={(e) => setQuickCreateData((d: any) => ({ ...d, tags: e.target.value }))}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Description
            </label>
            <textarea
              placeholder="Detailed description of the service and its purpose..."
              value={quickCreateData.description}
              onChange={(e) =>
                setQuickCreateData((d: any) => ({ ...d, description: e.target.value }))
              }
              className="w-full bg-input-background border border-border/50 rounded-2xl px-5 py-3 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all h-24 resize-none"
            />
          </div>

          <div className="pt-2">
            <ServiceMetadataBuilder
              definitionOnly={true}
              metadata={quickCreateData.metadata || []}
              onChange={(metadata: MetadataItem[]) =>
                setQuickCreateData((d: any) => ({ ...d, metadata }))
              }
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ServiceDrawers;
