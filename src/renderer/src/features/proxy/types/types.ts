export type ProxyType = 'HTTPS' | 'SOCKS4' | 'SOCKS5';

export interface ProxyItem {
  id: string;
  stt: number;
  proxy: string; // host:port:user:pass or host:port
  type: ProxyType;
  country: string;
  countryCode: string;
  expired: string;
  status: 'active' | 'expired' | 'error';
  lastCheck?: string;
  details?: ProxyDetails;
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
}

export interface RDAPResponse {
  country?: string;
  name?: string;
  remarks?: Array<{ description: string[]; title: string }>;
  startAddress?: string;
  endAddress?: string;
}
