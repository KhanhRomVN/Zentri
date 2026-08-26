import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
/**
 * ------------------------------------------------------------------
 * Email
 * ------------------------------------------------------------------
 * Main entry point for the Email feature. Renders the full email
 * management interface including the accounts table, filter panel,
 * add/edit drawer, and detail view with tabbed navigation.
 *
 * Main features:
 * - Account table with search, filter, sort, and pagination
 * - Add / edit email accounts via drawer
 * - Deep-link focus on specific accounts
 * - Linked services and proxy/activity metadata loading
 * - Hard-delete confirmation and diff-review modal
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── UI ──
import {
  Plus,
  Mail,
  AlertCircle,
  Loader2,
  Shield,
  Key,
  Hash,
  X,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';

// ── Hooks ──
import { useHashParams } from '../../hooks/useHashParams';
import { useEmailTableState } from './hooks/useEmailTableState';
import { useEmailFilter } from './hooks/useEmailFilter';

// ── Services ──
import ViewsService from './services/api.service';

// ── Components ──
import EmailTable from './components/EmailTable';
import FilterBar from './components/FilterBar';
import FilterPanel from './components/FilterPanel';

// ── Utils ──
import { cn } from '../../shared/lib/utils';

// ── Types ──
import { Account } from './types';
import type { SavedView } from '../filter/components/modal/FilterModal/types';

// ── External ──
import { v4 as uuidv4 } from 'uuid';

// ─── Functions ──────────────────────────────────────────────────────────
const getFieldValue = (account: any, field: string): string => {
  switch (field) {
    case 'Email':
      return account.email || '';
    case 'Password':
      return account.password || '';
    case 'Recovery Email':
      return account.recoveryEmail || '';
    case 'Phone Number':
      return account.phoneNumber || '';
    case 'Last Activity':
      return account.lastActivity?.title || account.lastActivity?.url || '';
    case 'Last Proxy':
      return account.lastProxy?.host || '';
    default:
      return '';
  }
};

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

// ─── Components ─────────────────────────────────────────────────────────
const ModalWrapper: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  size?: 'sm' | 'md';
  bodyClassName?: string;
}> = ({ open, onClose, title, children, footer, size = 'sm', bodyClassName }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative bg-card border border-border rounded-2xl shadow-2xl w-full mx-4 animate-in fade-in zoom-in-95 duration-200',
          size === 'sm' ? 'max-w-md' : 'max-w-lg',
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className={cn('px-6', bodyClassName)}>{children}</div>
        <div className="px-6 py-4 border-t border-border/50">{footer}</div>
      </div>
    </div>
  );
};

// ─── Component ──────────────────────────────────────────────────────────
const Email = () => {
  // ── State ──
  const [searchParams, setSearchParams] = useHashParams();
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [selectedView, setSelectedView] = useState<SavedView | null>(null);
  const [serviceFilter, setServiceFilter] = useState<{
    serviceId: string | null;
    websiteUrl: string | null;
  }>({
    serviceId: null,
    websiteUrl: null,
  });

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

  // ── Derived ──
  const availableColumns = useMemo(() => {
    return ['Email', 'Last Activity', 'Last Proxy', 'Password', 'Recovery Email', 'Phone Number'];
  }, []);

  // ── Store ──
  const { sorting, columnVisibility } = useEmailTableState({
    viewId: null,
    defaultColumns: availableColumns,
  });

  const { filters, addFilter, removeFilter, clearFilters, updateFilter } = useEmailFilter({
    viewId: null,
    availableColumns,
  });

  const filteredAccounts = useMemo(() => {
    let result = accounts.filter((account) => {
      const matchesSearch =
        account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.recovery_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.phone_number?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    // Apply service filter
    if (serviceFilter.serviceId) {
      result = result.filter((account) => {
        const linkedServices = account.services || [];
        return linkedServices.some((service) => service.serviceId === serviceFilter.serviceId);
      });
    }

    // Apply website filter
    if (serviceFilter.websiteUrl) {
      result = result.filter((account) => {
        return account.lastActivity && account.lastActivity.url === serviceFilter.websiteUrl;
      });
    }

    // Apply view filters first if a view is selected
    if (selectedView && selectedView.filters.length > 0) {
      result = ViewsService.applyViewFilters(result, selectedView.filters);
    }

    // Apply manual filters
    if (filters.length > 0) {
      result = result.filter((account) => {
        return filters.every((filter) => {
          const fieldValue = getFieldValue(account, filter.column);
          if (fieldValue === '—' || fieldValue === null || fieldValue === undefined) {
            return filter.operator === 'not_equal';
          }

          const strValue = String(fieldValue).toLowerCase();
          const searchValue = filter.value.toLowerCase();

          switch (filter.operator) {
            case 'equals':
              return strValue === searchValue;
            case 'not_equal':
              return strValue !== searchValue;
            case 'greater':
              return parseFloat(strValue) > parseFloat(searchValue);
            case 'less':
              return parseFloat(strValue) < parseFloat(searchValue);
            case 'contains':
              return strValue.includes(searchValue);
            case 'starts_with':
              return strValue.startsWith(searchValue);
            case 'ends_with':
              return strValue.endsWith(searchValue);
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    if (sorting.length > 0) {
      result = [...result].sort((a, b) => {
        for (const sort of sorting) {
          const aVal = getFieldValue(a, sort.id);
          const bVal = getFieldValue(b, sort.id);
          if (aVal < bVal) return sort.desc ? 1 : -1;
          if (aVal > bVal) return sort.desc ? -1 : 1;
        }
        return 0;
      });
    }

    return result;
  }, [accounts, searchQuery, serviceFilter, selectedView, filters, sorting]);

  const paginatedData = useMemo(
    () => filteredAccounts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredAccounts, currentPage, pageSize],
  );

  // ── Effects ──
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredAccounts.length]);

  // Deep Link: Listen for focus or focus_email param
  useEffect(() => {
    const focusId = searchParams.get('focus');
    const focusEmail = searchParams.get('focus_email');

    if (focusId) {
      setFocusedAccountId(focusId);
      setSearchQuery('');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('focus');
      setSearchParams(newParams, true);
    } else if (focusEmail && accounts.length > 0) {
      const matched = accounts.find((a) => a.email.toLowerCase() === focusEmail.toLowerCase());
      if (matched) {
        setFocusedAccountId(matched.id);
        setSearchQuery('');
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('focus_email');
        setSearchParams(newParams, true);
      } else {
        console.warn('[Email] Could not find account with email:', focusEmail);
      }
    }
  }, [searchParams, setSearchParams, accounts]);

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning',
  });

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const [activeTab, setActiveTab] = useState<
    'info' | 'services' | 'sessions' | 'history' | 'bookmarks' | 'fingerprint' | 'security'
  >('info');
  const [hardDeleteConfirmId, setHardDeleteConfirmId] = useState<string | null>(null);
  const [diffPayload, setDiffPayload] = useState<{
    old: Account;
    new: Account;
  } | null>(null);

  const accountsRef = useRef(accounts);

  useLayoutEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  // ── Callbacks ──
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both accounts and their linked services
      // @ts-ignore
      const [rows, serviceLinks] = await Promise.all([
        window.electron.ipcRenderer.invoke(
          'sqlite:all',
          'SELECT * FROM emails ORDER BY created_at DESC',
        ),
        window.electron.ipcRenderer.invoke(
          'sqlite:all',
          `SELECT se.*, s.name as serviceName, s.url as serviceUrl, s.metadata as serviceMetadataDef,
                  0 as secretCount
           FROM service_emails se 
           JOIN services s ON se.service_id = s.id`,
        ),
      ]);

      const loadedAccounts: Account[] = rows.map((row: any) => {
        // Find services linked to this email
        const linkedServices = serviceLinks
          .filter((link: any) => link.email_id === row.id)
          .map((link: any) => {
            const parsedTwoFa = link.two_fa
              ? typeof link.two_fa === 'string'
                ? JSON.parse(link.two_fa)
                : link.two_fa
              : {};
            return {
              id: link.id,
              serviceId: link.service_id,
              name: link.serviceName,
              url: link.serviceUrl,
              username: link.username,
              password: link.password,
              notes: link.notes,
              status: link.status,
              lastUsedAt: link.last_used_at,
              secretCount: link.secretCount || 0,
              metadata: link.metadata ? JSON.parse(link.metadata) : {},
              twoFa: parsedTwoFa,
            };
          });

        return {
          id: row.id,
          email: row.email,
          password: row.password || '',
          status: row.status,
          phoneNumber: row.phone_number,
          recoveryEmail: row.recovery_email,
          totpSecretKey: row.totp,
          backupCodes: row.backup_codes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          services: linkedServices,
        };
      });

      // Fetch Latest Activity and Last Proxy for all accounts
      try {
        await Promise.all(
          loadedAccounts.map(async (acc) => {
            try {
              const [hResult, pResult] = await Promise.all([
                window.electron.ipcRenderer.invoke('email:get-latest-activity', {
                  email: acc.email,
                }),
                window.electron.ipcRenderer.invoke(
                  'sqlite:get',
                  `SELECT p.host, p.port, p.protocol, p.proxy_type, p.source_type, p.country, p.city 
                   FROM proxy_history ph
                   JOIN proxies p ON ph.proxy_id = p.id
                   WHERE ph.email_id = ?
                   ORDER BY ph.used_at DESC LIMIT 1`,
                  [acc.id],
                ),
              ]);

              if (hResult?.success && hResult.latest) {
                const latest = hResult.latest;
                acc.lastActivity = {
                  url: latest.url,
                  title: latest.title,
                  time: latest.time,
                };
              }

              if (pResult) {
                acc.lastProxy = {
                  host: pResult.host,
                  port: pResult.port,
                  protocol: pResult.protocol,
                  proxyType: pResult.proxy_type,
                  sourceType: pResult.source_type,
                  country: pResult.country,
                  city: pResult.city,
                };
              }
            } catch (e) {
              console.error(`Failed to fetch history/proxy for ${acc.email}`, e);
            }
          }),
        );
      } catch (e) {
        console.error('Failed to fetch account activities/proxies', e);
      }

      setAccounts(loadedAccounts);
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
          'UPDATE emails SET email = ?, password = ?, recovery_email = ?, phone_number = ?, totp = ?, backup_codes = ? WHERE id = ?',
          [
            updated.email,
            updated.password,
            updated.recovery_email,
            updated.phone_number,
            updated.totp,
            updated.backup_codes,
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
        `INSERT INTO emails (id, email, password, recovery_email, phone_number, totp, backup_codes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          newEmailData.email,
          newEmailData.password,
          newEmailData.recoveryEmail || null,
          newEmailData.phoneNumber || null,
          newEmailData.totpSecretKey || null,
          newEmailData.backupCodes.length > 0 ? JSON.stringify(newEmailData.backupCodes) : null,
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

  const toastTypeStyles: Record<string, string> = {
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  };

  // ── Render ──
  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden selection:bg-primary/10">
      {/* Filter Bar */}
      {showFilterBar && (
        <FilterBar
          filters={filters}
          availableColumns={availableColumns}
          onAddFilter={addFilter}
          onRemoveFilter={removeFilter}
          onClearFilters={clearFilters}
          onUpdateFilter={updateFilter}
        />
      )}

      {/* Main Content: Table */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden p-3">
        {/* Page title */}
        <div className="flex items-end justify-between mb-4 shrink-0">
          <div>
            <h1 className="font-display text-[22px] font-semibold text-text-primary tracking-tight">
              Email Registry
            </h1>
            <p className="text-[12.5px] text-text-secondary/60 mt-1">
              Manage your email accounts — monitor status, linked services, and account health in
              real time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
              <Upload className="size-3.5" />
              Import
            </Button>
            <Button variant="solid" onClick={() => setIsDrawerOpen(true)}>
              <Plus className="size-3.5" />
              Add Email
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-card/30 border-b border-border/50 overflow-hidden flex flex-col gap-4">
          <div className="flex-1 flex flex-row overflow-hidden gap-4 pt-1">
            <FilterPanel
              accounts={accounts}
              onFiltersChange={setServiceFilter}
              onViewSelect={setSelectedView}
              selectedViewId={selectedView?.id || null}
            />
            {loading && accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground opacity-50 flex-1">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
                  Indexing accounts...
                </span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center bg-destructive/5 flex-1">
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
              <div className="flex flex-col items-center justify-center h-full gap-8 p-8 text-center flex-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <div className="relative w-28 h-28 rounded-3xl bg-muted/50 border border-border/50 flex items-center justify-center transform rotate-12">
                    <Mail className="w-12 h-12 text-muted-foreground/30 -rotate-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold tracking-tight">No email accounts yet</p>
                  <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed mx-auto">
                    Add your first email account to get started with profile management and service
                    linking.
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
                accounts={paginatedData}
                allAccounts={filteredAccounts}
                focusedAccountId={focusedAccountId}
                onSelectAccount={(account) => {
                  setFocusedAccountId((prev) => (prev === account.id ? null : account.id));
                }}
                onHardDelete={(id) => setHardDeleteConfirmId(id)}
                onSaveChanges={(oldAcc, newAcc) => setDiffPayload({ old: oldAcc, new: newAcc })}
                onRefreshData={loadData}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sorting={sorting}
                columnVisibility={columnVisibility}
                selectedServiceId={serviceFilter.serviceId}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add Email Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAccount(null);
        }}
        position="right"
        width="500px"
      >
        <DrawerHeader
          title={selectedAccount ? 'Account Details' : 'Add Account'}
          description={
            selectedAccount
              ? 'View and manage account information'
              : 'Add a new email account to your repository'
          }
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedAccount(null);
          }}
        />

        <DrawerBody className="space-y-6">
          {/* Account Credentials */}
          <div className="space-y-4">
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Email
                <span className="text-destructive ml-1">*</span>
              </label>
              <input
                type="text"
                placeholder="identity@example.com"
                value={newEmailData.email}
                onChange={(e) => {
                  setNewEmailData((d) => ({ ...d, email: e.target.value }));
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                onBlur={() => validateField('email', newEmailData.email)}
                className={cn(
                  'w-full h-10 px-3 rounded-xl bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50',
                  errors.email ? 'border-destructive' : 'border-border',
                )}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Password
                <span className="text-destructive ml-1">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={newEmailData.password}
                onChange={(e) => {
                  setNewEmailData((d) => ({ ...d, password: e.target.value }));
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                onBlur={() => validateField('password', newEmailData.password)}
                className={cn(
                  'w-full h-10 px-3 rounded-xl bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50',
                  errors.password ? 'border-destructive' : 'border-border',
                )}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Recovery Email
              </label>
              <input
                type="text"
                placeholder="backup@proton.me"
                value={newEmailData.recoveryEmail}
                onChange={(e) => {
                  setNewEmailData((d) => ({ ...d, recoveryEmail: e.target.value }));
                  if (errors.recoveryEmail) setErrors((prev) => ({ ...prev, recoveryEmail: '' }));
                }}
                onBlur={() => validateField('recoveryEmail', newEmailData.recoveryEmail)}
                className={cn(
                  'w-full h-10 px-3 rounded-xl bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50',
                  errors.recoveryEmail ? 'border-destructive' : 'border-border',
                )}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+84 ••• ••• •••"
                value={newEmailData.phoneNumber}
                onChange={(e) => {
                  setNewEmailData((d) => ({ ...d, phoneNumber: e.target.value }));
                  if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                }}
                onBlur={() => validateField('phoneNumber', newEmailData.phoneNumber)}
                className={cn(
                  'w-full h-10 px-3 rounded-xl bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50',
                  errors.phoneNumber ? 'border-destructive' : 'border-border',
                )}
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
                TOTP Secret Key
              </label>
              <div className="relative flex items-center">
                <Key className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Paste TOTP secret key..."
                  value={newEmailData.totpSecretKey}
                  onChange={(e) =>
                    setNewEmailData((d) => ({ ...d, totpSecretKey: e.target.value }))
                  }
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Backup Codes
              </label>
              <div className="bg-input-background border border-border rounded-xl">
                {newEmailData.backupCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 pb-0">
                    {newEmailData.backupCodes.map((code, idx) => {
                      const colors = [
                        'bg-blue-500/20 text-blue-400 border-blue-500/30',
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                        'bg-amber-500/20 text-amber-400 border-amber-500/30',
                        'bg-pink-500/20 text-pink-400 border-pink-500/30',
                        'bg-purple-500/20 text-purple-400 border-purple-500/30',
                        'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                      ];
                      const colorClass = colors[idx % colors.length];
                      return (
                        <span
                          key={code}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border',
                            colorClass,
                          )}
                        >
                          {code}
                          <button
                            type="button"
                            onClick={() =>
                              setNewEmailData((d) => ({
                                ...d,
                                backupCodes: d.backupCodes.filter((c) => c !== code),
                              }))
                            }
                            className="hover:opacity-70 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="relative flex items-center">
                  <Hash className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    placeholder="Type code and press Enter..."
                    value={backupCodeSearch}
                    onChange={(e) => setBackupCodeSearch(e.target.value)}
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
                    className="w-full h-10 pl-10 pr-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" className="flex-1" onClick={() => setIsDrawerOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="solid"
            className="flex-1"
            disabled={!newEmailData.email || !newEmailData.password}
            onClick={handleAddEmail}
          >
            Save Account
          </Button>
        </DrawerFooter>
      </Drawer>

      {/* Toast - Native */}
      {toast.visible && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300',
            toastTypeStyles[toast.type],
          )}
        >
          <div className="flex items-center gap-2">
            <span>{toast.message}</span>
            <button
              onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hard Delete Modal */}
      <ModalWrapper
        open={!!hardDeleteConfirmId}
        onClose={() => setHardDeleteConfirmId(null)}
        title="Permanently Delete"
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
      </ModalWrapper>

      {/* Diff Review Modal */}
      <ModalWrapper
        open={!!diffPayload}
        onClose={() => setDiffPayload(null)}
        title="Review Changes"
        size="md"
        bodyClassName="h-[35vh] max-h-[35vh] overflow-y-auto custom-scrollbar"
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
      </ModalWrapper>
    </div>
  );
};

export default Email;
