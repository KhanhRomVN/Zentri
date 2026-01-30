import {
  ArrowLeft,
  XCircle,
  Loader2,
  Link2,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Calendar,
  Cpu,
} from 'lucide-react';
import { RegAccount, RegSession, PlatformConfig, Agent } from '../types';
import { cn } from '../../../shared/lib/utils';

interface AccountTableProps {
  session: RegSession;
  accounts: RegAccount[];
  config: PlatformConfig;
  agents: Agent[];
  onBack: () => void;
  onOpenAgentDrawer: (accountId: string) => void;
}

const AccountTable = ({
  session,
  accounts,
  config,
  agents,
  onBack,
  onOpenAgentDrawer,
}: AccountTableProps) => {
  const renderCell = (account: RegAccount, column: PlatformConfig['columns'][0]) => {
    const value = account[column.key as keyof RegAccount] || account.metadata?.[column.key];

    switch (column.type) {
      case 'agent':
        const agent = agents.find((a) => a.id === account.agentId);
        return (
          <button
            onClick={() => onOpenAgentDrawer(account.id)}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all text-xs font-bold',
              agent
                ? 'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10'
                : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted',
            )}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="truncate max-w-[100px]">{agent ? agent.name : 'Add Agent'}</span>
          </button>
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
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Table Header */}
      <div className="h-16 shrink-0 flex items-center gap-4 px-6 border-b border-border bg-card/10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{session.name}</h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
            <span>{session.accountCount} Accounts</span>
            <span>•</span>
            <span>Created {new Date(session.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-md border-b border-border">
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
                className="group hover:bg-muted/30 transition-colors duration-200"
              >
                <td className="px-6 py-4 text-xs text-muted-foreground font-medium">{index + 1}</td>
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
  );
};

export default AccountTable;
