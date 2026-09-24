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
import { FC, useState, useEffect, useMemo, useRef } from 'react';

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
  onOpenService?: (linkId: string) => void;
  onCloseBrowser?: () => void;
  isBrowserOpen?: boolean;
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
  onOpenService,
  onCloseBrowser,
  isBrowserOpen,
  onDeleteService,
  email,
  globalServices,
  onQuickAddService,
}) => {
  // ── State ──
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  // Draft service = user picked from the global list but has NOT saved to DB yet.
  // `id` is null so ServiceEmailForm skips auto-persist and ServiceView shows Save/Cancel.
  const [draftService, setDraftService] = useState<any | null>(null);

  // [DEBUG] track accountServices prop across mounts/refetches. If the TOTP value
  // is missing here after reopening the modal, the DB save never happened or
  // the parent did not refetch — if it IS present here but the input is empty,
  // the loss is inside ServiceEmailForm's local state.
  useEffect(() => {
    console.log('[DEBUG ServicesTab] mounted / accountServices changed', {
      count: accountServices?.length ?? 0,
      services: (accountServices || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        totp: s?.twoFa?.totp,
        backupCodesCount: (s?.twoFa?.backupCodes || []).length,
      })),
    });
    return () => {
      console.log('[DEBUG ServicesTab] unmounted');
    };
  }, [accountServices]);

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
  // Auto-select the first service only ONCE on mount. After the user explicitly
  // deselects (Cancel, or the selected service was deleted) we must not re-select
  // automatically — otherwise Cancel appears to have no effect.
  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (filteredServices.length === 0) {
      if (selectedServiceId !== null) setSelectedServiceId(null);
      return;
    }
    if (selectedServiceId && !filteredServices.some((s: any) => s.id === selectedServiceId)) {
      // Selected service no longer exists (e.g. hard-deleted) → clear selection
      setSelectedServiceId(null);
      return;
    }
    if (!selectedServiceId && !hasAutoSelectedRef.current && !draftService) {
      hasAutoSelectedRef.current = true;
      setSelectedServiceId(filteredServices[0].id);
    }
  }, [filteredServices, selectedServiceId, draftService]);

  // ── Handlers ──
  // User picked a service from the global list: keep it as a local draft only.
  // `serviceId` must point to the global service row so ServiceEmailForm can fetch
  // its metadata *definition*; `id` stays null so the DB link is not created yet.
  // `metadata` is reset to {} because the global service's metadata field holds
  // the field definition (array of {key, value:{type}}) — not user-entered values.
  const handlePickDraftService = (service: any) => {
    setDraftService({ ...service, id: null, serviceId: service.id, metadata: {} });
    setSelectedServiceId(null);
  };

  const handleClearDraft = () => {
    setDraftService(null);
  };

  // Picking a different card must discard any in-progress draft, otherwise the
  // form keeps showing the old draft and the click appears to have no effect.
  const handleSelectService = (id: string) => {
    setDraftService(null);
    setSelectedServiceId(id);
  };

  // Called by ServiceView's Save button after the IPC insert succeeds.
  const handleDraftSaved = (linkId: string) => {
    // [DEBUG] trace the draft→saved transition
    console.log('[DEBUG ServicesTab] handleDraftSaved CALLED', {
      linkId,
      prevDraftId: draftService?.id,
      prevDraftServiceId: draftService?.serviceId,
    });
    setDraftService(null);
    setSelectedServiceId(linkId);
    hasAutoSelectedRef.current = true;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Main Content: 2 Panels */}
      <div className="flex-1 overflow-hidden flex flex-row min-h-0">
        {/* Left Panel - Service Cards */}
        <ServiceList
          filteredServices={filteredServices}
          selectedServiceId={selectedServiceId}
          onSelectService={handleSelectService}
          onOpenService={onOpenService}
          onDeleteService={onDeleteService}
          serviceSearch={serviceSearch}
          setServiceSearch={setServiceSearch}
          globalServices={globalServices}
          onQuickAddService={onQuickAddService}
          onPickDraftService={handlePickDraftService}
        />

        {/* Right Panel - Service Detail */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col bg-card/5 backdrop-blur-sm">
          {draftService ? (
            <ServiceDetail
              service={draftService}
              email={email || ''}
              onQuickAddService={onQuickAddService}
              onCancel={handleClearDraft}
              onSaved={handleDraftSaved}
            />
          ) : selectedService ? (
            <ServiceDetail
              service={selectedService}
              email={email || ''}
              isBrowserOpen={isBrowserOpen}
              onOpenService={onOpenService}
              onCloseBrowser={onCloseBrowser}
              onDeleteService={onDeleteService}
              onQuickAddService={onQuickAddService}
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