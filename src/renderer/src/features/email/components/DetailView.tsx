import { FC } from 'react';
import { User, LayoutGrid, Undo2, Trash, Clock, Mail, Shield, Database } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import Avatar from '../../../shared/components/ui/avatar/Avatar';
import Badge from '../../../shared/components/ui/badge/Badge';
import { Account } from '../types';
import InfoTab from './tabs/InfoTab';
import ServicesTab from './tabs/ServicesTab';
import InboxTab from './tabs/InboxTab';
import FingerprintTab from './tabs/FingerprintTab';
import SessionsTab from './tabs/SessionsTab';

interface DetailViewProps {
  focusedAccount: Account | null;
  accounts: Account[];
  activeTab: 'info' | 'services' | 'inbox' | 'fingerprint' | 'sessions';
  setActiveTab: (tab: 'info' | 'services' | 'inbox' | 'fingerprint' | 'sessions') => void;
  avatars: Record<string, string>;
  onSelectAccount: (account: Account) => void;
  onContextMenu: (e: React.MouseEvent, accountId: string) => void;
  onServiceContextMenu: (e: React.MouseEvent, linkId: string) => void;
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
  editedAccount: Account | null;
  setEditedAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  validateField: (name: string, value: string) => void;
  errors: Record<string, string>;
  backupCodeSearch: string;
  setBackupCodeSearch: (val: string) => void;
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  accountServices: any[];
  onAddNewServiceLink: () => void;
  onEditServiceLink: (linkId: string) => void;
}

