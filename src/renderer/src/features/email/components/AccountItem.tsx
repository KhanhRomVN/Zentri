import { memo, useMemo } from 'react';
import { User, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { Account } from '../mock/accounts';

interface AccountItemProps {
  account: Account;
  isSelected: boolean;
  onSelect: (account: Account) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  getAvatarColor: (identifier: string) => { bg: string; text: string; hex: string };
  DOMAIN_MAP: Record<string, string>;
}

const AccountItem = memo(
  ({ account, isSelected, onSelect, onDelete, getAvatarColor, DOMAIN_MAP }: AccountItemProps) => {
    const { faviconUrl, avatarColor } = useMemo(() => {
      let domain = account.email.split('@')[1] || 'google.com';
      domain = DOMAIN_MAP[domain] || domain;
      return {
        faviconUrl: `https://www.google.com/s2/favicons?domain=https://${domain}&sz=32`,
        avatarColor: getAvatarColor(account.email),
      };
    }, [account.email, getAvatarColor, DOMAIN_MAP]);

    const activeColor = avatarColor.hex;

    return (
      <div
        onClick={() => onSelect(account)}
        className={cn(
          'group relative flex flex-col gap-2 p-3 cursor-pointer transition-all duration-300',
          isSelected ? '' : 'hover:bg-muted/30',
        )}
        style={{
          background: isSelected
            ? `linear-gradient(to right, ${activeColor}15, transparent)`
            : undefined,
        }}
      >
        {/* Custom Border Indicator */}
        {isSelected && (
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-lg"
            style={{ backgroundColor: activeColor }}
          />
        )}

        {/* Delete Icon */}
        <button
          onClick={(e) => onDelete(account.id, e)}
          className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md z-10 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3 pl-2 relative z-10">
          <div className="relative shrink-0">
            <div
              className={cn(
                'h-10 w-10 rounded-md flex items-center justify-center text-sm font-bold shadow-lg transition-transform group-hover:scale-105 overflow-hidden',
                !account.avatar?.startsWith('http') && avatarColor.bg,
                account.avatar?.startsWith('http') && 'bg-background border border-border',
              )}
            >
              {account.avatar?.startsWith('http') ? (
                <img
                  src={account.avatar}
                  alt={account.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className={cn('w-5 h-5', avatarColor.text)} />
              )}
            </div>
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                account.status === 'active' ? 'bg-emerald-500' : 'bg-yellow-500',
              )}
            />
          </div>

          <div className="flex-1 overflow-hidden min-w-0 pr-6">
            <div className="flex items-center gap-1.5 mb-1">
              <img src={faviconUrl} alt="provider" className="w-3 h-3 rounded-full opacity-70" />
              <h4
                className={cn(
                  'text-sm font-semibold truncate transition-colors',
                  isSelected
                    ? 'text-foreground'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
              >
                {account.email}
              </h4>
            </div>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-background/50 border border-border w-fit">
              {account.twoFactorEnabled ? (
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-2.5 h-2.5 text-red-500" />
              )}
              <span className="text-[9px] text-muted-foreground font-bold">2FA</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

AccountItem.displayName = 'AccountItem';
export default AccountItem;
