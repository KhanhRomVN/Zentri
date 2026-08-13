/**
 * ------------------------------------------------------------------
 * useHealthCheck
 * ------------------------------------------------------------------
 * Hook for managing the health check modal flow before launching
 * a browser session. Provides state and callbacks to open/close
 * the health check dialog with launch options.
 *
 * Main features:
 * - Controls health check modal visibility
 * - Stores launch options (account, provider, fingerprint, proxy)
 * - Provides launchWithCheck and closeHealthCheck callbacks
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { useState, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────
interface LaunchOptions {
  accountId: string;
  email: string;
  url?: string;
  provider?: string;
  fingerprintId?: string;
  proxyId?: string;
}

// ─── Hook ───────────────────────────────────────────────────────────────
export const useHealthCheck = () => {
  // ── State ──
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<LaunchOptions | null>(null);

  // ── Callbacks ──
  const launchWithCheck = useCallback((opts: LaunchOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeHealthCheck = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  return {
    isOpen,
    options,
    launchWithCheck,
    closeHealthCheck,
  };
};
