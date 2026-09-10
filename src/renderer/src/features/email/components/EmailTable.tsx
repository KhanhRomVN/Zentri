import { FC, useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
/**
 * ------------------------------------------------------------------
 * EmailTable
 * ------------------------------------------------------------------
 * Main accounts table for the Email feature. Renders the full
 * account list with search, sorting, context menus, and expandable
 * detail view. Handles browser launch, service linking, and
 * hard-delete flows.
 *
 * Main features:
 * - Sortable account table with running-browser indicators
 * - Context menu: open browser, open folder, delete
 * - Expandable detail view with tabbed navigation
 * - Service linking drawer and quick-create modal
 * - Health-check polling for running browser sessions
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── UI ──
// (framer-motion removed — row/detail animation no longer needed)
import {
  Trash2,
  Globe,
  Eye,
  Undo2,
  X,
  FolderOpen,
  RefreshCw,
  Search,
  Plus,
  MoreVertical,
  Download,
  Upload,
} from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../components/ui/Dropdown';
import { Button } from '../../../components/ui/Button';

// ── Services ──
import { SERVICES } from '../../../constants/services';

// ── Components ──
import BrowserLaunchModal from './modals/BrowserLaunchModal';
import EmailModal from './modals/EmailModal/EmailModal';
// ── Utils ──
import { cn } from '../../../shared/lib/utils';
import { getSecurityScore, isValidTotp } from './modals/EmailModal/Security/utils';
import { getCountryFlagComponent } from '../../../utils/countryFlags';

// ── Types ──
import { Account, Service } from '../types';
import { SortingState } from '@tanstack/react-table';

// ── External ──
import { createPortal } from 'react-dom';
import { formatDistanceToNow } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface EmailTableProps {
  accounts: Account[];
  allAccounts?: Account[];
  focusedAccountId?: string | null;
  onSelectAccount: (account: Account | null) => void;
  onHardDelete: (id: string) => void;
  onSaveChanges: (oldAccount: Account, newAccount: Account) => void;
  onUpdateAccount: (updated: Account) => void;
  onRefreshData?: () => void;
  onAddEmail?: () => void;
  activeTab:
    | 'info'
    | 'services'
    | 'sessions'
    | 'history'
    | 'bookmarks'
    | 'fingerprint'
    | 'security';
  setActiveTab: (
    tab: 'info' | 'services' | 'sessions' | 'history' | 'bookmarks' | 'fingerprint' | 'security',
  ) => void;
  sorting?: SortingState;
  columnVisibility?: Record<string, boolean>;
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  startRecord?: number;
  endRecord?: number;
  onPageChange?: (page: number) => void;
  selectedServiceId?: string | null;
  runningBrowsers: Set<string>;
}

interface LinkedService {
  id: string;
  serviceId: string;
  name: string;
  url: string;
  username?: string;
  password?: string;
  status: string;
  notes?: string;
  secretCount?: number;
  metadata?: any;
}

// ─── Component ──────────────────────────────────────────────────────────
const EmailTable: FC<EmailTableProps> = ({
  accounts,
  allAccounts = accounts,
  focusedAccountId,
  onSelectAccount,
  onHardDelete,
  onUpdateAccount,
  onRefreshData,
  onAddEmail,
  activeTab,
  setActiveTab,
  currentPage,
  totalPages,
  totalRecords,
  startRecord,
  endRecord,
  onPageChange,
  selectedServiceId,
  runningBrowsers,
}) => {
  // ── State ──
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    accountId: string;
  } | null>(null);
  const [editedAccount, setEditedAccount] = useState<Account | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backupCodeSearch, setBackupCodeSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [hoveredEmail, setHoveredEmail] = useState<string | null>(null);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const browserVersion = '...';
  const [pendingLaunch, setPendingLaunch] = useState<{
    accountId: string;
    email: string;
    provider?: string;
    url?: string;
    title?: string;
  } | null>(null);

  // runningBrowsers is provided via props

  const [serviceContextMenu, setServiceContextMenu] = useState<{
    x: number;
    y: number;
    linkId: string;
    status: string;
  } | null>(null);
  const [serviceDeleteConfirmId, setServiceDeleteConfirmId] = useState<string | null>(null);
  const [serviceHardDeleteConfirmId, setServiceHardDeleteConfirmId] = useState<string | null>(null);

  // Service Linking States
  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [, setLinkServiceSearchQuery] = useState('');
  const [newServiceData, setNewServiceData] = useState<{
    linkId?: string;
    serviceId: string;
    serviceName: string;
    serviceUrl?: string;
    username?: string;
    password?: string;
    notes: string;
    metadata: Record<string, any>;
    twoFa?: { totp?: string; backupCodes?: string[]; backupInput?: string };
  }>({
    serviceId: '',
    serviceName: '',
    serviceUrl: '',
    username: '',
    password: '',
    notes: '',
    metadata: {},
    twoFa: {},
  });

  const [globalServices, setGlobalServices] = useState<Service[]>([]);
  const [isEditServiceMode, setIsEditServiceMode] = useState(false);

  const showDetail = !!focusedAccountId;

  const menuRef = useRef<HTMLDivElement>(null);
  const serviceMenuRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // ── Derived ──
  const focusedAccount = accounts.find((a) => a.id === focusedAccountId) || null;
  const accountServices = focusedAccount?.services || [];

  // ── Effects ──
  const prevPropsRef = useRef<any>({});

  useEffect(() => {
    const prev = prevPropsRef.current;
    const changes: string[] = [];

    if (prev.accounts !== accounts) changes.push('accounts');
    if (prev.focusedAccountId !== focusedAccountId) changes.push('focusedAccountId');
    if (prev.selectedServiceId !== selectedServiceId) changes.push('selectedServiceId');
    if (prev.runningBrowsers !== runningBrowsers) changes.push('runningBrowsers');
    if (prev.onSelectAccount !== onSelectAccount) changes.push('onSelectAccount');
    if (prev.onHardDelete !== onHardDelete) changes.push('onHardDelete');
    if (prev.onRefreshData !== onRefreshData) changes.push('onRefreshData');
    if (prev.onAddEmail !== onAddEmail) changes.push('onAddEmail');
    if (prev.setActiveTab !== setActiveTab) changes.push('setActiveTab');
    if (prev.onPageChange !== onPageChange) changes.push('onPageChange');

    prevPropsRef.current = {
      accounts,
      focusedAccountId,
      selectedServiceId,
      runningBrowsers,
      onSelectAccount,
      onHardDelete,
      onRefreshData,
      onAddEmail,
      setActiveTab,
      onPageChange,
    };
  });

  useEffect(() => {
    const fetchAvatars = async () => {
      let changed = false;
      const updates: Record<string, string> = {};

      for (const acc of accounts) {
        // Check if avatar already exists before fetching
        setAvatars((prevAvatars) => {
          if (prevAvatars[acc.email]) {
            return prevAvatars;
          }

          // Mark for async fetch
          (async () => {
            try {
              // @ts-ignore
              const avatarUrl = await window.electron.ipcRenderer.invoke('email:get-avatar', {
                email: acc.email,
              });
              if (avatarUrl) {
                setAvatars((prev) => ({ ...prev, [acc.email]: avatarUrl }));
              } else {
                // Fallback to Dicebear if no Chrome profile avatar found
                const seed = acc.email.split('@')[0];
                setAvatars((prev) => ({
                  ...prev,
                  [acc.email]: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
                }));
              }
            } catch (e) {
              console.error('Avatar fetch failed', e);
            }
          })();

          return prevAvatars;
        });
      }
    };
    fetchAvatars();
  }, [accounts]);

  useEffect(() => {
    setEditedAccount(focusedAccount);
  }, [focusedAccount]);

  // Browser running state is managed by parent (Email.tsx)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setContextMenu(null);
      }
      if (serviceMenuRef.current && !serviceMenuRef.current.contains(target)) {
        setServiceContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadGlobalServices = useCallback(async () => {
    try {
      // @ts-ignore
      const dbServices = await window.electron.ipcRenderer.invoke('service:get-all');
      const dbList = dbServices || [];

      // Merge: constants SERVICES as base, DB data for enrichment
      const dbMap: Record<string, any> = {};
      dbList.forEach((svc: any) => {
        dbMap[svc.id] = svc;
      });

      const mergedIds = new Set<string>();

      // Build from constants
      const merged: Service[] = SERVICES.map((svc) => {
        mergedIds.add(svc.id);
        const dbSvc = dbMap[svc.id];
        return {
          id: svc.id,
          name: dbSvc?.name || svc.name,
          url: dbSvc?.url || svc.url,
          category: dbSvc?.category || svc.category,
          tags: dbSvc?.tags || svc.tags,
          description: dbSvc?.description || svc.description,
          metadata: dbSvc?.metadata || null,
          created_at: dbSvc?.created_at || new Date().toISOString(),
          updated_at: dbSvc?.updated_at || new Date().toISOString(),
        } as Service;
      });

      // Add DB-only services
      dbList.forEach((svc: any) => {
        if (!mergedIds.has(svc.id)) {
          merged.push(svc as Service);
        }
      });

      setGlobalServices(merged);
    } catch (err) {
      console.error('Failed to load global services', err);
      // Fallback: use constants
      setGlobalServices(SERVICES as any[]);
    }
  }, []);

  useEffect(() => {
    loadGlobalServices();
  }, [isServiceDrawerOpen, accountServices, loadGlobalServices]);

  useEffect(() => {
    const handleServicesChanged = () => {
      loadGlobalServices();
    };
    window.addEventListener('services-changed', handleServicesChanged);
    return () => window.removeEventListener('services-changed', handleServicesChanged);
  }, [loadGlobalServices]);

  // ── Handlers ──
  const handleContextMenu = (e: React.MouseEvent, accountId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, accountId });
  };

  const handleUnlinkService = async (linkId: string) => {
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        "UPDATE service_emails SET status = 'trash', scheduled_deletion_at = datetime('now', '+30 days') WHERE id = ?",
        [linkId],
      );
      setServiceDeleteConfirmId(null);
      onRefreshData?.();
    } catch (error) {
      console.error('Failed to soft delete service link:', error);
    }
  };

  const handlePermanentDeleteService = async (linkId: string) => {
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        'DELETE FROM service_emails WHERE id = ?',
        [linkId],
      );
      setServiceHardDeleteConfirmId(null);
      onRefreshData?.();
    } catch (error) {
      console.error('Failed to permanent delete service link:', error);
    }
  };

  const handleRestoreService = async (linkId: string) => {
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        "UPDATE service_emails SET status = 'active', scheduled_deletion_at = NULL WHERE id = ?",
        [linkId],
      );
      setServiceContextMenu(null);
      onRefreshData?.();
    } catch (error) {
      console.error('Failed to restore service link:', error);
    }
  };

  const handleOpenService = async (linkId: string) => {
    const link = accountServices.find((s) => s.id === linkId);
    if (!link || !focusedAccount) return;
    setPendingLaunch({
      accountId: focusedAccount.id,
      email: focusedAccount.email,
      url: link.url,
      title: link.name,
      provider: 'fingerprint-chromium',
    });
    setIsLaunchModalOpen(true);
  };

  const handleExecuteLaunch = async (
    config: {
      fingerprintId?: string;
      proxyId?: string;
      launchMode?: 'normal' | 'secure';
    },
    overrideLaunch?: {
      accountId: string;
      email: string;
      provider?: string;
      url?: string;
      title?: string;
    },
  ) => {
    const launchData = overrideLaunch || pendingLaunch;
    if (!launchData) return;
    const { accountId, email, provider, url } = launchData;
    setIsLaunchModalOpen(false);

    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('email:open-login', {
        accountId,
        email,
        provider: provider,
        url,
        fingerprintId: config.fingerprintId,
        fingerprintConfig: (config as any).fingerprintConfig,
        proxyId: config.proxyId,
        launchMode: config.launchMode || 'secure',
      });

      // Log proxy usage if a proxy was selected
      if (config.proxyId) {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('proxy:log-usage', {
          proxyId: config.proxyId,
          emailId: accountId,
          targetSite: url ? new URL(url).hostname : undefined,
        });
      }
    } catch (error) {
      console.error('Failed to launch browser:', error);
    }
    setPendingLaunch(null);
  };

  const handleOpenNewServiceDrawer = () => {
    setNewServiceData({
      serviceId: '',
      serviceName: '',
      username: '',
      password: '',
      notes: '',
      metadata: {},
      twoFa: {},
    });
    setLinkServiceSearchQuery('');
    setIsEditServiceMode(false);
    setIsAddingService(true);
  };

  const handleEditServiceLink = (linkId: string) => {
    const link = (focusedAccount?.services as unknown as LinkedService[])?.find(
      (s) => s.id === linkId,
    );
    if (!link) return;

    setLinkServiceSearchQuery(link.name);
    setNewServiceData({
      linkId: link.id,
      serviceId: link.serviceId,
      serviceName: link.name,
      username: link.username || '',
      password: link.password || '',
      notes: link.notes || '',
      metadata: link.metadata
        ? typeof link.metadata === 'string'
          ? JSON.parse(link.metadata)
          : link.metadata
        : {},
      twoFa: (link as any).twoFa || {},
    });
    setIsEditServiceMode(true);
    setIsServiceDrawerOpen(true);
    setServiceContextMenu(null);
  };

  const validateField = useCallback((name: string, value: string) => {
    let error = '';
    if (name === 'email') {
      if (!value.trim()) error = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
    } else if (name === 'password') {
      if (!value.trim()) error = 'Password is required';
    } else if (name === 'recoveryEmail') {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid recovery email';
    } else if (name === 'phoneNumber') {
      if (value && !/^\+?[0-9\s\-()]+$/.test(value)) error = 'Invalid phone number';
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const handleAddServiceLink = async () => {
    if (!focusedAccount || !newServiceData.serviceId) return;
    try {
      if (isEditServiceMode && newServiceData.linkId) {
        const payload = {
          linkId: newServiceData.linkId,
          metadata: newServiceData.metadata || {},
          twoFa: newServiceData.twoFa
            ? { totp: newServiceData.twoFa.totp, backupCodes: newServiceData.twoFa.backupCodes }
            : {},
        };
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('service_emails:update', payload);
      } else {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('service_emails:insert', {
          emailId: focusedAccount.id,
          serviceId: newServiceData.serviceId,
          metadata: newServiceData.metadata || {},
          twoFa: newServiceData.twoFa
            ? { totp: newServiceData.twoFa.totp, backupCodes: newServiceData.twoFa.backupCodes }
            : {},
        });
      }

      setIsServiceDrawerOpen(false);
      setIsEditServiceMode(false);
      setNewServiceData({
        serviceId: '',
        serviceName: '',
        username: '',
        password: '',
        notes: '',
        metadata: {},
        twoFa: {},
      });
      setLinkServiceSearchQuery('');

      // Trigger refresh to show the new link
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err) {
      console.error('Failed to link/update service', err);
    }
  };

  const handleQuickAddService = async (service: any) => {
    if (!focusedAccount) return null;
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('service_emails:insert', {
        emailId: focusedAccount.id,
        serviceId: service.serviceId || service.id,
        metadata: {},
        twoFa: {},
      });
      if (onRefreshData) onRefreshData();
      return result?.id ?? result?.linkId ?? null;
    } catch (err) {
      console.error('Failed to quick add service', err);
      return null;
    }
  };

  // ── Helpers ──
  // Cache flag components by country code to prevent re-renders
  const flagCache = useRef<Map<string, JSX.Element | null>>(new Map());

  const renderCountryFlag = useCallback((countryCode: string) => {
    // Return cached flag if exists
    if (flagCache.current.has(countryCode)) {
      return flagCache.current.get(countryCode);
    }

    // Create and cache new flag
    const FlagComponent = getCountryFlagComponent(countryCode);
    const flag = FlagComponent ? <FlagComponent className="w-4 h-3 rounded-sm" /> : null;
    flagCache.current.set(countryCode, flag);
    return flag;
  }, []);

  const renderLastActivity = useCallback(
    (account: Account) => {
      if (!account.lastActivity) {
        return <span className="text-[10px] italic opacity-20 ml-6">—</span>;
      }

      const { url, title, time } = account.lastActivity;

      // If a service is selected, only show activity if it matches the service URL
      if (selectedServiceId) {
        const selectedService = globalServices.find((s) => s.id === selectedServiceId);
        if (selectedService && selectedService.url) {
          try {
            const activityHostname = new URL(url).hostname;
            const serviceHostname = new URL(selectedService.url).hostname;

            // If activity hostname doesn't match service hostname, hide it
            if (
              !activityHostname.includes(serviceHostname.replace('www.', '')) &&
              !serviceHostname.includes(activityHostname.replace('www.', ''))
            ) {
              return <span className="text-[10px] italic opacity-20 ml-6">—</span>;
            }
          } catch {
            // If URL parsing fails, hide it
            return <span className="text-[10px] italic opacity-20 ml-6">—</span>;
          }
        }
      }

      let hostname = '';
      try {
        hostname = new URL(url).hostname;
      } catch {
        hostname = url;
      }

      return (
        <div className="flex flex-col min-w-0 group/act max-w-full">
          <div className="flex items-center gap-2">
            <img
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
              className="w-4 h-4 opacity-70 group-hover/act:opacity-100 transition-opacity shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://www.google.com/s2/favicons?domain=google.com&sz=32';
              }}
            />
            <span className="text-[13px] font-bold text-foreground/80 truncate group-hover/act:text-foreground transition-colors leading-tight">
              {title || hostname}
            </span>
          </div>
          <span className="text-[11px] text-text-secondary font-mono tracking-tight mt-0.5 group-hover/act:text-text-secondary/80">
            {formatDistanceToNow(new Date(time), { addSuffix: true })}
          </span>
        </div>
      );
    },
    [selectedServiceId, globalServices],
  );

  // When section is expanded, hide all other rows
  // Sort: running browsers first, then preserve original order
  const orderedAccounts = useMemo(() => {
    const base = accounts;

    // Push running browsers to top
    const running = base.filter((a) => runningBrowsers.has(a.id));
    const notRunning = base.filter((a) => !runningBrowsers.has(a.id));
    const sorted = [...running, ...notRunning];

    // Filter by search query
    if (!tableSearchQuery.trim()) return sorted;
    const q = tableSearchQuery.toLowerCase();
    return sorted.filter((a) => {
      if (a.email.toLowerCase().includes(q)) return true;
      if (a.password?.toLowerCase().includes(q)) return true;
      if (a.lastProxy?.host?.toLowerCase().includes(q)) return true;
      if (a.lastActivity?.url?.toLowerCase().includes(q)) return true;
      if (a.lastActivity?.title?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [accounts, runningBrowsers, tableSearchQuery]);

  // Use allAccounts for indexing (original order before pagination)
  const fullAccountList = allAccounts;

  // Memoized icon components to prevent unnecessary re-renders
  const SearchIcon = useMemo(() => {
    return <Search className="size-3.5 text-text-secondary/60 shrink-0" />;
  }, []);

  const PlusIcon = useMemo(() => {
    return <Plus className="size-4" />;
  }, []);

  const RefreshIcon = useMemo(() => {
    return <RefreshCw className="size-3.5" />;
  }, []);

  const MoreIcon = useMemo(() => {
    return <MoreVertical className="size-3.5" />;
  }, []);

  const handleExport = () => {
    const data = (allAccounts || accounts).map((a) => ({
      email: a.email,
      password: a.password,
      recovery_email: a.recovery_email,
      phone_number: a.phone_number,
      totp: a.totp,
      backup_codes: a.backup_codes,
      category: a.category,
      tags: a.tags,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zentri-emails.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid file format');
      // @ts-ignore
      const existingRows = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        'SELECT email FROM emails',
      );
      const existingEmails = new Set(
        (existingRows || []).map((row: any) => row.email.toLowerCase()),
      );
      let importedCount = 0;
      for (const item of data) {
        if (!item.email) continue;
        if (existingEmails.has(item.email.toLowerCase())) continue;
        // @ts-ignore
        await window.electron.ipcRenderer.invoke(
          'sqlite:run',
          `INSERT INTO emails (id, email, password, recovery_email, phone_number, totp, backup_codes, category, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            item.email,
            item.password || null,
            item.recovery_email || null,
            item.phone_number || null,
            item.totp || null,
            item.backup_codes || null,
            item.category || null,
            Array.isArray(item.tags) ? JSON.stringify(item.tags) : item.tags || null,
          ],
        );
        importedCount += 1;
        existingEmails.add(item.email.toLowerCase());
      }
      alert(`Imported ${importedCount} account(s).`);
      onRefreshData?.();
    } catch (err) {
      console.error('[EmailTable] Import failed:', err);
      alert('Failed to import file. Please check JSON format.');
    } finally {
      if (importFileRef.current) {
        importFileRef.current.value = '';
      }
    }
  };

  // ── Render ──
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-l border-border">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5 px-2 py-1.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2 bg-input-background border border-border rounded-lg px-2.5 py-1.5 flex-1 max-w-[420px]">
          {SearchIcon}
          <input
            value={tableSearchQuery}
            onChange={(e) => setTableSearchQuery(e.target.value)}
            placeholder="Search email, password, proxy, activity…"
            className="bg-transparent border-none outline-none text-text-primary text-[12.5px] leading-[20px] w-full font-sans placeholder:text-text-secondary/40"
          />
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            variant="ghost"
            size="md"
            onClick={onAddEmail}
            className="h-8 px-3 text-[12.5px] bg-primary/10 text-primary hover:bg-button-solid-background hover:text-button-solid-text"
          >
            {PlusIcon}
            Add Email
          </Button>
          <button
            onClick={onRefreshData}
            className="size-8 rounded-md border border-border bg-card-background text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
            title="Refresh"
          >
            {RefreshIcon}
          </button>
          <Dropdown align="end">
            <DropdownTrigger asChild>
              <button
                className="size-8 rounded-md border border-border bg-card-background text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
                title="More"
              >
                {MoreIcon}
              </button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem
                icon={<Upload className="size-4" />}
                onClick={() => importFileRef.current?.click()}
              >
                Import
              </DropdownItem>
              <DropdownItem
                icon={<Download className="size-4" />}
                onClick={handleExport}
              >
                Export
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>
      <input
        ref={importFileRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
        className="hidden"
      />
      {/* Inline Table (merged from ListView) */}
      {showDetail && focusedAccount ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* Focused row table */}
          <div className="shrink-0 overflow-hidden">
            <table className="border-collapse table-fixed w-full">
              <thead className="sticky top-0 z-30">
                <tr className="border-b border-border/50 bg-table-header-background shadow-sm">
                  <th className="w-[60px] pl-6 text-sm font-bold h-10 text-left text-text-secondary">
                    STT
                  </th>
                  {!selectedServiceId && (
                    <th className="w-[80px] text-sm font-bold h-10 text-center text-text-secondary">
                      Services
                    </th>
                  )}
                  <th className="w-[240px] text-sm font-bold h-10 text-left text-text-secondary">
                    Email
                  </th>
                  {!selectedServiceId && (
                    <th className="w-[80px] text-sm font-bold h-10 text-center text-text-secondary">
                      Services
                    </th>
                  )}
                  <th className="w-[80px] text-sm font-bold h-10 text-center text-text-secondary">
                    2FA
                  </th>
                  <th className="w-1/3 text-sm font-bold h-10 text-left text-text-secondary">
                    Last Activities
                  </th>
                  <th className="w-[300px] text-sm font-bold h-10 text-left text-text-secondary">
                    Last Used Footprint
                  </th>
                  <th className="w-[110px] text-sm font-bold h-10 text-center text-text-secondary">
                    Security
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  className={cn(
                    'group transition-colors cursor-pointer border-b border-border/20 h-[48px] hover:bg-table-row-hover relative bg-primary/5',
                  )}
                  onClick={() => onSelectAccount(focusedAccount)}
                  onContextMenu={(e) => handleContextMenu(e, focusedAccount.id)}
                >
                  <td className="text-muted-foreground font-mono text-xs pl-6 py-2">
                    #
                    {String(
                      fullAccountList.findIndex((a) => a.id === focusedAccount.id) + 1,
                    ).padStart(2, '0')}
                  </td>
                  <td className="font-medium">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[14px] font-bold tracking-tight truncate text-primary">
                          {focusedAccount.email}
                        </span>
                        {runningBrowsers.has(focusedAccount.id) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold uppercase tracking-wide shrink-0">
                            Running
                          </span>
                        )}
                      </div>
                      <span
                        onMouseEnter={() => setHoveredEmail(focusedAccount.email)}
                        onMouseLeave={() => setHoveredEmail(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard?.writeText(focusedAccount.password || '');
                          setCopiedEmail(focusedAccount.email);
                          setTimeout(() => setCopiedEmail(null), 1200);
                        }}
                        title={focusedAccount.password || 'No Password'}
                        className={cn(
                          'inline-block font-mono text-[10px] tracking-wider rounded py-0.5 transition-all cursor-pointer',
                          copiedEmail === focusedAccount.email
                            ? 'bg-success/10 text-success'
                            : hoveredEmail === focusedAccount.email
                              ? 'bg-text-secondary/10 text-text-primary'
                              : 'text-text-secondary',
                        )}
                      >
                        {copiedEmail === focusedAccount.email
                          ? 'Copy'
                          : hoveredEmail === focusedAccount.email
                            ? focusedAccount.password || 'No Password'
                            : '••••••••'}
                      </span>
                    </div>
                  </td>
                  {!selectedServiceId && (
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {(() => {
                          const sorted = [...(focusedAccount.services || [])]
                            .filter((s) => s.url)
                            .sort((a, b) => (b.lastUsedAt || '').localeCompare(a.lastUsedAt || ''));
                          const top = sorted.slice(0, 4);
                          const extra = sorted.length - top.length;
                          return (
                            <>
                              {top.map((s, i) => {
                                let hostname = '';
                                try {
                                  hostname = new URL(s.url).hostname;
                                } catch {
                                  hostname = s.url;
                                }
                                return (
                                  <img
                                    key={`${s.serviceId}-${i}`}
                                    src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                                    className="w-4 h-4 rounded-sm"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                );
                              })}
                              {extra > 0 && (
                                <span className="text-[10px] font-bold text-text-secondary">
                                  +{extra}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                  )}
                  <td className="text-center">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                        isValidTotp(focusedAccount.totp)
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error',
                      )}
                    >
                      {isValidTotp(focusedAccount.totp) ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td>{renderLastActivity(focusedAccount)}</td>
                  <td>
                    <div className="flex flex-col items-start gap-1 min-w-0">
                      {focusedAccount.lastFootprint ? (
                        <>
                          <span className="text-[12px] font-bold text-text-primary flex items-center gap-1.5">
                            {focusedAccount.lastFootprint.country &&
                              renderCountryFlag(focusedAccount.lastFootprint.country)}
                            {[
                              focusedAccount.lastFootprint.country,
                              focusedAccount.lastFootprint.city,
                            ]
                              .filter(Boolean)
                              .join(', ') || '—'}
                          </span>
                          <span className="text-[11px] font-mono text-text-secondary flex items-center gap-1.5">
                            {focusedAccount.lastFootprint.systemOS || '—'} ·{' '}
                            {focusedAccount.lastFootprint.browser || '—'}
                            {focusedAccount.lastFootprint.isProxy && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-warn/10 text-warn">
                                PROXY
                              </span>
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-text-secondary/40">No footprint</span>
                      )}
                    </div>
                  </td>
                  <td className="text-center">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                        getSecurityScore(focusedAccount) >= 80
                          ? 'bg-green/10 text-green'
                          : getSecurityScore(focusedAccount) >= 50
                            ? 'bg-warn/10 text-warn'
                            : 'bg-red/10 text-red',
                      )}
                    >
                      {getSecurityScore(focusedAccount)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detail view */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <EmailModal
              isOpen={!!focusedAccount}
              onClose={() => {
                onSelectAccount(null);
              }}
              focusedAccount={focusedAccount}
              accounts={accounts}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              avatars={avatars}
              onSelectAccount={onSelectAccount}
              onContextMenu={handleContextMenu}
              editedAccount={editedAccount}
              setEditedAccount={setEditedAccount}
              onUpdateAccount={onUpdateAccount}
              validateField={validateField}
              errors={errors}
              backupCodeSearch={backupCodeSearch}
              setBackupCodeSearch={setBackupCodeSearch}
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
              serviceSearch={serviceSearch}
              setServiceSearch={setServiceSearch}
              accountServices={accountServices}
              onEditServiceLink={handleEditServiceLink}
              onOpenService={handleOpenService}
              onDeleteService={handleUnlinkService}
              globalServices={globalServices}
              onQuickAddService={handleQuickAddService}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto custom-scrollbar flex flex-col min-h-0">
          <table className="border-collapse table-fixed w-full">
            <thead className="sticky top-0 z-30">
              <tr className="border-b border-border/50 bg-table-header-background shadow-sm">
                <th className="w-[60px] pl-6 text-sm font-bold h-10 text-left text-text-secondary">
                  STT
                </th>
                <th className="w-[240px] text-sm font-bold h-10 text-left text-text-secondary">
                  Email
                </th>
                {!selectedServiceId && (
                  <th className="w-[80px] text-sm font-bold h-10 text-center text-text-secondary">
                    Services
                  </th>
                )}
                <th className="w-[80px] text-sm font-bold h-10 text-center text-text-secondary">
                  2FA
                </th>
                <th className="w-1/3 text-sm font-bold h-10 text-left text-text-secondary">
                  Last Activities
                </th>
                <th className="w-[300px] text-sm font-bold h-10 text-left text-text-secondary">
                  Last Used Footprint
                </th>
                <th className="w-[110px] text-sm font-bold h-10 text-center text-text-secondary">
                  Security
                </th>
              </tr>
            </thead>
            <tbody>
              {orderedAccounts.map((account, _index) => {
                const isSelected = account.id === focusedAccountId;
                const originalIndex = fullAccountList.findIndex((a) => a.id === account.id);
                const securityScore = getSecurityScore(account);
                return (
                  <tr
                    key={account.id}
                    className={cn(
                      'group transition-colors cursor-pointer border-b border-border/20 h-[48px] hover:bg-table-row-hover relative',
                      isSelected && 'bg-primary/5',
                    )}
                    onClick={() => onSelectAccount(account)}
                    onContextMenu={(e) => handleContextMenu(e, account.id)}
                  >
                    <td className="text-muted-foreground font-mono text-xs pl-6 py-2">
                      #{String(originalIndex + 1).padStart(2, '0')}
                    </td>
                    <td className="font-medium">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={cn(
                              'text-[14px] font-bold tracking-tight truncate',
                              isSelected ? 'text-primary' : 'text-foreground',
                            )}
                          >
                            {account.email}
                          </span>
                          {(() => {
                            const isRunning = runningBrowsers.has(account.id);
                            if (isRunning)
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold uppercase tracking-wide shrink-0">
                                  Running
                                </span>
                              );
                            return null;
                          })()}
                        </div>
                        <span
                          onMouseEnter={() => setHoveredEmail(account.email)}
                          onMouseLeave={() => setHoveredEmail(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard?.writeText(account.password || '');
                            setCopiedEmail(account.email);
                            setTimeout(() => setCopiedEmail(null), 1200);
                          }}
                          title={account.password || 'No Password'}
                          className={cn(
                            'inline-block font-mono text-[10px] tracking-wider rounded py-0.5 transition-all cursor-pointer',
                            copiedEmail === account.email
                              ? 'bg-success/10 text-success'
                              : hoveredEmail === account.email
                                ? 'bg-text-secondary/10 text-text-primary'
                                : 'text-text-secondary',
                          )}
                        >
                          {copiedEmail === account.email
                            ? 'Copy'
                            : hoveredEmail === account.email
                              ? account.password || 'No Password'
                              : '••••••••'}
                        </span>
                      </div>
                    </td>
                    {!selectedServiceId && (
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            const sorted = [...(account.services || [])]
                              .filter((s) => s.url)
                              .sort((a, b) =>
                                (b.lastUsedAt || '').localeCompare(a.lastUsedAt || ''),
                              );
                            const top = sorted.slice(0, 4);
                            const extra = sorted.length - top.length;
                            return (
                              <>
                                {top.map((s, i) => {
                                  let hostname = '';
                                  try {
                                    hostname = new URL(s.url).hostname;
                                  } catch {
                                    hostname = s.url;
                                  }
                                  return (
                                    <img
                                      key={`${s.serviceId}-${i}`}
                                      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                                      className="w-4 h-4 rounded-sm"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  );
                                })}
                                {extra > 0 && (
                                  <span className="text-[10px] font-bold text-text-secondary">
                                    +{extra}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    )}
                    <td className="text-center">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                          isValidTotp(account.totp)
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error',
                        )}
                      >
                        {isValidTotp(account.totp) ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td>{renderLastActivity(account)}</td>
                    <td>
                      <div className="flex flex-col items-start gap-1 min-w-0">
                        {account.lastFootprint ? (
                          <>
                            <span className="text-[12px] font-bold text-text-primary flex items-center gap-1.5">
                              {account.lastFootprint.country &&
                                renderCountryFlag(account.lastFootprint.country)}
                              {[account.lastFootprint.country, account.lastFootprint.city]
                                .filter(Boolean)
                                .join(', ') || '—'}
                            </span>
                            <span className="text-[11px] font-mono text-text-secondary flex items-center gap-1.5">
                              {account.lastFootprint.systemOS || '—'} ·{' '}
                              {account.lastFootprint.browser || '—'}
                              {account.lastFootprint.isProxy && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-warn/10 text-warn">
                                  PROXY
                                </span>
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] text-text-secondary/40">No footprint</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                          securityScore >= 80
                            ? 'bg-green/10 text-green'
                            : securityScore >= 50
                              ? 'bg-warn/10 text-warn'
                              : 'bg-red/10 text-red',
                        )}
                      >
                        {securityScore}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Account Context Menu */}
      {contextMenu &&
        createPortal(
          <Dropdown
            open={true}
            onOpenChange={() => setContextMenu(null)}
            position={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <DropdownTrigger asChild>
              <div className="fixed" />
            </DropdownTrigger>
            <DropdownContent>
              {runningBrowsers.has(contextMenu.accountId) ? (
                <DropdownItem
                  onClick={async () => {
                    try {
                      // @ts-ignore
                      await window.electron.ipcRenderer.invoke(
                        'email:close-profile',
                        contextMenu.accountId,
                      );
                    } catch (err) {
                      console.error('Failed to close browser:', err);
                    }
                    setContextMenu(null);
                  }}
                >
                  <Globe className="w-3.5 h-3.5 text-red-400" />
                  Stop Browser
                </DropdownItem>
              ) : (
                <DropdownItem
                  onClick={() => {
                    const account = accounts.find((a) => a.id === contextMenu.accountId);
                    if (account) {
                      setPendingLaunch({
                        accountId: account.id,
                        email: account.email,
                      });
                      setIsLaunchModalOpen(true);
                    }
                    setContextMenu(null);
                  }}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Open browser
                </DropdownItem>
              )}
              <DropdownItem
                onClick={async () => {
                  const account = accounts.find((a) => a.id === contextMenu.accountId);
                  if (account) {
                    try {
                      // @ts-ignore
                      await window.electron.ipcRenderer.invoke(
                        'email:open-profile-folder',
                        account.email,
                      );
                    } catch (err: any) {
                      console.error('Failed to open profile folder:', err);
                    }
                  }
                  setContextMenu(null);
                }}
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                Open folder
              </DropdownItem>
              <div className="h-px bg-divider my-1" />
              <DropdownItem
                className="text-error focus:text-error focus:bg-error/10"
                onClick={() => {
                  onHardDelete(contextMenu.accountId);
                  setContextMenu(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete permanently
              </DropdownItem>
            </DropdownContent>
          </Dropdown>,
          document.body,
        )}

      {/* Service Context Menu */}
      {serviceContextMenu &&
        createPortal(
          <Dropdown
            open={true}
            onOpenChange={() => setServiceContextMenu(null)}
            position={{ top: serviceContextMenu.y, left: serviceContextMenu.x }}
          >
            <DropdownTrigger asChild>
              <div className="fixed" />
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem onClick={() => handleOpenService(serviceContextMenu.linkId)}>
                <Globe className="w-4 h-4 text-emerald-400" />
                Open with Chromium {browserVersion}
              </DropdownItem>
              <div className="h-px bg-border/20 my-1 mx-2" />
              <DropdownItem onClick={() => handleEditServiceLink(serviceContextMenu.linkId)}>
                <Eye className="w-4 h-4 text-blue-500/50" />
                View / Edit
              </DropdownItem>
              <DropdownItem
                className="text-error focus:text-error focus:bg-error/10"
                onClick={() => {
                  if (serviceContextMenu.status === 'trash')
                    setServiceHardDeleteConfirmId(serviceContextMenu.linkId);
                  else setServiceDeleteConfirmId(serviceContextMenu.linkId);
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500/60" />
                {serviceContextMenu.status === 'trash' ? 'Delete Permanently' : 'Delete'}
              </DropdownItem>
              {serviceContextMenu.status === 'trash' && (
                <>
                  <div className="h-px bg-border/20 my-1 mx-2" />
                  <DropdownItem onClick={() => handleRestoreService(serviceContextMenu.linkId)}>
                    <Undo2 className="w-4 h-4 text-emerald-400" />
                    Restore Service
                  </DropdownItem>
                </>
              )}
            </DropdownContent>
          </Dropdown>,
          document.body,
        )}

      {serviceDeleteConfirmId &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setServiceDeleteConfirmId(null)}
            />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h3 className="text-sm font-bold text-foreground">Move to Trash</h3>
                <button
                  onClick={() => setServiceDeleteConfirmId(null)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The service link will be moved to trash and can be restored within 30 days.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-border/50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setServiceDeleteConfirmId(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-muted/50 hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUnlinkService(serviceDeleteConfirmId)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                  >
                    Move to Trash
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {serviceHardDeleteConfirmId &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setServiceHardDeleteConfirmId(null)}
            />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h3 className="text-sm font-bold text-foreground">Delete Permanently</h3>
                <button
                  onClick={() => setServiceHardDeleteConfirmId(null)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This action cannot be undone. The service link will be permanently deleted.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-border/50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setServiceHardDeleteConfirmId(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-muted/50 hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePermanentDeleteService(serviceHardDeleteConfirmId)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <BrowserLaunchModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        email={pendingLaunch?.email || ''}
        accountId={pendingLaunch?.accountId || ''}
        targetUrl={pendingLaunch?.url}
        targetTitle={pendingLaunch?.title}
        onLaunch={handleExecuteLaunch}
      />

      {/* Footer */}
      {!focusedAccountId && currentPage != null && totalPages != null && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 text-xs text-text-secondary font-mono shrink-0 bg-table-footer-background">
          <span>
            {totalRecords != null && totalRecords > 0
              ? `Showing ${(startRecord ?? 0).toLocaleString()}–${(endRecord ?? 0).toLocaleString()} of ${totalRecords.toLocaleString()}`
              : 'No results'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-2 py-0.5 rounded disabled:opacity-30 hover:bg-table-row-hover"
            >
              ‹
            </button>
            <span className="px-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-2 py-0.5 rounded disabled:opacity-30 hover:bg-table-row-hover"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom comparison function for memo
const arePropsEqual = (prevProps: EmailTableProps, nextProps: EmailTableProps) => {
  // Compare primitive values
  if (prevProps.focusedAccountId !== nextProps.focusedAccountId) {
    return false;
  }
  if (prevProps.selectedServiceId !== nextProps.selectedServiceId) {
    return false;
  }
  if (prevProps.activeTab !== nextProps.activeTab) {
    return false;
  }
  if (prevProps.currentPage !== nextProps.currentPage) {
    return false;
  }

  // Compare arrays/objects by reference first (faster)
  if (prevProps.accounts !== nextProps.accounts) {
    return false;
  }
  if (prevProps.allAccounts !== nextProps.allAccounts) {
    return false;
  }
  if (prevProps.sorting !== nextProps.sorting) {
    return false;
  }
  if (prevProps.columnVisibility !== nextProps.columnVisibility) {
    return false;
  }

  // Compare Set by size and content
  if (prevProps.runningBrowsers !== nextProps.runningBrowsers) {
    if (prevProps.runningBrowsers.size !== nextProps.runningBrowsers.size) {
      return false;
    }
    // Check if content is same
    for (const id of prevProps.runningBrowsers) {
      if (!nextProps.runningBrowsers.has(id)) {
        return false;
      }
    }
  }

  // Compare functions by reference (should be stable with useCallback)
  if (prevProps.onSelectAccount !== nextProps.onSelectAccount) {
    return false;
  }
  if (prevProps.onHardDelete !== nextProps.onHardDelete) {
    return false;
  }
  if (prevProps.onRefreshData !== nextProps.onRefreshData) {
    return false;
  }
  if (prevProps.onAddEmail !== nextProps.onAddEmail) {
    return false;
  }
  if (prevProps.setActiveTab !== nextProps.setActiveTab) {
    return false;
  }
  return true;
};

export default memo(EmailTable, arePropsEqual);
