export interface PlatformConfig {
  columns: {
    key: string;
    label: string;
    type: 'text' | 'status' | 'date' | 'link' | 'agent';
  }[];
}

export interface Fingerprint {
  canvas: string;
  audio: string;
  clientRect: string;
  webglImage: string;
  webglMetadata: string;
  webglVector: string;
  webglVendor: string;
  webglReRender: string;
}

export interface Agent {
  id: string;
  name: string;
  userAgent: string;
  os: string;
  timezone: string;
  resolution: string;
  webrtc: string;
  location: string;
  language: string;
  fingerprint: Fingerprint;
}

export interface Website {
  id: string;
  name: string;
  url: string;
  color: string;
  icon?: string;
  description?: string;
  totalSessions: number;
  successRate: number; // e.g., 85 for 85%
  config: PlatformConfig;
}

export interface RegSession {
  id: string;
  websiteId: string;
  name: string;
  accountCount: number;
  successRate: number; // e.g., 90
  failureRate: number; // e.g., 10
  createdAt: string;
}

export interface RegAccount {
  id: string;
  sessionId: string;
  agentId?: string;
  username: string;
  password?: string;
  email?: string;
  status: 'success' | 'failed' | 'processing';
  proxy?: string;
  metadata?: Record<string, any>;
}

export interface RegData {
  websites: Website[];
  sessions: RegSession[];
  accounts: RegAccount[];
  agents: Agent[];
}
