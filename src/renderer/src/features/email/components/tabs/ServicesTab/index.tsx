import { Search, Plus, LayoutGrid } from 'lucide-react';
import { FC, useState, useEffect, useMemo } from 'react';
import ServiceList from './ServiceList';
import ServiceDetail from './ServiceView';

interface ServicesTabProps {
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  accountServices: any[];
  onAddNewServiceLink: () => void;
  onEditServiceLink: (linkId: string) => void;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
  email?: string;
}

const ServicesTab: FC<ServicesTabProps> = ({
  serviceSearch,
  setServiceSearch,
  accountServices,
  onAddNewServiceLink,
  onEditServiceLink,
  onOpenService,
  onDeleteService,
  email,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Derived filtered services
  const filteredServices = (accountServices || []).filter(
    (s: any) =>
      !serviceSearch ||
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.url?.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  const selectedService = useMemo(
    () => (accountServices || []).find((s: any) => s.id === selectedServiceId) || null,
    [accountServices, selectedServiceId],
  );

  // Auto-select first service when list changes
  useEffect(() => {
    if (filteredServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(filteredServices[0].id);
    } else if (filteredServices.length > 0 && selectedServiceId) {
      const stillExists = filteredServices.some((s: any) => s.id === selectedServiceId);
      if (!stillExists) {
        setSelectedServiceId(filteredServices[0].id);
      }
    } else if (filteredServices.length === 0) {
      setSelectedServiceId(null);
    }
  }, [filteredServices, selectedServiceId]);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Services Sub-Navbar */}
      <div className="h-[40px] flex items-center justify-between px-2 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-500">
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

      {/* Main Content: 2 Panels */}
      <div className="flex-1 overflow-hidden flex flex-row min-h-0">
        {/* Left Panel - Service Cards */}
        <ServiceList
          filteredServices={filteredServices}
          selectedServiceId={selectedServiceId}
          onSelectService={setSelectedServiceId}
          onEditServiceLink={onEditServiceLink}
          onOpenService={onOpenService}
          onDeleteService={onDeleteService}
        />

        {/* Right Panel - Service Detail */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col bg-card/5 backdrop-blur-sm">
          {selectedService ? (
            <ServiceDetail
              service={selectedService}
              email={email || ''}
              onEditServiceLink={onEditServiceLink}
              onOpenService={onOpenService}
              onDeleteService={onDeleteService}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-3 opacity-30">
              <LayoutGrid className="w-10 h-10" />
              <p className="text-[11px] font-black uppercase tracking-widest">Select a service</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesTab;