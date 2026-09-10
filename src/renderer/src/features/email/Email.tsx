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
import { Plus, Mail, AlertCircle, Loader2, X } from 'lucide-react';
import AddEmailModal from './components/modals/AddEmailModal';

// ── Hooks ──
import { useHashParams } from '../../hooks/useHashParams';
import { useEmailTableState } from './hooks/useEmailTableState';
import { useEmailFilter } from './hooks/useEmailFilter';

// ── Services ──
import ViewsService from './services/api.service';

// ── Components ──
import EmailTable from './components/EmailTable';
import FilterPanel from './components/FilterPanel';
import { isValidTotp, parseBackupCodes } from './components/modals/EmailModal/Security/utils';
import HeaderBar from './components/HeaderBar';
import FooterBar from './components/FooterBar';

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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [selectedView, setSelectedView] = useState<SavedView | null>(null);
  const [serviceFilter, setServiceFilter] = useState<{
    serviceId: string | null;
    websiteUrl: string | null;
    twoFa: 'on' | 'off' | null;
    ip: string | null;
    running: boolean;
  }>({
    serviceId: null,
    websiteUrl: null,
    twoFa: null,
    ip: null,
    running: false,
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
    category: '',
    tags: [] as string[],
  });
  const [backupCodeSearch, setBackupCodeSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [focusedAccountId, setFocusedAccountId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'analytic' | 'security'>('home');

  // ── Derived ──
  const availableColumns = useMemo(() => {
    return ['Email', 'Last Activity', 'Last Proxy', 'Password', 'Recovery Email', 'Phone Number'];
  }, []);

  // ── Store ──
  const [runningBrowsers, setRunningBrowsers] = useState<Set<string>>(new Set());

  // Listen for browser open/close events from main process
  useEffect(() => {
    const onBrowserOpened = (_event: any, data: { accountId: string }) => {
      if (!data?.accountId) return;
      setRunningBrowsers((prev) => {
        const next = new Set(prev);
        next.add(data.accountId);
        return next;
      });
    };
    const onBrowserClosed = (_event: any, data: { accountId: string }) => {
      if (!data?.accountId) return;
      setRunningBrowsers((prev) => {
        const next = new Set(prev);
        next.delete(data.accountId);
        return next;
      });
    };

    // @ts-ignore
    window.electron.ipcRenderer.on('email:browser-opened', onBrowserOpened);
    // @ts-ignore
    window.electron.ipcRenderer.on('email:browser-closed', onBrowserClosed);

    const pollInitial = async () => {
      const running = new Set<string>();
      for (const acc of accounts) {
        if (!acc?.id) continue;
        try {
          // @ts-ignore
          const isOpen = await window.electron.ipcRenderer.invoke('email:is-profile-open', acc.id);
          if (isOpen) running.add(acc.id);
        } catch {
          // silently ignore
        }
      }
      setRunningBrowsers(running);
    };
    pollInitial();

    return () => {
      // @ts-ignore
      window.electron.ipcRenderer.removeListener('email:browser-opened', onBrowserOpened);
      // @ts-ignore
      window.electron.ipcRenderer.removeListener('email:browser-closed', onBrowserClosed);
    };
  }, [accounts]);

  // Health-check interval: poll running browsers every 5s, stop when none running
  const healthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningBrowsersRef = useRef(runningBrowsers);
  runningBrowsersRef.current = runningBrowsers;

  useEffect(() => {
    if (runningBrowsers.size > 0) {
      if (!healthCheckRef.current) {
        healthCheckRef.current = setInterval(async () => {
          const currentRunning = runningBrowsersRef.current;
          if (currentRunning.size === 0) return;

          for (const accountId of currentRunning) {
            try {
              // @ts-ignore
              const isOpen = await window.electron.ipcRenderer.invoke(
                'email:is-profile-open',
                accountId,
              );
              if (!isOpen) {
                setRunningBrowsers((prev) => {
                  const next = new Set(prev);
                  next.delete(accountId);
                  return next;
                });
              }
            } catch {
              // silently ignore IPC errors for individual checks
            }
          }
        }, 5000);
      }
    } else {
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
        healthCheckRef.current = null;
      }
    }

    return () => {
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
        healthCheckRef.current = null;
      }
    };
  }, [runningBrowsers.size]);

  const { sorting, columnVisibility } = useEmailTableState({
    viewId: null,
    defaultColumns: availableColumns,
  });

  const { filters } = useEmailFilter({
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

    // Apply 2FA filter
    if (serviceFilter.twoFa) {
      result = result.filter((account) => {
        const hasTotp = isValidTotp(account.totp);
        const hasBackup = parseBackupCodes(account.backup_codes).length > 0;
        const enabled = hasTotp || hasBackup;
        return serviceFilter.twoFa === 'on' ? enabled : !enabled;
      });
    }

    // Apply Country filter
    if (serviceFilter.ip) {
      result = result.filter((account) => account.lastFootprint?.country === serviceFilter.ip);
    }

    // Apply running browser filter
    if (serviceFilter.running) {
      result = result.filter((account) => runningBrowsers.has(account.id));
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

  // Debug: Track what's causing Email component to re-render
  const prevDepsRef = useRef<any>({});

  useEffect(() => {
    const prev = prevDepsRef.current;
    const changes: string[] = [];

    if (prev.accounts !== accounts) changes.push(`accounts (${accounts.length})`);
    if (prev.searchQuery !== searchQuery) changes.push(`searchQuery: "${searchQuery}"`);
    if (prev.serviceFilter !== serviceFilter) changes.push('serviceFilter');
    if (prev.selectedView !== selectedView) changes.push('selectedView');
    if (prev.filters !== filters) changes.push('filters');
    if (prev.sorting !== sorting) changes.push('sorting');
    if (prev.runningBrowsers !== runningBrowsers)
      changes.push(`runningBrowsers (size: ${runningBrowsers.size})`);
    if (prev.currentPage !== currentPage) changes.push(`currentPage: ${currentPage}`);

    prevDepsRef.current = {
      accounts,
      searchQuery,
      serviceFilter,
      selectedView,
      filters,
      sorting,
      runningBrowsers,
      currentPage,
    };
  });

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
          phone_number: row.phone_number,
          recovery_email: row.recovery_email,
          totp: row.totp,
          backup_codes: row.backup_codes,
          category: row.category,
          tags: row.tags ? JSON.parse(row.tags) : [],
          created_at: row.created_at,
          updated_at: row.updated_at,
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

              try {
                // @ts-ignore
                const fRes = await window.electron.ipcRenderer.invoke(
                  'email:get-fingerprint-history',
                  { email: acc.email },
                );
                if (fRes?.success && Array.isArray(fRes.entries) && fRes.entries.length > 0) {
                  const latest = fRes.entries.sort(
                    (a: any, b: any) =>
                      new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
                  )[0];
                  if (acc.lastActivity) {
                    acc.lastActivity.ip = latest.public_ip;
                  }
                  let cfg: any = {};
                  try {
                    cfg = JSON.parse(latest.fingerprint_config_json || '{}');
                  } catch {}
                  let ip: any = {};
                  try {
                    ip = JSON.parse(latest.ip_info_json || '{}');
                  } catch {}
                  const ua = cfg.userAgent || '';
                  const browser = ua.includes('Edg/')
                    ? 'Edge'
                    : ua.includes('Chrome/')
                      ? 'Chrome'
                      : ua.includes('Firefox/')
                        ? 'Firefox'
                        : ua.includes('Safari/')
                          ? 'Safari'
                          : ua.split(' ')[0] || '—';
                  acc.lastFootprint = {
                    country: ip.countryCode || ip.country, // Use ISO code (VN) instead of full name (Vietnam)
                    city: ip.city,
                    systemOS: cfg.platform,
                    browser,
                    isProxy: !!latest.is_proxy,
                  };
                }
              } catch (fErr) {
                console.error(`Failed to fetch footprint for ${acc.email}`, fErr);
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
        console.log('[DEBUG][Email] handleUpdateAccount called', {
          id: updated.id,
          email: updated.email,
          password: updated.password,
          recovery_email: updated.recovery_email,
          phone_number: updated.phone_number,
          totp: updated.totp,
          backup_codes: updated.backup_codes,
          backup_codes_type: typeof updated.backup_codes,
        });
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
        console.log('[DEBUG][Email] handleUpdateAccount success');
        setToast({ visible: true, message: 'Account updated successfully', type: 'success' });
        await loadData();
      } catch (e) {
        console.error('[DEBUG][Email] Update error:', e);
        console.error('[DEBUG][Email] Update error stringified:', JSON.stringify(e, null, 2));
        setToast({ visible: true, message: 'Failed to update account', type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [loadData],
  );

  const handleSelectAccount = useCallback((account: Account | null) => {
    setFocusedAccountId(account ? account.id : null);
  }, []);

  const handleOpenDeleteConfirm = useCallback((id: string) => {
    setHardDeleteConfirmId(id);
  }, []);

  const handleSaveChanges = useCallback((oldAcc: Account, newAcc: Account) => {
    setDiffPayload({ old: oldAcc, new: newAcc });
  }, []);

  const handleOpenAddDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

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
        `INSERT INTO emails (id, email, password, recovery_email, phone_number, totp, backup_codes, category, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          newEmailData.email,
          newEmailData.password,
          newEmailData.recoveryEmail || null,
          newEmailData.phoneNumber || null,
          newEmailData.totpSecretKey || null,
          newEmailData.backupCodes.length > 0 ? JSON.stringify(newEmailData.backupCodes) : null,
          newEmailData.category || null,
          newEmailData.tags.length > 0 ? JSON.stringify(newEmailData.tags) : null,
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
        category: '',
        tags: [],
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
    <div className="flex flex-col h-full w-full bg-background overflow-hidden selection:bg-primary/10 border-t border-r border-b border-border">
      <HeaderBar activeView={activeView} onViewChange={setActiveView} />
      {/* Main Content: Table */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <div className="flex-1 bg-card/30 border-b border-border/50 overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-row overflow-hidden">
            <FilterPanel
              accounts={accounts}
              onFiltersChange={setServiceFilter}
              onViewSelect={setSelectedView}
              selectedViewId={selectedView?.id || null}
              runningCount={runningBrowsers.size}
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
                onSelectAccount={handleSelectAccount}
                onHardDelete={handleOpenDeleteConfirm}
                onSaveChanges={handleSaveChanges}
                onUpdateAccount={handleUpdateAccount}
                onRefreshData={loadData}
                onAddEmail={handleOpenAddDrawer}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sorting={sorting}
                columnVisibility={columnVisibility}
                selectedServiceId={serviceFilter.serviceId}
                runningBrowsers={runningBrowsers}
              />
            )}
          </div>
        </div>
      </div>

      <AddEmailModal
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAccount(null);
        }}
        newEmailData={newEmailData}
        setNewEmailData={setNewEmailData}
        backupCodeSearch={backupCodeSearch}
        setBackupCodeSearch={setBackupCodeSearch}
        errors={errors}
        setErrors={setErrors}
        validateField={validateField}
        handleAddEmail={handleAddEmail}
        recoveryEmailSuggestions={(() => {
          const freq: Record<string, number> = {};
          accounts.forEach((a) => {
            if (a.recovery_email) freq[a.recovery_email] = (freq[a.recovery_email] || 0) + 1;
          });
          return accounts
            .map((a) => a.email)
            .filter((email): email is string => !!email)
            .sort((a, b) => (freq[b] || 0) - (freq[a] || 0));
        })()}
      />

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
      <FooterBar
        total={accounts.length}
        filtered={filteredAccounts.length}
        visible={paginatedData.length}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredAccounts.length / pageSize)}
        runningBrowsers={runningBrowsers.size}
        twoFaCount={
          filteredAccounts.filter((acc) => {
            const hasTotp = isValidTotp(acc.totp);
            const hasBackup = parseBackupCodes(acc.backup_codes).length > 0;
            return hasTotp || hasBackup;
          }).length
        }
        noTwoFaCount={
          filteredAccounts.filter((acc) => {
            const hasTotp = isValidTotp(acc.totp);
            const hasBackup = parseBackupCodes(acc.backup_codes).length > 0;
            return !hasTotp && !hasBackup;
          }).length
        }
        recoveryCount={filteredAccounts.filter((acc) => acc.recovery_email).length}
        serviceCount={filteredAccounts.reduce((sum, acc) => sum + (acc.services?.length || 0), 0)}
        proxyCount={filteredAccounts.filter((acc) => acc.lastProxy?.host).length}
        activeFilterCount={
          (serviceFilter.serviceId ? 1 : 0) +
          (serviceFilter.websiteUrl ? 1 : 0) +
          (serviceFilter.twoFa ? 1 : 0) +
          (serviceFilter.ip ? 1 : 0) +
          (serviceFilter.running ? 1 : 0) +
          filters.length +
          (selectedView?.filters.length || 0)
        }
        loading={loading}
        onRefresh={loadData}
      />
    </div>
  );
};

export default Email;
