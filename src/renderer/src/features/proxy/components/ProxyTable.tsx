import { FC, useState, useMemo } from 'react';
import { Proxy } from '../types';
import Badge from '../../../shared/components/ui/badge/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  HeaderCell,
} from '../../../shared/components/ui/table';
import { Globe, Shield, Zap, Info, Network } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import Pagination from '../../../shared/components/ui/pagination/Pagination';

interface ProxyTableProps {
  proxies: Proxy[];
  onEdit: (proxy: Proxy) => void;
  onRefresh: () => void;
}

const PAGE_SIZE = 15;

const ProxyTable: FC<ProxyTableProps> = ({ proxies, onEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'warning';
      case 'disabled':
        return 'error';
      default:
        return 'default';
    }
  };

  const isEmpty = proxies.length === 0;

  // Pagination logic
  const totalItems = proxies.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // Ensure current page is valid if list shrinks
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  if (currentPage !== validCurrentPage) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedProxies = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return proxies.slice(start, start + PAGE_SIZE);
  }, [proxies, validCurrentPage]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-card/10">
      {/* Scrollable Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <Table className="border-collapse min-w-full table-fixed">
          <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-md z-10">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <HeaderCell className="text-[10px] font-black uppercase tracking-widest h-[57px] px-6 text-muted-foreground/50 w-[200px]">
                Host / IP
              </HeaderCell>
              <HeaderCell className="text-[10px] font-black uppercase tracking-widest h-[57px] px-6 text-muted-foreground/50 w-[100px]">
                Protocol
              </HeaderCell>
              <HeaderCell className="text-[10px] font-black uppercase tracking-widest h-[57px] px-6 text-muted-foreground/50 w-[120px]">
                Type
              </HeaderCell>
              <HeaderCell className="text-[10px] font-black uppercase tracking-widest h-[57px] px-6 text-muted-foreground/50 w-[120px]">
                Source
              </HeaderCell>
              <HeaderCell className="text-[10px] font-black uppercase tracking-widest h-[57px] px-6 text-muted-foreground/50">
                Location
              </HeaderCell>
              <HeaderCell className="text-[10px] font-black uppercase tracking-widest h-[57px] px-6 text-muted-foreground/50 w-[120px]">
                Price
              </HeaderCell>
              <HeaderCell className="text-[10px] font-black uppercase tracking-widest h-[57px] px-6 text-muted-foreground/50 text-center w-[100px]">
                Status
              </HeaderCell>
              <HeaderCell className="text-[10px] font-black uppercase tracking-widest h-[57px] px-6 text-muted-foreground/50 text-right w-[120px]">
                Updated
              </HeaderCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isEmpty ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-[400px] text-center border-none">
                  <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
                      <div className="relative w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center text-muted-foreground/20 border border-border/50">
                        <Network className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground">No Proxy Data</p>
                      <p className="text-[10px] text-muted-foreground/40 max-w-[200px] mx-auto leading-relaxed">
                        The infrastructure registry is currently empty. Initialize a new node to
                        begin.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProxies.map((proxy) => (
                <TableRow
                  key={proxy.id}
                  onClick={() => onEdit(proxy)}
                  className="group border-b border-border/10 hover:bg-primary/[0.03] cursor-pointer transition-all duration-300"
                >
                  <TableCell className="py-4 px-6 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-border/50">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold font-mono tracking-tight text-foreground/90 truncate">
                          {proxy.host}:{proxy.port}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50 truncate tracking-tight">
                          {proxy.username || 'Anonymous Access'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-black uppercase tracking-widest bg-muted/5 border-border/40 px-2"
                    >
                      {proxy.protocol?.toUpperCase() || 'HTTP'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Zap
                        className={cn(
                          'w-3 h-3',
                          proxy.proxyType === 'private' ? 'text-indigo-400' : 'text-blue-400',
                        )}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-tight opacity-70">
                        {proxy.proxyType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">
                    {proxy.sourceType}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-muted-foreground/30" />
                      <span className="text-[10px] font-bold text-muted-foreground/80">
                        {proxy.country || 'GLOBAL'}
                      </span>
                      {proxy.city && (
                        <span className="text-[9px] text-muted-foreground/30">/ {proxy.city}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 font-mono text-[10px] font-bold">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-foreground/90">{proxy.price || 0}</span>
                      <span className="text-muted-foreground/40 text-[9px]">
                        {proxy.metadata?.currency || 'USD'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center">
                    <Badge
                      variant={getStatusVariant(proxy.status)}
                      dot
                      className="text-[9px] font-black uppercase tracking-widest py-0.5"
                    >
                      {proxy.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <span className="text-[10px] font-bold font-mono text-muted-foreground/40">
                      {proxy.updatedAt ? new Date(proxy.updatedAt).toLocaleDateString() : '---'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Fixed Footer Bar with Pagination */}
      <div className="h-[64px] shrink-0 bg-card/80 backdrop-blur-md border-t border-border/50 px-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/60 transition-all hover:text-emerald-500">
              Active: {proxies.filter((p) => p.status === 'active').length}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/60 transition-all hover:text-amber-500">
              Expired: {proxies.filter((p) => p.status === 'expired').length}
            </span>
          </div>
        </div>

        {/* Pagination UI */}
        {!isEmpty && totalPages > 1 && (
          <Pagination
            totalItems={totalItems}
            itemsPerPage={PAGE_SIZE}
            currentPage={validCurrentPage}
            onPageChange={setCurrentPage}
            variant="compact"
            size="sm"
          />
        )}

        <div className="flex items-center gap-3 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
          <Info className="w-3 h-3 text-primary/40" />
          <span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.15em]">
            TOTAL NODES: {proxies.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProxyTable;
