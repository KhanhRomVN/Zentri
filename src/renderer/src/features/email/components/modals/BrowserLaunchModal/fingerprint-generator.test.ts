import { generateFingerprints, IpApiResponse } from '../fingerprint-generator';
import type { Fingerprint, FingerprintConfig } from '../fingerprint';

// ── Mock IP data từ nhiều quốc gia / khu vực khác nhau ────────────────

interface IpTestCase {
  label: string;
  data: IpApiResponse;
}

const IP_TEST_CASES: IpTestCase[] = [
  // ── Bắc Mỹ ──
  {
    label: 'US - Mountain View, CA (Google)',
    data: {
      status: 'success', country: 'United States', countryCode: 'US',
      region: 'CA', regionName: 'California', city: 'Mountain View',
      zip: '94043', lat: 37.4192, lon: -122.0574,
      timezone: 'America/Los_Angeles', isp: 'Google LLC',
      org: 'Google', as: 'AS15169 Google LLC', query: '8.8.8.8',
    },
  },
  {
    label: 'US - New York, NY',
    data: {
      status: 'success', country: 'United States', countryCode: 'US',
      region: 'NY', regionName: 'New York', city: 'New York City',
      zip: '10001', lat: 40.7128, lon: -74.006,
      timezone: 'America/New_York', isp: 'Verizon',
      org: 'Verizon', as: 'AS701 Verizon', query: '4.4.4.4',
    },
  },
  {
    label: 'CA - Toronto',
    data: {
      status: 'success', country: 'Canada', countryCode: 'CA',
      region: 'ON', regionName: 'Ontario', city: 'Toronto',
      zip: 'M5A', lat: 43.6532, lon: -79.3832,
      timezone: 'America/Toronto', isp: 'Bell Canada',
      org: 'Bell', as: 'AS577 Bell', query: '1.1.1.1',
    },
  },
  // ── Châu Âu ──
  {
    label: 'DE - Berlin',
    data: {
      status: 'success', country: 'Germany', countryCode: 'DE',
      region: 'BE', regionName: 'Berlin', city: 'Berlin',
      zip: '10115', lat: 52.5200, lon: 13.405,
      timezone: 'Europe/Berlin', isp: 'Deutsche Telekom',
      org: 'DTAG', as: 'AS3320 DTAG', query: '2.2.2.2',
    },
  },
  {
    label: 'FR - Paris',
    data: {
      status: 'success', country: 'France', countryCode: 'FR',
      region: 'IDF', regionName: 'Ile-de-France', city: 'Paris',
      zip: '75001', lat: 48.8566, lon: 2.3522,
      timezone: 'Europe/Paris', isp: 'Orange',
      org: 'Orange', as: 'AS3215 Orange', query: '9.9.9.9',
    },
  },
  {
    label: 'GB - London',
    data: {
      status: 'success', country: 'United Kingdom', countryCode: 'GB',
      region: 'ENG', regionName: 'England', city: 'London',
      zip: 'EC1A', lat: 51.5074, lon: -0.1278,
      timezone: 'Europe/London', isp: 'BT',
      org: 'BT', as: 'AS2856 BT', query: '3.3.3.3',
    },
  },
  {
    label: 'RU - Moscow',
    data: {
      status: 'success', country: 'Russia', countryCode: 'RU',
      region: 'MOW', regionName: 'Moscow', city: 'Moscow',
      zip: '101000', lat: 55.7558, lon: 37.6173,
      timezone: 'Europe/Moscow', isp: 'Rostelecom',
      org: 'Rostelecom', as: 'AS12389 RT', query: '5.5.5.5',
    },
  },
  // ── Châu Á ──
  {
    label: 'JP - Tokyo',
    data: {
      status: 'success', country: 'Japan', countryCode: 'JP',
      region: '13', regionName: 'Tokyo', city: 'Tokyo',
      zip: '100-0001', lat: 35.6762, lon: 139.6503,
      timezone: 'Asia/Tokyo', isp: 'NTT',
      org: 'NTT', as: 'AS4713 NTT', query: '6.6.6.6',
    },
  },
  {
    label: 'KR - Seoul',
    data: {
      status: 'success', country: 'South Korea', countryCode: 'KR',
      region: '11', regionName: 'Seoul', city: 'Seoul',
      zip: '04524', lat: 37.5665, lon: 126.978,
      timezone: 'Asia/Seoul', isp: 'KT',
      org: 'KT', as: 'AS4766 KT', query: '7.7.7.7',
    },
  },
  {
    label: 'IN - Mumbai',
    data: {
      status: 'success', country: 'India', countryCode: 'IN',
      region: 'MH', regionName: 'Maharashtra', city: 'Mumbai',
      zip: '400001', lat: 19.076, lon: 72.8777,
      timezone: 'Asia/Kolkata', isp: 'Jio',
      org: 'Jio', as: 'AS55836 Jio', query: '10.10.10.10',
    },
  },
  {
    label: 'VN - Ho Chi Minh City',
    data: {
      status: 'success', country: 'Vietnam', countryCode: 'VN',
      region: 'SG', regionName: 'Ho Chi Minh', city: 'Ho Chi Minh City',
      zip: '700000', lat: 10.8231, lon: 106.6297,
      timezone: 'Asia/Ho_Chi_Minh', isp: 'VNPT',
      org: 'VNPT', as: 'AS45899 VNPT', query: '14.14.14.14',
    },
  },
  // ── Châu Đại Dương ──
  {
    label: 'AU - Sydney',
    data: {
      status: 'success', country: 'Australia', countryCode: 'AU',
      region: 'NSW', regionName: 'New South Wales', city: 'Sydney',
      zip: '2000', lat: -33.8688, lon: 151.2093,
      timezone: 'Australia/Sydney', isp: 'Telstra',
      org: 'Telstra', as: 'AS1221 Telstra', query: '11.11.11.11',
    },
  },
  // ── Nam Mỹ ──
  {
    label: 'BR - Sao Paulo',
    data: {
      status: 'success', country: 'Brazil', countryCode: 'BR',
      region: 'SP', regionName: 'Sao Paulo', city: 'Sao Paulo',
      zip: '01000-000', lat: -23.5505, lon: -46.6333,
      timezone: 'America/Sao_Paulo', isp: 'Vivo',
      org: 'Vivo', as: 'AS10429 Vivo', query: '12.12.12.12',
    },
  },
  // ── Trung Đông ──
  {
    label: 'AE - Dubai',
    data: {
      status: 'success', country: 'United Arab Emirates', countryCode: 'AE',
      region: 'DU', regionName: 'Dubai', city: 'Dubai',
      zip: '00000', lat: 25.2048, lon: 55.2708,
      timezone: 'Asia/Dubai', isp: 'Etisalat',
      org: 'Etisalat', as: 'AS5384 Etisalat', query: '13.13.13.13',
    },
  },
  // ── Châu Phi ──
  {
    label: 'ZA - Johannesburg',
    data: {
      status: 'success', country: 'South Africa', countryCode: 'ZA',
      region: 'GP', regionName: 'Gauteng', city: 'Johannesburg',
      zip: '2000', lat: -26.2041, lon: 28.0473,
      timezone: 'Africa/Johannesburg', isp: 'Vodacom',
      org: 'Vodacom', as: 'AS29975 Vodacom', query: '15.15.15.15',
    },
  },
];

