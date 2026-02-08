import { useState, memo, useMemo } from 'react';
import { Account, ServiceItem, ProfileMetadata } from '../mock/accounts';
import { cn } from '../../../shared/lib/utils';
import { User, Mail, LayoutGrid, Globe, Trash2, RefreshCcw } from 'lucide-react';
import CoreTab from './tabs/core';
import ProfileTab from './tabs/profile';
import MailTab from './tabs/mail';
import ServiceTab from './tabs/service';
import SessionMonitorModal from './SessionMonitorModal';

interface AccountWorkspaceProps {
  account: Account | null;
  services?: ServiceItem[];
  profiles?: ProfileMetadata[];
  repoPath?: string;
  onUpdate?: (account: Account) => void;
  onUpdateServices?: (services: ServiceItem[]) => void;
  onDelete?: (id: string) => void;
  isCreating?: boolean;
  onCancelCreate?: () => void;
}

const AccountWorkspace = memo(
  ({
    account,
    services = [],
    profiles = [],
    repoPath,
    onUpdate,
    onUpdateServices,
    onDelete,
    isCreating,
    onCancelCreate,
  }: AccountWorkspaceProps) => {
    const [activeTab, setActiveTab] = useState<'Core' | 'Profile' | 'Mail' | 'Service'>('Core');

    // Reset to Core tab when isCreating becomes true
    useMemo(() => {
      if (isCreating) {
        setActiveTab('Core');
      }
    }, [isCreating]);
    const [isMonitorOpen, setIsMonitorOpen] = useState(false);
    const [isAddingService, setIsAddingService] = useState(false);

    // Memoize tabs configuration
    const tabs = useMemo(
      () =>
        [
          { id: 'Core', icon: User, label: 'Core', activeClass: 'bg-blue-500/10 text-blue-600' },
          {
            id: 'Profile',
            icon: User,
            label: 'Profile',
            activeClass: 'bg-indigo-500/10 text-indigo-600',
          },
          {
            id: 'Mail',
            icon: Mail,
            label: 'Mail',
            activeClass: 'bg-emerald-500/10 text-emerald-600',
          },
          {
            id: 'Service',
            icon: LayoutGrid,
            label: 'Service',
            activeClass: 'bg-orange-500/10 text-orange-600',
          },
        ] as const,
      [],
    );

    if (!account) {
      return (
        <div className="flex-1 flex items-center justify-center h-full text-muted-foreground">
          Select an account to view details
        </div>
      );
    }

    const renderContent = () => {
      switch (activeTab) {
        case 'Core':
          return (
            <CoreTab
              account={account}
              onUpdate={(updated) => onUpdate?.({ ...account, ...updated } as Account)}
              isCreating={isCreating}
              onCancel={onCancelCreate}
            />
          );
        case 'Profile': {
          const accountProfile = profiles.find((p) => p.accountId === account.id);
          return <ProfileTab account={account} profile={accountProfile} repoPath={repoPath} />;
        }
        case 'Mail':
          return <MailTab account={account} repoPath={repoPath} />;
        case 'Service': {
          const accountServices = services.filter((s) => s.emailId === account.id);
          return (
            <ServiceTab
              services={accountServices}
              onUpdate={(updated) => onUpdateServices?.(updated)}
              currentAccountId={account.id}
              onCreatingModeChange={setIsAddingService}
            />
          );
        }
        default:
          return null;
      }
    };

    return (
      <div className="flex flex-col h-full w-full overflow-hidden bg-background">
        <SessionMonitorModal
          isOpen={isMonitorOpen}
          onClose={() => setIsMonitorOpen(false)}
          accountId={account.id}
        />

        <div className="h-16 shrink-0 border-b border-border bg-background px-6 grid grid-cols-3 items-center animate-in slide-in-from-top-2 duration-300">
          {/* Left: Account Info */}
          <div className="flex items-center gap-3 justify-start min-w-0">
            {!isCreating && (
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-md overflow-hidden border border-border bg-muted">
                  {account.avatar ? (
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-background flex items-center justify-center p-0.5 border border-border">
                  {account.provider === 'gmail' && (
                    <div className="w-full h-full rounded-full bg-red-500" />
                  )}
                  {account.provider === 'hotmail' && (
                    <div className="w-full h-full rounded-full bg-blue-500" />
                  )}
                  {account.provider === 'protonmail' && (
                    <div className="w-full h-full rounded-full bg-purple-500" />
                  )}
                  {account.provider === 'icloud' && (
                    <div className="w-full h-full rounded-full bg-sky-500" />
                  )}
                  {account.provider === 'yahoo' && (
                    <div className="w-full h-full rounded-full bg-violet-600" />
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground truncate">
                  {isCreating
                    ? 'Add new email'
                    : isAddingService
                      ? 'Add new service'
                      : account.email}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {!isCreating && !isAddingService && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 rounded-sm font-medium">
                    Active
                  </span>
                )}
                {!isAddingService && account.twoFactorEnabled && (
                  <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 rounded-sm font-medium">
                    2FA On
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Navigation Tabs */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const disabled =
                  (isCreating && tab.id !== 'Core') || (isAddingService && tab.id !== 'Service');
                return (
                  <button
                    key={tab.id}
                    onClick={() => !disabled && setActiveTab(tab.id)}
                    disabled={disabled}
                    className={cn(
                      'h-9 px-4 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                      activeTab === tab.id
                        ? tab.activeClass
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                      disabled && 'opacity-30 cursor-not-allowed',
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-1">
            {!isCreating && !isAddingService && (
              <>
                <button
                  onClick={() => onUpdate?.(account)}
                  className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                  title="Sync Account"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={async () => {
                    setIsMonitorOpen(true);
                    try {
                      await window.electron.ipcRenderer.invoke('email:open-login', {
                        provider: account.provider,
                        accountId: account.id,
                        url: 'https://mail.google.com',
                        profilePath: repoPath ? `${repoPath}/profiles/${account.id}` : undefined,
                      });
                    } catch (error) {
                      console.error('Failed to launch browser', error);
                      setIsMonitorOpen(false); // Close on error init
                    }
                  }}
                  className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                  title="Launch Browser"
                >
                  <Globe className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (
                      account &&
                      onDelete &&
                      confirm(`Are you sure you want to delete account ${account.email}?`)
                    ) {
                      onDelete(account.id);
                    }
                  }}
                  className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                  title="Delete Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 overflow-hidden relative">{renderContent()}</div>
      </div>
    );
  },
);

export default AccountWorkspace;
