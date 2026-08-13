/**
 * ------------------------------------------------------------------
 * Email Types
 * ------------------------------------------------------------------
 * TypeScript type definitions for the Email feature.
 * Defines Account, LinkedService, and related interfaces used
 * across the email management module.
 *
 * Main types:
 * - Account              : Extended email account with linked services and activity
 * - LinkedService        : Service linked to an email account
 * - ServiceProviderConfig: Configuration for a supported service provider
 * - Cookie               : Browser cookie shape
 * - MetadataItem         : Key-value metadata item
 * - ProfileMetadata      : Account profile metadata with cookies
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
import { Email, Service } from '../../../types/db';

// ─── Types ──────────────────────────────────────────────────────────────
export interface MetadataItem {
  key: string;
  value: string;
  type?: string;
  label?: string;
}

export type { Service };

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface ServiceProviderConfig {
  id: string;
  name: string;
  websiteUrl: string;
  defaultTags: string[];
  defaultCategories: string[];
  description: string;
  metadata?: MetadataItem[];
  authMethods?: string[];
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