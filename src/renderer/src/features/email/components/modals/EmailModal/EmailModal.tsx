/**
 * ------------------------------------------------------------------
 * EmailModal
 * ------------------------------------------------------------------
 * Modal that displays email account detail with a horizontal tabbar
 * (Info, Services, History, Fingerprint, Security)
 * and accent-color-coded tab buttons.
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { FC, useState, useRef, useEffect, useMemo, KeyboardEvent } from 'react';

// ── UI ──
import { User, LayoutGrid, Clock, Shield, ShieldCheck, Key, Search, X } from 'lucide-react';
import { Modal, ModalBody } from '../../../../../components/ui/Modal';
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from '../../../../../components/ui/Dropdown';

// ── Utils ──
import { cn } from '../../../../../shared/lib/utils';

// ── Hooks ──
import { useAccentColors } from '../../../../../hooks/useAccentColors';

// ── Types ──
import { Account } from '../../../types';

// ── Tabs ──
import InfoTab from './Information/index';
import ServicesTab from './Services/index';
import HistoryTab from './History/index';
import FingerprintTab from './Footprint/index';
import SecurityTab from './Security/index';
import PasswordTab from './Password/index';

// ─── Functions ──────────────────────────────────────────────────────────
let accentColorsCache: string[] = ['rgb(54, 134, 255)'];
let unifiedAccentCache = 'rgb(54, 134, 255)';

export const setAccentColorsForDetailView = (colors: string[], unified: string) => {
  accentColorsCache = colors.length > 0 ? colors : [unified];
  unifiedAccentCache = unified;
};

const getTabColor = (tabId: string) => {
  let hash = 0;
  for (let i = 0; i < tabId.length; i++) {
    hash = tabId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % accentColorsCache.length;
  const color = accentColorsCache[index] || accentColorsCache[0] || unifiedAccentCache;

  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    const r = rgbMatch[0];
    const g = rgbMatch[1];
    const b = rgbMatch[2];
    return {
      base: color,
      bg: `rgba(${r}, ${g}, ${b}, 0.1)`,
      border: `rgba(${r}, ${g}, ${b}, 0.3)`,
      hover: `rgba(${r}, ${g}, ${b}, 0.2)`,
      glow: `0 0 12px rgba(${r}, ${g}, ${b}, 0.4)`,
    };
  }
  return {
    base: color || unifiedAccentCache,
    bg: 'var(--sidebar-item-hover)',
    border: 'var(--divider)',
    hover: 'var(--sidebar-item-hover)',
    glow: 'none',
  };
};

// ─── Interfaces ─────────────────────────────────────────────────────────
interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  focusedAccount: Account | null;
  accounts: Account[];
  activeTab:
    | 'info'
    | 'services'
    | 'sessions'
    | 'history'
    | 'bookmarks'
    | 'fingerprint'
    | 'security'
    | 'password';
  setActiveTab: (
    tab:
      | 'info'
      | 'services'
      | 'sessions'
      | 'history'
      | 'bookmarks'
      | 'fingerprint'
      | 'security'
      | 'password',
  ) => void;
  avatars: Record<string, string>;
  onSelectAccount: (account: Account | null) => void;
  onContextMenu: (e: React.MouseEvent, accountId: string) => void;
  onServiceContextMenu?: (e: React.MouseEvent, linkId: string) => void;
  editedAccount: Account | null;
  setEditedAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  onUpdateAccount: (updated: Account) => void;
  validateField: (name: string, value: string) => void;
  errors: Record<string, string>;
  backupCodeSearch: string;
  setBackupCodeSearch: (val: string) => void;
  recoveryEmailSuggestions?: string[];
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  accountServices: any[];
  onOpenService?: (linkId: string) => void;
  onCloseBrowser?: () => void;
  isBrowserOpen?: boolean;
  onDeleteService?: (linkId: string) => void;
  globalServices?: any[];
  onQuickAddService?: (service: any) => Promise<string | null>;
}

// ─── Component ──────────────────────────────────────────────────────────
const EmailModal: FC<EmailModalProps> = ({
  isOpen,
  onClose,
  focusedAccount,
  accounts,
  onSelectAccount,
  activeTab,
  setActiveTab,
  onServiceContextMenu: _onServiceContextMenu,
  editedAccount,
  setEditedAccount,
  onUpdateAccount,
  validateField,
  errors,
  backupCodeSearch,
  setBackupCodeSearch,
  recoveryEmailSuggestions,
  serviceSearch,
  setServiceSearch,
  accountServices,
  onOpenService,
  onCloseBrowser,
  isBrowserOpen,
  onDeleteService,
  globalServices,
  onQuickAddService,
}) => {
  // ── Hooks ──
  const { accentColors, UNIFIED_ACCENT } = useAccentColors();

  if (typeof accentColors !== 'undefined' && accentColors.length > 0) {
    setAccentColorsForDetailView(accentColors, UNIFIED_ACCENT);
  }

  // ── Quick account switcher state ──
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchQuery, setSwitchQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredAccounts = useMemo(() => {
    if (!switchQuery.trim()) return accounts.filter((a) => a.id !== focusedAccount?.id);
    const q = switchQuery.toLowerCase();
    return accounts.filter(
      (a) => a.email.toLowerCase().includes(q) && a.id !== focusedAccount?.id,
    );
  }, [accounts, switchQuery, focusedAccount]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [switchQuery]);

  useEffect(() => {
    if (isSwitching && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isSwitching]);

  // Ctrl+F shortcut — only when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        e.stopPropagation();
        if (!isSwitching) {
          setSwitchQuery('');
          setIsSwitching(true);
        } else {
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      }
      if (e.key === 'Escape' && isSwitching) {
        e.preventDefault();
        e.stopPropagation();
        setIsSwitching(false);
        setSwitchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isSwitching]);

  const handleSelectSwitch = (account: Account) => {
    onSelectAccount(account);
    setIsSwitching(false);
    setSwitchQuery('');
  };

  const handleSwitchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filteredAccounts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAccounts[highlightIndex]) {
        handleSelectSwitch(filteredAccounts[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSwitching(false);
      setSwitchQuery('');
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (!dropdownRef.current) return;
    const items = dropdownRef.current.querySelectorAll('[data-switch-item]');
    items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex]);

  const tabs = [
    { id: 'info', label: 'Information', icon: User },
    { id: 'services', label: 'Services', icon: LayoutGrid },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'fingerprint', label: 'Fingerprint', icon: Shield },
    { id: 'password', label: 'Passwords', icon: Key },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  // ── Render ──
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl h-[80vh]" hideCloseButton>
      {/* Custom header with quick account switcher */}
      <div className="px-5 border-b border-divider shrink-0 flex items-center gap-3 py-3 relative">
        <div className="flex-1 min-w-0 relative">
          {isSwitching ? (
            <Dropdown
              open={isSwitching}
              onOpenChange={(v) => {
                if (!v) {
                  setIsSwitching(false);
                  setSwitchQuery('');
                }
              }}
              side="bottom"
              align="start"
              fullWidth
              strategy="fixed"
              closeOnSelect={false}
            >
              <DropdownTrigger>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    ref={inputRef}
                    value={switchQuery}
                    onChange={(e) => setSwitchQuery(e.target.value)}
                    onKeyDown={handleSwitchKeyDown}
                    placeholder="Search email to switch..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-input-background border border-border text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
              </DropdownTrigger>
              <DropdownContent className="max-h-60 custom-scrollbar">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account, idx) => (
                    <DropdownItem
                      key={account.id}
                      onClick={() => handleSelectSwitch(account)}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      className={cn(
                        'truncate',
                        idx === highlightIndex && 'bg-primary/10 text-primary',
                      )}
                    >
                      {account.email}
                    </DropdownItem>
                  ))
                ) : switchQuery.trim() ? (
                  <div className="px-3 py-2 text-sm text-text-tertiary">No matching accounts</div>
                ) : null}
              </DropdownContent>
            </Dropdown>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSwitchQuery('');
                setIsSwitching(true);
              }}
              className="group flex items-center gap-2 min-w-0 cursor-pointer rounded-md px-1 -ml-1 hover:bg-muted/50 transition-colors"
              title="Click or Ctrl+F to switch account"
            >
              <h3 className="text-base font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                {editedAccount?.email || 'Email Detail'}
              </h3>
            </button>
          )}
          {!isSwitching && (
            <p className="text-xs text-text-secondary mt-0.5 truncate">Email account management</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg border border-border text-text-secondary hover:border-error hover:text-error hover:bg-error/10 transition-all shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border shrink-0 bg-card/20 backdrop-blur-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab(tab.id as any);
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'text-[--tab-color]'
                : 'text-text-secondary hover:text-foreground',
            )}
            style={
              {
                '--tab-color': getTabColor(tab.id).base,
                background: activeTab === tab.id ? getTabColor(tab.id).bg : undefined,
              } as React.CSSProperties
            }
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <ModalBody className="p-0 flex-1 overflow-hidden flex flex-col border-t border-divider">
        {activeTab === 'history' ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <HistoryTab email={editedAccount?.email || ''} />
          </div>
        ) : activeTab === 'fingerprint' ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <FingerprintTab email={editedAccount?.email || ''} />
          </div>
        ) : activeTab === 'security' ? (
          <SecurityTab account={editedAccount} />
        ) : (
          <div className="flex-1 overflow-y-scroll overscroll-contain custom-scrollbar">
            {activeTab === 'info' ? (
              <InfoTab
                editedAccount={editedAccount}
                setEditedAccount={setEditedAccount}
                onUpdateAccount={onUpdateAccount}
                validateField={validateField}
                errors={errors}
                backupCodeSearch={backupCodeSearch}
                setBackupCodeSearch={setBackupCodeSearch}
                recoveryEmailSuggestions={recoveryEmailSuggestions}
              />
            ) : activeTab === 'services' ? (
              <ServicesTab
                serviceSearch={serviceSearch}
                setServiceSearch={setServiceSearch}
                accountServices={accountServices}
                onOpenService={onOpenService}
                onCloseBrowser={onCloseBrowser}
                isBrowserOpen={isBrowserOpen}
                onDeleteService={onDeleteService}
                email={editedAccount?.email || ''}
                globalServices={globalServices}
                onQuickAddService={onQuickAddService}
              />
            ) : activeTab === 'password' ? (
              <PasswordTab email={editedAccount?.email || ''} />
            ) : null}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default EmailModal;