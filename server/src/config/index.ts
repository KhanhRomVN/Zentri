import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // VPN Settings
  VPN_SERVICE_PROVIDER: z.string().default('mullvad'),
  VPN_TYPE: z.enum(['openvpn', 'wireguard']).default('openvpn'),
  VPN_INTERFACE: z.string().default('tun0'),
  
  // Server Selection
  SERVER_COUNTRIES: z.string().optional(),
  SERVER_CITIES: z.string().optional(),
  SERVER_SELECTION_MODE: z.enum(['random', 'ordered']).default('random'),
  
  // OpenVPN Specific
  OPENVPN_USER: z.string().optional(),
  OPENVPN_PASSWORD: z.string().optional(),
  OPENVPN_PROTOCOL: z.enum(['tcp', 'udp']).default('udp'),
  OPENVPN_PORT: z.string().default('1194'),
  
  // WireGuard Specific
  WIREGUARD_PRIVATE_KEY: z.string().optional(),
  WIREGUARD_ADDRESS: z.string().optional(),
  WIREGUARD_ALLOWED_IPS: z.string().optional(),
  WIREGUARD_ENDPOINT: z.string().optional(),
  
  // Proxy Config
  HTTP_PROXY_ENABLED: z.string().transform(val => val === 'true').default('false'),
  HTTP_PROXY_PORT: z.string().default('8888'),
  SOCKS5_PROXY_ENABLED: z.string().transform(val => val === 'true').default('false'),
  SOCKS5_PROXY_PORT: z.string().default('1080'),
  
  // Firewall
  FIREWALL_ENABLED: z.string().transform(val => val === 'true').default('false'),
  FIREWALL_INPUT_PORTS: z.string().optional(),
  
  // Health Check
  HEALTH_CHECK_ENABLED: z.string().transform(val => val === 'true').default('true'),
  HEALTH_CHECK_INTERVAL: z.string().default('30'),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info')
});

export const config = envSchema.parse(process.env);
export type Config = typeof config;