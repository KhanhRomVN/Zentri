import { useState, useCallback, useEffect } from 'react';
import { SortingState, ColumnSizingState, ColumnOrderState } from '@tanstack/react-table';

interface UseEmailTableStateOptions {
  viewId: string | null;
  defaultColumns: string[];
}

export const useEmailTableState = ({ viewId, defaultColumns }: UseEmailTableStateOptions) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

  // Initialize column visibility and order when defaultColumns change
  useEffect(() => {
    if (defaultColumns.length > 0) {
      const visibility: Record<string, boolean> = {};
      defaultColumns.forEach((col) => {
        visibility[col] = true;
      });
      setColumnVisibility(visibility);
      setColumnOrder(defaultColumns);
    }
  }, [defaultColumns]);

  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      setSorting(updater);
    },
    [],
  );

  const handleColumnVisibilityChange = useCallback(
    (
      updater:
        | Record<string, boolean>
        | ((old: Record<string, boolean>) => Record<string, boolean>),
    ) => {
      setColumnVisibility(updater);
    },
    [],
  );

  const handleColumnSizingChange = useCallback(
    (updater: ColumnSizingState | ((old: ColumnSizingState) => ColumnSizingState)) => {
      setColumnSizing(updater);
    },
    [],
  );

  const handleColumnOrderChange = useCallback(
    (updater: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)) => {
      setColumnOrder(updater);
    },
    [],
  );

  return {
    sorting,
    setSorting: handleSortingChange,
    columnVisibility,
    setColumnVisibility: handleColumnVisibilityChange,
    columnSizing,
    setColumnSizing: handleColumnSizingChange,
    columnOrder,
    setColumnOrder: handleColumnOrderChange,
  };
};

export default useEmailTableState;