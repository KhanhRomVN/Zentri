import { Proxy } from '../../../types/db';

export const PROXY_COLUMNS = [
  { id: 'checkbox', label: '', width: 38, fixed: true },
  { id: 'status', label: 'Status', width: 118, sortable: false },
  { id: 'endpoint', label: 'Host / Port', width: 230, sortable: true },
  { id: 'badges', label: 'Protocol · Type', width: 158, sortable: false },
  { id: 'location', label: 'Location', width: 168, sortable: true },
  { id: 'isp', label: 'ISP', width: 150, sortable: true },
  { id: 'latency', label: 'Latency', width: 150, sortable: true },
  { id: 'success', label: 'Success Rate', width: 104, sortable: true },
  { id: 'quota', label: 'Quota', width: 150, sortable: false },
  { id: 'seen', label: 'Last Seen', width: 96, sortable: true },
  { id: 'actions', label: '', width: 44, fixed: true },
] as const;

export const DISPLAY_STATUS_CONFIG: Record<string, {
  label: string;
  dotClass: string;
  textClass: string;
}> = {
  healthy: { label: 'Healthy', dotClass: 'bg-green', textClass: 'text-green' },
  degraded: { label: 'Degraded', dotClass: 'bg-yellow', textClass: 'text-yellow' },
  dead: { label: 'Dead', dotClass: 'bg-red', textClass: 'text-red' },
  testing: { label: 'Testing', dotClass: 'bg-violet', textClass: 'text-violet' },
};

export const STATUS_ORDER: Record<string, number> = {
  healthy: 0,
  testing: 1,
  degraded: 2,
  dead: 3,
};

export const PROTOCOL_COLORS: Record<string, string> = {
  http: 'bg-blue/10 text-blue border-blue/20',
  socks5: 'bg-purple/10 text-purple border-purple/20',
};

export const TYPE_COLORS: Record<string, string> = {
  private: 'bg-teal/10 text-teal border-teal/20',
  shared: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20',
};

export const SOURCE_LABELS: Record<string, string> = {
  datacenter: 'Datacenter',
  residential: 'Residential',
  mobile: 'Mobile',
};

/**
 * Derive display status from DB fields.
 * active + is_healthy=1 → healthy
 * active + is_healthy=0 → degraded
 * expired → dead
 * disabled → dead
 * error → dead
 */
export function deriveDisplayStatus(p: Proxy): string {
  if (p.status === 'expired' || p.status === 'disabled' || p.status === 'error') return 'dead';
  if (p.status === 'active') {
    if (p.is_healthy === 1) return 'healthy';
    if (p.is_healthy === 0) return 'degraded';
    // Not yet checked
    return 'testing';
  }
  return 'dead';
}