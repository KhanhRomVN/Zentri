import { Email, Service, ActivityItem, Cookie } from '../../../../../shared/types';

export type { Service, ActivityItem, Cookie };

export interface ServiceItem extends Service {}

export interface Account extends Email {
  avatar?: string;
  twoFactorEnabled?: boolean;
}

export interface ProfileMetadata {
  accountId: string;
  cookieCount: number;
  lastSync: string;
  status: 'active' | 'none' | 'expired';
  cookies?: Cookie[];
}
