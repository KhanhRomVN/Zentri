import { useState, useEffect, useCallback } from 'react';
import { SortingState, ColumnSizingState, ColumnOrderState } from '@tanstack/react-table';

const STORAGE_KEY_PREFIX = 'search_table_state_';

interface SearchTableState {
  sorting: SortingState;
  columnVisibility: Record<string, boolean>;
  columnSizing: ColumnSizingState;
  columnOrder: ColumnOrderState;
}

interface UseSearchTableStateProps {
  viewId: string | null;
  defaultColumns: string[];
}

export const useSearchTableState = ({ viewId, defaultColumns }: UseSearchTableStateProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(defaultColumns);

  // Load state from localStorage when view changes
  useEffect(() => {
    if (!viewId) {
      setSorting([]);
      setColumnVisibility({});
      setColumnSizing({});
      setColumnOrder(defaultColumns);
      return;
    }

    try {
      const key = `${STORAGE_KEY_PREFIX}${viewId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SearchTableState>;
        if (parsed.sorting) setSorting(parsed.sorting);
        if (parsed.columnVisibility) setColumnVisibility(parsed.columnVisibility);
        if (parsed.columnSizing) setColumnSizing(parsed.columnSizing);
        if (parsed.columnOrder && parsed.columnOrder.length > 0) {
          setColumnOrder(parsed.columnOrder);
        } else {
          setColumnOrder(defaultColumns);
        }
      } else {
        // Initialize all columns as visible
        const initialVisibility: Record<string, boolean> = {};
        defaultColumns.forEach(col => {
          initialVisibility[col] = true;
        });
        setColumnVisibility(initialVisibility);
        setColumnOrder(defaultColumns);
      }
    } catch (err) {
      console.error('Failed to load table state:', err);
      const initialVisibility: Record<string, boolean> = {};
      defaultColumns.forEach(col => {
        initialVisibility[col] = true;
      });
      setColumnVisibility(initialVisibility);
      setColumnOrder(defaultColumns);
    }
  }, [viewId, defaultColumns]);

  // Save state to localStorage
  useEffect(() => {
    if (!viewId) return;

    try {
      const key = `${STORAGE_KEY_PREFIX}${viewId}`;
      const state: SearchTableState = {
        sorting,
        columnVisibility,
        columnSizing,
        columnOrder,
      };
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save table state:', err);
    }
  }, [viewId, sorting, columnVisibility, columnSizing, columnOrder]);

  const resetColumnVisibility = useCallback(() => {
    const initialVisibility: Record<string, boolean> = {};
    defaultColumns.forEach(col => {
      initialVisibility[col] = true;
    });
    setColumnVisibility(initialVisibility);
  }, [defaultColumns]);

  const resetColumnOrder = useCallback(() => {
    setColumnOrder(defaultColumns);
  }, [defaultColumns]);

  const resetAll = useCallback(() => {
    setSorting([]);
    resetColumnVisibility();
    setColumnSizing({});
    resetColumnOrder();
  }, [resetColumnVisibility, resetColumnOrder]);

  return {
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
    resetColumnVisibility,
    resetColumnOrder,
    resetAll,
  };
};