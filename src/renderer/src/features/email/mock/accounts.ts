export interface ServiceItem {
  id: string;
  accountId: string;
  name: string;
  username: string;
  password?: string;
  websiteUrl: string;
  icon?: string;
  connectedDate?: string;
}

export interface ActivityItem {
  id: string;
  accountId: string;
  action: 'login' | 'security_change' | 'data_export' | 'device_linked';
  device: string;
  location: string;
  timestamp: string;
  status: 'success' | 'warning' | 'failed';
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly: boolean;
  secure: boolean;
}

export interface ProfileMetadata {
  accountId: string;
  cookieCount: number;
  lastSync: string;
  status: 'active' | 'expired' | 'none';
  cookies?: Cookie[];
}

export interface Account {
  id: string;
  email: string;
  password?: string;
  name: string;
  avatar: string;
  provider: 'gmail' | 'hotmail' | 'protonmail' | 'icloud' | 'yahoo';
  recoveryEmail: string;
  phone: string;
  twoFactorEnabled: boolean;
  status: 'active' | 'warning' | 'error';
}

export const mockAccounts: Account[] = [
  {
    id: '1',
    email: 'khanh.dev@gmail.com',
    name: 'Khanh Nguyen',
    avatar: 'KN',
    provider: 'gmail',
    recoveryEmail: 'recovery@proton.me',
    phone: '+84 909 *** 123',
    twoFactorEnabled: true,
    status: 'active',
  },
  {
    id: '2',
    email: 'khanh.work@microsoft.com',
    name: 'Khanh Work',
    avatar: 'KW',
    provider: 'hotmail',
    recoveryEmail: 'khanh.dev@gmail.com',
    phone: '+84 912 *** 456',
    twoFactorEnabled: true,
    status: 'active',
  },
  {
    id: '3',
    email: 'secure.khanh@proton.me',
    name: 'Khanh Secure',
    avatar: 'KS',
    provider: 'protonmail',
    recoveryEmail: 'N/A',
    phone: 'N/A',
    twoFactorEnabled: true,
    status: 'active',
  },
];
