import { FC, useState, useEffect } from 'react';
import { Proxy } from '../types';
import {
  Shield,
  Trash2,
  Activity,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Globe,
  Loader2,
  CreditCard,
  X,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const FORM_CACHE_KEY = 'zentri_proxy_form_cache';

interface ProxyConfigFormProps {
  proxy: Proxy | null;
  onClose: () => void;
  onSuccess: () => void;
}

type ChipVariant = 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';

const CURRENCY_OPTIONS = ['USD', 'VND', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'THB'];

interface DiagnosticResult {
  success: boolean;
  proxy?: { ip: string; country: string; region: string; city: string; isp: string; org: string };
  direct?: { ip: string; country: string; region: string; city: string; isp: string; org: string };
  isBlacklisted?: boolean;
  isProxyDetected?: boolean;
  webrtcLeak?: boolean;
  latency?: number;
  error?: string;
}

const inputClass = 'w-full h-11 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50';
const inputMono = cn(inputClass, 'font-mono');
const inputNoSpinner = cn(inputMono, 'no-spinner');

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
      indigo: active ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-lg shadow-indigo-500/10 font-bold' : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-indigo-500/5 hover:border-indigo-500/10 hover:text-indigo-400/70',
      emerald: active ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10 font-bold' : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-emerald-500/5 hover:border-emerald-500/10 hover:text-emerald-400/70',
      amber: active ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10 font-bold' : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-amber-500/5 hover:border-amber-500/10 hover:text-amber-400/70',
      rose: active ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-lg shadow-rose-500/10 font-bold' : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-rose-500/5 hover:border-rose-500/10 hover:text-rose-400/70',
      slate: active ? 'bg-slate-500/20 border-slate-500/40 text-slate-400 shadow-lg shadow-slate-500/10 font-bold' : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-slate-500/5 hover:border-slate-500/10 hover:text-slate-400/70',
      blue: active ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/10 font-bold' : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-blue-500/5 hover:border-blue-500/10 hover:text-blue-400/70',
    };
    return map[v];
  };
  return (
    <div className="space-y-2.5">
      <label className="text-[12px] font-bold text-muted-foreground/70 uppercase tracking-wider ml-0.5">{label}</label>
      <div className={cn('grid gap-2', columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
        {options.map((opt) => (
          <button key={String(opt.value)} onClick={() => onChange(opt.value)}
            className={cn('h-9 rounded-xl text-[11px] uppercase tracking-wide transition-all duration-300 border flex items-center justify-center gap-2', getVariants(opt.color || variant, opt.value === value))}>
            <span className="truncate">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ProxyConfigForm: FC<ProxyConfigFormProps> = ({ proxy, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Proxy>>(() => {
    const initial = { ipVersion: 4, proxyType: 'private', sourceType: 'datacenter', rotationType: 'static', pricingType: 'time', protocol: 'http', host: '', password: '', status: 'active', durationDays: 30, bandwidthGb: 0, price: 0, expiredAt: undefined, purchaseUrl: '' };
    if (proxy) return proxy;
    const cached = localStorage.getItem(FORM_CACHE_KEY);
    if (cached) {
      try { return { ...initial, ...JSON.parse(cached), host: '', port: undefined, username: '', password: '', expiredAt: undefined, price: 0, bandwidthGb: 0, purchaseUrl: '' }; }
      catch { return initial; }
    }
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [importString, setImportString] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [currencyPopoverOpen, setCurrencyPopoverOpen] = useState(false);
  const [isDecommissionModalOpen, setIsDecommissionModalOpen] = useState(false);

  useEffect(() => { if (proxy) setFormData(proxy); }, [proxy]);

  useEffect(() => {
    if (!proxy) {
      const toCache: any = { ...formData };
      delete toCache.host; delete toCache.port; delete toCache.username; delete toCache.password; delete toCache.id;
      localStorage.setItem(FORM_CACHE_KEY, JSON.stringify(toCache));
    }
  }, [formData, proxy]);

  const handleCheckProxy = async () => {
    if (!formData.host || !formData.port) { toast.error('Missing Host or Port for diagnostic'); return; }
    setIsChecking(true);
    try {
      // @ts-ignore
      const result: DiagnosticResult = await window.electron.ipcRenderer.invoke('proxy:check', formData);
      setDiagnosticResult(result);
      setShowResultModal(true);
      if (!result.success) toast.error('Proxy Connection Failed');
    } catch (error: any) { toast.error(`Diagnostic Failed: ${error.message}`); }
    finally { setIsChecking(false); }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const finalData = { ...formData, expiredAt: formData.expiredAt || new Date(Date.now() + (formData.durationDays || 30) * 24 * 60 * 60 * 1000).toISOString(), isp: diagnosticResult?.proxy?.isp || formData.isp, country: diagnosticResult?.proxy?.country || formData.country, city: diagnosticResult?.proxy?.city || formData.city };
      if (proxy) {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('proxy:update', { id: proxy.id, data: finalData });
      } else {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('proxy:create', { ...finalData, id: uuidv4() });
      }
      onSuccess();
      setShowResultModal(false);
    } catch (error) { console.error('Failed to save proxy:', error); toast.error('Failed to provision node'); }
    finally { setLoading(false); }
  };

  const confirmDecommission = async () => {
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('proxy:delete', proxy!.id);
      toast.success('Node decommissioned');
      onSuccess();
    } catch (e) { toast.error('Decommission failed'); }
    finally { setIsDecommissionModalOpen(false); }
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 overflow-hidden relative border-l border-border">
      <div className="h-[57px] shrink-0 border-b border-border bg-card/10 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/90 leading-none">{proxy ? 'Update Infrastructure' : 'Add New Node'}</h2>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar p-10">
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
          {/* Section 1 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <Shield className="w-4 h-4 text-indigo-400" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground/70">Registry Metadata</h3>
            </div>
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5"><Activity className="w-3.5 h-3.5 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Quick Import</span></div>
                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Format: host:port:username:password</span>
              </div>
              <input type="text" placeholder="Paste proxy string (host:port:username:password)..." value={importString}
                onChange={(e) => { const val = e.target.value; setImportString(val); const parts = val.trim().split(':'); if (parts.length >= 2) setFormData((prev: any) => ({ ...prev, host: parts[0], port: parseInt(parts[1]) || prev.port, username: parts[2] || prev.username, password: parts[3] || prev.password })); }}
                className="w-full h-12 px-3 rounded-2xl bg-background/50 border border-primary/20 focus:border-primary/50 text-sm font-mono outline-none transition-all" />
            </div>
            <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-2.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Host</label>
                <input type="text" placeholder="e.g. 45.2.x.x or gate.network.com" value={formData.host || ''} onChange={(e) => setFormData((d: any) => ({ ...d, host: e.target.value }))} className={inputMono} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Port</label>
                  <input type="number" placeholder="443" value={formData.port ? String(formData.port) : ''} onChange={(e) => setFormData((d: any) => ({ ...d, port: parseInt(e.target.value) || undefined }))} className={inputNoSpinner} />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Username</label>
                  <input type="text" placeholder="Username" value={formData.username || ''} onChange={(e) => setFormData((d: any) => ({ ...d, username: e.target.value }))} className={inputMono} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Password</label>
                  <input type="password" placeholder="••••••••" value={formData.password || ''} onChange={(e) => setFormData((d: any) => ({ ...d, password: e.target.value }))} className={inputMono} />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Purchase URL</label>
                  <input type="text" placeholder="https://..." value={formData.purchaseUrl || ''} onChange={(e) => setFormData((d: any) => ({ ...d, purchaseUrl: e.target.value }))} className={inputClass} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Commercial */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground/70">Commercial Matrix</h3>
            </div>
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 delay-100">
              <div className="grid grid-cols-2 gap-6">
                <SelectionGroup label="Billing Cycle" value={formData.pricingType} variant="amber" columns={2}
                  onChange={(v: any) => setFormData((d: any) => ({ ...d, pricingType: v }))}
                  options={[{ label: 'Time Based', value: 'time' }, { label: 'Data Based', value: 'bandwidth' }]} />
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Unit Price</label>
                    <input type="number" placeholder="0.00" value={formData.price !== undefined ? String(formData.price) : ''}
                      onChange={(e) => setFormData((d: any) => ({ ...d, price: parseFloat(e.target.value) || 0 }))} className={inputNoSpinner} />
                  </div>
                  <div className="space-y-2.5 relative">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Currency</label>
                    <div className="relative">
                      <input type="text" readOnly value={String(formData.metadata?.currency || 'USD')}
                        onClick={() => setCurrencyPopoverOpen(!currencyPopoverOpen)}
                        className={cn(inputClass, 'text-xs font-bold uppercase tracking-widest cursor-pointer')} />
                      {currencyPopoverOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-2xl z-50 max-h-[200px] overflow-y-auto">
                          {CURRENCY_OPTIONS.map((cur) => (
                            <button key={cur} onMouseDown={() => { setFormData((d: any) => ({ ...d, metadata: { ...d.metadata, currency: cur } })); setCurrencyPopoverOpen(false); }}
                              className="w-full px-4 py-2.5 text-xs hover:bg-muted text-left transition-colors">{cur}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Expiration Date</label>
                  <input type="datetime-local"
                    value={formData.expiredAt ? new Date(formData.expiredAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData((d: any) => ({ ...d, expiredAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                    className={inputClass} />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Region Assignment</label>
                  <input type="text" placeholder="GLOBAL / USA" value={formData.country || ''}
                    onChange={(e) => setFormData((d: any) => ({ ...d, country: e.target.value }))} className={inputClass} />
                </div>
              </div>
              {formData.pricingType === 'bandwidth' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Transit Quota</label>
                    <input type="number" placeholder="10" value={formData.bandwidthGb !== undefined ? String(formData.bandwidthGb) : ''}
                      onChange={(e) => setFormData((d: any) => ({ ...d, bandwidthGb: parseFloat(e.target.value) || undefined }))} className={inputNoSpinner} />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Technical */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground/70">Hyper Tuning</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-bottom-2 duration-500 delay-200">
              <SelectionGroup label="Data Protocol" value={formData.protocol} variant="amber"
                onChange={(v: any) => setFormData((d: any) => ({ ...d, protocol: v }))}
                options={[{ label: 'HTTP', value: 'http' }, { label: 'HTTPS', value: 'https' }, { label: 'SOCKS5', value: 'socks5' }]} />
              <SelectionGroup label="IP Stack" value={formData.ipVersion} variant="blue" columns={2}
                onChange={(v: any) => setFormData((d: any) => ({ ...d, ipVersion: v }))}
                options={[{ label: 'IPv4', value: 4 }, { label: 'IPv6', value: 6 }]} />
              <SelectionGroup label="Privacy Tier" value={formData.proxyType} variant="indigo" columns={2}
                onChange={(v: any) => setFormData((d: any) => ({ ...d, proxyType: v }))}
                options={[{ label: 'Exclusive', value: 'private' }, { label: 'Shared', value: 'shared' }]} />
              <SelectionGroup label="Origin Source" value={formData.sourceType} variant="emerald"
                onChange={(v: any) => setFormData((d: any) => ({ ...d, sourceType: v }))}
                options={[{ label: 'Datacenter', value: 'datacenter' }, { label: 'Residential', value: 'residential' }, { label: 'Carrier', value: 'mobile' }]} />
              <SelectionGroup label="Routing Mode" value={formData.rotationType} variant="slate" columns={2}
                onChange={(v: any) => setFormData((d: any) => ({ ...d, rotationType: v }))}
                options={[{ label: 'Static Bound', value: 'static' }, { label: 'Active Mesh', value: 'rotating' }]} />
              <SelectionGroup label="Node Status" value={formData.status}
                onChange={(v: any) => setFormData((d: any) => ({ ...d, status: v }))}
                options={[{ label: 'Active', value: 'active', color: 'emerald' }, { label: 'Critical', value: 'expired', color: 'amber' }, { label: 'Decommission', value: 'disabled', color: 'rose' }]} />
            </div>
          </section>
        </div>
      </div>

      <div className="h-[75px] shrink-0 border-t border-border bg-card/20 backdrop-blur-xl px-6 flex items-center justify-end gap-3 sticky bottom-0 z-20">
        {proxy && <button onClick={() => setIsDecommissionModalOpen(true)} className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-95 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>}
        <button onClick={onClose} className="px-8 h-11 bg-muted/10 hover:bg-muted/20 text-muted-foreground text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all border border-border/50 active:scale-95">Cancel</button>
        <button onClick={handleCheckProxy} disabled={isChecking || loading || !formData.host || !formData.port}
          className={cn('min-w-[200px] h-11 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3',
            isChecking || loading || !formData.host || !formData.port ? 'bg-primary/20 text-primary/40 cursor-not-allowed border border-primary/5' : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/30 border border-primary/50')}>
          {isChecking ? (<><Loader2 className="w-4 h-4 animate-spin" />Checking Node...</>) : (<><Navigation className="w-4 h-4" />Check Proxy</>)}
        </button>
      </div>

      {/* Diagnostic Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResultModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-[580px] mx-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-card z-10">
              <h3 className="text-sm font-bold text-foreground">Diagnostic Report</h3>
              <button onClick={() => setShowResultModal(false)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-6">
              {diagnosticResult?.success ? (
                <>
                  <div className="flex flex-col items-center justify-center p-6 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-3xl space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
                    <div className="text-center"><h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Node Authenticated</h3><p className="text-[11px] text-muted-foreground/60 mt-1 uppercase tracking-wider">Infrastructure Healthy</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2 px-1"><Shield className="w-3.5 h-3.5 text-muted-foreground/40" /><span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Direct Connection</span></div>
                      {[{ label: 'IP', value: diagnosticResult.direct?.ip }, { label: 'Location', value: diagnosticResult.direct?.country }, { label: 'Region', value: diagnosticResult.direct?.region }, { label: 'ISP Provider', value: diagnosticResult.direct?.isp }, { label: 'Organization', value: diagnosticResult.direct?.org }].map((row, i) => (
                        <div key={i} className="flex flex-col p-2.5 bg-muted/5 border border-border/20 rounded-xl"><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-0.5">{row.label}</span><span className="text-[11px] font-bold text-foreground/70 truncate">{row.value || 'N/A'}</span></div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2 px-1"><Globe className="w-3.5 h-3.5 text-primary" /><span className="text-[10px] font-black uppercase tracking-wider text-primary">Proxy Connection</span></div>
                      {[{ label: 'IP', value: diagnosticResult.proxy?.ip, primary: true }, { label: 'Location', value: diagnosticResult.proxy?.country }, { label: 'Region', value: diagnosticResult.proxy?.region }, { label: 'ISP Provider', value: diagnosticResult.proxy?.isp }, { label: 'Organization', value: diagnosticResult.proxy?.org }].map((row, i) => (
                        <div key={i} className="flex flex-col p-2.5 bg-primary/5 border border-primary/20 rounded-xl"><span className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-0.5">{row.label}</span><span className={cn('text-[11px] font-bold truncate', row.primary ? 'text-primary font-black' : 'text-primary/90')}>{row.value || 'N/A'}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleCheckProxy()} className="flex-1 h-12 bg-muted/10 hover:bg-muted/20 text-muted-foreground text-xs font-bold uppercase tracking-widest rounded-2xl transition-all border border-border/50">Retry Diagnostic</button>
                    <button onClick={handleSave} disabled={loading} className="flex-1 h-12 bg-primary text-white hover:bg-primary/90 border border-primary/50 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">{proxy ? 'Commit Update' : 'Use Proxy'}</button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-rose-500/[0.03] border border-rose-500/10 rounded-3xl space-y-6">
                  <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center"><AlertCircle className="w-10 h-10 text-rose-500" /></div>
                  <div className="text-center space-y-2"><h3 className="text-sm font-black uppercase tracking-[0.2em] text-rose-400">Diagnostic Failed</h3><p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider max-w-[300px] leading-relaxed">{diagnosticResult?.error || 'Unknown Handshake Error'}</p></div>
                  <button onClick={() => setShowResultModal(false)} className="w-full h-12 bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20">Recheck Settings</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Decommission Modal */}
      {isDecommissionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDecommissionModalOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-[400px] w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground">Confirm Decommission</h3>
              <button onClick={() => setIsDecommissionModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-6">
              <div className="flex flex-col items-center justify-center pt-4 pb-2 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center"><AlertCircle className="w-8 h-8 text-rose-500" /></div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">Are you sure you want to decommission this proxy node? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsDecommissionModalOpen(false)} className="flex-1 h-11 bg-muted/10 hover:bg-muted/20 text-muted-foreground text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all border border-border/50">Cancel</button>
                <button onClick={confirmDecommission} className="flex-1 h-11 bg-rose-500 text-white hover:bg-rose-600 border border-rose-500/50 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20">Decommission</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProxyConfigForm;