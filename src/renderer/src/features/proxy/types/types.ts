import { Proxy as SharedProxy } from '../../../../../../shared/types';

export interface ProxyItem extends Omit<SharedProxy, 'metadata'> {
  // Legacy fields mapped to or from metadata for UI compatibility
  id: string;
  stt: number; // Was deleted in SharedProxy, likely needs to be optional or computed
  country: string;
  countryCode: string;
  details?: ProxyDetails;

  // SharedProxy has 'metadata'. We can alias it or merge it?
  // Ideally, we should update the UI to use 'metadata.country' etc.
  // But for now, let's keep ProxyItem as a UI wrapper.
  metadata?: any;
}

export interface ProxyDetails {
  ip: string;
  hostname?: string;
  isp?: string;
  org?: string;
  city?: string;
  region?: string;
  timezone?: string;
  usageType?: string;
  countryCode?: string;
  country?: string;
  networkRange?: string;
  registeredAt?: string;
  abuseContact?: string;
  asn?: string;
}

export interface RDAPResponse {
  country?: string;
  name?: string;
  remarks?: Array<{ description: string[]; title: string }>;
  startAddress?: string;
  endAddress?: string;
}
