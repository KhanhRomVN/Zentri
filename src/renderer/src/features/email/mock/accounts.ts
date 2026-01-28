import { LucideIcon } from 'lucide-react';

export interface Service {
  name: string;
  icon?: string;
  connectedDate?: string;
}

export interface RecentActivity {
  id: string;
  action: 'login' | 'security_change' | 'data_export' | 'device_linked';
  device: string;
  location: string;
  timestamp: string;
  status: 'success' | 'warning' | 'failed';
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface Account {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'gmail' | 'hotmail' | 'protonmail' | 'icloud' | 'yahoo';
  recoveryEmail: string;
  phone: string;
  services: Service[];
  twoFactorEnabled: boolean;
  status: 'active' | 'warning' | 'error';

  // Enhanced fields
  storage: {
    used: number; // in GB
    total: number; // in GB
    breakdown: {
      photos: number;
      documents: number;
      email: number;
      other: number;
    };
  };
  securityScore: number; // 0-100
  lastSync: string;
  recentActivity: RecentActivity[];
  connectedDevices: ConnectedDevice[];
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
    services: [
      { name: 'Google Drive', connectedDate: '2023-01-15' },
      { name: 'Youtube Premium', connectedDate: '2023-03-20' },
      { name: 'Google Photos', connectedDate: '2022-11-05' },
    ],
    twoFactorEnabled: true,
    status: 'active',
    storage: {
      used: 12.4,
      total: 15,
      breakdown: {
        email: 4.2,
        photos: 5.1,
        documents: 2.8,
        other: 0.3,
      },
    },
    securityScore: 92,
    lastSync: 'Just now',
    recentActivity: [
      {
        id: 'act_1',
        action: 'login',
        device: 'MacBook Pro M1',
        location: 'Ho Chi Minh City, VN',
        timestamp: '2 mins ago',
        status: 'success',
      },
      {
        id: 'act_2',
        action: 'security_change',
        device: 'iPhone 15 Pro',
        location: 'Ho Chi Minh City, VN',
        timestamp: '2 days ago',
        status: 'success',
      },
    ],
    connectedDevices: [
      {
        id: 'dev_1',
        name: 'MacBook Pro M1',
        type: 'desktop',
        os: 'macOS Sonoma',
        lastActive: 'Active now',
        isCurrent: true,
      },
      {
        id: 'dev_2',
        name: 'iPhone 15 Pro',
        type: 'mobile',
        os: 'iOS 17.4',
        lastActive: '1 hour ago',
        isCurrent: false,
      },
    ],
  },
  {
    id: '2',
    email: 'khanh.work@microsoft.com',
    name: 'Khanh Work',
    avatar: 'KW',
    provider: 'hotmail',
    recoveryEmail: 'khanh.dev@gmail.com',
    phone: '+84 912 *** 456',
    services: [
      { name: 'Office 365', connectedDate: '2023-06-10' },
      { name: 'Azure Portal', connectedDate: '2023-06-12' },
    ],
    twoFactorEnabled: true,
    status: 'active',
    storage: {
      used: 450, // GB
      total: 1024, // 1TB
      breakdown: {
        email: 120,
        photos: 10,
        documents: 310,
        other: 10,
      },
    },
    securityScore: 88,
    lastSync: '10 mins ago',
    recentActivity: [
      {
        id: 'act_3',
        action: 'data_export',
        device: 'Windows Workstation',
        location: 'Singapore, SG',
        timestamp: '5 hours ago',
        status: 'success',
      },
    ],
    connectedDevices: [
      {
        id: 'dev_3',
        name: 'Windows Workstation',
        type: 'desktop',
        os: 'Windows 11 Pro',
        lastActive: '5 hours ago',
        isCurrent: false,
      },
    ],
  },
  {
    id: '3',
    email: 'secure.khanh@proton.me',
    name: 'Khanh Secure',
    avatar: 'KS',
    provider: 'protonmail',
    recoveryEmail: 'N/A',
    phone: 'N/A',
    services: [
      { name: 'Proton VPN', connectedDate: '2024-01-01' },
      { name: 'Proton Drive', connectedDate: '2024-01-01' },
    ],
    twoFactorEnabled: true,
    status: 'active',
    storage: {
      used: 0.5,
      total: 5, // 5GB free
      breakdown: {
        email: 0.4,
        photos: 0,
        documents: 0.1,
        other: 0,
      },
    },
    securityScore: 98,
    lastSync: '1 hour ago',
    recentActivity: [],
    connectedDevices: [
      {
        id: 'dev_4',
        name: 'Linux Desktop',
        type: 'desktop',
        os: 'Ubuntu 24.04',
        lastActive: 'Active now',
        isCurrent: true,
      },
    ],
  },
];
