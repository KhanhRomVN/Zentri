import { FC, useState, useCallback, useRef, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Globe, Eye, Key, Undo2, X, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../../shared/lib/utils';
import { Account, Service } from '../types';
import { SERVICES } from '../../../constants/services';
import DetailView from './DetailView';
import ServiceDrawers from './ServiceDrawers';
import ServiceVaultDrawer from './ServiceVaultDrawer';
import ProfileLaunchModal from './modals/ProfileLaunchModal';

interface EmailTableProps {
  accounts: Account[];
  focusedAccountId?: string | null;
  onSelectAccount: (account: Account) => void;
  onSoftDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
  onSaveChanges: (oldAccount: Account, newAccount: Account) => void;
  onRefreshData?: () => void;
  activeTab: 'info' | 'services' | 'sessions' | 'history';
  setActiveTab: (tab: 'info' | 'services' | 'sessions' | 'history') => void;
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
  focusedAccountId,
  onSelectAccount,
  onSoftDelete,
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
  } | null>(null);

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
  }>({
    serviceId: '',
    serviceName: '',
    serviceUrl: '',
    username: '',
    password: '',
    notes: '',
    metadata: {},
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

  const handleServiceContextMenu = (e: React.MouseEvent, linkId: string) => {
    e.preventDefault();
    const link = (focusedAccount?.services as unknown as LinkedService[])?.find(
      (s) => s.id === linkId,
    );
    setServiceContextMenu({ x: e.clientX, y: e.clientY, linkId, status: link?.status || 'active' });
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
      provider: 'custom',
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
    },
  ) => {
    const launchData = overrideLaunch || pendingLaunch;
    if (!launchData) return;
    const { accountId, email, provider, url } = launchData;
    setIsLaunchModalOpen(false);

    try {
      const browserPath = localStorage.getItem('zentri_browser_path') || undefined;
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('email:open-login', {
        accountId,
        email,
        provider: provider || 'custom',
        url,
        browserPath,
        fingerprintId: config.fingerprintId,
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
        // Edit mode: currently we don't support editing service links as there are no editable fields
        // Just close the drawer and refresh
        console.log('Edit mode: no fields to update for service link');
      } else {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('email:add-service-link', {
          emailId: focusedAccount.id,
          serviceId: newServiceData.serviceId,
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
      <div className="flex items-center gap-3 group/act max-w-full">
        <div className="w-8 h-8 flex items-center justify-center overflow-hidden shrink-0 transition-colors">
          <img
            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
            className="w-5 h-5 opacity-70 group-hover/act:opacity-100 transition-opacity"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://www.google.com/s2/favicons?domain=google.com&sz=32';
            }}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold text-foreground/80 truncate group-hover/act:text-foreground transition-colors leading-tight">
            {title || hostname}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-muted-foreground/40 font-mono tracking-tight group-hover/act:text-muted-foreground/60">
              {formatDistanceToNow(new Date(time), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // When section is expanded, hide all other rows
  const orderedAccounts =
    showDetail && focusedAccountId
      ? accounts.filter((a) => a.id === focusedAccountId)
      : focusedAccountId
        ? [
            ...accounts.filter((a) => a.id === focusedAccountId),
            ...accounts.filter((a) => a.id !== focusedAccountId),
          ]
        : accounts;

  // --- Render ---
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background/30 transition-all duration-500 overflow-hidden">
      {/* Inline Table (merged from ListView) */}
      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col min-h-0">
        <table className="border-collapse table-fixed w-full">
          <thead className="sticky top-0 z-30">
            <tr className="border-b border-border/50 bg-table-header-background shadow-sm">
              <th className="w-[60px] pl-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left">
                STT
              </th>
              <th className="w-[240px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left">
                Email
              </th>
              <th className="w-1/3 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left">
                Last Activities
              </th>
              <th className="w-[300px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left">
                Last Used Proxy
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {orderedAccounts.map((account, _index) => {
                const isSelected = account.id === focusedAccountId;
                const originalIndex = accounts.findIndex((a) => a.id === account.id);
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
                      <td className="text-muted-foreground font-mono text-[10px] pl-6 py-2">
                        #{String(originalIndex + 1).padStart(2, '0')}
                      </td>
                      <td className="font-medium">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-transform overflow-hidden border border-primary/5',
                              !isSelected && 'group-hover:scale-110',
                              isSelected && 'scale-110 shadow-md shadow-primary/20',
                            )}
                          >
                            {avatars[account.email] ? (
                              <img
                                src={avatars[account.email]}
                                alt="avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Mail className="w-4 h-4 opacity-40" />
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span
                              className={cn(
                                'text-[14px] font-bold tracking-tight truncate',
                                isSelected ? 'text-primary' : 'text-foreground',
                              )}
                            >
                              {account.email}
                            </span>
                            <span className="text-[10px] text-muted-foreground/40 font-mono tracking-wider truncate">
                              {account.password || 'No Password'}
                            </span>
                          </div>
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
                    </motion.tr>

                    {/* Detail Row - inserted right after the selected row */}
                    {isSelected && showDetail && (
                      <tr
                        key={`detail-${account.id}`}
                        className="border-t-2 border-t-primary/20 border-b border-border/20"
                      >
                        <td colSpan={4} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="overflow-hidden"
                          >
                            <DetailView
                              focusedAccount={focusedAccount!}
                              accounts={accounts}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              avatars={avatars}
                              onSelectAccount={onSelectAccount}
                              onContextMenu={handleContextMenu}
                              onServiceContextMenu={handleServiceContextMenu}
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
          <div
            ref={menuRef}
            className="fixed bg-modal-background border border-border rounded-md shadow-lg py-1 z-[1000] min-w-[160px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={() => setContextMenu(null)}
          >
            {accounts.find((a) => a.id === contextMenu.accountId)?.status === 'deleting' ? (
              <div
                onClick={() => {
                  onRestore(contextMenu.accountId);
                  setContextMenu(null);
                }}
                className="px-3 py-1.5 text-sm hover:bg-sidebar-item-hover cursor-pointer flex items-center gap-2"
              >
                <Undo2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore Account</span>
              </div>
            ) : (
              <div
                onClick={() => {
                  onSoftDelete(contextMenu.accountId);
                  setContextMenu(null);
                }}
                className="px-3 py-1.5 text-sm hover:bg-sidebar-item-hover cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500/60" />
                <span>Move to Trash</span>
              </div>
            )}
            <div className="h-px bg-divider my-1" />
            <div
              onClick={() => {
                onHardDelete(contextMenu.accountId);
                setContextMenu(null);
              }}
              className="px-3 py-1.5 text-sm hover:bg-sidebar-item-hover cursor-pointer flex items-center gap-2 text-error focus:text-error focus:bg-error/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Permanently</span>
            </div>
          </div>,
          document.body,
        )}

      {/* Service Context Menu */}
      {serviceContextMenu &&
        createPortal(
          <div
            ref={serviceMenuRef}
            className="fixed bg-card/95 backdrop-blur-2xl border border-border/50 rounded-md shadow-lg shadow-black/20 py-1.5 z-[1000] min-w-[200px] w-max animate-in fade-in zoom-in-95 duration-100 p-1 hover:border-primary transition-colors"
            style={{ top: serviceContextMenu.y, left: serviceContextMenu.x }}
            onClick={() => setServiceContextMenu(null)}
          >
            <button
              onClick={() => handleOpenService(serviceContextMenu.linkId)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all whitespace-nowrap"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              Open with Chromium {browserVersion}
            </button>
            <div className="h-px bg-border/20 my-1 mx-2" />
            <button
              onClick={() => handleEditServiceLink(serviceContextMenu.linkId)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all whitespace-nowrap"
            >
              <Eye className="w-4 h-4 text-blue-500/50" />
              View / Edit
            </button>
            <button
              onClick={() => handleViewSecrets(serviceContextMenu.linkId)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all whitespace-nowrap"
            >
              <Key className="w-4 h-4 text-primary/50" />
              Secrets Vault
            </button>
            <div className="h-px bg-border/20 my-1 mx-2" />
            <button
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all whitespace-nowrap"
              onClick={() => {
                if (serviceContextMenu.status === 'trash')
                  setServiceHardDeleteConfirmId(serviceContextMenu.linkId);
                else setServiceDeleteConfirmId(serviceContextMenu.linkId);
              }}
            >
              <Trash2 className="w-4 h-4 text-red-500/60" />
              {serviceContextMenu.status === 'trash' ? 'Delete Permanently' : 'Delete'}
            </button>
            {serviceContextMenu.status === 'trash' && (
              <>
                <div className="h-px bg-border/20 my-1 mx-2" />
                <button
                  onClick={() => handleRestoreService(serviceContextMenu.linkId)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all whitespace-nowrap"
                >
                  <Undo2 className="w-4 h-4 text-emerald-400" />
                  Restore Service
                </button>
              </>
            )}
          </div>,
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

      <ProfileLaunchModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        email={pendingLaunch?.email || ''}
        accountId={pendingLaunch?.accountId || ''}
        onLaunch={handleExecuteLaunch}
      />
    </div>
  );
};

export default EmailTable;
