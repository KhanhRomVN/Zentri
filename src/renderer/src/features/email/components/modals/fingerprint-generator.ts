import { Fingerprint } from './fingerprint';

// ── IP API response ────────────────────────────────────────────────────
export interface IpApiResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

// ── OS Templates ───────────────────────────────────────────────────────
interface OsTemplate {
  label: string;
  group: string;
  platform: string;
  oscpu: string;
  platformVersion: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  maxTouchPoints: number;
  isMobile: boolean;
  webglVendor: string;
  webglRenderer: string;
  fonts: string[];
  vendor: string;
  vendorSub: string;
  productSub: string;
  batteryCharging: boolean;
  batteryLevel: number;
  screenWidths: number[];
  screenHeights: number[];
  devicePixelRatios: number[];
  availHeightOffsets: number[];
}

const OS_TEMPLATES: OsTemplate[] = [
  // ── Desktop ────────────────────────────────────────────────────────
  {
    label: 'Windows 11',
    group: 'Windows',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    platformVersion: '14.0.0',
    hardwareConcurrency: 12,
    deviceMemory: 16,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Google Inc. (NVIDIA)',
    webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11-31.0.15.3640)',
    fonts: ['Arial', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas', 'Courier New', 'Georgia', 'Impact', 'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'],
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: true,
    batteryLevel: 0.95,
    screenWidths: [1366, 1920, 2560],
    screenHeights: [768, 1080, 1440],
    devicePixelRatios: [1, 1, 1],
    availHeightOffsets: [40, 40, 40],
  },
  {
    label: 'Windows 10',
    group: 'Windows',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    platformVersion: '10.0.0',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-30.0.100.9864)',
    fonts: ['Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Cambria Math', 'Comic Sans MS', 'Consolas', 'Courier', 'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Microsoft Sans Serif', 'Palatino Linotype', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana'],
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: false,
    batteryLevel: 0.85,
    screenWidths: [1366, 1920, 2560],
    screenHeights: [768, 1080, 1440],
    devicePixelRatios: [1, 1, 1],
    availHeightOffsets: [40, 40, 40],
  },
  {
    label: 'Windows 7',
    group: 'Windows',
    platform: 'Win32',
    oscpu: 'Windows NT 6.1; Win64; x64',
    platformVersion: '6.1.0',
    hardwareConcurrency: 4,
    deviceMemory: 4,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0, D3D11-10.18.10.4358)',
    fonts: ['Arial', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas', 'Courier New', 'Georgia', 'Impact', 'Lucida Console', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'],
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: false,
    batteryLevel: 1.0,
    screenWidths: [1366, 1920],
    screenHeights: [768, 1080],
    devicePixelRatios: [1, 1],
    availHeightOffsets: [40, 40],
  },
  {
    label: 'Linux (Ubuntu)',
    group: 'Linux',
    platform: 'Linux x86_64',
    oscpu: 'Linux x86_64',
    platformVersion: '6.5.0',
    hardwareConcurrency: 4,
    deviceMemory: 8,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Mesa Intel(R) UHD Graphics 620, OpenGL 4.6)',
    fonts: ['Arial', 'Courier', 'Courier New', 'DejaVu Sans', 'DejaVu Serif', 'Georgia', 'Liberation Sans', 'Liberation Serif', 'Times', 'Times New Roman', 'Ubuntu', 'Verdana'],
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: false,
    batteryLevel: 1.0,
    screenWidths: [1366, 1920],
    screenHeights: [768, 1080],
    devicePixelRatios: [1, 1],
    availHeightOffsets: [40, 40],
  },
  {
    label: 'macOS 15',
    group: 'macOS',
    platform: 'MacIntel',
    oscpu: 'Intel Mac OS X 10_15_7',
    platformVersion: '15.0.0',
    hardwareConcurrency: 14,
    deviceMemory: 32,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Google Inc. (Apple)',
    webglRenderer: 'ANGLE (Apple, Apple M3 Max, OpenGL 4.1)',
    fonts: ['Apple Color Emoji', 'Arial', 'Courier', 'Courier New', 'Geneva', 'Georgia', 'Helvetica', 'Helvetica Neue', 'Lucida Grande', 'Menlo', 'Monaco', 'SF Pro', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana'],
    vendor: 'Apple Computer, Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: true,
    batteryLevel: 0.91,
    screenWidths: [1440, 1680, 2560],
    screenHeights: [900, 1050, 1440],
    devicePixelRatios: [2, 2, 2],
    availHeightOffsets: [40, 40, 40],
  },
  {
    label: 'macOS 14',
    group: 'macOS',
    platform: 'MacIntel',
    oscpu: 'Intel Mac OS X 10_15_7',
    platformVersion: '14.5.0',
    hardwareConcurrency: 10,
    deviceMemory: 16,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Google Inc. (Apple)',
    webglRenderer: 'ANGLE (Apple, Apple M2 Pro, OpenGL 4.1)',
    fonts: ['Apple Color Emoji', 'Apple SD Gothic Neo', 'Arial', 'Arial Hebrew', 'Courier', 'Courier New', 'Geneva', 'Georgia', 'Helvetica', 'Helvetica Neue', 'Lucida Grande', 'Menlo', 'Monaco', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana'],
    vendor: 'Apple Computer, Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: false,
    batteryLevel: 0.72,
    screenWidths: [1440, 1680],
    screenHeights: [900, 1050],
    devicePixelRatios: [2, 2],
    availHeightOffsets: [40, 40],
  },
  {
    label: 'macOS 10.15.7',
    group: 'macOS',
    platform: 'MacIntel',
    oscpu: 'Intel Mac OS X 10_15_7',
    platformVersion: '10.15.7',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) Iris(TM) Plus Graphics 640 OpenGL 4.1)',
    fonts: ['Apple Color Emoji', 'Arial', 'Courier', 'Courier New', 'Geneva', 'Georgia', 'Helvetica', 'Helvetica Neue', 'Lucida Grande', 'Menlo', 'Monaco', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana'],
    vendor: 'Apple Computer, Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: false,
    batteryLevel: 0.65,
    screenWidths: [1440, 1680],
    screenHeights: [900, 1050],
    devicePixelRatios: [2, 2],
    availHeightOffsets: [40, 40],
  },
  // ── Android ────────────────────────────────────────────────────────
  {
    label: 'Android 13',
    group: 'Android',
    platform: 'Linux armv8l',
    oscpu: 'Linux armv8l',
    platformVersion: '13.0.0',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'Qualcomm',
    webglRenderer: 'ANGLE (Qualcomm, Adreno (TM) 730, OpenGL ES 3.2)',
    fonts: ['Arial', 'Courier', 'Courier New', 'Georgia', 'Roboto', 'Times New Roman', 'Verdana'],
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: false,
    batteryLevel: 0.75,
    screenWidths: [360, 412, 393],
    screenHeights: [800, 915, 852],
    devicePixelRatios: [3, 3.5, 3],
    availHeightOffsets: [60, 60, 60],
  },
  {
    label: 'Android 12',
    group: 'Android',
    platform: 'Linux armv8l',
    oscpu: 'Linux armv8l',
    platformVersion: '12.0.0',
    hardwareConcurrency: 8,
    deviceMemory: 6,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'Qualcomm',
    webglRenderer: 'ANGLE (Qualcomm, Adreno (TM) 650, OpenGL ES 3.2)',
    fonts: ['Arial', 'Courier', 'Courier New', 'Georgia', 'Roboto', 'Times New Roman', 'Verdana'],
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: false,
    batteryLevel: 0.68,
    screenWidths: [360, 412],
    screenHeights: [780, 915],
    devicePixelRatios: [3, 3.5],
    availHeightOffsets: [60, 60],
  },
  {
    label: 'Android 11',
    group: 'Android',
    platform: 'Linux armv8l',
    oscpu: 'Linux armv8l',
    platformVersion: '11.0.0',
    hardwareConcurrency: 8,
    deviceMemory: 4,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'Qualcomm',
    webglRenderer: 'ANGLE (Qualcomm, Adreno (TM) 620, OpenGL ES 3.2)',
    fonts: ['Arial', 'Courier', 'Courier New', 'Georgia', 'Roboto', 'Times New Roman', 'Verdana'],
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: true,
    batteryLevel: 0.82,
    screenWidths: [360, 412],
    screenHeights: [780, 915],
    devicePixelRatios: [3, 3.5],
    availHeightOffsets: [60, 60],
  },
  {
    label: 'Android 10',
    group: 'Android',
    platform: 'Linux armv8l',
    oscpu: 'Linux armv8l',
    platformVersion: '10.0.0',
    hardwareConcurrency: 8,
    deviceMemory: 4,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'Qualcomm',
    webglRenderer: 'ANGLE (Qualcomm, Adreno (TM) 618, OpenGL ES 3.2)',
    fonts: ['Arial', 'Courier', 'Courier New', 'Georgia', 'Roboto', 'Times New Roman', 'Verdana'],
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: false,
    batteryLevel: 0.55,
    screenWidths: [360, 412],
    screenHeights: [780, 915],
    devicePixelRatios: [3, 3.5],
    availHeightOffsets: [60, 60],
  },
  {
    label: 'Android 9',
    group: 'Android',
    platform: 'Linux armv8l',
    oscpu: 'Linux armv8l',
    platformVersion: '9.0.0',
    hardwareConcurrency: 8,
    deviceMemory: 3,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'Qualcomm',
    webglRenderer: 'ANGLE (Qualcomm, Adreno (TM) 610, OpenGL ES 3.2)',
    fonts: ['Arial', 'Courier', 'Courier New', 'Georgia', 'Roboto', 'Times New Roman', 'Verdana'],
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: false,
    batteryLevel: 0.45,
    screenWidths: [360, 412],
    screenHeights: [740, 846],
    devicePixelRatios: [2, 3],
    availHeightOffsets: [60, 60],
  },
  {
    label: 'Android 8.1.0',
    group: 'Android',
    platform: 'Linux armv8l',
    oscpu: 'Linux armv8l',
    platformVersion: '8.1.0',
    hardwareConcurrency: 4,
    deviceMemory: 2,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'Qualcomm',
    webglRenderer: 'ANGLE (Qualcomm, Adreno (TM) 506, OpenGL ES 3.2)',
    fonts: ['Arial', 'Courier', 'Courier New', 'Georgia', 'Roboto', 'Times New Roman', 'Verdana'],
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    batteryCharging: true,
    batteryLevel: 0.60,
    screenWidths: [360],
    screenHeights: [740],
    devicePixelRatios: [2],
    availHeightOffsets: [60],
  },
];

