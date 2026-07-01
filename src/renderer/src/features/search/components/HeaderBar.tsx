import { FC } from 'react';
import { LayoutDashboard, ChevronRight } from 'lucide-react';
import { SmartView } from '../types/search';
import SearchToolbar from './SearchToolbar';
import { SortingState } from '@tanstack/react-table';

interface HeaderBarProps {
  selectedView: SmartView | null;
  onReset: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filtersCount: number;
  showFilterBar: boolean;
  onToggleFilterBar: () => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  availableColumns: string[];
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
  totalRecords: number;
  onRefresh?: () => void;
}

const HeaderBar: FC<HeaderBarProps> = ({
  selectedView,
  onReset,
  searchQuery,
  onSearchChange,
  filtersCount,
  showFilterBar,
  onToggleFilterBar,
  sorting,
  onSortingChange,
  availableColumns,
  columnVisibility,
  onColumnVisibilityChange,
  totalRecords,
  onRefresh,
}) => {
  return (
    <header className="h-[48px] shrink-0 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-2">
        <button onClick={onReset} className="text-text-primary hover:text-foreground transition-colors">
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <ChevronRight className="w-4 h-4 text-text-primary" />
        <span className="text-text-primary text-sm font-semibold">Search</span>
        {selectedView && (
          <>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
            <span className="text-text-primary text-sm font-semibold">
              {selectedView.name}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <SearchToolbar
          filtersCount={filtersCount}
          showFilterBar={showFilterBar}
          onToggleFilterBar={onToggleFilterBar}
          sorting={sorting}
          onSortingChange={onSortingChange}
          availableColumns={availableColumns}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={onColumnVisibilityChange}
          totalRecords={totalRecords}
          onRefresh={onRefresh}
        />
        <div className="relative w-64 shrink-0">
          <input
            type="text"
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-3 pr-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-text-secondary outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;