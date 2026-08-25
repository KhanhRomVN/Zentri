/**
 * ------------------------------------------------------------------
 * usePlatforms Hook
 * ------------------------------------------------------------------
 * Fetch danh sách platforms từ DB và expose loading/error state.
 * ------------------------------------------------------------------
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from '../types';
import { fetchPlatforms } from '../services/forgeService';

export const usePlatforms = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPlatforms();
      setPlatforms(data);
    } catch (err) {
      console.error('[usePlatforms] Failed to fetch platforms:', err);
      setError('Không thể tải danh sách nền tảng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { platforms, isLoading, error, refresh };
};