import React, { useState } from 'react';
import {
  ListFilter,
  ArrowUpDown,
  SlidersHorizontal,
  Eye,
  EyeOff,
  GripVertical,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Search,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '../../../components/ui/Dropdown';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Button } from '../../../components/ui/Button';
import { SortingState } from '@tanstack/react-table';

interface SearchToolbarProps {
  filtersCount: number;
  showFilterBar: boolean;
  onToggleFilterBar: () => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  availableColumns: string[];
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
  onRefresh?: () => void;
  totalRecords: number;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  filtersCount,
  showFilterBar,
  onToggleFilterBar,
  sorting,
  onSortingChange,
  availableColumns,
  columnVisibility,
  onColumnVisibilityChange,
  onRefresh,
  totalRecords,
}) => {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [sortSearchTerm, setSortSearchTerm] = useState('');
  const [isAscending, setIsAscending] = useState(true);

  const filteredColumns = availableColumns.filter((col) =>
    col.toLowerCase().includes(sortSearchTerm.toLowerCase()),
  );

  return (
    <div className="flex items-center gap-1">
      {/* Filter Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleFilterBar}
        className={cn(
          'gap-1 px-3 text-sm h-9',
          showFilterBar && 'bg-primary/20 text-primary border-primary/50',
        )}
      >
        <ListFilter className="w-3.5 h-3.5" />
        <span>Filter</span>
        {filtersCount > 0 && (
          <span className="ml-0.5 text-[10px] bg-primary/30 text-primary px-1 rounded">
            {filtersCount}
          </span>
        )}
      </Button>

      {/* Sort Dropdown */}
      <div className="relative">
        <Dropdown open={showSortDropdown} onOpenChange={setShowSortDropdown} align="start">
          <DropdownTrigger asChild>
<Button variant="outline" size="sm" className="gap-1 px-3 text-sm h-9">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort</span>
              {sorting.length > 0 && (
                <span className="ml-0.5 text-[10px] bg-primary/30 text-primary px-1 rounded">
                  {sorting.length}
                </span>
              )}
            </Button>
          </DropdownTrigger>
          <DropdownContent className="right-0 left-auto min-w-[240px] max-h-[300px] overflow-y-auto">
            {/* Ascending Toggle */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-medium text-text-primary">Sort by</span>
              <button
                onClick={() => {
                  const newIsAscending = !isAscending;
                  setIsAscending(newIsAscending);
                  if (sorting.length > 0) {
                    const updatedSorting = sorting.map((s) => ({
                      ...s,
                      desc: !newIsAscending,
                    }));
                    onSortingChange(updatedSorting);
                  }
                }}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors',
                  isAscending
                    ? 'bg-primary/20 text-primary'
                    : 'bg-card-background text-text-secondary border border-border',
                )}
              >
                {isAscending ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Ascending
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Descending
                  </>
                )}
              </button>
            </div>

            {/* Searchbar */}
            <div className="px-2 py-1 border-b border-border">
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={sortSearchTerm}
                  onChange={(e) => setSortSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs text-text-primary placeholder:text-text-secondary bg-transparent border-0 outline-none"
                />
              </div>
            </div>

            {/* Sort Items */}
            {filteredColumns.map((col) => {
              const isActive = sorting.some((s) => s.id === col);
              return (
                <DropdownItem
                  key={col}
                  className="grid grid-cols-[24px_1fr_24px] items-center gap-1 w-full"
                  closeOnSelect={false}
                >
                  <div className="flex items-center justify-center w-4 h-4 justify-self-center">
                    <Checkbox
                      checked={isActive}
                      onChange={() => {
                        const existing = sorting.find((s) => s.id === col);
                        if (existing) {
                          const newSorting = sorting.filter((s) => s.id !== col);
                          onSortingChange(newSorting);
                        } else {
                          onSortingChange([...sorting, { id: col, desc: !isAscending }]);
                        }
                      }}
                      size="sm"
                      inputClassName="w-3.5 h-3.5"
                    />
                  </div>
                  <span className="text-sm text-left">{col}</span>
                </DropdownItem>
              );
            })}
            {sorting.length > 0 && (
              <>
                <DropdownSeparator />
                <DropdownItem
                  onClick={() => {
                    onSortingChange([]);
                  }}
                >
                  <span className="text-text-secondary text-xs">Clear sort</span>
                </DropdownItem>
              </>
            )}
          </DropdownContent>
        </Dropdown>
      </div>

      {/* Column Dropdown */}
      <div className="relative">
        <Dropdown open={showColumnDropdown} onOpenChange={setShowColumnDropdown} align="start">
          <DropdownTrigger asChild>
            <Button variant="outline" className="gap-1 px-3 text-xs h-9">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Column</span>
            </Button>
          </DropdownTrigger>
          <DropdownContent className="right-0 left-auto min-w-[240px] max-h-[300px] overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-medium text-text-primary">Manage columns</span>
              <button
                onClick={() => {
                  const allVisible = availableColumns.every(
                    (col) => columnVisibility[col] !== false,
                  );
                  const newVisibility: Record<string, boolean> = {};
                  availableColumns.forEach((col) => {
                    newVisibility[col] = !allVisible;
                  });
                  onColumnVisibilityChange(newVisibility);
                }}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors',
                  availableColumns.every((col) => columnVisibility[col] !== false)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-card-background text-text-secondary border border-border',
                )}
              >
                {availableColumns.every((col) => columnVisibility[col] !== false)
                  ? 'Hide all'
                  : 'Show all'}
              </button>
            </div>
            <div className="px-2 py-1 border-b border-border">
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search columns..."
                  value={sortSearchTerm}
                  onChange={(e) => setSortSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs text-text-primary placeholder:text-text-secondary bg-transparent border-0 outline-none"
                />
              </div>
            </div>
            {availableColumns
              .filter((col) => col.toLowerCase().includes(sortSearchTerm.toLowerCase()))
              .map((col) => {
                const isVisible = columnVisibility[col] !== false;
                return (
                  <DropdownItem
                    key={col}
                    onClick={() => {
                      onColumnVisibilityChange({
                        ...columnVisibility,
                        [col]: !isVisible,
                      });
                    }}
                    className="grid grid-cols-[24px_1fr_24px] items-center gap-1 w-full"
                    closeOnSelect={false}
                  >
                    <div className="flex items-center justify-center w-4 h-4 justify-self-center">
                      {isVisible ? (
                        <Eye className="w-3.5 h-3.5 text-text-secondary" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-text-secondary" />
                      )}
                    </div>
                    <span className="text-sm text-left">{col}</span>
                    <div className="flex items-center justify-center w-4 h-4 justify-self-center">
                      <GripVertical className="w-3.5 h-3.5 text-text-secondary opacity-40 cursor-grab" />
                    </div>
                  </DropdownItem>
                );
              })}
          </DropdownContent>
        </Dropdown>
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center justify-center size-9 rounded-md border border-border bg-button-outline text-button-outline-text hover:text-button-outline-hover-text hover:border-button-outline-hover-border hover:bg-button-outline-hover transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchToolbar;
