import { Shield, Save, X } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';

interface ReviewDrawerProps {
  pendingChanges: any[];
  allMethods: any[];
  getMethodStyle: (type: string) => any;
  onComplete: () => void;
  onClose: () => void;
}

export const ReviewDrawer = ({
  pendingChanges,
  allMethods,
  getMethodStyle,
  onComplete,
  onClose,
}: ReviewDrawerProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Review Changes</h2>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              Verify your updates
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-6 p-6 custom-scrollbar">
        {['Information', 'Two-Factor Authentication'].map((area) => {
          const areaChanges = pendingChanges.filter((c) => c.area === area);
          if (areaChanges.length === 0) return null;
          return (
            <div key={area} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">{area}</h3>
              <div className="space-y-3">
                {areaChanges.map((c, i) => {
                  if (area === 'Two-Factor Authentication' && c.methodId) {
                    const method = allMethods.find((m) => m.id === c.methodId)!;
                    const style = getMethodStyle(method.type);
                    const Icon = style.icon;

                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex items-start gap-4 p-3 rounded-lg border',
                          c.type === 'add'
                            ? 'border-green-500/30 bg-green-500/5'
                            : c.type === 'modify'
                              ? 'border-yellow-500/30 bg-yellow-500/5'
                              : 'border-red-500/30 bg-red-500/5',
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                            style.bg,
                            style.text,
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm truncate text-foreground/90">
                              {c.label}
                            </span>
                            <span
                              className={cn(
                                'text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter shrink-0',
                                c.type === 'add' && 'text-green-600 bg-green-500/10',
                                c.type === 'modify' && 'text-yellow-600 bg-yellow-500/10',
                                c.type === 'delete' && 'text-red-600 bg-red-500/10',
                              )}
                            >
                              {c.type === 'modify' ? 'Modified' : c.type}
                            </span>
                          </div>
                          <div className="grid gap-1 px-1 text-[11px]">
                            {(c.type === 'modify' || c.type === 'delete') && (
                              <div className="flex gap-2 min-w-0">
                                <span className="text-muted-foreground w-8 shrink-0">FROM</span>
                                <span className="text-red-500 line-through truncate">
                                  {c.oldValue || '—'}
                                </span>
                              </div>
                            )}
                            {(c.type === 'modify' || c.type === 'add') && (
                              <div className="flex gap-2 min-w-0">
                                <span className="text-muted-foreground w-8 shrink-0">TO</span>
                                <span className="text-green-600 font-semibold truncate">
                                  {c.newValue || '—'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex flex-col gap-2 p-3 rounded-lg border',
                        c.type === 'add'
                          ? 'border-green-500/30 bg-green-500/5'
                          : c.type === 'modify'
                            ? 'border-yellow-500/30 bg-yellow-500/5'
                            : 'border-red-500/30 bg-red-500/5',
                      )}
                    >
                      <div className="flex justify-between items-center pr-1">
                        <span className="font-bold text-sm truncate text-foreground/90">
                          {c.label}
                        </span>
                        <span
                          className={cn(
                            'text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter shrink-0',
                            c.type === 'add' && 'text-green-600 bg-green-500/10',
                            c.type === 'modify' && 'text-yellow-600 bg-yellow-500/10',
                            c.type === 'delete' && 'text-red-600 bg-red-500/10',
                          )}
                        >
                          {c.type === 'modify' ? 'Modified' : c.type}
                        </span>
                      </div>
                      <div className="grid gap-1 px-1 text-[11px]">
                        {(c.type === 'modify' || c.type === 'delete') && (
                          <div className="flex gap-2 min-w-0">
                            <span className="text-muted-foreground w-10 shrink-0">FROM</span>
                            <span className="text-red-500 line-through truncate">
                              {c.oldValue || '—'}
                            </span>
                          </div>
                        )}
                        {(c.type === 'modify' || c.type === 'add') && (
                          <div className="flex gap-2 min-w-0">
                            <span className="text-muted-foreground w-10 shrink-0">TO</span>
                            <span className="text-green-600 font-semibold truncate">
                              {c.newValue || '—'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-4 border-t border-border mt-auto flex flex-col gap-3 shrink-0">
        <button
          onClick={onComplete}
          className="w-full h-10 bg-primary text-primary-foreground rounded-md font-semibold flex items-center justify-center gap-2 transform active:scale-[0.99] transition-all hover:bg-primary/90 text-sm"
        >
          <Save className="w-4 h-4" />
          Complete Update
        </button>
      </div>
    </div>
  );
};
