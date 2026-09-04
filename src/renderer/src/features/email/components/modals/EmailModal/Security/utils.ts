/**
 * Helpers + constants for SecurityTab scoring logic.
 */

import { getServiceById } from '../../../../../../constants/services';
import type { Account } from '../../../../types';

export function parseBackupCodes(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isValidTotp(value: string | null | undefined): boolean {
  return !!value && value.trim().length > 0;
}

export function passwordStrength(password: string | null | undefined): {
  score: number;
  warnings: string[];
} {
  if (!password || password.length === 0) {
    return { score: 0, warnings: ['Password is empty'] };
  }

  const warnings: string[] = [];
  let score = 0;

  if (password.length >= 12) score += 5;
  else if (password.length >= 8) score += 2;
  else warnings.push(`Password is short (${password.length} chars, minimum 12 recommended)`);

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const varietyCount = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  if (varietyCount >= 4) score += 5;
  else if (varietyCount >= 3) score += 4;
  else if (varietyCount >= 2) score += 2;

  if (!hasUpper) warnings.push('Missing uppercase letter');
  if (!hasDigit) warnings.push('Missing digit');
  if (!hasSpecial) warnings.push('Missing special character');

  return { score, warnings };
}

export function zoneForPct(pct: number): 'critical' | 'warn' | 'mid' | 'ok' {
  if (pct < 40) return 'critical';
  if (pct < 70) return 'warn';
  if (pct < 85) return 'mid';
  return 'ok';
}

export function getSecurityScore(account: Account): number {
  let score = 0;

  // Email 2FA (30)
  if (isValidTotp(account.totp)) score += 20;
  if (parseBackupCodes(account.backup_codes).length > 0) score += 10;

  // Service 2FA (25)
  let serviceScore = 0;
  for (const service of account.services || []) {
    const template = getServiceById(service.serviceId);
    if (!template?.two_fa) continue;
    const linkedTwoFa = (service as any).twoFa || {};
    if (template.two_fa.has_totp && isValidTotp(linkedTwoFa.totp)) serviceScore += 5;
    if (template.two_fa.has_backup_codes && (linkedTwoFa.backupCodes || []).length > 0)
      serviceScore += 2;
  }
  score += Math.min(serviceScore, 25);

  // Password & Recovery (25)
  const pw = passwordStrength(account.password);
  score += pw.score;
  if (account.recovery_email) score += 5;
  if (account.phone_number) score += 5;

  return Math.min(score, 100);
}

export const ZONE_STYLES: Record<string, { iconBg: string; score: string; fill: string }> = {
  critical: {
    iconBg: 'bg-red/10 text-red',
    score: 'text-red',
    fill: 'bg-gradient-to-r from-red to-pink',
  },
  warn: {
    iconBg: 'bg-warn/10 text-warn',
    score: 'text-warn',
    fill: 'bg-gradient-to-r from-warn to-yellow',
  },
  mid: {
    iconBg: 'bg-violet/10 text-violet',
    score: 'text-violet',
    fill: 'bg-gradient-to-r from-violet to-purple',
  },
  ok: {
    iconBg: 'bg-green/10 text-green',
    score: 'text-green',
    fill: 'bg-gradient-to-r from-green to-green',
  },
};
