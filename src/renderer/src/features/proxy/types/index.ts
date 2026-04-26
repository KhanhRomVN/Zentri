import { Proxy } from '../../../../../shared/types';

export interface ProxyFilterState {
  searchQuery: string;
  proxyType: string;
  sourceType: string;
  protocol: string;
  status: string;
  country: string;
}

export type { Proxy };
