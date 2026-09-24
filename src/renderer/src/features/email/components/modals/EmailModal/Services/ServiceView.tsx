/**
 * ------------------------------------------------------------------
 * ServiceView
 * ------------------------------------------------------------------
 * Detail view for a linked service. Displays service hero,
 * editable security/metadata form (ServiceEmailForm), and fingerprint
 * history for the service's domain.
 * ------------------------------------------------------------------
 */

import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Clock, Eye, Globe, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../../../../components/ui/Button';
import { EmptyState } from '../../../../../../components/ui/EmptyState';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../../../components/ui/Dropdown';
import { useAccentColors } from '../../../../../../hooks/useAccentColors';
import ServiceFormModal from '../../ServiceFormModal';
import ServiceEmailForm from './ServiceEmailForm';

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * `services.category` is stored as a JSON-encoded array string (e.g. '["Social"]'),
 * but some code paths pass it through as an already-parsed array or a plain string.
 * Normalize all of these to a single display label.
 */
function normalizeCategoryLabel(cat: any): string | null {
  if (!cat) return null;
  if (Array.isArray(cat)) return cat[0] ?? null;
  if (typeof cat !== 'string') return null;
  const trimmed = cat.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? (parsed[0] ?? null) : parsed;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

const ServiceHero: FC<{
  service: any;
  isBrowserOpen?: boolean;
  onOpenService?: (linkId: string) => void;
  onCloseBrowser?: () => void;
  onDeleteService?: (linkId: string) => void;
}> = ({ service, isBrowserOpen, onOpenService, onCloseBrowser, onDeleteService }) => {
  const { getColorByIndex, toRgba } = useAccentColors();
  const faviconUrl = service.url
    ? `https://www.google.com/s2/favicons?domain=${service.url}&sz=64`
    : '';
  const categoryLabel = normalizeCategoryLabel(service.category);
  // Deterministic hash so the same category always gets the same accent color.
  const categoryColor = categoryLabel
    ? getColorByIndex(
        categoryLabel.split('').reduce((sum: number, c: string) => sum + c.charCodeAt(0), 0),
      )
    : null;
  // A draft service has no id yet → hide edit/delete menu entries.
  const isDraft = !service.id;
  const [editingService, setEditingService] = useState<any | null>(null);

  // Fetch the raw service row from the DB so ServiceFormModal gets a
  // ServiceProviderConfig-shaped object (accountServices only carries link data).
  const handleOpenEdit = async () => {
    if (!service.serviceId) return;
    try {
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        'SELECT * FROM services WHERE id = ?',
        [service.serviceId],
      );
      if (rows.length > 0) {
        const row = rows[0];
        setEditingService({
          id: row.id,
          name: row.name,
          websiteUrl: row.url || '',
          defaultTags: row.tags ? JSON.parse(row.tags) : [],
          defaultCategories: row.category ? JSON.parse(row.category) : [],
          description: row.description || '',
          metadata: row.metadata ? JSON.parse(row.metadata) : [],
          authMethods: row.auth_method ? JSON.parse(row.auth_method) : [],
          twoFa: row.two_fa ? JSON.parse(row.two_fa) : { has_totp: false, has_backup_codes: false },
        });
      }
    } catch (err) {
      console.error('Failed to load service for edit:', err);
    }
  };
  return (
    <div className="relative flex flex-col px-4 py-4 border-b border-border">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center p-1.5 border border-border shadow-sm shrink-0">
          <img
            src={faviconUrl}
            className="w-full h-full object-contain"
            alt=""
            onError={(e: any) => (e.target.style.display = 'none')}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-foreground truncate">{service.name}</h2>
            {categoryLabel && categoryColor && (
              <span
                className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold"
                style={{
                  backgroundColor: toRgba(categoryColor, 0.12),
                  color: categoryColor,
                }}
              >
                {categoryLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-text-secondary">
            <span className="truncate font-mono">{service.url || 'No URL'}</span>
            {service.lastUsedAt && (
              <span className="flex items-center gap-1 text-[10px] font-mono">
                <Clock className="w-3 h-3" />
                {new Date(service.lastUsedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!isDraft && (
            <Dropdown trigger="click" align="end" side="bottom">
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary bg-text-secondary/10 hover:text-foreground hover:bg-muted/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label="Service actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownTrigger>
              <DropdownContent>
                {(onOpenService || onCloseBrowser) && (
                  <>
                    <DropdownItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isBrowserOpen) {
                          onCloseBrowser?.();
                        } else {
                          onOpenService?.(service.id);
                        }
                      }}
                    >
                      <Globe
                        className={`w-3.5 h-3.5 ${
                          isBrowserOpen ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      />
                      {isBrowserOpen ? 'Close Browser' : 'Open Browser'}
                    </DropdownItem>
                    <div className="h-px bg-divider my-1" />
                  </>
                )}
                <DropdownItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit();
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 text-blue-500/60" />
                  Edit service
                </DropdownItem>
                {onDeleteService && service.status !== 'trash' && (
                  <>
                    <div className="h-px bg-divider my-1" />
                    <DropdownItem
                      className="text-error focus:text-error focus:bg-error/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            'Delete this service link permanently? This action cannot be undone.',
                          )
                        ) {
                          onDeleteService(service.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete service
                    </DropdownItem>
                  </>
                )}
              </DropdownContent>
            </Dropdown>
          )}
        </div>
      </div>
      {createPortal(
        <ServiceFormModal
          isOpen={!!editingService}
          onClose={() => setEditingService(null)}
          service={editingService}
        />,
        document.body,
      )}
    </div>
  );
};

interface ServiceDetailProps {
  service: any;
  email: string;
  isBrowserOpen?: boolean;
  onOpenService?: (linkId: string) => void;
  onCloseBrowser?: () => void;
  onDeleteService?: (linkId: string) => void;
  onQuickAddService?: (service: any) => Promise<string | null>;
  onCancel?: () => void;
  /** Called after a draft service is successfully persisted to the DB. */
  onSaved?: (linkId: string) => void;
}

const ServiceDetail: FC<ServiceDetailProps> = ({
  service,
  email,
  isBrowserOpen,
  onOpenService,
  onCloseBrowser,
  onDeleteService,
  onQuickAddService,
  onCancel,
  onSaved,
}) => {
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [fingerprintEntries, setFingerprintEntries] = useState<any[]>([]);
  const [fingerprintError, setFingerprintError] = useState<string | null>(null);
  const [expandedFingerprint, setExpandedFingerprint] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [draftData, setDraftData] = useState<{
    metadata: Record<string, any>;
    twoFa: { totp: string; backupCodes: string[] };
  }>({ metadata: {}, twoFa: { totp: '', backupCodes: [] } });

  // A draft service has no DB id yet → show Save/Cancel and skip auto-persist.
  const isDraft = !service.id;

  const handleSaveService = async () => {
    if (!onQuickAddService || !isDraft) return;
    // [DEBUG] log draft state at save time
    console.log('[DEBUG ServiceView] handleSaveService CALLED', {
      serviceId: service.serviceId || service.id,
      isDraft,
      draftData,
      hasOnQuickAddService: !!onQuickAddService,
    });
    setLinking(true);
    try {
      // Pass the user-entered metadata and twoFa data to the insert handler
      const payload = { ...service, ...draftData };
      console.log('[DEBUG ServiceView] invoking onQuickAddService with payload', payload);
      const linkId = await onQuickAddService(payload);
      console.log('[DEBUG ServiceView] onQuickAddService resolved, linkId =', linkId);
      if (linkId) {
        console.log('[DEBUG ServiceView] calling onSaved with linkId =', linkId);
        onSaved?.(linkId);
      } else {
        console.log('[DEBUG ServiceView] linkId is falsy — onSaved NOT called');
      }
    } catch (err) {
      console.error('Failed to save service', err);
    } finally {
      setLinking(false);
    }
  };

  const fetchFingerprintHistory = useCallback(async () => {
    if (!email || !service?.url) return;
    setFingerprintLoading(true);
    setFingerprintError(null);
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-fingerprint-history', {
        email,
      });
      if (result.success && result.entries) {
        const domain = getDomain(service.url);
        setFingerprintEntries(
          result.entries.filter((entry: any) => {
            try {
              return entry.domain === domain;
            } catch {
              return false;
            }
          }),
        );
      } else {
        setFingerprintError(result.error || 'Failed to load fingerprint history');
      }
    } catch (err: any) {
      setFingerprintError(err.message || 'An error occurred');
    } finally {
      setFingerprintLoading(false);
    }
  }, [email, service?.url]);

  useEffect(() => {
    fetchFingerprintHistory();
  }, [fetchFingerprintHistory]);

  const processedFingerprints = useMemo(() => {
    return [...fingerprintEntries].sort((a, b) => {
      return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
    });
  }, [fingerprintEntries]);

  if (!service) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ServiceHero
        service={service}
        isBrowserOpen={isBrowserOpen}
        onOpenService={onOpenService}
        onCloseBrowser={onCloseBrowser}
        onDeleteService={onDeleteService}
      />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide">
        <div className="space-y-4 px-4 mt-4">
          {/* key forces a remount when switching services so local state
              (totpSecret, metadataValues, backup codes) resets properly. */}
          <ServiceEmailForm
            key={service.id || 'draft'}
            service={service}
            autoSave={!isDraft}
            onChange={isDraft ? setDraftData : undefined}
          />

          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground">Fingerprint History</h3>
                <p className="text-sm text-text-secondary">
                  Sessions and configurations linked to this service domain
                </p>
              </div>
            </div>
            {fingerprintLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : fingerprintError ? (
              <div className="text-center py-8 text-muted-foreground/60 text-sm">
                <span className="text-error/60">Error: {fingerprintError}</span>
              </div>
            ) : processedFingerprints.length === 0 ? (
              <EmptyState
                variant="default"
                icon={<ShieldCheck className="w-6 h-6" />}
                title="No fingerprint history"
                description="Fingerprints will appear when you browse this service with a fingerprint profile."
                className="h-auto py-8"
              />
            ) : (
              <div className="space-y-2">
                {processedFingerprints.map((entry, index) => {
                  const isActive = !entry.ended_at;
                  const isExpanded = expandedFingerprint === entry.fingerprint_hash;

                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-border/40 bg-card-background overflow-hidden hover:border-primary/30 transition-colors"
                    >
                      <div className="px-3 py-2.5">
                        <div className="flex items-center gap-2 mb-2">
                          {isActive ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Active now
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                              <div className="w-2 h-2 rounded-full bg-amber-500" />
                              {entry.started_at && entry.ended_at
                                ? `${format(new Date(entry.started_at), 'MMM d, HH:mm')} → ${format(new Date(entry.ended_at), 'MMM d, HH:mm')}`
                                : 'Past session'}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {format(new Date(entry.started_at), 'MMM d, yyyy HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="font-mono text-[11px]">{entry.public_ip}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                            <ShieldCheck className="w-3 h-3 shrink-0" />
                            <span
                              className="font-mono text-[11px] truncate"
                              title={entry.fingerprint_hash}
                            >
                              {entry.fingerprint_hash}
                            </span>
                          </div>
                        </div>

                        {entry.fingerprint_config_json && (
                          <div className="mt-2 pt-2 border-t border-border/20">
                            {!isExpanded ? (
                              <button
                                onClick={() => setExpandedFingerprint(entry.fingerprint_hash)}
                                className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                View config (
                                {Math.round(entry.fingerprint_config_json.length / 1024)}
                                KB)
                              </button>
                            ) : (
                              <div>
                                <button
                                  onClick={() => setExpandedFingerprint(null)}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1 transition-colors"
                                >
                                  <Eye className="w-3 h-3" />
                                  Hide config
                                </button>
                                <pre className="text-[10px] font-mono bg-muted/30 rounded-lg p-2 max-h-48 overflow-auto whitespace-pre-wrap break-all">
                                  {(() => {
                                    try {
                                      return JSON.stringify(
                                        JSON.parse(entry.fingerprint_config_json),
                                        null,
                                        2,
                                      );
                                    } catch {
                                      return entry.fingerprint_config_json;
                                    }
                                  })()}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <div className="h-10" />
        </div>
      </div>
      {isDraft && (
        <div className="border-t border-border bg-card-background/80 flex items-center justify-end gap-2 px-4 py-2 shrink-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="soft" disabled={linking} onClick={handleSaveService}>
            {linking ? 'Saving...' : 'Save Service'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ServiceDetail;
