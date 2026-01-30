import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';

interface TwoFactorSectionProps {
  activeMethods: string[];
  deletedMethods: string[];
  allMethods: any[];
  methodValues: Record<string, string>;
  initialActiveMethods: string[];
  initialMethodValues: Record<string, string>;
  onMethodClick: (id: string) => void;
  onAddClick: () => void;
  getFaviconUrl: (url: string) => string;
  websiteUrl: string;
}

export const TwoFactorSection = ({
  activeMethods,
  deletedMethods,
  allMethods,
  methodValues,
  initialActiveMethods,
  initialMethodValues,
  onMethodClick,
  onAddClick,
  getFaviconUrl,
  websiteUrl,
}: TwoFactorSectionProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
        <span className="text-base font-semibold tracking-tight">Two-Factor Authentication</span>
        <button
          onClick={onAddClick}
          className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Method
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...activeMethods, ...deletedMethods].map((id) => {
          const method = allMethods.find((m) => m.id === id)!;
          const value = methodValues[id];
          const isDeleted = deletedMethods.includes(id);
          const isAdded = !initialActiveMethods.includes(id);
          const isModified =
            initialActiveMethods.includes(id) && methodValues[id] !== initialMethodValues[id];

          return (
            <div
              key={method.id}
              onClick={() => !isDeleted && onMethodClick(method.id)}
              className={cn(
                'group relative flex items-center gap-4 py-3 px-4 rounded-xl border transition-all',
                !isDeleted
                  ? 'cursor-pointer border-border hover:border-primary/40'
                  : 'cursor-not-allowed border-red-500 border-dashed bg-red-500/5 opacity-60',
                'bg-card shadow-sm',
                isAdded && 'border-green-500 border-dashed',
                isModified && !isDeleted && 'border-yellow-500 border-dashed',
              )}
            >
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <img
                  src={getFaviconUrl(websiteUrl)}
                  alt={method.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-medium text-sm text-foreground">{method.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {value || method.placeholder}
                </p>
              </div>
              {!isDeleted && (
                <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500" />
              )}
              {isDeleted && (
                <div className="absolute top-3 right-3 text-red-500">
                  <Trash2 className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
