import { FC, useState, useEffect } from 'react';
import { Proxy } from '../types';
import Combobox from '../../../shared/components/ui/combobox/Combobox';
import Input from '../../../shared/components/ui/input/Input';
import Modal from '../../../shared/components/ui/modal/Modal';
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
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const FORM_CACHE_KEY = 'zentri_proxy_form_cache';

interface ProxyConfigFormProps {
  proxy: Proxy | null;
  onClose: () => void;
  onSuccess: () => void;
}

type ChipVariant = 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'VND', label: 'VND' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'JPY', label: 'JPY' },
  { value: 'CNY', label: 'CNY' },
  { value: 'KRW', label: 'KRW' },
  { value: 'THB', label: 'THB' },
];

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
  isProxyDetected?: boolean;
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
        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10 font-bold'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-emerald-500/5 hover:border-emerald-500/10 hover:text-emerald-400/70',
      amber: active
        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10 font-bold'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-amber-500/5 hover:border-amber-500/10 hover:text-amber-400/70',
      rose: active
        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-lg shadow-rose-500/10 font-bold'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-rose-500/5 hover:border-rose-500/10 hover:text-rose-400/70',
      slate: active
        ? 'bg-slate-500/20 border-slate-500/40 text-slate-400 shadow-lg shadow-slate-500/10 font-bold'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-slate-500/5 hover:border-slate-500/10 hover:text-slate-400/70',
      blue: active
        ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/10 font-bold'
        : 'bg-muted/5 border-border/40 text-muted-foreground/60 hover:bg-blue-500/5 hover:border-blue-500/10 hover:text-blue-400/70',
    };
    return map[v];
  };

  return (
    <div className="space-y-2.5">
      <label className="text-[12px] font-bold text-muted-foreground/70 uppercase tracking-wider ml-0.5">
        {label}
      </label>
      <div
        className={cn(
          'grid gap-2',
          columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4',
        )}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          const chipVariant = opt.color || variant;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={cn(
                'h-9 rounded-xl text-[11px] uppercase tracking-wide transition-all duration-300 border flex items-center justify-center gap-2',
                getVariants(chipVariant, active),
              )}
            >
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ProxyConfigForm: FC<ProxyConfigFormProps> = ({ proxy, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Proxy>>(() => {
    const initial = {
      ipVersion: 4,
      proxyType: 'private',
      sourceType: 'datacenter',
      rotationType: 'static',
      pricingType: 'time',
      protocol: 'http',
      host: '',
      password: '',
      status: 'active',
      durationDays: 30,
      bandwidthGb: 0,
      price: 0,
    };

    if (proxy) return proxy;

    const cached = localStorage.getItem(FORM_CACHE_KEY);
    if (cached) {
      try {
        return {
          ...initial,
          ...JSON.parse(cached),
          host: '',
          port: undefined,
          username: '',
          password: '',
        };
      } catch (e) {
        return initial;
      }
    }
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [importString, setImportString] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [currencyPopoverOpen, setCurrencyPopoverOpen] = useState(false);

  useEffect(() => {
    if (proxy) {
      setFormData(proxy);
    }
  }, [proxy]);

  // Real-time persistence for selections
  useEffect(() => {
    if (!proxy) {
      const toCache = { ...formData };
      delete toCache.host;
      delete toCache.port;
      delete toCache.username;
      delete toCache.password;
      delete toCache.id;
      localStorage.setItem(FORM_CACHE_KEY, JSON.stringify(toCache));
    }
  }, [formData, proxy]);

  const handleCheckProxy = async () => {
    if (!formData.host || !formData.port) {
      toast.error('Missing Host or Port for diagnostic');
      return;
    }

    setIsChecking(true);
    try {
      // @ts-ignore
      const result: DiagnosticResult = await window.electron.ipcRenderer.invoke(
        'proxy:check',
        formData,
      );
      setDiagnosticResult(result);
      setShowResultModal(true);

      if (!result.success) {
        toast.error('Proxy Connection Failed');
      }
    } catch (error: any) {
      toast.error(`Diagnostic Failed: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Merge diagnostic data into formData
      const finalData = {
        ...formData,
        isp: diagnosticResult?.proxy?.isp || formData.isp,
        country: diagnosticResult?.proxy?.country || formData.country,
        city: diagnosticResult?.proxy?.city || formData.city,
      };

      if (proxy) {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('proxy:update', { id: proxy.id, data: finalData });
      } else {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('proxy:create', { ...finalData, id: uuidv4() });
      }
      onSuccess();
      setShowResultModal(false);
    } catch (error) {
      console.error('Failed to save proxy:', error);
      toast.error('Failed to provision node');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!proxy || !confirm('Confirm decommission of this node?')) return;
    setLoading(true);
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('proxy:delete', proxy.id);
      onSuccess();
    } catch (error) {
      console.error('Failed to delete proxy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 overflow-hidden relative border-l border-border">
      {/* Header Bar */}
      <div className="h-[57px] shrink-0 border-b border-border bg-card/10 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/90 leading-none text-glow-primary">
              {proxy ? t('proxy.updateInfrastructure') : t('proxy.addNewNode')}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-10">
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
          {/* Section 1: Registry Metadata */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <Shield className="w-4 h-4 text-indigo-400" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground/70">
                {t('proxy.registryMetadata')}
              </h3>
            </div>

            {/* Quick Import Bar */}
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
                    {t('proxy.quickImport')}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                  {t('proxy.formatHint')}
                </span>
              </div>
              <div className="relative group">
                <Input
                  placeholder={t('proxy.importPlaceholder')}
                  value={importString}
                  onChange={(e) => {
                    const val = e.target.value;
                    setImportString(val);
                    const parts = val.trim().split(':');
                    if (parts.length >= 2) {
                      setFormData((prev) => ({
                        ...prev,
                        host: parts[0],
                        port: parseInt(parts[1]) || prev.port,
                        username: parts[2] || prev.username,
                        password: parts[3] || prev.password,
                      }));
                    }
                  }}
                  className="bg-background/50 border-primary/20 focus:border-primary/50 rounded-2xl h-12 text-sm font-mono transition-all group-hover:bg-background"
                />
              </div>
            </div>

            <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-2.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">
                  {t('proxy.host')}
                </label>
                <Input
                  placeholder="e.g. 45.2.x.x or gate.network.com"
                  value={formData.host || ''}
                  className="bg-input-background border-border rounded-xl h-11 text-sm font-mono"
                  onChange={(e) => setFormData((d) => ({ ...d, host: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">
                    {t('proxy.port')}
                  </label>
                  <Input
                    type="number"
                    placeholder="443"
                    value={formData.port ? String(formData.port) : ''}
                    className="bg-input-background border-border rounded-xl h-11 text-sm font-mono no-spinner"
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, port: parseInt(e.target.value) || undefined }))
                    }
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">
                    {t('proxy.username')}
                  </label>
                  <Input
                    placeholder="Username"
                    value={formData.username || ''}
                    className="bg-input-background border-border rounded-xl h-11 text-sm font-mono"
                    onChange={(e) => setFormData((d) => ({ ...d, username: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">
                  {t('proxy.password')}
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  password
                  value={formData.password || ''}
                  className="bg-input-background border-border rounded-xl h-11 text-sm font-mono"
                  onChange={(e) => setFormData((d) => ({ ...d, password: e.target.value }))}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Commercial Matrix */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground/70">
                {t('proxy.commercialMatrix')}
              </h3>
            </div>

            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 delay-100">
              <div className="grid grid-cols-2 gap-6">
                <SelectionGroup
                  label={t('proxy.billingCycle')}
                  value={formData.pricingType}
                  variant="amber"
                  columns={2}
                  onChange={(v) => setFormData((d) => ({ ...d, pricingType: v }))}
                  options={[
                    { label: t('proxy.timeBased'), value: 'time' },
                    { label: t('proxy.dataBased'), value: 'bandwidth' },
                  ]}
                />
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">
                      {t('proxy.unitPrice')}
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.price !== undefined ? String(formData.price) : ''}
                      className="bg-input-background border-border rounded-xl h-11 text-sm font-mono no-spinner"
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, price: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">
                      {t('proxy.currency')}
                    </label>
                    <Input
                      type="combobox"
                      placeholder="USD"
                      value={String(formData.metadata?.currency || 'USD')}
                      className="bg-input-background border-border rounded-xl h-11 text-xs font-bold uppercase tracking-widest"
                      readOnly
                      popoverOpen={currencyPopoverOpen}
                      onPopoverOpenChange={setCurrencyPopoverOpen}
                      popoverContent={
                        <Combobox
                          value={formData.metadata?.currency || 'USD'}
                          options={CURRENCY_OPTIONS}
                          searchable={false}
                          onChange={(val) => {
                            setFormData((d) => ({
                              ...d,
                              metadata: { ...d.metadata, currency: val },
                            }));
                            setCurrencyPopoverOpen(false);
                          }}
                        />
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {formData.pricingType === 'time' ? (
                  <div className="space-y-2.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">
                      {t('proxy.lifecycle')}
                    </label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={
                        formData.durationDays !== undefined ? String(formData.durationDays) : ''
                      }
                      className="bg-input-background border-border rounded-xl h-11 text-sm font-mono no-spinner"
                      onChange={(e) =>
                        setFormData((d) => ({
                          ...d,
                          durationDays: parseInt(e.target.value) || undefined,
                        }))
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">
                      {t('proxy.transitQuota')}
                    </label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={formData.bandwidthGb !== undefined ? String(formData.bandwidthGb) : ''}
                      className="bg-input-background border-border rounded-xl h-11 text-sm font-mono no-spinner"
                      onChange={(e) =>
                        setFormData((d) => ({
                          ...d,
                          bandwidthGb: parseFloat(e.target.value) || undefined,
                        }))
                      }
                    />
                  </div>
                )}
                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">
                    {t('proxy.regionAssignment')}
                  </label>
                  <Input
                    placeholder="GLOBAL / USA"
                    value={formData.country || ''}
                    className="bg-input-background border-border rounded-xl h-11 text-sm"
                    onChange={(e) => setFormData((d) => ({ ...d, country: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Technical Tuning */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground/70">
                {t('proxy.hyperTuning')}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-bottom-2 duration-500 delay-200">
              <SelectionGroup
                label={t('proxy.dataProtocol')}
                value={formData.protocol}
                variant="amber"
                onChange={(v) => setFormData((d) => ({ ...d, protocol: v }))}
                options={[
                  { label: 'HTTP', value: 'http' },
                  { label: 'HTTPS', value: 'https' },
                  { label: 'SOCKS5', value: 'socks5' },
                ]}
              />
              <SelectionGroup
                label={t('proxy.ipStack')}
                value={formData.ipVersion}
                variant="blue"
                columns={2}
                onChange={(v) => setFormData((d) => ({ ...d, ipVersion: v }))}
                options={[
                  { label: 'IPv4', value: 4 },
                  { label: 'IPv6', value: 6 },
                ]}
              />
              <SelectionGroup
                label={t('proxy.privacyTier')}
                value={formData.proxyType}
                variant="indigo"
                columns={2}
                onChange={(v) => setFormData((d) => ({ ...d, proxyType: v }))}
                options={[
                  { label: t('proxy.exclusive'), value: 'private' },
                  { label: t('proxy.shared'), value: 'shared' },
                ]}
              />
              <SelectionGroup
                label={t('proxy.originSource')}
                value={formData.sourceType}
                variant="emerald"
                onChange={(v) => setFormData((d) => ({ ...d, sourceType: v }))}
                options={[
                  { label: t('proxy.datacenter'), value: 'datacenter' },
                  { label: t('proxy.residential'), value: 'residential' },
                  { label: t('proxy.carrier'), value: 'mobile' },
                ]}
              />
              <SelectionGroup
                label={t('proxy.routingMode')}
                value={formData.rotationType}
                variant="slate"
                columns={2}
                onChange={(v) => setFormData((d) => ({ ...d, rotationType: v }))}
                options={[
                  { label: t('proxy.staticBound'), value: 'static' },
                  { label: t('proxy.activeMesh'), value: 'rotating' },
                ]}
              />
              <SelectionGroup
                label={t('proxy.nodeStatus')}
                value={formData.status}
                onChange={(v) => setFormData((d) => ({ ...d, status: v }))}
                options={[
                  { label: t('proxy.active'), value: 'active', color: 'emerald' },
                  { label: t('proxy.critical'), value: 'expired', color: 'amber' },
                  { label: t('proxy.decommission'), value: 'disabled', color: 'rose' },
                ]}
              />
            </div>
          </section>
        </div>
      </div>

      <div className="h-[75px] shrink-0 border-t border-border bg-card/20 backdrop-blur-xl px-6 flex items-center justify-end gap-3 sticky bottom-0 z-20">
        {proxy && (
          <button
            onClick={handleDelete}
            className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-95 flex items-center justify-center group"
          >
            <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
          </button>
        )}
        <button
          onClick={onClose}
          className="px-8 h-11 bg-muted/10 hover:bg-muted/20 text-muted-foreground text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all border border-border/50 active:scale-95"
        >
          {t('proxy.cancel')}
        </button>

        <button
          onClick={handleCheckProxy}
          disabled={isChecking || loading || !formData.host || !formData.port}
          className={cn(
            'min-w-[200px] h-11 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3',
            isChecking || loading || !formData.host || !formData.port
              ? 'bg-primary/20 text-primary/40 cursor-not-allowed border border-primary/5'
              : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/30 border border-primary/50',
          )}
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('proxy.checkingNode')}
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              {t('proxy.checkProxy')}
            </>
          )}
        </button>
      </div>

      {/* Diagnostic Result Modal */}
      <Modal
        open={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={t('proxy.diagnosticReport')}
        size="lg"
        style={{ width: '580px' }}
      >
        <div className="space-y-6">
          {diagnosticResult?.success ? (
            <>
              <div className="flex flex-col items-center justify-center p-6 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">
                    {t('proxy.nodeAuthenticated')}
                  </h3>
                  <p className="text-[11px] text-muted-foreground/60 mt-1 uppercase tracking-wider">
                    {t('proxy.infraHealthy')}
                  </p>
                </div>
              </div>

              {/* Symmetric Comparison Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left: Direct */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground/40" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                      {t('proxy.directConnection')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'IP', value: diagnosticResult.direct?.ip },
                      { label: t('proxy.location'), value: diagnosticResult.direct?.country },
                      { label: t('proxy.region'), value: diagnosticResult.direct?.region },
                      { label: t('proxy.ispProvider'), value: diagnosticResult.direct?.isp },
                      { label: t('proxy.organization'), value: diagnosticResult.direct?.org },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="flex flex-col p-2.5 bg-muted/5 border border-border/20 rounded-xl transition-all hover:bg-muted/10"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-0.5">
                          {row.label}
                        </span>
                        <span className="text-[11px] font-bold text-foreground/70 truncate">
                          {row.value || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Proxy */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      {t('proxy.proxyConnection')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'IP', value: diagnosticResult.proxy?.ip, primary: true },
                      { label: t('proxy.location'), value: diagnosticResult.proxy?.country },
                      { label: t('proxy.region'), value: diagnosticResult.proxy?.region },
                      { label: t('proxy.ispProvider'), value: diagnosticResult.proxy?.isp },
                      { label: t('proxy.organization'), value: diagnosticResult.proxy?.org },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="flex flex-col p-2.5 bg-primary/5 border border-primary/20 rounded-xl shadow-sm transition-all hover:bg-primary/10"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-0.5">
                          {row.label}
                        </span>
                        <span
                          className={cn(
                            'text-[11px] font-bold truncate',
                            row.primary
                              ? 'text-primary font-black scale-105 origin-left'
                              : 'text-primary/90',
                          )}
                        >
                          {row.value || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div
                  className={cn(
                    'flex flex-col gap-1.5 p-3 rounded-2xl border',
                    diagnosticResult.isBlacklisted
                      ? 'bg-rose-500/5 border-rose-500/20'
                      : 'bg-emerald-500/5 border-emerald-500/20',
                  )}
                >
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60">
                    {t('proxy.reputation')}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-black uppercase',
                      diagnosticResult.isBlacklisted ? 'text-rose-400' : 'text-emerald-400',
                    )}
                  >
                    {diagnosticResult.isBlacklisted ? t('proxy.blacklisted') : t('proxy.pristine')}
                  </span>
                </div>
                <div
                  className={cn(
                    'flex flex-col gap-1.5 p-3 rounded-2xl border',
                    diagnosticResult.webrtcLeak
                      ? 'bg-rose-500/5 border-rose-500/20'
                      : 'bg-emerald-500/5 border-emerald-500/20',
                  )}
                >
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60">
                    {t('proxy.webrtcLeak')}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-black uppercase',
                      diagnosticResult.webrtcLeak ? 'text-rose-400' : 'text-emerald-400',
                    )}
                  >
                    {diagnosticResult.webrtcLeak ? t('proxy.leakDetected') : t('proxy.noLeaks')}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-3 rounded-2xl border bg-muted/5 border-border/20">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60">
                    {t('proxy.latency')}
                  </span>
                  <span className="text-[11px] font-black uppercase font-mono text-emerald-400">
                    {diagnosticResult.latency}ms
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleCheckProxy()}
                  className="flex-1 h-12 bg-muted/10 hover:bg-muted/20 text-muted-foreground text-xs font-bold uppercase tracking-widest rounded-2xl transition-all border border-border/50"
                >
                  {t('proxy.retryDiagnostic')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 h-12 bg-primary text-white hover:bg-primary/90 border border-primary/50 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                >
                  {proxy ? t('proxy.commitUpdate') : t('proxy.useProxy')}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-rose-500/[0.03] border border-rose-500/10 rounded-3xl space-y-6">
              <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-rose-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-rose-400">
                  {t('proxy.diagnosticFailed')}
                </h3>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider max-w-[300px] leading-relaxed">
                  {diagnosticResult?.error || t('proxy.unknownHandshakeError')}
                </p>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="w-full h-12 bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
              >
                {t('proxy.recheckSettings')}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProxyConfigForm;
