import { Search } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import { ServiceItem } from '../../../../mock/accounts';
import { SERVICE_PROVIDERS, ServiceProviderConfig } from '../utils/servicePresets';

interface ServiceSidebarProps {
  services: ServiceItem[];
  selectedServiceId: string | undefined;
  onSelectService: (service: ServiceItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddService: () => void;
  getFaviconUrl: (url: string) => string;
  providers?: Record<string, ServiceProviderConfig>;
}

export const ServiceSidebar = ({
  services,
  selectedServiceId,
  onSelectService,
  searchQuery,
  onSearchChange,
  getFaviconUrl,
  onAddService,
  providers = SERVICE_PROVIDERS,
}: ServiceSidebarProps) => {
  return (
    <div className="w-[300px] border-r border-border flex flex-col bg-muted/5 shrink-0 h-full">
      <div className="border-b border-border p-3">
        <div className="relative group">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search services..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-background border border-input text-sm focus-visible:outline-none focus:border-primary/50 transition-all font-medium placeholder:text-muted-foreground/50"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {services.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-50">
            <span className="text-xs">No services found</span>
          </div>
        )}
        {services.map((service) => {
          const provider = service.serviceProviderId ? providers[service.serviceProviderId] : null;
          const name = provider?.name || service.serviceProviderId || 'Unknown';
          const websiteUrl = provider?.websiteUrl || service.metadata?.websiteUrl || '';
          const username = service.metadata?.username || '';

          return (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className={cn(
                'group p-3 rounded-lg cursor-pointer flex items-center gap-3 border transition-all',
                selectedServiceId === service.id
                  ? 'bg-background border-border shadow-sm ring-1 ring-primary/10'
                  : 'border-transparent hover:bg-muted/50 hover:border-border/50',
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 p-2 overflow-hidden border border-border/10">
                <img
                  src={getFaviconUrl(websiteUrl)}
                  alt={name}
                  className="w-full h-full object-contain opacity-80"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = '0';
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className={cn(
                    'font-medium text-sm truncate transition-colors',
                    selectedServiceId === service.id ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {name}
                </span>
                <span className="text-xs text-muted-foreground truncate opacity-70">
                  {username || 'No account'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-border bg-background/50 backdrop-blur-sm">
        <button
          onClick={onAddService}
          className="w-full flex items-center justify-center h-9 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-all active:scale-95"
        >
          + Add Service
        </button>
      </div>
    </div>
  );
};