const DetailView: FC<DetailViewProps> = ({
  focusedAccount,
  accounts,
  activeTab,
  setActiveTab,
  avatars,
  onSelectAccount,
  onContextMenu,
  onServiceContextMenu,
  onRestore,
  onHardDelete,
  editedAccount,
  setEditedAccount,
  validateField,
  errors,
  backupCodeSearch,
  setBackupCodeSearch,
  serviceSearch,
  setServiceSearch,
  accountServices,
  onAddNewServiceLink,
  onEditServiceLink,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      <div className="grid grid-cols-[80px_1fr_140px] border-b border-border/50 bg-table-headerBg shadow-sm shrink-0">
        <div className="pl-6 h-10 flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
          STT
        </div>
        <div className="h-10 flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
          Email
        </div>
        <div className="pr-6 h-10 flex items-center justify-end text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
          Status
        </div>
      </div>

      <div
        className="grid grid-cols-[80px_1fr_140px] items-center h-[56px] border-b border-primary/30 bg-primary/5 shrink-0 cursor-pointer group relative overflow-hidden"
        onClick={() => focusedAccount && onSelectAccount(focusedAccount)}
        onContextMenu={(e) => focusedAccount && onContextMenu(e, focusedAccount.id)}
      >
        <div className="sweep-overlay" />

        <div className="pl-6 flex items-center gap-2 text-muted-foreground font-mono text-[10px] relative z-20">
          #{String(focusedAccount ? accounts.indexOf(focusedAccount) + 1 : 0).padStart(2, '0')}
        </div>
        <div className="flex items-center gap-4 relative z-20">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/20 transition-transform duration-500 hover:rotate-3">
            {focusedAccount && avatars[focusedAccount.email] ? (
              <img
                src={avatars[focusedAccount.email]}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <Avatar
                size={32}
                name={focusedAccount?.email || ''}
                fallbackType="initials"
                shape="square"
              />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-[14px] font-bold tracking-tight">
              {focusedAccount?.email}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono tracking-widest opacity-40 uppercase truncate">
              {focusedAccount?.password || 'no password'}
            </span>
          </div>
        </div>
        <div className="pr-6 text-right relative z-20">
          {focusedAccount?.status === 'active' ? (
            <Badge variant="ghost-success" className="gap-2 inline-flex items-center py-1 px-3">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.15em] font-black">Active</span>
            </Badge>
          ) : focusedAccount?.status === 'deleting' ? (
            <Badge variant="ghost-warning" className="gap-2 inline-flex items-center py-1 px-3">
              <Clock className="w-3 h-3 animate-spin-slow" />
              <span className="text-[10px] uppercase tracking-[0.15em] font-black">In Trash</span>
            </Badge>
          ) : (
            <Badge variant="ghost-error" className="gap-2 inline-flex items-center py-1 px-3">
              <span className="text-[10px] uppercase tracking-[0.15em] font-black">Disabled</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 flex bg-table-hoverItemBodyBg/5 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
        <div className="w-64 border-r border-border/30 bg-card/20 backdrop-blur-xl flex flex-col pt-4 shrink-0 overflow-hidden relative">
          <div className="flex-1 space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('info');
              }}
              className={cn(
                'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all relative group',
                activeTab === 'info'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={{
                background:
                  activeTab === 'info'
                    ? 'linear-gradient(to right, #f59e0b15, transparent)'
                    : undefined,
              }}
            >
              {activeTab === 'info' && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#f59e0b] rounded-l-lg shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
              )}
              <User
                className={cn(
                  'w-5 h-5 ml-6 transition-colors',
                  activeTab === 'info' ? 'text-[#f59e0b]' : 'text-muted-foreground/50',
                )}
              />
              <span>Information</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('services');
              }}
              className={cn(
                'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all relative group',
                activeTab === 'services'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={{
                background:
                  activeTab === 'services'
                    ? 'linear-gradient(to right, #3b82f615, transparent)'
                    : undefined,
              }}
            >
              {activeTab === 'services' && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3b82f6] rounded-l-lg shadow-[0_0_12px_rgba(59,130,246,0.4)]" />
              )}
              <LayoutGrid
                className={cn(
                  'w-5 h-5 ml-6 transition-colors',
                  activeTab === 'services' ? 'text-[#3b82f6]' : 'text-muted-foreground/50',
                )}
              />
              <span>Services</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('inbox');
              }}
              className={cn(
                'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all relative group',
                activeTab === 'inbox'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={{
                background:
                  activeTab === 'inbox'
                    ? 'linear-gradient(to right, #10b98115, transparent)'
                    : undefined,
              }}
            >
              {activeTab === 'inbox' && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#10b981] rounded-l-lg shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
              )}
              <Mail
                className={cn(
                  'w-5 h-5 ml-6 transition-colors',
                  activeTab === 'inbox' ? 'text-[#10b981]' : 'text-muted-foreground/50',
                )}
              />
              <span>Inbox Preview</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('fingerprint');
              }}
              className={cn(
                'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all relative group',
                activeTab === 'fingerprint'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={{
                background:
                  activeTab === 'fingerprint'
                    ? 'linear-gradient(to right, #8b5cf615, transparent)'
                    : undefined,
              }}
            >
              {activeTab === 'fingerprint' && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#8b5cf6] rounded-l-lg shadow-[0_0_12px_rgba(139,92,246,0.4)]" />
              )}
              <Shield
                className={cn(
                  'w-5 h-5 ml-6 transition-colors',
                  activeTab === 'fingerprint' ? 'text-[#8b5cf6]' : 'text-muted-foreground/50',
                )}
              />
              <span>Health & Identity</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('sessions');
              }}
              className={cn(
                'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all relative group',
                activeTab === 'sessions'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={{
                background:
                  activeTab === 'sessions'
                    ? 'linear-gradient(to right, #ec489915, transparent)'
                    : undefined,
              }}
            >
              {activeTab === 'sessions' && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#ec4899] rounded-l-lg shadow-[0_0_12px_rgba(236,72,153,0.4)]" />
              )}
              <Database
                className={cn(
                  'w-5 h-5 ml-6 transition-colors',
                  activeTab === 'sessions' ? 'text-[#ec4899]' : 'text-muted-foreground/50',
                )}
              />
              <span>Website Sessions</span>
            </button>
          </div>

          {focusedAccount?.status === 'deleting' && (
            <div className="p-4 border-t border-border/30 bg-amber-500/5 space-y-3 shrink-0">
              <button
                onClick={() => onRestore(focusedAccount.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Restore Account
              </button>
              <button
                onClick={() => onHardDelete(focusedAccount.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
              >
                <Trash className="w-3.5 h-3.5" />
                Delete Permanently
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-background/20 backdrop-blur-3xl">
          <div className="flex-1 overflow-auto custom-scrollbar">
            {activeTab === 'info' ? (
              <InfoTab
                editedAccount={editedAccount}
                setEditedAccount={setEditedAccount}
                validateField={validateField}
                errors={errors}
                backupCodeSearch={backupCodeSearch}
                setBackupCodeSearch={setBackupCodeSearch}
              />
            ) : activeTab === 'services' ? (
              <ServicesTab
                serviceSearch={serviceSearch}
                setServiceSearch={setServiceSearch}
                accountServices={accountServices}
                onAddNewServiceLink={onAddNewServiceLink}
                onEditServiceLink={onEditServiceLink}
                onServiceContextMenu={onServiceContextMenu}
              />
            ) : activeTab === 'inbox' ? (
              <InboxTab email={editedAccount?.email || ''} />
            ) : activeTab === 'fingerprint' ? (
              <FingerprintTab email={editedAccount?.email || ''} />
            ) : (
              <SessionsTab email={editedAccount?.email || ''} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailView;
