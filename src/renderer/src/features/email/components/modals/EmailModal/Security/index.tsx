/**
 * ------------------------------------------------------------------
 * SecurityTab
 * ------------------------------------------------------------------
 * Security posture panel for an email account. Evaluates security
 * across 4 dimensions and renders a PHANTOMA-style dashboard.
 *
 * Scoring: 0–100 with weighted sections.
 *   - Email 2FA:        30 (TOTP 20 + backup codes 10)
 *   - Service 2FA:      25 (capped)
 *   - Fingerprint/IP:   20 (deduct on anomalies)
 *   - Password/Recovery: 25 (password 15 + recovery 10)
 *
 * Structure (separated by box):
 *   - ScoreGauge.tsx      — circular gauge + risk pill
 *   - ScoreBreakdown.tsx  — 2×2 zone cards
 *   - WarningsList.tsx    — severity-coded warnings
 *   - EmailSecurity.tsx   — checklist rows
 *   - Service2FA.tsx      — service 2FA list + filter
 *   - types.ts            — shared interfaces
 *   - utils.ts            — helpers + constants
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';

// ── UI ──
import { Globe, Key, Lock, Mail } from 'lucide-react';

// ── Types ──
import { getServiceById } from '../../../../../../constants/services';

// ── Sub-components ──
import ScoreGauge from './ScoreGauge';
import ScoreBreakdown from './ScoreBreakdown';
import WarningsList from './WarningsList';
import EmailSecurity from './EmailSecurity';
import Service2FA from './Service2FA';

// ── Utils ──
import { parseBackupCodes, isValidTotp, passwordStrength, zoneForPct } from './utils';

// ── Types ──
import type { FingerprintEntry, SecurityWarning, BreakdownItem, SecurityTabProps } from './types';

// ─── Component ──────────────────────────────────────────────────────────
export default function SecurityTab({ account }: SecurityTabProps) {
  const [fpEntries, setFpEntries] = useState<FingerprintEntry[]>([]);
  const [fpLoading, setFpLoading] = useState(true);

  useEffect(() => {
    if (!account?.email) {
      setFpLoading(false);
      return;
    }
    setFpLoading(true);
    window.electron.ipcRenderer
      .invoke('email:get-fingerprint-history', { email: account.email })
      .then((res: any) => {
        if (res?.success) setFpEntries(res.entries || []);
      })
      .catch((err: any) => {
        console.error('[SecurityTab] Failed to load fingerprint history:', err);
      })
      .finally(() => setFpLoading(false));
  }, [account?.email]);

  // ── Compute security score ──
  const result = useMemo(() => {
    if (!account) {
      return { score: 0, breakdown: [] as BreakdownItem[], warnings: [] as SecurityWarning[] };
    }

    const breakdown: BreakdownItem[] = [];
    const warnings: SecurityWarning[] = [];

    // === 1. Email 2FA (30) ===
    let emailScore = 0;
    const emailTotp = isValidTotp(account.totp);
    const emailBackupCodes = parseBackupCodes(account.backup_codes);
    const emailBackup = emailBackupCodes.length > 0;

    if (emailTotp) emailScore += 20;
    else
      warnings.push({
        severity: 'critical',
        title: 'Email account has no TOTP 2FA enabled',
        sub: 'Primary recovery path is unprotected against credential-stuffing attacks.',
        fix: 'Enable',
      });

    if (emailBackup) emailScore += 10;
    else
      warnings.push({
        severity: 'warning',
        title: 'Email account has no backup codes',
        sub: 'No fallback if the authenticator device is lost or unreachable.',
        fix: 'Generate',
      });

    breakdown.push({
      label: 'Email 2FA',
      score: emailScore,
      max: 30,
      zone: zoneForPct((emailScore / 30) * 100),
      icon: <Mail className="w-3.5 h-3.5" />,
    });

    // === 2. Service 2FA (25) ===
    let serviceScore = 0;
    const linkedServices = account.services || [];
    const servicesWith2fa = linkedServices.filter((s) => getServiceById(s.serviceId)?.two_fa);

    for (const service of servicesWith2fa) {
      const template = getServiceById(service.serviceId);
      if (!template?.two_fa) continue;
      const templateTwoFa = template.two_fa;
      const linkedTwoFa = (service as any).twoFa || {};
      const linkedTotp = linkedTwoFa.totp || '';
      const linkedBackup = linkedTwoFa.backupCodes || [];

      if (templateTwoFa.has_totp) {
        if (isValidTotp(linkedTotp)) serviceScore += 5;
        else
          warnings.push({
            severity: 'critical',
            title: `Service "${service.name}" has TOTP disabled`,
            sub: 'Two-factor authentication is supported but not configured for this link.',
            fix: 'Enable',
          });
      }
      if (templateTwoFa.has_backup_codes) {
        if (linkedBackup.length > 0) serviceScore += 2;
        else
          warnings.push({
            severity: 'warning',
            title: `Service "${service.name}" has no backup codes`,
            sub: 'No recovery codes saved for this service link.',
            fix: 'Generate',
          });
      }
    }
    serviceScore = Math.min(serviceScore, 25);
    breakdown.push({
      label: 'Service 2FA',
      score: serviceScore,
      max: 25,
      zone: zoneForPct((serviceScore / 25) * 100),
      icon: <Key className="w-3.5 h-3.5" />,
    });

    // === 3. Fingerprint/IP stability (20) ===
    let fpScore = 0;
    const domains = new Map<string, FingerprintEntry[]>();
    for (const entry of fpEntries) {
      const list = domains.get(entry.domain) || [];
      list.push(entry);
      domains.set(entry.domain, list);
    }

    if (domains.size > 0) {
      fpScore += 5;

      let ipChanges = 0;
      let fpChanges = 0;
      for (const entries of domains.values()) {
        const uniqueIps = new Set(entries.map((e) => e.public_ip));
        const uniqueHashes = new Set(entries.map((e) => e.fingerprint_hash));
        if (uniqueIps.size > 1) ipChanges++;
        if (uniqueHashes.size > 1) fpChanges++;
      }

      if (ipChanges === 0) fpScore += 10;
      else {
        fpScore += Math.max(0, 10 - ipChanges * 5);
        warnings.push({
          severity: 'critical',
          title: `IP changed on ${ipChanges} domain(s)`,
          sub: 'Possible proxy rotation or session detection by the target service.',
          fix: 'Review',
        });
      }

      if (fpChanges === 0) fpScore += 5;
      else {
        fpScore += Math.max(0, 5 - fpChanges * 3);
        warnings.push({
          severity: 'critical',
          title: `Fingerprint changed on ${fpChanges} domain(s)`,
          sub: 'Canvas/WebGL signature drifted from the baseline capture — possible detection.',
          fix: 'Review',
        });
      }
    } else {
      warnings.push({
        severity: 'warning',
        title: 'No fingerprint history yet',
        sub: 'Data will appear when you browse websites with a fingerprint profile.',
        fix: 'Scan',
      });
    }
    breakdown.push({
      label: 'Fingerprint/IP',
      score: fpScore,
      max: 20,
      zone: zoneForPct((fpScore / 20) * 100),
      icon: <Globe className="w-3.5 h-3.5" />,
    });

    // === 4. Password strength + Recovery (25) ===
    const pw = passwordStrength(account.password);
    let pwRecoveryScore = pw.score;
    for (const warning of pw.warnings) {
      warnings.push({
        severity: 'warning',
        title: warning,
        sub: 'Password does not meet recommended complexity standards.',
        fix: 'Update',
      });
    }

    let recoveryScore = 0;
    if (account.recovery_email) recoveryScore += 5;
    else
      warnings.push({
        severity: 'warning',
        title: 'No recovery email set',
        sub: 'Account recovery relies solely on the phone channel.',
        fix: 'Add',
      });
    if (account.phone_number) recoveryScore += 5;
    else
      warnings.push({
        severity: 'warning',
        title: 'No phone number set',
        sub: 'SMS-based recovery and step-up verification are unavailable.',
        fix: 'Add',
      });

    pwRecoveryScore += recoveryScore;
    breakdown.push({
      label: 'Password & Recovery',
      score: pwRecoveryScore,
      max: 25,
      zone: zoneForPct((pwRecoveryScore / 25) * 100),
      icon: <Lock className="w-3.5 h-3.5" />,
    });

    const totalScore = Math.min(emailScore + serviceScore + fpScore + pwRecoveryScore, 100);

    return { score: totalScore, breakdown, warnings };
  }, [account, fpEntries]);

  // ── Render ──
  if (!account) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select an account to view security details.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-scroll overscroll-contain custom-scrollbar p-6 space-y-4">
      {/* Page head */}
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">Security Posture</h1>
        <p className="text-[13px] text-text-secondary/60 mt-0.5">
          Composite risk assessment across authentication, recovery, and network fingerprint
          signals.
        </p>
      </div>

      {/* Top row: gauge + breakdown */}
      <div className="grid grid-cols-[340px_1fr] gap-4 max-[880px]:grid-cols-1">
        <ScoreGauge score={result.score} />
        <ScoreBreakdown breakdown={result.breakdown} />
      </div>

      {/* Warnings */}
      <WarningsList warnings={result.warnings} />

      {/* Bottom: Email security + Service 2FA */}
      <div className="grid grid-cols-2 gap-4 max-[880px]:grid-cols-1">
        <EmailSecurity account={account} />
        <Service2FA account={account} />
      </div>

      {/* Scan footer */}
      <div className="flex items-center justify-between px-4 py-3 border border-dashed border-border rounded-xl text-[12px] text-text-secondary/50">
        <span>
          Last full scan: <b className="text-text-secondary">just now</b>
          {fpLoading && (
            <span className="ml-2 text-text-secondary/40 italic">
              · refreshing fingerprint data…
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-green">
          <span className="w-1.5 h-1.5 rounded-full bg-green" />
          Monitoring active
        </span>
      </div>

      {/* Bottom spacer */}
      <div className="h-16" />
    </div>
  );
}