// ── Verification types ─────────────────────────────────────────────────

type Severity = 'ERROR' | 'WARN' | 'INFO';

interface Issue {
  severity: Severity;
  fingerprintId: string;
  fingerprintName: string;
  field: string;
  message: string;
  expected?: string;
  actual?: string;
}

interface TestResult {
  label: string;
  countryCode: string;
  fingerprintCount: number;
  issues: Issue[];
  errors: number;
  warnings: number;
}

// ── Helpers ────────────────────────────────────────────────────────────

function checkUA(ua: string | undefined): string | null {
  if (!ua) return 'UserAgent is empty';
  if (ua.length < 20) return 'UserAgent qua ngan - co the bi phat hien la bot';
  if (ua.includes('HeadlessChrome')) return 'HeadlessChrome detected';
  if (/Bot|Crawler|Spider|scraper|phantom|selenium|puppeteer|playwright/i.test(ua)) {
    return 'UA chua tu khoa automation/bot';
  }
  return null;
}

function checkScreen(c: FingerprintConfig): string[] {
  const out: string[] = [];
  const sh = c.screenHeight ?? 0;
  const sw = c.screenWidth ?? 0;
  const sah = c.screenAvailHeight ?? 0;
  const saw = c.screenAvailWidth ?? 0;
  const woh = c.windowOuterHeight ?? 0;
  const wow = c.windowOuterWidth ?? 0;
  const wih = c.windowInnerHeight ?? 0;
  const wiw = c.windowInnerWidth ?? 0;
  if (sh <= 0 || sw <= 0) out.push('Screen width/height = 0');
  if (sah > sh) out.push('screenAvailHeight > screenHeight');
  if (saw > sw) out.push('screenAvailWidth > screenWidth');
  if (woh > sah) out.push('windowOuterHeight > screenAvailHeight');
  if (wow > saw) out.push('windowOuterWidth > screenAvailWidth');
  if (wih > woh) out.push('windowInnerHeight > windowOuterHeight');
  if (wiw > wow) out.push('windowInnerWidth > windowOuterWidth');
  if (wih <= 0 || wiw <= 0) out.push('Window inner = 0');
  if ((c.devicePixelRatio ?? 0) <= 0) out.push('devicePixelRatio <= 0');
  return out;
}

