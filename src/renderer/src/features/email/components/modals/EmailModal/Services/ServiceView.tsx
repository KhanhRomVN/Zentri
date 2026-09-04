/**
 * ------------------------------------------------------------------
 * ServiceView
 * ------------------------------------------------------------------
 * Detail view for a linked service. Displays service hero with
 * metadata, TOTP code with live countdown, backup codes, custom
 * metadata fields, and fingerprint history for that service's
 * domain.
 *
 * Main features:
 * - Service hero with favicon, tags, and action buttons
 * - TOTP live code generation with copy-to-clipboard
 * - Backup codes display with expand/collapse
 * - Custom metadata fields from service template
 * - Domain-filtered fingerprint history with config preview
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { FC, useState, useEffect, useMemo, useCallback } from 'react';

// ── UI ──
import { ShieldCheck, Clock, Eye, Globe, Trash2, List, Link, MoreHorizontal } from 'lucide-react';

// ── Utils ──
import { format } from 'date-fns';
import { cn } from '../../../../../../shared/lib/utils';
import { generateTotp, isValidBase32, getCodeColor } from '../../../../../../shared/lib/totp';

// ── UI Components ──
import { Button } from '../../../../../../components/ui/Button';
import { EmptyState } from '../../../../../../components/ui/EmptyState';

// ── Constants ──
import { getServiceById } from '../../../../../../constants/services';

// ─── Helpers ────────────────────────────────────────────────────────────
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

const ServiceHero: FC<{
  service: any;
  onEditServiceLink: (linkId: string) => void;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
}> = ({ service, onEditServiceLink, onOpenService, onDeleteService }) => {
  const faviconUrl = service.url
    ? `https://www.google.com/s2/favicons?domain=${service.url}&sz=64`
    : '';
  const serviceTags: string[] = Array.isArray(service.tags) ? service.tags : [];
  const allTags: string[] = [...new Set(serviceTags.filter(Boolean) as string[])];
  return (
    <div className="flex items-start gap-3 px-4 py-4 border-b border-border">
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
      <div className="flex items-center gap-1.5 shrink-0">
        <Button variant="soft-info" size="sm" onClick={() => onEditServiceLink(service.id)}>
          <Eye className="w-3.5 h-3.5" />
          Edit
        </Button>
        {onOpenService && (
          <Button variant="soft-success" size="sm" onClick={() => onOpenService(service.id)}>
            <Globe className="w-3.5 h-3.5" />
            Open with Browser
          </Button>
        )}
        {onDeleteService && service.status !== 'trash' && (
          <Button variant="soft-error" size="sm" onClick={() => onDeleteService(service.id)}>
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

const SectionBox: FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerExtra?: React.ReactNode;
}> = ({ title, icon, children, className, headerExtra }) => (
  <div
    className={cn(
      'bg-card-background rounded-md border border-border p-4 hover:border-primary transition-colors',
      className,
    )}
  >
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2">
        {icon && <span>{icon}</span>}
        <h3 className="text-xs font-black tracking-widest uppercase text-muted-foreground/50">
          {title}
        </h3>
      </div>
      {headerExtra && <div className="shrink-0">{headerExtra}</div>}
    </div>
    {children}
  </div>
);

const FieldRow: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between py-1 border-b border-border last:border-b-0 last:pb-0">
    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/40">
      {label}
    </span>
    <span className="text-foreground/80 text-sm">{children}</span>
  </div>
);

interface ServiceDetailProps {
  service: any;
  email: string;
  onEditServiceLink: (linkId: string) => void;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
}

const ServiceDetail: FC<ServiceDetailProps> = ({
  service,
  email,
  onEditServiceLink,
  onOpenService,
  onDeleteService,
}) => {
  let linkedMetadata: any[] = [];
  if (service.metadata) {
    if (typeof service.metadata === 'string') {
      try {
        linkedMetadata = JSON.parse(service.metadata);
      } catch {
        linkedMetadata = [];
      }
    } else if (Array.isArray(service.metadata)) {
      linkedMetadata = service.metadata;
    }
  }
  const serviceTemplate = getServiceById(service.serviceId);
  const templateTwoFa = serviceTemplate?.two_fa || { has_totp: false, has_backup_codes: false };
  const linkedTwoFa = service.twoFa || {};
  const linkedTotpSecret: string = linkedTwoFa.totp || '';
  const linkedBackupCodes: string[] = linkedTwoFa.backupCodes || [];
  const hasTotpValue = !!linkedTotpSecret && isValidBase32(linkedTotpSecret);
  const hasBackupValue = linkedBackupCodes.length > 0;
  const hasTotpEnabled = hasTotpValue || templateTwoFa.has_totp;
  const hasBackupEnabled = hasBackupValue || templateTwoFa.has_backup_codes;
  const hasAnySecurity = hasTotpEnabled || hasBackupEnabled;

  const [totpCode, setTotpCode] = useState<string | null>(null);
  const [totpTimer, setTotpTimer] = useState(30);
  const [backupExpanded, setBackupExpanded] = useState(false);

  useEffect(() => {
    if (!hasTotpValue) {
      setTotpCode(null);
      setTotpTimer(30);
      return;
    }
    const tick = () => {
      setTotpCode(generateTotp(linkedTotpSecret));
      setTotpTimer(30 - (Math.floor(Date.now() / 1000) % 30));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [linkedTotpSecret, hasTotpValue]);

  const copyTotp = useCallback(() => {
    if (totpCode) {
      navigator.clipboard.writeText(totpCode);
    }
  }, [totpCode]);

  const [authMethods, setAuthMethods] = useState<string[]>([]);
  const [serviceMetadata, setServiceMetadata] = useState<any[]>([]);
  useEffect(() => {
    const fetchServiceConfig = async () => {
      try {
        // @ts-ignore
        const rows = await window.electron.ipcRenderer.invoke(
          'sqlite:all',
          'SELECT auth_method, metadata FROM services WHERE id = ?',
          [service.serviceId],
        );
        if (rows.length > 0) {
          const row = rows[0];
          if (row.auth_method) {
            setAuthMethods(JSON.parse(row.auth_method));
          } else {
            setAuthMethods([]);
          }
          if (row.metadata) {
            const parsed = JSON.parse(row.metadata);
            setServiceMetadata(Array.isArray(parsed) ? parsed : parsed.fields || []);
          } else {
            setServiceMetadata([]);
          }
        } else {
          setAuthMethods([]);
          setServiceMetadata([]);
        }
      } catch {
        setAuthMethods([]);
        setServiceMetadata([]);
      }
    };
    if (service.serviceId) {
      fetchServiceConfig();
    }
  }, [service.serviceId]);

  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [fingerprintEntries, setFingerprintEntries] = useState<any[]>([]);
  const [fingerprintError, setFingerprintError] = useState<string | null>(null);
  const [expandedFingerprint, setExpandedFingerprint] = useState<string | null>(null);

  const fetchFingerprintHistory = useCallback(async () => {
    if (!email || !service.url) return;
    setFingerprintLoading(true);
    setFingerprintError(null);
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-fingerprint-history', {
        email,
      });
      if (result.success && result.entries) {
        const domain = getDomain(service.url);
        // Filter entries by service domain
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
  }, [email, service.url]);

  useEffect(() => {
    fetchFingerprintHistory();
  }, [fetchFingerprintHistory]);

  const processedFingerprints = useMemo(() => {
    // Sort by started_at descending
    return [...fingerprintEntries].sort((a, b) => {
      return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
    });
  }, [fingerprintEntries]);
  const formatAuthMethod = (method: string): string =>
    method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  if (!service) return null;

  return (
    <div className="flex-1 overflow-y-scroll overscroll-contain custom-scrollbar">
      <ServiceHero
        service={service}
        onEditServiceLink={onEditServiceLink}
        onOpenService={onOpenService}
        onDeleteService={onDeleteService}
      />
      <div className="space-y-4 px-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <SectionBox title="Linked Info" icon={<Link className="w-3.5 h-3.5 text-blue-400" />}>
            <div className="space-y-0">
              <FieldRow label="Email">{email || '—'}</FieldRow>
              <FieldRow label="Methods">
                {authMethods.length > 0 ? authMethods.map(formatAuthMethod).join(', ') : 'None'}
              </FieldRow>
              <FieldRow label="Last Used">
                {service.lastUsedAt ? new Date(service.lastUsedAt).toLocaleString() : 'Never'}
              </FieldRow>
            </div>
          </SectionBox>
          <SectionBox
            title="Security"
            icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
          >
            {hasAnySecurity ? (
              <div className="space-y-0">
                {hasTotpEnabled && (
                  <FieldRow label="TOTP">
                    {hasTotpValue && totpCode ? (
                      <span className="text-sm font-mono">
                        <span
                          className="cursor-pointer hover:text-primary transition-colors"
                          onClick={copyTotp}
                          title="Click to copy"
                        >
                          {totpCode}
                        </span>
                        <span className="text-muted-foreground/60"> | {totpTimer}s</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/40 italic">
                        Enabled, no secret configured
                      </span>
                    )}
                  </FieldRow>
                )}
                {hasBackupEnabled && (
                  <FieldRow label="Backup Codes">
                    {hasBackupValue ? (
                      <div
                        className={cn('flex items-center gap-1.5', backupExpanded && 'flex-wrap')}
                      >
                        {(backupExpanded ? linkedBackupCodes : linkedBackupCodes.slice(0, 4)).map(
                          (code, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-md text-[10px] font-medium border font-mono whitespace-nowrap leading-none"
                              style={{
                                backgroundColor: getCodeColor(code).bg,
                                borderColor: getCodeColor(code).border,
                                color: getCodeColor(code).text,
                              }}
                            >
                              {code}
                            </span>
                          ),
                        )}
                        {!backupExpanded && linkedBackupCodes.length > 4 && (
                          <button
                            onClick={() => setBackupExpanded(true)}
                            className="p-0.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/60 hover:text-foreground"
                            title="Show all backup codes"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        )}
                        {backupExpanded && (
                          <button
                            onClick={() => setBackupExpanded(false)}
                            className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors ml-1"
                          >
                            Collapse
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/40 italic">
                        Enabled, no codes added
                      </span>
                    )}
                  </FieldRow>
                )}
              </div>
            ) : (
              <EmptyState
                variant="default"
                icon={<ShieldCheck className="w-6 h-6" />}
                title="No security configured"
                description="This service has no TOTP or backup codes set up."
                className="h-auto py-4"
              />
            )}
          </SectionBox>
        </div>

        <SectionBox title="Metadata Fields" icon={<List className="w-3.5 h-3.5 text-amber-400" />}>
          {serviceMetadata.length > 0 ? (
            <div className="space-y-0">
              {serviceMetadata.map((item: any, i: number) => {
                const fieldName = item.key || item.name || `Field ${i + 1}`;
                const linkedItem = linkedMetadata.find((m: any) => (m.key || m.name) === fieldName);
                const fieldValue = linkedItem?.value || '';
                let fieldFeature = item.feature || '';
                if (!item.type && item.value) {
                  try {
                    const parsed = JSON.parse(item.value);
                    fieldFeature = parsed.feature || '';
                  } catch {
                    /* keep defaults */
                  }
                }
                return (
                  <FieldRow key={i} label={fieldName}>
                    <span className="flex items-center gap-2">
                      {fieldValue ? (
                        <span className="text-sm">{fieldValue}</span>
                      ) : (
                        <span className="text-[10px] italic text-muted-foreground/25">Not set</span>
                      )}
                      {fieldFeature && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                          {fieldFeature.replace(/_/g, ' ')}
                        </span>
                      )}
                    </span>
                  </FieldRow>
                );
              })}
            </div>
          ) : (
            <EmptyState
              variant="default"
              icon={<List className="w-6 h-6" />}
              title="No metadata fields"
              description=""
              className="h-auto py-4"
            />
          )}
        </SectionBox>

        <SectionBox
          title="Fingerprint History"
          className="col-span-full"
          icon={<ShieldCheck className="w-3.5 h-3.5 text-violet-400" />}
        >
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
            <div className="space-y-2 -mx-4 -mb-4 px-4 pb-4">
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
                              View config ({Math.round(entry.fingerprint_config_json.length / 1024)}
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
        </SectionBox>
      </div>
    </div>
  );
};

export default ServiceDetail;
