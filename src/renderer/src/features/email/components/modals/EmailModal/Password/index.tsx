/**
 * ------------------------------------------------------------------
 * PasswordTab
 * ------------------------------------------------------------------
 * Manages the per-profile password list stored in
 * `<profileDir>/passwords.db` (SQLite). Each row is a credential with
 * `url` (used by the browser extension for domain matching), `username`
 * and `password`. The URL is hidden from the table to keep the UI clean;
 * it is entered via the add/edit form.
 * ------------------------------------------------------------------
 */

import { FC, useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, Copy, Pencil, Save, Key } from 'lucide-react';
import Input from '../../../../../../components/ui/Input/Input';
import { Button } from '../../../../../../components/ui/Button';
import { EmptyState } from '../../../../../../components/ui/EmptyState';
import { cn } from '../../../../../../shared/lib/utils';

interface PasswordEntry {
  id: string;
  url: string;
  username: string;
  password: string;
}

interface PasswordTabProps {
  email: string;
}

const PasswordTab: FC<PasswordTabProps> = ({ email }) => {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formUrl, setFormUrl] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadPasswords = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      // @ts-ignore
      const res = await window.electron.ipcRenderer.invoke('profile:list-passwords', { email });
      if (res?.success) setPasswords(res.passwords || []);
    } catch (err) {
      console.error('Failed to load passwords', err);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    loadPasswords();
  }, [loadPasswords]);

  const resetForm = () => {
    setFormUrl('');
    setFormUsername('');
    setFormPassword('');
    setEditingId(null);
    setFormOpen(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleOpenEdit = (p: PasswordEntry) => {
    setEditingId(p.id);
    setFormUrl(p.url);
    setFormUsername(p.username);
    setFormPassword(p.password);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formUrl.trim() || !formPassword.trim()) return;
    try {
      if (editingId) {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('profile:update-password', {
          email,
          id: editingId,
          url: formUrl.trim(),
          username: formUsername.trim(),
          password: formPassword,
        });
      } else {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('profile:add-password', {
          email,
          url: formUrl.trim(),
          username: formUsername.trim(),
          password: formPassword,
        });
      }
      resetForm();
      loadPasswords();
    } catch (err) {
      console.error('Failed to save password', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this password? This cannot be undone.')) return;
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('profile:delete-password', { email, id });
      loadPasswords();
    } catch (err) {
      console.error('Failed to delete password', err);
    }
  };

  const toggleShow = (id: string) => setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));

  const copyToClipboard = (id: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1200);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground">Passwords</h3>
            <p className="text-sm text-text-secondary">
              Credentials stored for this profile. Synced to the browser extension for autofill.
            </p>
          </div>
        </div>
        <Button variant="soft" onClick={handleOpenAdd} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Password
        </Button>
      </div>

      {formOpen && (
        <div className="rounded-lg border border-border bg-card-background p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <Input
              label="URL"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <Input
              label="Gmail / Username"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="user@example.com"
            />
            <Input
              label="Password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              variant="soft"
              onClick={handleSave}
              disabled={!formUrl.trim() || !formPassword.trim()}
            >
              <Save className="w-4 h-4 mr-1.5" />
              {editingId ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 text-text-secondary text-sm">
          Loading...
        </div>
      ) : passwords.length === 0 ? (
        <EmptyState
          variant="default"
          icon={<Key className="w-6 h-6" />}
          title="No passwords yet"
          description="Add a credential so the browser extension can autofill it."
          className="h-auto py-8"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-text-secondary text-[11px] uppercase tracking-wide">
              <tr>
                <th className="w-12 px-3 py-2 text-left">STT</th>
                <th className="px-3 py-2 text-left">Gmail / Username</th>
                <th className="px-3 py-2 text-left">Password</th>
                <th className="w-24 px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {passwords.map((p, i) => {
                const isShown = showPasswords[p.id];
                const isCopied = copiedId === p.id;
                return (
                  <tr key={p.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono text-text-secondary">{i + 1}</td>
                    <td className="px-3 py-2 truncate">
                      {p.username || <span className="text-text-tertiary italic">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('font-mono text-xs', isCopied && 'text-success')}>
                          {isCopied ? 'Copied' : isShown ? p.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShow(p.id)}
                          className="text-text-secondary hover:text-foreground transition-colors"
                          aria-label={isShown ? 'Hide password' : 'Show password'}
                        >
                          {isShown ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(p.id, p.password)}
                          className="text-text-secondary hover:text-foreground transition-colors"
                          aria-label="Copy password"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="w-7 h-7 rounded-md text-text-secondary hover:text-foreground hover:bg-muted/40 flex items-center justify-center transition-colors"
                          aria-label="Edit password"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="w-7 h-7 rounded-md text-error/70 hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors"
                          aria-label="Delete password"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PasswordTab;