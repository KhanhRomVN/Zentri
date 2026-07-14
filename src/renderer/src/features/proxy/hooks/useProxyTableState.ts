/**
 * Proxy table state management hook
 */

import { useState, useEffect, useMemo } from 'react';
import { SortingState } from '@tanstack/react-table';

interface UseProxyTableStateOptions {
  viewId: string | null;
  defaultColumns: string[];
}

export const useProxyTableState = ({ viewId, defaultColumns }: UseProxyTableStateOptions) => {
  const storageKey = `proxy_table_state_${viewId || 'default'}`;

  const [sorting, setSorting] = useState<SortingState>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.sorting || [];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.columnVisibility || {};
      }
    } catch {
      // ignore
    }
    const defaultVisibility: Record<string, boolean> = {};
    defaultColumns.forEach((col) => {
      defaultVisibility[col] = true;
    });
    return defaultVisibility;
  });

  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.columnSizing || {};
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.columnOrder || defaultColumns;
      }
    } catch {
      // ignore
    }
    return defaultColumns;
  });

  // Ensure all default columns are present in visibility
  useEffect(() => {
    const updated: Record<string, boolean> = { ...columnVisibility };
    let changed = false;
    defaultColumns.forEach((col) => {
      if (!(col in updated)) {
        updated[col] = true;
        changed = true;
      }
    });
    if (changed) {
      setColumnVisibility(updated);
    }
  }, [defaultColumns]);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ sorting, columnVisibility, columnSizing, columnOrder }),
      );
    } catch {
      // ignore
    }
  }, [sorting, columnVisibility, columnSizing, columnOrder, storageKey]);

  // Reset state when view changes
  useEffect(() => {
    if (viewId) {
      // We could reset or keep state per view
      // For now, keep the state
    }
  }, [viewId]);

  const resetState = () => {
    setSorting([]);
    const defaultVisibility: Record<string, boolean> = {};
    defaultColumns.forEach((col) => {
      defaultVisibility[col] = true;
    });
    setColumnVisibility(defaultVisibility);
    setColumnSizing({});
    setColumnOrder(defaultColumns);
  };

  return {
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
    resetState,
  };
};

export default useProxyTableState;