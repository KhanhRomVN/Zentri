import { Email, Service, ActivityItem, Cookie } from '../../../../../../shared/types';

// Re-export specific types if needed by other files, or they should import from shared
export type { Service, ActivityItem, Cookie };
export type ServiceItem = Service;

export const mockAccounts: Email[] = [
  {
    id: '1',
    email: 'khanh.dev@gmail.com',
    name: 'Khanh Nguyen',
    emailProviderId: 'google',
    recoveryEmail: 'recovery@proton.me',
    phoneNumber: '+84 909 *** 123',
    status: 'active',
    metadata: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      twoFactorEnabled: true,
    },
    // services: has changed in shared types, now uses Service linked via emailId
    // But for mock data, if we want to nest it:
    services: [],
    recentActivity: [],
  },
  {
    id: '2',
    email: 'khanh.work@microsoft.com',
    name: 'Khanh Work',
    emailProviderId: 'hotmail', // Note: Need to check if 'hotmail' is in our constants, for now keeping as is
    recoveryEmail: 'khanh.dev@gmail.com',
    phoneNumber: '+84 912 *** 456',
    status: 'active',
    metadata: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
      twoFactorEnabled: true,
    },
  },
  {
    id: '3',
    email: 'secure.khanh@proton.me',
    name: 'Khanh Secure',
    emailProviderId: 'protonmail',
    recoveryEmail: 'N/A',
    phoneNumber: 'N/A',
    status: 'active',
    metadata: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight',
      twoFactorEnabled: true,
    },
  },
];
