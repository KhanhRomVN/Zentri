/**
 * ------------------------------------------------------------------
 * ServiceList
 * ------------------------------------------------------------------
 * Left panel of the Services tab. Renders a list of linked service
 * cards with favicon, name, and domain. Supports context menu
 * actions: open in browser, view info, and delete.
 *
 * Main features:
 * - Service cards with favicon and domain display
 * - Right-click context menu (Dropdown with contextmenu trigger)
 * - Selected state highlighting
 * - Empty state when no services are linked
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { FC, useState } from 'react';
import { createPortal } from 'react-dom';
import CreateServiceModal from '../../CreateServiceModal';
import ServiceListModal from '../../ServiceListModal';

// ── UI ──
import { Globe, Eye, Trash2, Search, AlertTriangle, Plus, List } from 'lucide-react';

// ── Utils ──
import { cn } from '../../../../../../shared/lib/utils';

// ── UI Components ──
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../../../components/ui/Dropdown';
// (EmptyState removed — no empty state needed in ServiceList)

// ─── Interfaces ─────────────────────────────────────────────────────────
interface ServiceListProps {
  filteredServices: any[];
  selectedServiceId: string | null;
  onSelectService: (id: string) => void;
  onEditServiceLink: (linkId: string) => void;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  globalServices?: any[];
  onQuickAddService?: (service: any) => Promise<string | null>;
}

// ─── Component ──────────────────────────────────────────────────────────
const ServiceList: FC<ServiceListProps> = ({
  filteredServices,
  selectedServiceId,
  onSelectService,
  onEditServiceLink,
  onOpenService,
  onDeleteService,
  serviceSearch,
  setServiceSearch,
  globalServices,
  onQuickAddService,
}) => {
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);
  const [isServiceListModalOpen, setIsServiceListModalOpen] = useState(false);
  const availableGlobalServices = (globalServices || []).filter(
    (gs: any) => !filteredServices.some((linked: any) => linked.serviceId === gs.id),
  );

  return (
    <div className="w-[32%] min-w-[220px] max-w-[320px] border-r border-border bg-card/5 backdrop-blur-sm overflow-hidden flex flex-col">
      <div className="p-0 border-b border-border shrink-0">
        <div className="relative flex items-center w-full h-9 bg-input-background rounded-md">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search services..."
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            className="w-full h-full pl-9 pr-3 bg-transparent text-sm text-foreground placeholder:text-text-secondary outline-none rounded-md"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
          <div className="grid grid-cols-1 gap-4 p-4">
            {onQuickAddService && (
              <Dropdown
                trigger="click"
                align="start"
                side="bottom"
                closeOnSelect
                searchable
                className="w-full"
                position={pickerPos ?? undefined}
              >
                <DropdownTrigger asChild>
                  <button
                    className="group relative w-full bg-card-background border border-dashed border-primary/30 hover:border-primary/60 p-3 transition-all duration-300 cursor-pointer flex items-center gap-3"
                    onClick={(e) => {
                      setPickerPos({ top: e.clientY, left: e.clientX });
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-sm font-bold text-foreground/90 leading-tight">
                        Add Service
                      </span>
                      <span className="text-[10px] text-text-secondary truncate">
                        Link a new service to this account
                      </span>
                    </div>
                  </button>
                </DropdownTrigger>
                <DropdownContent>
                  <DropdownItem
                    onClick={() => {
                      setIsServiceListModalOpen(true);
                    }}
                  >
                    <List className="w-3.5 h-3.5 text-primary/70" />
                    Service registry
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      setIsCreateServiceModalOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 text-primary/70" />
                    Create new service
                  </DropdownItem>
                  <div className="h-px bg-divider my-1" />
                  {availableGlobalServices.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground/50">
                      No services found
                    </div>
                  ) : (
                    availableGlobalServices.map((service: any) => (
                      <DropdownItem
                        key={service.id}
                        onClick={async () => {
                          const linkId = await onQuickAddService(service);
                          if (linkId) onSelectService(linkId);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 flex items-center justify-center p-1 rounded-md bg-muted/50 border border-border/50">
                            <img
                              src={
                                service.url
                                  ? `https://www.google.com/s2/favicons?domain=${new URL(service.url).hostname}&sz=64`
                                  : ''
                              }
                              alt=""
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground/80 truncate">
                              {service.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground/40 truncate">
                              {service.url}
                            </span>
                          </div>
                        </div>
                      </DropdownItem>
                    ))
                  )}
                </DropdownContent>
              </Dropdown>
            )}
            {filteredServices.length > 0 && (
              filteredServices.map((service: any) => (
                <Dropdown key={service.id} trigger="contextmenu">
                  <DropdownTrigger asChild>
                    <div
                      className={cn(
                        'group relative border p-3 transition-all duration-200 cursor-pointer',
                        service.id === selectedServiceId
                          ? 'bg-primary/10 border-primary/50 shadow-md'
                          : 'bg-card-background border-border/50 hover:bg-card-hover hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                        service.status === 'trash' && 'opacity-60 grayscale-[0.5] italic',
                      )}
                      onClick={() => onSelectService(service.id)}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center p-1.5 border border-white/5 shadow-sm shrink-0">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${service.url}&sz=64`}
                              className="w-full h-full object-contain"
                              alt=""
                              onError={(e: any) => (e.target.style.display = 'none')}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-bold text-foreground/90 leading-tight truncate">
                                {service.name}
                              </span>
                              {service.twoFa &&
                                !service.twoFa.totp &&
                                !(service.twoFa.backupCodes && service.twoFa.backupCodes.length > 0) && (
                                  <span
                                    className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-error/10 text-error"
                                    title="2FA incomplete"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                  </span>
                                )}
                            </div>
                            <span className="text-[10px] text-text-secondary font-mono truncate">
                              {service.url ? new URL(service.url).hostname : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DropdownTrigger>
                  <DropdownContent>
                    <DropdownItem
                      onClick={() => {
                        if (onOpenService) {
                          onOpenService(service.id);
                        }
                      }}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Open in Browser
                    </DropdownItem>
                    <div className="h-px bg-divider my-1" />
                    <DropdownItem
                      onClick={() => {
                        onEditServiceLink(service.id);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500/50" />
                      View Info
                    </DropdownItem>
                    <div className="h-px bg-divider my-1" />
                    <DropdownItem
                      className="text-error focus:text-error focus:bg-error/10"
                      onClick={() => {
                        if (onDeleteService) {
                          onDeleteService(service.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </DropdownItem>
                  </DropdownContent>
                </Dropdown>
              ))
            )}
          </div>
      </div>
      {createPortal(
        <CreateServiceModal
          isOpen={isCreateServiceModalOpen}
          onClose={() => setIsCreateServiceModalOpen(false)}
        />,
        document.body,
      )}
      {createPortal(
        <ServiceListModal
          isOpen={isServiceListModalOpen}
          onClose={() => setIsServiceListModalOpen(false)}
          onCreate={() => {
            setIsServiceListModalOpen(false);
            setIsCreateServiceModalOpen(true);
          }}
        />,
        document.body,
      )}
    </div>
  );
};

export default ServiceList;
