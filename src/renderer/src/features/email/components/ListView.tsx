import { FC } from 'react';
import { Mail, Clock, ShieldCheck, Phone } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  HeaderCell,
  TableCell,
} from '../../../shared/components/ui/table';
import Badge from '../../../shared/components/ui/badge/Badge';
import { Account } from '../types';

interface ListViewProps {
  accounts: Account[];
  avatars: Record<string, string>;
  onSelectAccount: (account: Account) => void;
  onContextMenu: (e: React.MouseEvent, accountId: string) => void;
}

const ListView: FC<ListViewProps> = ({ accounts, avatars, onSelectAccount, onContextMenu }) => {
  return (
    <div className="flex-1 overflow-auto custom-scrollbar flex flex-col min-h-0">
      <Table className="border-collapse table-fixed w-full">
        <TableHeader className="sticky top-0 z-30">
          <TableRow className="hover:bg-transparent border-b border-border/50 bg-table-headerBg shadow-sm">
            <HeaderCell className="w-[80px] pl-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10">
              STT
            </HeaderCell>
            <HeaderCell className="text-[10px] uppercase tracking-[0.2em] font-bold h-10">
              Email
            </HeaderCell>
            <HeaderCell
              align="center"
              className="w-[220px] text-[10px] uppercase tracking-[0.2em] font-bold h-10"
            >
              Recovery / Phone
            </HeaderCell>
            <HeaderCell
              align="center"
              className="w-[140px] text-[10px] uppercase tracking-[0.2em] font-bold h-10"
            >
              Status
            </HeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account, index) => (
            <TableRow
              key={account.id}
              className={cn(
                'group transition-all cursor-pointer border-b border-border/20 h-[64px] hover:bg-table-hoverItemBodyBg/50 relative',
                account.status === 'deleting' && 'opacity-60 grayscale-[0.5]',
              )}
              onClick={() => onSelectAccount(account)}
              onContextMenu={(e) => onContextMenu(e, account.id)}
            >
              <TableCell className="text-muted-foreground font-mono text-[10px] pl-6 py-2">
                #{String(index + 1).padStart(2, '0')}
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform overflow-hidden border border-primary/5">
                    {avatars[account.email] ? (
                      <img
                        src={avatars[account.email]}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Mail className="w-5 h-5 opacity-40" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-foreground text-[14px] font-bold tracking-tight truncate max-w-[250px]">
                      {account.email}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40 font-mono tracking-wider truncate uppercase">
                      {account.password || 'no password'}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell align="center">
                <div className="flex flex-col items-center gap-1 min-w-0 px-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  {account.recoveryEmail ? (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/80 truncate w-full justify-center">
                      <ShieldCheck className="w-3 h-3 text-blue-500/50" />
                      <span className="truncate">{account.recoveryEmail}</span>
                    </div>
                  ) : null}
                  {account.phoneNumber ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 tracking-tight truncate w-full justify-center">
                      <Phone className="w-2.5 h-2.5 opacity-40" />
                      <span>{account.phoneNumber}</span>
                    </div>
                  ) : null}
                  {!account.recoveryEmail && !account.phoneNumber && (
                    <span className="text-[10px] italic opacity-20">—</span>
                  )}
                </div>
              </TableCell>

              <TableCell align="center">
                {account.status === 'active' ? (
                  <Badge
                    variant="ghost-success"
                    className="gap-2 inline-flex items-center py-1 px-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.15em] font-black">
                      Active
                    </span>
                  </Badge>
                ) : account.status === 'deleting' ? (
                  <Badge
                    variant="ghost-warning"
                    className="gap-2 inline-flex items-center py-1 px-3"
                  >
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-[0.15em] font-black">
                      Trash
                    </span>
                  </Badge>
                ) : (
                  <Badge variant="ghost-error" className="gap-2 inline-flex items-center py-1 px-3">
                    <span className="text-[10px] uppercase tracking-[0.15em] font-black">
                      Disabled
                    </span>
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ListView;
