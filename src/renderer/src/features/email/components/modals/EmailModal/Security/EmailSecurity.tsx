/**
 * EmailSecurity — checklist rows with status pills.
 */

import { Key, Lock, Mail, Smartphone } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import { parseBackupCodes, isValidTotp } from './utils';
import type { Account } from '../../../../types';

interface EmailSecurityProps {
  account: Account;
}

export default function EmailSecurity({ account }: EmailSecurityProps) {
  return (
    <div className="bg-card-background border border-border rounded-md overflow-hidden">
      <div className="px-4 py-3.5 border-b border-border">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-green" />
          Email Security
        </h2>
      </div>
      <div className="flex flex-col">
        <SecurityCheckRow
          icon={<Key className="w-3.5 h-3.5" />}
          label="TOTP 2FA"
          sub={
            isValidTotp(account.totp) ? 'Authenticator app linked' : 'Authenticator app not linked'
          }
          on={isValidTotp(account.totp)}
        />
        <SecurityCheckRow
          icon={<Lock className="w-3.5 h-3.5" />}
          label="Backup Codes"
          sub={`${parseBackupCodes(account.backup_codes).length} codes remaining`}
          on={parseBackupCodes(account.backup_codes).length > 0}
        />
        <SecurityCheckRow
          icon={<Mail className="w-3.5 h-3.5" />}
          label="Recovery Email"
          sub={account.recovery_email || 'Not configured'}
          on={!!account.recovery_email}
        />
        <SecurityCheckRow
          icon={<Smartphone className="w-3.5 h-3.5" />}
          label="Phone Number"
          sub={account.phone_number || 'Not configured'}
          on={!!account.phone_number}
        />
      </div>
    </div>
  );
}

// ─── Sub-component ──────────────────────────────────────────────────────
function SecurityCheckRow({
  icon,
  label,
  sub,
  on,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  on: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-muted/40 border border-border text-text-secondary/60">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-text-primary">{label}</div>
        <div className="text-[13px] text-text-secondary/40 mt-0.5">{sub}</div>
      </div>
      <span
        className={cn(
          'flex items-center gap-1.5 text-[13px] font-semibold px-2.5 py-1 rounded-full shrink-0',
          on
            ? 'bg-green/10 text-green'
            : 'bg-white/[.05] text-text-secondary/40 border border-border',
        )}
      >
        <span className={cn('w-1 h-1 rounded-full', on ? 'bg-green' : 'bg-text-secondary/40')} />
        {on ? 'On' : 'Off'}
      </span>
    </div>
  );
}