function checkRequired(c: FingerprintConfig): string[] {
  const out: string[] = [];
  const fields: [string, unknown][] = [
    ['userAgent', c.userAgent], ['platform', c.platform], ['oscpu', c.oscpu],
    ['language', c.language], ['timezone', c.timezone],
    ['webglVendor', c.webglVendor], ['webglRenderer', c.webglRenderer],
    ['canvasNoiseSeed', c.canvasNoiseSeed], ['fonts', c.fonts],
  ];
  for (const [k, v] of fields) {
    if (v === undefined || v === null || v === '') out.push('Required "' + k + '" empty');
  }
  return out;
}

function checkPlatform(c: FingerprintConfig): string[] {
  const out: string[] = [];
  const p = c.platform ?? '';
  const o = c.oscpu ?? '';
  if (p === 'Win32' && !o.includes('Windows')) out.push('Win32 but oscpu lacks Windows');
  if (p === 'MacIntel' && !o.includes('Mac')) out.push('MacIntel but oscpu lacks Mac');
  if (p.includes('Linux') && !o.includes('Linux')) out.push('Linux platform but oscpu lacks Linux');
  return out;
}

function checkBattery(c: FingerprintConfig): string[] {
  const out: string[] = [];
  if (c.batteryCharging && (c.batteryLevel ?? 1) <= 0) out.push('batteryCharging=true, level<=0');
  if (c.batteryLevel !== undefined && (c.batteryLevel < 0 || c.batteryLevel > 1)) {
    out.push('batteryLevel=' + c.batteryLevel + ' ngoai [0,1]');
  }
  return out;
}

function checkHardware(c: FingerprintConfig): string[] {
  const out: string[] = [];
  if ((c.hardwareConcurrency ?? 0) < 1) out.push('hardwareConcurrency < 1');
  if ((c.deviceMemory ?? 0) < 1) out.push('deviceMemory < 1');
  if ((c.maxTouchPoints ?? -1) < 0) out.push('maxTouchPoints < 0');
  return out;
}

// ── ANTI-BOT checks ────────────────────────────────────────────────────

function checkFonts(fp: Fingerprint, c: FingerprintConfig): string[] {
  const out: string[] = [];
  const fonts = c.fonts ?? '[]';
  const g = fp.group ?? '';
  if (g === 'Windows' && !fonts.includes('Segoe UI')) {
    out.push('Windows thieu font Segoe UI - red flag');
  }
  if (g === 'macOS' && !fonts.includes('Helvetica') && !fonts.includes('SF Pro')) {
    out.push('macOS thieu font Helvetica/SF Pro');
  }
  if (g !== 'Windows' && fonts.includes('Segoe UI')) {
    out.push('Font Segoe UI (Windows-only) xuat hien tren non-Windows');
  }
  if (g !== 'macOS' && g !== 'iOS' && (fonts.includes('SF Pro') || fonts.includes('Apple Color Emoji'))) {
    out.push('Font Apple xuat hien tren non-Apple OS');
  }
  return out;
}

