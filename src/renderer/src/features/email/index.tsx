import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import EmailTable from './components/EmailTable';
import {
  Plus,
  Mail,
  AlertCircle,
  Loader2,
  Shield,
  Key,
  Hash,
  Search,
  LayoutGrid,
  Trash2,
  Undo2,
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';
import { Account } from './types';
import { v4 as uuidv4 } from 'uuid';
import { Breadcrumb, BreadcrumbItem } from '../../shared/components/ui/breadcumb';
import { Drawer } from '../../shared/components/ui/drawer';
import Input from '../../shared/components/ui/input/Input';
import Toast from '../../shared/components/ui/Toast';
import { Modal } from '../../shared/components/ui/modal';

const diffChars = (oldStr: string, newStr: string) => {
  let commonPrefix = 0;
  while (
    commonPrefix < oldStr.length &&
    commonPrefix < newStr.length &&
    oldStr[commonPrefix] === newStr[commonPrefix]
  ) {
    commonPrefix++;
  }

  let commonSuffix = 0;
  while (
    commonSuffix < oldStr.length - commonPrefix &&
    commonSuffix < newStr.length - commonPrefix &&
    oldStr[oldStr.length - 1 - commonSuffix] === newStr[newStr.length - 1 - commonSuffix]
  ) {
    commonSuffix++;
  }

  return {
    prefix: oldStr.slice(0, commonPrefix),
    oldMiddle: oldStr.slice(commonPrefix, oldStr.length - commonSuffix),
    newMiddle: newStr.slice(commonPrefix, newStr.length - commonSuffix),
    suffix: oldStr.slice(oldStr.length - commonSuffix),
  };
};

const EmailManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const statusFilter = 'all';
  const providerFilter = 'all';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newEmailData, setNewEmailData] = useState({
    email: '',
    password: '',
    recoveryEmail: '',
    phoneNumber: '',
    totpSecretKey: '',
    backupCodes: [] as string[],
  });
  const [backupCodeSearch, setBackupCodeSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [focusedAccountId, setFocusedAccountId] = useState<string | null>(null);

  // Deep Link: Listen for focus or focus_email param
  useEffect(() => {
    const focusId = searchParams.get('focus');
    const focusEmail = searchParams.get('focus_email');

    if (focusId) {
      console.log('[EmailManager] Deep link focus (ID) detected:', focusId);
      setFocusedAccountId(focusId);
      setSearchQuery('');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('focus');
      setSearchParams(newParams, { replace: true });
    } else if (focusEmail && accounts.length > 0) {
      console.log('[EmailManager] Deep link focus (Email) detected:', focusEmail);
      const matched = accounts.find((a) => a.email.toLowerCase() === focusEmail.toLowerCase());
      if (matched) {
        console.log('[EmailManager] Resolved email to ID:', matched.id);
        setFocusedAccountId(matched.id);
        setSearchQuery('');
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('focus_email');
        setSearchParams(newParams, { replace: true });
      } else {
        console.warn('[EmailManager] Could not find account with email:', focusEmail);
      }
    }
  }, [searchParams, setSearchParams, accounts]);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning',
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hardDeleteConfirmId, setHardDeleteConfirmId] = useState<string | null>(null);
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null);
  const [diffPayload, setDiffPayload] = useState<{
    old: Account;
    new: Account;
  } | null>(null);

  const accountsRef = useRef(accounts);

  useLayoutEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        'SELECT * FROM emails ORDER BY created_at DESC',
      );

      const loadedAccounts: Account[] = rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        password: row.password || '',
        status: row.status,
        phoneNumber: row.phone_number,
        recoveryEmail: row.recovery_email,
        totpSecretKey: row.totp_secret_key,
        backupCodes: row.backup_codes,
        scheduledDeletionAt: row.scheduled_deletion_at,
        lastUsedAt: row.last_used_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setAccounts(loadedAccounts);
      console.log('[EmailManager] Data loaded successfully, count:', loadedAccounts.length);
    } catch (err: any) {
      console.error('[Email] Load error:', err);
      setError(`Failed to read data from database: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSoftDelete = useCallback(
    async (id: string) => {
      try {
        const scheduledTime = new Date();
        scheduledTime.setDate(scheduledTime.getDate() + 7);
        const scheduledStr = scheduledTime.toISOString();

        // @ts-ignore
        await window.electron.ipcRenderer.invoke(
          'sqlite:run',
          'UPDATE emails SET status = ?, scheduled_deletion_at = ? WHERE id = ?',
          ['deleting', scheduledStr, id],
        );

        setToast({
          visible: true,
          message: 'Account moved to trash. Permanent deletion in 7 days.',
          type: 'warning',
        });

        await loadData();
      } catch (e) {
        console.error('[Email] Soft delete error:', e);
        setToast({
          visible: true,
          message: 'Failed to move account to trash',
          type: 'error',
        });
      }
    },
    [loadData],
  );

  const handleRestore = useCallback(
    async (id: string) => {
      try {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke(
          'sqlite:run',
          'UPDATE emails SET status = ?, scheduled_deletion_at = NULL WHERE id = ?',
          ['active', id],
        );
        setToast({ visible: true, message: 'Account restored successfully', type: 'success' });
        await loadData();
      } catch (e) {
        console.error('[Email] Restore error:', e);
        setToast({ visible: true, message: 'Failed to restore account', type: 'error' });
      }
    },
    [loadData],
  );

  const handleHardDelete = useCallback(
    async (id: string) => {
      try {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('sqlite:run', 'DELETE FROM emails WHERE id = ?', [
          id,
        ]);
        setToast({ visible: true, message: 'Account permanently deleted', type: 'info' });
        await loadData();
      } catch (e) {
        console.error('[Email] Hard delete error:', e);
        setToast({ visible: true, message: 'Failed to delete account', type: 'error' });
      }
    },
    [loadData],
  );
  const handleUpdateAccount = useCallback(
    async (updated: Account) => {
      try {
        setLoading(true);
        // @ts-ignore
        await window.electron.ipcRenderer.invoke(
          'sqlite:run',
          'UPDATE emails SET email = ?, password = ?, recovery_email = ?, phone_number = ?, totp_secret_key = ?, backup_codes = ? WHERE id = ?',
          [
            updated.email,
            updated.password,
            updated.recoveryEmail,
            updated.phoneNumber,
            updated.totpSecretKey,
            updated.backupCodes,
            updated.id,
          ],
        );
        setToast({ visible: true, message: 'Account updated successfully', type: 'success' });
        await loadData();
      } catch (e) {
        console.error('[Email] Update error:', e);
        setToast({ visible: true, message: 'Failed to update account', type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [loadData],
  );

  const validateField = useCallback((name: string, value: string) => {
    let error = '';
    if (name === 'email') {
      if (!value.trim()) error = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
    } else if (name === 'password') {
      if (!value.trim()) error = 'Password is required';
    } else if (name === 'recoveryEmail') {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        error = 'Invalid recovery email format';
    } else if (name === 'phoneNumber') {
      if (value && !/^\+?[0-9\s\-()]+$/.test(value)) error = 'Invalid phone number format';
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const handleAddEmail = useCallback(async () => {
    const newErrors: Record<string, string> = {};

    // Use common validation logic
    if (!newEmailData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!newEmailData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (
      newEmailData.recoveryEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailData.recoveryEmail)
    ) {
      newErrors.recoveryEmail = 'Invalid recovery email format';
    }

    if (newEmailData.phoneNumber && !/^\+?[0-9\s\-()]+$/.test(newEmailData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const id = uuidv4();
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        `INSERT INTO emails (id, email, password, recovery_email, phone_number, totp_secret_key, backup_codes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          newEmailData.email,
          newEmailData.password,
          newEmailData.recoveryEmail || null,
          newEmailData.phoneNumber || null,
          newEmailData.totpSecretKey || null,
          newEmailData.backupCodes.length > 0 ? JSON.stringify(newEmailData.backupCodes) : null,
          'active',
        ],
      );

      // Create profile folder based on email
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('email:create-profile', {
        email: newEmailData.email,
      });

      await loadData();
      setIsDrawerOpen(false);
      setNewEmailData({
        email: '',
        password: '',
        recoveryEmail: '',
        phoneNumber: '',
        totpSecretKey: '',
        backupCodes: [],
      });
      setErrors({});
    } catch (e) {
      console.error('[Email] Add error:', e);
      alert('Failed to add account');
    }
  }, [newEmailData, loadData]);

  const trashConflict = useMemo(() => {
    if (!newEmailData.email) return null;
    return accounts.find(
      (a) => a.email.toLowerCase() === newEmailData.email.toLowerCase() && a.status === 'deleting',
    );
  }, [newEmailData.email, accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.recoveryEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
      const matchesProvider =
        providerFilter === 'all' || account.emailProviderId === providerFilter;

      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [accounts, searchQuery, statusFilter, providerFilter]);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden selection:bg-primary/10">
      {/* Header with Breadcrumbs */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-500">
        <div className="flex items-center gap-4">
          <Breadcrumb className="mb-0" size={120}>
            <BreadcrumbItem
              icon={LayoutGrid}
              className="hover:text-foreground text-muted-foreground/50 transition-colors"
              text={''}
            />
            <BreadcrumbItem text="Emails" />
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-3">
          {/* SearchBar */}
          <div className="w-80 flex items-center transition-all duration-500">
            <Input
              size="sm"
              placeholder={
                focusedAccountId
                  ? 'Search disabled while detail is active...'
                  : 'Search identitites...'
              }
              leftIcon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              readOnly={!!focusedAccountId}
              onClick={() => {
                if (focusedAccountId) {
                  setToast({
                    visible: true,
                    message: 'Please close account detail to unlock search',
                    type: 'warning',
                  });
                }
              }}
              className={cn(
                '!h-9 bg-muted/5 border-border/10 focus:bg-muted/10 transition-all duration-300 rounded-xl translate-y-[1px]',
                focusedAccountId && 'opacity-50 cursor-not-allowed border-dashed',
              )}
            />
          </div>

          <button
            onClick={() => {
              setSelectedAccount(null);
              setIsDrawerOpen(true);
            }}
            className="w-9 h-9 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all active:scale-90 border border-primary/20 group"
            title="Add Email Account"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" />
          </button>
        </div>
      </div>

      {/* Main Content: Table */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <div className="flex-1 bg-card/30 border-b border-border/50 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground opacity-50">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
                Indexing Cloud Repository...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center bg-destructive/5">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-sm font-bold text-foreground">Sync Failure</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
              </div>
              <button
                onClick={loadData}
                className="px-6 py-2.5 bg-background border border-border hover:bg-muted rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Restore Connection
              </button>
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-8 p-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative w-28 h-28 rounded-3xl bg-muted/50 border border-border/50 flex items-center justify-center transform rotate-12">
                  <Mail className="w-12 h-12 text-muted-foreground/30 -rotate-12" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold tracking-tight">Cloud Storage Empty</p>
                <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed mx-auto">
                  No email accounts detected. Add your first connection to start managing.
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Account
              </button>
            </div>
          ) : (
            <EmailTable
              accounts={filteredAccounts}
              focusedAccountId={focusedAccountId}
              onSelectAccount={(account) => {
                setFocusedAccountId((prev) => (prev === account.id ? null : account.id));
              }}
              onSoftDelete={(id) => setDeleteConfirmId(id)}
              onRestore={(id) => setRestoreConfirmId(id)}
              onHardDelete={(id) => setHardDeleteConfirmId(id)}
              onSaveChanges={(oldAcc, newAcc) => setDiffPayload({ old: oldAcc, new: newAcc })}
            />
          )}
        </div>
      </div>

      {/* Add Email Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAccount(null);
        }}
        direction="right"
        width={500}
        title={selectedAccount ? 'Cloud Connection Details' : 'Add Email Account'}
        subtitle={
          selectedAccount
            ? 'Review and manage account security settings'
            : 'Connect a new email account'
        }
        footerActions={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-button-secondBg hover:bg-button-secondBgHover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEmail}
              disabled={!newEmailData.email || !newEmailData.password || !!trashConflict}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg',
                !newEmailData.email || !newEmailData.password || !!trashConflict
                  ? 'bg-button-bg/50 text-button-bgText cursor-not-allowed opacity-70'
                  : 'bg-button-bg text-button-bgText hover:bg-button-bgHover shadow-primary/20',
              )}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="p-4 space-y-6">
          {/* Account Credentials */}
          <div className="space-y-4">
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Email
                <span className="text-destructive ml-1">*</span>
              </label>
              <Input
                placeholder="identity@example.com"
                value={newEmailData.email}
                onChange={(e) => {
                  setNewEmailData((d) => ({ ...d, email: e.target.value }));
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                onBlur={() => validateField('email', newEmailData.email)}
                error={errors.email}
              />

              {/* Trash Conflict Warning */}
              {trashConflict && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Trash Conflict Detected
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        This email is currently in the trash. You must permanently delete it before
                        connecting it again.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleHardDelete(trashConflict.id)}
                      className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                    >
                      Delete Permanently
                    </button>
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setFocusedAccountId(trashConflict.id);
                      }}
                      className="flex-1 py-2 rounded-xl bg-white/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider hover:bg-amber-500/5 transition-colors"
                    >
                      View in Table
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Password
                <span className="text-destructive ml-1">*</span>
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={newEmailData.password}
                onChange={(e) => {
                  setNewEmailData((d) => ({ ...d, password: e.target.value }));
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                onBlur={() => validateField('password', newEmailData.password)}
                error={errors.password}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Recovery Email
              </label>
              <Input
                placeholder="backup@proton.me"
                value={newEmailData.recoveryEmail}
                onChange={(e) => {
                  setNewEmailData((d) => ({ ...d, recoveryEmail: e.target.value }));
                  if (errors.recoveryEmail) setErrors((prev) => ({ ...prev, recoveryEmail: '' }));
                }}
                onBlur={() => validateField('recoveryEmail', newEmailData.recoveryEmail)}
                error={errors.recoveryEmail}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Phone Number
              </label>
              <Input
                type="text"
                placeholder="+84 ••• ••• •••"
                value={newEmailData.phoneNumber}
                onChange={(e) => {
                  setNewEmailData((d) => ({ ...d, phoneNumber: e.target.value }));
                  if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                }}
                onBlur={() => validateField('phoneNumber', newEmailData.phoneNumber)}
                error={errors.phoneNumber}
              />
            </div>
          </div>

          {/* Security Secrets */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90">
                Security Settings
              </h3>
            </div>
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                2FA Secret Key (TOTP)
              </label>
              <Input
                type="text"
                placeholder="Optional 2FA Secret Key"
                leftIcon={Key}
                value={newEmailData.totpSecretKey}
                onChange={(e) => setNewEmailData((d) => ({ ...d, totpSecretKey: e.target.value }))}
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Backup Codes
              </label>
              <Input
                type="combobox"
                placeholder="Type and press Enter to add..."
                value={backupCodeSearch}
                onChange={(e) => setBackupCodeSearch(e.target.value)}
                multiValue={true}
                badgeColorMode="diverse"
                badgeVariant="neon"
                leftIcon={Hash}
                badges={newEmailData.backupCodes.map((code) => ({ id: code, label: code }))}
                onBadgeRemove={(id) => {
                  setNewEmailData((d) => ({
                    ...d,
                    backupCodes: d.backupCodes.filter((c) => c !== id),
                  }));
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' && backupCodeSearch.trim()) {
                    const newVal = backupCodeSearch.trim();
                    if (!newEmailData.backupCodes.includes(newVal)) {
                      setNewEmailData((d) => ({
                        ...d,
                        backupCodes: [...d.backupCodes, newVal],
                      }));
                    }
                    setBackupCodeSearch('');
                  }
                }}
                className="bg-input-background border-border rounded-xl"
              />
            </div>
          </div>
        </div>
      </Drawer>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <Modal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Move to Trash"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-button-secondBg hover:bg-button-secondBgHover transition-colors text-foreground/80"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deleteConfirmId) {
                  handleSoftDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-lg shadow-destructive/20"
            >
              Confirm
            </button>
          </div>
        }
      >
        <div className="space-y-4 py-4">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mx-auto mb-4">
            <Trash2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            Are you sure you want to move this account to the trash? It will be{' '}
            <span className="text-foreground font-bold"> permanently deleted </span> after a 7-day
            grace period.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!hardDeleteConfirmId}
        onClose={() => setHardDeleteConfirmId(null)}
        title="Delete Permanently"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setHardDeleteConfirmId(null)}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-button-secondBg hover:bg-button-secondBgHover transition-colors text-foreground/80"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (hardDeleteConfirmId) {
                  handleHardDelete(hardDeleteConfirmId);
                  setHardDeleteConfirmId(null);
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
            >
              Delete
            </button>
          </div>
        }
      >
        <div className="space-y-4 py-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            This action <span className="text-red-500 font-bold"> cannot be undone </span>. All
            account data, profiles, and associated service links will be wiped from the local
            repository.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!restoreConfirmId}
        onClose={() => setRestoreConfirmId(null)}
        title="Restore Account"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setRestoreConfirmId(null)}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-button-secondBg hover:bg-button-secondBgHover transition-colors text-foreground/80"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (restoreConfirmId) {
                  handleRestore(restoreConfirmId);
                  setRestoreConfirmId(null);
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              Restore
            </button>
          </div>
        }
      >
        <div className="space-y-4 py-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-4">
            <Undo2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            Bạn có chắc chắn muốn <span className="text-emerald-500 font-bold">khôi phục</span> tài
            khoản này? Tài khoản sẽ quay lại trạng thái hoạt động bình thường và lịch trình xóa sẽ
            bị hủy.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!diffPayload}
        onClose={() => setDiffPayload(null)}
        title="Review Changes"
        size="md"
        bodyClassName="h-[35vh] max-h-[35vh]"
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setDiffPayload(null)}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-button-secondBg hover:bg-button-secondBgHover transition-colors text-foreground/80"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (diffPayload) {
                  handleUpdateAccount(diffPayload.new);
                  setDiffPayload(null);
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              Confirm Changes
            </button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div className="space-y-4 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
            {diffPayload &&
              Object.keys(diffPayload.new).map((key) => {
                const k = key as keyof Account;
                // Skip non-data or internal fields
                if (
                  [
                    'id',
                    'createdAt',
                    'updatedAt',
                    'lastUsedAt',
                    'metadata',
                    'services',
                    'recentActivity',
                    'status',
                    'scheduledDeletionAt',
                    'emailProviderId',
                    'profileFolderId',
                  ].includes(key)
                )
                  return null;
                const oldValue = String(diffPayload.old[k] || '');
                const newValue = String(diffPayload.new[k] || '');

                if (oldValue === newValue) return null;

                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/_/g, ' ')
                  .replace(/^\w/, (c) => c.toUpperCase())
                  .trim();

                return (
                  <div key={key} className="space-y-2 border-b border-border/20 pb-4 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-foreground/40 tracking-wider">
                        {label}
                      </span>
                    </div>
                    {/* Diff View */}
                    <div className="space-y-1 font-mono text-[11px] overflow-hidden rounded-lg bg-black/20">
                      {(() => {
                        const { prefix, oldMiddle, newMiddle, suffix } = diffChars(
                          oldValue,
                          newValue,
                        );
                        return (
                          <>
                            {/* Old Value Line */}
                            <div className="flex gap-3 border-l-2 border-red-500/50 p-2 text-foreground/40 italic">
                              <span className="opacity-50 select-none">-</span>
                              <span className="break-all">
                                {prefix}
                                {oldMiddle && (
                                  <span className="bg-red-500/20 text-red-400 rounded px-0.5 border border-red-500/20 not-italic">
                                    {oldMiddle}
                                  </span>
                                )}
                                {suffix}
                                {!oldValue && <span className="opacity-30">(Empty)</span>}
                              </span>
                            </div>
                            {/* New Value Line */}
                            <div className="flex gap-3 border-l-2 border-emerald-500 p-2 text-foreground/80">
                              <span className="opacity-50 select-none">+</span>
                              <span className="break-all">
                                {prefix}
                                {newMiddle && (
                                  <span className="bg-emerald-500/30 text-emerald-400 rounded px-0.5 border border-emerald-500/20 font-bold">
                                    {newMiddle}
                                  </span>
                                )}
                                {suffix}
                                {!newValue && <span className="opacity-30">(Empty)</span>}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmailManager;
