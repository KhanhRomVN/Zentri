/**
 * ------------------------------------------------------------------
 * BookmarkTab
 * ------------------------------------------------------------------
 * Tab panel displaying Chrome bookmarks for an email account.
 * Renders a sidebar with bookmark groups and a Kanban board for
 * the selected group. Supports opening, editing, and deleting
 * bookmarks with optimistic UI updates via IPC.
 *
 * Main features:
 * - Sidebar navigation for bookmark-bar and other groups
 * - Kanban board layout with search filtering
 * - Edit bookmark name/URL with file persistence
 * - Delete bookmark with optimistic removal
 * - Launch bookmark URL via BrowserLaunchModal
 * - Real-time profile running state detection
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { FC, useState, useMemo, useEffect, useCallback } from 'react';

// ── React DOM ──
import { createPortal } from 'react-dom';

// ── UI ──
import { Loader2, AlertCircle, Bookmark } from 'lucide-react';

// ── Hooks ──
import { useBookmarkData } from './hooks/useBookmarkData';

// ── Components ──
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import EditBookmarkModal from './components/EditBookmarkModal';
import DeleteBookmarkModal from './components/DeleteBookmarkModal';
import BrowserLaunchModal from '../../modals/BrowserLaunchModal';

// ── Types ──
import type { BookmarkGroup, BookmarkNode } from './types';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface BookmarkTabProps {
  email: string;
  accountId?: string;
}

// ─── Component ──────────────────────────────────────────────────────────
const BookmarkTab: FC<BookmarkTabProps> = ({ email, accountId }) => {
  // ── State ──
  const { loading, error, parsed } = useBookmarkData(email);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileRunning, setIsProfileRunning] = useState(false);

  // Modal states
  const [launchBookmark, setLaunchBookmark] = useState<BookmarkNode | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkNode | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<BookmarkNode | null>(null);

  // Local overrides
  const [overrides, setOverrides] = useState<
    Record<string, { name?: string; url?: string } | null>
  >({});

  // ── Effects ──
  // Kiểm tra profile đang chạy
  useEffect(() => {
    if (!accountId) return;

    let cancelled = false;

    const check = async () => {
      try {
        // @ts-ignore
        const isOpen = await window.electron.ipcRenderer.invoke('email:is-profile-open', accountId);
        if (!cancelled) setIsProfileRunning(!!isOpen);
      } catch {
        if (!cancelled) setIsProfileRunning(false);
      }
    };
    check();

    const onOpened = (_event: any, data: { accountId: string }) => {
      if (data?.accountId === accountId) setIsProfileRunning(true);
    };
    const onClosed = (_event: any, data: { accountId: string }) => {
      if (data?.accountId === accountId) setIsProfileRunning(false);
    };

    // @ts-ignore
    window.electron.ipcRenderer.on('email:browser-opened', onOpened);
    // @ts-ignore
    window.electron.ipcRenderer.on('email:browser-closed', onClosed);

    return () => {
      cancelled = true;
      // @ts-ignore
      window.electron.ipcRenderer.removeListener('email:browser-opened', onOpened);
      // @ts-ignore
      window.electron.ipcRenderer.removeListener('email:browser-closed', onClosed);
    };
  }, [accountId]);

  // ── Derived ──
  // Xác định group đang được chọn
  const selectedGroup = useMemo<BookmarkGroup | null>(() => {
    if (!parsed) return null;

    if (selectedId === 'bookmark_bar') {
      return parsed.bookmarkBar;
    }

    const found = parsed.otherGroups.find((g) => g.id === selectedId);
    if (found) return found;

    return parsed.bookmarkBar;
  }, [parsed, selectedId]);

  // ── Handlers ──
  const handleOpenBookmark = useCallback((bm: BookmarkNode) => {
    setLaunchBookmark(bm);
  }, []);

  const handleLaunch = useCallback(
    async (config: { fingerprintId?: string; proxyId?: string }) => {
      if (!launchBookmark || !accountId) return;

      try {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('email:open-login', {
          accountId,
          email,
          provider: 'fingerprint-chromium',
          url: launchBookmark.url,
          fingerprintId: config.fingerprintId,
          fingerprintConfig: (config as any).fingerprintConfig,
          proxyId: config.proxyId,
          launchMode: 'secure',
        });

        if (config.proxyId) {
          try {
            const hostname = launchBookmark.url ? new URL(launchBookmark.url).hostname : undefined;
            // @ts-ignore
            await window.electron.ipcRenderer.invoke('proxy:log-usage', {
              proxyId: config.proxyId,
              emailId: accountId,
              targetSite: hostname,
            });
          } catch {
            // silently ignore
          }
        }
      } catch (err) {
        console.error('Failed to launch browser for bookmark:', err);
      }

      setLaunchBookmark(null);
    },
    [launchBookmark, accountId, email],
  );

  const handleEditBookmark = useCallback((bm: BookmarkNode) => {
    setEditingBookmark(bm);
  }, []);

  const handleSaveEdit = useCallback(
    async (_bookmark: BookmarkNode, newName: string, newUrl: string) => {
      // Cập nhật UI ngay
      setOverrides((prev) => ({
        ...prev,
        [_bookmark.id]: { name: newName, url: newUrl },
      }));

      // Ghi file qua IPC
      try {
        // @ts-ignore
        const result = await window.electron.ipcRenderer.invoke('bookmark:update', {
          email,
          bookmarkId: _bookmark.id,
          name: newName,
          url: newUrl,
        });
        if (!result.success) {
          console.error('Failed to update bookmark:', result.error);
          // Revert UI nếu thất bại
          setOverrides((prev) => {
            const next = { ...prev };
            delete next[_bookmark.id];
            return next;
          });
        }
      } catch (err) {
        console.error('IPC error updating bookmark:', err);
      }
    },
    [email],
  );

  const handleDeleteBookmark = useCallback((bm: BookmarkNode) => {
    setDeletingBookmark(bm);
  }, []);

  const handleConfirmDelete = useCallback(
    async (_bookmark: BookmarkNode) => {
      // Ẩn khỏi UI ngay
      setOverrides((prev) => ({
        ...prev,
        [_bookmark.id]: null,
      }));

      // Xóa khỏi file qua IPC
      try {
        // @ts-ignore
        const result = await window.electron.ipcRenderer.invoke('bookmark:delete', {
          email,
          bookmarkId: _bookmark.id,
        });
        if (!result.success) {
          console.error('Failed to delete bookmark:', result.error);
          // Revert UI nếu thất bại
          setOverrides((prev) => {
            const next = { ...prev };
            delete next[_bookmark.id];
            return next;
          });
        }
      } catch (err) {
        console.error('IPC error deleting bookmark:', err);
      }
    },
    [email],
  );

  // ─── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 opacity-50">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
        </div>
        <span className="text-[11px] font-black tracking-[0.4em] uppercase text-primary/50">
          Loading Bookmarks...
        </span>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="w-20 h-20 rounded-[2rem] bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/10">
          <AlertCircle className="w-10 h-10 opacity-50" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-black tracking-tight text-foreground/90">
            Error Loading Bookmarks
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────────────────
  if (!parsed || parsed.allBookmarks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />
          <div className="relative w-32 h-32 rounded-[2.5rem] bg-muted/20 border border-border/50 flex items-center justify-center rotate-12 shadow-2xl">
            <Bookmark className="w-16 h-16 text-muted-foreground/10 -rotate-12" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-black tracking-tight text-foreground/80">
            No Bookmarks Found
          </h3>
          <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed mx-auto font-medium opacity-60">
            No Chrome bookmarks found for this account.
          </p>
        </div>
      </div>
    );
  }

  // ─── Main UI ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        bookmarkBar={parsed.bookmarkBar}
        otherGroups={parsed.otherGroups}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <KanbanBoard
        group={selectedGroup}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isProfileRunning={isProfileRunning}
        onOpenBookmark={handleOpenBookmark}
        onEditBookmark={handleEditBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        overrides={overrides}
      />

      {createPortal(
        <EditBookmarkModal
          isOpen={!!editingBookmark}
          bookmark={editingBookmark}
          onClose={() => setEditingBookmark(null)}
          onSave={handleSaveEdit}
          isProfileRunning={isProfileRunning}
        />,
        document.body,
      )}

      {createPortal(
        <DeleteBookmarkModal
          isOpen={!!deletingBookmark}
          bookmark={deletingBookmark}
          onClose={() => setDeletingBookmark(null)}
          onConfirm={handleConfirmDelete}
        />,
        document.body,
      )}

      {createPortal(
        <BrowserLaunchModal
          isOpen={!!launchBookmark}
          onClose={() => setLaunchBookmark(null)}
          email={email}
          accountId={accountId || ''}
          targetUrl={launchBookmark?.url}
          targetTitle={launchBookmark?.name}
          onLaunch={handleLaunch}
        />,
        document.body,
      )}
    </div>
  );
};

export default BookmarkTab;
