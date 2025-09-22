// export interface Email {
//   id: string
//   email_address: string
//   email_provider: 'gmail' | 'yahoo' | 'outlook' | 'icloud'
//   name?: string
//   age?: number
//   address?: string
//   pasword: string
//   last_password_change: string
//   recovery_email?: string
//   phone_numbers?: string
//   category: string
//   tags?: string[]
//   note?: string
//   metadata?: Record<string, any>
// }

// export interface Email2FA {
//   id: string
//   email_id: string
//   method_type:
//     | 'backup_codes'
//     | 'totp_key'
//     | 'app_password'
//     | 'security_key'
//     | 'recovery_email'
//     | 'sms'
//   app?: string
//   value: string | string[]
//   last_update: string
//   expire_at?: string
//   metadata?: Record<string, any>
// }

// export interface ServiceAccount {
//   id: string
//   email_id: string
//   service_name: string
//   service_type:
//     | 'social_media'
//     | 'communication'
//     | 'developer'
//     | 'cloud_storage'
//     | 'ai_saas'
//     | 'productivity_tool'
//     | 'payment_finance'
//     | 'ecommerce'
//     | 'entertainment'
//     | 'education'
//     | 'hosting_domain'
//     | 'security_vpn'
//     | 'government'
//     | 'health'
//     | 'gaming'
//     | 'travel_transport'
//     | 'news_media'
//     | 'forum_community'
//     | 'iot_smart_device'
//     | 'other'
//   service_url?: string
//   status?: 'active' | 'inactive' | 'suspended'
//   name?: string
//   username?: string
//   password?: string
//   note?: string
//   metadata?: Record<string, any>
// }

// export interface ServiceAccount2FA {
//   id: string
//   service_account_id: string
//   method_type:
//     | 'backup_codes'
//     | 'totp_key'
//     | 'app_password'
//     | 'security_key'
//     | 'recovery_email'
//     | 'sms'
//   app?: string
//   value: string | string[]
//   last_update: string
//   expire_at?: string
//   metadata?: Record<string, any>
// }

// export interface ServiceAccountSecret {
//   id: string
//   service_account_id: string
//   secret_type:
//     | 'api_key'
//     | 'cookie'
//     | 'access_token'
//     | 'refresh_token'
//     | 'private_key'
//     | 'client_secret'
//     | 'session_id'
//     | 'csrf_token'
//     | 'encryption_key'
//     | 'other'
//   name?: string
//   value: string | string[]
//   last_update: string
//   expire_at?: string
//   metadata?: Record<string, any>
// }

// // Fake Email Data
// export const fakeEmails: Email[] = [
//   {
//     id: 'email_001',
//     email_address: 'john.doe.dev@gmail.com',
//     email_provider: 'gmail',
//     name: 'John Doe',
//     age: 28,
//     address: '123 Tech Street, San Francisco, CA 94105',
//     pasword: 'MySecure@Pass123',
//     last_password_change: '2024-08-15T10:30:00Z',
//     recovery_email: 'john.backup@yahoo.com',
//     phone_numbers: '+1-555-0123',
//     category: 'work',
//     tags: ['developer', 'primary', 'important'],
//     note: 'Main work email for development projects',
//     metadata: {
//       created_at: '2022-03-10T09:00:00Z',
//       last_login: '2024-09-20T14:22:00Z',
//       storage_used: '8.5GB'
//     }
//   }
// ]

// // Fake Email 2FA Data
// export const fakeEmail2FA: Email2FA[] = [
//   {
//     id: '2fa_email_001',
//     email_id: 'email_001',
//     method_type: 'totp_key',
//     app: 'Google Authenticator',
//     value: 'JBSWY3DPEHPK3PXP',
//     last_update: '2024-08-15T10:35:00Z',
//     metadata: {
//       device: 'iPhone 14 Pro'
//     }
//   },
//   {
//     id: '2fa_email_002',
//     email_id: 'email_001',
//     method_type: 'backup_codes',
//     value: ['12345678', '87654321', '11223344', '44332211', '56789012'],
//     last_update: '2024-08-15T10:35:00Z',
//     metadata: {
//       codes_used: 0,
//       total_codes: 5
//     }
//   }
// ]

