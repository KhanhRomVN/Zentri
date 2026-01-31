import { Website } from './types';

export const HARDCODED_PLATFORMS: Website[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://facebook.com',
    color: '#3b82f6', // blue-500
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
  {
    id: 'google',
    name: 'Google',
    url: 'https://google.com',
    color: '#ef4444', // red-500
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'recoveryEmail', label: 'Recovery', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://instagram.com',
    color: '#ec4899', // pink-500
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    url: 'https://tiktok.com',
    color: '#000000', // black
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    url: 'https://x.com',
    color: '#64748b', // slate-500
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
  {
    id: 'discord',
    name: 'Discord',
    color: '#6366f1', // indigo-500
    url: 'https://discord.com',
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
];

export const USER_AGENTS = [
  // Desktop
  {
    label: 'Chrome (Windows)',
    value:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    group: 'Desktop',
    os: 'Windows',
  },
  {
    label: 'Chrome (Mac)',
    value:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    group: 'Desktop',
    os: 'macOS',
  },
  {
    label: 'Firefox (Windows)',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    group: 'Desktop',
    os: 'Windows',
  },
  {
    label: 'Firefox (Mac)',
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
    group: 'Desktop',
    os: 'macOS',
  },
  {
    label: 'Safari (Mac)',
    value:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    group: 'Desktop',
    os: 'macOS',
  },
  {
    label: 'Edge (Windows)',
    value:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    group: 'Desktop',
    os: 'Windows',
  },
  {
    label: 'Opera (Windows)',
    value:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
    group: 'Desktop',
    os: 'Windows',
  },
  // Mobile
  {
    label: 'Safari (iPhone)',
    value:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    group: 'Mobile',
    os: 'iOS',
  },
  {
    label: 'Safari (iPad)',
    value:
      'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    group: 'Mobile',
    os: 'iOS',
  },
  {
    label: 'Chrome (Android)',
    value:
      'Mozilla/5.0 (Linux; Android 14; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36',
    group: 'Mobile',
    os: 'Android',
  },
  {
    label: 'Firefox (Android)',
    value: 'Mozilla/5.0 (Android 14; Mobile; rv:109.0) Gecko/121.0 Firefox/121.0',
    group: 'Mobile',
    os: 'Android',
  },
  {
    label: 'Samsung Internet (Android)',
    value:
      'Mozilla/5.0 (Linux; Android 14; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.5790.166 Mobile Safari/537.36',
    group: 'Mobile',
    os: 'Android',
  },
];

export const RESOLUTIONS = [
  // Desktop
  { label: '1920x1080 (FHD)', value: '1920x1080', group: 'Desktop' },
  { label: '1366x768 (HD)', value: '1366x768', group: 'Desktop' },
  { label: '1440x900 (WXGA+)', value: '1440x900', group: 'Desktop' },
  { label: '1536x864', value: '1536x864', group: 'Desktop' },
  { label: '2560x1440 (2K)', value: '2560x1440', group: 'Desktop' },
  { label: '3840x2160 (4K)', value: '3840x2160', group: 'Desktop' },
  // Mobile
  { label: '390x844 (iPhone 12/13/14)', value: '390x844', group: 'Mobile' },
  { label: '375x667 (iPhone SE)', value: '375x667', group: 'Mobile' },
  { label: '414x896 (iPhone XR/11)', value: '414x896', group: 'Mobile' },
];

export const LANGUAGES = [
  { label: 'English (US)', value: 'en-US', code: 'US' },
  { label: 'English (UK)', value: 'en-GB', code: 'GB' },
  { label: 'Vietnamese', value: 'vi-VN', code: 'VN' },
  { label: 'Chinese (Simplified)', value: 'zh-CN', code: 'CN' },
  { label: 'Japanese', value: 'ja-JP', code: 'JP' },
  { label: 'Korean', value: 'ko-KR', code: 'KR' },
  { label: 'Russian', value: 'ru-RU', code: 'RU' },
  { label: 'French', value: 'fr-FR', code: 'FR' },
  { label: 'German', value: 'de-DE', code: 'DE' },
  { label: 'Spanish', value: 'es-ES', code: 'ES' },
];

export const TIMEZONES = [
  { label: '(UTC-08:00) Pacific Time (US & Canada)', value: 'America/Los_Angeles' },
  { label: '(UTC-05:00) Eastern Time (US & Canada)', value: 'America/New_York' },
  { label: '(UTC+00:00) UTC', value: 'UTC' },
  { label: '(UTC+01:00) London', value: 'Europe/London' },
  { label: '(UTC+01:00) Paris', value: 'Europe/Paris' },
  { label: '(UTC+02:00) Berlin', value: 'Europe/Berlin' },
  { label: '(UTC+03:00) Moscow', value: 'Europe/Moscow' },
  { label: '(UTC+07:00) Bangkok, Hanoi, Jakarta', value: 'Asia/Bangkok' },
  { label: '(UTC+08:00) Beijing, Chongqing, Hong Kong', value: 'Asia/Shanghai' },
  { label: '(UTC+09:00) Tokyo', value: 'Asia/Tokyo' },
  { label: '(UTC+09:00) Seoul', value: 'Asia/Seoul' },
  { label: '(UTC+10:00) Sydney', value: 'Australia/Sydney' },
];
