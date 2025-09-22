// src/renderer/src/presentation/pages/EmailManager/constants/index.ts

export const EMAIL_PROVIDERS = {
  GMAIL: 'gmail',
  YAHOO: 'yahoo',
  OUTLOOK: 'outlook',
  ICLOUD: 'icloud'
} as const

export const EMAIL_CATEGORIES = {
  WORK: 'work',
  PERSONAL: 'personal',
  BUSINESS: 'business',
  EDUCATION: 'education',
  OTHER: 'other'
} as const

export const SERVICE_TYPES = {
  SOCIAL_MEDIA: 'social_media',
  COMMUNICATION: 'communication',
  DEVELOPER: 'developer',
  CLOUD_STORAGE: 'cloud_storage',
  AI_SAAS: 'ai_saas',
  PRODUCTIVITY_TOOL: 'productivity_tool',
  PAYMENT_FINANCE: 'payment_finance',
  ECOMMERCE: 'ecommerce',
  ENTERTAINMENT: 'entertainment',
  EDUCATION: 'education',
  HOSTING_DOMAIN: 'hosting_domain',
  SECURITY_VPN: 'security_vpn',
  GOVERNMENT: 'government',
  HEALTH: 'health',
  GAMING: 'gaming',
  TRAVEL_TRANSPORT: 'travel_transport',
  NEWS_MEDIA: 'news_media',
  FORUM_COMMUNITY: 'forum_community',
  IOT_SMART_DEVICE: 'iot_smart_device',
  OTHER: 'other'
} as const

export const SERVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} as const

export const TWO_FA_METHODS = {
  BACKUP_CODES: 'backup_codes',
  TOTP_KEY: 'totp_key',
  APP_PASSWORD: 'app_password',
  SECURITY_KEY: 'security_key',
  RECOVERY_EMAIL: 'recovery_email',
  SMS: 'sms'
} as const

export const SECRET_TYPES = {
  API_KEY: 'api_key',
  COOKIE: 'cookie',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  PRIVATE_KEY: 'private_key',
  CLIENT_SECRET: 'client_secret',
  SESSION_ID: 'session_id',
  CSRF_TOKEN: 'csrf_token',
  ENCRYPTION_KEY: 'encryption_key',
  OTHER: 'other'
} as const

export const SERVICE_TYPE_LABELS = {
  [SERVICE_TYPES.SOCIAL_MEDIA]: 'Social Media',
  [SERVICE_TYPES.COMMUNICATION]: 'Communication',
  [SERVICE_TYPES.DEVELOPER]: 'Developer',
  [SERVICE_TYPES.CLOUD_STORAGE]: 'Cloud Storage',
  [SERVICE_TYPES.AI_SAAS]: 'AI & SaaS',
  [SERVICE_TYPES.PRODUCTIVITY_TOOL]: 'Productivity',
  [SERVICE_TYPES.PAYMENT_FINANCE]: 'Payment & Finance',
  [SERVICE_TYPES.ECOMMERCE]: 'E-commerce',
  [SERVICE_TYPES.ENTERTAINMENT]: 'Entertainment',
  [SERVICE_TYPES.EDUCATION]: 'Education',
  [SERVICE_TYPES.HOSTING_DOMAIN]: 'Hosting & Domain',
  [SERVICE_TYPES.SECURITY_VPN]: 'Security & VPN',
  [SERVICE_TYPES.GOVERNMENT]: 'Government',
  [SERVICE_TYPES.HEALTH]: 'Health',
  [SERVICE_TYPES.GAMING]: 'Gaming',
  [SERVICE_TYPES.TRAVEL_TRANSPORT]: 'Travel & Transport',
  [SERVICE_TYPES.NEWS_MEDIA]: 'News & Media',
  [SERVICE_TYPES.FORUM_COMMUNITY]: 'Forum & Community',
  [SERVICE_TYPES.IOT_SMART_DEVICE]: 'IoT & Smart Device',
  [SERVICE_TYPES.OTHER]: 'Other'
} as const

export const SECRET_TYPE_LABELS = {
  [SECRET_TYPES.API_KEY]: 'API Key',
  [SECRET_TYPES.COOKIE]: 'Cookie',
  [SECRET_TYPES.ACCESS_TOKEN]: 'Access Token',
  [SECRET_TYPES.REFRESH_TOKEN]: 'Refresh Token',
  [SECRET_TYPES.PRIVATE_KEY]: 'Private Key',
  [SECRET_TYPES.CLIENT_SECRET]: 'Client Secret',
  [SECRET_TYPES.SESSION_ID]: 'Session ID',
  [SECRET_TYPES.CSRF_TOKEN]: 'CSRF Token',
  [SECRET_TYPES.ENCRYPTION_KEY]: 'Encryption Key',
  [SECRET_TYPES.OTHER]: 'Other'
} as const

export const TWO_FA_METHOD_LABELS = {
  [TWO_FA_METHODS.BACKUP_CODES]: 'Backup Codes',
  [TWO_FA_METHODS.TOTP_KEY]: 'TOTP Key',
  [TWO_FA_METHODS.APP_PASSWORD]: 'App Password',
  [TWO_FA_METHODS.SECURITY_KEY]: 'Security Key',
  [TWO_FA_METHODS.RECOVERY_EMAIL]: 'Recovery Email',
  [TWO_FA_METHODS.SMS]: 'SMS'
} as const

export const EMAIL_PROVIDER_ICONS = {
  [EMAIL_PROVIDERS.GMAIL]: '/src/renderer/src/assets/icon/gmail_icon.png',
  [EMAIL_PROVIDERS.YAHOO]: '/src/renderer/src/assets/icon/yahoo_icon.png',
  [EMAIL_PROVIDERS.OUTLOOK]: '/src/renderer/src/assets/icon/outlook_icon.png',
  [EMAIL_PROVIDERS.ICLOUD]: '/src/renderer/src/assets/icon/icloud_icon.png'
} as const

export const DATABASE_CONFIG = {
  FILE_EXTENSIONS: ['db', 'sqlite'],
  DEFAULT_NAME: 'email_manager.db',
  SUPPORTED_FORMATS: [
    { name: 'Database Files', extensions: ['db', 'sqlite'] },
    { name: 'All Files', extensions: ['*'] }
  ]
} as const
