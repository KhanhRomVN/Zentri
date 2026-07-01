/**
 * Search-related helper functions
 * Used across multiple components (DataTable, FilterBar, ColumnBuilder)
 */

// ─── Color Helpers ──────────────────────────────────────────────────────────
let accentColorsCache: string[] = ['rgb(54, 134, 255)'];
let unifiedAccentCache = 'rgb(54, 134, 255)';

export const setAccentColorsCache = (colors: string[], unified: string) => {
  accentColorsCache = colors.length > 0 ? colors : [unified];
  unifiedAccentCache = unified;
};

export const getViewColor = (viewId: string) => {
  let hash = 0;
  for (let i = 0; i < viewId.length; i++) {
    hash = viewId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % accentColorsCache.length;
  const color = accentColorsCache[index] || accentColorsCache[0] || unifiedAccentCache;
  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    const r = rgbMatch[0],
      g = rgbMatch[1],
      b = rgbMatch[2];
    return {
      base: color,
      bg: `rgba(${r}, ${g}, ${b}, 0.08)`,
      border: `rgba(${r}, ${g}, ${b}, 0.2)`,
    };
  }
  return { base: color, bg: 'var(--sidebar-item-hover)', border: 'var(--divider)' };
};

let badgeAccentCache: string[] = ['rgb(54, 134, 255)'];

export const setBadgeAccentCache = (colors: string[], unified: string) => {
  badgeAccentCache = colors.length > 0 ? colors : [unified];
};

export const getBadgeColor = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % badgeAccentCache.length;
  const color = badgeAccentCache[index] || badgeAccentCache[0] || 'rgb(54, 134, 255)';
  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    const r = rgbMatch[0],
      g = rgbMatch[1],
      b = rgbMatch[2];
    return {
      base: color,
      bg: `rgba(${r}, ${g}, ${b}, 0.15)`,
      border: `rgba(${r}, ${g}, ${b}, 0.3)`,
    };
  }
  return { base: color, bg: 'rgba(54,134,255,0.15)', border: 'rgba(54,134,255,0.3)' };
};

// ─── Data Helpers ──────────────────────────────────────────────────────────
/**
 * Resolve field value from a row object
 * Supports nested fields: email, services.*, proxy.*
 */
export const getFieldValue = (row: any, field: string): string => {
  if (!field || field === '_stt') return '';

  // Direct email fields
  const emailFields = [
    'email',
    'password',
    'recoveryEmail',
    'phoneNumber',
    'status',
    'createdAt',
    'lastUsedAt',
    'totpSecretKey',
  ];
  if (emailFields.includes(field)) {
    const val = row[field];
    if (val === null || val === undefined) return '—';
    if (field === 'createdAt' || field === 'lastUsedAt') {
      try {
        return new Date(val).toLocaleDateString();
      } catch {
        return String(val);
      }
    }
    return String(val);
  }

  // Service fields (from linked services)
  if (field.startsWith('services.')) {
    const serviceField = field.replace('services.', '');
    const services = row._services || [];
    if (services.length === 0) return '—';
    const firstService = services[0];
    const val = firstService[serviceField];
    if (val === null || val === undefined) return '—';
    return String(val);
  }

  // Proxy fields
  if (field.startsWith('proxy.')) {
    const proxyField = field.replace('proxy.', '');
    const proxy = row._proxy;
    if (!proxy) return '—';
    const val = proxy[proxyField];
    if (val === null || val === undefined) return '—';
    return String(val);
  }

  return '—';
};

/**
 * Get the icon name for a field
 */
export const getFieldIcon = (field: string): string => {
  const iconMap: Record<string, string> = {
    email: 'Mail',
    password: 'Key',
    recoveryEmail: 'Mail',
    phoneNumber: 'Phone',
    status: 'Shield',
    createdAt: 'Calendar',
    lastUsedAt: 'Clock',
    totpSecretKey: 'Key',
    'services.name': 'Tag',
    'services.url': 'Link',
    'services.username': 'Mail',
    'services.status': 'Shield',
    'proxy.host': 'Globe',
    'proxy.port': 'Hash',
    'proxy.protocol': 'Globe',
    'proxy.country': 'MapPin',
    'proxy.city': 'MapPin',
  };
  return iconMap[field] || 'Hash';
};

/**
 * Get the table color class for a field
 */
export const getTableColor = (table: string): string => {
  const colorMap: Record<string, string> = {
    emails: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    services: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    proxies: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return colorMap[table] || colorMap.emails;
};

/**
 * Get column type label
 */
export const getTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    text: 'STRING',
    number: 'NUMBER',
    date: 'DATE',
    status: 'STATUS',
    link: 'STRING',
    email: 'STRING',
    tags: 'STRING',
  };
  return labelMap[type] || 'STRING';
};