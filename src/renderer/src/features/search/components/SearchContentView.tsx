import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Table as TableIcon,
  Mail,
  Users,
  Database,
  Star,
  Heart,
  Zap,
  Shield,
  Globe,
  Key,
  Lock,
  Bell,
  Calendar,
  Clock,
  Tag,
  Award,
  Bookmark,
  Camera,
  Cloud,
  Code,
  Eye,
  Flag,
  Gift,
  Hash,
  Home,
  Image,
  Link,
  Map,
  Moon,
  Music,
  Package,
  Phone,
  Power,
  Settings,
  Sun,
  Target,
  Truck,
  User,
  Video,
  Wifi,
  Wind,
  Layers,
  Command,
  Crown,
  Feather,
  TrendingUp,
  Umbrella,
  GripVertical,
} from 'lucide-react';
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
import { SmartView } from '../types/search';
import { useAccentColors } from '../../../hooks/useAccentColors';
import { FilterCondition } from '../../../constants/operators';
import { cn } from '../../../shared/lib/utils';

// Icon map: name → component
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Mail,
  Users,
  Database,
  Star,
  Heart,
  Zap,
  Shield,
  Globe,
  Key,
  Lock,
  Bell,
  Calendar,
  Clock,
  Tag,
  Award,
  Bookmark,
  Camera,
  Cloud,
  Code,
  Eye,
  Flag,
  Gift,
  Hash,
  Home,
  Image,
  Link,
  Map,
  Moon,
  Music,
  Package,
  Phone,
  Power,
  Settings,
  Sun,
  TableIcon,
  Target,
  Truck,
  User,
  Video,
  Wifi,
  Wind,
  Layers,
  Command,
  Crown,
  Feather,
  TrendingUp,
  Umbrella,
};

interface SearchContentViewProps {
  selectedView: SmartView | null;
  onOpenAddView: () => void;
  searchQuery: string;
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
  filters: FilterCondition[];
  onRefresh?: () => void;
}

let accentColorsCache: string[] = ['rgb(54, 134, 255)'];
let unifiedAccentCache = 'rgb(54, 134, 255)';

const setAccentColorsForSearch = (colors: string[], unified: string) => {
  accentColorsCache = colors.length > 0 ? colors : [unified];
  unifiedAccentCache = unified;
};

const getViewColor = (viewId: string) => {
  let hash = 0;
  for (let i = 0; i < viewId.length; i++) {
    hash = viewId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % accentColorsCache.length;
  const color = accentColorsCache[index] || accentColorsCache[0] || unifiedAccentCache;
  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    const r = rgbMatch[0],
      g = rgbMatch[1],
      b = rgbMatch[2];
    return {
      base: color,
      bg: `rgba(${r}, ${g}, ${b}, 0.08)`,
      border: `rgba(${r}, ${g}, ${b}, 0.2)`,
    };
  }
  return { base: color, bg: 'var(--sidebar-item-hover)', border: 'var(--divider)' };
};

// ─── Helpers to resolve field values from a row ────────────────────────────
const getFieldValue = (row: any, field: string): string => {
  if (!field || field === '_stt') return '';

  // Direct email fields
  const emailFields = [
    'email',
    'password',
    'recoveryEmail',
    'phoneNumber',
    'status',
    'createdAt',
    'lastUsedAt',
    'totpSecretKey',
  ];
  if (emailFields.includes(field)) {
    const val = row[field];
    if (val === null || val === undefined) return '—';
    if (field === 'createdAt' || field === 'lastUsedAt') {
      try {
        return new Date(val).toLocaleDateString();
      } catch {
        return String(val);
      }
    }
    return String(val);
  }

  // Service fields (from linked services)
  if (field.startsWith('services.')) {
    const serviceField = field.replace('services.', '');
    const services = row._services || [];
    if (services.length === 0) return '—';
    const firstService = services[0];
    const val = firstService[serviceField];
    if (val === null || val === undefined) return '—';
    return String(val);
  }

  // Proxy fields
  if (field.startsWith('proxy.')) {
    const proxyField = field.replace('proxy.', '');
    const proxy = row._proxy;
    if (!proxy) return '—';
    const val = proxy[proxyField];
    if (val === null || val === undefined) return '—';
    return String(val);
  }

  return '—';
};

