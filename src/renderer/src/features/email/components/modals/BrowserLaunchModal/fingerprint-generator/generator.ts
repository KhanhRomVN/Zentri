import type { IpApiResponse } from './types';
import { getLocaleInfo } from './locales';
import { OS_TEMPLATES } from './os-templates';
import { BROWSER_TEMPLATES } from './browser-templates';
import {
  generateSeed,
  getTimezoneOffset,
  jitterGps,
  randomDnt,
  randomDarkMode,
  randomAudioSampleRate,
  getPluginsJson,
  getMimeTypes,
} from './helpers';
import { Fingerprint } from '../../fingerprint';

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
      if (b.onlyOnGroups && !b.onlyOnGroups.includes(os.group)) return false;
      if (b.appliesTo === 'desktop' && os.isMobile) return false;
      if (b.appliesTo === 'mobile' && !os.isMobile) return false;
      return true;
    });

    for (const browser of browsers) {
      const version = browser.engineVersion.split('.')[0];

      for (const scr of os.screens) {
        // ── Build UA os segment with correct Windows NT version ──────
        const uaOs = buildUaOs(os);

        // cpuArch: empty for ARM (mobile), 'x64' for desktop
        const cpuArch = os.oscpu.includes('arm') ? '' : 'x64';
        const userAgent = browser.userAgentTemplate(uaOs, cpuArch, version);

        const appVersion = browser.name.startsWith('Firefox')
          ? `5.0 (${uaOs})`
          : `5.0 (${uaOs}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;

        const label = `${os.label} • ${browser.name} • ${scr.width}×${scr.height}`;

        // ── GPS jitter ──────────────────────────────────────────────
        const gps = jitterGps(ipData.lat, ipData.lon);

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
          doNotTrack: randomDnt(),
          cookieEnabled: true,
          webdriver: false,
          pdfViewerEnabled: true,
          webglVendor: os.webglVendor,
          webglRenderer: os.webglRenderer,
          webglVersion: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
          webglShadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
          timezone: timezone,
          timezoneOffset: getTimezoneOffset(timezone),
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: 100,
          prefersReducedMotion: false,
          prefersDarkMode: randomDarkMode(),
          prefersContrast: 'no-preference',
          prefersReducedData: false,
          colorGamutSrgb: true,
          colorGamutP3: os.group === 'macOS' || os.group === 'iOS',
          colorGamutRec2020: false,
          hdrSupport: os.group === 'macOS' || os.group === 'iOS',
          audioSampleRate: randomAudioSampleRate(),
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
          id: `fp-${ipData.countryCode}-${String(idCounter).padStart(3, '0')}`,
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

/**
 * Build the OS segment for the User-Agent string.
 * Uses `windowsNtVersion` when available to avoid the bug where
 * Chromium's platformVersion (e.g. "14.0.0") was incorrectly used
 * as the Windows NT version.
 */
function buildUaOs(os: (typeof OS_TEMPLATES)[number]): string {
  // iOS
  if (os.group === 'iOS') {
    return `iPhone; CPU iPhone OS ${os.platformVersion.replace(/\./g, '_')} like Mac OS X`;
  }

  // Android — device model from label or generic
  if (os.group === 'Android') {
    const androidVersion = os.platformVersion.split('.')[0];
    const deviceModel = os.label.includes('Pixel')
      ? 'Pixel 7'
      : os.label.includes('Xiaomi')
        ? 'Redmi Note 12'
        : os.label.includes('Galaxy A')
          ? 'SM-A145F'
          : 'SM-S911B';
    return `Linux; Android ${androidVersion}; ${deviceModel}`;
  }

  // Windows — use windowsNtVersion (correct NT version, not Chromium platform version)
  if (os.oscpu.includes('Windows')) {
    const ntVer = os.windowsNtVersion || '10.0';
    return `Windows NT ${ntVer}; Win64; x64`;
  }

  // macOS
  if (os.oscpu.includes('Mac')) {
    return 'Macintosh; Intel Mac OS X 10_15_7';
  }

  // Linux
  return 'X11; Linux x86_64';
}
