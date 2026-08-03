/**
 * TypeScript types cho các bảng trong database Zentri.
 *
 * Được generate từ DB_SCHEMA.md.
 * Cập nhật: 2026-06-21
 */

// ==================== emails ====================
export interface Email {
  id: string;
  email: string;
  password?: string | null;
  status: 'active' | 'banned' | 'deleting';
  phone_number?: string | null;
  recovery_email?: string | null;
  totp_secret_key?: string | null;
  backup_codes?: string | null;
  profile_folder_id?: string | null;
  scheduled_deletion_at?: string | null;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== proxies ====================
export interface Proxy {
  id: string;
  protocol?: 'http' | 'socks5' | null;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  ip_version?: 4 | 6 | null;
  proxy_type?: 'private' | 'shared' | null;
  source_type?: 'datacenter' | 'residential' | 'mobile' | null;
  rotation_type?: 'static' | 'rotating' | null;
  pricing_type?: 'time' | 'bandwidth' | null;
  country?: string | null;
  city?: string | null;
  isp?: string | null;
  expired_at?: string | null;
  last_checked_at?: string | null;
  purchase_url?: string | null;
  status: 'active' | 'expired' | 'disabled' | 'error';
  created_at: string;
  updated_at: string;
}

// ==================== proxy_history ====================
export interface ProxyHistory {
  id: string;
  proxy_id: string;
  email_id: string;
  target_site?: string | null;
  used_at: string;
}

// ==================== services ====================
export interface ServiceField {
  name: string;
  type: 'string' | 'array' | 'json' | 'number';
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  url?: string | null;
  category?: string | null;
  tags?: string[] | null;
  metadata?: {
    fields?: ServiceField[];
    [key: string]: unknown;
  } | null;
  auth_method?: string[] | null;
  two_fa?: {
    has_totp: boolean;
    has_backup_codes: boolean;
  } | null;
  layout_config?: {
    gridCols?: number;
    fields?: Array<{
      field_name: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  } | null;
  created_at?: string;
  updated_at?: string;
}

// ==================== service_emails ====================
export interface ServiceEmail {
  id: string;
  email_id: string;
  service_id: string;
}

// ==================== fingerprints ====================
export interface Fingerprint {
  id: string;
  name?: string | null;
  description?: string | null;
  config_json?: string | null;
}

// ==================== sessions ====================
export interface Session {
  id: string;
  email_id?: string | null;
  proxy_id?: string | null;
  user_agent?: string | null;
  started_at: string;
  ended_at?: string | null;
  created_at: string;
}

// ==================== agents ====================
export interface Agent {
  id: string;
  name: string;
  config_json?: string | null;
  created_at: string;
  updated_at: string;
}