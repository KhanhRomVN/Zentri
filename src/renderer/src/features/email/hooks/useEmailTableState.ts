/**
 * ------------------------------------------------------------------
 * useEmailTableState
 * ------------------------------------------------------------------
 * Hook for managing TanStack Table state: sorting, column visibility,
 * column sizing, and column order. Initializes defaults from the
 * provided column list.
 *
 * Main features:
 * - Sorting state with updater callback
 * - Column visibility toggle with batch init
 * - Column sizing with updater callback
 * - Column order with updater callback
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { useState, useCallback, useEffect } from 'react';

// ── Types ──
import { SortingState, ColumnSizingState, ColumnOrderState } from '@tanstack/react-table';

// ─── Types ──────────────────────────────────────────────────────────────
interface UseEmailTableStateOptions {
  viewId: string | null;
  defaultColumns: string[];
}

// ─── Hook ───────────────────────────────────────────────────────────────
export const useEmailTableState = ({ viewId, defaultColumns }: UseEmailTableStateOptions) => {
  // ── State ──
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

  // ── Effects ──
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

  // ── Callbacks ──
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