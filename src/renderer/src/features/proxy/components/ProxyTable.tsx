import React, { FC, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnSizingState,
  ColumnOrderState,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { Proxy } from '../types';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../components/ui/Dropdown';
import { cn } from '../../../shared/lib/utils';
import InlineProxyForm from './InlineProxyForm';
import ProxyDetailView from './ProxyDetailView';
import ProxyHistoryView from './ProxyHistoryView';
import { toast } from 'sonner';
import {
  getDerivedStatus,
  getStatusStyle,
  getProtocolColor,
  formatQuota,
  getStatusLabel,
} from '../utils/tableHelpers';
import { PROXY_COLUMNS } from '../constants';

interface ProxyTableProps {
  proxies: Proxy[];
  onEdit: (proxy: Proxy) => void;
  onRefresh: () => void;
  sorting: SortingState;
  onSortingChange: (updater: SortingState | ((old: SortingState) => SortingState)) => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (
    updater: Record<string, boolean> | ((old: Record<string, boolean>) => Record<string, boolean>),
  ) => void;
  columnSizing: ColumnSizingState;
  onColumnSizingChange: (
    updater: ColumnSizingState | ((old: ColumnSizingState) => ColumnSizingState),
  ) => void;
  columnOrder: ColumnOrderState;
  onColumnOrderChange: (
    updater: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState),
  ) => void;
}

interface DraggableHeaderProps {
  header: any;
}

const DraggableHeader: FC<DraggableHeaderProps> = ({ header }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    width: header.getSize(),
    minWidth: header.column.columnDef.minSize,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        'h-10 text-sm font-bold text-text-primary whitespace-nowrap text-left px-4 relative border-r border-border last:border-r-0',
        isDragging && 'z-50',
      )}
    >
      <div className="flex items-center gap-1">
        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
      </div>
      {header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            'absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none',
            header.column.getIsResizing() ? 'bg-primary/60' : 'opacity-0 hover:opacity-100',
            'hover:bg-primary/30 transition-opacity',
          )}
          style={{
            transform: 'translateX(50%)',
            pointerEvents: 'auto',
            zIndex: 10,
          }}
        />
      )}
    </th>
  );
};

const PAGE_SIZE = 15;

