import { useState } from 'react';
import { Account, ServiceItem, ProfileMetadata } from '../mock/accounts';
import { cn } from '../../../shared/lib/utils';
import { User, Mail, LayoutGrid, Globe, Trash2 } from 'lucide-react';
import CoreTab from './tabs/CoreTab';
import ProfileTab from './tabs/ProfileTab';
import MailTab from './tabs/MailTab';
import ServiceTab from './tabs/ServiceTab';
import SessionMonitorModal from './SessionMonitorModal';

interface AccountWorkspaceProps {
  account: Account | null;
  services?: ServiceItem[];
  profiles?: ProfileMetadata[];
  repoPath?: string;
  onUpdate?: (account: Account) => void;
  onDelete?: (id: string) => void;
}

const AccountWorkspace = ({
  account,
  services = [],
  profiles = [],
  repoPath,
  onUpdate,
  onDelete,
}: AccountWorkspaceProps) => {
  const [activeTab, setActiveTab] = useState<'Core' | 'Profile' | 'Mail' | 'Service'>('Core');
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);

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
        return <CoreTab account={account} onUpdate={onUpdate} />;
      case 'Profile':
        const accountProfile = profiles.find((p) => p.accountId === account.id);
        return <ProfileTab account={account} profile={accountProfile} repoPath={repoPath} />;
      case 'Mail':
        return <MailTab />;
      case 'Service':
        const accountServices = services.filter((s) => s.accountId === account.id);
        return (
          <ServiceTab services={accountServices} onUpdate={(updated) => console.log(updated)} />
        );
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

      <div className="h-16 shrink-0 border-b border-border bg-background px-6 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
        {/* Navigation Tabs */}
        <nav className="flex items-center justify-between h-full w-full">
          <div className="flex items-center gap-6 h-full">
            <button
              onClick={() => setActiveTab('Core')}
              className={cn(
                'h-full text-sm font-medium transition-colors flex items-center gap-2 border-b-2 px-1',
                activeTab === 'Core'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border',
              )}
            >
              <User className="w-4 h-4" />
              Core
            </button>

            <button
              onClick={() => setActiveTab('Profile')}
              className={cn(
                'h-full text-sm font-medium transition-colors flex items-center gap-2 border-b-2 px-1',
                activeTab === 'Profile'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border',
              )}
            >
              <User className="w-4 h-4" />
              Profile
            </button>

            <button
              onClick={() => setActiveTab('Mail')}
              className={cn(
                'h-full text-sm font-medium transition-colors flex items-center gap-2 border-b-2 px-1',
                activeTab === 'Mail'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border',
              )}
            >
              <Mail className="w-4 h-4" />
              Mail
            </button>

            <button
              onClick={() => setActiveTab('Service')}
              className={cn(
                'h-full text-sm font-medium transition-colors flex items-center gap-2 border-b-2 px-1',
                activeTab === 'Service'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border',
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Service
            </button>
          </div>

          <div className="flex items-center gap-3">
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
              className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
              title="Delete Account"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={async () => {
                setIsMonitorOpen(true);
                try {
                  // @ts-ignore
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
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all border border-primary/20"
            >
              <Globe className="w-3.5 h-3.5" />
              Launch Browser
            </button>
          </div>
        </nav>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 overflow-hidden relative">{renderContent()}</div>
    </div>
  );
};

export default AccountWorkspace;
