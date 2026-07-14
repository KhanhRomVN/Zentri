/**
 * Proxy table helper functions
 */

import { Proxy } from '../../../types/db';
import { STATUS_STYLES, PROTOCOL_COLORS } from '../constants';

export const getDerivedStatus = (proxy: Proxy): string => {
  if (proxy.status === 'trash' || proxy.status === 'disabled') return proxy.status;
  if (proxy.expiredAt) {
    const expiry = new Date(proxy.expiredAt).getTime();
    if (expiry <= Date.now()) return 'expired';
  }
  return proxy.status;
};

export const getStatusStyle = (status: string): string => {
  return STATUS_STYLES[status] || 'bg-muted/10 border-border/50 text-muted-foreground';
};

export const getProtocolColor = (protocol?: string | null): string => {
  if (!protocol) return 'text-muted-foreground';
  return PROTOCOL_COLORS[protocol.toLowerCase()] || 'text-muted-foreground';
};

export const formatQuota = (proxy: Proxy): string => {
  if (proxy.pricingType === 'time') {
    if (!proxy.expiredAt) return `${proxy.durationDays || 0} days`;
    const expiry = new Date(proxy.expiredAt).getTime();
    const diff = expiry - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    return `${minutes} phút`;
  }
  return `${proxy.bandwidthGb || 0} GB`;
};

export const getFieldValue = (row: any, field: string): any => {
  if (field === '_stt') return row._stt;
  if (field === 'location') {
    const parts = [];
    if (row.country) parts.push(row.country);
    if (row.city) parts.push(row.city);
    return parts.join(' / ') || '—';
  }
  if (field === 'quota') return formatQuota(row);
  if (field === 'host') return row.host || '—';
  if (field === 'port') return row.port || '—';
  if (field === 'protocol') return row.protocol || '—';
  if (field === 'status') return getDerivedStatus(row);
  return row[field] ?? '—';
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Active',
    expired: 'Expired',
    disabled: 'Disabled',
    trash: 'Trash',
    error: 'Error',
  };
  return labels[status] || status;
};