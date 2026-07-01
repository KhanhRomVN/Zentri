import { FC } from 'react';
import { Shield, Key, Hash, Activity, X } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
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
  const inputBaseClass =
    'w-full h-10 px-3 rounded-md bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50';

  const parsedBackupCodes: string[] = (() => {
    try {
      return editedAccount?.backupCodes ? JSON.parse(editedAccount.backupCodes) : [];
    } catch {
      return [];
    }
  })();

  const handleAddBackupCode = () => {
    const newCode = backupCodeSearch.trim();
    if (!newCode) return;
    const currentCodes = parsedBackupCodes;
    if (!currentCodes.includes(newCode)) {
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
  };

  const handleRemoveBackupCode = (code: string) => {
    const currentCodes = parsedBackupCodes;
    setEditedAccount((prev: Account | null) =>
      prev
        ? {
            ...prev,
            backupCodes: JSON.stringify(currentCodes.filter((c: string) => c !== code)),
          }
        : null,
    );
  };

  const colors = [
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  ];

  return (
    <div className="w-full p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-muted-foreground/30 ml-1">Email</label>
            <input
              type="text"
              value={editedAccount?.email || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setEditedAccount((prev: Account | null) => (prev ? { ...prev, email: val } : null));
              }}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                validateField('email', e.target.value)
              }
              placeholder="identity@zentri.node"
              className={cn(
                inputBaseClass,
                errors.email ? 'border-destructive' : 'border-border/50',
              )}
            />
            {errors.email && <p className="text-[10px] text-destructive mt-1">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-muted-foreground/30 ml-1">
              Password
            </label>
            <input
              type="password"
              value={editedAccount?.password || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setEditedAccount((prev: Account | null) =>
                  prev ? { ...prev, password: val } : null,
                );
              }}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                validateField('password', e.target.value)
              }
              placeholder="••••••••••••"
              className={cn(
                inputBaseClass,
                'font-mono tracking-widest',
                errors.password ? 'border-destructive' : 'border-border/50',
              )}
            />
            {errors.password && (
              <p className="text-[10px] text-destructive mt-1">{errors.password}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-muted-foreground/30 ml-1">
              Recovery Email
            </label>
            <input
              type="text"
              value={editedAccount?.recoveryEmail || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setEditedAccount((prev: Account | null) =>
                  prev ? { ...prev, recoveryEmail: val } : null,
                );
              }}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                validateField('recoveryEmail', e.target.value)
              }
              placeholder="backup@zentri.node"
              className={cn(
                inputBaseClass,
                errors.recoveryEmail ? 'border-destructive' : 'border-border/50',
              )}
            />
            {errors.recoveryEmail && (
              <p className="text-[10px] text-destructive mt-1">{errors.recoveryEmail}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-muted-foreground/30 ml-1">
              Phone Number
            </label>
            <input
              type="text"
              value={editedAccount?.phoneNumber || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setEditedAccount((prev: Account | null) =>
                  prev ? { ...prev, phoneNumber: val } : null,
                );
              }}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                validateField('phoneNumber', e.target.value)
              }
              placeholder="+X XXXXX XXXXX"
              className={cn(
                inputBaseClass,
                errors.phoneNumber ? 'border-destructive' : 'border-border/50',
              )}
            />
            {errors.phoneNumber && (
              <p className="text-[10px] text-destructive mt-1">{errors.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2.5">
            <label className="text-[13px] font-semibold tracking-wider text-muted-foreground/70">
              TOTP Key
            </label>
            <div className="relative flex items-center">
              <Key className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Enter TOTP key..."
                value={editedAccount?.totpSecretKey || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditedAccount((prev: Account | null) =>
                    prev ? { ...prev, totpSecretKey: e.target.value } : null,
                  )
                }
                className={cn(inputBaseClass, 'pl-10', 'border-border/50')}
              />
            </div>
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
            <label className="text-[13px] font-semibold tracking-wider text-muted-foreground/70">
              Backup Codes
            </label>
            <div className="bg-input-background border border-border/50 rounded-xl">
              {/* Badge List */}
              {parsedBackupCodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 pb-0">
                  {parsedBackupCodes.map((code, idx) => {
                    const colorClass = colors[idx % colors.length];
                    return (
                      <span
                        key={code}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border',
                          colorClass,
                        )}
                      >
                        {code}
                        <button
                          type="button"
                          onClick={() => handleRemoveBackupCode(code)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Input */}
              <div className="relative flex items-center">
                <Hash className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Enter backup code..."
                  value={backupCodeSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBackupCodeSearch(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      handleAddBackupCode();
                    }
                  }}
                  className={cn(inputBaseClass, 'pl-10')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoTab;
