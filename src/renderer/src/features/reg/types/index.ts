import {
  RegAccount as SharedRegAccount,
  RegSession as SharedRegSession,
  Agent as SharedAgent,
  ServiceProvider as SharedServiceProvider,
  Email,
} from '../../../../../../shared/types';

export type RegAccount = SharedRegAccount;
export type RegSession = SharedRegSession;
export type Agent = SharedAgent;
export type Website = SharedServiceProvider & {
  // Add backward compatibility fields if necessary, or refactor UI to use ServiceProvider fields
  url: string; // ServiceProvider has metadata.websiteUrl? Or we add url to ServiceProvider metadata?
  // Let's assume UI uses 'url' and 'config'.
  // We might need to extend ServiceProvider or just keep Website as a separate UI type mapped from ServiceProvider.
  // For now, let's keep Website separate but related if needed, or fully replace.
  // The user said "RegSession will have websiteId or serviceId".
  // Let's just export the shared types for now and see if we can adapt the UI.
  config?: any; // PlatformConfig
  totalSessions?: number;
  successRate?: number;
  color?: string;
  description?: string;
  icon?: string;
};

// Re-export PlatformConfig if it's UI specific, otherwise move to shared
export interface PlatformConfig {
  columns: {
    key: string;
    label: string;
    type: 'text' | 'status' | 'date' | 'link' | 'agent';
  }[];
}

export interface RegData {
  websites: Website[];
  sessions: RegSession[];
  accounts: RegAccount[];
  agents: Agent[];
}
