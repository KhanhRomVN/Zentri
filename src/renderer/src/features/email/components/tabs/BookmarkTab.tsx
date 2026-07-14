import { FC, useState, useEffect, useMemo } from 'react';
import { Bookmark, Folder, ChevronRight, ChevronDown, Globe, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';

interface BookmarkNode {
  name: string;
  type: 'folder' | 'url';
  url?: string;
  children?: BookmarkNode[];
  date_added?: string;
  date_modified?: string;
  id?: string;
}

interface BookmarkTabProps {
  email: string;
}

const BookmarkTreeItem: FC<{
  node: BookmarkNode;
  level: number;
}> = ({ node, level }) => {
  const [expanded, setExpanded] = useState(level < 1);

  if (node.type === 'folder') {
    return (
      <div className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors',
            level === 0 && 'font-bold text-foreground/80'
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          )}
          <Folder className="w-4 h-4 text-amber-400/70" />
          <span className="text-sm">{node.name}</span>
          {node.children && (
            <span className="text-[10px] text-muted-foreground/40 ml-auto">
              {node.children.length}
            </span>
          )}
        </div>
        {expanded && node.children && (
          <div className={cn('ml-4 border-l border-border/30 pl-2', level === 0 && 'ml-2')}>
            {node.children.map((child, idx) => (
              <BookmarkTreeItem key={idx} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors group">
      <Globe className="w-4 h-4 text-muted-foreground/40" />
      <a
        href={node.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-foreground/80 hover:text-primary transition-colors truncate flex-1"
        title={node.name}
      >
        {node.name}
      </a>
      <span className="text-[10px] text-muted-foreground/20 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
        {node.url ? new URL(node.url).hostname : ''}
      </span>
    </div>
  );
};

const BookmarkTab: FC<BookmarkTabProps> = ({ email }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkData, setBookmarkData] = useState<BookmarkNode | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setLoading(true);
      setError(null);
      try {
        // @ts-ignore
        const result = await window.electron.ipcRenderer.invoke('email:get-bookmarks', { email });
        console.log('[BookmarkTab] Full IPC result:', JSON.stringify(result, null, 2));
        
        if (result.success && result.bookmarks) {
          console.log('[BookmarkTab] Bookmarks data type:', typeof result.bookmarks);
          console.log('[BookmarkTab] Bookmarks keys:', Object.keys(result.bookmarks));
          
          // Handle both cases: result.bookmarks.roots or result.bookmarks directly
          const bookmarkData = result.bookmarks;
          const roots = bookmarkData.roots || bookmarkData;
          console.log('[BookmarkTab] Roots structure:', JSON.stringify(roots, null, 2));
          
          // Check if roots is empty or has no valid data
          if (!roots || Object.keys(roots).length === 0) {
            console.log('[BookmarkTab] No roots found in bookmark data');
            setBookmarkData(null);
            setLoading(false);
            return;
          }
          
          const parsedRoots: BookmarkNode = {
            name: 'Bookmarks',
            type: 'folder',
            children: [],
          };

          // Helper to parse bookmark nodes - more robust
          const parseNode = (node: any, depth: number = 0): BookmarkNode | null => {
            if (!node) return null;
            
            console.log(`[BookmarkTab] Parsing node at depth ${depth}:`, node.name || 'unnamed', node.type);
            
            if (node.type === 'folder' || node.children) {
              // If node has children or is a folder
              const children = (node.children || [])
                .map((child: any) => parseNode(child, depth + 1))
                .filter((child: BookmarkNode | null): child is BookmarkNode => child !== null);
              
              if (children.length === 0 && depth > 0) {
                // Skip empty folders (except root)
                return null;
              }
              
              return {
                name: node.name || 'Untitled Folder',
                type: 'folder',
                children: children.length > 0 ? children : undefined,
                date_added: node.date_added,
                date_modified: node.date_modified,
                id: node.id,
              };
            } else if (node.type === 'url' || node.url) {
              // URL node
              return {
                name: node.name || node.title || 'Untitled',
                type: 'url',
                url: node.url,
                date_added: node.date_added,
                id: node.id,
              };
            }
            
            return null;
          };

          // Parse each root
          const rootNames = ['bookmark_bar', 'other', 'synced', 'mobile'];
          let hasAnyBookmark = false;
          
          for (const rootName of rootNames) {
            if (roots[rootName]) {
              console.log(`[BookmarkTab] Processing root: ${rootName}`);
              const parsed = parseNode(roots[rootName], 0);
              if (parsed && parsed.children && parsed.children.length > 0) {
                parsedRoots.children!.push(parsed);
                hasAnyBookmark = true;
                console.log(`[BookmarkTab] Root ${rootName} has ${parsed.children.length} items`);
              } else {
                console.log(`[BookmarkTab] Root ${rootName} is empty or invalid`);
              }
            } else {
              console.log(`[BookmarkTab] Root ${rootName} not found`);
            }
          }

          if (!hasAnyBookmark) {
            console.log('[BookmarkTab] No valid bookmarks found in any root');
            setBookmarkData(null);
          } else {
            console.log('[BookmarkTab] Final parsed bookmarks:', parsedRoots);
            setBookmarkData(parsedRoots);
          }
        } else if (result.success && !result.bookmarks) {
          console.log('[BookmarkTab] Success but no bookmarks data');
          setBookmarkData(null);
        } else {
          console.log('[BookmarkTab] Error from IPC:', result.error);
          setError(result.error || 'Failed to load bookmarks');
        }
      } catch (err: any) {
        console.error('[BookmarkTab] Exception caught:', err);
        console.error('[BookmarkTab] Error stack:', err.stack);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchBookmarks();
    }
  }, [email]);

  const totalBookmarks = useMemo(() => {
    if (!bookmarkData) return 0;
    let count = 0;
    const traverse = (node: BookmarkNode) => {
      if (node.type === 'url') count++;
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(bookmarkData);
    return count;
  }, [bookmarkData]);

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

  if (!bookmarkData || totalBookmarks === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />
          <div className="relative w-32 h-32 rounded-[2.5rem] bg-muted/20 border border-border/50 flex items-center justify-center rotate-12 shadow-2xl">
            <Bookmark className="w-16 h-16 text-muted-foreground/10 -rotate-12" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-black tracking-tight text-foreground/80">No Bookmarks Found</h3>
          <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed mx-auto font-medium opacity-60">
            No Chrome bookmarks found for this account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-[39px] flex items-center justify-between px-2 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-500">
        <span className="text-[11px] font-black uppercase text-muted-foreground/60">Bookmarks</span>
        <span className="text-[10px] text-muted-foreground/40 font-mono">
          {totalBookmarks} items
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {bookmarkData.children && bookmarkData.children.length > 0 ? (
          <div className="space-y-0.5 max-w-4xl mx-auto">
            {bookmarkData.children.map((folder, idx) => (
              <BookmarkTreeItem key={idx} node={folder} level={0} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20">
            <Bookmark className="w-8 h-8" />
            <p className="text-[11px] font-black uppercase tracking-widest">No bookmarks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkTab;