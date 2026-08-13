/**
 * ------------------------------------------------------------------
 * useEmailFilter
 * ------------------------------------------------------------------
 * Hook for managing filter conditions on the email table.
 * Provides CRUD operations for filter rows and a derived count.
 *
 * Main features:
 * - Add / remove / update / clear filter conditions
 * - Auto-generates unique filter IDs
 * - Exposes filterCount for UI badges
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { useState, useCallback, useMemo } from 'react';

// ── Types ──
import { FilterCondition, Operator } from '../../../constants/operators';

// ─── Types ──────────────────────────────────────────────────────────────
interface UseEmailFilterOptions {
  viewId: string | null;
  availableColumns: string[];
}

// ─── Hook ───────────────────────────────────────────────────────────────
export const useEmailFilter = ({}: UseEmailFilterOptions) => {
  // ── State ──
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  // ── Callbacks ──
  const addFilter = useCallback((column: string, operator: Operator, value: string) => {
    setFilters((prev) => [
      ...prev,
      {
        id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        column,
        operator,
        value,
      },
    ]);
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const updateFilter = useCallback(
    (id: string, column: string, operator: Operator, value: string) => {
      setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, column, operator, value } : f)));
    },
    [],
  );

  // ── Derived ──
  const filterCount = useMemo(() => filters.length, [filters]);

  return {
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    updateFilter,
    filterCount,
  };
};

export default useEmailFilter;