const ProxyTable: FC<ProxyTableProps> = ({
  proxies,
  onEdit,
  onRefresh,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  columnSizing,
  onColumnSizingChange,
  columnOrder,
  onColumnOrderChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isHistory, setIsHistory] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

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

  // ─── Build columns for TanStack Table ──────────────────────────────────
  const columns = useMemo<ColumnDef<Proxy>[]>(() => {
    const visibleColumns = PROXY_COLUMNS.filter((c) => columnVisibility[c.id] !== false);

    return visibleColumns.map((col) => {
      const isSTT = col.id === 'stt';
      return {
        id: col.id,
        accessorKey: col.field,
        header: () => <span>{col.label}</span>,
        cell: ({ row, cell }: any) => {
          const proxy = row.original;
          const index = row.index;
          const isFocused = focusRowId === proxy.id;

          if (isSTT) {
            return (
              <span className="font-mono text-xs text-muted-foreground">
                {String((currentPage - 1) * PAGE_SIZE + index + 1).padStart(2, '0')}
              </span>
            );
          }

          // Special rendering for specific columns
          if (col.id === 'host') {
            return (
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
            );
          }

          if (col.id === 'location') {
            return (
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
            );
          }

          if (col.id === 'status') {
            const status = getDerivedStatus(proxy);
            return (
              <div className="flex items-center justify-start w-full">
                <div
                  className={cn(
                    'inline-flex items-center px-4 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm transition-all hover:scale-105',
                    getStatusStyle(status),
                  )}
                >
                  {getStatusLabel(status)}
                </div>
              </div>
            );
          }

          if (col.id === 'quota') {
            return (
              <span className="text-[13px] font-bold font-mono text-muted-foreground/40 whitespace-nowrap">
                {formatQuota(proxy)}
              </span>
            );
          }

          // Default rendering
          const value = proxy[col.field as keyof Proxy];
          return <span>{value ?? '—'}</span>;
        },
        size: col.size || 200,
        minSize: col.minSize || 80,
        enableResizing: !isSTT && col.id !== 'stt',
        enableSorting: !isSTT && col.isSortable !== false,
        enableHiding: !isSTT,
      };
    });
  }, [focusRowId, currentPage, columnVisibility]);

  // ─── Pagination ──────────────────────────────────────────────────────────
  const totalItems = proxies.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  if (currentPage !== validCurrentPage) setCurrentPage(validCurrentPage);

  const paginatedProxies = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    const pageData = proxies.slice(start, start + PAGE_SIZE);
    return pageData.map((p, idx) => ({ ...p, _stt: idx + 1 }));
  }, [proxies, validCurrentPage]);

  // ─── TanStack Table ──────────────────────────────────────────────────────
  const table = useReactTable({
    data: paginatedProxies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: onSortingChange,
    onColumnVisibilityChange: onColumnVisibilityChange,
    onColumnSizingChange: onColumnSizingChange,
    onColumnOrderChange: onColumnOrderChange,
    state: {
      sorting,
      columnVisibility,
      columnSizing,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    getRowId: (row: any) => String(row.id),
  });

  // ─── DnD Handlers ────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (active && over && active.id !== over.id) {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = [...columnOrder];
          newOrder.splice(oldIndex, 1);
          newOrder.splice(newIndex, 0, active.id as string);
          onColumnOrderChange(newOrder);
        }
      }
    },
    [columnOrder, onColumnOrderChange],
  );

  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();
  const isEmpty = proxies.length === 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-card/10">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <table className="border-collapse w-full table-fixed">
                <thead className="sticky top-0 z-20 bg-background/80 backdrop-blur-md transition-all duration-500">
                  {headerGroups.map((headerGroup: any) => (
                    <tr key={headerGroup.id} className="border-b border-border/50">
                      {headerGroup.headers.map((header: any) => {
                        if (header.column.getIsVisible() === false) return null;
                        return <DraggableHeader key={header.id} header={header} />;
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {isEmpty ? (
                    <tr>
                      <td
                        colSpan={table.getAllColumns().filter((c: any) => c.getIsVisible()).length || 1}
                        className="text-center py-16"
                      >
                        <div className="flex flex-col items-center justify-center gap-4">
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
                    rowModel.rows.map((row: any) => {
                      const proxy = row.original;
                      return (
                        <React.Fragment key={row.id}>
                          <Dropdown>
                            <DropdownTrigger asChild>
                              <tr
                                onClick={() => handleRowClick(proxy.id)}
                                className={cn(
                                  'group border-b border-border/10 hover:bg-primary/[0.03] cursor-pointer transition-all duration-300 h-[56px]',
                                  focusRowId === proxy.id &&
                                    'bg-primary/[0.05] border-primary/20 sticky top-[40px] z-20 shadow-xl backdrop-blur-xl',
                                )}
                              >
                                {row.getVisibleCells().map((cell: any) => (
                                  <td
                                    key={cell.id}
                                    className="py-1 text-sm text-foreground/80 truncate px-4"
                                    style={{
                                      width: cell.column.getSize(),
                                      maxWidth: cell.column.getSize(),
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </td>
                                ))}
                              </tr>
                            </DropdownTrigger>
                            <DropdownContent>
                              <DropdownItem
                                onClick={() => {
                                  setFocusRowId(proxy.id);
                                  setIsEditing(false);
                                  setIsHistory(false);
                                }}
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-500/50" />
                                View
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => {
                                  setFocusRowId(proxy.id);
                                  setIsEditing(true);
                                  setIsHistory(false);
                                }}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-primary/50" />
                                Edit
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => {
                                  setFocusRowId(proxy.id);
                                  setIsEditing(false);
                                  setIsHistory(true);
                                }}
                              >
                                <HistoryIcon className="w-3.5 h-3.5 text-amber-500/50" />
                                View History
                              </DropdownItem>
                              <DropdownItem onClick={() => handleCheckProxy(proxy.id)}>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                Check
                              </DropdownItem>
                              <div className="h-px bg-divider my-1" />
                              <DropdownItem
                                className="text-error focus:text-error focus:bg-error/10"
                                onClick={() => {
                                  if (proxy.status === 'trash') handleHardDelete(proxy.id);
                                  else handleSoftDelete(proxy.id);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {proxy.status === 'trash' ? 'Delete Forever' : 'Delete'}
                              </DropdownItem>
                            </DropdownContent>
                          </Dropdown>
                          {focusRowId === proxy.id && (
                            <tr className="hover:bg-transparent bg-background/20">
                              <td
                                colSpan={
                                  table.getAllColumns().filter((c: any) => c.getIsVisible()).length
                                }
                                className="p-0 border-none"
                              >
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
                      );
                    })
                  )}
                  {!isEmpty && rowModel.rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={table.getAllColumns().filter((c: any) => c.getIsVisible()).length}
                        className="text-center py-12 text-muted-foreground/40 text-sm"
                      >
                        No matching proxies found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          </SortableContext>
        </DndContext>
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
            <span className="text-[10px] font-black uppercase text-emerald-500/60">
              Active: {proxies.filter((p) => getDerivedStatus(p) === 'active').length}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
            <span className="text-[10px] font-black uppercase text-amber-500/60">
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
      </div>

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
