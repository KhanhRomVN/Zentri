/**
 * Proxy feature constants
 */

import { Proxy } from '../../../types/db';

export const PROXY_COLUMNS = [
  { id: 'stt', label: '#', field: '_stt', isVisible: true, isSortable: false, isFilterable: false, size: 60, minSize: 50 },
  { id: 'host', label: 'Host / IP', field: 'host', isVisible: true, isSortable: true, isFilterable: true, size: 280, minSize: 150 },
  { id: 'port', label: 'Port', field: 'port', isVisible: true, isSortable: true, isFilterable: false, size: 80, minSize: 60 },
  { id: 'protocol', label: 'Protocol', field: 'protocol', isVisible: true, isSortable: true, isFilterable: true, size: 100, minSize: 80 },
  { id: 'location', label: 'Location', field: 'location', isVisible: true, isSortable: true, isFilterable: true, size: 200, minSize: 120 },
  { id: 'status', label: 'Status', field: 'status', isVisible: true, isSortable: true, isFilterable: true, size: 160, minSize: 120 },
  { id: 'quota', label: 'Quota', field: 'quota', isVisible: true, isSortable: true, isFilterable: false, size: 180, minSize: 120 },
  { id: 'isp', label: 'ISP', field: 'isp', isVisible: false, isSortable: true, isFilterable: true, size: 160, minSize: 100 },
  { id: 'proxyType', label: 'Type', field: 'proxyType', isVisible: false, isSortable: true, isFilterable: true, size: 100, minSize: 80 },
  { id: 'sourceType', label: 'Source', field: 'sourceType', isVisible: false, isSortable: true, isFilterable: true, size: 120, minSize: 90 },
  { id: 'username', label: 'Username', field: 'username', isVisible: false, isSortable: true, isFilterable: true, size: 140, minSize: 100 },
];

export const FILTER_OPTIONS = {
  proxyType: [
    { value: 'all', label: 'All' },
    { value: 'private', label: 'Exclusive' },
    { value: 'shared', label: 'Shared' },
  ],
  sourceType: [
    { value: 'all', label: 'Any Source' },
    { value: 'datacenter', label: 'Datacenter' },
    { value: 'residential', label: 'Residential' },
    { value: 'mobile', label: 'Carrier' },
  ],
  protocol: [
    { value: 'all', label: 'All Protocols' },
    { value: 'http', label: 'HTTP(S)' },
    { value: 'socks5', label: 'SOCKS5' },
  ],
  status: [
    { value: 'all', label: 'Any Status' },
    { value: 'active', label: 'Active Nodes' },
    { value: 'expired', label: 'Expired' },
    { value: 'disabled', label: 'Disabled' },
  ],
};

export const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10',
  expired: 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10',
  disabled: 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-500/10',
  trash: 'bg-slate-500/20 border-slate-500/50 text-slate-400 shadow-lg shadow-slate-500/10',
  error: 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-500/10',
};

export const PROTOCOL_COLORS: Record<string, string> = {
  socks5: 'text-amber-400',
  https: 'text-indigo-400',
  http: 'text-blue-400',
};