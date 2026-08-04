/**
 * Random helpers with realistic variation for fingerprint diversity.
 */

/** Generate a random canvas noise seed */
export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/** Get timezone offset in minutes for a given IANA timezone */
export function getTimezoneOffset(tz: string): number {
  try {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    return (tzDate.getTime() - utcDate.getTime()) / 60000;
  } catch {
    return 0;
  }
}

/** GPS jitter: add ±50-200m random offset so not all fingerprints share identical coordinates */
export function jitterGps(lat: number, lon: number): { latitude: number; longitude: number } {
  // ~0.0005° ≈ 55m, ~0.002° ≈ 220m
  const jitter = () => (Math.random() - 0.5) * 0.003;
  return {
    latitude: parseFloat((lat + jitter()).toFixed(5)),
    longitude: parseFloat((lon + jitter()).toFixed(5)),
  };
}

/** Realistic Do Not Track values with weighted distribution */
export function randomDnt(): string {
  const r = Math.random();
  if (r < 0.15) return '1'; // 15% explicitly enabled
  if (r < 0.30) return '0'; // 15% explicitly disabled
  return 'unspecified'; // 70% default
}

/** Random dark mode preference (~45% dark, ~55% light) */
export function randomDarkMode(): boolean {
  return Math.random() < 0.45;
}

/** Random audio sample rate (most devices: 48000, some: 44100) */
export function randomAudioSampleRate(): number {
  return Math.random() < 0.75 ? 48000 : 44100;
}

export function getPluginsJson(browserName: string): string {
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

export function getMimeTypes(): string {
  return JSON.stringify([
    { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
    { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
    { type: 'application/x-pnacl', suffixes: '', description: 'Portable Native Client Executable' },
  ]);
}