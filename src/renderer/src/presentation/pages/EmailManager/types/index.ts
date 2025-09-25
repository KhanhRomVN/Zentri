// src/renderer/src/presentation/pages/EmailManager/types/index.ts

export interface Email {
  id: string
  email_address: string
  email_provider: 'gmail' | 'yahoo' | 'outlook' | 'icloud'
  name?: string
  age?: number
  address?: string
  pasword: string
  last_password_change: string
  recovery_email?: string
  phone_numbers?: string
  tags?: string[]
  note?: string
  metadata?: Record<string, any>
}

export interface Email2FA {
  id: string
  email_id: string
  method_type:
    | 'backup_codes'
    | 'totp_key'
    | 'app_password'
    | 'security_key'
    | 'recovery_email'
    | 'sms'
  app?: string
  value: string | string[]
  last_update: string
  expire_at?: string
  metadata?: Record<string, any>
}

export interface ServiceAccount {
  id: string
  email_id: string
  service_name: string
  service_type:
    | 'social_media'
    | 'communication'
    | 'developer'
    | 'cloud_storage'
    | 'ai_saas'
    | 'productivity_tool'
    | 'payment_finance'
    | 'ecommerce'
    | 'entertainment'
    | 'education'
    | 'hosting_domain'
    | 'security_vpn'
    | 'government'
    | 'health'
    | 'gaming'
    | 'travel_transport'
    | 'news_media'
    | 'forum_community'
    | 'iot_smart_device'
    | 'other'
  service_url?: string
  status?: 'active' | 'inactive' | 'suspended'
  name?: string
  username?: string
  password?: string
  note?: string
  metadata?: Record<string, any>
}

export interface ServiceAccount2FA {
  id: string
  service_account_id: string
  method_type:
    | 'backup_codes'
    | 'totp_key'
    | 'app_password'
    | 'security_key'
    | 'recovery_email'
    | 'sms'
  app?: string
  value: string | string[]
  last_update: string
  expire_at?: string
  metadata?: Record<string, any>
}

export interface ServiceAccountSecret {
  id: string
  service_account_id: string
  secret: {
    secret_name: string
    [key: string]: any
  }
  expire_at?: string
}

// Database service types
export interface DatabaseInfo {
  path: string
  name: string
  lastAccess: string
}

export interface EmailManagerState {
  currentDatabase: DatabaseInfo | null
  isLoading: boolean
  error: string | null
}
