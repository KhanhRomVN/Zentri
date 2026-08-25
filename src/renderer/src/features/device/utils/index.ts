export function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—';
  const gb = bytes / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)} GB`;
}

export function formatUptime(lastSeenAt?: string | null): string {
  if (!lastSeenAt) return '—';
  const date = new Date(lastSeenAt);
  return date.toLocaleString();
}

export function getFleetKey(device: { type: string; isVirtual: number }): string {
  return `${device.type}-${device.isVirtual ? 'virtual' : 'physical'}`;
}