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

// ── Region groups ──────────────────────────────────────────────────────
type RegionTag =
  | 'north_america'
  | 'europe'
  | 'asia'
  | 'oceania'
  | 'south_america'
  | 'africa'
  | 'middle_east'
  | 'global';

// ── Locale definition ─────────────────────────────────────────────────
interface LocaleInfo {
  language: string;
  languages: string[];
  timezones: string[];
  region: RegionTag;
}

// Mở rộng đến hầu hết các quốc gia mà ip-api trả về
const COUNTRY_LOCALE_MAP: Record<string, LocaleInfo> = {
  VN: {
    language: 'vi-VN',
    languages: ['vi-VN', 'vi', 'en-US', 'en'],
    timezones: ['Asia/Ho_Chi_Minh', 'Asia/Bangkok'],
    region: 'asia',
  },
  US: {
    language: 'en-US',
    languages: ['en-US', 'en'],
    timezones: ['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Denver'],
    region: 'north_america',
  },
  GB: {
    language: 'en-GB',
    languages: ['en-GB', 'en-US', 'en'],
    timezones: ['Europe/London'],
    region: 'europe',
  },
  DE: {
    language: 'de-DE',
    languages: ['de-DE', 'de', 'en-US', 'en'],
    timezones: ['Europe/Berlin'],
    region: 'europe',
  },
  FR: {
    language: 'fr-FR',
    languages: ['fr-FR', 'fr', 'en-US', 'en'],
    timezones: ['Europe/Paris'],
    region: 'europe',
  },
  JP: {
    language: 'ja-JP',
    languages: ['ja-JP', 'ja', 'en-US', 'en'],
    timezones: ['Asia/Tokyo'],
    region: 'asia',
  },
  KR: {
    language: 'ko-KR',
    languages: ['ko-KR', 'ko', 'en-US', 'en'],
    timezones: ['Asia/Seoul'],
    region: 'asia',
  },
  CN: {
    language: 'zh-CN',
    languages: ['zh-CN', 'zh', 'en-US', 'en'],
    timezones: ['Asia/Shanghai'],
    region: 'asia',
  },
  IN: {
    language: 'en-IN',
    languages: ['en-IN', 'hi-IN', 'en-US', 'en'],
    timezones: ['Asia/Kolkata'],
    region: 'asia',
  },
  BR: {
    language: 'pt-BR',
    languages: ['pt-BR', 'pt', 'en-US', 'en'],
    timezones: ['America/Sao_Paulo', 'America/Fortaleza'],
    region: 'south_america',
  },
  RU: {
    language: 'ru-RU',
    languages: ['ru-RU', 'ru', 'en-US', 'en'],
    timezones: ['Europe/Moscow'],
    region: 'europe',
  },
  TH: {
    language: 'th-TH',
    languages: ['th-TH', 'th', 'en-US', 'en'],
    timezones: ['Asia/Bangkok'],
    region: 'asia',
  },
  ID: {
    language: 'id-ID',
    languages: ['id-ID', 'id', 'en-US', 'en'],
    timezones: ['Asia/Jakarta'],
    region: 'asia',
  },
  PH: {
    language: 'en-PH',
    languages: ['en-PH', 'fil-PH', 'en-US', 'en'],
    timezones: ['Asia/Manila'],
    region: 'asia',
  },
  MY: {
    language: 'en-MY',
    languages: ['en-MY', 'ms-MY', 'en-US', 'en'],
    timezones: ['Asia/Kuala_Lumpur'],
    region: 'asia',
  },
  SG: {
    language: 'en-SG',
    languages: ['en-SG', 'zh-SG', 'en-US', 'en'],
    timezones: ['Asia/Singapore'],
    region: 'asia',
  },
  AU: {
    language: 'en-AU',
    languages: ['en-AU', 'en-US', 'en'],
    timezones: ['Australia/Sydney', 'Australia/Melbourne'],
    region: 'oceania',
  },
  CA: {
    language: 'en-CA',
    languages: ['en-CA', 'fr-CA', 'en-US', 'en'],
    timezones: ['America/Toronto', 'America/Vancouver'],
    region: 'north_america',
  },
  MX: {
    language: 'es-MX',
    languages: ['es-MX', 'es', 'en-US', 'en'],
    timezones: ['America/Mexico_City'],
    region: 'north_america',
  },
  AR: {
    language: 'es-AR',
    languages: ['es-AR', 'es', 'en-US', 'en'],
    timezones: ['America/Argentina/Buenos_Aires'],
    region: 'south_america',
  },
  ZA: {
    language: 'en-ZA',
    languages: ['en-ZA', 'af', 'en-US', 'en'],
    timezones: ['Africa/Johannesburg'],
    region: 'africa',
  },
  NG: {
    language: 'en-NG',
    languages: ['en-NG', 'ha', 'yo', 'en-US', 'en'],
    timezones: ['Africa/Lagos'],
    region: 'africa',
  },
  EG: {
    language: 'ar-EG',
    languages: ['ar-EG', 'ar', 'en-US', 'en'],
    timezones: ['Africa/Cairo'],
    region: 'africa',
  },
  SA: {
    language: 'ar-SA',
    languages: ['ar-SA', 'ar', 'en-US', 'en'],
    timezones: ['Asia/Riyadh'],
    region: 'middle_east',
  },
  AE: {
    language: 'ar-AE',
    languages: ['ar-AE', 'ar', 'en-US', 'en'],
    timezones: ['Asia/Dubai'],
    region: 'middle_east',
  },
  TR: {
    language: 'tr-TR',
    languages: ['tr-TR', 'tr', 'en-US', 'en'],
    timezones: ['Europe/Istanbul'],
    region: 'europe',
  },
  PL: {
    language: 'pl-PL',
    languages: ['pl-PL', 'pl', 'en-US', 'en'],
    timezones: ['Europe/Warsaw'],
    region: 'europe',
  },
  IT: {
    language: 'it-IT',
    languages: ['it-IT', 'it', 'en-US', 'en'],
    timezones: ['Europe/Rome'],
    region: 'europe',
  },
  ES: {
    language: 'es-ES',
    languages: ['es-ES', 'es', 'en-US', 'en'],
    timezones: ['Europe/Madrid'],
    region: 'europe',
  },
  NL: {
    language: 'nl-NL',
    languages: ['nl-NL', 'nl', 'en-US', 'en'],
    timezones: ['Europe/Amsterdam'],
    region: 'europe',
  },
  SE: {
    language: 'sv-SE',
    languages: ['sv-SE', 'sv', 'en-US', 'en'],
    timezones: ['Europe/Stockholm'],
    region: 'europe',
  },
  NO: {
    language: 'nb-NO',
    languages: ['nb-NO', 'nb', 'en-US', 'en'],
    timezones: ['Europe/Oslo'],
    region: 'europe',
  },
  DK: {
    language: 'da-DK',
    languages: ['da-DK', 'da', 'en-US', 'en'],
    timezones: ['Europe/Copenhagen'],
    region: 'europe',
  },
  FI: {
    language: 'fi-FI',
    languages: ['fi-FI', 'fi', 'en-US', 'en'],
    timezones: ['Europe/Helsinki'],
    region: 'europe',
  },
  PT: {
    language: 'pt-PT',
    languages: ['pt-PT', 'pt', 'en-US', 'en'],
    timezones: ['Europe/Lisbon'],
    region: 'europe',
  },
  GR: {
    language: 'el-GR',
    languages: ['el-GR', 'el', 'en-US', 'en'],
    timezones: ['Europe/Athens'],
    region: 'europe',
  },
  CZ: {
    language: 'cs-CZ',
    languages: ['cs-CZ', 'cs', 'en-US', 'en'],
    timezones: ['Europe/Prague'],
    region: 'europe',
  },
  RO: {
    language: 'ro-RO',
    languages: ['ro-RO', 'ro', 'en-US', 'en'],
    timezones: ['Europe/Bucharest'],
    region: 'europe',
  },
  HU: {
    language: 'hu-HU',
    languages: ['hu-HU', 'hu', 'en-US', 'en'],
    timezones: ['Europe/Budapest'],
    region: 'europe',
  },
  BG: {
    language: 'bg-BG',
    languages: ['bg-BG', 'bg', 'en-US', 'en'],
    timezones: ['Europe/Sofia'],
    region: 'europe',
  },
  UA: {
    language: 'uk-UA',
    languages: ['uk-UA', 'uk', 'ru', 'en-US', 'en'],
    timezones: ['Europe/Kiev'],
    region: 'europe',
  },
  KZ: {
    language: 'kk-KZ',
    languages: ['kk-KZ', 'ru', 'en-US', 'en'],
    timezones: ['Asia/Almaty'],
    region: 'asia',
  },
  UZ: {
    language: 'uz-UZ',
    languages: ['uz-UZ', 'ru', 'en-US', 'en'],
    timezones: ['Asia/Tashkent'],
    region: 'asia',
  },
  IR: {
    language: 'fa-IR',
    languages: ['fa-IR', 'fa', 'en-US', 'en'],
    timezones: ['Asia/Tehran'],
    region: 'middle_east',
  },
  IQ: {
    language: 'ar-IQ',
    languages: ['ar-IQ', 'ar', 'en-US', 'en'],
    timezones: ['Asia/Baghdad'],
    region: 'middle_east',
  },
  IL: {
    language: 'he-IL',
    languages: ['he-IL', 'he', 'en-US', 'en'],
    timezones: ['Asia/Jerusalem'],
    region: 'middle_east',
  },
  // ... thêm các nước khác nếu cần, default sẽ dùng global
};

