import { Email, Service, ActivityItem, Cookie } from '../../../../../shared/types';
import { MetadataItem } from '../../../shared/components/ui/service/ServiceMetadataBuilder';

export type { MetadataItem };

export type { Service, ActivityItem, Cookie };

export interface ServiceProviderConfig {
  id: string;
  name: string;
  websiteUrl: string;
  defaultTags: string[];
  defaultCategories: string[];
  description: string;
  metadata?: MetadataItem[];
}

export interface LinkedService {
  id: string;
  serviceId: string;
  name: string;
  url: string;
  username?: string;
  password?: string;
  notes?: string;
  status: string;
  secretCount?: number;
  metadata?: any;
}

export interface Account extends Omit<Email, 'services'> {
  avatar?: string;
  twoFactorEnabled?: boolean;
  services?: LinkedService[];
  lastActivity?: {
    title: string;
    url: string;
    time: number;
    favicon?: string;
  };
  lastProxy?: {
    host: string;
    port: number;
    protocol: string;
    proxyType?: string;
    sourceType?: string;
    country?: string;
    city?: string;
  };
}

export interface ProfileMetadata {
  accountId: string;
  cookieCount: number;
  lastSync: string;
  status: 'active' | 'none' | 'expired';
  cookies?: Cookie[];
}
