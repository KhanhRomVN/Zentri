/**
 * useSearchData Hook
 * Manages data fetching, caching, and state for search views
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchViewData,
  enrichEmailRows,
  fetchAvatar,
  EmailRow,
  ServiceLink,
} from '../services/searchService';
import { SmartView } from '../features/search/types/search';

interface UseSearchDataOptions {
  selectedView: SmartView | null;
  autoLoad?: boolean;
}

interface UseSearchDataReturn {
  data: any[];
  loading: boolean;
  error: Error | null;
  avatars: Record<string, string>;
  refresh: () => Promise<void>;
  loadData: () => Promise<void>;
}

/**
 * Hook for fetching and managing search view data
 */
export const useSearchData = ({
  selectedView,
  autoLoad = true,
}: UseSearchDataOptions): UseSearchDataReturn => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  // ─── Load Data ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedView) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let serviceId: number | undefined;
      if (selectedView.source === 'service' && selectedView.serviceId) {
        serviceId = Number(selectedView.serviceId);
      }

      const { emails, serviceLinks } = await fetchViewData(serviceId);
      const enrichedRows = enrichEmailRows(emails, serviceLinks);
      setData(enrichedRows);
    } catch (err) {
      console.error('[useSearchData] Failed to load data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load data'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedView]);

  // ─── Refresh ────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // ─── Fetch Avatars ─────────────────────────────────────────────────────
  const fetchAvatars = useCallback(async (rows: any[]) => {
    const newAvatars: Record<string, string> = { ...avatars };
    let changed = false;

    for (const row of rows) {
      if (row.email && !newAvatars[row.email]) {
        try {
          const avatarUrl = await fetchAvatar(row.email);
          if (avatarUrl) {
            newAvatars[row.email] = avatarUrl;
            changed = true;
          } else {
            const seed = row.email.split('@')[0];
            newAvatars[row.email] = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            changed = true;
          }
        } catch {
          const seed = row.email.split('@')[0];
          newAvatars[row.email] = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
          changed = true;
        }
      }
    }

    if (changed) {
      setAvatars(newAvatars);
    }
  }, [avatars]);

  // ─── Auto-load on selectedView change ─────────────────────────────────
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  // ─── Fetch avatars when data changes ──────────────────────────────────
  useEffect(() => {
    if (data.length > 0) {
      fetchAvatars(data);
    }
  }, [data, fetchAvatars]);

  return {
    data,
    loading,
    error,
    avatars,
    refresh,
    loadData,
  };
};

export default useSearchData;