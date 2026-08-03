import { FC, useState, useCallback, useRef, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Globe, Eye, Key, Undo2, X, FolderOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../../shared/lib/utils';
import { Account, Service } from '../types';
import { SERVICES } from '../../../constants/services';
import ServiceVaultDrawer from './drawers/ServiceVaultDrawer';
import BrowserLaunchModal from './modals/BrowserLaunchModal';
import { SortingState } from '@tanstack/react-table';
import EmailDetailView from './EmailDetailView';
import ServiceDrawers from './drawers/ServiceDrawers';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../components/ui/Dropdown';

interface EmailTableProps {
  accounts: Account[];
  allAccounts?: Account[];
  focusedAccountId?: string | null;
  onSelectAccount: (account: Account) => void;
  onSoftDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
  onSaveChanges: (oldAccount: Account, newAccount: Account) => void;
  onRefreshData?: () => void;
  activeTab: 'info' | 'services' | 'sessions' | 'history' | 'bookmarks';
  setActiveTab: (tab: 'info' | 'services' | 'sessions' | 'history' | 'bookmarks') => void;
  sorting?: SortingState;
  columnVisibility?: Record<string, boolean>;
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

const EmailTable: FC<EmailTableProps> = ({
  accounts,
  allAccounts = accounts,
  focusedAccountId,
  onSelectAccount,
  onRestore,
  onHardDelete,
  onRefreshData,
  activeTab,
  setActiveTab,
}) => {
  // --- States ---
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
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [browserVersion, setBrowserVersion] = useState('...');
  const [pendingLaunch, setPendingLaunch] = useState<{
    accountId: string;
    email: string;
    provider?: string;
    url?: string;
    title?: string;
  } | null>(null);

  // Track which accounts have an active browser
  const [runningBrowsers, setRunningBrowsers] = useState<Set<string>>(new Set());

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
  const [linkServiceSearchQuery, setLinkServiceSearchQuery] = useState('');
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

  // Quick Create Service States
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState({
    name: '',
    url: '',
    category: '',
    tags: '',
    description: '',
    metadata: [] as any[],
  });
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryInputOpen, setCategoryInputOpen] = useState(false);
  const [globalServices, setGlobalServices] = useState<Service[]>([]);
  const [isEditServiceMode, setIsEditServiceMode] = useState(false);
  const [isSecretsDrawerOpen, setIsSecretsDrawerOpen] = useState(false);
  const [currentSecrets, setCurrentSecrets] = useState<any[]>([]);
  const [loadingSecrets, setLoadingSecrets] = useState(false);

  // Two-phase animation: row moves first, then section expands
  const [showDetail, setShowDetail] = useState(false);
  const detailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const serviceMenuRef = useRef<HTMLDivElement>(null);

  // --- Derived ---
  const focusedAccount = accounts.find((a) => a.id === focusedAccountId) || null;
  const accountServices = focusedAccount?.services || [];

  // --- Effects ---
  useEffect(() => {
    const fetchAvatars = async () => {
      const newAvatars = { ...avatars };
      let changed = false;

      for (const acc of accounts) {
        if (!newAvatars[acc.email]) {
          try {
            // @ts-ignore
            const avatarUrl = await window.electron.ipcRenderer.invoke('email:get-avatar', {
              email: acc.email,
            });
            if (avatarUrl) {
              newAvatars[acc.email] = avatarUrl;
              changed = true;
            } else {
              // Fallback to Dicebear if no Chrome profile avatar found
              const seed = acc.email.split('@')[0];
              newAvatars[acc.email] = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
              changed = true;
            }
          } catch (e) {
            console.error('Avatar fetch failed', e);
          }
        }
      }
      if (changed) setAvatars(newAvatars);
    };
    fetchAvatars();
  }, [accounts]);

  useEffect(() => {
    if (focusedAccount) {
      setEditedAccount({ ...focusedAccount });
      setErrors({});
      setBackupCodeSearch('');
    } else {
      setEditedAccount(null);
    }
  }, [focusedAccountId]);

  // Two-phase detail animation
  useEffect(() => {
    if (detailTimerRef.current) {
      clearTimeout(detailTimerRef.current);
      detailTimerRef.current = null;
    }

    if (focusedAccountId) {
      setShowDetail(false);
      detailTimerRef.current = setTimeout(() => {
        setShowDetail(true);
      }, 400);
    } else {
      setShowDetail(false);
    }

    return () => {
      if (detailTimerRef.current) {
        clearTimeout(detailTimerRef.current);
      }
    };
  }, [focusedAccountId]);

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

    // Poll initial state for all accounts
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

  useEffect(() => {
    const loadGlobalServices = async () => {
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
    };
    loadGlobalServices();
  }, [isServiceDrawerOpen, accountServices]);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        // @ts-ignore
        const version = await window.electron.ipcRenderer.invoke('browser:get-version');
        setBrowserVersion(version || '0.0.0');
      } catch (err) {
        console.error('Failed to fetch browser version', err);
      }
    };
    fetchVersion();
  }, []);

  // --- Handlers ---
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
      provider: 'wayfern',
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

  const handleViewSecrets = async (linkId: string) => {
    const link = (focusedAccount?.services as unknown as LinkedService[])?.find(
      (s) => s.id === linkId,
    );
    if (!link) return;

    setNewServiceData((d) => ({
      ...d,
      linkId: link.id,
      serviceName: link.name,
      serviceUrl: link.url,
    }));
    setIsSecretsDrawerOpen(true);
    setLoadingSecrets(true);
    // Secrets are now managed via service metadata fields - no separate table
    setCurrentSecrets([]);
    setLoadingSecrets(false);
  };

  const handleAddSecret = async (_linkId: string, _name: string, _value: string, _type: string) => {
    // Secrets now managed via service metadata - no separate table
  };

  const handleUpdateSecret = async (
    _secretId: string,
    _name: string,
    _value: string,
    _type: string,
  ) => {
    // Secrets now managed via service metadata - no separate table
  };

  const handleDeleteSecret = async (_secretId: string) => {
    // Secrets now managed via service metadata - no separate table
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
    setIsServiceDrawerOpen(true);
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

    // [DEBUG] Xóa sau khi fix — log dữ liệu twoFa trước khi gửi IPC
    console.log(
      '[DEBUG] handleAddServiceLink — newServiceData.twoFa:',
      JSON.stringify(newServiceData.twoFa),
    );
    console.log(
      '[DEBUG] handleAddServiceLink — isEditServiceMode:',
      isEditServiceMode,
      'linkId:',
      newServiceData.linkId,
    );

    try {
      if (isEditServiceMode && newServiceData.linkId) {
        const payload = {
          linkId: newServiceData.linkId,
          metadata: newServiceData.metadata || {},
          twoFa: newServiceData.twoFa
            ? { totp: newServiceData.twoFa.totp, backupCodes: newServiceData.twoFa.backupCodes }
            : {},
        };
        console.log(
          '[DEBUG] handleAddServiceLink — IPC service_emails:update payload:',
          JSON.stringify(payload),
        );
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('service_emails:update', payload);
        console.log('[DEBUG] handleAddServiceLink — IPC service_emails:update thành công');
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

  const handleQuickCreateService = async () => {
    if (!quickCreateData.name) return;

    try {
      // @ts-ignore
      const newService = await window.electron.ipcRenderer.invoke('service:create', {
        name: quickCreateData.name,
        url: quickCreateData.url,
        category: quickCreateData.category ? JSON.stringify([quickCreateData.category]) : '[]',
        tags: quickCreateData.tags
          ? JSON.stringify(quickCreateData.tags.split(',').map((t) => t.trim()))
          : '[]',
        description: quickCreateData.description,
        metadata: JSON.stringify(quickCreateData.metadata || []),
      });

      if (newService) {
        setNewServiceData((prev) => ({ ...prev, serviceId: newService.id }));
        setLinkServiceSearchQuery(newService.name);
        setIsQuickCreateModalOpen(false);
        setQuickCreateData({
          name: '',
          url: '',
          category: '',
          tags: '',
          description: '',
          metadata: [],
        });
      }
    } catch (err) {
      console.error('Failed to create service', err);
    }
  };

  // --- Table helpers ---
  const renderLastActivity = (account: Account) => {
    if (!account.lastActivity) {
      return <span className="text-[10px] italic opacity-20 ml-6">—</span>;
    }

    const { url, title, time } = account.lastActivity;
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
        <span className="text-[11px] text-muted-foreground/40 font-mono tracking-tight mt-0.5 group-hover/act:text-muted-foreground/60">
          {formatDistanceToNow(new Date(time), { addSuffix: true })}
        </span>
      </div>
    );
  };

  // When section is expanded, hide all other rows
  // Sort: running browsers first, then preserve original order
  const orderedAccounts = (() => {
    const base =
      showDetail && focusedAccountId
        ? accounts.filter((a) => a.id === focusedAccountId)
        : focusedAccountId
          ? [
              ...accounts.filter((a) => a.id === focusedAccountId),
              ...accounts.filter((a) => a.id !== focusedAccountId),
            ]
          : accounts;

    // Push running browsers to top
    const running = base.filter((a) => runningBrowsers.has(a.id));
    const notRunning = base.filter((a) => !runningBrowsers.has(a.id));
    return [...running, ...notRunning];
  })();

  // Use allAccounts for indexing (original order before pagination)
  const fullAccountList = allAccounts;

  // --- Render ---
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background/30 transition-all duration-500 overflow-hidden">
      {/* Inline Table (merged from ListView) */}
      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col min-h-0">
        <table className="border-collapse table-fixed w-full">
          <thead className="sticky top-0 z-30">
            <tr className="border-b border-border/50 bg-table-header-background shadow-sm">
              <th className="w-[60px] pl-6 text-sm font-bold h-10 text-left text-text-primary">
                STT
              </th>
              <th className="w-[240px] text-sm font-bold h-10 text-left text-text-primary">
                Email
              </th>
              <th className="w-1/3 text-sm font-bold h-10 text-left text-text-primary">
                Last Activities
              </th>
              <th className="w-[300px] text-sm font-bold h-10 text-left text-text-primary">
                Last Used Proxy
              </th>
              <th className="w-[80px] text-sm font-bold h-10 text-center text-text-primary">
                Services
              </th>
              <th className="w-[110px] text-sm font-bold h-10 text-center text-text-primary">
                2FA
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {orderedAccounts.map((account, _index) => {
                const isSelected = account.id === focusedAccountId;
                const originalIndex = fullAccountList.findIndex((a) => a.id === account.id);
                const serviceCount = account.services?.length || 0;
                const hasTOTP = !!(account as any).totpSecretKey;
                const hasBackupCodes = (() => {
                  try {
                    const codes = (account as any).backupCodes;
                    return codes ? JSON.parse(codes).length > 0 : false;
                  } catch {
                    return false;
                  }
                })();
                return (
                  <Fragment key={account.id}>
                    <motion.tr
                      layout
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        layout: { type: 'spring', stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                      }}
                      className={cn(
                        'group transition-colors cursor-pointer border-b border-border/20 h-[48px] hover:bg-table-row-hover relative',
                        account.status === 'deleting' && 'opacity-60 grayscale-[0.5]',
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
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                  </span>
                                );
                              return null;
                            })()}
                          </div>
                          <span className="text-[10px] text-muted-foreground/40 font-mono tracking-wider truncate">
                            {account.password || 'No Password'}
                          </span>
                        </div>
                      </td>
                      <td>{renderLastActivity(account)}</td>
                      <td>
                        <div className="flex flex-col items-start gap-1 min-w-0 px-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          {account.lastProxy ? (
                            <>
                              <div className="flex items-center gap-2 w-full justify-start">
                                <span className="text-[14px] font-bold text-foreground/80 truncate">
                                  {account.lastProxy.host}
                                </span>
                                <span className="px-1.5 py-0 h-3.5 text-[8px] font-black uppercase tracking-tighter border-none rounded bg-muted/20 text-muted-foreground">
                                  {account.lastProxy.protocol.toUpperCase()}
                                </span>
                              </div>
                              {account.lastProxy.country && (
                                <div className="flex items-center gap-1 text-[12px] font-mono text-muted-foreground/60 tracking-tight truncate w-full justify-start">
                                  <span className="truncate">
                                    {account.lastProxy.city ? `${account.lastProxy.city}, ` : ''}
                                    {account.lastProxy.country}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] italic opacity-20">—</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="text-[13px] font-bold text-foreground/70">
                          {serviceCount}
                        </span>
                      </td>
                      <td className="text-center">
                        {hasTOTP || hasBackupCodes ? (
                          <div className="flex items-center justify-center gap-1">
                            {hasTOTP && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-emerald-500/30 text-[9px] uppercase font-black text-emerald-500 bg-emerald-500/5">
                                TOTP
                              </span>
                            )}
                            {hasBackupCodes && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-blue-500/30 text-[9px] uppercase font-black text-blue-500 bg-blue-500/5">
                                Backup
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] italic text-muted-foreground/30">—</span>
                        )}
                      </td>
                    </motion.tr>

                    {/* Detail Row - inserted right after the selected row */}
                    {isSelected && showDetail && (
                      <tr
                        key={`detail-${account.id}`}
                        className="border-t-2 border-t-primary/20 border-b border-border/20"
                      >
                        <td colSpan={6} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="overflow-hidden"
                          >
                            <EmailDetailView
                              focusedAccount={focusedAccount!}
                              accounts={accounts}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              avatars={avatars}
                              onSelectAccount={onSelectAccount}
                              onContextMenu={handleContextMenu}
                              onRestore={onRestore}
                              onHardDelete={onHardDelete}
                              editedAccount={editedAccount}
                              setEditedAccount={setEditedAccount}
                              validateField={validateField}
                              errors={errors}
                              backupCodeSearch={backupCodeSearch}
                              setBackupCodeSearch={setBackupCodeSearch}
                              serviceSearch={serviceSearch}
                              setServiceSearch={setServiceSearch}
                              accountServices={accountServices}
                              onAddNewServiceLink={handleOpenNewServiceDrawer}
                              onEditServiceLink={handleEditServiceLink}
                              onOpenService={handleOpenService}
                              onDeleteService={handleUnlinkService}
                            />
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

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
              <DropdownItem onClick={() => handleViewSecrets(serviceContextMenu.linkId)}>
                <Key className="w-4 h-4 text-primary/50" />
                Secrets Vault
              </DropdownItem>
              <div className="h-px bg-border/20 my-1 mx-2" />
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

      <ServiceDrawers
        isServiceDrawerOpen={isServiceDrawerOpen}
        setIsServiceDrawerOpen={setIsServiceDrawerOpen}
        linkServiceSearchQuery={linkServiceSearchQuery}
        setLinkServiceSearchQuery={setLinkServiceSearchQuery}
        focusedAccount={focusedAccount}
        newServiceData={newServiceData}
        setNewServiceData={setNewServiceData}
        globalServices={globalServices}
        handleAddServiceLink={handleAddServiceLink}
        isQuickCreateModalOpen={isQuickCreateModalOpen}
        setIsQuickCreateModalOpen={setIsQuickCreateModalOpen}
        quickCreateData={quickCreateData}
        setQuickCreateData={setQuickCreateData}
        handleQuickCreateService={handleQuickCreateService}
        categorySearch={categorySearch}
        setCategorySearch={setCategorySearch}
        categoryInputOpen={categoryInputOpen}
        setCategoryInputOpen={setCategoryInputOpen}
        isEditMode={isEditServiceMode}
        onRestoreService={handleRestoreService}
      />

      <ServiceVaultDrawer
        isOpen={isSecretsDrawerOpen}
        onClose={() => setIsSecretsDrawerOpen(false)}
        linkId={newServiceData.linkId || ''}
        serviceName={newServiceData.serviceName}
        serviceUrl={newServiceData.serviceUrl}
        currentSecrets={currentSecrets}
        loadingSecrets={loadingSecrets}
        onAddSecret={handleAddSecret}
        onUpdateSecret={handleUpdateSecret}
        onDeleteSecret={handleDeleteSecret}
      />

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
    </div>
  );
};

export default EmailTable;
