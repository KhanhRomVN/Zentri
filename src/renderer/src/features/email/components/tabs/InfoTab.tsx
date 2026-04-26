import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Key, Hash, Activity } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
import Input from '../../../../shared/components/ui/input/Input';
import { Account } from '../../types';

interface InfoTabProps {
  editedAccount: Account | null;
  setEditedAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  validateField: (name: string, value: string) => void;
  errors: Record<string, string>;
  backupCodeSearch: string;
  setBackupCodeSearch: (val: string) => void;
}

const InfoTab: FC<InfoTabProps> = ({
  editedAccount,
  setEditedAccount,
  validateField,
  errors,
  backupCodeSearch,
  setBackupCodeSearch,
}) => {
  const { t } = useTranslation();
  return (
    <div className="w-full p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] ml-1">
              {t('email.manager.tabs.info.email')}
            </label>
            <Input
              value={editedAccount?.email || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setEditedAccount((prev: Account | null) => (prev ? { ...prev, email: val } : null));
              }}
              onBlur={(e: any) => validateField('email', e.target.value)}
              error={errors.email}
              className="bg-input-background border border-border/50 rounded-xl transition-all duration-300"
              placeholder="identity@zentri.node"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] ml-1">
              {t('email.manager.tabs.info.password')}
            </label>
            <Input
              type="password"
              value={editedAccount?.password || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setEditedAccount((prev: Account | null) =>
                  prev ? { ...prev, password: val } : null,
                );
              }}
              onBlur={(e: any) => validateField('password', e.target.value)}
              error={errors.password}
              className="bg-input-background border border-border/50 rounded-xl transition-all duration-300 font-mono tracking-widest"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] ml-1">
              {t('email.manager.tabs.info.recoveryEmail')}
            </label>
            <Input
              value={editedAccount?.recoveryEmail || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setEditedAccount((prev: Account | null) =>
                  prev ? { ...prev, recoveryEmail: val } : null,
                );
              }}
              onBlur={(e: any) => validateField('recoveryEmail', e.target.value)}
              error={errors.recoveryEmail}
              className="bg-input-background border border-border/50 rounded-xl transition-all duration-300"
              placeholder="backup@zentri.node"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] ml-1">
              {t('email.manager.tabs.info.phoneNumber')}
            </label>
            <Input
              value={editedAccount?.phoneNumber || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setEditedAccount((prev: Account | null) =>
                  prev ? { ...prev, phoneNumber: val } : null,
                );
              }}
              onBlur={(e: any) => validateField('phoneNumber', e.target.value)}
              error={errors.phoneNumber}
              className="bg-input-background border border-border/50 rounded-xl transition-all duration-300"
              placeholder="+X XXXXX XXXXX"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90">
              {t('email.manager.tabs.info.securitySettings')}
            </h3>
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {t('email.manager.tabs.info.totpKey')}
            </label>
            <Input
              type="text"
              placeholder={t('email.manager.tabs.info.totpPlaceholder')}
              leftIcon={Key}
              value={editedAccount?.totpSecretKey || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditedAccount((prev: Account | null) =>
                  prev ? { ...prev, totpSecretKey: e.target.value } : null,
                )
              }
              className="bg-input-background border border-border/50 rounded-xl transition-all duration-300"
            />
            {editedAccount?.totpSecretKey && (
              <div className="flex gap-2 pt-2">
                {[0, 0, 0, 0, 0, 0].map((digit, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-10 h-12 rounded-lg border border-border/20 bg-muted/10 flex items-center justify-center text-xl font-mono font-black text-primary/80 shadow-inner',
                      i === 3 && 'ml-2',
                    )}
                  >
                    {digit}
                  </div>
                ))}
                <div className="flex-1 flex items-center justify-end">
                  <Activity className="w-4 h-4 text-green-500/50 animate-pulse" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {t('email.manager.tabs.info.backupCodes')}
            </label>
            <Input
              type="combobox"
              placeholder={t('email.manager.tabs.info.backupPlaceholder')}
              value={backupCodeSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBackupCodeSearch(e.target.value)
              }
              multiValue={true}
              badgeColorMode="diverse"
              badgeVariant="neon"
              leftIcon={Hash}
              badges={(() => {
                try {
                  return editedAccount?.backupCodes
                    ? JSON.parse(editedAccount.backupCodes).map((c: string) => ({
                        id: c,
                        label: c,
                      }))
                    : [];
                } catch (e) {
                  return [];
                }
              })()}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && backupCodeSearch.trim()) {
                  const newCode = backupCodeSearch.trim();
                  const currentCodes = editedAccount?.backupCodes
                    ? JSON.parse(editedAccount.backupCodes)
                    : [];
                  if (Array.isArray(currentCodes) && !currentCodes.includes(newCode)) {
                    setEditedAccount((prev: Account | null) =>
                      prev
                        ? {
                            ...prev,
                            backupCodes: JSON.stringify([...currentCodes, newCode]),
                          }
                        : null,
                    );
                  }
                  setBackupCodeSearch('');
                }
              }}
              onBadgeRemove={(id: string | number) => {
                try {
                  const currentCodes = editedAccount?.backupCodes
                    ? JSON.parse(editedAccount.backupCodes)
                    : [];
                  if (Array.isArray(currentCodes)) {
                    setEditedAccount((prev: Account | null) =>
                      prev
                        ? {
                            ...prev,
                            backupCodes: JSON.stringify(
                              currentCodes.filter((c: string) => c !== id),
                            ),
                          }
                        : null,
                    );
                  }
                } catch (e) {
                  console.error('Failed to parse backup codes', e);
                }
              }}
              className="bg-input-background border border-border/50 rounded-xl transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoTab;
