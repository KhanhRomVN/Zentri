/**
 * ------------------------------------------------------------------
 * ServicesTab
 * ------------------------------------------------------------------
 * Tab panel for managing services linked to an email account.
 * Provides a two-panel layout: service list on the left and
 * service detail view on the right. Supports search filtering
 * and auto-selection of the first service.
 *
 * Main features:
 * - Search bar for filtering linked services
 * - Two-panel layout: list + detail view
 * - Auto-select first service on list change
 * - Link new service button
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { FC, useState, useEffect, useMemo } from 'react';

// ── UI ──
import { LayoutGrid } from 'lucide-react';

// ── Components ──
import ServiceList from './ServiceList';
import ServiceDetail from './ServiceView';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface ServicesTabProps {
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  accountServices: any[];
  onEditServiceLink: (linkId: string) => void;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
  email?: string;
  globalServices?: any[];
  onQuickAddService?: (service: any) => Promise<string | null>;
}

// ─── Component ──────────────────────────────────────────────────────────
const ServicesTab: FC<ServicesTabProps> = ({
  serviceSearch,
  setServiceSearch,
  accountServices,
  onEditServiceLink,
  onOpenService,
  onDeleteService,
  email,
  globalServices,
  onQuickAddService,
}) => {
  // ── State ──
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // ── Derived ──
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

  // ── Effects ──
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
          serviceSearch={serviceSearch}
          setServiceSearch={setServiceSearch}
          globalServices={globalServices}
          onQuickAddService={onQuickAddService}
        />

        {/* Right Panel - Service Detail */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col bg-card/5 backdrop-blur-sm">
          {selectedService ? (
            <ServiceDetail
              service={selectedService}
              email={email || ''}
              onOpenService={onOpenService}
              onDeleteService={onDeleteService}
              onQuickAddService={onQuickAddService}
              onCancel={() => setSelectedServiceId(null)}
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