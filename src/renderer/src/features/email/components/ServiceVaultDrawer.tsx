import React, { FC, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Loader2, ShieldCheck, Database, Plus, Copy, Edit2, RotateCcw, X } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { generateTOTP, getTOTPTimeRemaining } from '../utils/totp';

interface ServiceVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  linkId: string;
  serviceName: string;
  serviceUrl?: string;
  currentSecrets: any[];
  loadingSecrets: boolean;
  onAddSecret: (linkId: string, name: string, value: string, type: string) => void;
  onUpdateSecret: (secretId: string, name: string, value: string, type: string) => void;
  onDeleteSecret: (secretId: string) => void;
}

const ServiceVaultDrawer: FC<ServiceVaultDrawerProps> = ({
  isOpen,
  onClose,
  linkId,
  serviceName,
  serviceUrl,
  currentSecrets = [],
  loadingSecrets,
  onAddSecret,
  onUpdateSecret,
  onDeleteSecret,
}) => {
  const [newSecret, setNewSecret] = useState({ name: '', value: '', type: 'text' });
  const [editingSecret, setEditingSecret] = useState<any>(null);
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);
  const [editTypePopoverOpen, setEditTypePopoverOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; secret: any } | null>(null);

  const [, setTotpTick] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTotpTick((t) => t + 1);
      setTimeRemaining(getTOTPTimeRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const getTypeBadgeStyles = (type: string) => {
    switch (type) {
      case 'totp':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/10';
      case 'text':
      default:
        return 'bg-muted/10 text-muted-foreground border-border/10';
    }
  };

  const handleContextMenu = (e: React.MouseEvent, secret: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, secret });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { onClose(); setNewSecret({ name: '', value: '', type: 'text' }); }} />
      <div className="relative w-[500px] h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-foreground">Service Vault</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Active credentials for {serviceName || 'this service'}
            </p>
          </div>
          <button
            onClick={() => { onClose(); setNewSecret({ name: '', value: '', type: 'text' }); }}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col h-full overflow-hidden bg-transparent">
          {/* Service Identity */}
          <div className="px-4 py-3 border-b border-border/10 relative overflow-hidden bg-white/5">
            <div className="flex items-center gap-3.5 relative">
              <div className="relative w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center transition-all duration-500 shadow-2xl">
                {serviceUrl ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(serviceUrl).hostname}&sz=128`}
                    alt={serviceName}
                    className="w-6 h-6 object-contain brightness-110"
                  />
                ) : (
                  <Database className="w-5 h-5 text-primary/80" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-[14px] font-black text-foreground tracking-tight leading-none uppercase truncate">
                  {serviceName || 'Unknown Service'}
                </h3>
                {serviceUrl && (
                  <p className="text-[10px] text-muted-foreground/30 font-bold truncate mt-1.5 tracking-wider font-mono">
                    {new URL(serviceUrl).hostname}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Secrets List */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="px-4 py-4 flex items-center justify-between sticky top-0 bg-card/10 backdrop-blur-md z-10 border-b border-border/5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-3">
                Service Credentials ({currentSecrets.length})
              </label>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all active:scale-95 border border-primary/10"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingSecrets ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-6">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary text-center px-4">
                  Syncing Protected Keys...
                </span>
              </div>
            ) : currentSecrets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-20 gap-10 text-center px-8">
                <div className="relative w-24 h-24 rounded-[2.5rem] bg-muted/30 border border-white/5 flex items-center justify-center">
                  <Database className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-black tracking-[0.2em] uppercase text-foreground/80">
                    Vault is Isolated
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-8 py-3 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all border border-primary/20 shadow-2xl shadow-primary/10"
                  >
                    Start Initialization
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {currentSecrets.map((s, idx) => (
                  <div
                    key={s.id}
                    onContextMenu={(e) => handleContextMenu(e, s)}
                    onClick={() => {
                      setEditingSecret(s);
                      setIsEditModalOpen(true);
                    }}
                    className={cn(
                      'group flex flex-col px-4 py-5 transition-all cursor-pointer relative',
                      'border-b border-white/10',
                      idx === 0 && 'border-t border-white/10',
                      'hover:bg-primary/5',
                    )}
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-[14px] font-bold text-foreground leading-none truncate max-w-[180px]">
                          {s.secret_name}
                        </span>
                        {s.secret_type === 'totp' && (
                          <div className="flex items-center gap-3 px-3 py-1.5 bg-black/40 rounded-lg border border-white/10 opacity-90 group-hover:opacity-100 transition-all shadow-xl">
                            <span className="text-[16px] font-black font-mono tracking-[0.1em] text-primary tabular-nums">
                              {generateTOTP(s.secret_value)}
                            </span>
                            <div className="flex items-center gap-2 border-l border-white/20 pl-3">
                              <span className="text-[11px] font-black font-mono text-primary/60 w-4 text-right">
                                {timeRemaining}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        'px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border shrink-0 opacity-80 group-hover:opacity-100 transition-all shadow-sm',
                        getTypeBadgeStyles(s.secret_type || 'password'),
                      )}>
                        {s.secret_type || 'password'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && createPortal(
        <div
          className="fixed z-[9999] w-48 bg-[#111111] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-1.5 backdrop-blur-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-1.5 mb-1.5 border-b border-white/5">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest truncate">
              Actions for {contextMenu.secret.secret_name}
            </p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(contextMenu.secret.secret_value); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold text-foreground/80 hover:bg-white/5 hover:text-foreground transition-all"
          >
            <Copy className="w-3.5 h-3.5 opacity-50" />Copy Secret
          </button>
          {contextMenu.secret.secret_type === 'totp' && (
            <button
              onClick={() => { navigator.clipboard.writeText(generateTOTP(contextMenu.secret.secret_value)); setContextMenu(null); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold text-primary hover:bg-primary/10 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />Copy OTP Code
            </button>
          )}
          <button
            onClick={() => { setEditingSecret(contextMenu.secret); setIsEditModalOpen(true); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold text-foreground/80 hover:bg-white/5 hover:text-foreground transition-all"
          >
            <Edit2 className="w-3.5 h-3.5 opacity-50" />Edit Meta
          </button>
          <div className="h-px bg-white/5 my-1" />
          <button
            onClick={() => { onDeleteSecret?.(contextMenu.secret.id); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />Purge Secret
          </button>
        </div>,
        document.body,
      )}

      {/* Add Secret Modal */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-[450px] mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground">Register New Service Secret</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Identity Label</label>
                  <input type="text" placeholder="e.g. API Gateway Key" value={newSecret.name}
                    onChange={(e) => setNewSecret((s) => ({ ...s, name: e.target.value }))}
                    className="w-full h-11 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-2.5 relative">
                  <label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Secret Category</label>
                  <div className="relative">
                    <input type="text" readOnly value={newSecret.type === 'totp' ? 'TOTP Secret' : 'Plain Text'}
                      onClick={() => setTypePopoverOpen(!typePopoverOpen)}
                      className="w-full h-11 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground outline-none focus:border-primary/50 cursor-pointer" />
                    {typePopoverOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-2xl z-50 p-1.5 space-y-1">
                        {[{ id: 'text', label: 'Plain Text', icon: <Database className="w-3.5 h-3.5" /> }, { id: 'totp', label: 'TOTP Secret', icon: <ShieldCheck className="w-3.5 h-3.5" /> }].map((type) => (
                          <button key={type.id} onClick={() => { setNewSecret((s) => ({ ...s, type: type.id })); setTypePopoverOpen(false); }}
                            className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all',
                              newSecret.type === type.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                            {type.icon}{type.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Encrypted Secret Value</label>
                <input type="text" placeholder="Paste your secret value here..." value={newSecret.value}
                  onChange={(e) => setNewSecret((s) => ({ ...s, value: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border/50 flex gap-3">
              <button onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-3.5 rounded-xl bg-muted/30 text-[11px] font-bold uppercase tracking-widest hover:bg-muted/50 transition-all border border-border/50 text-muted-foreground">Cancel</button>
              <button onClick={() => { if (newSecret.name && newSecret.value && onAddSecret) { onAddSecret(linkId, newSecret.name, newSecret.value, newSecret.type); setNewSecret({ name: '', value: '', type: 'text' }); setIsAddModalOpen(false); } }}
                disabled={!newSecret.name || !newSecret.value}
                className="flex-[2] py-3.5 rounded-xl bg-primary text-button-bgText text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                <Database className="w-4 h-4" />Store Securely
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Edit Secret Modal */}
      {isEditModalOpen && editingSecret && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setIsEditModalOpen(false); setEditingSecret(null); }} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-[450px] mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground">Override Existing Metadata</h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditingSecret(null); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Identity Label</label>
                  <input type="text" value={editingSecret.secret_name}
                    onChange={(e) => setEditingSecret({ ...editingSecret, secret_name: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-2.5 relative">
                  <label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Secret Category</label>
                  <div className="relative">
                    <input type="text" readOnly value={editingSecret.secret_type === 'totp' ? 'TOTP Secret' : 'Plain Text'}
                      onClick={() => setEditTypePopoverOpen(!editTypePopoverOpen)}
                      className="w-full h-11 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground outline-none focus:border-primary/50 cursor-pointer" />
                    {editTypePopoverOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-2xl z-50 p-1.5 space-y-1">
                        {[{ id: 'text', label: 'Plain Text', icon: <Database className="w-3.5 h-3.5" /> }, { id: 'totp', label: 'TOTP Secret', icon: <ShieldCheck className="w-3.5 h-3.5" /> }].map((type) => (
                          <button key={type.id} onClick={() => { setEditingSecret({ ...editingSecret, secret_type: type.id }); setEditTypePopoverOpen(false); }}
                            className={cn('w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all',
                              (editingSecret.secret_type || 'text') === type.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                            {type.icon}{type.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Update Secret Value</label>
                <input type="text" placeholder="Paste new secret value..." value={editingSecret.secret_value}
                  onChange={(e) => setEditingSecret({ ...editingSecret, secret_value: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border/50 flex gap-3">
              <button onClick={() => { setIsEditModalOpen(false); setEditingSecret(null); }}
                className="flex-1 py-3.5 rounded-xl bg-muted/30 text-[11px] font-bold uppercase tracking-widest hover:bg-muted/50 transition-all border border-border/50 text-muted-foreground">Discard</button>
              <button onClick={() => { if (editingSecret.secret_name && editingSecret.secret_value) { onUpdateSecret?.(editingSecret.id, editingSecret.secret_name, editingSecret.secret_value, editingSecret.secret_type || 'text'); setIsEditModalOpen(false); setEditingSecret(null); } }}
                disabled={!editingSecret.secret_name || !editingSecret.secret_value}
                className="flex-[2] py-3.5 rounded-xl bg-primary text-button-bgText text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                <Edit2 className="w-4 h-4" />Commit Changes
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default ServiceVaultDrawer;