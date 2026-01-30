import { Plus, Trash2, Save } from 'lucide-react';
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
    <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
      <div className="flex items-center gap-4 mb-8">
        {currentFocusedMethod ? (
          <>
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                getMethodStyle(currentFocusedMethod.type).bg,
                getMethodStyle(currentFocusedMethod.type).text,
              )}
            >
              {(() => {
                const Icon = getMethodStyle(currentFocusedMethod.type).icon;
                return <Icon className="w-7 h-7" />;
              })()}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{currentFocusedMethod.name}</h2>
              <span
                className={cn(
                  'inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase',
                  drawerMode === 'edit'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-primary/10 text-primary',
                )}
              >
                {drawerMode === 'edit' ? 'Active' : 'New Configuration'}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
              <Plus className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Add 2FA Method</h2>
              <p className="text-xs text-muted-foreground">Select a method to configure</p>
            </div>
          </>
        )}
      </div>

      <div className="space-y-6 flex-1">
        {drawerMode === 'add' && !newMethodTypeId ? (
          <div className="grid gap-3">
            {availableToAdd.map((m) => (
              <button
                key={m.id}
                onClick={() => setNewMethodTypeId(m.id)}
                className="flex items-center gap-4 p-3 rounded-xl border hover:border-primary/40 hover:bg-muted/30 text-left transition-all"
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

      <div className="pt-6 border-t flex items-center gap-3">
        {drawerMode === 'edit' && (
          <button
            onClick={handleRemove}
            className="h-11 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 mr-auto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
        <button onClick={onCancel} className="h-11 px-6 rounded-lg border hover:bg-muted">
          Cancel
        </button>
      </div>
    </div>
  );
};