const DEFAULT_LOCALE: LocaleInfo = {
  language: 'en-US',
  languages: ['en-US', 'en'],
  timezones: ['UTC'],
  region: 'global',
};

function getLocaleInfo(countryCode: string): LocaleInfo {
  return COUNTRY_LOCALE_MAP[countryCode?.toUpperCase()] || DEFAULT_LOCALE;
}

// ── OS / Device templates ──────────────────────────────────────────────
interface ScreenConfig {
  width: number;
  height: number;
  availHeightOffset: number;
  dpr: number;
}

interface OsTemplate {
  label: string; // tên hiển thị
  group: string; // Windows / macOS / Linux / Android / iOS
  platform: string;
  oscpu: string;
  platformVersion: string;
  hardwareConcurrency: number;
  deviceMemory: number; // GB
  maxTouchPoints: number;
  isMobile: boolean;
  webglVendor: string;
  webglRenderer: string;
  vendor: string; // navigator.vendor
  vendorSub: string;
  productSub: string;
  fonts: string[];
  screens: ScreenConfig[]; // các độ phân giải phổ biến cho thiết bị này
  batteryCharging?: boolean;
  batteryLevel?: number;
  // Khu vực địa lý mà thiết bị này thực sự phổ biến
  regions: RegionTag[];
}