function checkAudio(fp: Fingerprint, c: FingerprintConfig): string[] {
  const out: string[] = [];
  const g = fp.group ?? '';
  const sr = c.audioSampleRate;
  if (g === 'macOS' && sr === 48000) out.push('[WARN] macOS thuong 44100Hz, dang 48000');
  if ((g === 'Windows' || g === 'Linux') && sr === 44100) out.push('[WARN] Win/Linux thuong 48000Hz, dang 44100');
  return out;
}

function checkVendor(fp: Fingerprint, c: FingerprintConfig): string[] {
  const out: string[] = [];
  const vendor = c.vendor ?? '';
  const g = fp.group ?? '';
  const browser = fp.browser ?? '';
  if ((g === 'macOS' || g === 'iOS') && vendor !== 'Apple Computer, Inc.' && vendor !== 'Apple Inc.') {
    out.push('Apple OS nhung vendor=' + vendor);
  }
  if (browser.includes('Chrome') && g !== 'macOS' && g !== 'iOS' && vendor !== 'Google Inc.') {
    out.push('Chrome non-Apple nhung vendor=' + vendor);
  }
  return out;
}

function checkWebGL(fp: Fingerprint, c: FingerprintConfig): string[] {
  const out: string[] = [];
  const g = fp.group ?? '';
  const wv = c.webglVendor ?? '';
  const wr = c.webglRenderer ?? '';
  if ((g === 'macOS' || g === 'iOS') && !wv.includes('Apple') && !wr.includes('Apple')) {
    out.push('Apple OS nhung WebGL khong co Apple');
  }
  if (g === 'Windows' && wv.includes('Apple')) out.push('Windows + Apple WebGL - impossible');
  if (g === 'Android' && wv.includes('Apple')) out.push('Android + Apple WebGL - impossible');
  return out;
}

