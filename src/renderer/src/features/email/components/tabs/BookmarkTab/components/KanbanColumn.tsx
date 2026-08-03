import { FC } from 'react';
import { Folder } from 'lucide-react';
import BookmarkCard from './BookmarkCard';
import type { KanbanColumnData, BookmarkNode } from '../types';

interface KanbanColumnProps {
  column: KanbanColumnData;
  searchQuery?: string;
  isProfileRunning?: boolean;
  onOpen?: (bookmark: BookmarkNode) => void;
  onEdit?: (bookmark: BookmarkNode) => void;
  onDelete?: (bookmark: BookmarkNode) => void;
}

const KanbanColumn: FC<KanbanColumnProps> = ({ column, searchQuery, isProfileRunning, onOpen, onEdit, onDelete }) => {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/20 shrink-0">
        <Folder className="w-3.5 h-3.5 text-amber-400/60" />
        <span className="text-xs font-bold text-foreground/70 truncate flex-1">{column.name}</span>
        <span className="text-[10px] text-muted-foreground/40 font-mono shrink-0">
          {column.bookmarks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 [&::-webkit-scrollbar]:w-0 [scrollbar-width:none]">
        {column.bookmarks.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-[10px] text-muted-foreground/30 italic">
            Empty
          </div>
        ) : (
          column.bookmarks.map((bm) => (
            <BookmarkCard
              key={bm.id}
              bookmark={bm}
              searchQuery={searchQuery}
              isProfileRunning={isProfileRunning}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;