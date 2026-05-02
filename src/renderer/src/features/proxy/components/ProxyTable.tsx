import React, { FC, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Proxy } from '../types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  HeaderCell,
} from '../../../shared/components/ui/table';
import { Globe, Shield, Zap, Info, Network, Trash2, Check, Eye, AlertCircle } from 'lucide-react';
import Portal from '../../../shared/components/ui/Portal';
import Modal from '../../../shared/components/ui/modal/Modal';
import InlineProxyForm from './InlineProxyForm';
import { toast } from 'sonner';
import { cn } from '../../../shared/lib/utils';
import Pagination from '../../../shared/components/ui/pagination/Pagination';

interface ProxyTableProps {
  proxies: Proxy[];
  onEdit: (proxy: Proxy) => void;
  onRefresh: () => void;
}

const PAGE_SIZE = 15;

const ProxyTable: FC<ProxyTableProps> = ({ proxies, onRefresh }) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const [menuConfig, setMenuConfig] = useState<{ x: number; y: number; proxyId: string } | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10';
      case 'expired':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10';
      case 'disabled':
        return 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-500/10';
      case 'trash':
        return 'bg-slate-500/20 border-slate-500/50 text-slate-400 shadow-lg shadow-slate-500/10';
      default:
        return 'bg-muted/10 border-border/50 text-muted-foreground';
    }
  };

  const getProtocolColor = (protocol?: string) => {
    switch (protocol?.toLowerCase()) {
      case 'socks5':
        return 'text-amber-400';
      case 'https':
        return 'text-indigo-400';
      case 'http':
        return 'text-blue-400';
      default:
        return 'text-muted-foreground';
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

  const handleSoftDelete = async (id: string) => {
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('proxy:update', { id, data: { status: 'trash' } });
      toast.success(t('proxy.moveTrash'));
      onRefresh();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const handleHardDelete = (id: string) => {
    setTargetDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmHardDelete = async () => {
    if (!targetDeleteId) return;
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('proxy:delete', targetDeleteId);
      toast.success('Deleted permanently');
      onRefresh();
    } catch (e) {
      toast.error('Hard delete failed');
    } finally {
      setIsDeleteModalOpen(false);
      setTargetDeleteId(null);
    }
  };

  const handleCheckProxy = async (id: string) => {
    const proxy = proxies.find((p) => p.id === id);
    if (!proxy) return;
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('proxy:check', proxy);
      toast.success('Diagnostic complete');
      onRefresh();
    } catch (e) {
      toast.error('Diagnostic failed');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-card/10">
      {/* Scrollable Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <Table className="border-collapse min-w-full table-fixed">
          <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-md z-10 transition-all duration-500">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <HeaderCell className="text-[11px] font-black uppercase tracking-widest h-[57px] px-3 text-muted-foreground/50 w-[80px] text-left">
                {t('table.stt')}
              </HeaderCell>
              <HeaderCell className="text-[11px] font-black uppercase tracking-widest h-[57px] px-3 text-muted-foreground/50 w-[280px] text-left">
                {t('table.hostIp')}
              </HeaderCell>
              <HeaderCell className="text-[11px] font-black uppercase tracking-widest h-[57px] px-3 text-muted-foreground/50 text-left">
                {t('table.location')}
              </HeaderCell>
              <HeaderCell className="text-[11px] font-black uppercase tracking-widest h-[57px] px-3 text-muted-foreground/50 text-center w-[160px] whitespace-nowrap">
                {t('table.status')}
              </HeaderCell>
              <HeaderCell className="text-[11px] font-black uppercase tracking-widest h-[57px] px-3 text-muted-foreground/50 text-center w-[280px] whitespace-nowrap">
                {t('table.quota')}
              </HeaderCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isEmpty ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-[400px] text-center border-none">
                  <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
                      <div className="relative w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center text-muted-foreground/20 border border-border/50">
                        <Network className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[13px] font-bold text-muted-foreground">
                        {t('table.noData')}
                      </p>
                      <p className="text-[11px] text-muted-foreground/40 max-w-[200px] mx-auto leading-relaxed">
                        The infrastructure registry is currently empty. Initialize a new node to
                        begin.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProxies
                .filter((p) => (focusRowId ? p.id === focusRowId : true))
                .map((proxy, index) => (
                  <React.Fragment key={proxy.id}>
                    <TableRow
                      onClick={() => setFocusRowId(proxy.id === focusRowId ? null : proxy.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenuConfig({ x: e.clientX, y: e.clientY, proxyId: proxy.id });
                      }}
                      className={cn(
                        'group border-b border-border/10 hover:bg-primary/[0.03] cursor-pointer transition-all duration-300',
                        focusRowId === proxy.id &&
                          'bg-primary/[0.05] border-primary/20 sticky top-[57px] z-20 shadow-xl backdrop-blur-xl',
                      )}
                    >
                      <TableCell className="py-4 px-3 text-[14px] font-black text-muted-foreground/40 font-mono text-left">
                        {String((validCurrentPage - 1) * PAGE_SIZE + index + 1).padStart(2, '0')}
                      </TableCell>
                      <TableCell className="py-4 px-3 overflow-hidden text-left">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-bold font-mono tracking-tight text-foreground/90 truncate">
                                {proxy.host}:{proxy.port}
                              </span>
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 rounded bg-muted/10 text-[9px] font-black uppercase tracking-widest',
                                  getProtocolColor(proxy.protocol),
                                )}
                              >
                                {proxy.protocol?.toUpperCase() || 'HTTP'}
                              </span>
                            </div>
                            <span className="text-[12px] text-muted-foreground/50 truncate tracking-tight">
                              {proxy.username || 'Anonymous Access'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-3 text-left">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 justify-start">
                            <span className="text-[15px] font-bold text-foreground/90 tracking-tight">
                              {proxy.country || 'GLOBAL'}
                            </span>
                            {proxy.city && (
                              <span className="text-[14px] text-muted-foreground/60 truncate">
                                / {proxy.city}
                              </span>
                            )}
                          </div>
                          <div className="text-[13px] text-muted-foreground/70 font-medium truncate uppercase tracking-tight">
                            {proxy.isp || 'N/A Provider'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-3 w-[160px]">
                        <div className="flex items-center justify-center w-full">
                          <div
                            className={cn(
                              'inline-flex items-center px-4 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm transition-all hover:scale-105',
                              getStatusStyle(proxy.status),
                            )}
                          >
                            {t(`proxy.${proxy.status}`)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-3 text-center">
                        <span className="text-[13px] font-bold font-mono text-muted-foreground/40 whitespace-nowrap">
                          {proxy.pricingType === 'time'
                            ? (() => {
                                if (!proxy.expiredAt) return `${proxy.durationDays || 0} ${t('proxy.days')}`;
                                const expiry = new Date(proxy.expiredAt).getTime();
                                const diff = expiry - Date.now();
                                if (diff <= 0) return t('proxy.expired');
                                
                                const days = Math.floor(diff / (24 * 60 * 60 * 1000));
                                const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                                const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
                                
                                if (days > 0) return `${days} ngày ${hours} giờ`;
                                if (hours > 0) return `${hours} giờ ${minutes} phút`;
                                return `${minutes} phút`;
                              })()
                            : `${proxy.bandwidthGb || 0} GB`}
                        </span>
                      </TableCell>
                    </TableRow>

                    {focusRowId === proxy.id && (
                      <TableRow className="hover:bg-transparent bg-background/20">
                        <TableCell colSpan={5} className="p-0 border-none">
                          <div className="w-full min-h-[calc(100vh-220px)] animate-in slide-in-from-top-4 duration-700">
                            <InlineProxyForm
                              proxy={proxy}
                              onClose={() => setFocusRowId(null)}
                              onSuccess={() => {
                                onRefresh();
                                setFocusRowId(null);
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Fixed Footer Bar with Pagination */}
      <div
        className={cn(
          'h-[64px] shrink-0 bg-card/80 backdrop-blur-md border-t border-border/50 px-8 flex items-center justify-between z-20 transition-all duration-500',
          focusRowId ? 'hidden' : 'opacity-100',
        )}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 transition-all hover:text-emerald-500">
              Active: {proxies.filter((p) => p.status === 'active').length}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 transition-all hover:text-amber-500">
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
          <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.15em]">
            TOTAL NODES: {proxies.length}
          </span>
        </div>
      </div>

      {/* Context Menu Portal */}
      {menuConfig && (
        <Portal>
          <div
            className="fixed inset-0 z-[1000]"
            onClick={() => setMenuConfig(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenuConfig(null);
            }}
          />
          <div
            className="fixed z-[1001] w-56 bg-dialog-background border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ left: menuConfig.x, top: menuConfig.y }}
          >
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  const proxy = proxies.find((p) => p.id === menuConfig.proxyId);
                  if (proxy) setFocusRowId(proxy.id);
                  setMenuConfig(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                {t('proxy.view')}
              </button>
              <button
                onClick={() => {
                  setMenuConfig(null);
                  handleCheckProxy(menuConfig.proxyId);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                {t('proxy.check')}
              </button>
              <div className="h-px bg-border/50 mx-2 my-1" />
              <button
                onClick={() => {
                  const proxy = proxies.find((p) => p.id === menuConfig.proxyId);
                  if (proxy?.status === 'trash') {
                    handleHardDelete(menuConfig.proxyId);
                  } else {
                    handleSoftDelete(menuConfig.proxyId);
                  }
                  setMenuConfig(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {proxies.find((p) => p.id === menuConfig.proxyId)?.status === 'trash'
                  ? t('proxy.deleteForever')
                  : t('proxy.delete')}
              </button>
            </div>
          </div>
        </Portal>
      )}
      {/* Permanent Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('proxy.confirmDeleteTitle')}
        size="sm"
        className="max-w-[400px]"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center pt-4 pb-2 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <div className="space-y-2">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {t('proxy.confirmDeleteDescription')}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 h-11 bg-muted/10 hover:bg-muted/20 text-muted-foreground text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all border border-border/50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmHardDelete}
              className="flex-1 h-11 bg-rose-500 text-white hover:bg-rose-600 border border-rose-500/50 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20"
            >
              {t('proxy.deleteForever')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProxyTable;
