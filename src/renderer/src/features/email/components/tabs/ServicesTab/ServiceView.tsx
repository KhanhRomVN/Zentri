/**
 * ------------------------------------------------------------------
 * ServiceView
 * ------------------------------------------------------------------
 * Detail view for a linked service. Displays service hero with
 * metadata, TOTP code with live countdown, backup codes, custom
 * metadata fields, and filtered activity history for that service's
 * domain.
 *
 * Main features:
 * - Service hero with favicon, tags, and action buttons
 * - TOTP live code generation with copy-to-clipboard
 * - Backup codes display with expand/collapse
 * - Custom metadata fields from service template
 * - Domain-filtered activity history with date picker
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { FC, useState, useEffect, useMemo, useCallback } from 'react';

// ── UI ──
import {
  ShieldCheck,
  History,
  Clock,
  Eye,
  Globe,
  Trash2,
  List,
  Link,
  MoreHorizontal,
} from 'lucide-react';

// ── Utils ──
import { format } from 'date-fns';
import { cn } from '../../../../../shared/lib/utils';
import { generateTotp, isValidBase32, getCodeColor } from '../../../../../shared/lib/totp';

// ── UI Components ──
import { Button } from '../../../../../components/ui/Button';
import { EmptyState } from '../../../../../components/ui/EmptyState';

// ── Components ──
import HistoryList from '../HistoryTab/HistoryList';

// ── Constants ──
import { getServiceById } from '../../../../../constants/services';

// ─── Helpers ────────────────────────────────────────────────────────────
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

type TagType = 'auth' | 'security' | 'search' | 'social' | null;

function detectTag(url: string, title: string): TagType {
  const u = url.toLowerCase();
  const t = title.toLowerCase();
  if (
    u.includes('signin') ||
    u.includes('login') ||
    u.includes('auth') ||
    u.includes('accounts') ||
    t.includes('sign in') ||
    t.includes('welcome') ||
    t.includes('2-step')
  )
    return 'auth';
  if (
    u.includes('pixelscan') ||
    u.includes('vpn-check') ||
    u.includes('dns-check') ||
    u.includes('blacklist') ||
    u.includes('fingerprint') ||
    t.includes('security') ||
    t.includes('check') ||
    t.includes('bot detection')
  )
    return 'security';
  if (u.includes('google.com/search') || u.includes('bing.com/search') || u.includes('search?'))
    return 'search';
  return null;
}

interface ProcessedItem {
  url: string;
  title: string;
  time: number;
  duration: number;
  timeLabel: string;
  durationLabel: string;
  domain: string;
  tag: TagType;
}
interface TimeGroup {
  key: string;
  label: string;
  sublabel: string;
  items: ProcessedItem[];
}

function groupByTimeCluster(items: ProcessedItem[]): TimeGroup[] {
  if (items.length === 0) return [];
  const groups: TimeGroup[] = [];
  let currentGroup: ProcessedItem[] = [items[0]];
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const curr = items[i];
    const diffMin = Math.abs(prev.time - curr.time) / 1000 / 60;
    if ((diffMin < 3 && prev.domain === curr.domain) || diffMin < 1) {
      currentGroup.push(curr);
    } else {
      groups.push(buildGroup(currentGroup));
      currentGroup = [curr];
    }
  }
  groups.push(buildGroup(currentGroup));
  return groups;
}

function buildGroup(items: ProcessedItem[]): TimeGroup {
  const first = items[0];
  const last = items[items.length - 1];
  const timeRange =
    first.timeLabel === last.timeLabel ? first.timeLabel : `${last.timeLabel} – ${first.timeLabel}`;
  const domainCount: Record<string, number> = {};
  for (const item of items) {
    domainCount[item.domain] = (domainCount[item.domain] || 0) + 1;
  }
  const dominantDomain = Object.entries(domainCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  return {
    key: `${first.time}`,
    label: timeRange,
    sublabel: `${items.length} visit${items.length > 1 ? 's' : ''} · ${dominantDomain}`,
    items,
  };
}

const ServiceHero: FC<{
  service: any;
  onEditServiceLink: (linkId: string) => void;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
  lastUsedFromHistory?: string | null;
}> = ({ service, onEditServiceLink, onOpenService, onDeleteService, lastUsedFromHistory }) => {
  const faviconUrl = service.url
    ? `https://www.google.com/s2/favicons?domain=${service.url}&sz=64`
    : '';
  const detectedTag = detectTag(service.url, service.name || '');
  const serviceTags: string[] = Array.isArray(service.tags) ? service.tags : [];
  const allTags: string[] = [...new Set([detectedTag, ...serviceTags].filter(Boolean) as string[])];
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
          {lastUsedFromHistory ? (
            <span className="flex items-center gap-1 text-[10px] font-mono">
              <Clock className="w-3 h-3" />
              {new Date(lastUsedFromHistory).toLocaleString()}
            </span>
          ) : service.lastUsedAt ? (
            <span className="flex items-center gap-1 text-[10px] font-mono">
              <Clock className="w-3 h-3" />
              {new Date(service.lastUsedAt).toLocaleString()}
            </span>
          ) : null}
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
      'bg-card-hover rounded-md border border-border p-4 hover:border-primary transition-colors',
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
  // Hiển thị section nếu có dữ liệu thực tế HOẶC template khai báo hỗ trợ
  const hasTotpEnabled = hasTotpValue || templateTwoFa.has_totp;
  const hasBackupEnabled = hasBackupValue || templateTwoFa.has_backup_codes;
  const hasAnySecurity = hasTotpEnabled || hasBackupEnabled;

  // [DEBUG] Xóa sau khi fix
  console.log('[DEBUG] ServiceView — service.twoFa:', JSON.stringify(service.twoFa));
  console.log(
    '[DEBUG] ServiceView — hasTotpValue:',
    hasTotpValue,
    'hasTotpEnabled:',
    hasTotpEnabled,
  );

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

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchHistory = useCallback(async () => {
    if (!email || !service.url) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-history', {
        email,
        date: selectedDate,
      });
      if (result.success && result.history) {
        const domain = getDomain(service.url);
        setHistoryItems(
          result.history.filter((item: any) => {
            try {
              return getDomain(item.url) === domain;
            } catch {
              return false;
            }
          }),
        );
      } else {
        setHistoryError(result.error || 'Failed to load history');
      }
    } catch (err: any) {
      setHistoryError(err.message || 'An error occurred');
    } finally {
      setHistoryLoading(false);
    }
  }, [email, service.url, selectedDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const processedHistory = useMemo<ProcessedItem[]>(
    () =>
      historyItems.map((item: any) => {
        const date = new Date(item.time);
        return {
          ...item,
          timeLabel: format(date, 'HH:mm'),
          durationLabel: `${item.duration || 0}s`,
          domain: getDomain(item.url),
          tag: detectTag(item.url, item.title || ''),
        };
      }),
    [historyItems],
  );
  const timeGroups = useMemo(() => groupByTimeCluster(processedHistory), [processedHistory]);
  const lastUsedFromHistory = useMemo(() => {
    if (historyItems.length === 0) return null;
    const latest = historyItems.reduce((a, b) => (a.time > b.time ? a : b));
    return latest.time;
  }, [historyItems]);
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
        lastUsedFromHistory={lastUsedFromHistory}
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
                {lastUsedFromHistory ? new Date(lastUsedFromHistory).toLocaleString() : 'Never'}
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
          title="Activity History"
          className="col-span-full"
          headerExtra={
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-1 rounded-md hover:bg-primary/10 transition-colors text-muted-foreground/60 hover:text-foreground"
                title="Previous day"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div
                className="px-3 py-1 text-xs font-mono bg-input-background border border-border rounded-md cursor-pointer hover:border-primary transition-colors min-w-[100px] text-center select-none"
                onClick={() => {
                  const input = document.getElementById('history-date-picker') as HTMLInputElement;
                  if (input) input.showPicker?.();
                }}
              >
                {new Date(selectedDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
              <input
                id="history-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="hidden"
              />
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-1 rounded-md hover:bg-primary/10 transition-colors text-muted-foreground/60 hover:text-foreground"
                title="Next day"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          }
        >
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : historyError ? (
            <div className="text-center py-8 text-muted-foreground/60 text-sm">
              <span className="text-error/60">Error: {historyError}</span>
            </div>
          ) : timeGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground/40 text-sm">
              <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
              No activity for this service
            </div>
          ) : (
            <div className="-mx-4 -mb-4 mt-1">
              <HistoryList
                groups={timeGroups}
                email={email}
                query=""
                onQueryChange={() => {}}
                onRefresh={fetchHistory}
              />
            </div>
          )}
        </SectionBox>
      </div>
    </div>
  );
};

export default ServiceDetail;