function checkTzOffset(c: FingerprintConfig): string[] {
  const out: string[] = [];
  const tz = c.timezone;
  const offset = c.timezoneOffset;
  if (!tz || offset === undefined || offset === null) return out;
  try {
    var now = new Date();
    var utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
    var tzStr = now.toLocaleString('en-US', { timeZone: tz });
    var expected = (new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 60000;
    if (Math.abs(expected - offset) > 2) {
      out.push('tzOffset=' + offset + ' nhung tinh tu "' + tz + '" ra ~' + expected);
    }
  } catch (_e) {
    out.push('Khong tinh duoc offset tu "' + tz + '"');
  }
  return out;
}

function checkCanvasSeed(c: FingerprintConfig): string[] {
  const out: string[] = [];
  const seed = c.canvasNoiseSeed ?? '';
  if (seed.length < 10) out.push('canvasNoiseSeed qua ngan <10');
  if (seed.length >= 10 && /^(.)\1+$/.test(seed)) out.push('canvasNoiseSeed lap - khong ngau nhien');
  return out;
}

// ── Main verifier ──────────────────────────────────────────────────────

function verifyFingerprints(ipData: IpApiResponse, fingerprints: Fingerprint[]): Issue[] {
  var issues: Issue[] = [];

  for (var _i = 0; _i < fingerprints.length; _i++) {
    var fp = fingerprints[_i];
    var c = fp.config;
    var id = fp.id;
    var name = fp.name;

    // 1. GPS
    if (c.latitude !== ipData.lat || c.longitude !== ipData.lon) {
      issues.push({
        severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'GPS',
        message: 'GPS khong khop IP',
        expected: '(' + ipData.lat + ', ' + ipData.lon + ')',
        actual: '(' + c.latitude + ', ' + c.longitude + ')',
      });
    }

    // 2. Timezone
    if (c.timezone !== ipData.timezone) {
      issues.push({
        severity: 'WARN', fingerprintId: id, fingerprintName: name, field: 'timezone',
        message: 'Timezone khong khop IP', expected: ipData.timezone, actual: c.timezone,
      });
    }

    // 3. TZ offset
    if (c.timezoneOffset === undefined || c.timezoneOffset === null) {
      issues.push({
        severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'timezoneOffset',
        message: 'timezoneOffset undefined/null',
      });
    }

    // 4. ID format: fp-{CC}-{hash6}-{NNN}
    var idPat = new RegExp('^fp-' + ipData.countryCode + '-[a-z0-9]{6}-\\d{3}$');
    if (!idPat.test(fp.id)) {
      issues.push({
        severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'id',
        message: 'ID sai pattern fp-' + ipData.countryCode + '-{hash6}-{NNN}', actual: id,
      });
    }

    // 5. webdriver
    if (c.webdriver !== false) {
      issues.push({
        severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'webdriver',
        message: 'webdriver != false', actual: String(c.webdriver),
      });
    }

    // 6. UA
    var uaMsg = checkUA(c.userAgent);
    if (uaMsg) {
      issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'userAgent', message: uaMsg });
    }

    // 7. Required
    var reqs = checkRequired(c);
    for (var ri = 0; ri < reqs.length; ri++) {
      issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'required', message: reqs[ri] });
    }

    // 8. Screen
    var scrs = checkScreen(c);
    for (var si = 0; si < scrs.length; si++) {
      issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'screen', message: scrs[si] });
    }

    // 9. Platform
    var plats = checkPlatform(c);
    for (var pi = 0; pi < plats.length; pi++) {
      issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'platform', message: plats[pi] });
    }

    // 10. Battery
    var bats = checkBattery(c);
    for (var bi = 0; bi < bats.length; bi++) {
      issues.push({ severity: 'WARN', fingerprintId: id, fingerprintName: name, field: 'battery', message: bats[bi] });
    }

    // 11. Hardware
    var hws = checkHardware(c);
    for (var hi = 0; hi < hws.length; hi++) {
      issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'hardware', message: hws[hi] });
    }

    // 12. Browser/OS
    if (fp.os && fp.browser) {
      if (fp.browser.includes('Safari') && !fp.os.includes('Mac') && !fp.os.includes('iPhone')) {
        issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'browser+os', message: 'Safari khong phai macOS/iOS: ' + fp.os });
      }
      if (fp.browser.includes('Edge') && fp.group !== 'Windows' && fp.group !== 'macOS') {
        issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'browser+os', message: 'Edge khong phai Win/Mac: ' + fp.group });
      }
      if (fp.browser.includes('Samsung Internet') && fp.group !== 'Android') {
        issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'browser+os', message: 'Samsung Internet khong phai Android: ' + fp.group });
      }
      if (fp.browser.includes('Firefox') && fp.group !== 'Windows' && fp.group !== 'macOS' && fp.group !== 'Linux') {
        issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'browser+os', message: 'Firefox khong phai desktop: ' + fp.group });
      }
    }

    // ── ANTI-BOT 13-18 ──

    // 13. Fonts
    var fontIssues = checkFonts(fp, c);
    for (var fi = 0; fi < fontIssues.length; fi++) {
      var msg = fontIssues[fi];
      var sevFont: Severity = msg.startsWith('[WARN]') ? 'WARN' : 'ERROR';
      issues.push({ severity: sevFont, fingerprintId: id, fingerprintName: name, field: 'anti-bot:font', message: msg.replace('[WARN] ', '') });
    }

    // 14. Audio
    var audioIssues = checkAudio(fp, c);
    for (var ai = 0; ai < audioIssues.length; ai++) {
      issues.push({ severity: 'WARN', fingerprintId: id, fingerprintName: name, field: 'anti-bot:audio', message: audioIssues[ai].replace('[WARN] ', '') });
    }

    // 15. Vendor
    var vendIssues = checkVendor(fp, c);
    for (var vi = 0; vi < vendIssues.length; vi++) {
      issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'anti-bot:vendor', message: vendIssues[vi] });
    }

    // 16. WebGL
    var wglIssues = checkWebGL(fp, c);
    for (var wi = 0; wi < wglIssues.length; wi++) {
      issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'anti-bot:webgl', message: wglIssues[wi] });
    }

    // 17. TZ offset
    var tzoIssues = checkTzOffset(c);
    for (var ti = 0; ti < tzoIssues.length; ti++) {
      issues.push({ severity: 'ERROR', fingerprintId: id, fingerprintName: name, field: 'anti-bot:tz-offset', message: tzoIssues[ti] });
    }

    // 18. Canvas seed
    var seedIssues = checkCanvasSeed(c);
    for (var sdi = 0; sdi < seedIssues.length; sdi++) {
      issues.push({ severity: 'WARN', fingerprintId: id, fingerprintName: name, field: 'anti-bot:canvas-seed', message: seedIssues[sdi] });
    }
  }

  return issues;
}

