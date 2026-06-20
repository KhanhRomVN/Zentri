import { FC, useState } from 'react';
import { Proxy } from '../types';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Loader2,
  CreditCard,
  Activity,
  X,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { toast } from 'sonner';

interface InlineProxyFormProps {
  proxy: Proxy;
  onClose: () => void;
  onSuccess: () => void;
}

type ChipVariant = 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';

interface DiagnosticResult {
  success: boolean;
  proxy?: {
    ip: string;
    country: string;
    region: string;
    city: string;
    isp: string;
    org: string;
  };
  direct?: {
    ip: string;
    country: string;
    region: string;
    city: string;
    isp: string;
    org: string;
  };
  isBlacklisted?: boolean;
  webrtcLeak?: boolean;
  latency?: number;
  error?: string;
}

const SelectionGroup: FC<{
  label: string;
  options: { label: string; value: any; color?: ChipVariant }[];
  value: any;
  onChange: (value: any) => void;
  columns?: number;
  variant?: ChipVariant;
}> = ({ label, options, value, onChange, columns = 3, variant = 'indigo' }) => {
  const getVariants = (v: ChipVariant, active: boolean) => {
    const map: Record<ChipVariant, string> = {
      indigo: active
        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-lg shadow-indigo-500/10 font-bold'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-indigo-500/5 hover:border-indigo-500/10 hover:text-indigo-400/70',
      emerald: active
        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-emerald-500/5 hover:border-emerald-500/10 hover:text-emerald-400/70',
      amber: active
        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold shadow-lg shadow-amber-500/10'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-amber-500/5 hover:border-amber-500/10 hover:text-amber-400/70',
      rose: active
        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 font-bold shadow-lg shadow-rose-500/10'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-rose-500/5 hover:border-rose-500/10 hover:text-rose-400/70',
      slate: active
        ? 'bg-slate-500/20 border-slate-500/40 text-slate-400 font-bold shadow-lg shadow-slate-500/10'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-slate-500/5 hover:border-slate-500/10 hover:text-slate-400/70',
      blue: active
        ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 font-bold shadow-lg shadow-blue-500/10'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-blue-500/5 hover:border-blue-500/10 hover:text-blue-400/70',
    };
    return map[v];
  };

  return (
    <div className="space-y-2.5">
      <label className="text-[12px] font-bold text-muted-foreground/70 uppercase tracking-wider ml-0.5">{label}</label>
      <div className={cn('grid gap-2', columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
        {options.map((opt) => (
          <button key={String(opt.value)} onClick={() => onChange(opt.value)}
            className={cn('h-9 rounded-xl text-[11px] uppercase tracking-wide transition-all border flex items-center justify-center', getVariants(opt.color || variant, opt.value === value))}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const inputClass = 'w-full h-11 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 font-mono';

const InlineProxyForm: FC<InlineProxyFormProps> = ({ proxy, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Proxy>>(proxy);
  const [isChecking, setIsChecking] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  const handleCheckProxy = async () => {
    if (!formData.host || !formData.port) {
      toast.error('Missing Host or Port');
      return;
    }
    setIsChecking(true);
    try {
      // @ts-ignore
      const result: DiagnosticResult = await window.electron.ipcRenderer.invoke('proxy:check', formData);
      setDiagnosticResult(result);
      setShowResultModal(true);
    } catch (error: any) {
      toast.error(`Check Failed: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    try {
      const finalData = {
        ...formData,
        expiredAt: formData.expiredAt || new Date(Date.now() + (formData.durationDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
        isp: diagnosticResult?.proxy?.isp || formData.isp,
        country: diagnosticResult?.proxy?.country || formData.country,
        city: diagnosticResult?.proxy?.city || formData.city,
      };
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('proxy:update', { id: proxy.id, data: finalData });
      onSuccess();
      setShowResultModal(false);
      onClose();
    } catch (error) {
      toast.error('Update Failed');
    }
  };

  const isDirty = JSON.stringify(formData) !== JSON.stringify(proxy);

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 overflow-hidden relative border-l border-border">
      <div className="flex-1 overflow-auto custom-scrollbar p-10">
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
          {/* Section 1: Registry Metadata */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <Shield className="w-4 h-4 text-indigo-400" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground/70">Registry Metadata</h3>
            </div>
            <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-2.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Host</label>
                <input type="text" value={formData.host || ''} onChange={(e) => setFormData((d: Partial<Proxy>) => ({ ...d, host: e.target.value }))} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Port</label>
                  <input type="number" value={formData.port !== undefined ? String(formData.port) : ''} onChange={(e) => setFormData((d: Partial<Proxy>) => ({ ...d, port: parseInt(e.target.value) || 0 }))} className={cn(inputClass, 'no-spinner')} />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Username</label>
                  <input type="text" value={formData.username || ''} onChange={(e) => setFormData((d: Partial<Proxy>) => ({ ...d, username: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Password</label>
                  <input type="password" value={formData.password || ''} onChange={(e) => setFormData((d: Partial<Proxy>) => ({ ...d, password: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Purchase URL</label>
                  <input type="text" placeholder="https://..." value={formData.purchaseUrl || ''} onChange={(e) => setFormData((d: Partial<Proxy>) => ({ ...d, purchaseUrl: e.target.value }))} className={cn(inputClass, '!font-sans')} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Commercial Matrix */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <CreditCard className="w-4 h-4 text-theme-warning" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground/70">Commercial Matrix</h3>
            </div>
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-2 gap-6">
                <SelectionGroup label="Billing Cycle" value={formData.pricingType} variant="amber" columns={2}
                  onChange={(v) => setFormData((d: Partial<Proxy>) => ({ ...d, pricingType: v }))}
                  options={[{ label: 'Time Based', value: 'time' }, { label: 'Data Based', value: 'bandwidth' }]} />
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Unit Price</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={formData.price !== undefined ? String(formData.price) : ''} onChange={(e) => setFormData((d: Partial<Proxy>) => ({ ...d, price: parseFloat(e.target.value) || 0 }))} className={cn(inputClass, 'no-spinner')} />
                    <input type="text" value={formData.metadata?.currency || 'USD'} readOnly className={cn(inputClass, 'text-xs font-bold uppercase tracking-widest text-center cursor-default')} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Expiration Date</label>
                  <input type="datetime-local"
                    value={formData.expiredAt ? new Date(formData.expiredAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData((d: Partial<Proxy>) => ({ ...d, expiredAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                    className={inputClass} />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Region Assignment</label>
                  <input type="text" placeholder="GLOBAL / USA" value={formData.country || ''} onChange={(e) => setFormData((d: Partial<Proxy>) => ({ ...d, country: e.target.value }))} className={cn(inputClass, '!font-sans')} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Technical Tuning */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground/70">Hyper Tuning</h3>
            </div>
            <div className="grid grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500">
              <SelectionGroup label="Data Protocol" value={formData.protocol} variant="amber"
                onChange={(v) => setFormData((d: Partial<Proxy>) => ({ ...d, protocol: v }))}
                options={[{ label: 'HTTP', value: 'http' }, { label: 'HTTPS', value: 'https' }, { label: 'SOCKS5', value: 'socks5' }]} />
              <SelectionGroup label="Origin Source" value={formData.sourceType} variant="emerald"
                onChange={(v) => setFormData((d: Partial<Proxy>) => ({ ...d, sourceType: v }))}
                options={[{ label: 'Datacenter', value: 'datacenter' }, { label: 'Residential', value: 'residential' }, { label: 'Carrier', value: 'mobile' }]} />
              <SelectionGroup label="Node Status" value={formData.status}
                onChange={(v) => setFormData((d: Partial<Proxy>) => ({ ...d, status: v }))}
                options={[{ label: 'Active', value: 'active', color: 'emerald' }, { label: 'Critical', value: 'expired', color: 'amber' }, { label: 'Decommission', value: 'disabled', color: 'rose' }]} />
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="h-[75px] shrink-0 border-t border-border bg-card/20 backdrop-blur-xl px-8 flex items-center justify-end gap-3 sticky bottom-0 z-20">
        <button onClick={onClose} className="px-8 h-11 bg-muted/10 hover:bg-muted/20 text-muted-foreground text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all border border-border/50 active:scale-95">Back</button>
        <button onClick={handleCheckProxy} disabled={isChecking || !isDirty}
          className={cn('min-w-[200px] h-11 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3',
            isChecking || !isDirty ? 'bg-primary/20 text-primary/40 cursor-not-allowed border border-primary/5' : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/30 border border-primary/50')}>
          {isChecking ? (<><Loader2 className="w-4 h-4 animate-spin" />Checking Node...</>) : (<><Navigation className="w-4 h-4" />Check Proxy</>)}
        </button>
      </div>

      {/* Diagnostic Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResultModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-[580px] mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground">Diagnostic Report</h3>
              <button onClick={() => setShowResultModal(false)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-6">
              {diagnosticResult?.success ? (
                <>
                  <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h3 className="text-sm font-black uppercase text-emerald-400">Node Authenticated</h3>
                  </div>
                  <button onClick={handleSave} className="w-full h-14 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary/90">Commit Update</button>
                </>
              ) : (
                <div className="p-12 text-center space-y-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl">
                  <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase text-rose-400">Diagnostic Failed</h3>
                    <p className="text-[10px] text-muted-foreground/50">{diagnosticResult?.error || 'Unknown handshake error'}</p>
                  </div>
                  <button onClick={() => setShowResultModal(false)} className="w-full h-12 bg-rose-500 text-white text-xs font-black rounded-2xl">Recheck Settings</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineProxyForm;