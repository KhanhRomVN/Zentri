/**
 * ------------------------------------------------------------------
 * FORGE Format Utils
 * ------------------------------------------------------------------
 * Helpers format dữ liệu cho UI.
 * ------------------------------------------------------------------
 */

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const timeAgo = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s trước`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}p trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h trước`;
  return `${Math.floor(seconds / 86400)}ng trước`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('vi-VN');
};