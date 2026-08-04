import type { LocaleInfo } from './types';

// Mở rộng đến hầu hết các quốc gia mà ip-api trả về
export const COUNTRY_LOCALE_MAP: Record<string, LocaleInfo> = {
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
};

export const DEFAULT_LOCALE: LocaleInfo = {
  language: 'en-US',
  languages: ['en-US', 'en'],
  timezones: ['UTC'],
  region: 'global',
};

export function getLocaleInfo(countryCode: string): LocaleInfo {
  return COUNTRY_LOCALE_MAP[countryCode?.toUpperCase()] || DEFAULT_LOCALE;
}