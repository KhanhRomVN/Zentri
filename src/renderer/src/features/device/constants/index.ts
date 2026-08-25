import { LayoutGrid, Smartphone, Monitor, Tablet, Cpu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const FLEET_OPTIONS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'all', label: 'All devices', icon: LayoutGrid },
  { id: 'mobile-physical', label: 'Mobile - Physical', icon: Smartphone },
  { id: 'mobile-virtual', label: 'Mobile - Virtual', icon: Tablet },
  { id: 'desktop-virtual', label: 'Desktop - Virtual', icon: Cpu },
  { id: 'desktop-physical', label: 'Desktop - Physical', icon: Monitor },
];

export const STATUS_CONFIG: Record<
  string,
  { label: string; dotClass: string; textClass: string }
> = {
  online: { label: 'Online', dotClass: 'bg-green', textClass: 'text-green' },
  busy: { label: 'Busy', dotClass: 'bg-yellow', textClass: 'text-yellow' },
  offline: { label: 'Offline', dotClass: 'bg-text-secondary', textClass: 'text-text-secondary' },
  error: { label: 'Error', dotClass: 'bg-red', textClass: 'text-red' },
};

export const PLATFORM_OPTIONS = [
  'Windows 10',
  'Windows 11',
  'Android',
  'iOS',
  'Samsung',
  'OPPO',
  'Vivo',
  'Xiaomi',
] as const;

export const DEVICE_COLUMNS = [
  { id: 'checkbox', label: '', width: 38, fixed: true },
  { id: 'name', label: 'Name', width: 200, sortable: true },
  { id: 'type', label: 'Type', width: 140, sortable: true },
  { id: 'platform', label: 'Platform', width: 140, sortable: true },
  { id: 'status', label: 'Status', width: 120, sortable: false },
  { id: 'ip', label: 'IP Address', width: 150, sortable: true },
  { id: 'battery', label: 'Battery', width: 100, sortable: true },
  { id: 'storage', label: 'Storage', width: 130, sortable: false },
  { id: 'ram', label: 'RAM', width: 110, sortable: false },
  { id: 'cpu', label: 'CPU', width: 90, sortable: true },
  { id: 'lastSeen', label: 'Last Seen', width: 120, sortable: true },
  { id: 'actions', label: '', width: 44, fixed: true },
] as const;