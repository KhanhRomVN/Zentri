// ── Region groups ──────────────────────────────────────────────────────
export type RegionTag =
  | 'north_america'
  | 'europe'
  | 'asia'
  | 'oceania'
  | 'south_america'
  | 'africa'
  | 'middle_east'
  | 'global';

// ── Locale definition ─────────────────────────────────────────────────
export interface LocaleInfo {
  language: string;
  languages: string[];
  timezones: string[];
  region: RegionTag;
}

// ── Screen config ──────────────────────────────────────────────────────
export interface ScreenConfig {
  width: number;
  height: number;
  availHeightOffset: number;
  dpr: number;
}

// ── OS / Device template ──────────────────────────────────────────────
export interface OsTemplate {
  label: string;
  group: string; // Windows / macOS / Linux / Android / iOS
  platform: string;
  oscpu: string;
  platformVersion: string;
  /** Windows NT version for UA string (e.g. "10.0" for both Win10 and Win11) */
  windowsNtVersion?: string;
  hardwareConcurrency: number;
  deviceMemory: number; // GB
  maxTouchPoints: number;
  isMobile: boolean;
  webglVendor: string;
  webglRenderer: string;
  vendor: string;
  vendorSub: string;
  productSub: string;
  fonts: string[];
  screens: ScreenConfig[];
  batteryCharging?: boolean;
  batteryLevel?: number;
  regions: RegionTag[];
}

// ── Browser template ──────────────────────────────────────────────────
export interface BrowserTemplate {
  name: string;
  brand: string;
  brandVersion: string;
  engineVersion: string;
  appliesTo: 'desktop' | 'mobile' | 'all';
  onlyOnGroups?: string[];
  userAgentTemplate: (os: string, cpu: string, version: string) => string;
}