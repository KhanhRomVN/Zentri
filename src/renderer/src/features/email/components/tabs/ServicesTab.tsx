import { Search, Plus, ShieldCheck, Lock, LayoutGrid } from 'lucide-react';
import { useRef, FC } from 'react';
import { cn } from '../../../../shared/lib/utils';


interface ServicesTabProps {
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  accountServices: any[];
  onAddNewServiceLink: () => void;
  onEditServiceLink: (linkId: string) => void;
  onServiceContextMenu: (e: React.MouseEvent, linkId: string) => void;
}

const ServicesTab: FC<ServicesTabProps> = ({
  serviceSearch,
  setServiceSearch,
  accountServices,
  onAddNewServiceLink,
  onEditServiceLink,
  onServiceContextMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Derived filtered services
  const filteredServices = (accountServices || []).filter(
    (s: any) =>
      !serviceSearch ||
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.url?.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden relative" ref={containerRef}>
      {/* Services Sub-Navbar */}
      <div className="h-[48px] flex items-center justify-between px-4 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-500">
        <div className="w-80 flex items-center transition-all duration-500">
          <div className="relative flex items-center w-full h-9 bg-input-background border border-border rounded-md transition-all duration-300">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search services..."
              value={serviceSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceSearch(e.target.value)}
              className="w-full h-full pl-10 pr-3 bg-transparent text-sm text-foreground placeholder:text-text-secondary outline-none rounded-md"
            />
          </div>
        </div>
        <button
          onClick={onAddNewServiceLink}
          className="w-9 h-9 flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-primary hover:bg-primary/30 transition-all active:scale-90 border border-border group"
          title="Link New Service"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative min-h-0 bg-card/5 backdrop-blur-sm">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="border-collapse table-fixed w-full">
            <thead className="sticky top-0 z-30">
              <tr className="hover:bg-transparent border-b border-border/50 bg-table-headerBg shadow-sm">
                <th className="w-[60px] pl-8 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                  #
                </th>
                <th className="w-[25%] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                  Service
                </th>
                <th className="w-[22%] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-center text-muted-foreground">
                  Account
                </th>
                <th className="w-[18%] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-center text-muted-foreground">
                  Last Used
                </th>
                <th className="w-[110px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-center text-muted-foreground">
                  Status
                </th>
                <th className="w-[90px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-center text-muted-foreground">
                  Secrets
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 ? (
                <tr className="hover:bg-transparent">
                  <td colSpan={6} className="h-40">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                      <LayoutGrid className="w-8 h-8" />
                      <p className="text-[11px] font-black uppercase tracking-widest">
                        No services linked
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredServices.map((service: any, index: number) => (
                  <tr
                    key={service.id}
                    className={cn(
                      'group border-b border-border/10 hover:bg-white/[0.02] h-12 transition-all duration-300 cursor-pointer',
                      service.status === 'trash' && 'opacity-60 grayscale-[0.5] italic',
                    )}
                    onClick={() => onEditServiceLink(service.id)}
                    onContextMenu={(e: React.MouseEvent) => onServiceContextMenu(e, service.id)}
                  >
                    <td className="pl-8 py-2 text-muted-foreground font-mono text-[10px]">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-3 group/val">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center p-1 border border-white/5 shadow-sm transition-transform group-hover/val:scale-110">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${service.url}&sz=64`}
                            className="w-full h-full object-contain transition-all opacity-100"
                            alt=""
                            onError={(e: any) => (e.target.style.display = 'none')}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-bold text-foreground/90 leading-tight group-hover:text-primary transition-colors truncate">
                            {service.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground/40 font-mono truncate">
                            {service.url}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex flex-col items-center gap-0.5 group/creds">
                        <span
                          className={cn(
                            'text-[12px] font-bold text-foreground/80 leading-none',
                            !service.username && 'opacity-20 italic font-normal',
                          )}
                        >
                          {service.username || '—'}
                        </span>
                        {service.password ? (
                          <div
                            className="flex items-center gap-1 opacity-30 group-hover/creds:opacity-60 transition-opacity"
                            title="Right click to copy password"
                            onContextMenu={(e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigator.clipboard.writeText(service.password);
                            }}
                          >
                            <span className="font-mono text-[9px] tracking-tight truncate max-w-[100px]">
                              {service.password.replace(/./g, '•')}
                            </span>
                            <Lock className="w-2 h-2" />
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[11px] font-medium text-foreground/60 leading-none">
                          {service.lastUsedAt
                            ? new Date(service.lastUsedAt).toLocaleDateString()
                            : '—'}
                        </span>
                        {service.lastUsedAt && (
                          <span className="text-[9px] text-muted-foreground/40 font-mono">
                            {new Date(service.lastUsedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex justify-center">
                        <div
                          className={cn(
                            'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all duration-300',
                            service.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_12px_-4px_rgba(16,185,129,0.3)]'
                              : service.status === 'trash'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-muted text-muted-foreground border-transparent',
                          )}
                        >
                          {service.status || 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 font-bold text-center">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-bold transition-all shadow-sm">
                          <ShieldCheck className="w-3 h-3" />
                          {service.secretCount || 0}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ServicesTab;