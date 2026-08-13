import { useState, useCallback, useEffect } from 'react';
import { FilterCondition, Operator } from '../../../constants/operators';

const STORAGE_KEY_PREFIX = 'search_filters_';

interface UseSearchFilterProps {
  viewId: string | null;
  availableColumns: string[];
}

export const useSearchFilter = ({ viewId, availableColumns }: UseSearchFilterProps) => {
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  // Load filters from localStorage when view changes
  useEffect(() => {
    if (!viewId) {
      setFilters([]);
      return;
    }

    try {
      const key = `${STORAGE_KEY_PREFIX}${viewId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFilters(parsed);
          return;
        }
      }
      setFilters([]);
    } catch (err) {
      console.error('Failed to load filters:', err);
      setFilters([]);
    }
  }, [viewId]);

  // Save filters to localStorage
  useEffect(() => {
    if (!viewId) return;

    try {
      const key = `${STORAGE_KEY_PREFIX}${viewId}`;
      if (filters.length > 0) {
        localStorage.setItem(key, JSON.stringify(filters));
      } else {
        localStorage.removeItem(key);
      }
    } catch (err) {
      console.error('Failed to save filters:', err);
    }
  }, [viewId, filters]);

  const addFilter = useCallback((column: string, operator: Operator, value: string) => {
    const newFilter: FilterCondition = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      column,
      operator,
      value,
    };
    setFilters((prev) => [...prev, newFilter]);
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const updateFilter = useCallback((id: string, column: string, operator: Operator, value: string) => {
    setFilters((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, column, operator, value } : f,
      ),
    );
  }, []);

  const applyFilters = useCallback((rows: any[]) => {
    if (filters.length === 0) return rows;

    return rows.filter((row) => {
      return filters.every((filter) => {
        const fieldValue = getFieldValue(row, filter.column);
        if (fieldValue === '—' || fieldValue === null || fieldValue === undefined) {
          return filter.operator === 'not_equal';
        }

        const strValue = String(fieldValue).toLowerCase();
        const searchValue = filter.value.toLowerCase();

        switch (filter.operator) {
          case 'equals':
            return strValue === searchValue;
          case 'not_equal':
            return strValue !== searchValue;
          case 'greater':
            return parseFloat(strValue) > parseFloat(searchValue);
          case 'less':
            return parseFloat(strValue) < parseFloat(searchValue);
          case 'contains':
            return strValue.includes(searchValue);
          case 'starts_with':
            return strValue.startsWith(searchValue);
          case 'ends_with':
            return strValue.endsWith(searchValue);
          default:
            return true;
        }
      });
    });
  }, [filters]);

  // Helper function to get field value from row (copied from SearchContentView)
  const getFieldValue = (row: any, field: string): string => {
    if (!field || field === '_stt') return '';

    const emailFields = [
      'email',
      'password',
      'recoveryEmail',
      'phoneNumber',
      'status',
      'createdAt',
      'lastUsedAt',
      'totpSecretKey',
    ];
    if (emailFields.includes(field)) {
      const val = row[field];
      if (val === null || val === undefined) return '—';
      if (field === 'createdAt' || field === 'lastUsedAt') {
        try {
          return new Date(val).toLocaleDateString();
        } catch {
          return String(val);
        }
      }
      return String(val);
    }

    if (field.startsWith('services.')) {
      const serviceField = field.replace('services.', '');
      const services = row._services || [];
      if (services.length === 0) return '—';
      const firstService = services[0];
      const val = firstService[serviceField];
      if (val === null || val === undefined) return '—';
      return String(val);
    }

    if (field.startsWith('proxy.')) {
      const proxyField = field.replace('proxy.', '');
      const proxy = row._proxy;
      if (!proxy) return '—';
      const val = proxy[proxyField];
      if (val === null || val === undefined) return '—';
      return String(val);
    }

    return '—';
  };

  return {
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    updateFilter,
    applyFilters,
    filterCount: filters.length,
  };
};