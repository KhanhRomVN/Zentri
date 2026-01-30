import React from 'react';
import { cn } from '@renderer/shared/lib/utils';
import { ProxyItem } from '../types/types';
import { MoreHorizontal, Clock, CheckCircle2, Building2 } from 'lucide-react';

interface ProxyTableProps {
  proxies: ProxyItem[];
  onProxySelect: (proxy: ProxyItem) => void;
  selectedProxyId?: string;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
}

const ProxyTable: React.FC<ProxyTableProps> = ({
  proxies,
  onProxySelect,
  selectedProxyId,
  selectedIds,
  onToggleSelect,
  onToggleAll,
}) => {
  const isAllSelected = proxies.length > 0 && selectedIds.length === proxies.length;

  return (
    <div className="flex-1 overflow-auto bg-background/50 backdrop-blur-sm">
      <table className="w-full text-left border-collapse table-fixed">
        <thead className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border shadow-sm">
          {/* Header row - Chiều cao gọn gàng h-12 (48px) */}
          <tr className="h-12">
            <th className="px-4 w-12 text-center">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAll();
                }}
                className={cn(
                  'w-4 h-4 rounded border border-border flex items-center justify-center cursor-pointer transition-all mx-auto',
                  isAllSelected
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-input hover:border-primary/50',
                )}
              >
                {isAllSelected && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
              </div>
            </th>
            <th className="px-4 w-12 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              STT
            </th>
            <th className="px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Proxy Address
            </th>
            <th className="px-4 w-28 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Type
            </th>
            <th className="px-4 w-36 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Country
            </th>
            <th className="px-4 w-44 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Expired
            </th>
            <th className="px-4 w-16 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {proxies.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="py-24 text-center text-muted-foreground italic text-[15px]"
              >
                No proxies found match your current filters.
              </td>
            </tr>
          ) : (
            proxies.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isItemActive = selectedProxyId === item.id;

              return (
                <tr
                  key={item.id}
                  onClick={() => onProxySelect(item)}
                  className={cn(
                    'group cursor-pointer transition-all duration-200 border-l-2 border-transparent relative',
                    isItemActive ? 'bg-primary/10 border-l-primary' : 'hover:bg-muted/30',
                  )}
                >
                  <td className="px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div
                      onClick={() => onToggleSelect(item.id)}
                      className={cn(
                        'w-4 h-4 rounded border border-border flex items-center justify-center cursor-pointer transition-all mx-auto',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-input hover:border-primary/50',
                      )}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </td>
                  <td className="p-4 text-xs font-medium text-center text-muted-foreground/60">
                    {item.stt}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-foreground font-mono tracking-tight group-hover:text-primary transition-colors">
                        {item.proxy}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 opacity-80">
                        {item.details?.isp && (
                          <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" /> {item.details.isp}
                          </span>
                        )}
                        {item.lastCheck && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {item.lastCheck}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-[4px] text-[10px] font-bold border',
                        item.type === 'HTTPS'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                      )}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      {item.countryCode ? (
                        <img
                          src={`https://flagcdn.com/w20/${item.countryCode.toLowerCase()}.png`}
                          alt={item.country}
                          className="w-4 h-3 object-cover rounded shadow-sm opacity-90"
                        />
                      ) : (
                        <div className="w-4 h-3 bg-muted rounded-sm" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {item.country || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          item.status === 'active' ? 'text-emerald-500' : 'text-rose-500',
                        )}
                      >
                        {item.expired}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] uppercase font-bold tracking-tighter opacity-50',
                          item.status === 'active' ? 'text-emerald-500' : 'text-rose-500',
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProxyTable;