const OS_TEMPLATES: OsTemplate[] = [
  // ── Windows Desktop (phổ thông) ──────────────────────────────────
  {
    label: 'Windows 11 (Intel UHD)',
    group: 'Windows',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    platformVersion: '14.0.0',
    hardwareConcurrency: 8,
    deviceMemory: 16,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer:
      'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-30.0.100.9864)',
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: [
      'Arial',
      'Calibri',
      'Cambria',
      'Comic Sans MS',
      'Consolas',
      'Courier New',
      'Georgia',
      'Impact',
      'Segoe UI',
      'Tahoma',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
    ],
    screens: [
      { width: 1366, height: 768, availHeightOffset: 40, dpr: 1 },
      { width: 1920, height: 1080, availHeightOffset: 40, dpr: 1 },
      { width: 2560, height: 1440, availHeightOffset: 40, dpr: 1 },
    ],
    batteryCharging: true,
    batteryLevel: 0.95,
    regions: [
      'north_america',
      'europe',
      'asia',
      'oceania',
      'south_america',
      'africa',
      'middle_east',
      'global',
    ],
  },
  {
    label: 'Windows 10 (Intel HD 4000)',
    group: 'Windows',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    platformVersion: '10.0.0',
    hardwareConcurrency: 4,
    deviceMemory: 8,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer:
      'ANGLE (Intel, Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0, D3D11-10.18.10.4358)',
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: [
      'Arial',
      'Arial Black',
      'Calibri',
      'Cambria',
      'Comic Sans MS',
      'Consolas',
      'Courier New',
      'Georgia',
      'Impact',
      'Lucida Console',
      'Microsoft Sans Serif',
      'Palatino Linotype',
      'Segoe UI',
      'Tahoma',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
    ],
    screens: [
      { width: 1366, height: 768, availHeightOffset: 40, dpr: 1 },
      { width: 1920, height: 1080, availHeightOffset: 40, dpr: 1 },
    ],
    batteryCharging: false,
    batteryLevel: 0.8,
    regions: [
      'north_america',
      'europe',
      'asia',
      'oceania',
      'south_america',
      'africa',
      'middle_east',
      'global',
    ],
  },
  // ── Windows máy bàn cao cấp (gaming) ─────────────────────────────
  {
    label: 'Windows 11 (RTX 3060)',
    group: 'Windows',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    platformVersion: '14.0.0',
    hardwareConcurrency: 16,
    deviceMemory: 32,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Google Inc. (NVIDIA)',
    webglRenderer:
      'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11-31.0.15.3640)',
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: [
      'Arial',
      'Calibri',
      'Cambria',
      'Comic Sans MS',
      'Consolas',
      'Courier New',
      'Georgia',
      'Impact',
      'Segoe UI',
      'Tahoma',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
      'Webdings',
      'Wingdings',
    ],
    screens: [
      { width: 1920, height: 1080, availHeightOffset: 40, dpr: 1 },
      { width: 2560, height: 1440, availHeightOffset: 40, dpr: 1 },
      { width: 3840, height: 2160, availHeightOffset: 40, dpr: 1 },
    ],
    batteryCharging: true,
    batteryLevel: 1.0,
    regions: ['north_america', 'europe', 'oceania', 'asia'], // chủ yếu ở thị trường phát triển
  },
  // ── macOS Desktop / MacBook ─────────────────────────────────────
  {
    label: 'MacBook Air M1 2020',
    group: 'macOS',
    platform: 'MacIntel',
    oscpu: 'Intel Mac OS X 10_15_7',
    platformVersion: '14.5.0',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Apple Inc.',
    webglRenderer: 'ANGLE (Apple, Apple M1, OpenGL 4.1)',
    vendor: 'Apple Computer, Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: [
      'Apple Color Emoji',
      'Arial',
      'Courier',
      'Courier New',
      'Geneva',
      'Georgia',
      'Helvetica',
      'Helvetica Neue',
      'Lucida Grande',
      'Menlo',
      'Monaco',
      'SF Pro',
      'Times',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
    ],
    screens: [
      { width: 1440, height: 900, availHeightOffset: 40, dpr: 2 },
      { width: 1680, height: 1050, availHeightOffset: 40, dpr: 2 },
    ],
    batteryCharging: false,
    batteryLevel: 0.75,
    regions: ['north_america', 'europe', 'oceania', 'asia'],
  },
  {
    label: 'MacBook Pro 14" M3 2023',
    group: 'macOS',
    platform: 'MacIntel',
    oscpu: 'Intel Mac OS X 10_15_7',
    platformVersion: '15.0.0',
    hardwareConcurrency: 14,
    deviceMemory: 32,
    maxTouchPoints: 0,
    isMobile: false,
    webglVendor: 'Apple Inc.',
    webglRenderer: 'ANGLE (Apple, Apple M3 Max, OpenGL 4.1)',
    vendor: 'Apple Computer, Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: [
      'Apple Color Emoji',
      'Apple SD Gothic Neo',
      'Arial',
      'Courier',
      'Courier New',
      'Geneva',
      'Georgia',
      'Helvetica',
      'Helvetica Neue',
      'Lucida Grande',
      'Menlo',
      'Monaco',
      'SF Pro',
      'Times',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
    ],
    screens: [
      { width: 1512, height: 982, availHeightOffset: 40, dpr: 2 }, // native scaled
      { width: 2560, height: 1440, availHeightOffset: 40, dpr: 2 },
    ],
    batteryCharging: true,
    batteryLevel: 0.91,
    regions: ['north_america', 'europe', 'oceania'],
  },
  // ── Linux desktop ───────────────────────────────────────────────
  {
    label: 'Linux (Ubuntu 22.04)',
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
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: [
      'Arial',
      'Courier',
      'Courier New',
      'DejaVu Sans',
      'DejaVu Serif',
      'Georgia',
      'Liberation Sans',
      'Liberation Serif',
      'Times',
      'Times New Roman',
      'Ubuntu',
      'Verdana',
    ],
    screens: [
      { width: 1366, height: 768, availHeightOffset: 40, dpr: 1 },
      { width: 1920, height: 1080, availHeightOffset: 40, dpr: 1 },
    ],
    batteryCharging: false,
    batteryLevel: 1.0,
    regions: ['europe', 'north_america', 'asia', 'global'], // Linux phổ biến hơn ở châu Âu, Ấn Độ
  },
  // ── Smartphone Android ──────────────────────────────────────────
  {
    label: 'Samsung Galaxy S23 (Adreno 730)',
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
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: ['Arial', 'Courier', 'Courier New', 'Georgia', 'Roboto', 'Times New Roman', 'Verdana'],
    screens: [
      { width: 360, height: 800, availHeightOffset: 60, dpr: 3 },
      { width: 412, height: 915, availHeightOffset: 60, dpr: 3.5 },
    ],
    batteryCharging: false,
    batteryLevel: 0.72,
    regions: ['north_america', 'europe', 'asia', 'middle_east', 'global'],
  },
  {
    label: 'Google Pixel 7 (Mali-G710)',
    group: 'Android',
    platform: 'Linux armv8l',
    oscpu: 'Linux armv8l',
    platformVersion: '13.0.0',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'ARM',
    webglRenderer: 'ANGLE (ARM, Mali-G710, OpenGL ES 3.2)',
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: ['Arial', 'Courier', 'Courier New', 'Georgia', 'Roboto', 'Times New Roman', 'Verdana'],
    screens: [{ width: 412, height: 915, availHeightOffset: 60, dpr: 3.5 }],
    batteryCharging: false,
    batteryLevel: 0.68,
    regions: ['north_america', 'europe', 'asia'],
  },
  {
    label: 'Xiaomi Redmi Note 12 (Adreno 610)',
    group: 'Android',
    platform: 'Linux armv8l',
    oscpu: 'Linux armv8l',
    platformVersion: '11.0.0',
    hardwareConcurrency: 8,
    deviceMemory: 4,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'Qualcomm',
    webglRenderer: 'ANGLE (Qualcomm, Adreno (TM) 610, OpenGL ES 3.2)',
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: ['Arial', 'Courier', 'Courier New', 'Georgia', 'Roboto', 'Times New Roman', 'Verdana'],
    screens: [{ width: 360, height: 780, availHeightOffset: 60, dpr: 2.75 }],
    batteryCharging: false,
    batteryLevel: 0.55,
    regions: ['asia', 'africa', 'south_america', 'middle_east'], // phân khúc giá rẻ phổ biến ở các nước đang phát triển
  },
  {
    label: 'Samsung Galaxy A14 (Mali-G57)',
    group: 'Android',
    platform: 'Linux armv8l',
    oscpu: 'Linux armv8l',
    platformVersion: '12.0.0',
    hardwareConcurrency: 8,
    deviceMemory: 4,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'ARM',
    webglRenderer: 'ANGLE (ARM, Mali-G57, OpenGL ES 3.2)',
    vendor: 'Google Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: ['Arial', 'Courier', 'Courier New', 'Georgia', 'Roboto', 'Times New Roman', 'Verdana'],
    screens: [{ width: 360, height: 800, availHeightOffset: 60, dpr: 2 }],
    batteryCharging: true,
    batteryLevel: 0.8,
    regions: ['asia', 'africa', 'south_america', 'europe'], // bán chạy toàn cầu giá rẻ
  },
  // ── iPhone ──────────────────────────────────────────────────────
  {
    label: 'iPhone 15 Pro (A17 Pro)',
    group: 'iOS',
    platform: 'iPhone',
    oscpu: 'CPU iPhone OS 17_0 like Mac OS X',
    platformVersion: '17.0.0',
    hardwareConcurrency: 6,
    deviceMemory: 8,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'Apple Inc.',
    webglRenderer: 'ANGLE (Apple, Apple A17 Pro GPU, OpenGL ES 3.0)',
    vendor: 'Apple Computer, Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: [
      'Academy Engraved LET',
      'American Typewriter',
      'Apple Color Emoji',
      'Arial',
      'Arial Hebrew',
      'Courier',
      'Courier New',
      'Georgia',
      'Helvetica',
      'Helvetica Neue',
      'Marker Felt',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
      'Zapfino',
    ],
    screens: [
      { width: 393, height: 852, availHeightOffset: 60, dpr: 3 },
      { width: 430, height: 932, availHeightOffset: 60, dpr: 3 }, // 15 Pro Max
    ],
    batteryCharging: true,
    batteryLevel: 0.91,
    regions: ['north_america', 'europe', 'asia', 'oceania', 'middle_east'],
  },
  {
    label: 'iPhone 13 (A15)',
    group: 'iOS',
    platform: 'iPhone',
    oscpu: 'CPU iPhone OS 16_5 like Mac OS X',
    platformVersion: '16.5.0',
    hardwareConcurrency: 6,
    deviceMemory: 4,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'Apple Inc.',
    webglRenderer: 'ANGLE (Apple, Apple A15 GPU, OpenGL ES 3.0)',
    vendor: 'Apple Computer, Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: [
      'Academy Engraved LET',
      'American Typewriter',
      'Apple Color Emoji',
      'Arial',
      'Arial Hebrew',
      'Courier',
      'Courier New',
      'Georgia',
      'Helvetica',
      'Helvetica Neue',
      'Marker Felt',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
    ],
    screens: [{ width: 390, height: 844, availHeightOffset: 60, dpr: 3 }],
    batteryCharging: false,
    batteryLevel: 0.65,
    regions: ['north_america', 'europe', 'asia', 'oceania', 'middle_east', 'south_america'],
  },
  {
    label: 'iPhone SE 2022 (A15)',
    group: 'iOS',
    platform: 'iPhone',
    oscpu: 'CPU iPhone OS 16_5 like Mac OS X',
    platformVersion: '16.5.0',
    hardwareConcurrency: 6,
    deviceMemory: 4,
    maxTouchPoints: 5,
    isMobile: true,
    webglVendor: 'Apple Inc.',
    webglRenderer: 'ANGLE (Apple, Apple A15 GPU, OpenGL ES 3.0)',
    vendor: 'Apple Computer, Inc.',
    vendorSub: '',
    productSub: '20030107',
    fonts: [
      'Academy Engraved LET',
      'American Typewriter',
      'Apple Color Emoji',
      'Arial',
      'Courier',
      'Courier New',
      'Georgia',
      'Helvetica',
      'Helvetica Neue',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
    ],
    screens: [{ width: 375, height: 667, availHeightOffset: 60, dpr: 2 }],
    batteryCharging: false,
    batteryLevel: 0.55,
    regions: ['north_america', 'europe', 'asia', 'africa'], // giá rẻ, phổ biến ở nhiều nước
  },
];

