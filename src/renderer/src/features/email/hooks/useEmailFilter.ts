import { useState, useCallback, useMemo } from 'react';
import { FilterCondition, Operator } from '../../../constants/operators';

interface UseEmailFilterOptions {
  viewId: string | null;
  availableColumns: string[];
}

export const useEmailFilter = ({}: UseEmailFilterOptions) => {
  const [filters, setFilters] = useState<FilterCondition[]>([]);

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
