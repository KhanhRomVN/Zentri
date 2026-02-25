import { Search, Plus, Trash2, Database } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import { ServiceItem } from '../../../../mock/accounts';
import { memo } from 'react';

interface ServiceSidebarProps {
  services: ServiceItem[];
  selectedService: ServiceItem | undefined;
  onSelectService: (service: ServiceItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddService: () => void;
  getFaviconUrl: (url: string) => string;
  onDeleteService: (serviceId: string) => void;
}

export const ServiceSidebar = memo(
  ({
    services,
    selectedService,
    onSelectService,
    onAddService,
    onDeleteService,
    searchQuery,
    onSearchChange,
    getFaviconUrl,
  }: ServiceSidebarProps) => {
    return (
      <div className="w-80 border-r border-border h-full flex flex-col bg-muted/5">
        {/* Header */}
        <div className="p-4 border-b border-border bg-background/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Services</h2>
            <button
              onClick={onAddService}
              className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search services..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Service List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {services.length === 0 ? (
            <div className="p-8 text-center">
              <Database className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No services found</p>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className={cn(
                  'group relative flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-all',
                  selectedService?.id === service.id
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground',
                )}
              >
                <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center border border-border shrink-0 overflow-hidden shadow-sm">
                  <img
                    src={getFaviconUrl(service.metadata?.websiteUrl || '')}
                    alt=""
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="text-sm font-medium truncate">
                    {service.metadata?.username || service.id}
                  </h4>
                  <p className="text-[10px] opacity-70 truncate">
                    {service.metadata?.websiteUrl || 'No URL'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteService(service.id);
                  }}
                  className="absolute right-2 p-1 rounded-md hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
);
