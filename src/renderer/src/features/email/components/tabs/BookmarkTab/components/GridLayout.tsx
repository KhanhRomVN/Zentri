/**
 * ------------------------------------------------------------------
 * GridLayout
 * ------------------------------------------------------------------
 * Responsive grid layout for bookmark cards. Renders bookmarks
 * in a CSS grid that auto-fills columns (min 280px). Falls back
 * to an empty-state message when no bookmarks are present.
 *
 * Main features:
 * - Auto-fill responsive grid (min 280px columns)
 * - Empty state when bookmark list is empty
 * - Delegates rendering to BookmarkCard
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { FC } from 'react';

// ── Components ──
import BookmarkCard from './BookmarkCard';

// ── Types ──
import type { BookmarkNode } from '../types';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface GridLayoutProps {
  bookmarks: BookmarkNode[];
  searchQuery?: string;
  isProfileRunning?: boolean;
  onOpen?: (bookmark: BookmarkNode) => void;
  onEdit?: (bookmark: BookmarkNode) => void;
  onDelete?: (bookmark: BookmarkNode) => void;
}

// ─── Component ──────────────────────────────────────────────────────────
const GridLayout: FC<GridLayoutProps> = ({ bookmarks, searchQuery, isProfileRunning, onOpen, onEdit, onDelete }) => {
  if (bookmarks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/30 italic">
        No bookmarks in this group
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {bookmarks.map((bm) => (
          <BookmarkCard
            key={bm.id}
            bookmark={bm}
            searchQuery={searchQuery}
            isProfileRunning={isProfileRunning}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default GridLayout;