// ─── Draggable Header Component ─────────────────────────────────────────────
interface DraggableHeaderProps {
  header: any;
  viewColor: any;
}

const DraggableHeader: FC<DraggableHeaderProps> = ({ header, viewColor }) => {
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
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-primary/70 transition-colors"
        >
          <GripVertical className="w-3 h-3 text-text-secondary/50" />
        </div>
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

// ─── Main Component ──────────────────────────────────────────────────────────
const SearchContentView: FC<SearchContentViewProps> = ({
  selectedView,
  searchQuery,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  columnSizing,
  onColumnSizingChange,
  columnOrder,
  onColumnOrderChange,
  filters,
  onRefresh,
}) => {
  const { accentColors, UNIFIED_ACCENT } = useAccentColors();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  if (typeof accentColors !== 'undefined' && accentColors.length > 0) {
    setAccentColorsForSearch(accentColors, UNIFIED_ACCENT);
  }

  const viewColor = selectedView ? getViewColor(selectedView.id) : null;

  // ─── Sensors for DnD ──────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // ─── Fetch data when selectedView changes ──────────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedView) return;
    setLoading(true);
    try {
      let emailRows: any[] = [];
      let serviceLinks: any[] = [];

      if (selectedView.source === 'service' && selectedView.serviceId) {
        const [rows, links] = await Promise.all([
          window.electron.ipcRenderer.invoke(
            'sqlite:all',
            `SELECT e.* FROM emails e
             JOIN service_emails se ON se.email_id = e.id
             WHERE se.service_id = ?
             ORDER BY e.created_at DESC`,
            [selectedView.serviceId],
          ),
          window.electron.ipcRenderer.invoke(
            'sqlite:all',
            `SELECT se.*, s.name as serviceName, s.url as serviceUrl
             FROM service_emails se 
             JOIN services s ON se.service_id = s.id
             WHERE se.service_id = ?`,
            [selectedView.serviceId],
          ),
        ]);
        emailRows = rows || [];
        serviceLinks = links || [];
      } else {
        [emailRows, serviceLinks] = await Promise.all([
          window.electron.ipcRenderer.invoke(
            'sqlite:all',
            'SELECT * FROM emails ORDER BY created_at DESC',
          ),
          window.electron.ipcRenderer.invoke(
            'sqlite:all',
            `SELECT se.*, s.name as serviceName, s.url as serviceUrl
             FROM service_emails se 
             JOIN services s ON se.service_id = s.id`,
          ),
        ]);
      }

      const rowsWithServices = (emailRows || []).map((row: any) => {
        const linkedServices = (serviceLinks || [])
          .filter((link: any) => link.email_id === row.id)
          .map((link: any) => ({
            name: link.serviceName,
            url: link.serviceUrl,
            username: link.username,
            password: link.password,
            notes: link.notes,
          }));
        return {
          ...row,
          _services: linkedServices,
          _proxy: row.proxyHost
            ? {
                host: row.proxyHost,
                port: row.proxyPort,
                protocol: row.proxyProtocol,
                country: row.proxyCountry,
                city: row.proxyCity,
              }
            : null,
        };
      });

      setRows(rowsWithServices);
    } catch (err) {
      console.error('Failed to load search data:', err);
      setRows([]);
    }
    setLoading(false);
  }, [selectedView]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch avatars for email rows
  useEffect(() => {
    const fetchAvatars = async () => {
      const newAvatars: Record<string, string> = { ...avatars };
      let changed = false;
      for (const row of rows) {
        if (row.email && !newAvatars[row.email]) {
          try {
            const avatarUrl = await window.electron.ipcRenderer.invoke('email:get-avatar', {
              email: row.email,
            });
            if (avatarUrl) {
              newAvatars[row.email] = avatarUrl;
              changed = true;
            } else {
              const seed = row.email.split('@')[0];
              newAvatars[row.email] = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
              changed = true;
            }
          } catch {
            const seed = row.email.split('@')[0];
            newAvatars[row.email] = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            changed = true;
          }
        }
      }
      if (changed) setAvatars(newAvatars);
    };
    if (rows.length > 0) fetchAvatars();
  }, [rows]);

  // ─── Apply filters ────────────────────────────────────────────────────────
  const applyFilters = useCallback(
    (data: any[]) => {
      if (filters.length === 0) return data;

      return data.filter((row) => {
        return filters.every((filter) => {
          const fieldValue = getFieldValue(row, filter.column);
          if (fieldValue === '—' || fieldValue === null || fieldValue === undefined) {
            return filter.operator === 'not_equal';
          }

          const strValue = String(fieldValue).toLowerCase();
          const searchValue = filter.value.toLowerCase();

          switch (filter.operator) {
            case 'equals':
              return strValue === searchValue;
            case 'not_equal':
              return strValue !== searchValue;
            case 'greater':
              return parseFloat(strValue) > parseFloat(searchValue);
            case 'less':
              return parseFloat(strValue) < parseFloat(searchValue);
            case 'contains':
              return strValue.includes(searchValue);
            case 'starts_with':
              return strValue.startsWith(searchValue);
            case 'ends_with':
              return strValue.endsWith(searchValue);
            default:
              return true;
          }
        });
      });
    },
    [filters],
  );

  // ─── Apply search query ──────────────────────────────────────────────────
  const applySearch = useCallback(
    (data: any[]) => {
      if (!searchQuery) return data;
      const visibleCols = selectedView?.columns.filter((c) => c.isVisible) || [];
      return data.filter((row) => {
        return visibleCols.some((col) => {
          const val = getFieldValue(row, col.field || '');
          return val.toLowerCase().includes(searchQuery.toLowerCase());
        });
      });
    },
    [searchQuery, selectedView],
  );

  // ─── Build columns for TanStack Table ──────────────────────────────────
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!selectedView) return [];

    const viewColumns = selectedView.columns.filter((c) => c.isVisible);

    return viewColumns.map((col) => {
      const isSTT = col.id === 'col_stt';
      const isEmailCol = col.field === 'email' || col.type === 'email';

      return {
        id: col.id,
        accessorKey: col.field || col.id,
        header: () => <span>{col.label}</span>,
        cell: ({ row }: any) => {
          const rowData = row.original;
          if (isSTT) {
            return <span className="font-mono text-xs text-muted-foreground">{row.index + 1}</span>;
          }
          const fieldValue = getFieldValue(rowData, col.field || '');
          if (isEmailCol && rowData.email) {
            return <span className="truncate">{fieldValue}</span>;
          }
          return <span>{fieldValue}</span>;
        },
        size: isSTT ? 50 : 200,
        minSize: isSTT ? 50 : 80,
        enableResizing: !isSTT,
        enableSorting: !isSTT && col.isSortable !== false,
        enableHiding: !isSTT,
      };
    });
  }, [selectedView]);

  // ─── Process data ────────────────────────────────────────────────────────
  const processedData = useMemo(() => {
    let data = rows;
    data = applyFilters(data);
    data = applySearch(data);
    return data;
  }, [rows, applyFilters, applySearch]);

  // ─── TanStack Table ──────────────────────────────────────────────────────
  const table = useReactTable({
    data: processedData,
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
    getRowId: (row: any) => String(row.rowid || row.id),
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

  // ─── Render ──────────────────────────────────────────────────────────────
  if (!selectedView) {
    return (
      <div className="flex-1 flex items-center justify-center opacity-20">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
          Select a view to begin
        </span>
      </div>
    );
  }

  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();

  return (
    <motion.div
      key={selectedView.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full opacity-30">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
              Loading...
            </span>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
              <table className="border-collapse w-full table-fixed">
                <thead className="sticky top-0 z-20">
                  {headerGroups.map((headerGroup: any) => (
                    <tr
                      key={headerGroup.id}
                      className="bg-table-header-background border-b border-border/50"
                    >
                      {headerGroup.headers.map((header: any) => {
                        if (header.column.getIsVisible() === false) return null;
                        return (
                          <DraggableHeader key={header.id} header={header} viewColor={viewColor} />
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {rowModel.rows.map((row: any) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/20 h-[40px] hover:bg-table-row-hover transition-colors"
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
                  ))}
                  {rowModel.rows.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={table.getAllColumns().filter((c: any) => c.getIsVisible()).length}
                        className="text-center py-12 text-muted-foreground/40 text-sm"
                      >
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        )}

        {table.getAllColumns().filter((c: any) => c.getIsVisible()).length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <TableIcon className="w-12 h-12 mb-4" />
            <span className="text-[10px] font-black uppercase">No columns defined</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchContentView;
