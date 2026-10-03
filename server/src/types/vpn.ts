export enum VpnType {
  OPENVPN = 'openvpn',
  WIREGUARD = 'wireguard'
}

export interface VpnServer {
  id: string;
  country: string;
  city?: string;
  hostname: string;
  ip: string;
  port: number;
  protocol: 'tcp' | 'udp';
  provider: string;
  load?: number;
  ping?: number;
}

export interface VpnConnectionStatus {
  isConnected: boolean;
  currentServer?: VpnServer;
  uptime?: number;
  publicIp?: string;
  error?: string;
}

export interface ProxyConfig {
  enabled: boolean;
  type: 'http' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
}