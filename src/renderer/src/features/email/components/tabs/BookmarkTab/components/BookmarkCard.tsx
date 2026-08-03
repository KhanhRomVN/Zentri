import { FC, useState, useCallback } from 'react';
import { Globe, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import Dropdown from '../../../../../../components/ui/Dropdown/Dropdown';
import { DropdownTrigger } from '../../../../../../components/ui/Dropdown/DropdownTrigger';
import { DropdownContent } from '../../../../../../components/ui/Dropdown/DropdownContent';
import { DropdownItem } from '../../../../../../components/ui/Dropdown/DropdownItem';
import type { BookmarkNode } from '../types';

interface BookmarkCardProps {
  bookmark: BookmarkNode;
  searchQuery?: string;
  isProfileRunning?: boolean;
  onOpen?: (bookmark: BookmarkNode) => void;
  onEdit?: (bookmark: BookmarkNode) => void;
  onDelete?: (bookmark: BookmarkNode) => void;
}

const faviconUrl = (hostname: string) =>
  `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;

const BookmarkCard: FC<BookmarkCardProps> = ({
  bookmark,
  searchQuery,
  isProfileRunning,
  onOpen,
  onEdit,
  onDelete,
}) => {
  const hostname = bookmark.url
    ? (() => {
        try {
          return new URL(bookmark.url).hostname;
        } catch {
          return '';
        }
      })()
    : '';

  const [imgError, setImgError] = useState(false);
  const [open, setOpen] = useState(false);
  const [clickPos, setClickPos] = useState({ top: 0, left: 0 });

  const name = bookmark.name || 'Untitled';
  const matchIndex = searchQuery ? name.toLowerCase().indexOf(searchQuery.toLowerCase()) : -1;

  const handleOpen = useCallback(() => {
    onOpen?.(bookmark);
  }, [bookmark, onOpen]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setClickPos({ top: e.clientY, left: e.clientX });
    setOpen(true);
  }, []);

  return (
    <Dropdown
      trigger="click"
      align="start"
      side="bottom"
      strategy="fixed"
      className="w-full"
      open={open}
      onOpenChange={setOpen}
      position={clickPos}
    >
      <DropdownTrigger>
        <button
          onClick={handleClick}
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg w-full text-left
                     bg-card/60 border border-border/30 hover:border-primary/20 
                     hover:bg-primary/5 transition-all duration-200 group 
                     cursor-pointer"
          title={bookmark.url}
        >
          <div className="w-6 h-6 rounded-md bg-muted/30 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
            {hostname && !imgError ? (
              <img
                src={faviconUrl(hostname)}
                alt=""
                className="w-4 h-4 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <Globe className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors">
              {searchQuery && matchIndex >= 0 ? (
                <>
                  {name.slice(0, matchIndex)}
                  <mark className="bg-primary/20 text-primary rounded-sm px-0.5">
                    {name.slice(matchIndex, matchIndex + searchQuery.length)}
                  </mark>
                  {name.slice(matchIndex + searchQuery.length)}
                </>
              ) : (
                name
              )}
            </div>
            {hostname && (
              <div className="text-[10px] text-muted-foreground/40 font-mono truncate mt-0.5">
                {hostname}
              </div>
            )}
          </div>
        </button>
      </DropdownTrigger>
      <DropdownContent className="min-w-[180px] bg-dropdown-background border border-border rounded-xl shadow-2xl p-1">
        <DropdownItem onClick={handleOpen} icon={<ExternalLink className="w-3.5 h-3.5" />} closeOnSelect>
          Open in Browser
        </DropdownItem>
        <DropdownItem
          onClick={() => onEdit?.(bookmark)}
          icon={<Pencil className="w-3.5 h-3.5" />}
          disabled={isProfileRunning}
          closeOnSelect
        >
          Edit
        </DropdownItem>
        <DropdownItem
          onClick={() => onDelete?.(bookmark)}
          icon={<Trash2 className="w-3.5 h-3.5" />}
          variant="error"
          disabled={isProfileRunning}
          closeOnSelect
        >
          Delete
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
};

export default BookmarkCard;