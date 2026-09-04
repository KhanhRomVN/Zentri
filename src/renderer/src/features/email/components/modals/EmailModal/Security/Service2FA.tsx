/**
 * Service2FA — list of linked services with 2FA support.
 */

import { Key } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import { getServiceById } from '../../../../../../constants/services';
import { isValidTotp } from './utils';
import type { Account } from '../../../../types';

interface Service2FAProps {
  account: Account;
}

function getHostname(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export default function Service2FA({ account }: Service2FAProps) {
  const services = (account.services || []).filter(
    (service) => getServiceById(service.serviceId)?.two_fa,
  );

  return (
    <div className="bg-card-background border border-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-blue" />
          Service 2FA Status
        </h2>
      </div>
      <div className="flex flex-col">
        {services.length > 0 ? (
          services.map((service) => {
            const template = getServiceById(service.serviceId);
            const linkedTwoFa = (service as any).twoFa || {};
            const totpOn = template?.two_fa?.has_totp && isValidTotp(linkedTwoFa.totp);
            const backupOn =
              template?.two_fa?.has_backup_codes && (linkedTwoFa.backupCodes || []).length > 0;
            const hostname = getHostname(service.url || template?.url);
            return (
              <div
                key={service.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                  className="w-5 h-5 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-text-primary truncate">{service.name}</div>
                  <div className="text-[10px] text-text-secondary/40 mt-0.5">
                    {template?.two_fa ? 'Supports 2FA' : 'No 2FA support'}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {template?.two_fa?.has_totp && (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md',
                        totpOn ? 'bg-green/10 text-green' : 'bg-red/10 text-red',
                      )}
                    >
                      TOTP {totpOn ? '✓' : '✕'}
                    </span>
                  )}
                  {template?.two_fa?.has_backup_codes && (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md',
                        backupOn ? 'bg-green/10 text-green' : 'bg-red/10 text-red',
                      )}
                    >
                      Backup {backupOn ? '✓' : '✕'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-4 py-8 text-center text-[13px] text-text-secondary/40 italic">
            No services with 2FA support.
          </div>
        )}
      </div>
    </div>
  );
}
