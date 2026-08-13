import { FC } from 'react';
import { LayoutDashboard, ChevronRight } from 'lucide-react';
import { SmartView } from '../types/search';
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
  currentPage: number;
  totalPages: number;
  startRecord: number;
  endRecord: number;
  onPageChange: (page: number) => void;
}

const HeaderBar: FC<HeaderBarProps> = ({ selectedView, onReset }) => {
  return (
    <header className="h-[40px] shrink-0 border-b border-t border-r border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="text-text-primary hover:text-foreground transition-colors"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <ChevronRight className="w-4 h-4 text-text-primary" />
        <span className="text-text-primary text-sm font-semibold">Search</span>
        {selectedView && (
          <>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
            <span className="text-text-primary text-sm font-semibold">{selectedView.name}</span>
          </>
        )}
      </div>
    </header>
  );
};

export default HeaderBar;