// // Fake Service Accounts Data
// export const fakeServiceAccounts: ServiceAccount[] = [
//   {
//     id: 'service_001',
//     email_id: 'email_001',
//     service_name: 'GitHub',
//     service_type: 'developer',
//     service_url: 'https://github.com',
//     status: 'active',
//     name: 'John Doe',
//     username: 'johndoe_dev',
//     password: 'GitHub@Pass456',
//     note: 'Main development account for open source projects',
//     metadata: {
//       plan: 'Pro',
//       repositories: 45,
//       followers: 234
//     }
//   },
//   {
//     id: 'service_002',
//     email_id: 'email_001',
//     service_name: 'LinkedIn',
//     service_type: 'social_media',
//     service_url: 'https://linkedin.com',
//     status: 'active',
//     name: 'John Doe',
//     username: 'john-doe-developer',
//     password: 'LinkedIn@Pass789',
//     note: 'Professional networking profile',
//     metadata: {
//       connections: 512,
//       premium: true
//     }
//   },
//   {
//     id: 'service_003',
//     email_id: 'email_001',
//     service_name: 'AWS Console',
//     service_type: 'cloud_storage',
//     service_url: 'https://aws.amazon.com/console',
//     status: 'active',
//     name: 'John Doe',
//     username: 'john.doe.dev',
//     password: 'AWS@SecurePass321',
//     note: 'Cloud infrastructure management',
//     metadata: {
//       account_type: 'Individual',
//       region: 'us-west-2',
//       mfa_enabled: true
//     }
//   }
// ]

// // Fake Service Account 2FA Data
// export const fakeServiceAccount2FA: ServiceAccount2FA[] = [
//   {
//     id: '2fa_service_001',
//     service_account_id: 'service_001',
//     method_type: 'totp_key',
//     app: 'Authy',
//     value: 'KBSWY3DPEHPK3PXQ',
//     last_update: '2024-07-20T16:45:00Z',
//     metadata: {
//       device: 'iPhone 14 Pro'
//     }
//   },
//   {
//     id: '2fa_service_002',
//     service_account_id: 'service_003',
//     method_type: 'totp_key',
//     app: 'Google Authenticator',
//     value: 'LBSWY3DPEHPK3PXR',
//     last_update: '2024-08-01T11:20:00Z',
//     metadata: {
//       device: 'iPhone 14 Pro'
//     }
//   },
//   {
//     id: '2fa_service_003',
//     service_account_id: 'service_003',
//     method_type: 'backup_codes',
//     value: [
//       '98765432',
//       '23456789',
//       '34567890',
//       '45678901',
//       '56789012',
//       '67890123',
//       '78901234',
//       '89012345'
//     ],
//     last_update: '2024-08-01T11:25:00Z',
//     metadata: {
//       codes_used: 1,
//       total_codes: 8
//     }
//   }
// ]

// // Fake Service Account Secrets Data
// export const fakeServiceAccountSecrets: ServiceAccountSecret[] = [
//   {
//     id: 'secret_001',
//     service_account_id: 'service_001',
//     secret_type: 'api_key',
//     name: 'GitHub Personal Access Token',
//     value: 'ghp_1234567890abcdef1234567890abcdef12345678',
//     last_update: '2024-06-15T14:30:00Z',
//     expire_at: '2025-06-15T14:30:00Z',
//     metadata: {
//       permissions: ['repo', 'user', 'gist'],
//       scope: 'full_control'
//     }
//   },
//   {
//     id: 'secret_002',
//     service_account_id: 'service_003',
//     secret_type: 'access_token',
//     name: 'AWS Access Key',
//     value: 'AKIAIOSFODNN7EXAMPLE',
//     last_update: '2024-08-01T12:00:00Z',
//     metadata: {
//       region: 'us-west-2',
//       permissions: 'PowerUserAccess'
//     }
//   },
//   {
//     id: 'secret_003',
//     service_account_id: 'service_003',
//     secret_type: 'private_key',
//     name: 'AWS Secret Access Key',
//     value: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
//     last_update: '2024-08-01T12:00:00Z',
//     metadata: {
//       key_pair: 'secret_002',
//       region: 'us-west-2'
//     }
//   }
// ]

// // Export all fake data
// export const fakeData = {
//   emails: fakeEmails,
//   email2FA: fakeEmail2FA,
//   serviceAccounts: fakeServiceAccounts,
//   serviceAccount2FA: fakeServiceAccount2FA,
//   serviceAccountSecrets: fakeServiceAccountSecrets
// }
