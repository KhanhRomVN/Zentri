// --- Raw bookmark node từ Chrome JSON ---
export interface RawBookmarkNode {
  name: string;
  type: 'folder' | 'url';
  url?: string;
  children?: RawBookmarkNode[];
  date_added?: string;
  date_modified?: string;
  id?: string;
}

// --- Node đã parse, phân cấp ---
export interface BookmarkNode {
  id: string;
  name: string;
  type: 'folder' | 'url';
  url?: string;
  children: BookmarkNode[];
  date_added?: string;
  date_modified?: string;
  depth: number; // 0 = root group, 1 = subGroup cấp 1, 2 = subGroup cấp 2, 3+ = error
}

// --- Một group hiển thị ở Sidebar ---
export interface BookmarkGroup {
  id: string;
  name: string;
  type: 'bookmark-bar' | 'other' | 'error' | 'recently';
  children: BookmarkNode[]; // các subGroup cấp 2 (hoặc bookmark trực tiếp nếu depth=1)
}

// --- Một cột Kanban ---
export interface KanbanColumnData {
  id: string;
  name: string;
  bookmarks: BookmarkNode[];
}

// --- Kết quả parse tổng ---
export interface ParsedBookmarkData {
  bookmarkBar: BookmarkGroup;
  otherGroups: BookmarkGroup[];
  allBookmarks: BookmarkNode[];
}