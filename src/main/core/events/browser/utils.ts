import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export const POSSIBLE_BROWSER_PATHS = [
  '/usr/bin/donutbrowser',
  '/usr/bin/donut',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/snap/bin/google-chrome',
];

export const getDonutCoreVersion = () => {
  const homeDir = os.homedir();
  const basePath = path.join(homeDir, '.local/share/DonutBrowser/binaries/wayfern');
  if (!fs.existsSync(basePath)) return '0.0.0';

  try {
    const versions = fs.readdirSync(basePath);
    if (!versions || versions.length === 0) return '0.0.0';

    // Sort versions descending
    versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

    return versions[0];
  } catch (e) {
    console.error('Failed to find Donut Core Version:', e);
  }
  return '0.0.0';
};

export const getDonutCorePath = () => {
  const homeDir = os.homedir();
  const basePath = path.join(homeDir, '.local/share/DonutBrowser/binaries/wayfern');
  if (!fs.existsSync(basePath)) return null;

  try {
    const latestVersion = getDonutCoreVersion();
    if (latestVersion === '0.0.0') return null;

    const executablePath = path.join(basePath, latestVersion, 'chrome');
    if (fs.existsSync(executablePath)) {
      console.log(`[Donut] Found internal core: ${executablePath}`);
      return executablePath;
    }
  } catch (e) {
    console.error('Failed to find Donut Core:', e);
  }
  return null;
};

export function getExecutablePath(customPath?: string) {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  // Primary: Try to find Donut's internal Wayfern core
  const donutCore = getDonutCorePath();
  if (donutCore) return donutCore;

  // Fallback: System paths
  for (const p of POSSIBLE_BROWSER_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

export function getChromeStablePath() {
  const paths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/google-chrome',
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}
