import { FC, useMemo, useCallback } from 'react';
import KanbanColumn from './KanbanColumn';
import GridLayout from './GridLayout';
import SearchBar from './SearchBar';
import type { BookmarkGroup, BookmarkNode, KanbanColumnData } from '../types';

interface KanbanBoardProps {
  group: BookmarkGroup | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isProfileRunning?: boolean;
  onOpenBookmark?: (bookmark: BookmarkNode) => void;
  onEditBookmark?: (bookmark: BookmarkNode) => void;
  onDeleteBookmark?: (bookmark: BookmarkNode) => void;
  overrides?: Record<string, { name?: string; url?: string } | null>;
}

/** Merge local overrides vào 1 bookmark node (trả về null nếu đã bị xóa) */
function applyOverride(
  bm: BookmarkNode,
  overrides: Record<string, { name?: string; url?: string } | null>,
): BookmarkNode | null {
  const ov = overrides[bm.id];
  if (ov === null) return null; // đã xóa
  if (!ov) return bm; // không có override
  return { ...bm, name: ov.name ?? bm.name, url: ov.url ?? bm.url };
}

const KanbanBoard: FC<KanbanBoardProps> = ({
  group,
  searchQuery,
  onSearchChange,
  isProfileRunning,
  onOpenBookmark,
  onEditBookmark,
  onDeleteBookmark,
  overrides = {},
}) => {
  const columns = useMemo<KanbanColumnData[]>(() => {
    if (!group) return [];

    return group.children.map((child) => {
      const rawBookmarks =
        child.type === 'url'
          ? [child]
          : child.children.filter((c) => c.type === 'url');

      const merged = rawBookmarks
        .map((bm) => applyOverride(bm, overrides))
        .filter((bm): bm is BookmarkNode => bm !== null);

      return {
        id: child.id,
        name: child.name,
        bookmarks: merged,
      };
    });
  }, [group, overrides]);

  const allBookmarks = useMemo<BookmarkNode[]>(() => {
    if (!group) return [];
    const result: BookmarkNode[] = [];
    for (const child of group.children) {
      const raw =
        child.type === 'url'
          ? [child]
          : child.children.filter((c) => c.type === 'url');
      for (const bm of raw) {
        const merged = applyOverride(bm, overrides);
        if (merged) result.push(merged);
      }
    }
    return result;
  }, [group, overrides]);

  const handleEdit = useCallback(
    (bm: BookmarkNode) => {
      if (isProfileRunning) return;
      onEditBookmark?.(bm);
    },
    [isProfileRunning, onEditBookmark],
  );

  const handleDelete = useCallback(
    (bm: BookmarkNode) => {
      if (isProfileRunning) return;
      onDeleteBookmark?.(bm);
    },
    [isProfileRunning, onDeleteBookmark],
  );

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/30 italic">
        Select a group from the sidebar
      </div>
    );
  }

  const isBookmarkBar = group.type === 'bookmark-bar';
  const useGridLayout = isBookmarkBar || group.name === 'Ungrouped';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 h-[39px] border-b border-border shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-[13px] font-semibold text-foreground/80 truncate">{group.name}</h2>
          {isProfileRunning && (
            <span className="relative flex items-center gap-1 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-semibold text-emerald-500/80 uppercase tracking-wider">
                Running &middot; Read only
              </span>
            </span>
          )}
        </div>
        <div className="w-72 shrink-0">
          <SearchBar value={searchQuery} onChange={onSearchChange} />
        </div>
      </div>

      {useGridLayout ? (
        <GridLayout
          bookmarks={allBookmarks}
          searchQuery={searchQuery}
          isProfileRunning={isProfileRunning}
          onOpen={onOpenBookmark}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <>
          {columns.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/30 italic">
              No bookmarks in this group
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
              <div className="flex gap-4 p-4 h-full min-w-max">
                {columns.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    searchQuery={searchQuery}
                    isProfileRunning={isProfileRunning}
                    onOpen={onOpenBookmark}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KanbanBoard;