/**
 * ------------------------------------------------------------------
 * FootprintDetail
 * ------------------------------------------------------------------
 * Creative, modern detail panel for tracking a website's footprint.
 * Inspired by a curated risk-analysis dashboard design.
 *
 * Layout (top to bottom):
 *   - Header: favicon + domain + live status + session filter
 *   - Session timeline: expandable session cards with risk pill,
 *     card-info (location + device) and 2 tabs:
 *       Attributes / Issues (comparison table)
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
import { useState } from 'react';

import {
  Monitor,
  MapPin,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Trash2,
} from 'lucide-react';

import { format } from 'date-fns';
import { cn } from '../../../../../../shared/lib/utils';

import { FingerprintEntry } from './FootprintTable';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface FootprintDetailProps {
  entries: FingerprintEntry[];
  onDeleteSession?: (id: string) => void | Promise<void>;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function parseFingerprintConfig(json: string | null): Record<string, any> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function parseIpInfo(json: string | null): Record<string, any> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function formatDuration(start: string, end: string | null): string {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const diffMs = Math.max(0, endMs - startMs);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  return `${hours}h ${String(remainMin).padStart(2, '0')}m`;
}

function countryCodeToFlag(code: string | undefined): string {
  if (!code) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

function parseBrowser(ua: string | undefined): string {
  if (!ua) return '—';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/')) return 'Safari';
  return ua.split(' ')[0] || '—';
}

function shortLabel(s: FingerprintEntry): string {
  return `${format(new Date(s.started_at), 'dd/MM')} · ${format(new Date(s.started_at), 'HH:mm')}${!s.ended_at ? ' (active)' : ''}`;
}

// Fields used in the comparison table (Issues tab)
const cmpFields: Array<[string, string]> = [
  ['public_ip', 'Public IP'],
  ['fingerprint_hash', 'FP Hash'],
  ['city', 'City'],
  ['country', 'Country'],
  ['isp', 'ISP'],
  ['asn', 'ASN'],
  ['timezone', 'Timezone'],
  ['platform', 'OS'],
  ['browser', 'Browser'],
  ['userAgent', 'User Agent'],
  ['hardwareConcurrency', 'CPU'],
  ['deviceMemory', 'RAM'],
  ['webglRenderer', 'GPU / WebGL'],
  ['screenWidth', 'Screen Resolution'],
  ['languages', 'Language'],
];

function getFieldValue(entry: FingerprintEntry, key: string): string {
  if (key === 'public_ip') return entry.public_ip || '—';
  if (key === 'fingerprint_hash') return entry.fingerprint_hash || '—';

  const cfg = parseFingerprintConfig(entry.fingerprint_config_json);
  const ip = parseIpInfo(entry.ip_info_json);

  if (key === 'city') return ip.city || '—';
  if (key === 'country') return ip.country || '—';
  if (key === 'isp') return ip.isp || '—';
  if (key === 'asn') return ip.as || '—';
  if (key === 'timezone') return cfg.timezone || '—';
  if (key === 'platform') return cfg.platform || '—';
  if (key === 'browser') return parseBrowser(cfg.userAgent);
  if (key === 'screenWidth') {
    const w = cfg.screenWidth || cfg.screen?.width;
    const h = cfg.screenHeight || cfg.screen?.height;
    return w && h ? `${w}×${h}` : w ? String(w) : '—';
  }
  if (key === 'languages') {
    const l = cfg.languages;
    if (Array.isArray(l)) return l.join(', ');
    return l ? String(l) : '—';
  }

  const val = cfg[key];
  if (val === undefined || val === null) return '—';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

function countChanged(a: FingerprintEntry, b: FingerprintEntry): number {
  return cmpFields.reduce(
    (n, [key]) => n + (getFieldValue(a, key) !== getFieldValue(b, key) ? 1 : 0),
    0,
  );
}

// ─── Sub-component: Session Card ─────────────────────────────────────────
function SessionCard({
  entry,
  prevEntry,
  onDelete,
}: {
  entry: FingerprintEntry;
  prevEntry: FingerprintEntry | null;
  onDelete?: (id: string) => void | Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'attr' | 'issues'>('attr');
  const [confirming, setConfirming] = useState(false);

  const isActive = !entry.ended_at;
  const config = parseFingerprintConfig(entry.fingerprint_config_json);
  const ipInfo = parseIpInfo(entry.ip_info_json);

  const browser = parseBrowser(config.userAgent);
  const duration = formatDuration(entry.started_at, entry.ended_at);
  const flag = countryCodeToFlag(ipInfo.countryCode);
  const asn = ipInfo.as || '—';
  const isp = ipInfo.isp || '—';
  const city = ipInfo.city || '—';
  const country = ipInfo.country || '—';

  const changed = prevEntry ? countChanged(entry, prevEntry) : 0;

  // Risk pill state
  let pillState: 'first' | 'high' | 'moderate' | 'none' = 'none';
  let pillLabel = 'Matches previous';
  if (!prevEntry) {
    pillState = 'first';
    pillLabel = 'First session';
  } else if (changed >= 5) {
    pillState = 'high';
    pillLabel = `${changed} fields differ`;
  } else if (changed >= 1) {
    pillState = 'moderate';
    pillLabel = `${changed} fields differ`;
  }

  const attrGroups: Array<{ title: string; fields: Array<[string, string]> }> = [
    {
      title: 'Network & location',
      fields: [
        ['public_ip', 'Public IP'],
        ['city', 'City'],
        ['country', 'Country'],
        ['isp', 'ISP'],
        ['asn', 'ASN'],
        ['timezone', 'Timezone'],
      ],
    },
    {
      title: 'Device & OS',
      fields: [
        ['platform', 'OS'],
        ['browser', 'Browser'],
        ['userAgent', 'User Agent'],
      ],
    },
    {
      title: 'Hardware',
      fields: [
        ['hardwareConcurrency', 'CPU'],
        ['deviceMemory', 'RAM'],
        ['webglRenderer', 'GPU / WebGL'],
        ['screenWidth', 'Screen Resolution'],
      ],
    },
    {
      title: 'Other',
      fields: [['languages', 'Language']],
    },
  ];

  const getAttrValue = (key: string): string => {
    if (key === 'city') return city;
    if (key === 'country') return `${flag} ${country}`;
    if (key === 'isp') return isp;
    if (key === 'asn') return asn;
    if (key === 'browser') return browser;
    return getFieldValue(entry, key);
  };

  const handleConfirmDelete = async () => {
    if (onDelete) await onDelete(entry.id);
  };

  return (
    <div className="relative pl-6 pb-3">
      {/* Timeline node */}
      <div
        className={cn(
          'absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 bg-card-background',
          isActive
            ? 'border-green shadow-[0_0_0_4px_rgba(62,207,142,0.1)]'
            : 'border-text-secondary/30',
        )}
      >
        {isActive && <span className="absolute inset-[2px] rounded-full bg-green" />}
      </div>

      {/* Session card */}
      <div
        className={cn(
          'rounded-lg border bg-card-background overflow-hidden transition-colors',
          expanded
            ? 'border-primary shadow-[0_0_0_1px_rgba(79,168,224,0.25)]'
            : 'border-border hover:border-border-strong',
        )}
      >
        {/* Summary row */}
        {confirming ? (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-red/10 border-b border-red/30">
            <AlertTriangle className="w-4 h-4 text-red shrink-0" />
            <div className="flex-1 text-[12px] text-text-primary">
              Delete session{' '}
              <b className="text-red">
                {format(new Date(entry.started_at), 'HH:mm:ss')} ·{' '}
                {format(new Date(entry.started_at), 'dd/MM')}
              </b>
              ? This action cannot be undone.
            </div>
            <button
              className="font-sans text-[11px] font-semibold px-2.5 py-1 rounded-md border border-border-strong bg-muted/20 text-text-secondary/70 hover:text-text-primary transition-colors"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
            <button
              className="font-sans text-[11px] font-semibold px-2.5 py-1 rounded-md border bg-red text-[#1a0906] border-red hover:brightness-110 transition-all"
              onClick={handleConfirmDelete}
            >
              Delete permanently
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-baseline gap-2 flex-1 min-w-0">
              <span className="font-mono text-xs text-text-primary">
                {format(new Date(entry.started_at), 'HH:mm:ss')}
                {entry.ended_at && (
                  <span className="text-text-secondary/50">
                    {' → '}
                    {format(new Date(entry.ended_at), 'HH:mm:ss')}
                  </span>
                )}
              </span>
              <span className="font-mono text-[10px] text-text-secondary/40">
                {format(new Date(entry.started_at), 'dd/MM')} · {duration}
              </span>
            </div>

            {pillState === 'first' && (
              <span className="inline-flex items-center gap-1.5 shrink-0 font-sans text-[11.5px] font-semibold px-2.5 py-1 rounded-md bg-muted/20 text-text-secondary/70 border border-border-strong">
                <CheckCircle className="w-3 h-3" />
                {pillLabel}
              </span>
            )}
            {pillState === 'none' && (
              <span className="inline-flex items-center gap-1.5 shrink-0 font-sans text-[11.5px] font-semibold px-2.5 py-1 rounded-md bg-green/10 text-green border border-green/30">
                <CheckCircle className="w-3 h-3" />
                {pillLabel}
              </span>
            )}
            {(pillState === 'high' || pillState === 'moderate') && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 shrink-0 font-sans text-[11.5px] font-semibold px-2.5 py-1 rounded-md border',
                  pillState === 'high'
                    ? 'bg-red/10 text-red border-red/30'
                    : 'bg-warn/10 text-warn border-warn/30',
                )}
              >
                <AlertTriangle className="w-3 h-3" />
                {pillLabel}
              </span>
            )}

            <button
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-transparent border border-transparent text-text-secondary/40 hover:bg-red/10 hover:border-red/30 hover:text-red transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(true);
              }}
              title="Delete this session"
              type="button"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <ChevronDown
              className={cn(
                'w-4 h-4 shrink-0 text-text-secondary/40 transition-transform duration-200',
                expanded && 'rotate-180 text-primary',
              )}
            />
          </div>
        )}

        {/* Card info grid */}
        <div
          className="grid grid-cols-2 gap-0 px-3 pb-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="py-2 pr-4">
            <div className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-text-secondary/40 mb-1.5">
              <MapPin className="w-3 h-3" />
              Location
            </div>
            <div className="font-sans text-[13px] font-semibold text-text-primary mb-0.5">
              <span className="mr-1">{flag}</span>
              {city}, {country}
            </div>
            <div className="text-[11px] text-text-secondary/60 leading-relaxed">
              {isp} ·{' '}
              <span className="font-mono text-[10px] text-text-secondary/40">
                {entry.public_ip || '—'}
              </span>
            </div>
          </div>

          <div className="py-2 pl-4 border-l border-border">
            <div className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-text-secondary/40 mb-1.5">
              <Monitor className="w-3 h-3" />
              Device
            </div>
            <div className="font-sans text-[13px] font-semibold text-text-primary mb-0.5">
              {config.platform || '—'} · {browser}
            </div>
            <div className="text-[11px] text-text-secondary/60 leading-relaxed">
              {config.hardwareConcurrency ? `${config.hardwareConcurrency} cores` : '—'}
              {config.deviceMemory ? ` · ${config.deviceMemory} GB` : ''}
              {config.webglRenderer ? ` · ${config.webglRenderer}` : ''}
            </div>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && !confirming && (
          <div className="border-t border-border px-3 py-3 bg-muted/5">
            {/* Tabs */}
            <div className="flex gap-1.5 mb-2.5">
              <button
                className={cn(
                  'text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors',
                  activeTab === 'attr'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-muted/20 border-border-strong text-text-secondary/60 hover:text-text-secondary/80',
                )}
                onClick={() => setActiveTab('attr')}
              >
                Attributes
              </button>
              <button
                className={cn(
                  'text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5',
                  activeTab === 'issues'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-muted/20 border-border-strong text-text-secondary/60 hover:text-text-secondary/80',
                )}
                onClick={() => setActiveTab('issues')}
              >
                Issues
                <span
                  className={cn(
                    'font-mono text-[9px] font-bold px-1.5 py-px rounded-full',
                    changed === 0 ? 'bg-muted/20 text-text-secondary/40' : 'bg-red/10 text-red',
                  )}
                >
                  {changed}
                </span>
              </button>
            </div>

            {/* Attr tab */}
            {activeTab === 'attr' && (
              <div className="space-y-3">
                {attrGroups.map((group) => (
                  <div key={group.title}>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-text-secondary/40 mb-1.5">
                      {group.title}
                    </div>
                    <table className="w-full border-collapse">
                      <tbody>
                        {group.fields.map(([key, label]) => (
                          <tr key={key} className="border-b border-border/40 last:border-b-0">
                            <td className="text-[11px] text-text-secondary/50 whitespace-nowrap px-2 py-1.5 align-top w-[150px]">
                              {label}
                            </td>
                            <td className="text-[11px] font-mono text-text-secondary/80 px-2 py-1.5 align-top break-all">
                              {getAttrValue(key)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* Issues tab — 3-column comparison table */}
            {activeTab === 'issues' && (
              <div className="space-y-3">
                {!prevEntry ? (
                  <div className="text-xs text-text-secondary/50 italic text-center py-6">
                    This is the earliest recorded session — no previous session to compare against.
                  </div>
                ) : (
                  <table className="w-full border-collapse border border-border-strong rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="text-left font-mono text-[9.5px] uppercase tracking-wider text-text-secondary/50 px-2.5 py-2 border-b border-border-strong">
                          Field
                        </th>
                        <th className="text-left font-mono text-[9.5px] uppercase tracking-wider text-text-secondary/70 px-2.5 py-2 border-b border-border-strong">
                          {shortLabel(entry)}
                        </th>
                        <th className="text-left font-mono text-[9.5px] uppercase tracking-wider text-text-secondary/70 px-2.5 py-2 border-b border-border-strong">
                          {shortLabel(prevEntry)}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cmpFields.map(([key, label]) => {
                        const val = getFieldValue(entry, key);
                        const baseVal = getFieldValue(prevEntry, key);
                        const diff = val !== baseVal;
                        return (
                          <tr
                            key={key}
                            className={cn(
                              'border-b border-border/40 last:border-b-0',
                              diff && 'bg-warn/5',
                            )}
                          >
                            <td className="px-2.5 py-1.5 text-[11px] text-text-secondary/50 whitespace-nowrap w-[150px]">
                              {diff && <span className="text-warn text-[9px] mr-1">●</span>}
                              {label}
                            </td>
                            <td
                              className={cn(
                                'px-2.5 py-1.5 text-[11px] font-mono break-all',
                                diff ? 'text-warn font-semibold' : 'text-text-secondary/70',
                              )}
                            >
                              {val}
                            </td>
                            <td className="px-2.5 py-1.5 text-[11px] font-mono text-text-secondary/70 break-all">
                              {baseVal}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────
export default function FootprintDetail({ entries, onDeleteSession }: FootprintDetailProps) {
  return (
    <div className="flex flex-col min-h-0">
      {/* ── Timeline ── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-3">
        {entries.length === 0 ? (
          <div className="text-xs text-text-secondary/50 italic text-center py-6">No sessions.</div>
        ) : (
          entries.map((entry, i) => (
            <SessionCard
              key={`${entry.started_at}-${i}`}
              entry={entry}
              prevEntry={i < entries.length - 1 ? entries[i + 1] : null}
              onDelete={onDeleteSession}
            />
          ))
        )}
      </div>
    </div>
  );
}
