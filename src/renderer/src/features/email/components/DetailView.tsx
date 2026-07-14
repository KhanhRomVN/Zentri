import { FC } from 'react';
import { User, LayoutGrid, Undo2, Trash, Clock, Database, Bookmark } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { useAccentColors } from '../../../hooks/useAccentColors';

import { Account } from '../types';
import InfoTab from './tabs/InfoTab';
import ServicesTab from './tabs/ServicesTab';
import SessionsTab from './tabs/SessionsTab';
import HistoryTab from './tabs/HistoryTab';
import BookmarkTab from './tabs/BookmarkTab';

// ─── Color Helper ──────────────────────────────────────────────────────────
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

interface DetailViewProps {
  focusedAccount: Account | null;
  accounts: Account[];
  activeTab: 'info' | 'services' | 'sessions' | 'history' | 'bookmarks';
  setActiveTab: (tab: 'info' | 'services' | 'sessions' | 'history' | 'bookmarks') => void;
  avatars: Record<string, string>;
  onSelectAccount: (account: Account) => void;
  onContextMenu: (e: React.MouseEvent, accountId: string) => void;
  onServiceContextMenu: (e: React.MouseEvent, linkId: string) => void;
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
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

const DetailView: FC<DetailViewProps> = ({
  focusedAccount,
  activeTab,
  setActiveTab,
  onServiceContextMenu,
  onRestore,
  onHardDelete,
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
  const { accentColors, UNIFIED_ACCENT } = useAccentColors();

  if (typeof accentColors !== 'undefined' && accentColors.length > 0) {
    setAccentColorsForDetailView(accentColors, UNIFIED_ACCENT);
  }

  return (
    <div className="flex bg-table-hoverItemBodyBg/5 overflow-hidden min-h-[calc(100vh-135px)]">
      <div className="w-64 border-r border-border bg-card/20 backdrop-blur-xl flex flex-col pt-4 shrink-0 overflow-hidden relative">
        <div className="flex-1 space-y-1 px-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('info');
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all relative group',
              activeTab === 'info'
                ? 'text-[--tab-color]'
                : 'text-text-primary hover:text-foreground',
            )}
            style={
              {
                '--tab-color': getTabColor('info').base,
                background: activeTab === 'info' ? getTabColor('info').bg : undefined,
              } as React.CSSProperties
            }
          >
            <User className="w-5 h-5 transition-colors" />
            <span>Information</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('services');
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all relative group',
              activeTab === 'services'
                ? 'text-[--tab-color]'
                : 'text-text-primary hover:text-foreground',
            )}
            style={
              {
                '--tab-color': getTabColor('services').base,
                background: activeTab === 'services' ? getTabColor('services').bg : undefined,
              } as React.CSSProperties
            }
          >
            <LayoutGrid className="w-5 h-5 transition-colors" />
            <span>Services</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('sessions');
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all relative group',
              activeTab === 'sessions'
                ? 'text-[--tab-color]'
                : 'text-text-primary hover:text-foreground',
            )}
            style={
              {
                '--tab-color': getTabColor('sessions').base,
                background: activeTab === 'sessions' ? getTabColor('sessions').bg : undefined,
              } as React.CSSProperties
            }
          >
            <Database className="w-5 h-5 transition-colors" />
            <span>Sessions</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('history');
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all relative group',
              activeTab === 'history'
                ? 'text-[--tab-color]'
                : 'text-text-primary hover:text-foreground',
            )}
            style={
              {
                '--tab-color': getTabColor('history').base,
                background: activeTab === 'history' ? getTabColor('history').bg : undefined,
              } as React.CSSProperties
            }
          >
            <Clock className="w-5 h-5 transition-colors" />
            <span>History</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('bookmarks');
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all relative group',
              activeTab === 'bookmarks'
                ? 'text-[--tab-color]'
                : 'text-text-primary hover:text-foreground',
            )}
            style={
              {
                '--tab-color': getTabColor('bookmarks').base,
                background: activeTab === 'bookmarks' ? getTabColor('bookmarks').bg : undefined,
              } as React.CSSProperties
            }
          >
            <Bookmark className="w-5 h-5 transition-colors" />
            <span>Bookmarks</span>
          </button>
        </div>

        {focusedAccount?.status === 'deleting' && (
          <div className="p-4 border-t border-border/30 bg-amber-500/5 space-y-3 shrink-0">
            <button
              onClick={() => onRestore(focusedAccount.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Restore
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
              onServiceContextMenu={onServiceContextMenu}
              onOpenService={onOpenService}
              onDeleteService={onDeleteService}
            />
          ) : activeTab === 'sessions' ? (
            <SessionsTab email={editedAccount?.email || ''} accountId={focusedAccount?.id || ''} />
          ) : activeTab === 'history' ? (
            <HistoryTab email={editedAccount?.email || ''} />
          ) : (
            <BookmarkTab email={editedAccount?.email || ''} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailView;