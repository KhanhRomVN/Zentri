import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';

interface TwoFactorSectionProps {
  activeMethods: string[];
  deletedMethods: string[];
  allMethods: any[];
  methodValues: Record<string, string>;
  initialActiveMethods: string[];
  initialMethodValues: Record<string, string>;
  selectedMethodId: string | null;
  onMethodClick: (id: string) => void;
  onAddClick: () => void;
  getMethodStyle: (type: string) => any;
}

export const TwoFactorSection = ({
  activeMethods,
  deletedMethods,
  allMethods,
  methodValues,
  initialActiveMethods,
  initialMethodValues,
  selectedMethodId,
  onMethodClick,
  onAddClick,
  getMethodStyle,
}: TwoFactorSectionProps) => {
  return (
    <div className="animate-in slide-in-from-bottom-2 duration-500 delay-200">
      <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
        <span className="text-base font-semibold tracking-tight">Two-Factor Authentication</span>
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md"
        >
          <Plus className="w-3.5 h-3.5" /> Add Method
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...activeMethods, ...deletedMethods].map((id) => {
          const method = allMethods.find((m) => m.id === id)!;
          const value = methodValues[id];
          const style = getMethodStyle(method.type);
          const Icon = style.icon;
          const isAdded = !initialActiveMethods.includes(id);
          const isDeleted = deletedMethods.includes(id);
          const isModified =
            initialActiveMethods.includes(id) && methodValues[id] !== initialMethodValues[id];

          return (
            <div
              key={id}
              onClick={() => !isDeleted && onMethodClick(id)}
              className={cn(
                'group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300',
                !isDeleted
                  ? 'cursor-pointer border-border hover:border-primary/40'
                  : 'cursor-not-allowed border-red-500 border-dashed bg-red-500/5 opacity-60',
                'bg-card shadow-sm',
                isAdded && 'border-green-500 border-dashed',
                isModified && !isDeleted && 'border-yellow-500 border-dashed',
                selectedMethodId === id && 'ring-2 ring-primary border-primary',
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                  style.bg,
                  style.text,
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0 pr-4">
                <h3 className="font-medium text-sm truncate">{method.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {value || method.placeholder}
                </p>
              </div>
              {!isDeleted ? (
                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
              ) : (
                <Trash2 className="absolute top-4 right-4 w-3 h-3 text-red-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
