import { X, Save, Trash2, Plus, Key, Lock, Shield, Check } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';

interface UnifiedDrawerProps {
  activeDrawer: '2fa' | 'secret' | 'review' | null;
  onClose: () => void;
  // 2FA props
  drawer2FAMode?: 'edit' | 'add';
  currentFocusedMethod?: any;
  availableToAdd?: any[];
  drawer2FAValue?: string;
  setDrawer2FAValue?: (v: string) => void;
  setNewMethodTypeId?: (id: string) => void;
  newMethodTypeId?: string;
  getMethodStyle?: (type: string) => any;
  handleSave2FA?: () => void;
  handleDelete2FA?: () => void;
  // Secret props
  secretDrawerMode?: 'edit' | 'add';
  secretForm?: { key: string; value: string };
  setSecretForm?: (f: any) => void;
  handleSaveSecret?: () => void;
  handleDeleteSecret?: () => void;
  // Review props
  pendingChanges?: any[];
  allMethods?: any[];
  onCompleteReview?: () => void;
}

export const UnifiedDrawer = ({
  activeDrawer,
  onClose,
  drawer2FAMode,
  currentFocusedMethod,
  availableToAdd,
  drawer2FAValue,
  setDrawer2FAValue,
  setNewMethodTypeId,
  newMethodTypeId,
  getMethodStyle,
  handleSave2FA,
  handleDelete2FA,
  secretDrawerMode,
  secretForm,
  setSecretForm,
  handleSaveSecret,
  handleDeleteSecret,
  pendingChanges,
  allMethods,
  onCompleteReview,
}: UnifiedDrawerProps) => {
  return (
    <>
      <div
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in transition-all',
          activeDrawer ? 'block' : 'hidden',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute top-0 right-0 h-full w-[35%] bg-background border-l border-border z-50 shadow-2xl transition-transform duration-500 ease-in-out transform p-8 flex flex-col',
          activeDrawer ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {activeDrawer === '2fa' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-4 mb-8">
              {currentFocusedMethod ? (
                <>
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                      getMethodStyle!(currentFocusedMethod.type).bg,
                      getMethodStyle!(currentFocusedMethod.type).text,
                    )}
                  >
                    {(() => {
                      const Icon = getMethodStyle!(currentFocusedMethod.type).icon;
                      return <Icon className="w-7 h-7" />;
                    })()}
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">{currentFocusedMethod.name}</h2>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                    <Plus className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Add 2FA Method</h2>
                    <p className="text-xs text-muted-foreground">Select a method</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6 flex-1">
              {drawer2FAMode === 'add' && !newMethodTypeId ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase border-b border-border/40 pb-2">
                    Available Methods
                  </h3>
                  <div className="grid gap-3">
                    {availableToAdd?.map((m) => {
                      const style = getMethodStyle!(m.type);
                      const Icon = style.icon;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setNewMethodTypeId!(m.id)}
                          className="flex items-center gap-4 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left"
                        >
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              style.bg,
                              style.text,
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{m.name}</div>
                            <div className="text-xs text-muted-foreground">Click to configure</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase border-b border-border/40 pb-2">
                    Configuration
                  </h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Identifier / Value</label>
                    <input
                      className="flex h-11 w-full rounded-lg border border-border bg-input px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={drawer2FAValue}
                      onChange={(e) => setDrawer2FAValue!(e.target.value)}
                      placeholder={currentFocusedMethod?.placeholder}
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border mt-auto flex items-center gap-3">
              {drawer2FAMode === 'edit' && (
                <button
                  onClick={handleDelete2FA}
                  className="h-11 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors mr-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                disabled={drawer2FAMode === 'add' && !newMethodTypeId}
                onClick={handleSave2FA}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {drawer2FAMode === 'add' ? 'Add Method' : 'Save Changes'}
              </button>
              <button
                onClick={onClose}
                className="h-11 px-6 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeDrawer === 'secret' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
                <Key className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {secretDrawerMode === 'add' ? 'Add New Secret' : 'Edit Secret'}
              </h2>
            </div>
            <div className="space-y-6 flex-1">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase border-b border-border/40 pb-2">
                  Configuration
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Key Name</label>
                  <input
                    className="flex h-11 w-full rounded-lg border border-border bg-input px-4 text-sm font-mono focus-visible:outline-none"
                    value={secretForm?.key}
                    onChange={(e) => setSecretForm!((p: any) => ({ ...p, key: e.target.value }))}
                    placeholder="e.g. API_KEY"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Value</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-lg border border-border bg-input px-4 py-3 text-sm font-mono resize-none focus-visible:outline-none"
                    value={secretForm?.value}
                    onChange={(e) => setSecretForm!((p: any) => ({ ...p, value: e.target.value }))}
                    placeholder="Paste secret here..."
                  />
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-border mt-auto flex items-center gap-3">
              {secretDrawerMode === 'edit' && (
                <button
                  onClick={handleDeleteSecret}
                  className="h-11 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors mr-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSaveSecret}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Secret
              </button>
              <button
                onClick={onClose}
                className="h-11 px-6 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeDrawer === 'review' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Review Changes</h2>
                <p className="text-xs text-muted-foreground">Verify your service updates</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {pendingChanges && pendingChanges.length > 0 ? (
                <div className="space-y-6">
                  {['Two-Factor Authentication', 'Secrets & Keys'].map((area) => {
                    const areaChanges = pendingChanges.filter((c) => c.area === area);
                    if (areaChanges.length === 0) return null;

                    return (
                      <div key={area} className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          {area}
                        </h3>
                        <div className="space-y-3">
                          {areaChanges.map((c, i) => {
                            const is2FA = area === 'Two-Factor Authentication';
                            const style = is2FA
                              ? getMethodStyle!(allMethods?.find((m) => m.id === c.methodId)!.type)
                              : { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Lock };
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
                                        <span className="text-muted-foreground w-8 shrink-0">
                                          FROM
                                        </span>
                                        <span className="text-red-500 line-through truncate">
                                          {c.oldValue || '—'}
                                        </span>
                                      </div>
                                    )}
                                    {(c.type === 'modify' || c.type === 'add') && (
                                      <div className="flex gap-2 min-w-0">
                                        <span className="text-muted-foreground w-8 shrink-0">
                                          TO
                                        </span>
                                        <span className="text-green-600 font-semibold truncate">
                                          {c.newValue || '—'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Check className="w-8 h-8 opacity-20" />
                  <p>No changes to review</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border mt-auto flex flex-col gap-3">
              <button
                onClick={onCompleteReview}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Complete Update
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
