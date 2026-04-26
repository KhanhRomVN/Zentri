import { FC, useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHealthCheck } from '../hooks/useHealthCheck';
import HealthCheckModal from './modals/HealthCheckModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Globe, Eye, Key, Undo2 } from 'lucide-react';
import { Account, Service } from '../types';
import ListView from './ListView';
import DetailView from './DetailView';
import ContextMenu from './ContextMenu';
import ServiceDrawers from './ServiceDrawers';
import ServiceVaultDrawer from './ServiceVaultDrawer';
import Portal from '../../../shared/components/ui/Portal';
import Modal from '../../../shared/components/ui/modal/Modal';
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
  activeTab: 'info' | 'services' | 'inbox' | 'fingerprint' | 'sessions' | 'history';
  setActiveTab: (
    tab: 'info' | 'services' | 'inbox' | 'fingerprint' | 'sessions' | 'history',
  ) => void;
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
  const { t } = useTranslation();
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
  const { isOpen, options, launchWithCheck, closeHealthCheck } = useHealthCheck();
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
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
        const services = await window.electron.ipcRenderer.invoke('service:get-all');
        setGlobalServices(services || []);
      } catch (err) {
        console.error('Failed to load global services', err);
      }
    };
    loadGlobalServices();
  }, [isServiceDrawerOpen, accountServices]);

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

  const handleExecuteLaunch = async (config: { checkHealth: boolean }) => {
    if (!pendingLaunch) return;
    const { accountId, email, provider, url } = pendingLaunch;
    setIsLaunchModalOpen(false);

    if (config.checkHealth) {
      launchWithCheck({ accountId, email, provider, url });
    } else {
      try {
        const browserPath = localStorage.getItem('zentri_browser_path') || undefined;
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('email:open-login', {
          accountId,
          email,
          provider: provider || 'custom',
          url,
          browserPath,
        });
      } catch (error) {
        console.error('Failed to launch browser:', error);
      }
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
    try {
      // @ts-ignore
      const results = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        'SELECT * FROM service_emails_secrets WHERE service_email_id = ? ORDER BY created_at DESC',
        [linkId],
      );
      setCurrentSecrets(results || []);
    } catch (err) {
      console.error('Failed to fetch secrets', err);
    } finally {
      setLoadingSecrets(false);
    }
  };

  const handleAddSecret = async (linkId: string, name: string, value: string, type: string) => {
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        'INSERT INTO service_emails_secrets (id, service_email_id, secret_name, secret_value, secret_type) VALUES (?, ?, ?, ?, ?)',
        [window.crypto.randomUUID(), linkId, name, value, type],
      );
      // Refresh secrets list
      handleViewSecrets(linkId);
    } catch (err) {
      console.error('Failed to add secret', err);
    }
  };

  const handleUpdateSecret = async (
    secretId: string,
    name: string,
    value: string,
    type: string,
  ) => {
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        'UPDATE service_emails_secrets SET secret_name = ?, secret_value = ?, secret_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, value, type, secretId],
      );
      if (newServiceData.linkId) {
        handleViewSecrets(newServiceData.linkId);
      }
    } catch (err) {
      console.error('Failed to update secret', err);
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        'DELETE FROM service_emails_secrets WHERE id = ?',
        [secretId],
      );
      if (newServiceData.linkId) {
        handleViewSecrets(newServiceData.linkId);
      }
    } catch (err) {
      console.error('Failed to delete secret', err);
    }
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
      if (!value.trim()) error = t('email.validation.emailRequired');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        error = t('email.validation.emailInvalid');
    } else if (name === 'password') {
      if (!value.trim()) error = t('email.validation.passwordRequired');
    } else if (name === 'recoveryEmail') {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        error = t('email.validation.recoveryInvalid');
    } else if (name === 'phoneNumber') {
      if (value && !/^\+?[0-9\s\-()]+$/.test(value)) error = t('email.validation.phoneInvalid');
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const handleAddServiceLink = async () => {
    if (!focusedAccount || !newServiceData.serviceId) return;

    try {
      if (isEditServiceMode && newServiceData.linkId) {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke(
          'sqlite:run',
          "UPDATE service_emails SET username = ?, password = ?, notes = ?, metadata = ?, updated_at = datetime('now') WHERE id = ?",
          [
            newServiceData.username,
            newServiceData.password,
            newServiceData.notes,
            JSON.stringify(newServiceData.metadata),
            newServiceData.linkId,
          ],
        );
      } else {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('email:add-service-link', {
          emailId: focusedAccount.id,
          serviceId: newServiceData.serviceId,
          username: newServiceData.username,
          password: newServiceData.password,
          notes: newServiceData.notes,
          metadata: newServiceData.metadata,
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

  // --- Render ---
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background/30 transition-all duration-500 overflow-hidden">
      <AnimatePresence mode="wait">
        {!focusedAccountId ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <ListView
              accounts={accounts}
              avatars={avatars}
              onSelectAccount={onSelectAccount}
              onContextMenu={handleContextMenu}
            />

            <div className="shrink-0 bg-table-headerBg/80 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.5)] z-40 h-12 flex items-center px-8">
              <div className="flex-1 text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.25em]">
                {t('email.manager.table.fleetCapacity')}
              </div>
              <div className="text-[11px] text-foreground font-mono font-black tracking-tighter">
                {accounts.length}{' '}
                <span className="text-[9px] text-primary/70 ml-1 tracking-widest font-black uppercase">
                  {t('email.manager.table.operational')}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: 'circOut' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <DetailView
              focusedAccount={focusedAccount}
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
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ContextMenu
        menuRef={menuRef}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        accounts={accounts}
        onSelectAccount={onSelectAccount}
        onRestore={onRestore}
        onHardDelete={onHardDelete}
        onSoftDelete={onSoftDelete}
        onLaunchRequest={(account) => {
          setPendingLaunch({
            accountId: account.id,
            email: account.email,
            provider: 'google',
          });
          setIsLaunchModalOpen(true);
        }}
      />

      {/* Service Context Menu */}
      {serviceContextMenu && (
        <Portal>
          <div
            ref={serviceMenuRef}
            className="fixed bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl py-1.5 z-[1000] min-w-[200px] animate-in fade-in zoom-in-95 duration-100 p-1"
            style={{ top: serviceContextMenu.y, left: serviceContextMenu.x }}
            onClick={() => setServiceContextMenu(null)}
          >
            <button
              onClick={() => handleOpenService(serviceContextMenu.linkId)}
              className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
            >
              <Globe className="w-4 h-4" />
              {t('email.manager.table.openService')}
            </button>
            <div className="h-px bg-border/20 my-1 mx-2" />

            <button
              onClick={() => handleEditServiceLink(serviceContextMenu.linkId)}
              className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
            >
              <Eye className="w-4 h-4 text-blue-500/50" />
              {t('email.manager.table.view')}
            </button>

            <button
              onClick={() => handleViewSecrets(serviceContextMenu.linkId)}
              className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
            >
              <Key className="w-4 h-4 text-primary/50" />
              {t('email.manager.table.secretsVault')}
            </button>

            <div className="h-px bg-border/20 my-1 mx-2" />
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              onClick={() => {
                if (serviceContextMenu.status === 'trash') {
                  setServiceHardDeleteConfirmId(serviceContextMenu.linkId);
                } else {
                  setServiceDeleteConfirmId(serviceContextMenu.linkId);
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              {serviceContextMenu.status === 'trash'
                ? t('email.manager.table.deletePermanently')
                : t('email.manager.table.delete')}
            </button>

            {serviceContextMenu.status === 'trash' && (
              <button
                onClick={() => handleRestoreService(serviceContextMenu.linkId)}
                className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all mt-1"
              >
                <Undo2 className="w-4 h-4" />
                {t('email.manager.table.restoreService')}
              </button>
            )}
          </div>
        </Portal>
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

      {/* Service Confirmation Modals */}
      <Portal>
        {serviceDeleteConfirmId && (
          <Modal
            open={!!serviceDeleteConfirmId}
            onClose={() => setServiceDeleteConfirmId(null)}
            title={t('email.manager.table.modals.trashTitle')}
            size="sm"
            footer={
              <div className="flex gap-3">
                <button
                  onClick={() => setServiceDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-muted/50 hover:bg-muted transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleUnlinkService(serviceDeleteConfirmId!)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  {t('email.manager.table.modals.trashTitle')}
                </button>
              </div>
            }
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('email.manager.table.modals.trashDesc')}
            </p>
          </Modal>
        )}

        {serviceHardDeleteConfirmId && (
          <Modal
            open={!!serviceHardDeleteConfirmId}
            onClose={() => setServiceHardDeleteConfirmId(null)}
            title={t('email.manager.table.modals.deleteTitle')}
            size="sm"
            footer={
              <div className="flex gap-3">
                <button
                  onClick={() => setServiceHardDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-muted/50 hover:bg-muted transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handlePermanentDeleteService(serviceHardDeleteConfirmId!)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  {t('email.manager.table.modals.deleteForever')}
                </button>
              </div>
            }
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('email.manager.table.modals.deleteDesc')}
            </p>
          </Modal>
        )}
      </Portal>
      <ProfileLaunchModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        email={pendingLaunch?.email || ''}
        onLaunch={handleExecuteLaunch}
      />

      <HealthCheckModal
        isOpen={isOpen}
        onClose={closeHealthCheck}
        email={options?.email || ''}
        accountId={options?.accountId || ''}
        url={options?.url}
        onSuccess={async () => {
          if (!options) return;
          try {
            const browserPath = localStorage.getItem('zentri_browser_path') || undefined;
            // @ts-ignore
            await window.electron.ipcRenderer.invoke('email:open-login', {
              accountId: options.accountId,
              email: options.email,
              provider: options.provider || 'custom',
              url: options.url,
              browserPath,
            });
          } catch (error) {
            console.error('Failed to launch browser:', error);
          }
        }}
      />
    </div>
  );
};

export default EmailTable;
