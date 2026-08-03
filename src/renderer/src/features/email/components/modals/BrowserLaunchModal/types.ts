import { Fingerprint } from '../fingerprint';

export interface BrowserLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  accountId: string;
  targetUrl?: string;
  targetTitle?: string;
  onLaunch: (config: {
    fingerprintId?: string;
    proxyId?: string;
    fingerprintConfig?: object;
  }) => void;
}

export interface FilterOptions {
  groups: string[];
  browsers: string[];
}

export const OS_ICONS: Record<string, string> = {
  Windows: '\u{1FA9F}',
  macOS: '\u{1F34E}',
  Linux: '\u{1F427}',
  Android: '\u{1F4F1}',
  Other: '\u{1F4BB}',
};

export function extractFilters(fps: Fingerprint[]): FilterOptions {
  const groups = new Set<string>();
  const browsers = new Set<string>();
  for (const fp of fps) {
    if (fp.group) groups.add(fp.group);
    if (fp.browser) browsers.add(fp.browser);
  }
  return { groups: Array.from(groups).sort(), browsers: Array.from(browsers).sort() };
}