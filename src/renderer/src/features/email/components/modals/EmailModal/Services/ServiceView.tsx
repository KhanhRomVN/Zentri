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
import { ShieldCheck, Clock, Eye, Globe, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../../../../shared/lib/utils';
import { Button } from '../../../../../../components/ui/Button';
import { EmptyState } from '../../../../../../components/ui/EmptyState';
import ServiceEmailForm from './ServiceEmailForm';

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

const ServiceHero: FC<{
  service: any;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
}> = ({ service, onOpenService, onDeleteService }) => {
  const faviconUrl = service.url
    ? `https://www.google.com/s2/favicons?domain=${service.url}&sz=64`
    : '';
  const serviceTags: string[] = Array.isArray(service.tags) ? service.tags : [];
  const allTags: string[] = [...new Set(serviceTags.filter(Boolean) as string[])];
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
            {service.category && (
              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                {service.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground/60">
            <span className="truncate font-mono">{service.url || 'No URL'}</span>
            {service.lastUsedAt && (
              <span className="flex items-center gap-1 text-[10px] font-mono">
                <Clock className="w-3 h-3" />
                {new Date(service.lastUsedAt).toLocaleString()}
              </span>
            )}
          </div>
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border',
                    tag === 'auth' && 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                    tag === 'security' && 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                    tag === 'search' && 'bg-violet-500/10 text-violet-500 border-violet-500/20',
                    tag === 'social' && 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
                    !['auth', 'security', 'search', 'social'].includes(tag) &&
                      'bg-muted text-muted-foreground border-border',
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Temporarily hidden — Open Browser / Delete buttons
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
        {onOpenService && (
          <Button variant="soft-success" size="sm" onClick={() => onOpenService(service.id)}>
            <Globe className="w-3.5 h-3.5" />
            Open Browser
          </Button>
        )}
        {onDeleteService && service.status !== 'trash' && (
          <Button variant="soft-error" size="sm" onClick={() => onDeleteService(service.id)}>
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        )}
      </div>
      */}
    </div>
  );
};

interface ServiceDetailProps {
  service: any;
  email: string;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
  onQuickAddService?: (service: any) => Promise<string | null>;
  onCancel?: () => void;
}

const ServiceDetail: FC<ServiceDetailProps> = ({
  service,
  email,
  onOpenService,
  onDeleteService,
  onQuickAddService,
  onCancel,
}) => {
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [fingerprintEntries, setFingerprintEntries] = useState<any[]>([]);
  const [fingerprintError, setFingerprintError] = useState<string | null>(null);
  const [expandedFingerprint, setExpandedFingerprint] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);

  const handleLinkService = async () => {
    if (!onQuickAddService) return;
    setLinking(true);
    setLinkMessage(null);
    try {
      const linkId = await onQuickAddService(service);
      if (linkId) {
        setLinkMessage('Service linked successfully');
        setIsLinked(true);
      } else {
        setLinkMessage('Failed to link service');
      }
    } catch {
      setLinkMessage('Failed to link service');
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
        onOpenService={onOpenService}
        onDeleteService={onDeleteService}
      />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide">
        <div className="space-y-4 px-4 mt-4">
          <ServiceEmailForm service={service} />

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
      {!isLinked && (
        <div className="h-12 border-t border-border bg-card-background/80 flex items-center justify-end gap-2 px-4 shrink-0">
          {linkMessage && (
            <span
              className={cn(
                'text-xs font-bold',
                linkMessage.includes('success') ? 'text-success' : 'text-error',
              )}
            >
              {linkMessage}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="soft" size="sm" disabled={linking} onClick={handleLinkService}>
            {linking ? 'Linking...' : 'Linked Service'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ServiceDetail;
