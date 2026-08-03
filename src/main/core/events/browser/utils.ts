import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export const POSSIBLE_BROWSER_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/snap/bin/google-chrome',
];

/**
 * Find the fingerprint-chromium browser (ungoogled-chromium with fingerprint patches).
 * Searches in ~/.local/share/Zentri/binaries/fingerprint-chromium/
 */
/**
 * Search for ungoogled-chromium-* directories in a given base path.
 * Returns the newest version found (sorted by directory name, descending).
 */
function findChromiumInDir(basePath: string): string | null {
  if (!fs.existsSync(basePath)) return null;

  try {
    const entries = fs.readdirSync(basePath);
    const chromiumDirs = entries
      .filter((e) => e.startsWith('ungoogled-chromium-'))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

    for (const dir of chromiumDirs) {
      const execPath = path.join(basePath, dir, 'chrome');
      if (fs.existsSync(execPath)) {
        console.log(`[FingerprintChromium] Found: ${execPath}`);
        return execPath;
      }
    }
  } catch (e) {
    console.error('[FingerprintChromium] Failed to search in', basePath, ':', e);
  }
  return null;
}

export function getFingerprintChromiumPath(): string | null {
  // Priority 1: System-installed at /opt/ungoogled-chromium/
  const optPath = '/opt/ungoogled-chromium/chrome';
  if (fs.existsSync(optPath)) {
    console.log(`[FingerprintChromium] Found: ${optPath}`);
    return optPath;
  }

  // Priority 2: Project directory (CWD) — for development
  const cwdResult = findChromiumInDir(process.cwd());
  if (cwdResult) return cwdResult;

  // Priority 3: Local binaries directory
  const homeDir = os.homedir();
  const localBinPath = path.join(homeDir, '.local/share/Zentri/binaries/fingerprint-chromium');
  const localResult = findChromiumInDir(localBinPath);
  if (localResult) return localResult;

  return null;
}

export function getExecutablePath(customPath?: string) {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  // Priority 1: Fingerprint Chromium (free, patched for fingerprint)
  const fpChromium = getFingerprintChromiumPath();
  if (fpChromium) return fpChromium;

  // Priority 2: System paths
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
