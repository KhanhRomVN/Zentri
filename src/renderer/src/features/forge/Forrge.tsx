/**
 * FORGE — Account Provisioning Console
 * Layout chính: Sidebar (danh sách nền tảng) + Main content (3 view).
 * Điều hướng nội bộ bằng state, không cần router.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePlatforms } from './hooks/usePlatforms';
import { fetchSessions, fetchAccounts } from './services/forgeService';
import Sidebar from './components/Sidebar';
import AddPlatformModal from './components/AddPlatformModal';
import Dashboard from './components/Dashboard';
import PlatformSessions from './components/PlatformSessions';
import SessionAccounts from './components/SessionAccounts';
import type { ForgeView, ForgeSession, ForgeAccount } from './types';

const Forge = () => {
  const { platforms, isLoading, refresh } = usePlatforms();
  const [view, setView] = useState<ForgeView>('dashboard');
  const [activePlatformId, setActivePlatformId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ForgeSession[]>([]);
  const [accounts, setAccounts] = useState<ForgeAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const activePlatform = platforms.find((p) => p.id === activePlatformId) || null;

  // ─── Navigation ──────────────────────────────────────────────────────────
  const goToDashboard = useCallback(() => {
    setView('dashboard');
    setActivePlatformId(null);
    setActiveSessionId(null);
    setSessions([]);
    setAccounts([]);
  }, []);

  const goToPlatform = useCallback((platformId: string) => {
    setActivePlatformId(platformId);
    setActiveSessionId(null);
    setView('platform');
  }, []);

  const goToSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setView('session');
  }, []);

  // ─── Data fetching ───────────────────────────────────────────────────────
  useEffect(() => {
    if (view === 'platform' && activePlatformId) {
      setIsLoadingSessions(true);
      fetchSessions(activePlatformId)
        .then(setSessions)
        .catch((err) => console.error('[Forge] Failed to fetch sessions:', err))
        .finally(() => setIsLoadingSessions(false));
    }
  }, [view, activePlatformId]);

  useEffect(() => {
    if (view === 'session' && activePlatformId) {
      setIsLoadingAccounts(true);
      fetchAccounts(activePlatformId)
        .then(setAccounts)
        .catch((err) => console.error('[Forge] Failed to fetch accounts:', err))
        .finally(() => setIsLoadingAccounts(false));
    }
  }, [view, activePlatformId]);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative selection:bg-primary/10">
      <div className="flex flex-1 min-h-0">
        <Sidebar
          platforms={platforms}
          activePlatformId={activePlatformId || undefined}
          onSelectDashboard={goToDashboard}
          onSelectPlatform={goToPlatform}
          onOpenAddPlatform={() => setIsModalOpen(true)}
        />

        <main className="flex-1 min-w-0 overflow-hidden">
          {view === 'dashboard' && (
            <Dashboard
              platforms={platforms}
              isLoading={isLoading}
              onSelectPlatform={goToPlatform}
            />
          )}

          {view === 'platform' && (
            <PlatformSessions
              platform={activePlatform}
              sessions={sessions}
              isLoading={isLoadingSessions}
              onSelectSession={goToSession}
            />
          )}

          {view === 'session' && (
            <SessionAccounts
              sessionId={activeSessionId || ''}
              accounts={accounts}
              isLoading={isLoadingAccounts}
            />
          )}
        </main>
      </div>

      <AddPlatformModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdded={refresh}
      />
    </div>
  );
};

export default Forge;