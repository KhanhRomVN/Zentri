import { useState, useEffect, useMemo } from 'react';
import type { RawBookmarkNode, BookmarkNode, BookmarkGroup, ParsedBookmarkData } from '../types';

// --- Helpers ---

function normalizeNode(raw: RawBookmarkNode, depth: number, parentId: string): BookmarkNode {
  const node: BookmarkNode = {
    id: raw.id || `${parentId}/${raw.name}`,
    name: raw.name || 'Untitled',
    type: raw.type === 'url' || raw.url ? 'url' : 'folder',
    url: raw.url,
    children: [],
    date_added: raw.date_added,
    date_modified: raw.date_modified,
    depth,
  };

  if (raw.children && raw.children.length > 0) {
    node.children = raw.children.map((child) => normalizeNode(child, depth + 1, node.id));
  }

  return node;
}

function flattenBookmarks(nodes: BookmarkNode[]): BookmarkNode[] {
  const result: BookmarkNode[] = [];
  for (const node of nodes) {
    if (node.type === 'url') {
      result.push(node);
    }
    if (node.children.length > 0) {
      result.push(...flattenBookmarks(node.children));
    }
  }
  return result;
}

// Từ 1 root folder, tách ra bookmark trực tiếp và subGroup cấp 1
function splitLevel1(root: BookmarkNode): {
  directBookmarks: BookmarkNode[];
  subGroups: BookmarkNode[];
} {
  const directBookmarks: BookmarkNode[] = [];
  const subGroups: BookmarkNode[] = [];

  for (const child of root.children) {
    if (child.type === 'url') {
      directBookmarks.push(child);
    } else if (child.type === 'folder') {
      subGroups.push(child);
    }
  }

  return { directBookmarks, subGroups };
}

// Với 1 subGroup (group1), tách bookmark trực tiếp và folder con cấp 2
function splitSubGroup(group: BookmarkNode): {
  directBookmarks: BookmarkNode[];
  subFolders: BookmarkNode[];
} {
  const directBookmarks: BookmarkNode[] = [];
  const subFolders: BookmarkNode[] = [];

  for (const child of group.children) {
    if (child.type === 'url') {
      directBookmarks.push(child);
    } else {
      subFolders.push(child);
    }
  }

  return { directBookmarks, subFolders };
}

// --- Hook ---

export function useBookmarkData(email: string) {
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchBookmarks = async () => {
      setLoading(true);
      setError(null);
      try {
        // @ts-ignore
        const result = await window.electron.ipcRenderer.invoke('email:get-bookmarks', { email });

        if (cancelled) return;

        if (result.success && result.bookmarks) {
          setRawData(result.bookmarks);
        } else if (result.success && !result.bookmarks) {
          setRawData(null);
        } else {
          setError(result.error || 'Failed to load bookmarks');
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'An error occurred');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBookmarks();
    return () => { cancelled = true; };
  }, [email]);

  const parsed = useMemo<ParsedBookmarkData | null>(() => {
    if (!rawData) return null;

    const roots = rawData.roots || rawData;
    if (!roots || Object.keys(roots).length === 0) return null;

    // --- Bookmark Bar ---
    const barRaw = roots.bookmark_bar;
    const barRoot: BookmarkNode = barRaw
      ? normalizeNode(barRaw, 0, 'bookmark_bar')
      : { id: 'bookmark_bar', name: 'Bookmark Bar', type: 'folder', children: [], depth: 0 };
    const { directBookmarks: barDirect, subGroups: barSubs } = splitLevel1(barRoot);

    const bookmarkBar: BookmarkGroup = {
      id: 'bookmark_bar',
      name: 'Bookmark Bar',
      type: 'bookmark-bar',
      children: barSubs,
    };

    if (barDirect.length > 0) {
      bookmarkBar.children.unshift({
        id: 'bookmark_bar/ungrouped',
        name: 'Ungrouped',
        type: 'folder',
        children: barDirect,
        depth: 1,
      });
    }

    // --- Other Bookmarks ---
    const otherRaw = roots.other;
    const otherRoot: BookmarkNode = otherRaw
      ? normalizeNode(otherRaw, 0, 'other')
      : { id: 'other', name: 'Other Bookmarks', type: 'folder', children: [], depth: 0 };
    const { directBookmarks: otherDirect, subGroups: otherSubs } = splitLevel1(otherRoot);

    // Mỗi group1: tách bookmark trực tiếp → cột "Ungrouped", folder con → cột riêng
    const otherGroups: BookmarkGroup[] = [];

    for (const sub of otherSubs) {
      const { directBookmarks, subFolders } = splitSubGroup(sub);
      const children: BookmarkNode[] = [...subFolders];

      if (directBookmarks.length > 0) {
        children.unshift({
          id: `${sub.id}/ungrouped`,
          name: 'Ungrouped',
          type: 'folder',
          children: directBookmarks,
          depth: 1,
        });
      }

      otherGroups.push({
        id: sub.id,
        name: sub.name,
        type: 'other' as const,
        children,
      });
    }

    // Bookmark trực tiếp trong Other root → nhóm "Ungrouped" top-level
    if (otherDirect.length > 0) {
      otherGroups.unshift({
        id: 'other/ungrouped',
        name: 'Ungrouped',
        type: 'other',
        children: otherDirect,
      });
    }

    // --- All bookmarks (flattened) ---
    const allBookmarks = [
      ...flattenBookmarks(barRoot.children),
      ...flattenBookmarks(otherRoot.children),
    ];

    return {
      bookmarkBar,
      otherGroups,
      allBookmarks,
    };
  }, [rawData]);

  return { loading, error, parsed };
}