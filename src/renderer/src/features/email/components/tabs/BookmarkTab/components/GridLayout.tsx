import { FC } from 'react';
import BookmarkCard from './BookmarkCard';
import type { BookmarkNode } from '../types';

interface GridLayoutProps {
  bookmarks: BookmarkNode[];
  searchQuery?: string;
  isProfileRunning?: boolean;
  onOpen?: (bookmark: BookmarkNode) => void;
  onEdit?: (bookmark: BookmarkNode) => void;
  onDelete?: (bookmark: BookmarkNode) => void;
}

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