// ── Browser templates ──────────────────────────────────────────────────
interface BrowserTemplate {
  name: string;
  brand: string;
  brandVersion: string;
  engineVersion: string;
  appliesTo: 'desktop' | 'mobile' | 'all';
  onlyOnGroups?: string[]; // OS groups (Windows, macOS, Linux, Android, iOS)
  userAgentTemplate: (os: string, cpu: string, version: string) => string;
}

const BROWSER_TEMPLATES: BrowserTemplate[] = [
  // Chrome
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
  // Firefox
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
  // Edge
  {
    name: 'Edge 143',
    brand: 'Microsoft Edge',
    brandVersion: '143',
    engineVersion: '143.0.0.0',
    appliesTo: 'desktop',
    onlyOnGroups: ['Windows', 'macOS'],
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 Edg/${v}`,
  },
  {
    name: 'Edge 140',
    brand: 'Microsoft Edge',
    brandVersion: '140',
    engineVersion: '140.0.0.0',
    appliesTo: 'desktop',
    onlyOnGroups: ['Windows', 'macOS'],
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 Edg/${v}`,
  },
  // Safari (chỉ macOS/iOS)
  {
    name: 'Safari 17',
    brand: 'Apple Safari',
    brandVersion: '17',
    engineVersion: '17.5',
    appliesTo: 'desktop',
    onlyOnGroups: ['macOS'],
    userAgentTemplate: (os, _cpu, _v) =>
      `Mozilla/5.0 (${os}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15`,
  },
  {
    name: 'Safari 16',
    brand: 'Apple Safari',
    brandVersion: '16',
    engineVersion: '16.6',
    appliesTo: 'desktop',
    onlyOnGroups: ['macOS'],
    userAgentTemplate: (os, _cpu, _v) =>
      `Mozilla/5.0 (${os}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15`,
  },
  {
    name: 'Mobile Safari 17',
    brand: 'Apple Safari',
    brandVersion: '17',
    engineVersion: '17.5',
    appliesTo: 'mobile',
    onlyOnGroups: ['iOS'],
    userAgentTemplate: (os, _cpu, _v) =>
      `Mozilla/5.0 (${os}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1`,
  },
  // Opera
  {
    name: 'Opera 110',
    brand: 'Opera',
    brandVersion: '110',
    engineVersion: '110.0.0.0',
    appliesTo: 'desktop',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 OPR/${v}`,
  },
  // Samsung Internet (Android)
  {
    name: 'Samsung Internet 23',
    brand: 'Samsung Internet',
    brandVersion: '23',
    engineVersion: '115.0.0.0',
    appliesTo: 'mobile',
    onlyOnGroups: ['Android'],
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${os}; ${cpu}) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/${v} Safari/537.36`,
  },
];

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
  if (browserName.startsWith('Firefox')) {
    return JSON.stringify([
      {
        name: 'PDF Viewer',
        description: 'Portable Document Format',
        filename: 'internal-pdf-viewer',
        mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf' }],
      },
    ]);
  }
  // Chrome / Edge / Opera / Samsung
  const pdfPlugin = browserName.startsWith('Edge')
    ? 'Microsoft Edge PDF Viewer'
    : 'Chrome PDF Plugin';
  const pdfFilename = browserName.startsWith('Edge')
    ? 'mhjfbmdgcfjbbpaeojofohoefgiehjai'
    : 'internal-pdf-viewer';
  return JSON.stringify([
    {
      name: pdfPlugin,
      description: 'Portable Document Format',
      filename: pdfFilename,
      mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf' }],
    },
    {
      name: 'Chrome PDF Viewer',
      description: '',
      filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
      mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf' }],
    },
    {
      name: 'Native Client',
      description: '',
      filename: 'internal-nacl-plugin',
      mimeTypes: [
        { type: 'application/x-nacl', suffixes: '' },
        { type: 'application/x-pnacl', suffixes: '' },
      ],
    },
  ]);
}

