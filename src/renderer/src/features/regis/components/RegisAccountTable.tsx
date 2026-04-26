import { FC } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  User,
  Shield,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { BatchType } from '../index';
import { cn } from '../../../shared/lib/utils';

interface RegisAccountTableProps {
  batch: BatchType;
  onBack: () => void;
  accounts?: any[];
}

const RegisAccountTable: FC<RegisAccountTableProps> = ({ batch, onBack, accounts = [] }) => {
  return (
    <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
      {/* Header with Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-card/40 border border-border/50 hover:bg-card transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-foreground leading-none mb-1">{batch.name}</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Session: {batch.sessionID} • {batch.accountCount} Total Units
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search units..."
              className="h-11 w-64 pl-10 pr-4 bg-card/40 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all backdrop-blur-md"
            />
          </div>
          <button className="h-11 px-4 bg-card/40 border border-border/50 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-card transition-all">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="h-11 px-6 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 min-h-0 bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 opacity-30">
              <User className="w-16 h-16 mb-4 text-muted-foreground/20" />
              <span className="text-[12px] font-black uppercase tracking-[0.2em]">
                No Units Synchronized
              </span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/50">
                    STT
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/50">
                    Identifier / Email
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/50">
                    Node Status
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/50">
                    Maturation
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/50">
                    Proxy Uplink
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/50 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {accounts.map((acc, idx) => (
                  <tr key={acc.id} className="group hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold font-mono text-muted-foreground/30">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center p-2 group-hover:bg-background transition-colors">
                          <User className="w-4 h-4 text-primary/60" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-foreground">{acc.email}</span>
                          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                            {acc.provider}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={cn(
                          'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
                          acc.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400',
                        )}
                      >
                        {acc.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {acc.status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-bold text-foreground/70">{acc.age}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground/50">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-mono font-bold tracking-tight">
                          {acc.proxy}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Simple Footer Stats */}
        <div className="px-8 h-16 border-t border-border/50 flex items-center justify-between bg-card/20 text-muted-foreground/40 font-bold uppercase tracking-widest text-[10px]">
          <span>
            Units Analyzed: {accounts.length} / {batch.accountCount}
          </span>
          <div className="flex items-center gap-6">
            <span className="text-emerald-500/60">Functional: {batch.successCount}</span>
            <span className="text-rose-500/60">Decommissioned: {batch.failedCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisAccountTable;
