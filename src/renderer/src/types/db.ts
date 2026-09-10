export interface Proxy {
  id: string;
  host: string;
  port: number;
  protocol: string;
  proxyType?: string;
  sourceType?: string;
  country?: string;
  city?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

export interface Service {
  id: string;
  name: string;
  url?: string;
  tags?: string;
  category?: string;
  description?: string;
  config_json?: string;
  metadata?: string;
  auth_method?: string;
  two_fa?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Email {
  id: string;
  email: string;
  password: string;
  phone_number?: string;
  recovery_email?: string;
  totp?: string;
  backup_codes?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Session {
  id: string;
  [key: string]: any;
}

export interface Device {
  id: string;
  [key: string]: any;
}