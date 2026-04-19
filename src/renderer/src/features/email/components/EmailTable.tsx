import { FC, useState, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  HeaderCell,
  TableCell,
} from '../../../shared/components/ui/table';
import { Drawer } from '../../../shared/components/ui/drawer';
import Combobox from '../../../shared/components/ui/combobox/Combobox';
import { Account } from '../mock/accounts';
import Badge from '../../../shared/components/ui/badge/Badge';
import Avatar from '../../../shared/components/ui/avatar/Avatar';
import Input from '../../../shared/components/ui/input/Input';
import {
  User,
  LayoutGrid,
  Activity,
  Eye,
  Trash2,
  Clock,
  Undo2,
  Trash,
  Key,
  Hash,
  Shield,
  Chrome,
  Mail,
  Search,
  Plus,
  Globe,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../../shared/lib/utils';
import { useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Modal } from '@renderer/shared/components/ui/modal';
import { Textarea } from '../../../shared/components/ui/textarea';

interface EmailTableProps {
  accounts: Account[];
  focusedAccountId?: string | null;
  onSelectAccount: (account: Account) => void;
  onSoftDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
  onSaveChanges: (oldAccount: Account, newAccount: Account) => void;
}

const EmailTable: FC<EmailTableProps> = ({
  accounts,
  focusedAccountId,
  onSelectAccount,
  onSoftDelete,
  onRestore,
  onHardDelete,
  onSaveChanges,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'services'>('info');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    accountId: string;
  } | null>(null);
  const focusedAccount = accounts.find((a) => a.id === focusedAccountId);

  useEffect(() => {
    if (focusedAccountId) {
      console.log('[EmailTable] Focused ID current state:', {
        id: focusedAccountId,
        found: !!focusedAccount,
        totalAccounts: accounts.length,
      });
    }
  }, [focusedAccountId, focusedAccount, accounts]);

  const [editedAccount, setEditedAccount] = useState<Account | null>(null);
  const [backupCodeSearch, setBackupCodeSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [linkServiceSearchQuery, setLinkServiceSearchQuery] = useState('');
  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [newServiceData, setNewServiceData] = useState({
    serviceId: '',
    username: '',
    password: '',
    notes: '',
  });
  const [quickCreateData, setQuickCreateData] = useState({
    name: '',
    url: '',
    category: '',
    tags: '',
    description: '',
  });
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryInputOpen, setCategoryInputOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [accountServices, setAccountServices] = useState<any[]>([]); // Linked to focused account
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync editedAccount when focusedAccount changes
  useEffect(() => {
    if (focusedAccountId && focusedAccount) {
      console.log('[EmailTable] Syncing edited account for:', focusedAccount.email);
      setEditedAccount(focusedAccount);
      setErrors({});

      // Fetch services specifically linked to this account
      // @ts-ignore
      window.electron.ipcRenderer
        .invoke(
          'sqlite:all',
          `SELECT s.*, se.username, se.password, se.notes 
           FROM services s 
           JOIN service_emails se ON s.id = se.service_id 
           WHERE se.email_id = ?`,
          [focusedAccountId],
        )
        .then(setAccountServices)
        .catch(() => setAccountServices([]));

      // Fetch global services for the "Add Service" drawer
      // @ts-ignore
      window.electron.ipcRenderer
        .invoke('sqlite:all', 'SELECT * FROM services ORDER BY name ASC')
        .then(setGlobalServices)
        .catch(() => setGlobalServices([]));
    } else {
      setEditedAccount(null);
      setAccountServices([]);
      setServiceSearch('');
    }
  }, [focusedAccountId, accounts]);

  // Fetch avatars for all visible accounts
  useEffect(() => {
    const fetchAvatars = async () => {
      const newAvatars: Record<string, string> = { ...avatars };
      let changed = false;

      for (const account of accounts) {
        if (!newAvatars[account.email]) {
          // @ts-ignore
          const avatarUrl = await window.electron.ipcRenderer.invoke('email:get-avatar', {
            email: account.email,
          });
          if (avatarUrl) {
            newAvatars[account.email] = avatarUrl;
            changed = true;
          }
        }
      }

      if (changed) setAvatars(newAvatars);
    };

    fetchAvatars();
  }, [accounts]);

  const isDirty =
    focusedAccount &&
    editedAccount &&
    JSON.stringify(focusedAccount) !== JSON.stringify(editedAccount);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, accountId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, accountId });
  };

  const handleAddServiceLink = async () => {
    if (!focusedAccountId || !newServiceData.serviceId) return;

    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        'INSERT INTO service_emails (id, service_id, email_id, username, password, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          newServiceData.serviceId,
          focusedAccountId,
          newServiceData.username,
          newServiceData.password,
          newServiceData.notes,
        ],
      );

      // Refresh list
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        `SELECT s.*, se.username, se.password, se.notes 
         FROM services s 
         JOIN service_emails se ON s.id = se.service_id 
         WHERE se.email_id = ?`,
        [focusedAccountId],
      );
      setAccountServices(rows);
      setIsServiceDrawerOpen(false);
      setNewServiceData({ serviceId: '', username: '', password: '', notes: '' });
    } catch (e) {
      console.error('Failed to link service', e);
    }
  };

  const handleQuickCreateService = async () => {
    if (!quickCreateData.name) return;

    try {
      const id = uuidv4();
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        'INSERT INTO services (id, name, url, category, tags, description) VALUES (?, ?, ?, ?, ?, ?)',
        [
          id,
          quickCreateData.name,
          quickCreateData.url,
          JSON.stringify(quickCreateData.category ? [quickCreateData.category] : []),
          JSON.stringify(
            quickCreateData.tags ? quickCreateData.tags.split(',').map((t) => t.trim()) : [],
          ),
          quickCreateData.description,
        ],
      );

      // Refresh global services
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        'SELECT * FROM services ORDER BY name ASC',
      );
      setGlobalServices(rows);

      // Select newly created service and close modal
      setNewServiceData((d) => ({ ...d, serviceId: id }));
      setIsQuickCreateModalOpen(false);
      setQuickCreateData({
        name: '',
        url: '',
        category: '',
        tags: '',
        description: '',
      });
      setCategorySearch('');
    } catch (e) {
      console.error('Failed to create service', e);
    }
  };

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

  const hasErrors = Object.values(errors).some((e) => !!e);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background/30 transition-all duration-500 overflow-hidden">
      {!focusedAccountId ? (
        <>
          {/* Scrollable Table Content Area - List Mode */}
          <div className="flex-1 overflow-auto custom-scrollbar flex flex-col min-h-0">
            <Table className="border-collapse table-fixed w-full">
              <TableHeader className="sticky top-0 z-30">
                <TableRow className="hover:bg-transparent border-b border-border/50 bg-table-headerBg shadow-sm">
                  <HeaderCell className="w-[80px] pl-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10">
                    STT
                  </HeaderCell>
                  <HeaderCell className="text-[10px] uppercase tracking-[0.2em] font-bold h-10">
                    Email
                  </HeaderCell>
                  <HeaderCell className="w-[140px] pr-6 text-[10px] uppercase tracking-[0.2em] font-bold text-right h-10">
                    Status
                  </HeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow
                    key={account.id}
                    className={cn(
                      'group transition-all cursor-pointer border-b border-border/20 h-[56px] hover:bg-table-hoverItemBodyBg/50 relative',
                      account.status === 'deleting' && 'opacity-60 grayscale-[0.5]',
                    )}
                    onClick={() => onSelectAccount(account)}
                    onContextMenu={(e) => handleContextMenu(e, account.id)}
                  >
                    <TableCell className="text-muted-foreground font-mono text-[10px] pl-6 py-2">
                      #{String(accounts.indexOf(account) + 1).padStart(2, '0')}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform overflow-hidden">
                          {avatars[account.email] ? (
                            <img
                              src={avatars[account.email]}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground text-[14px] font-bold tracking-tight">
                            {account.email}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono tracking-widest opacity-40 uppercase">
                            Account Identifier
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {account.status === 'active' ? (
                        <Badge
                          variant="ghost-success"
                          className="gap-2 inline-flex items-center py-1 px-3"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          <span className="text-[10px] uppercase tracking-[0.15em] font-black">
                            Active
                          </span>
                        </Badge>
                      ) : account.status === 'deleting' ? (
                        <Badge
                          variant="ghost-warning"
                          className="gap-2 inline-flex items-center py-1 px-3"
                        >
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] uppercase tracking-[0.15em] font-black">
                            Trash
                          </span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="ghost-error"
                          className="gap-2 inline-flex items-center py-1 px-3"
                        >
                          <span className="text-[10px] uppercase tracking-[0.15em] font-black">
                            Disabled
                          </span>
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="shrink-0 bg-table-headerBg/80 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.5)] z-40 h-12 flex items-center px-8">
            <div className="flex-1 text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.25em]">
              Tactical Fleet Capacity
            </div>
            <div className="text-[11px] text-foreground font-mono font-black tracking-tighter">
              {accounts.length}{' '}
              <span className="text-[9px] text-primary/70 ml-1 tracking-widest font-black uppercase">
                Operational
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_140px] border-b border-border/50 bg-table-headerBg shadow-sm shrink-0">
            <div className="pl-6 h-10 flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
              STT
            </div>
            <div className="h-10 flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
              Email
            </div>
            <div className="pr-6 h-10 flex items-center justify-end text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
              Status
            </div>
          </div>

          <div
            className="grid grid-cols-[80px_1fr_140px] items-center h-[56px] border-b border-primary/30 bg-primary/5 shrink-0 cursor-pointer group relative overflow-hidden"
            onClick={() => focusedAccount && onSelectAccount(focusedAccount)}
            onContextMenu={(e) => focusedAccount && handleContextMenu(e, focusedAccount.id)}
          >
            <div className="sweep-overlay" />

            <div className="pl-6 flex items-center gap-2 text-muted-foreground font-mono text-[10px] relative z-20">
              #{String(focusedAccount ? accounts.indexOf(focusedAccount) + 1 : 0).padStart(2, '0')}
            </div>
            <div className="flex items-center gap-4 relative z-20">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/20 transition-transform duration-500 hover:rotate-3">
                {focusedAccount && avatars[focusedAccount.email] ? (
                  <img
                    src={avatars[focusedAccount.email]}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar
                    size={32}
                    name={focusedAccount?.email || ''}
                    fallbackType="initials"
                    shape="square"
                  />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground text-[14px] font-bold tracking-tight">
                  {focusedAccount?.email}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono tracking-widest opacity-40 uppercase">
                  Account Identifier
                </span>
              </div>
            </div>
            <div className="pr-6 text-right relative z-20">
              {focusedAccount?.status === 'active' ? (
                <Badge variant="ghost-success" className="gap-2 inline-flex items-center py-1 px-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.15em] font-black">Active</span>
                </Badge>
              ) : focusedAccount?.status === 'deleting' ? (
                <Badge variant="ghost-warning" className="gap-2 inline-flex items-center py-1 px-3">
                  <Clock className="w-3 h-3 animate-spin-slow" />
                  <span className="text-[10px] uppercase tracking-[0.15em] font-black">
                    In Trash
                  </span>
                </Badge>
              ) : (
                <Badge variant="ghost-error" className="gap-2 inline-flex items-center py-1 px-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-black">
                    Disabled
                  </span>
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-1 flex bg-table-hoverItemBodyBg/5 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
            <div className="w-64 border-r border-border/30 bg-card/20 backdrop-blur-xl flex flex-col pt-4 shrink-0 overflow-hidden relative">
              <div className="flex-1 space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('info');
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all relative group',
                    activeTab === 'info'
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  style={{
                    background:
                      activeTab === 'info'
                        ? 'linear-gradient(to right, #f59e0b15, transparent)'
                        : undefined,
                  }}
                >
                  {activeTab === 'info' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#f59e0b] rounded-l-lg shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
                  )}
                  <User
                    className={cn(
                      'w-5 h-5 ml-6 transition-colors',
                      activeTab === 'info' ? 'text-[#f59e0b]' : 'text-muted-foreground/50',
                    )}
                  />
                  <span>Information</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('services');
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all relative group',
                    activeTab === 'services'
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  style={{
                    background:
                      activeTab === 'services'
                        ? 'linear-gradient(to right, #3b82f615, transparent)'
                        : undefined,
                  }}
                >
                  {activeTab === 'services' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3b82f6] rounded-l-lg shadow-[0_0_12px_rgba(59,130,246,0.4)]" />
                  )}
                  <LayoutGrid
                    className={cn(
                      'w-5 h-5 ml-6 transition-colors',
                      activeTab === 'services' ? 'text-[#3b82f6]' : 'text-muted-foreground/50',
                    )}
                  />
                  <span>Services</span>
                </button>
              </div>

              {focusedAccount?.status === 'deleting' && (
                <div className="p-4 border-t border-border/30 bg-amber-500/5 space-y-3 shrink-0">
                  <button
                    onClick={() => focusedAccount && onRestore(focusedAccount.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Restore Account
                  </button>
                  <button
                    onClick={() => onHardDelete(focusedAccount.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    Delete Permanently
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-background/20 backdrop-blur-3xl">
              <div className="flex-1 overflow-auto custom-scrollbar">
                {activeTab === 'info' ? (
                  <div className="w-full p-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] ml-1">
                            Email
                          </label>
                          <Input
                            value={editedAccount?.email || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedAccount((prev) => (prev ? { ...prev, email: val } : null));
                            }}
                            onBlur={(e: any) => validateField('email', e.target.value)}
                            error={errors.email}
                            className="bg-input-background border border-border/50 rounded-xl transition-all duration-300"
                            placeholder="identity@zentri.node"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] ml-1">
                            Password
                          </label>
                          <Input
                            type="password"
                            value={editedAccount?.password || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedAccount((prev) =>
                                prev ? { ...prev, password: val } : null,
                              );
                            }}
                            onBlur={(e: any) => validateField('password', e.target.value)}
                            error={errors.password}
                            className="bg-input-background border border-border/50 rounded-xl transition-all duration-300 font-mono tracking-widest"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] ml-1">
                            Recovery Email
                          </label>
                          <Input
                            value={editedAccount?.recoveryEmail || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedAccount((prev) =>
                                prev ? { ...prev, recoveryEmail: val } : null,
                              );
                            }}
                            onBlur={(e: any) => validateField('recoveryEmail', e.target.value)}
                            error={errors.recoveryEmail}
                            className="bg-input-background border border-border/50 rounded-xl transition-all duration-300"
                            placeholder="backup@zentri.node"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] ml-1">
                            Phone Number
                          </label>
                          <Input
                            value={editedAccount?.phoneNumber || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedAccount((prev) =>
                                prev ? { ...prev, phoneNumber: val } : null,
                              );
                            }}
                            onBlur={(e: any) => validateField('phoneNumber', e.target.value)}
                            error={errors.phoneNumber}
                            className="bg-input-background border border-border/50 rounded-xl transition-all duration-300"
                            placeholder="+X XXXXX XXXXX"
                          />
                        </div>
                      </div>

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
                            value={editedAccount?.totpSecretKey || ''}
                            onChange={(e) =>
                              setEditedAccount((prev) =>
                                prev ? { ...prev, totpSecretKey: e.target.value } : null,
                              )
                            }
                            className="bg-input-background border border-border/50 rounded-xl transition-all duration-300"
                          />
                          {editedAccount?.totpSecretKey && (
                            <div className="flex gap-2 pt-2">
                              {[0, 0, 0, 0, 0, 0].map((digit, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    'w-10 h-12 rounded-lg border border-border/20 bg-muted/10 flex items-center justify-center text-xl font-mono font-black text-primary/80 shadow-inner',
                                    i === 3 && 'ml-2',
                                  )}
                                >
                                  {digit}
                                </div>
                              ))}
                              <div className="flex-1 flex items-center justify-end">
                                <Activity className="w-4 h-4 text-green-500/50 animate-pulse" />
                              </div>
                            </div>
                          )}
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
                            badges={(() => {
                              try {
                                return editedAccount?.backupCodes
                                  ? JSON.parse(editedAccount.backupCodes).map((c: string) => ({
                                      id: c,
                                      label: c,
                                    }))
                                  : [];
                              } catch (e) {
                                return [];
                              }
                            })()}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key === 'Enter' && backupCodeSearch.trim()) {
                                const newCode = backupCodeSearch.trim();
                                const currentCodes = editedAccount?.backupCodes
                                  ? JSON.parse(editedAccount.backupCodes)
                                  : [];
                                if (
                                  Array.isArray(currentCodes) &&
                                  !currentCodes.includes(newCode)
                                ) {
                                  setEditedAccount((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          backupCodes: JSON.stringify([...currentCodes, newCode]),
                                        }
                                      : null,
                                  );
                                }
                                setBackupCodeSearch('');
                              }
                            }}
                            onBadgeRemove={(id) => {
                              try {
                                const currentCodes = editedAccount?.backupCodes
                                  ? JSON.parse(editedAccount.backupCodes)
                                  : [];
                                if (Array.isArray(currentCodes)) {
                                  setEditedAccount((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          backupCodes: JSON.stringify(
                                            currentCodes.filter((c: string) => c !== id),
                                          ),
                                        }
                                      : null,
                                  );
                                }
                              } catch (e) {
                                console.error('Failed to parse backup codes', e);
                              }
                            }}
                            className="bg-input-background border border-border/50 rounded-xl transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Services Sub-Navbar */}
                    <div className="h-14 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-8 gap-4 shrink-0">
                      <div className="w-80 flex items-center transition-all duration-500">
                        <Input
                          size="sm"
                          placeholder="Search linked services..."
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          leftIcon={Search}
                          className="!h-9 bg-muted/5 border-border/10 focus:bg-muted/10 transition-all duration-300 rounded-xl translate-y-[1px]"
                        />
                      </div>
                      <button
                        onClick={() => setIsServiceDrawerOpen(true)}
                        className="w-9 h-9 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all active:scale-90 border border-primary/20 group"
                      >
                        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                      <div className="min-w-fit">
                        <Table className="border-collapse table-fixed w-full">
                          <TableHeader className="sticky top-0 z-30">
                            <TableRow className="hover:bg-transparent border-b border-border/50 bg-table-headerBg shadow-sm">
                              <HeaderCell className="w-[80px] pl-8 text-[10px] uppercase tracking-[0.2em] font-bold h-10">
                                STT
                              </HeaderCell>
                              <HeaderCell className="text-[10px] uppercase tracking-[0.2em] font-bold h-10">
                                Service
                              </HeaderCell>
                              <HeaderCell className="text-[10px] uppercase tracking-[0.2em] font-bold h-10">
                                Username
                              </HeaderCell>
                              <HeaderCell className="text-[10px] uppercase tracking-[0.2em] font-bold h-10">
                                Notes
                              </HeaderCell>
                              <HeaderCell className="w-[140px] pr-8 text-[10px] uppercase tracking-[0.2em] font-bold text-right h-10">
                                Action
                              </HeaderCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accountServices
                              .filter(
                                (s) =>
                                  s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                                  s.url.toLowerCase().includes(serviceSearch.toLowerCase()),
                              )
                              .map((service, index) => (
                                <TableRow
                                  key={service.id}
                                  className="group border-b border-border/10 hover:bg-white/[0.02] h-12 transition-colors"
                                >
                                  <TableCell className="pl-8 py-2 text-muted-foreground font-mono text-[10px]">
                                    #{String(index + 1).padStart(2, '0')}
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <div className="flex items-center gap-4">
                                      <div className="w-6 h-6 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <img
                                          src={`https://www.google.com/s2/favicons?domain=${service.url}&sz=64`}
                                          className="w-full h-full object-contain"
                                          alt="ico"
                                        />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[13px] font-bold text-foreground/90 truncate leading-tight">
                                          {service.name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/40 font-mono truncate">
                                          {service.url}
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <span className="text-[12px] font-medium text-foreground/70">
                                      {service.username || (
                                        <span className="opacity-30 italic">—</span>
                                      )}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <span
                                      className="text-[11px] text-muted-foreground/60 line-clamp-1 max-w-[200px]"
                                      title={service.notes}
                                    >
                                      {service.notes || (
                                        <span className="opacity-20 italic">No notes</span>
                                      )}
                                    </span>
                                  </TableCell>
                                  <TableCell className="pr-8 py-2 text-right">
                                    <button
                                      className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                      title="Unlink Service"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                        {accountServices.length === 0 && (
                          <div className="py-20 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-10">
                              <Globe className="w-12 h-12" />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                No Registry records
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {focusedAccount && isDirty && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-3xl border-t border-border/50 flex items-center justify-between px-8 z-50 animate-in slide-in-from-bottom-full duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-blue-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Unsaved Changes Detected
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setEditedAccount({ ...focusedAccount })}
                      className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-button-secondBg hover:bg-button-secondBgHover transition-colors text-foreground/80"
                    >
                      Reset
                    </button>
                    <button
                      disabled={hasErrors}
                      onClick={() => onSaveChanges(focusedAccount, editedAccount!)}
                      className={cn(
                        'px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95',
                        hasErrors
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-button-bg text-button-bgText hover:bg-button-bgHover shadow-primary/20',
                      )}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Context Menu Dropdown */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[999] w-48 bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {accounts.find((a) => a.id === contextMenu.accountId)?.status === 'active' && (
            <>
              <button
                onClick={() => {
                  const acc = accounts.find((a) => a.id === contextMenu.accountId);
                  if (acc) {
                    // @ts-ignore
                    window.electron.ipcRenderer.invoke('email:open-login', {
                      accountId: acc.id,
                      provider: 'google',
                      email: acc.email,
                    });
                  }
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
              >
                <Chrome className="w-4 h-4" />
                Open Chrome
              </button>
              <div className="h-px bg-border/30 my-1 mx-2" />
            </>
          )}

          <button
            onClick={() => {
              const acc = accounts.find((a) => a.id === contextMenu.accountId);
              if (acc) onSelectAccount(acc);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
          >
            <Eye className="w-4 h-4 text-blue-500/50" />
            View
          </button>

          <div className="h-px bg-border/30 my-1 mx-2" />

          {accounts.find((a) => a.id === contextMenu.accountId)?.status === 'deleting' ? (
            <>
              <button
                onClick={() => {
                  onRestore(contextMenu.accountId);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-emerald-500/70 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
              >
                <Undo2 className="w-4 h-4" />
                Restore
              </button>
              <button
                onClick={() => {
                  onHardDelete(contextMenu.accountId);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <Trash className="w-4 h-4" />
                Delete Permanently
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onSoftDelete(contextMenu.accountId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Add Service Link Drawer */}
      <Drawer
        isOpen={isServiceDrawerOpen}
        onClose={() => {
          setIsServiceDrawerOpen(false);
          setLinkServiceSearchQuery('');
        }}
        direction="right"
        width={450}
        title="Link Service Account"
        subtitle={`Associate a registered service with ${focusedAccount?.email || 'this account'}`}
        footerActions={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setIsServiceDrawerOpen(false);
                setLinkServiceSearchQuery('');
              }}
              className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-button-secondBg hover:bg-button-secondBgHover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddServiceLink}
              disabled={!newServiceData.serviceId}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg',
                !newServiceData.serviceId
                  ? 'bg-button-bg/50 text-button-bgText cursor-not-allowed opacity-70'
                  : 'bg-button-bg text-button-bgText hover:bg-button-bgHover shadow-primary/20',
              )}
            >
              Link Service
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-6">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Select Service
              </label>
              <button
                onClick={() => setIsQuickCreateModalOpen(true)}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" />
                New Service
              </button>
            </div>
            <Input
              type="combobox"
              placeholder="Search or select a service..."
              value={
                linkServiceSearchQuery ||
                globalServices.find((s) => s.id === newServiceData.serviceId)?.name ||
                ''
              }
              onChange={(e) => setLinkServiceSearchQuery(e.target.value)}
              className="bg-input-background border-border rounded-xl"
              popoverContent={
                <Combobox
                  options={globalServices.map((s) => ({
                    value: s.id,
                    label: s.name,
                    icon: (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${s.url}&sz=64`}
                        className="w-4 h-4 rounded-sm"
                        alt=""
                      />
                    ),
                  }))}
                  searchQuery={linkServiceSearchQuery}
                  value={newServiceData.serviceId}
                  onChange={(val, opt) => {
                    setNewServiceData((d) => ({ ...d, serviceId: val }));
                    if (opt) setLinkServiceSearchQuery(opt.label);
                  }}
                  className="border-none shadow-xl"
                />
              }
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Username{' '}
                <span className="text-[10px] opacity-40 lowercase font-medium">(optional)</span>
              </label>
              <Input
                placeholder="Identifier (Username, Email, etc.)"
                value={newServiceData.username}
                onChange={(e) => setNewServiceData((d) => ({ ...d, username: e.target.value }))}
                className="bg-input-background border-border rounded-xl"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Password{' '}
                <span className="text-[10px] opacity-40 lowercase font-medium">(optional)</span>
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newServiceData.password}
                onChange={(e) => setNewServiceData((d) => ({ ...d, password: e.target.value }))}
                className="bg-input-background border-border rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Notes
            </label>
            <Textarea
              placeholder="Account recovery info, specific usage details, etc."
              value={newServiceData.notes}
              onChange={(val) => setNewServiceData((d) => ({ ...d, notes: val }))}
              className="min-h-[120px] bg-input-background border border-border/50 rounded-xl pt-3"
            />
          </div>
        </div>
      </Drawer>

      {/* Quick Create Service Modal */}
      <Modal
        open={isQuickCreateModalOpen}
        onClose={() => setIsQuickCreateModalOpen(false)}
        title="Initialize New Service"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setIsQuickCreateModalOpen(false);
                setQuickCreateData({
                  name: '',
                  url: '',
                  category: '',
                  tags: '',
                  description: '',
                });
                setCategorySearch('');
              }}
              className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-button-secondBg hover:bg-button-secondBgHover transition-colors border border-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleQuickCreateService}
              disabled={!quickCreateData.name}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg',
                !quickCreateData.name
                  ? 'bg-button-bg/50 text-button-bgText cursor-not-allowed opacity-70'
                  : 'bg-button-bg text-button-bgText hover:bg-button-bgHover shadow-primary/20',
              )}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="py-4 space-y-5">
          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Name <span className="text-destructive ml-1">*</span>
            </label>
            <Input
              placeholder="e.g. Google Cloud"
              value={quickCreateData.name}
              onChange={(e) => setQuickCreateData((d) => ({ ...d, name: e.target.value }))}
              autoFocus
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              URL
            </label>
            <Input
              placeholder="https://console.cloud.google.com"
              value={quickCreateData.url}
              onChange={(e) => setQuickCreateData((d) => ({ ...d, url: e.target.value }))}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Category
            </label>
            <Input
              type="combobox"
              placeholder="Select or create category..."
              value={categorySearch || quickCreateData.category}
              onChange={(e) => setCategorySearch(e.target.value)}
              multiValue={false}
              badges={[]}
              rightIcon={
                quickCreateData.category ? (
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickCreateData((d) => ({ ...d, category: '' }));
                    }}
                  />
                ) : undefined
              }
              popoverOpen={categoryInputOpen}
              onPopoverOpenChange={setCategoryInputOpen}
              popoverContent={(() => {
                const allCategories = Array.from(
                  new Set(
                    globalServices.flatMap((s) => {
                      try {
                        return s.category ? JSON.parse(s.category) : [];
                      } catch {
                        return [];
                      }
                    }),
                  ),
                ).sort();

                return (
                  <div className="flex flex-col max-h-[200px] overflow-y-auto">
                    {allCategories
                      .filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setQuickCreateData((d) => ({ ...d, category }));
                            setCategorySearch('');
                            setCategoryInputOpen(false);
                          }}
                          className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-muted text-left transition-colors"
                        >
                          <span>{category}</span>
                          {quickCreateData.category === category && (
                            <Check className="w-3 h-3 text-primary" />
                          )}
                        </button>
                      ))}
                    {categorySearch && !allCategories.includes(categorySearch) && (
                      <button
                        onClick={() => {
                          setQuickCreateData((d) => ({ ...d, category: categorySearch }));
                          setCategorySearch('');
                          setCategoryInputOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-muted text-primary transition-colors text-left"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Create "{categorySearch}"</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Tags
            </label>
            <Input
              placeholder="Add tags (comma separated)..."
              value={quickCreateData.tags}
              onChange={(e) => setQuickCreateData((d) => ({ ...d, tags: e.target.value }))}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Description
            </label>
            <textarea
              placeholder="Detailed description of the service and its purpose..."
              value={quickCreateData.description}
              onChange={(e) => setQuickCreateData((d) => ({ ...d, description: e.target.value }))}
              className="w-full bg-input-background border border-border/50 rounded-2xl px-5 py-3 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all h-24 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmailTable;
