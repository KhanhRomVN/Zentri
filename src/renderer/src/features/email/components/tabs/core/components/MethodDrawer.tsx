import { Plus, Trash2, Save, X } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';

interface MethodDrawerProps {
  drawerMode: 'edit' | 'add';
  currentFocusedMethod: any;
  availableToAdd: any[];
  drawerForm: { value: string; label: string };
  setDrawerForm: (form: any) => void;
  setNewMethodTypeId: (id: string) => void;
  newMethodTypeId: string;
  getMethodStyle: (type: string) => any;
  handleSave: () => void;
  handleRemove: () => void;
  onCancel: () => void;
}

export const MethodDrawer = ({
  drawerMode,
  currentFocusedMethod,
  availableToAdd,
  drawerForm,
  setDrawerForm,
  setNewMethodTypeId,
  newMethodTypeId,
  getMethodStyle,
  handleSave,
  handleRemove,
  onCancel,
}: MethodDrawerProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
        {currentFocusedMethod ? (
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">{currentFocusedMethod.name}</h2>
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase',
                drawerMode === 'edit'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-primary/10 text-primary',
              )}
            >
              {drawerMode === 'edit' ? 'Active' : 'New'}
            </span>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold tracking-tight">Add 2FA Method</h2>
          </div>
        )}
        <button
          onClick={onCancel}
          className="p-2 -mr-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto p-4 custom-scrollbar">
        {drawerMode === 'add' && !newMethodTypeId ? (
          <div className="grid gap-3">
            {availableToAdd.map((m) => (
              <button
                key={m.id}
                onClick={() => setNewMethodTypeId(m.id)}
                className="flex items-center gap-4 p-3 rounded-md border border-transparent hover:border-dropdown-borderHover hover:bg-dropdown-itemHover text-left transition-all"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    getMethodStyle(m.type).bg,
                    getMethodStyle(m.type).text,
                  )}
                >
                  {(() => {
                    const Icon = getMethodStyle(m.type).icon;
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>
                <div>
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-muted-foreground">Click to configure</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium">Identifier / Value</label>
            <input
              className="flex h-11 w-full rounded-lg border border-border bg-input px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={drawerForm.value}
              onChange={(e) => setDrawerForm((p: any) => ({ ...p, value: e.target.value }))}
              autoFocus
            />
            <p className="text-xs text-muted-foreground italic">
              Detailed configuration value (unmasked).
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border flex items-center gap-3 shrink-0">
        {drawerMode === 'edit' && (
          <button
            onClick={handleRemove}
            className="h-10 px-4 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 mr-auto transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex-1 h-10 rounded-md bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="h-10 px-6 rounded-md border border-border hover:bg-muted transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
