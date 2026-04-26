import { FC, useState } from 'react';
import { cn } from '../../../shared/lib/utils';
import { Search, Plus } from 'lucide-react';
import { ServiceType } from '../index';

interface RegisSidebarProps {
  selectedServiceId: string | null;
  onSelectService: (id: string) => void;
  services: ServiceType[];
  onOpenAddService: () => void;
}

const RegisSidebar: FC<RegisSidebarProps> = ({
  selectedServiceId,
  onSelectService,
  services,
  onOpenAddService,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-[360px] shrink-0 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col relative z-20 transition-all duration-500">
      {/* Search and Action Header - Flush and Dark */}
      <div className="flex border-b border-border/50">
        <div className="flex-1 relative group bg-black/40 border-r border-border/50">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="w-full h-14 pl-11 pr-4 bg-transparent text-sm focus:outline-none transition-all placeholder:text-muted-foreground/20"
          />
        </div>
        <button
          onClick={onOpenAddService}
          className="h-14 w-14 shrink-0 bg-black/40 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-center group"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
        </button>
      </div>

      {/* Service List - Flush with panel edges */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col">
          {filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 mt-10 opacity-20">
              <Search className="w-10 h-10 mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center">
                System Depleted
              </span>
            </div>
          ) : (
            filteredServices.map((service) => (
              <button
                key={service.id}
                onClick={() => onSelectService(service.id)}
                className={cn(
                  'w-full group relative flex items-center gap-4 py-3.5 px-5 transition-all duration-300 border-b border-border/20 outline-none text-left',
                  selectedServiceId === service.id
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/10',
                )}
                style={{
                  background:
                    selectedServiceId === service.id
                      ? `linear-gradient(to right, ${service.color}15, transparent)`
                      : undefined,
                }}
              >
                {/* Active Indicator - Right side (sync with Sidebar.tsx) */}
                {selectedServiceId === service.id && (
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ backgroundColor: service.color }}
                  />
                )}

                {/* Favicon Image */}
                <div className="w-8 h-8 shrink-0 rounded-[6px] overflow-hidden bg-white/5 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm border border-border/10">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${service.domain}&sz=64`}
                    alt={service.name}
                    className="w-5 h-5 object-contain"
                  />
                </div>

                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-[15px] font-bold tracking-tight truncate w-full">
                    {service.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-muted-foreground/30 uppercase tracking-[0.15em] leading-none">
                      Nodes: {service.count}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisSidebar;
