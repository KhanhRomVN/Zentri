/**
 * Constants index - re-export all constants from sub-modules
 * This file exists for backward compatibility and central import
 */

// Re-export operators from operators.ts
export * from './operators';

// Search-related constants
export const TYPE_LABELS: Record<string, string> = {
  text: 'STRING',
  number: 'NUMBER',
  date: 'DATE',
  status: 'STATUS',
  link: 'STRING',
  email: 'STRING',
  tags: 'STRING',
};

// Available data fields from the database schema
export const DATA_FIELDS = [
  { key: 'email', label: 'Email', type: 'text', table: 'emails', description: 'Email address' },
  { key: 'password', label: 'Password', type: 'text', table: 'emails', description: 'Account password' },
  { key: 'recoveryEmail', label: 'Recovery Email', type: 'text', table: 'emails', description: 'Backup recovery email' },
  { key: 'phoneNumber', label: 'Phone Number', type: 'text', table: 'emails', description: 'Linked phone number' },
  { key: 'status', label: 'Status', type: 'status', table: 'emails', description: 'Account status' },
  { key: 'createdAt', label: 'Created At', type: 'date', table: 'emails', description: 'Account creation date' },
  { key: 'lastUsedAt', label: 'Last Used', type: 'date', table: 'emails', description: 'Last usage timestamp' },
  { key: 'totpSecretKey', label: 'TOTP Key', type: 'text', table: 'emails', description: '2FA secret key status' },
  { key: 'services.name', label: 'Service Name', type: 'text', table: 'services', description: 'Linked service name' },
  { key: 'services.url', label: 'Service URL', type: 'text', table: 'services', description: 'Service website URL' },
  { key: 'services.username', label: 'Service Username', type: 'text', table: 'services', description: 'Login username' },
  { key: 'services.status', label: 'Service Status', type: 'status', table: 'services', description: 'Link status' },
  { key: 'proxy.host', label: 'Proxy Host', type: 'text', table: 'proxies', description: 'Proxy server address' },
  { key: 'proxy.port', label: 'Proxy Port', type: 'number', table: 'proxies', description: 'Proxy port number' },
  { key: 'proxy.protocol', label: 'Proxy Protocol', type: 'text', table: 'proxies', description: 'HTTP/HTTPS/SOCKS5' },
  { key: 'proxy.country', label: 'Proxy Country', type: 'text', table: 'proxies', description: 'Geo location' },
  { key: 'proxy.city', label: 'Proxy City', type: 'text', table: 'proxies', description: 'City level location' },
] as const;

export const FIELD_ICONS: Record<string, any> = {
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
} as const;

export const TABLE_COLORS: Record<string, string> = {
  emails: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  services: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  proxies: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
} as const;

// Icon map for SmartView icons
export const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Mail: () => null,
  Users: () => null,
  Database: () => null,
  Star: () => null,
  Heart: () => null,
  Zap: () => null,
  Shield: () => null,
  Globe: () => null,
  Key: () => null,
  Lock: () => null,
  Bell: () => null,
  Calendar: () => null,
  Clock: () => null,
  Tag: () => null,
  Award: () => null,
  Bookmark: () => null,
  Camera: () => null,
  Cloud: () => null,
  Code: () => null,
  Eye: () => null,
  Flag: () => null,
  Gift: () => null,
  Hash: () => null,
  Home: () => null,
  Image: () => null,
  Link: () => null,
  Map: () => null,
  Moon: () => null,
  Music: () => null,
  Package: () => null,
  Phone: () => null,
  Power: () => null,
  Settings: () => null,
  Sun: () => null,
  Table: () => null,
  Target: () => null,
  Truck: () => null,
  User: () => null,
  Video: () => null,
  Wifi: () => null,
  Wind: () => null,
  Layers: () => null,
  Command: () => null,
  Crown: () => null,
  Feather: () => null,
  TrendingUp: () => null,
  Umbrella: () => null,
};

// Export operators types for convenience
export type { Operator, FilterCondition } from './operators';