// ── Browser Templates ──────────────────────────────────────────────────
interface BrowserTemplate {
  name: string;
  brand: string;
  brandVersion: string;
  engineVersion: string;
  appliesTo: 'desktop' | 'mobile' | 'all';
  onlyOnOs?: string[]; // restrict to specific OS groups
  userAgentTemplate: (os: string, cpu: string, version: string) => string;
}

const BROWSER_TEMPLATES: BrowserTemplate[] = [
  // ── Chrome ─────────────────────────────────────────────────────────
  {
    name: 'Chrome 143',
    brand: 'Google Chrome',
    brandVersion: '143',
    engineVersion: '143.0.0.0',
    appliesTo: 'all',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36`,
  },
  {
    name: 'Chrome 140',
    brand: 'Google Chrome',
    brandVersion: '140',
    engineVersion: '140.0.0.0',
    appliesTo: 'all',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36`,
  },
  {
    name: 'Chrome 130',
    brand: 'Google Chrome',
    brandVersion: '130',
    engineVersion: '130.0.0.0',
    appliesTo: 'all',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36`,
  },
  {
    name: 'Chrome 120',
    brand: 'Google Chrome',
    brandVersion: '120',
    engineVersion: '120.0.0.0',
    appliesTo: 'all',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36`,
  },
  // ── Firefox ────────────────────────────────────────────────────────
  {
    name: 'Firefox 140',
    brand: 'Mozilla Firefox',
    brandVersion: '140',
    engineVersion: '140.0',
    appliesTo: 'desktop',
    userAgentTemplate: (os, _cpu, v) =>
      `Mozilla/5.0 (${os}; rv:${v}.0) Gecko/20100101 Firefox/${v}.0`,
  },
  {
    name: 'Firefox 130',
    brand: 'Mozilla Firefox',
    brandVersion: '130',
    engineVersion: '130.0',
    appliesTo: 'desktop',
    userAgentTemplate: (os, _cpu, v) =>
      `Mozilla/5.0 (${os}; rv:${v}.0) Gecko/20100101 Firefox/${v}.0`,
  },
  {
    name: 'Firefox 120',
    brand: 'Mozilla Firefox',
    brandVersion: '120',
    engineVersion: '120.0',
    appliesTo: 'desktop',
    userAgentTemplate: (os, _cpu, v) =>
      `Mozilla/5.0 (${os}; rv:${v}.0) Gecko/20100101 Firefox/${v}.0`,
  },
  // ── Edge ───────────────────────────────────────────────────────────
  {
    name: 'Edge 143',
    brand: 'Microsoft Edge',
    brandVersion: '143',
    engineVersion: '143.0.0.0',
    appliesTo: 'desktop',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 Edg/${v}`,
  },
  {
    name: 'Edge 140',
    brand: 'Microsoft Edge',
    brandVersion: '140',
    engineVersion: '140.0.0.0',
    appliesTo: 'desktop',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 Edg/${v}`,
  },
  {
    name: 'Edge 130',
    brand: 'Microsoft Edge',
    brandVersion: '130',
    engineVersion: '130.0.0.0',
    appliesTo: 'desktop',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 Edg/${v}`,
  },
  // ── Safari ─────────────────────────────────────────────────────────
  {
    name: 'Safari 17',
    brand: 'Apple Safari',
    brandVersion: '17',
    engineVersion: '17.5',
    appliesTo: 'desktop',
    onlyOnOs: ['macOS'],
    userAgentTemplate: (os, _cpu, _v) =>
      `Mozilla/5.0 (${os}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15`,
  },
  {
    name: 'Safari 16',
    brand: 'Apple Safari',
    brandVersion: '16',
    engineVersion: '16.6',
    appliesTo: 'desktop',
    onlyOnOs: ['macOS'],
    userAgentTemplate: (os, _cpu, _v) =>
      `Mozilla/5.0 (${os}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15`,
  },
  // ── Opera ──────────────────────────────────────────────────────────
  {
    name: 'Opera 110',
    brand: 'Opera',
    brandVersion: '110',
    engineVersion: '110.0.0.0',
    appliesTo: 'desktop',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 OPR/${v}`,
  },
  {
    name: 'Opera 100',
    brand: 'Opera',
    brandVersion: '100',
    engineVersion: '100.0.0.0',
    appliesTo: 'desktop',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 OPR/${v}`,
  },
];

// ── Country → Locale mapping ───────────────────────────────────────────
interface LocaleInfo {
  language: string;
  languages: string[];
  timezones: string[];
}

const COUNTRY_LOCALE_MAP: Record<string, LocaleInfo> = {
  VN: { language: 'vi-VN', languages: ['vi-VN', 'vi', 'en-US', 'en'], timezones: ['Asia/Ho_Chi_Minh', 'Asia/Bangkok'] },
  US: { language: 'en-US', languages: ['en-US', 'en'], timezones: ['America/New_York', 'America/Chicago', 'America/Los_Angeles'] },
  GB: { language: 'en-GB', languages: ['en-GB', 'en-US', 'en'], timezones: ['Europe/London'] },
  DE: { language: 'de-DE', languages: ['de-DE', 'de', 'en-US', 'en'], timezones: ['Europe/Berlin'] },
  FR: { language: 'fr-FR', languages: ['fr-FR', 'fr', 'en-US', 'en'], timezones: ['Europe/Paris'] },
  JP: { language: 'ja-JP', languages: ['ja-JP', 'ja', 'en-US', 'en'], timezones: ['Asia/Tokyo'] },
  KR: { language: 'ko-KR', languages: ['ko-KR', 'ko', 'en-US', 'en'], timezones: ['Asia/Seoul'] },
  CN: { language: 'zh-CN', languages: ['zh-CN', 'zh', 'en-US', 'en'], timezones: ['Asia/Shanghai'] },
  IN: { language: 'en-IN', languages: ['en-IN', 'hi-IN', 'en-US', 'en'], timezones: ['Asia/Kolkata'] },
  BR: { language: 'pt-BR', languages: ['pt-BR', 'pt', 'en-US', 'en'], timezones: ['America/Sao_Paulo'] },
  RU: { language: 'ru-RU', languages: ['ru-RU', 'ru', 'en-US', 'en'], timezones: ['Europe/Moscow'] },
  TH: { language: 'th-TH', languages: ['th-TH', 'th', 'en-US', 'en'], timezones: ['Asia/Bangkok'] },
  ID: { language: 'id-ID', languages: ['id-ID', 'id', 'en-US', 'en'], timezones: ['Asia/Jakarta'] },
  PH: { language: 'en-PH', languages: ['en-PH', 'fil-PH', 'en-US', 'en'], timezones: ['Asia/Manila'] },
  MY: { language: 'en-MY', languages: ['en-MY', 'ms-MY', 'en-US', 'en'], timezones: ['Asia/Kuala_Lumpur'] },
  SG: { language: 'en-SG', languages: ['en-SG', 'zh-SG', 'en-US', 'en'], timezones: ['Asia/Singapore'] },
  AU: { language: 'en-AU', languages: ['en-AU', 'en-US', 'en'], timezones: ['Australia/Sydney'] },
  CA: { language: 'en-CA', languages: ['en-CA', 'fr-CA', 'en-US', 'en'], timezones: ['America/Toronto', 'America/Vancouver'] },
};

const DEFAULT_LOCALE: LocaleInfo = {
  language: 'en-US',
  languages: ['en-US', 'en'],
  timezones: ['America/New_York'],
};

function getLocaleInfo(countryCode: string): LocaleInfo {
  return COUNTRY_LOCALE_MAP[countryCode?.toUpperCase()] || DEFAULT_LOCALE;
}

// ── Helpers ────────────────────────────────────────────────────────────
function generateSeed(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getTimezoneOffset(tz: string): number {
  try {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    return (tzDate.getTime() - utcDate.getTime()) / 60000;
  } catch {
    return 0;
  }
}

function getPluginsJson(browserName: string): string {
  const isPdf = (n: string) => ({ name: n, description: 'Portable Document Format', filename: 'internal-pdf-viewer', mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf' }] });
  return JSON.stringify([
    isPdf(browserName.startsWith('Chrome') ? 'Chrome PDF Plugin' : browserName.startsWith('Edge') ? 'Microsoft Edge PDF Viewer' : 'PDF Viewer'),
    { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf' }] },
    { name: 'Native Client', description: '', filename: 'internal-nacl-plugin', mimeTypes: [{ type: 'application/x-nacl', suffixes: '' }, { type: 'application/x-pnacl', suffixes: '' }] },
  ]);
}

function getMimeTypes(): string {
  return JSON.stringify([
    { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
    { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
    { type: 'application/x-pnacl', suffixes: '', description: 'Portable Native Client Executable' },
  ]);
}

// ── Main Generator ─────────────────────────────────────────────────────
export function generateFingerprints(ipData: IpApiResponse): Fingerprint[] {
  const locale = getLocaleInfo(ipData.countryCode);
  const timezone = ipData.timezone || locale.timezones[0];
  const results: Fingerprint[] = [];
  let idCounter = 0;

  for (const os of OS_TEMPLATES) {
    const applicableBrowsers = BROWSER_TEMPLATES.filter((b) => {
      if (b.onlyOnOs && !b.onlyOnOs.includes(os.group)) return false;
      if (b.appliesTo === 'desktop' && os.isMobile) return false;
      if (b.appliesTo === 'mobile' && !os.isMobile) return false;
      return true;
    });

    for (const browser of applicableBrowsers) {
      const version = browser.engineVersion.split('.')[0];

      for (let si = 0; si < os.screenWidths.length; si++) {
        const sw = os.screenWidths[si];
        const sh = os.screenHeights[si];
        const dpr = os.devicePixelRatios[si];
        const offset = os.availHeightOffsets[si];

        const uaOs = os.oscpu.includes('Windows')
          ? `Windows NT ${os.platformVersion.split('.')[0]}.0; Win64; x64`
          : os.oscpu.includes('Mac')
            ? 'Macintosh; Intel Mac OS X 10_15_7'
            : os.oscpu.includes('Android')
              ? `Linux; Android ${os.platformVersion.split('.')[0]}; Pixel 7`
              : 'X11; Linux x86_64';

        const cpuArch = os.oscpu.includes('arm') ? '' : 'x64';
        const userAgent = browser.userAgentTemplate(uaOs, cpuArch, version);
        const appVersion = browser.name === 'Firefox'
          ? `5.0 (${uaOs})`
          : `5.0 (${uaOs}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;

        const tz = timezone || locale.timezones[0];
        const label = `${os.label} • ${browser.name}` + (sw < 500 ? ` • ${sw}×${sh}` : ` • ${sw}×${sh}`);

        const config: Record<string, any> = {
          userAgent,
          appVersion: appVersion !== userAgent ? appVersion : undefined,
          platform: os.platform,
          platformVersion: os.platformVersion,
          oscpu: os.oscpu,
          buildID: '20250301',
          hardwareConcurrency: os.hardwareConcurrency,
          maxTouchPoints: os.maxTouchPoints,
          deviceMemory: os.deviceMemory,
          screenWidth: sw,
          screenHeight: sh,
          screenAvailWidth: sw,
          screenAvailHeight: sh - offset,
          screenColorDepth: 24,
          screenPixelDepth: 24,
          devicePixelRatio: dpr,
          windowOuterWidth: sw,
          windowOuterHeight: sh - offset,
          windowInnerWidth: sw,
          windowInnerHeight: sh - offset - 80,
          screenX: 0,
          screenY: 0,
          language: locale.language,
          languages: locale.languages,
          doNotTrack: 'unspecified',
          cookieEnabled: true,
          webdriver: false,
          pdfViewerEnabled: true,
          webglVendor: os.webglVendor,
          webglRenderer: os.webglRenderer,
          webglVersion: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
          webglShadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
          timezone: tz,
          timezoneOffset: getTimezoneOffset(tz),
          latitude: ipData.lat,
          longitude: ipData.lon,
          accuracy: 100,
          prefersReducedMotion: false,
          prefersDarkMode: true,
          prefersContrast: 'no-preference',
          prefersReducedData: false,
          colorGamutSrgb: true,
          colorGamutP3: os.group === 'macOS',
          colorGamutRec2020: false,
          hdrSupport: os.group === 'macOS',
          audioSampleRate: 48000,
          audioMaxChannelCount: os.isMobile ? 2 : 2,
          localStorage: true,
          sessionStorage: true,
          indexedDb: true,
          canvasNoiseSeed: generateSeed(),
          fonts: JSON.stringify(os.fonts),
          plugins: getPluginsJson(browser.name),
          mimeTypes: getMimeTypes(),
          batteryCharging: os.batteryCharging,
          batteryChargingTime: os.batteryCharging ? 1800 : 0,
          batteryDischargingTime: os.batteryCharging ? Infinity : 7200,
          batteryLevel: os.batteryLevel,
          vendor: os.vendor,
          vendorSub: os.vendorSub,
          productSub: os.productSub,
          connectionEffectiveType: os.isMobile ? '4g' : '4g',
          connectionDownlink: os.isMobile ? 5 : 10,
          connectionRtt: os.isMobile ? 70 : 50,
          performanceMemory: os.deviceMemory,
        };

        idCounter++;
        results.push({
          id: `auto-fp-${String(idCounter).padStart(3, '0')}`,
          name: label,
          description: `${os.group} | ${browser.name} | ${tz}`,
          config,
          group: os.group,
          os: os.label,
          browser: browser.name,
        });
      }
    }
  }

  return results;
}