import { Globe, Eye, Trash2, LayoutGrid } from 'lucide-react';
import { FC } from 'react';
import { cn } from '../../../../../shared/lib/utils';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../../components/ui/Dropdown';
import { EmptyState } from '../../../../../components/ui/EmptyState';

interface ServiceListProps {
  filteredServices: any[];
  selectedServiceId: string | null;
  onSelectService: (id: string) => void;
  onEditServiceLink: (linkId: string) => void;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
}

const ServiceList: FC<ServiceListProps> = ({
  filteredServices,
  selectedServiceId,
  onSelectService,
  onEditServiceLink,
  onOpenService,
  onDeleteService,
}) => {
  return (
    <div className="w-[35%] min-w-[240px] max-w-[360px] border-r border-border bg-card/5 backdrop-blur-sm overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto custom-scrollbar">
        {filteredServices.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid />}
            title="No services linked"
            description=""
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredServices.map((service: any) => (
              <Dropdown key={service.id} trigger="contextmenu">
                <DropdownTrigger asChild>
                  <div
                    className={cn(
                      'group relative bg-card/30 backdrop-blur-sm border p-3 transition-all duration-300 cursor-pointer',
                      service.id === selectedServiceId
                        ? 'bg-card-background border-border/50'
                        : 'border-border/50 hover:bg-card-hover hover:border-primary/30',
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
                          <span className="text-sm font-bold text-foreground/90 leading-tight truncate">
                            {service.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/40 font-mono truncate">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceList;