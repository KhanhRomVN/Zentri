import { FC, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Table as TableIcon, GripVertical } from 'lucide-react';
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
import { SmartView } from '../../types/search';
import { useAccentColors } from '@renderer/hooks/useAccentColors';
import { getFieldValue, getViewColor, setAccentColorsCache } from '@renderer/utils/searchHelpers';
import { cn } from '@renderer/shared/lib/utils';
import { FilterCondition } from '@renderer/constants';

interface DataTableProps {
  selectedView: SmartView | null;
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
  data: any[];
  loading: boolean;
  onOpenAddView: () => void;
}

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

const DataTable: FC<DataTableProps> = ({
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
  data,
  loading,
  onOpenAddView,
}) => {
  const { accentColors, UNIFIED_ACCENT } = useAccentColors();

  if (typeof accentColors !== 'undefined' && accentColors.length > 0) {
    setAccentColorsCache(accentColors, UNIFIED_ACCENT);
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

  // ─── Apply filters ────────────────────────────────────────────────────────
  const applyFilters = useCallback(
    (rows: any[]) => {
      if (filters.length === 0) return rows;

      return rows.filter((row) => {
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
    (rows: any[]) => {
      if (!searchQuery) return rows;
      const visibleCols = selectedView?.columns.filter((c) => c.isVisible) || [];
      return rows.filter((row) => {
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
    let rows = data;
    rows = applyFilters(rows);
    rows = applySearch(rows);
    return rows;
  }, [data, applyFilters, applySearch]);

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

export default DataTable;
