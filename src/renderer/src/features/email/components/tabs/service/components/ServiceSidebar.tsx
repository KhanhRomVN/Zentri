import { Search } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import { ServiceItem } from '../../../../mock/accounts';

interface ServiceSidebarProps {
  services: ServiceItem[];
  selectedServiceId: string | undefined;
  onSelectService: (service: ServiceItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  getFaviconUrl: (url: string) => string;
}

export const ServiceSidebar = ({
  services,
  selectedServiceId,
  onSelectService,
  searchQuery,
  onSearchChange,
  getFaviconUrl,
}: ServiceSidebarProps) => {
  return (
    <div className="w-[300px] border-r border-border flex flex-col bg-muted/5 shrink-0">
      <div className="p-3 border-b border-border">
        <div className="relative group">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search services..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-background border border-input text-sm focus-visible:outline-none"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => onSelectService(service)}
            className={cn(
              'group p-3 rounded-lg cursor-pointer flex items-center gap-3 border transition-all',
              selectedServiceId === service.id
                ? 'bg-background border-border shadow-sm'
                : 'border-transparent hover:bg-muted/50',
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 p-2 overflow-hidden">
              <img
                src={getFaviconUrl(service.websiteUrl)}
                alt={service.name}
                className="w-full h-full object-contain opacity-80"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  'font-medium text-sm truncate',
                  selectedServiceId === service.id ? 'text-primary' : 'text-foreground',
                )}
              >
                {service.name}
              </span>
              <span className="text-xs text-muted-foreground truncate opacity-80">
                {service.username}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
