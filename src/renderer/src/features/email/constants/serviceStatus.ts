/**
 * ------------------------------------------------------------------
 * Service Status Constants
 * ------------------------------------------------------------------
 * Shared definitions for the per-service health state stored in
 * `service_emails.status`. Used by both the card badge (ServiceList)
 * and the form selector (ServiceEmailForm).
 * ------------------------------------------------------------------
 */

export type ServiceHealthStatus =
  | 'active'
  | 'checkpoint'
  | 'banned'
  | 'suspended'
  | 'inactive';

export interface ServiceStatusMeta {
  value: ServiceHealthStatus;
  label: string;
  /** Tailwind classes for the badge background + text color. */
  badgeClass: string;
  /** Short tooltip describing what the status means. */
  description: string;
}

export const SERVICE_STATUS_LIST: ServiceStatusMeta[] = [
  {
    value: 'active',
    label: 'Active',
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    description: 'Normal, usable account',
  },
  {
    value: 'checkpoint',
    label: 'Checkpoint',
    badgeClass: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    description: 'Requires re-verification / identity check',
  },
  {
    value: 'banned',
    label: 'Banned',
    badgeClass: 'bg-red-600/15 text-red-500 border-red-600/30',
    description: 'Permanently locked or banned',
  },
  {
    value: 'suspended',
    label: 'Suspended',
    badgeClass: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    description: 'Temporarily locked with an expiry',
  },
  {
    value: 'inactive',
    label: 'Inactive',
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    description: 'Manually disabled, not currently used',
  },
];

const STATUS_MAP: Record<string, ServiceStatusMeta> = Object.fromEntries(
  SERVICE_STATUS_LIST.map((s) => [s.value, s]),
);

export function getServiceStatusMeta(value?: string | null): ServiceStatusMeta {
  return STATUS_MAP[value || 'active'] || STATUS_MAP['active'];
}