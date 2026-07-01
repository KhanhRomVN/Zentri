import { FC } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SmartView } from '../../types/search';
import { SortingState, ColumnSizingState, ColumnOrderState } from '@tanstack/react-table';
import FilterBar from './FilterBar';
import DataTable from './DataTable';
import { FilterCondition, Operator } from '@renderer/constants';

interface RightPanelProps {
  selectedView: SmartView | null;
  searchQuery: string;
  filters: FilterCondition[];
  filterCount: number;
  showFilterBar: boolean;
  onToggleFilterBar: () => void;
  onAddFilter: (column: string, operator: Operator, value: string) => void;
  onRemoveFilter: (id: string) => void;
  onClearFilters: () => void;
  onUpdateFilter: (id: string, column: string, operator: Operator, value: string) => void;
  sorting: SortingState;
  onSortingChange: (updater: SortingState | ((old: SortingState) => SortingState)) => void;
  availableColumns: string[];
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
  data: any[];
  loading: boolean;
  onRefresh?: () => void;
  onOpenAddView: () => void;
}

const RightPanel: FC<RightPanelProps> = ({
  selectedView,
  searchQuery,
  filters,
  filterCount,
  showFilterBar,
  onToggleFilterBar,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  onUpdateFilter,
  sorting,
  onSortingChange,
  availableColumns,
  columnVisibility,
  onColumnVisibilityChange,
  columnSizing,
  onColumnSizingChange,
  columnOrder,
  onColumnOrderChange,
  data,
  loading,
  onRefresh,
  onOpenAddView,
}) => {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-card/5 backdrop-blur-sm relative z-10 transition-all duration-500">
      {showFilterBar && (
        <FilterBar
          filters={filters}
          availableColumns={availableColumns}
          onAddFilter={onAddFilter}
          onRemoveFilter={onRemoveFilter}
          onClearFilters={onClearFilters}
          onUpdateFilter={onUpdateFilter}
        />
      )}

      <main className="flex-1 overflow-hidden relative text-foreground flex flex-col">
        <AnimatePresence mode="wait">
          <DataTable
            key={selectedView?.id || 'empty'}
            selectedView={selectedView}
            searchQuery={searchQuery}
            sorting={sorting}
            onSortingChange={onSortingChange}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={onColumnVisibilityChange}
            columnSizing={columnSizing}
            onColumnSizingChange={onColumnSizingChange}
            columnOrder={columnOrder}
            onColumnOrderChange={onColumnOrderChange}
            filters={filters}
            data={data}
            loading={loading}
            onOpenAddView={onOpenAddView}
          />
        </AnimatePresence>
      </main>
    </div>
  );
};

export default RightPanel;
