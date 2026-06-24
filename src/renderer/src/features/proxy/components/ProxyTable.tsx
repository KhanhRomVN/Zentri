import React, { FC, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Proxy } from '../types';
import {
  Info,
  Network,
  Trash2,
  Check,
  Eye,
  AlertCircle,
  Edit3,
  History as HistoryIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import InlineProxyForm from './InlineProxyForm';
import { toast } from 'sonner';
import { cn } from '../../../shared/lib/utils';
import ProxyDetailView from './ProxyDetailView';
import ProxyHistoryView from './ProxyHistoryView';

interface ProxyTableProps {
  proxies: Proxy[];
  onEdit: (proxy: Proxy) => void;
  onRefresh: () => void;
}

const PAGE_SIZE = 15;

const ProxyTable: FC<ProxyTableProps> = ({ proxies, onRefresh }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const [menuConfig, setMenuConfig] = useState<{ x: number; y: number; proxyId: string } | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isHistory, setIsHistory] = useState(false);

  const handleRowClick = (id: string) => {
    if (focusRowId === id) {
      setFocusRowId(null);
      setIsEditing(false);
      setIsHistory(false);
    } else {
      setFocusRowId(id);
      setIsEditing(false);
      setIsHistory(false);
    }
  };

  const getDerivedStatus = (proxy: Proxy) => {
    if (proxy.status === 'trash' || proxy.status === 'disabled') return proxy.status;
    if (proxy.expiredAt) {
      const expiry = new Date(proxy.expiredAt).getTime();
      if (expiry <= Date.now()) return 'expired';
    }
    return proxy.status;
  };

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
  const totalItems = proxies.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  if (currentPage !== validCurrentPage) setCurrentPage(validCurrentPage);

  const paginatedProxies = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return proxies.slice(start, start + PAGE_SIZE);
  }, [proxies, validCurrentPage]);

  const handleSoftDelete = async (id: string) => {
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('proxy:update', { id, data: { status: 'trash' } });
      toast.success('Moved to trash');
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
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="border-collapse min-w-full table-fixed">
          <thead className="sticky top-0 bg-background/80 backdrop-blur-md z-10 transition-all duration-500">
            <tr className="hover:bg-transparent border-b border-border/50">
              <th className="text-[11px] font-black uppercase tracking-widest h-[57px] px-3 text-muted-foreground/50 w-[80px] text-left">
                #
              </th>
              <th className="text-[11px] font-black uppercase tracking-widest h-[57px] px-3 text-muted-foreground/50 w-[280px] text-left">
                Host / IP
              </th>
              <th className="text-[11px] font-black uppercase tracking-widest h-[57px] px-3 text-muted-foreground/50 text-left">
                Location
              </th>
              <th className="text-[11px] font-black uppercase tracking-widest h-[57px] px-3 text-muted-foreground/50 text-center w-[160px] whitespace-nowrap">
                Status
              </th>
              <th className="text-[11px] font-black uppercase tracking-widest h-[57px] px-3 text-muted-foreground/50 text-center w-[280px] whitespace-nowrap">
                Quota
              </th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr className="hover:bg-transparent">
                <td colSpan={5} className="h-[400px] text-center border-none">
                  <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
                      <div className="relative w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center text-muted-foreground/20 border border-border/50">
                        <Network className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[13px] font-bold text-muted-foreground">No Data</p>
                      <p className="text-[11px] text-muted-foreground/40 max-w-[200px] mx-auto leading-relaxed">
                        The infrastructure registry is currently empty.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProxies
                .filter((p) => (focusRowId ? p.id === focusRowId : true))
                .map((proxy, index) => (
                  <React.Fragment key={proxy.id}>
                    <tr
                      onClick={() => handleRowClick(proxy.id)}
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
                      <td className="py-4 px-3 text-[14px] font-black text-muted-foreground/40 font-mono text-left">
                        {String((validCurrentPage - 1) * PAGE_SIZE + index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-4 px-3 overflow-hidden text-left">
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
                      </td>
                      <td className="py-4 px-3 text-left">
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
                      </td>
                      <td className="py-4 px-3 w-[160px]">
                        <div className="flex items-center justify-center w-full">
                          {(() => {
                            const derivedStatus = getDerivedStatus(proxy);
                            const statusLabels: Record<string, string> = {
                              active: 'Active',
                              expired: 'Expired',
                              disabled: 'Disabled',
                              trash: 'Trash',
                            };
                            return (
                              <div
                                className={cn(
                                  'inline-flex items-center px-4 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm transition-all hover:scale-105',
                                  getStatusStyle(derivedStatus),
                                )}
                              >
                                {statusLabels[derivedStatus] || derivedStatus}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="text-[13px] font-bold font-mono text-muted-foreground/40 whitespace-nowrap">
                          {proxy.pricingType === 'time'
                            ? (() => {
                                if (!proxy.expiredAt) return `${proxy.durationDays || 0} days`;
                                const expiry = new Date(proxy.expiredAt).getTime();
                                const diff = expiry - Date.now();
                                if (diff <= 0) return 'Expired';
                                const days = Math.floor(diff / (24 * 60 * 60 * 1000));
                                const hours = Math.floor(
                                  (diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000),
                                );
                                const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
                                if (days > 0) return `${days} ngày ${hours} giờ`;
                                if (hours > 0) return `${hours} giờ ${minutes} phút`;
                                return `${minutes} phút`;
                              })()
                            : `${proxy.bandwidthGb || 0} GB`}
                        </span>
                      </td>
                    </tr>
                    {focusRowId === proxy.id && (
                      <tr className="hover:bg-transparent bg-background/20">
                        <td colSpan={5} className="p-0 border-none">
                          <div className="w-full min-h-[calc(100vh-220px)] animate-in slide-in-from-top-4 duration-700">
                            {isEditing ? (
                              <InlineProxyForm
                                proxy={proxy}
                                onClose={() => setIsEditing(false)}
                                onSuccess={() => {
                                  onRefresh();
                                  setFocusRowId(null);
                                  setIsEditing(false);
                                  setIsHistory(false);
                                }}
                              />
                            ) : isHistory ? (
                              <ProxyHistoryView
                                proxyId={proxy.id}
                                onBack={() => setIsHistory(false)}
                                onClose={() => setFocusRowId(null)}
                              />
                            ) : (
                              <ProxyDetailView
                                proxy={proxy}
                                onEdit={() => setIsEditing(true)}
                                onShowHistory={() => setIsHistory(true)}
                                onClose={() => setFocusRowId(null)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with Pagination */}
      <div
        className={cn(
          'h-[64px] shrink-0 bg-card/80 backdrop-blur-md border-t border-border/50 px-8 flex items-center justify-between z-20 transition-all duration-500',
          focusRowId ? 'hidden' : 'opacity-100',
        )}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60">
              Active: {proxies.filter((p) => getDerivedStatus(p) === 'active').length}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60">
              Expired: {proxies.filter((p) => getDerivedStatus(p) === 'expired').length}
            </span>
          </div>
        </div>
        {!isEmpty && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, validCurrentPage - 1))}
              disabled={validCurrentPage <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-md text-[10px] font-bold transition-colors',
                  page === validCurrentPage
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, validCurrentPage + 1))}
              disabled={validCurrentPage >= totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
          <Info className="w-3 h-3 text-primary/40" />
          <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.15em]">
            TOTAL NODES: {proxies.length}
          </span>
        </div>
      </div>

      {/* Context Menu */}
      {menuConfig &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[1000]"
              onClick={() => setMenuConfig(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenuConfig(null);
              }}
            />
            <div
              className="fixed z-[1001] w-56 bg-modal-background border border-border rounded-lg shadow-xl overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-200 hover:border-primary transition-colors"
              style={{ left: menuConfig.x, top: menuConfig.y }}
            >
              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    const p = proxies.find((x) => x.id === menuConfig.proxyId);
                    if (p) {
                      setFocusRowId(p.id);
                      setIsEditing(false);
                      setIsHistory(false);
                    }
                    setMenuConfig(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-500/50" />
                  View
                </button>
                <button
                  onClick={() => {
                    const p = proxies.find((x) => x.id === menuConfig.proxyId);
                    if (p) {
                      setFocusRowId(p.id);
                      setIsEditing(true);
                      setIsHistory(false);
                    }
                    setMenuConfig(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-primary/50" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    const p = proxies.find((x) => x.id === menuConfig.proxyId);
                    if (p) {
                      setFocusRowId(p.id);
                      setIsEditing(false);
                      setIsHistory(true);
                    }
                    setMenuConfig(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all"
                >
                  <HistoryIcon className="w-3.5 h-3.5 text-amber-500/50" />
                  View History
                </button>
                <button
                  onClick={() => {
                    setMenuConfig(null);
                    handleCheckProxy(menuConfig.proxyId);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Check
                </button>
                <div className="h-px bg-border/50 mx-2 my-1" />
                <button
                  onClick={() => {
                    const p = proxies.find((x) => x.id === menuConfig.proxyId);
                    if (p?.status === 'trash') handleHardDelete(menuConfig.proxyId);
                    else handleSoftDelete(menuConfig.proxyId);
                    setMenuConfig(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500/60" />
                  {proxies.find((p) => p.id === menuConfig.proxyId)?.status === 'trash'
                    ? 'Delete Forever'
                    : 'Delete'}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-[400px] w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h3 className="text-sm font-bold text-foreground">Confirm Delete</h3>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-6">
                <div className="flex flex-col items-center justify-center pt-4 pb-2 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      This action cannot be undone. The proxy node will be permanently removed from
                      the registry.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 h-11 bg-muted/10 hover:bg-muted/20 text-muted-foreground text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all border border-border/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmHardDelete}
                    className="flex-1 h-11 bg-rose-500 text-white hover:bg-rose-600 border border-rose-500/50 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ProxyTable;
