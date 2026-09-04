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
import { FC } from 'react';

// ── UI ──
import { User, LayoutGrid, Clock, Shield, ShieldCheck } from 'lucide-react';
import { Modal, ModalHeader, ModalBody } from '../../../../../components/ui/Modal';

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
    | 'security';
  setActiveTab: (
    tab:
      | 'info'
      | 'services'
      | 'sessions'
      | 'history'
      | 'bookmarks'
      | 'fingerprint'
      | 'security',
  ) => void;
  avatars: Record<string, string>;
  onSelectAccount: (account: Account | null) => void;
  onContextMenu: (e: React.MouseEvent, accountId: string) => void;
  onServiceContextMenu?: (e: React.MouseEvent, linkId: string) => void;
  editedAccount: Account | null;
  setEditedAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  validateField: (name: string, value: string) => void;
  errors: Record<string, string>;
  backupCodeSearch: string;
  setBackupCodeSearch: (val: string) => void;
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  accountServices: any[];
  onAddNewServiceLink: () => void;
  onEditServiceLink: (linkId: string) => void;
  onOpenService?: (linkId: string) => void;
  onDeleteService?: (linkId: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────
const EmailModal: FC<EmailModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onServiceContextMenu: _onServiceContextMenu,
  editedAccount,
  setEditedAccount,
  validateField,
  errors,
  backupCodeSearch,
  setBackupCodeSearch,
  serviceSearch,
  setServiceSearch,
  accountServices,
  onAddNewServiceLink,
  onEditServiceLink,
  onOpenService,
  onDeleteService,
}) => {
  // ── Hooks ──
  const { accentColors, UNIFIED_ACCENT } = useAccentColors();

  if (typeof accentColors !== 'undefined' && accentColors.length > 0) {
    setAccentColorsForDetailView(accentColors, UNIFIED_ACCENT);
  }

  const tabs = [
    { id: 'info', label: 'Information', icon: User },
    { id: 'services', label: 'Services', icon: LayoutGrid },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'fingerprint', label: 'Fingerprint', icon: Shield },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  // ── Render ──
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl h-[80vh]" hideCloseButton>
      <ModalHeader
        title={editedAccount?.email || 'Email Detail'}
        description="Email account management"
        onClose={onClose}
      />
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
                validateField={validateField}
                errors={errors}
                backupCodeSearch={backupCodeSearch}
                setBackupCodeSearch={setBackupCodeSearch}
              />
            ) : activeTab === 'services' ? (
              <ServicesTab
                serviceSearch={serviceSearch}
                setServiceSearch={setServiceSearch}
                accountServices={accountServices}
                onAddNewServiceLink={onAddNewServiceLink}
                onEditServiceLink={onEditServiceLink}
                onOpenService={onOpenService}
                onDeleteService={onDeleteService}
                email={editedAccount?.email || ''}
              />
            ) : null}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default EmailModal;