import CryptoJS from 'crypto-js';

/**
 * Decodes a base32 string to a hex string
 */
function base32toHex(base32: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let hex = '';

  const cleanBase32 = base32.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');

  for (let i = 0; i < cleanBase32.length; i++) {
    const val = alphabet.indexOf(cleanBase32.charAt(i));
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substring(i, i + 4);
    hex = hex + parseInt(chunk, 2).toString(16);
  }

  return hex;
}

/**
 * Standard TOTP generation
 */
export function generateTOTP(secret: string): string {
  if (!secret) return '000000';

  try {
    const key = base32toHex(secret);
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const time = Math.floor(epoch / 30)
      .toString(16)
      .padStart(16, '0');

    const hmac = CryptoJS.HmacSHA1(CryptoJS.enc.Hex.parse(time), CryptoJS.enc.Hex.parse(key));
    const hmacHex = hmac.toString(CryptoJS.enc.Hex);

    const offset = parseInt(hmacHex.substring(hmacHex.length - 1), 16);
    const otp = (
      parseInt(hmacHex.substring(offset * 2, offset * 2 + 8), 16) & 0x7fffffff
    ).toString();

    return otp.substring(otp.length - 6).padStart(6, '0');
  } catch (e) {
    console.error('TOTP Generation Error:', e);
    return '000000';
  }
}

/**
 * Returns seconds remaining in current 30s window
 */
export function getTOTPTimeRemaining(): number {
  return 30 - (Math.round(new Date().getTime() / 1000.0) % 30);
}
