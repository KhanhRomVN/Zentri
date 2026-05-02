import { FC, RefObject } from 'react';
import { Globe, Eye, Undo2, Trash, Trash2, Zap, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Account } from '../types';
import Portal from '../../../shared/components/ui/Portal';

interface ContextMenuProps {
  menuRef: RefObject<HTMLDivElement>;
  contextMenu: { x: number; y: number; accountId: string } | null;
  setContextMenu: (val: any) => void;
  accounts: Account[];
  onSelectAccount: (account: Account) => void;
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
  onSoftDelete: (id: string) => void;
  onLaunchRequest: (account: Account, mode: 'normal' | 'secure') => void;
  browserVersion: string;
}

const ContextMenu: FC<ContextMenuProps> = ({
  menuRef,
  contextMenu,
  setContextMenu,
  accounts,
  onSelectAccount,
  onRestore,
  onHardDelete,
  onSoftDelete,
  onLaunchRequest,
  browserVersion,
}) => {
  const { t } = useTranslation();
  if (!contextMenu) return null;

  const targetAccount = accounts.find((a) => a.id === contextMenu.accountId);

  return (
    <Portal>
      <div
        ref={menuRef}
        className="fixed z-[1000] min-w-[200px] w-max bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-200"
        style={{ top: contextMenu.y, left: contextMenu.x }}
      >
        {targetAccount?.status === 'active' && (
          <>
            <div className="px-3 py-1.5 text-[9px] font-black text-primary/50 uppercase tracking-[0.2em] flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Wayfern Engine (v{browserVersion})
            </div>
            <button
              onClick={() => {
                onLaunchRequest(targetAccount, 'normal');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-foreground/80 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all whitespace-nowrap"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              {t('email.contextMenu.launchNormal')}
            </button>
            <button
              onClick={() => {
                onLaunchRequest(targetAccount, 'secure');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-foreground/80 hover:text-primary hover:bg-primary/10 rounded-xl transition-all whitespace-nowrap"
            >
              <Shield className="w-4 h-4 text-primary" />
              {t('email.contextMenu.launchSecure')}
            </button>
            <div className="h-px bg-border/30 my-1 mx-2" />
          </>
        )}

        <button
          onClick={() => {
            if (targetAccount) onSelectAccount(targetAccount);
            setContextMenu(null);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-xl transition-all whitespace-nowrap"
        >
          <Eye className="w-4 h-4 text-blue-500/50" />
          {t('email.contextMenu.view')}
        </button>

        <div className="h-px bg-border/30 my-1 mx-2" />

        {targetAccount?.status === 'deleting' ? (
          <>
            <button
              onClick={() => {
                onRestore(contextMenu.accountId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-emerald-500/70 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all whitespace-nowrap"
            >
              <Undo2 className="w-4 h-4" />
              {t('email.contextMenu.restore')}
            </button>
            <button
              onClick={() => {
                onHardDelete(contextMenu.accountId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all whitespace-nowrap"
            >
              <Trash className="w-4 h-4" />
              {t('email.contextMenu.deletePermanently')}
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              onSoftDelete(contextMenu.accountId);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            {t('email.contextMenu.delete')}
          </button>
        )}
      </div>
    </Portal>
  );
};

export default ContextMenu;
