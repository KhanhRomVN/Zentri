import { FC } from 'react';
import { User, LayoutGrid, Undo2, Trash, Clock, Database } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { useAccentColors } from '../../../hooks/useAccentColors';

import { Account } from '../types';
import InfoTab from './tabs/InfoTab';
import ServicesTab from './tabs/ServicesTab';
import SessionsTab from './tabs/SessionsTab';
import HistoryTab from './tabs/HistoryTab';

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
  activeTab: 'info' | 'services' | 'sessions' | 'history';
  setActiveTab: (tab: 'info' | 'services' | 'sessions' | 'history') => void;
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
}) => {
  const { accentColors, UNIFIED_ACCENT } = useAccentColors();

  if (typeof accentColors !== 'undefined' && accentColors.length > 0) {
    setAccentColorsForDetailView(accentColors, UNIFIED_ACCENT);
  }

  return (
    <div className="flex bg-table-hoverItemBodyBg/5 overflow-hidden min-h-[calc(100vh-220px)]">
      <div className="w-64 border-l border-r border-border bg-card/20 backdrop-blur-xl flex flex-col pt-4 shrink-0 overflow-hidden relative">
        <div className="flex-1 space-y-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('info');
            }}
            className={cn(
              'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all relative group',
              activeTab === 'info'
                ? 'text-[--tab-color]'
                : 'text-muted-foreground hover:text-foreground',
            )}
            style={
              {
                '--tab-color': getTabColor('info').base,
                background:
                  activeTab === 'info'
                    ? `linear-gradient(to right, ${getTabColor('info').bg}, transparent)`
                    : undefined,
              } as React.CSSProperties
            }
          >
            {activeTab === 'info' && (
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-lg"
                style={{
                  backgroundColor: getTabColor('info').base,
                  boxShadow: getTabColor('info').glow,
                }}
              />
            )}
            <User
              className={cn(
                'w-5 h-5 ml-6 transition-colors',
                activeTab === 'info' ? 'text-[--tab-color]' : 'text-muted-foreground/50',
              )}
              style={
                activeTab === 'info'
                  ? ({ '--tab-color': getTabColor('info').base } as React.CSSProperties)
                  : undefined
              }
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
                ? 'text-[--tab-color]'
                : 'text-muted-foreground hover:text-foreground',
            )}
            style={
              {
                '--tab-color': getTabColor('services').base,
                background:
                  activeTab === 'services'
                    ? `linear-gradient(to right, ${getTabColor('services').bg}, transparent)`
                    : undefined,
              } as React.CSSProperties
            }
          >
            {activeTab === 'services' && (
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-lg"
                style={{
                  backgroundColor: getTabColor('services').base,
                  boxShadow: getTabColor('services').glow,
                }}
              />
            )}
            <LayoutGrid
              className={cn(
                'w-5 h-5 ml-6 transition-colors',
                activeTab === 'services' ? 'text-[--tab-color]' : 'text-muted-foreground/50',
              )}
              style={
                activeTab === 'services'
                  ? ({ '--tab-color': getTabColor('services').base } as React.CSSProperties)
                  : undefined
              }
            />
            <span>Services</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('sessions');
            }}
            className={cn(
              'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all relative group',
              activeTab === 'sessions'
                ? 'text-[--tab-color]'
                : 'text-muted-foreground hover:text-foreground',
            )}
            style={
              {
                '--tab-color': getTabColor('sessions').base,
                background:
                  activeTab === 'sessions'
                    ? `linear-gradient(to right, ${getTabColor('sessions').bg}, transparent)`
                    : undefined,
              } as React.CSSProperties
            }
          >
            {activeTab === 'sessions' && (
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-lg"
                style={{
                  backgroundColor: getTabColor('sessions').base,
                  boxShadow: getTabColor('sessions').glow,
                }}
              />
            )}
            <Database
              className={cn(
                'w-5 h-5 ml-6 transition-colors',
                activeTab === 'sessions' ? 'text-[--tab-color]' : 'text-muted-foreground/50',
              )}
              style={
                activeTab === 'sessions'
                  ? ({ '--tab-color': getTabColor('sessions').base } as React.CSSProperties)
                  : undefined
              }
            />
            <span>Sessions</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('history');
            }}
            className={cn(
              'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all relative group',
              activeTab === 'history'
                ? 'text-[--tab-color]'
                : 'text-muted-foreground hover:text-foreground',
            )}
            style={
              {
                '--tab-color': getTabColor('history').base,
                background:
                  activeTab === 'history'
                    ? `linear-gradient(to right, ${getTabColor('history').bg}, transparent)`
                    : undefined,
              } as React.CSSProperties
            }
          >
            {activeTab === 'history' && (
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-lg"
                style={{
                  backgroundColor: getTabColor('history').base,
                  boxShadow: getTabColor('history').glow,
                }}
              />
            )}
            <Clock
              className={cn(
                'w-5 h-5 ml-6 transition-colors',
                activeTab === 'history' ? 'text-[--tab-color]' : 'text-muted-foreground/50',
              )}
              style={
                activeTab === 'history'
                  ? ({ '--tab-color': getTabColor('history').base } as React.CSSProperties)
                  : undefined
              }
            />
            <span>History</span>
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
            />
          ) : activeTab === 'sessions' ? (
            <SessionsTab email={editedAccount?.email || ''} accountId={focusedAccount?.id || ''} />
          ) : (
            <HistoryTab email={editedAccount?.email || ''} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailView;