function getMimeTypes(): string {
  return JSON.stringify([
    { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
    { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
    { type: 'application/x-pnacl', suffixes: '', description: 'Portable Native Client Executable' },
  ]);
}

// ── Short hash for unique fingerprint IDs ──────────────────────────────
function shortHash(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}

// ── Main generator ─────────────────────────────────────────────────────
export function generateFingerprints(ipData: IpApiResponse): Fingerprint[] {
  const localeInfo = getLocaleInfo(ipData.countryCode);
  const countryRegion = localeInfo.region;
  const timezone = ipData.timezone || localeInfo.timezones[0];

  const results: Fingerprint[] = [];
  let idCounter = 0;

  // Lọc OS templates theo region của quốc gia
  const allowedOs = OS_TEMPLATES.filter(
    (os) => os.regions.includes(countryRegion) || os.regions.includes('global'),
  );

  for (const os of allowedOs) {
    // Lọc browser phù hợp OS
    const browsers = BROWSER_TEMPLATES.filter((b) => {
      // Kiểm tra chỉ định OS groups
      if (b.onlyOnGroups && !b.onlyOnGroups.includes(os.group)) return false;
      // Phù hợp mobile/desktop
      if (b.appliesTo === 'desktop' && os.isMobile) return false;
      if (b.appliesTo === 'mobile' && !os.isMobile) return false;
      return true;
    });

    for (const browser of browsers) {
      const version = browser.engineVersion.split('.')[0];

      for (const scr of os.screens) {
        // Xây dựng UA string
        const uaOs = os.group === 'iOS'
          ? `iPhone; CPU iPhone OS ${os.platformVersion.replace(/\./g, '_')} like Mac OS X`
          : os.group === 'Android'
            ? `Linux; Android ${os.platformVersion.split('.')[0]}; ${os.label.includes('Pixel') ? 'Pixel 7' : 'SM-S911B'}`
            : os.oscpu.includes('Windows')
              ? `Windows NT ${os.platformVersion.split('.')[0]}.0; Win64; x64`
              : os.oscpu.includes('Mac')
                ? `Macintosh; Intel Mac OS X 10_15_7`
                : `X11; Linux x86_64`;

        const cpuArch = os.oscpu.includes('arm') ? '' : 'x64';
        const userAgent = browser.userAgentTemplate(uaOs, cpuArch, version);

        const appVersion = browser.name.startsWith('Firefox')
          ? `5.0 (${uaOs})`
          : `5.0 (${uaOs}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;

        const label = `${os.label} • ${browser.name} • ${scr.width}×${scr.height}`;

        const config: Record<string, any> = {
          userAgent,
          appVersion: appVersion !== userAgent ? appVersion : undefined,
          platform: os.platform,
          platformVersion: os.platformVersion,
          oscpu: os.oscpu,
          buildID: browser.name.startsWith('Firefox') ? '20250301000000' : undefined,
          hardwareConcurrency: os.hardwareConcurrency,
          maxTouchPoints: os.maxTouchPoints,
          deviceMemory: os.deviceMemory,
          screenWidth: scr.width,
          screenHeight: scr.height,
          screenAvailWidth: scr.width,
          screenAvailHeight: scr.height - scr.availHeightOffset,
          screenColorDepth: 24,
          screenPixelDepth: 24,
          devicePixelRatio: scr.dpr,
          windowOuterWidth: scr.width,
          windowOuterHeight: scr.height - scr.availHeightOffset,
          windowInnerWidth: scr.width,
          windowInnerHeight: scr.height - scr.availHeightOffset - 80,
          screenX: 0,
          screenY: 0,
          language: localeInfo.language,
          languages: localeInfo.languages,
          doNotTrack: 'unspecified',
          cookieEnabled: true,
          webdriver: false,
          pdfViewerEnabled: true,
          webglVendor: os.webglVendor,
          webglRenderer: os.webglRenderer,
          webglVersion: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
          webglShadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
          timezone: timezone,
          timezoneOffset: getTimezoneOffset(timezone),
          latitude: ipData.lat,
          longitude: ipData.lon,
          accuracy: 100,
          prefersReducedMotion: false,
          prefersDarkMode: true,
          prefersContrast: 'no-preference',
          prefersReducedData: false,
          colorGamutSrgb: true,
          colorGamutP3: os.group === 'macOS' || os.group === 'iOS',
          colorGamutRec2020: false,
          hdrSupport: os.group === 'macOS' || os.group === 'iOS',
          audioSampleRate: os.group === 'macOS' || os.group === 'iOS' ? 44100 : 48000,
          audioMaxChannelCount: 2,
          localStorage: true,
          sessionStorage: true,
          indexedDb: true,
          canvasNoiseSeed: generateSeed(),
          fonts: JSON.stringify(os.fonts),
          plugins: getPluginsJson(browser.name),
          mimeTypes: getMimeTypes(),
          batteryCharging: os.batteryCharging ?? false,
          batteryChargingTime: os.batteryCharging ? 1800 : 0,
          batteryDischargingTime: os.batteryCharging ? Infinity : 7200,
          batteryLevel: os.batteryLevel ?? 1.0,
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
          id: `fp-${ipData.countryCode}-${shortHash(ipData.query)}-${String(idCounter).padStart(3, '0')}`,
          name: label,
          description: `${os.group} | ${browser.name} | ${timezone}`,
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
