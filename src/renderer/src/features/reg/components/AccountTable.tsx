import {
  ArrowLeft,
  XCircle,
  Loader2,
  Link2,
  MoreHorizontal,
  ShieldCheck,
  Calendar,
  Cpu,
  Plus,
  ChevronDown,
} from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../shared/components/ui/dropdown';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../shared/components/ui/tooltip';
import { RegAccount, RegSession, PlatformConfig, Agent } from '../types';
import { USER_AGENTS } from '../constants';
import { cn } from '../../../shared/lib/utils';

interface AccountTableProps {
  session: RegSession;
  accounts: RegAccount[];
  config: PlatformConfig;
  agents: Agent[];
  onBack: () => void;
  onUpdateAccountAgent: (accountId: string, agentId: string) => void;
  onCreateAccount: () => void;
  onCreateAgent: () => void;
  onQuickCreateAgent: (
    accountId: string,
    agentInfo: { name: string; userAgent: string; os: string },
  ) => void;
  onEditAccount: (account: RegAccount) => void;
}

const AccountTable = ({
  session,
  accounts,
  config,
  agents,
  onBack,
  onUpdateAccountAgent,
  onCreateAccount,
  onCreateAgent,
  onQuickCreateAgent,
  onEditAccount,
}: AccountTableProps) => {
  const renderCell = (account: RegAccount, column: PlatformConfig['columns'][0]) => {
    const value = account[column.key as keyof RegAccount] || account.metadata?.[column.key];

    switch (column.type) {
      case 'agent':
        const agent = agents.find((a) => a.id === account.agentId);
        return (
          <div className="w-[180px]">
            <Dropdown className="w-full">
              <DropdownTrigger className="w-full h-9 px-2.5 text-xs bg-background border border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-all rounded-md shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-2 truncate flex-1">
                  <Cpu className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary/80 transition-colors" />
                  <span className="truncate font-medium">
                    {agent ? (
                      <span className="text-foreground">{agent.name}</span>
                    ) : (
                      <span className="text-muted-foreground/70 italic">Select Agent</span>
                    )}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors ml-1" />
              </DropdownTrigger>
              <DropdownContent align="start" className="w-[220px] max-h-[400px]">
                {/* Existing Agents */}
                {agents.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                      Your Agents
                    </div>
                    {agents.map((a) => (
                      <DropdownItem
                        key={a.id}
                        onClick={() => onUpdateAccountAgent(account.id, a.id)}
                        className="py-2"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                              <span className="font-bold text-xs truncate">{a.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate opacity-70">
                                {a.os} • {a.userAgent.substring(0, 30)}...
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-[300px] bg-popover border-border p-3"
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-xs">{a.name}</p>
                              <div className="text-[10px] text-muted-foreground space-y-0.5">
                                <p>
                                  <span className="font-medium text-foreground">OS:</span> {a.os}
                                </p>
                                <p>
                                  <span className="font-medium text-foreground">UA:</span>{' '}
                                  {a.userAgent}
                                </p>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </DropdownItem>
                    ))}
                    <div className="my-1 border-t border-border/50" />
                  </>
                )}

                {/* Desktop Presets */}
                <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground/50 uppercase pl-4">
                  Desktop
                </div>
                {USER_AGENTS.filter((ua) => ua.group === 'Desktop')
                  .slice(0, 5)
                  .map((ua) => (
                    <DropdownItem
                      key={ua.value}
                      onClick={() =>
                        onQuickCreateAgent(account.id, {
                          name: ua.label,
                          userAgent: ua.value,
                          os: ua.os,
                        })
                      }
                      className="py-1.5"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 w-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                            <span className="text-xs truncate">{ua.label}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="max-w-[300px] bg-popover border-border p-3"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-xs">{ua.label}</p>
                            <div className="text-[10px] text-muted-foreground space-y-0.5">
                              <p>
                                <span className="font-medium text-foreground">OS:</span> {ua.os}
                              </p>
                              <p>
                                <span className="font-medium text-foreground">UA:</span> {ua.value}
                              </p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </DropdownItem>
                  ))}

                {/* Mobile Presets */}
                <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground/50 uppercase pl-4 mt-1">
                  Mobile
                </div>
                {USER_AGENTS.filter((ua) => ua.group === 'Mobile')
                  .slice(0, 3)
                  .map((ua) => (
                    <DropdownItem
                      key={ua.value}
                      onClick={() =>
                        onQuickCreateAgent(account.id, {
                          name: ua.label,
                          userAgent: ua.value,
                          os: ua.os,
                        })
                      }
                      className="py-1.5"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 w-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 shrink-0" />
                            <span className="text-xs truncate">{ua.label}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="max-w-[300px] bg-popover border-border p-3"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-xs">{ua.label}</p>
                            <div className="text-[10px] text-muted-foreground space-y-0.5">
                              <p>
                                <span className="font-medium text-foreground">OS:</span> {ua.os}
                              </p>
                              <p>
                                <span className="font-medium text-foreground">UA:</span> {ua.value}
                              </p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </DropdownItem>
                  ))}
              </DropdownContent>
            </Dropdown>
          </div>
        );
      case 'status':
        return (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider',
              value === 'success'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : value === 'failed'
                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            )}
          >
            {value === 'success' ? (
              <ShieldCheck className="w-3 h-3" />
            ) : value === 'failed' ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <Loader2 className="w-3 h-3 animate-spin" />
            )}
            {value || 'unknown'}
          </div>
        );
      case 'date':
        return (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {value ? new Date(value as string).toLocaleDateString() : 'N/A'}
          </div>
        );
      case 'link':
        return (
          <div className="flex items-center gap-2 text-xs font-mono text-primary hover:underline cursor-pointer">
            <Link2 className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{value as string}</span>
          </div>
        );
      default:
        return <span className="text-sm font-medium text-foreground/80">{value as string}</span>;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Table Header */}
        <div className="h-16 shrink-0 flex items-center gap-4 px-6 border-b border-border">
          <button
            onClick={onBack}
            className="p-2 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-tight">{session.name}</h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              <span>{session.accountCount} Accounts</span>
              <span>•</span>
              <span>Created {new Date(session.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button
            onClick={onCreateAccount}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-md transition-all text-primary border border-primary/20 hover:border-primary/40 group"
            title="Add Account"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold uppercase tracking-wider">Add Account</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-table-headerBg border-b border-border">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-12">
                  #
                </th>
                {config.columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {accounts.map((account, index) => (
                <tr
                  key={account.id}
                  className="group transition-colors duration-200 cursor-pointer"
                  onClick={() => onEditAccount(account)}
                >
                  <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                    {index + 1}
                  </td>
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      {renderCell(account, col)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center">
                    <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AccountTable;
