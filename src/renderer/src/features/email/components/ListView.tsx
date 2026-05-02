import { FC } from 'react';
import { Mail, Clock, ShieldCheck, Phone, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
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
  const { t } = useTranslation();

  const renderLastActivity = (account: Account) => {
    if (!account.lastActivity) {
      return (
        <span className="text-[10px] italic opacity-20 ml-6">—</span>
      );
    }

    const { url, title, time } = account.lastActivity;
    let hostname = '';
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = url;
    }

    return (
      <div className="flex items-center gap-3 group/act max-w-full">
        <div className="w-8 h-8 flex items-center justify-center overflow-hidden shrink-0 transition-colors">
          <img
            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
            className="w-5 h-5 opacity-70 group-hover/act:opacity-100 transition-opacity"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://www.google.com/s2/favicons?domain=google.com&sz=32';
            }}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold text-foreground/80 truncate group-hover/act:text-foreground transition-colors leading-tight">
            {title || hostname}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-muted-foreground/40 font-mono tracking-tight group-hover/act:text-muted-foreground/60">
              {formatDistanceToNow(new Date(time), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto custom-scrollbar flex flex-col min-h-0">
      <Table className="border-collapse table-fixed w-full">
        <TableHeader className="sticky top-0 z-30">
          <TableRow className="hover:bg-transparent border-b border-border/50 bg-table-headerBg shadow-sm">
            <HeaderCell className="w-[60px] pl-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10">
              {t('table.stt')}
            </HeaderCell>
            <HeaderCell className="w-[240px] text-[10px] uppercase tracking-[0.2em] font-bold h-10">
              {t('table.email')}
            </HeaderCell>
            <HeaderCell
              align="left"
              className="w-1/3 text-[10px] uppercase tracking-[0.2em] font-bold h-10"
            >
              Hoạt động gần nhất
            </HeaderCell>
            <HeaderCell
              align="left"
              className="w-[300px] text-[10px] uppercase tracking-[0.2em] font-bold h-10"
            >
              {t('table.lastUsedProxy')}
            </HeaderCell>
            <HeaderCell
              align="center"
              className="w-[120px] text-[10px] uppercase tracking-[0.2em] font-bold h-10"
            >
              {t('table.status')}
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
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform overflow-hidden border border-primary/5">
                    {avatars[account.email] ? (
                      <img
                        src={avatars[account.email]}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Mail className="w-4 h-4 opacity-40" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-foreground text-[14px] font-bold tracking-tight truncate">
                      {account.email}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40 font-mono tracking-wider truncate uppercase">
                      {account.password || t('email.list.noPassword')}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell>{renderLastActivity(account)}</TableCell>

              <TableCell align="left">
                <div className="flex flex-col items-start gap-1 min-w-0 px-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  {account.lastProxy ? (
                    <>
                      <div className="flex items-center gap-2 w-full justify-start">
                        <span className="text-[14px] font-bold text-foreground/80 truncate">
                          {account.lastProxy.host}
                        </span>
                        <Badge
                          variant={
                            account.lastProxy.protocol.includes('socks') 
                              ? 'primary' 
                              : account.lastProxy.protocol.includes('https') 
                                ? 'success' 
                                : 'warning'
                          }
                          className="px-1.5 py-0 h-3.5 text-[8px] font-black uppercase tracking-tighter border-none"
                        >
                          {account.lastProxy.protocol.toUpperCase()}
                        </Badge>
                      </div>
                      {account.lastProxy.country && (
                        <div className="flex items-center gap-1 text-[12px] font-mono text-muted-foreground/60 tracking-tight truncate w-full justify-start">
                          <Globe className="w-2.5 h-2.5 opacity-40" />
                          <span className="truncate">
                            {account.lastProxy.city ? `${account.lastProxy.city}, ` : ''}
                            {account.lastProxy.country}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
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
                      {t('email.list.active')}
                    </span>
                  </Badge>
                ) : account.status === 'deleting' ? (
                  <Badge
                    variant="ghost-warning"
                    className="gap-2 inline-flex items-center py-1 px-3"
                  >
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-[0.15em] font-black">
                      {t('email.list.trash')}
                    </span>
                  </Badge>
                ) : (
                  <Badge variant="ghost-error" className="gap-2 inline-flex items-center py-1 px-3">
                    <span className="text-[10px] uppercase tracking-[0.15em] font-black">
                      {t('email.list.disabled')}
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
