import { Proxy } from '../../../types/db';

export interface ProxyFilterState {
  searchQuery: string;
  status: Set<string>;
  protocol: Set<string>;
  source: Set<string>;
  type: Set<string>;
  country: Set<string>;
}

export interface ProxyFacetCounts {
  status: Record<string, number>;
  protocol: Record<string, number>;
  source: Record<string, number>;
  type: Record<string, number>;
  country: Record<string, number>;
}

// Derived display status from DB fields
export type DisplayStatus = 'healthy' | 'degraded' | 'dead' | 'testing';

export type { Proxy };