// ── Runner ─────────────────────────────────────────────────────────────

function runAllTests(): Map<string, TestResult> {
  var results = new Map<string, TestResult>();

  for (var t = 0; t < IP_TEST_CASES.length; t++) {
    var tc = IP_TEST_CASES[t];
    var fps = generateFingerprints(tc.data);
    var issues = verifyFingerprints(tc.data, fps);
    var errs = 0;
    var warns = 0;
    for (var j = 0; j < issues.length; j++) {
      if (issues[j].severity === 'ERROR') errs++;
      else if (issues[j].severity === 'WARN') warns++;
    }

    results.set(tc.label, {
      label: tc.label,
      countryCode: tc.data.countryCode,
      fingerprintCount: fps.length,
      issues: issues,
      errors: errs,
      warnings: warns,
    });
  }

  return results;
}

// ── Printer ────────────────────────────────────────────────────────────

function printReport(results: Map<string, TestResult>): void {
  var totalFps = 0, totalErrors = 0, totalWarns = 0;
  var allIssues: { label: string; issue: Issue }[] = [];

  console.log('\n' + '='.repeat(64));
  console.log('  FINGERPRINT VERIFICATION REPORT');
  console.log('='.repeat(64) + '\n');

  results.forEach(function (r, label) {
    totalFps += r.fingerprintCount;
    totalErrors += r.errors;
    totalWarns += r.warnings;
    var icon = r.errors === 0 ? 'OK' : 'FAIL';
    var extra = r.warnings > 0 ? ' (' + r.warnings + 'w)' : '';
    console.log('  ' + icon + ' ' + label + ' (' + r.countryCode + ') -> ' + r.fingerprintCount + ' fp, ' + r.errors + ' err' + extra);
    for (var i = 0; i < r.issues.length; i++) {
      allIssues.push({ label: label, issue: r.issues[i] });
    }
  });

  console.log('\n' + '-'.repeat(48));
  console.log('  IPs: ' + results.size + '  |  FPs: ' + totalFps + '  |  Errors: ' + totalErrors + '  |  Warnings: ' + totalWarns);
  console.log('-'.repeat(48) + '\n');

  if (allIssues.length > 0) {
    var errs = allIssues.filter(function (x) { return x.issue.severity === 'ERROR'; });
    var warns = allIssues.filter(function (x) { return x.issue.severity === 'WARN'; });

    if (errs.length > 0) {
      console.log('ERRORS (' + errs.length + '):');
      for (var ei = 0; ei < errs.length; ei++) {
        var e = errs[ei].issue;
        console.log('  [' + e.field + '] ' + e.fingerprintId + ' - ' + e.message);
        if (e.expected) console.log('    Expected: ' + e.expected);
        if (e.actual) console.log('    Actual:   ' + e.actual);
        console.log('    Source: ' + errs[ei].label);
      }
    }

    if (warns.length > 0) {
      console.log('\nWARNINGS (' + warns.length + '):');
      for (var wi = 0; wi < warns.length; wi++) {
        var w = warns[wi].issue;
        console.log('  [' + w.field + '] ' + w.fingerprintId + ' - ' + w.message);
        console.log('    Source: ' + warns[wi].label);
      }
    }
  }

  // Cross-test ID uniqueness
  console.log('\nID Uniqueness:');
  var idSet = new Set<string>();
  var dupIds: string[] = [];
  for (var dt = 0; dt < IP_TEST_CASES.length; dt++) {
    var fps = generateFingerprints(IP_TEST_CASES[dt].data);
    for (var fi = 0; fi < fps.length; fi++) {
      if (idSet.has(fps[fi].id)) {
        dupIds.push(fps[fi].id);
      } else {
        idSet.add(fps[fi].id);
      }
    }
  }
  if (dupIds.length > 0) {
    console.log('  FAIL: ' + dupIds.length + ' duplicate IDs');
  } else {
    console.log('  OK: All ' + idSet.size + ' IDs unique across ' + IP_TEST_CASES.length + ' test cases');
  }
  console.log('\n' + '='.repeat(64) + '\n');
}

// ── Entry ──────────────────────────────────────────────────────────────

var results = runAllTests();
printReport(results);

export { IP_TEST_CASES, verifyFingerprints, runAllTests, printReport };
export type { IpTestCase, TestResult, Issue };