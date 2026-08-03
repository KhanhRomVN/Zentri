import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { dbManager } from '../database';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getBookmarkPath(email: string): string | null {
  const dbDir = path.dirname(dbManager.dbPath);
  const profilePath = path.join(dbDir, 'profiles', email);

  const accountBookmarkPath = path.join(profilePath, 'Default', 'AccountBookmarks');
  const legacyBookmarkPath = path.join(profilePath, 'Bookmarks');

  if (fs.existsSync(accountBookmarkPath)) return accountBookmarkPath;
  if (fs.existsSync(legacyBookmarkPath)) return legacyBookmarkPath;
  return null;
}

interface RawNode {
  name: string;
  type: 'folder' | 'url';
  url?: string;
  children?: RawNode[];
  id?: string;
  date_added?: string;
  date_modified?: string;
}

/** Tìm và cập nhật node theo id trong cây, trả về true nếu tìm thấy */
function findAndUpdate(nodes: RawNode[], targetId: string, name: string, url: string): boolean {
  for (const node of nodes) {
    if (node.id === targetId) {
      node.name = name;
      node.url = url;
      return true;
    }
    if (node.children && node.children.length > 0) {
      if (findAndUpdate(node.children, targetId, name, url)) return true;
    }
  }
  return false;
}

/** Tìm và xóa node theo id trong cây, trả về true nếu tìm thấy */
function findAndDelete(nodes: RawNode[], targetId: string): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === targetId) {
      nodes.splice(i, 1);
      return true;
    }
    if (nodes[i].children && nodes[i].children.length > 0) {
      if (findAndDelete(nodes[i].children!, targetId)) return true;
    }
  }
  return false;
}

// ─── IPC Handlers ───────────────────────────────────────────────────────────

export function registerBookmarkHandlers() {
  // ── Get bookmarks ─────────────────────────────────────────────────────
  ipcMain.handle('email:get-bookmarks', async (_event, { email }: { email: string }) => {
    try {
      const bookmarkPath = getBookmarkPath(email);

      if (!bookmarkPath) {
        return { success: true, bookmarks: null, message: 'No bookmarks found' };
      }

      const content = fs.readFileSync(bookmarkPath, 'utf-8');
      const data = JSON.parse(content);

      return { success: true, bookmarks: data };
    } catch (error: any) {
      console.error('Error reading bookmarks:', error);
      return { success: false, error: error.message };
    }
  });

  // ── Update bookmark ───────────────────────────────────────────────────
  ipcMain.handle(
    'bookmark:update',
    async (_event, { email, bookmarkId, name, url }: { email: string; bookmarkId: string; name: string; url: string }) => {
      try {
        const bookmarkPath = getBookmarkPath(email);
        if (!bookmarkPath) {
          return { success: false, error: 'Bookmark file not found' };
        }

        const content = fs.readFileSync(bookmarkPath, 'utf-8');
        const data = JSON.parse(content);

        const roots = data.roots;
        if (!roots) return { success: false, error: 'Invalid bookmark structure' };

        let found = false;
        for (const key of ['bookmark_bar', 'other', 'synced']) {
          const root = roots[key];
          if (root?.children) {
            if (findAndUpdate(root.children, bookmarkId, name, url)) {
              found = true;
              break;
            }
          }
        }

        if (!found) {
          return { success: false, error: `Bookmark with id "${bookmarkId}" not found` };
        }

        // Cập nhật checksum nếu có
        if (data.checksum) {
          // Chrome sẽ tự tính lại checksum khi mở, tạm thời xóa để tránh lỗi
          delete data.checksum;
        }

        fs.writeFileSync(bookmarkPath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
      } catch (error: any) {
        console.error('Error updating bookmark:', error);
        return { success: false, error: error.message };
      }
    },
  );

  // ── Delete bookmark ───────────────────────────────────────────────────
  ipcMain.handle(
    'bookmark:delete',
    async (_event, { email, bookmarkId }: { email: string; bookmarkId: string }) => {
      try {
        const bookmarkPath = getBookmarkPath(email);
        if (!bookmarkPath) {
          return { success: false, error: 'Bookmark file not found' };
        }

        const content = fs.readFileSync(bookmarkPath, 'utf-8');
        const data = JSON.parse(content);

        const roots = data.roots;
        if (!roots) return { success: false, error: 'Invalid bookmark structure' };

        let found = false;
        for (const key of ['bookmark_bar', 'other', 'synced']) {
          const root = roots[key];
          if (root?.children) {
            if (findAndDelete(root.children, bookmarkId)) {
              found = true;
              break;
            }
          }
        }

        if (!found) {
          return { success: false, error: `Bookmark with id "${bookmarkId}" not found` };
        }

        // Xóa checksum
        if (data.checksum) {
          delete data.checksum;
        }

        fs.writeFileSync(bookmarkPath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
      } catch (error: any) {
        console.error('Error deleting bookmark:', error);
        return { success: false, error: error.message };
      }
    },
  );
}