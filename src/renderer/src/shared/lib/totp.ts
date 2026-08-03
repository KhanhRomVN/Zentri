import CryptoJS from 'crypto-js';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decode(secret: string): Uint8Array | null {
  try {
    const s = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
    if (s.length === 0) return null;
    const bits: number[] = [];
    for (let i = 0; i < s.length; i++) {
      const val = BASE32_ALPHABET.indexOf(s[i]);
      if (val === -1) return null;
      const b = val.toString(2).padStart(5, '0');
      for (let j = 0; j < 5; j++) bits.push(parseInt(b[j]));
    }
    const bytes: number[] = [];
    for (let i = 0; i + 7 < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte * 2) + bits[i + j];
      bytes.push(byte);
    }
    return new Uint8Array(bytes);
  } catch {
    return null;
  }
}

export function generateTotp(secret: string): string | null {
  const key = base32Decode(secret);
  if (!key || key.length === 0) return null;
  let counter = Math.floor(Date.now() / 1000 / 30);
  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter >>= 8;
  }
  const hmac = CryptoJS.HmacSHA1(
    CryptoJS.lib.WordArray.create(key),
    CryptoJS.lib.WordArray.create(counterBytes),
  );
  const hmacBytes = new Uint8Array(hmac.words.length * 4);
  for (let i = 0; i < hmac.words.length; i++) {
    const w = hmac.words[i];
    hmacBytes[i * 4] = (w >>> 24) & 0xff;
    hmacBytes[i * 4 + 1] = (w >>> 16) & 0xff;
    hmacBytes[i * 4 + 2] = (w >>> 8) & 0xff;
    hmacBytes[i * 4 + 3] = w & 0xff;
  }
  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
  const binCode =
    ((hmacBytes[offset] & 0x7f) * 16777216) +
    ((hmacBytes[offset + 1] & 0xff) * 65536) +
    ((hmacBytes[offset + 2] & 0xff) * 256) +
    (hmacBytes[offset + 3] & 0xff);
  return (binCode % 1000000).toString().padStart(6, '0');
}

export function isValidBase32(secret: string): boolean {
  return base32Decode(secret) !== null;
}

export const CODE_COLORS = [
  { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: 'rgb(217,119,6)' },
  { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', text: 'rgb(37,99,235)' },
  { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', text: 'rgb(124,58,237)' },
  { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: 'rgb(5,150,105)' },
  { bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.2)', text: 'rgb(219,39,119)' },
  { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', text: 'rgb(234,88,12)' },
];

export function getCodeColor(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash * 31) + code.charCodeAt(i)) | 0;
  }
  return CODE_COLORS[Math.abs(hash) % CODE_COLORS.length];
}