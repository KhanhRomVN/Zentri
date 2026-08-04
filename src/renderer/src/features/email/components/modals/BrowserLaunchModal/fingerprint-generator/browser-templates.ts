import type { BrowserTemplate } from './types';

/**
 * Build a UA segment for OS + CPU.
 * If cpu is empty, omits the "; cpu" part to avoid trailing spaces.
 */
function uaOsCpu(os: string, cpu: string): string {
  return cpu ? `${os}; ${cpu}` : os;
}

export const BROWSER_TEMPLATES: BrowserTemplate[] = [
  // Chrome
  {
    name: 'Chrome 143',
    brand: 'Google Chrome',
    brandVersion: '143',
    engineVersion: '143.0.0.0',
    appliesTo: 'all',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${uaOsCpu(os, cpu)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36`,
  },
  {
    name: 'Chrome 140',
    brand: 'Google Chrome',
    brandVersion: '140',
    engineVersion: '140.0.0.0',
    appliesTo: 'all',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${uaOsCpu(os, cpu)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36`,
  },
  {
    name: 'Chrome 130',
    brand: 'Google Chrome',
    brandVersion: '130',
    engineVersion: '130.0.0.0',
    appliesTo: 'all',
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${uaOsCpu(os, cpu)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36`,
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
      `Mozilla/5.0 (${uaOsCpu(os, cpu)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 Edg/${v}`,
  },
  {
    name: 'Edge 140',
    brand: 'Microsoft Edge',
    brandVersion: '140',
    engineVersion: '140.0.0.0',
    appliesTo: 'desktop',
    onlyOnGroups: ['Windows', 'macOS'],
    userAgentTemplate: (os, cpu, v) =>
      `Mozilla/5.0 (${uaOsCpu(os, cpu)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 Edg/${v}`,
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
      `Mozilla/5.0 (${uaOsCpu(os, cpu)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36 OPR/${v}`,
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
      `Mozilla/5.0 (${uaOsCpu(os, cpu)}) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/${v} Safari/537.36`,
  },
];