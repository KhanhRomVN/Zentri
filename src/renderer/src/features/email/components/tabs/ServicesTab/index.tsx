import { Search, Plus, ShieldCheck, Lock, LayoutGrid, Globe, Eye, Trash2 } from 'lucide-react';
import { FC } from 'react';
import { cn } from '../../../../../shared/lib/utils';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../../components/ui/Dropdown';

interface ServicesTabProps {
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  accountServices: any[];
  onAddNewServiceLink: () => void;
  onEditServiceLink: (linkId: string) => void;
  onServiceContextMenu: (e: React.MouseEvent, linkId: string) => void;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
}

const ServicesTab: FC<ServicesTabProps> = ({
  serviceSearch,
  setServiceSearch,
  accountServices,
  onAddNewServiceLink,
  onEditServiceLink,
  onServiceContextMenu,
  onOpenService,
  onDeleteService,
}) => {
  // Derived filtered services
  const filteredServices = (accountServices || []).filter(
    (s: any) =>
      !serviceSearch ||
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.url?.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Services Sub-Navbar */}
      <div className="h-[39px] flex items-center justify-between px-2 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-500">
        <span className="text-[11px] font-black uppercase text-muted-foreground/60">Services</span>
        <div className="flex items-center gap-2">
          <div className="w-80 flex items-center transition-all duration-500">
            <div className="relative flex items-center w-full h-[29px] bg-input-background border border-border rounded-md transition-all duration-300">
              <Search className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search services..."
                value={serviceSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setServiceSearch(e.target.value)
                }
                className="w-full h-full pl-10 pr-3 bg-transparent text-sm text-foreground placeholder:text-text-secondary outline-none rounded-md"
              />
            </div>
          </div>
          <button
            onClick={onAddNewServiceLink}
            className="w-[29px] h-[29px] flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-primary hover:bg-primary/30 transition-all active:scale-90 border border-border group"
            title="Link New Service"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative min-h-0 bg-card/5 backdrop-blur-sm">
        <div className="flex-1 overflow-auto custom-scrollbar p-4">
          {filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20">
              <LayoutGrid className="w-8 h-8" />
              <p className="text-[11px] font-black uppercase tracking-widest">No services linked</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service: any, index: number) => (
                <Dropdown key={service.id} trigger="contextmenu">
                  <DropdownTrigger asChild>
                    <div
                      className={cn(
                        'group relative bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:bg-card/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                        service.status === 'trash' && 'opacity-60 grayscale-[0.5] italic',
                      )}
                      onClick={() => onEditServiceLink(service.id)}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center p-1.5 border border-white/5 shadow-sm transition-transform group-hover:scale-110 group-hover:border-primary/30">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${service.url}&sz=64`}
                              className="w-full h-full object-contain"
                              alt=""
                              onError={(e: any) => (e.target.style.display = 'none')}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-bold text-foreground/90 leading-tight group-hover:text-primary transition-colors truncate">
                              {service.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground/40 font-mono truncate">
                              {service.url ? new URL(service.url).hostname : ''}
                            </span>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0',
                            service.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : service.status === 'trash'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-muted text-muted-foreground border-transparent',
                          )}
                        >
                          {service.status || 'Unknown'}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="mt-4 space-y-2">
                        {/* Category & Last Used */}
                        <div className="flex items-center justify-between">
                          {service.category ? (
                            <span className="text-[10px] font-bold text-primary/70 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                              {service.category}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/30 italic">
                              No category
                            </span>
                          )}
                          {service.lastUsedAt && (
                            <span className="text-[9px] text-muted-foreground/40 font-mono">
                              {new Date(service.lastUsedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Security Badges */}
                        {(() => {
                          let metadata = service.metadata;
                          if (!metadata) {
                            metadata = [];
                          } else if (typeof metadata === 'string') {
                            try {
                              metadata = JSON.parse(metadata);
                            } catch {
                              metadata = [];
                            }
                          }
                          // Ensure metadata is an array
                          if (!Array.isArray(metadata)) {
                            metadata = [];
                          }
                          const hasEncryption = metadata.some(
                            (item: any) => item.feature === 'encryption',
                          );
                          const hasTOTP = metadata.some((item: any) => item.feature === 'totp');
                          const hasBackupCodes = metadata.some(
                            (item: any) => item.feature === 'backup_codes',
                          );
                          const has2FA = hasTOTP || hasBackupCodes;

                          if (!hasEncryption && !has2FA) return null;

                          return (
                            <div className="flex items-center gap-2 pt-1">
                              {hasEncryption && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">
                                  <Lock className="w-3 h-3" />
                                  Encryption
                                </div>
                              )}
                              {has2FA && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider">
                                  <ShieldCheck className="w-3 h-3" />
                                  {hasTOTP && hasBackupCodes
                                    ? '2FA + Backup'
                                    : hasTOTP
                                      ? 'TOTP 2FA'
                                      : 'Backup Codes'}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Index Badge */}
                      <div className="absolute top-3 right-3 text-[8px] font-mono text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors">
                        #{String(index + 1).padStart(2, '0')}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesTab;
