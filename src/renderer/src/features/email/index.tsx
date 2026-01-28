import React, { useState } from 'react';
import { mockAccounts, Account } from './mock/accounts';
import AccountDetail from './components/AccountDetail';
import {
  Search,
  Plus,
  UserPlus,
  Settings,
  Command,
  Heart,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Lock,
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';
import { Mail } from 'lucide-react';

const AccountManager = () => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(mockAccounts[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAccounts = mockAccounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getProviderTheme = (provider: Account['provider']) => {
    switch (provider) {
      case 'gmail':
        return {
          color: 'text-red-600',
          bg: 'bg-gradient-to-br from-red-600/10 to-transparent',
          border: 'border-red-600/20',
          avatar: 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20',
        };
      case 'hotmail':
        return {
          color: 'text-blue-600',
          bg: 'bg-gradient-to-br from-blue-600/10 to-transparent',
          border: 'border-blue-600/20',
          avatar: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20',
        };
      case 'protonmail':
        return {
          color: 'text-purple-600',
          bg: 'bg-gradient-to-br from-purple-600/10 to-transparent',
          border: 'border-purple-600/20',
          avatar: 'bg-gradient-to-br from-purple-600 to-indigo-700 shadow-purple-500/20',
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-muted/30',
          border: 'border-border',
          avatar: 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-gray-500/20',
        };
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Panel: Account List */}
      {/* Left Panel: Account List */}
      <div className="w-[350px] flex flex-col border-r border-border h-full bg-muted/10 backdrop-blur-xl">
        {/* Header & Search */}
        <div className="p-4 pb-2 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-background/50 border border-transparent focus:border-primary/20 focus:bg-background text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              className="h-9 w-9 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-all shadow-sm flex items-center justify-center shrink-0"
              title="Add Account"
              onClick={async () => {
                try {
                  // @ts-ignore
                  await window.electron.ipcRenderer.invoke('email:open-login', {
                    provider: 'gmail',
                  });
                } catch (error) {
                  console.error('Failed to open login', error);
                }
              }}
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="h-[1px] bg-border/40 mx-4" />

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar px-2 pt-2">
          {filteredAccounts.map((account) => {
            const domain = account.email.split('@')[1];
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
            const theme = getProviderTheme(account.provider);
            const isSelected = selectedAccount?.id === account.id;

            // Define gradient colors based on provider
            let gradientColor = 'gray'; // default
            if (account.provider === 'gmail') gradientColor = 'red';
            if (account.provider === 'hotmail') gradientColor = 'blue';
            if (account.provider === 'protonmail') gradientColor = 'purple';

            return (
              <div
                key={account.id}
                onClick={() => setSelectedAccount(account)}
                className={cn(
                  'group relative flex flex-col gap-2 p-3 rounded-xl cursor-pointer transition-all duration-300',
                  isSelected
                    ? `bg-gradient-to-r from-${gradientColor}-500/10 to-transparent`
                    : 'hover:bg-muted/50',
                )}
                style={{
                  borderLeft: isSelected
                    ? `3px solid var(--${gradientColor}-500)`
                    : '3px solid transparent',
                  // Note: Tailwind doesn't easily map "red" to css var without config, so we might stick to class based border or inline style if we want dynamic color.
                  // Let's use the border-l-4 approach via classes if possible, or just exact colors.
                }}
              >
                {/* Selection Indicator Line (Optional, mimicking sidebar active state style if desired, but user just said gradient background) */}
                {isSelected && (
                  <div
                    className={cn(
                      'absolute left-0 top-3 bottom-3 w-1 rounded-r-full',
                      `bg-${gradientColor}-500`,
                    )}
                  />
                )}

                {/* Heart Icon */}
                <div className="absolute top-3 right-3 text-red-500 hover:scale-110 transition-transform cursor-pointer z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="w-3.5 h-3.5 fill-red-500" />
                </div>

                <div className="flex items-start gap-3 pl-2">
                  {/* AvatarUI */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-md transition-transform group-hover:scale-105',
                        theme.avatar,
                      )}
                    >
                      {account.avatar}
                    </div>
                    <div
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background flex items-center justify-center',
                        account.status === 'active' ? 'bg-emerald-500' : 'bg-yellow-500',
                      )}
                    ></div>
                  </div>

                  <div className="flex-1 overflow-hidden min-w-0">
                    {/* Title & Favicon */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <img
                        src={faviconUrl}
                        alt="provider"
                        className="w-3 h-3 rounded-full opacity-70"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
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

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {/* 2FA Badge */}
                      <div
                        className={cn(
                          'flex items-center gap-0.5 px-1 py-[1px] rounded text-[9px] font-medium border border-transparent bg-background/50',
                        )}
                      >
                        {account.twoFactorEnabled ? (
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                        ) : (
                          <ShieldAlert className="w-2.5 h-2.5 text-red-500" />
                        )}
                        <span className="text-muted-foreground">2FA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Account Detail */}
      <div className="flex-1 h-full overflow-hidden bg-background relative">
        <AccountDetail account={selectedAccount} />
      </div>
    </div>
  );
};

export default AccountManager;
