import React, { useState, useEffect } from 'react';
import { Globe, Monitor, Activity, Layout, MapPin, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
import { FingerprintConfig } from './FingerprintPresets';
import { USER_AGENTS } from '../../constants/userAgents';

// ==================== Sub-components ====================

const HelpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
  </svg>
);

const STEP_COLORS: Record<string, string> = {
  '01. User Agent': '#3b82f6', '02. Platform & OS Version': '#8b5cf6', '03. Hardware Properties': '#10b981',
  '04. Screen Properties': '#f59e0b', '05. Window Properties': '#ef4444', '06. Language & Locale': '#06b6d4',
  '07. Timezone & GPS': '#f97316', '08. Canvas & Media': '#ec4899', '09. Browser Metadata': '#64748b',
};

const inputClass = 'w-full h-9 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 font-bold font-mono';
const inputReadOnly = cn(inputClass, 'bg-muted/30 opacity-80 cursor-not-allowed');

const FormSection = ({ title, description, icon: Icon, isUnlocked = true, children }: {
  title: string; description?: string; icon: any; showHelp?: boolean; isUnlocked?: boolean; children: React.ReactNode;
}) => {
  const stepColor = STEP_COLORS[title] || '#3b82f6';
  return (
    <div className={cn('relative group transition-all duration-500', !isUnlocked && 'opacity-40 grayscale pointer-events-none')}>
      <div className="flex items-start gap-6 relative z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${stepColor}15`, color: stepColor }}><Icon className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0 pt-1">
          <h2 className="text-[14px] font-black tracking-widest uppercase text-foreground">{title}</h2>
          <p className="text-[11px] font-bold text-muted-foreground/40 leading-relaxed uppercase tracking-widest truncate">{description}</p>
        </div>
      </div>
      <div className="mt-[19px]"><div className="space-y-10">{children}</div></div>
      <div className="h-px bg-border/40 mt-4 w-full opacity-50" />
    </div>
  );
};

const FormItem = ({ label, description, action, children }: {
  label: string; description: string; action?: React.ReactNode; children: React.ReactNode;
}) => (
  <div className="space-y-2 relative">
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5 min-w-0">
        <label className="text-[13px] font-bold text-foreground truncate">{label}</label>
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-1">{description}</p>
      </div>
    </div>
    <div className="pt-1 relative">{action && <div className="absolute -top-8 right-5 z-20">{action}</div>}{children}</div>
  </div>
);

const NativeCombobox: React.FC<{
  value: string; options: { label: string; value: string }[]; onChange: (val: string) => void;
  placeholder?: string; searchQuery?: string; onSearchChange?: (v: string) => void; className?: string; readOnly?: boolean;
}> = ({ value, options, onChange, placeholder, searchQuery, onSearchChange, className, readOnly }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(searchQuery || '');
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) || o.value.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => o.value === value);
  return (
    <div className="relative">
      <input type="text" readOnly={readOnly} value={open ? search : (selected?.label || value)} placeholder={placeholder}
        onChange={(e) => { setSearch(e.target.value); onSearchChange?.(e.target.value); setOpen(true); }}
        onFocus={() => { setSearch(searchQuery || ''); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className={className || inputClass} />
      {open && !readOnly && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl z-50 max-h-[200px] overflow-y-auto py-1.5 p-1 hover:border-primary transition-colors">
          {filtered.map(o => (
            <button key={o.value} onMouseDown={() => { onChange(o.value); setOpen(false); setSearch(''); }}
              className="w-full px-4 py-2.5 text-xs hover:bg-dropdown-item-hover rounded-xl text-left transition-colors">{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
};

const parseUserAgent = (ua: string) => {
  const uaLower = ua.toLowerCase();
  let os = 'Win32', osVersion = '10.0.0', brand = 'Google Chrome', brandVersion = '131';
  if (uaLower.includes('windows nt 10.0')) { os = 'Win32'; osVersion = '10.0.0'; }
  else if (uaLower.includes('macintosh')) { os = 'MacIntel'; osVersion = '14.5.0'; }
  else if (uaLower.includes('iphone')) { os = 'iPhone'; const m = ua.match(/OS (\d+)_(\d+)_?(\d+)?/); osVersion = m ? `${m[1]}.${m[2]}.${m[3] || '0'}` : '17.5.1'; }
  else if (uaLower.includes('android')) { os = 'Linux armv8l'; const m = ua.match(/Android (\d+)/); osVersion = m ? `${m[1]}.0.0` : '14.0.0'; }
  else if (uaLower.includes('linux')) { os = 'Linux x86_64'; osVersion = '6.5.0'; }
  if (ua.includes('Edg/')) { brand = 'Microsoft Edge'; const m = ua.match(/Edg\/(\d+)/); brandVersion = m ? m[1] : '146'; }
  else if (ua.includes('Chrome/')) { const m = ua.match(/Chrome\/(\d+)/); brandVersion = m ? m[1] : '131'; }
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) { brand = 'Safari'; const m = ua.match(/Version\/(\d+)/); brandVersion = m ? m[1] : '17'; }
  return { os, osVersion, brand, brandVersion };
};

// ==================== Main Component ====================

export const FingerprintDetail = ({
  config,
  setConfig,
  presetId,
  isEditMode,
}: {
  config: FingerprintConfig;
  setConfig: React.Dispatch<React.SetStateAction<FingerprintConfig>>;
  presetId?: string | null;
  isEditMode: boolean;
}) => {
  useEffect(() => { const h = () => setIsSaveDrawerOpen(true); window.addEventListener('zentri:open-save-drawer', h); return () => window.removeEventListener('zentri:open-save-drawer', h); }, []);
  const [uaSearchQuery, setUaSearchQuery] = useState('');
  const [isSaveDrawerOpen, setIsSaveDrawerOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const OS_PLATFORMS = [
    { label: 'Windows (Win32)', value: 'Win32' }, { label: 'macOS (MacIntel)', value: 'MacIntel' },
    { label: 'Linux (x86_64)', value: 'Linux x86_64' }, { label: 'Android (Linux armv8l)', value: 'Linux armv8l' },
    { label: 'iPhone (iOS)', value: 'iPhone' }, { label: 'iPad (iOS)', value: 'iPad' },
  ];

  const isMobile = config.os === 'iPhone' || config.os === 'iPad' || config.os === 'Linux armv8l';

  const HW_OPTS = ['2','4','8','12','16','32'].filter(o => isMobile ? parseInt(o) <= 8 : true).map(v => ({ label: v, value: v }));
  const TOUCH_OPTS = ['0','1','5','10'].filter(o => isMobile ? parseInt(o) >= 5 : true).map(v => ({ label: v, value: v }));
  const MEM_OPTS = ['2','4','8','16','32','64'].filter(o => isMobile ? parseInt(o) <= 12 : true).map(v => ({ label: v, value: v }));
  const RES_OPTS = [{ label: '1920x1080', value: '1920x1080' },{ label: '2560x1440', value: '2560x1440' },{ label: '1366x768', value: '1366x768' },
    { label: '1440x900', value: '1440x900' },{ label: '412x915', value: '412x915' },{ label: '390x844', value: '390x844' }].filter(r => { const isM = parseInt(r.value.split('x')[0]) < 500; return isMobile ? isM : !isM; });
  const DPR_OPTS = [{ label: '1.0', value: '1.0' },{ label: '1.25', value: '1.25' },{ label: '1.5', value: '1.5' },{ label: '2.0', value: '2.0' },{ label: '3.0', value: '3.0' }].filter(o => isMobile ? parseFloat(o.value) >= 2.0 : true);
  const LANG_OPTS = [{ label: 'Vietnamese (vi-VN)', value: 'vi-VN' },{ label: 'English (en-US)', value: 'en-US' },{ label: 'Japanese (ja-JP)', value: 'ja-JP' },{ label: 'Korean (ko-KR)', value: 'ko-KR' },{ label: 'Chinese (zh-CN)', value: 'zh-CN' }];
  const LANGS_OPTS = [{ label: 'Vietnamese/English', value: '["vi-VN","vi","en-US","en"]' },{ label: 'English US', value: '["en-US","en"]' }];
  const DNT_OPTS = [{ label: '0 (Normal)', value: '0' },{ label: '1 (Do Not Track)', value: '1' }];
  const CANVAS_OPTS = ['123456','987654','456789','112233'].map(v => ({ label: v, value: v }));
  const AUDIO_OPTS = ['44100','48000','96000'].map(v => ({ label: v, value: v }));
  const VENDOR_OPTS = [{ label: 'Google Inc.', value: 'Google Inc.' },{ label: 'Apple Computer, Inc.', value: 'Apple Computer, Inc.' },{ label: '', value: '' }];
  const PROD_OPTS = [{ label: '20030107', value: '20030107' },{ label: '20100101', value: '20100101' }];
  const COLOR_OPTS = [{ label: '24', value: '24' },{ label: '30', value: '30' }];
  const BRAND_OPTS = [{ label: 'Google Chrome', value: 'Google Chrome' },{ label: 'Microsoft Edge', value: 'Microsoft Edge' },{ label: 'Safari', value: 'Safari' },{ label: 'Firefox', value: 'Firefox' }];
  const ACCURACY_OPTS = [{ label: 'High (10m)', value: '10' },{ label: 'Medium (150m)', value: '150' },{ label: 'Low (1000m+)', value: '1000' }];
  const FONT_OPTS = [{ label: 'Windows Standard', value: '["Arial","Courier New","Georgia","Segoe UI","Tahoma","Times New Roman","Verdana"]' },{ label: 'macOS Standard', value: '["Arial","Courier","Geneva","Helvetica","Monaco","Times","Verdana"]' }];
  const CHANNEL_OPTS = [{ label: 'Stereo (2)', value: '2' },{ label: 'Surround (6)', value: '6' }];
  const WEBGL_OPTS = [{ label: 'ANGLE (NVIDIA RTX 3060)', value: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)' },{ label: 'ANGLE (Intel UHD)', value: 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.9415)' },{ label: 'Apple M1', value: 'Apple M1' }];

  return (
    <div className="pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <FormSection title="01. User Agent" description="Định dạng cốt lõi xác định danh tính thiết bị." icon={Globe} isUnlocked={true}>
        <FormItem label="User Agent String" description="Chuỗi định danh trình duyệt.">
          <NativeCombobox value={config.ua} options={USER_AGENTS} searchQuery={uaSearchQuery} onSearchChange={setUaSearchQuery}
            onChange={(val) => { const p = parseUserAgent(val); setConfig(prev => ({ ...prev, ua: val, ...p })); setUaSearchQuery(''); }} placeholder="Search User Agent..." />
        </FormItem>
      </FormSection>

      <FormSection title="02. Platform & OS Version" description="Đồng bộ hóa hệ điều hành." icon={Monitor} isUnlocked={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormItem label="Platform" description="Hệ điều hành."><input type="text" readOnly value={OS_PLATFORMS.find(o => o.value === config.os)?.label || config.os} className={inputReadOnly} /></FormItem>
          <FormItem label="Platform Version" description="Phiên bản OS."><NativeCombobox value={config.osVersion} options={[{ label: '10.0.0', value: '10.0.0' },{ label: '14.5.0', value: '14.5.0' },{ label: '6.5.0', value: '6.5.0' },{ label: '14.0.0', value: '14.0.0' },{ label: '17.5.1', value: '17.5.1' }]} onChange={(v) => setConfig(p => ({ ...p, osVersion: v }))} /></FormItem>
          <FormItem label="Brand" description="Nhãn hiệu trình duyệt."><NativeCombobox value={config.brand} options={BRAND_OPTS} onChange={(v) => setConfig(p => ({ ...p, brand: v }))} /></FormItem>
          <FormItem label="Brand Version" description="Phiên bản."><input type="text" value={config.brandVersion} onChange={(e) => setConfig(p => ({ ...p, brandVersion: e.target.value }))} placeholder="131" className={inputClass} /></FormItem>
        </div>
      </FormSection>

      <FormSection title="03. Hardware Properties" description="Thông số CPU và RAM." icon={Activity} isUnlocked={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormItem label="Hardware Concurrency" description="Số lõi CPU."><NativeCombobox value={String(config.hardwareConcurrency)} options={HW_OPTS} onChange={(v) => setConfig(p => ({ ...p, hardwareConcurrency: parseInt(v) }))} /></FormItem>
          <FormItem label="Max Touch Points" description="Điểm chạm."><NativeCombobox value={String(config.maxTouchPoints)} options={TOUCH_OPTS} onChange={(v) => setConfig(p => ({ ...p, maxTouchPoints: parseInt(v) }))} /></FormItem>
          <FormItem label="Device Memory" description="RAM (GB)."><NativeCombobox value={String(config.deviceMemory)} options={MEM_OPTS} onChange={(v) => setConfig(p => ({ ...p, deviceMemory: parseInt(v) }))} /></FormItem>
        </div>
      </FormSection>

      <FormSection title="04. Screen Properties" description="Kích thước hiển thị." icon={Monitor} isUnlocked={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormItem label="Screen Resolution" description="Độ phân giải."><NativeCombobox value={`${config.width}x${config.height}`} options={RES_OPTS} onChange={(v) => { const [w,h] = v.split('x').map(Number); setConfig(p => ({ ...p, width: w, height: h, availWidth: w, availHeight: h-40, outerWidth: w, outerHeight: h-40, innerWidth: Math.max(0,w-16), innerHeight: Math.max(0,h-112) })); }} /></FormItem>
          <FormItem label="Available Resolution" description="Kích thước khả dụng."><input type="text" readOnly value={`${config.availWidth}x${config.availHeight}`} className={inputReadOnly} /></FormItem>
          <FormItem label="Device Pixel Ratio" description="Tỷ lệ điểm ảnh."><NativeCombobox value={String(config.devicePixelRatio)} options={DPR_OPTS} onChange={(v) => setConfig(p => ({ ...p, devicePixelRatio: parseFloat(v) }))} /></FormItem>
          <FormItem label="Color Depth" description="Độ sâu màu."><NativeCombobox value={String(config.colorDepth)} options={COLOR_OPTS} onChange={(v) => setConfig(p => ({ ...p, colorDepth: parseInt(v) }))} /></FormItem>
        </div>
      </FormSection>

      <FormSection title="05. Window Properties" description="Kích thước cửa sổ." icon={Layout} isUnlocked={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormItem label="Outer Resolution" description="Toàn bộ cửa sổ."><NativeCombobox value={`${config.outerWidth}x${config.outerHeight}`} options={RES_OPTS} onChange={(v) => { const [w,h] = v.split('x').map(Number); setConfig(p => ({ ...p, outerWidth: w, outerHeight: h, innerWidth: Math.max(0,w-16), innerHeight: Math.max(0,h-72) })); }} /></FormItem>
          <FormItem label="Inner Resolution" description="Viewport."><input type="text" readOnly value={`${config.innerWidth}x${config.innerHeight}`} className={inputReadOnly} /></FormItem>
          <FormItem label="Screen Position" description="Tọa độ."><input type="text" readOnly value={`${config.screenX},${config.screenY}`} className={inputReadOnly} /></FormItem>
        </div>
      </FormSection>

      <FormSection title="06. Language & Locale" description="Ngôn ngữ trình duyệt." icon={Globe} isUnlocked={true}>
        <FormItem label="Primary Language" description="Ngôn ngữ chính." action={
          <button onClick={() => setConfig(p => ({ ...p, autoIpLanguage: !p.autoIpLanguage }))}
            className={cn('flex items-center gap-2 px-3.5 h-8 rounded-t-xl border border-b-0 text-[9px] font-black uppercase tracking-widest transition-all', config.autoIpLanguage ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted/5 text-muted-foreground/40 border-border/10')}>
            <Globe className="w-2.5 h-2.5" />{config.autoIpLanguage ? 'ON AUTO IP' : 'AUTO IP'}
          </button>}>
          {config.autoIpLanguage ? <input type="text" readOnly value="Auto based on IP" className={inputReadOnly} /> : <NativeCombobox value={config.primaryLanguage} options={LANG_OPTS} onChange={(v) => setConfig(p => ({ ...p, primaryLanguage: v }))} />}
        </FormItem>
        <FormItem label="Languages (JSON)" description="Danh sách ngôn ngữ.">
          {config.autoIpLanguage ? <input type="text" readOnly value="Auto based on IP" className={inputReadOnly} /> : <NativeCombobox value={config.languages} options={LANGS_OPTS} onChange={(v) => setConfig(p => ({ ...p, languages: v }))} />}
        </FormItem>
      </FormSection>

      <FormSection icon={MapPin} title="07. Timezone & GPS" description="Vị trí địa lý." isUnlocked={true}>
        <FormItem label="Timezone" description="Múi giờ." action={
          <button onClick={() => setConfig(p => ({ ...p, autoIpTimezone: !p.autoIpTimezone }))}
            className={cn('flex items-center gap-2 px-3.5 h-8 rounded-t-xl border border-b-0 text-[9px] font-black uppercase tracking-widest transition-all', config.autoIpTimezone ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted/5 text-muted-foreground/40 border-border/10')}>
            <Globe className="w-2.5 h-2.5" />{config.autoIpTimezone ? 'ON AUTO IP' : 'AUTO IP'}
          </button>}>
          <input type="text" readOnly value={config.autoIpTimezone ? 'Auto based on IP' : config.timezone} className={inputReadOnly} />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FormItem label="Longitude" description="Kinh độ." action={
            <button onClick={() => setConfig(p => ({ ...p, autoIpGps: !p.autoIpGps }))}
              className={cn('flex items-center gap-2 px-3.5 h-8 rounded-t-xl border border-b-0 text-[9px] font-black uppercase tracking-widest transition-all', config.autoIpGps ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted/5 text-muted-foreground/40 border-border/10')}>
              <MapPin className="w-2.5 h-2.5" />{config.autoIpGps ? 'ON AUTO GPS' : 'GPS'}
            </button>}>
            <input type="text" readOnly={config.autoIpGps} value={config.autoIpGps ? 'Auto IP' : String(config.longitude)} onChange={(e) => setConfig(p => ({ ...p, longitude: parseFloat(e.target.value) || 0 }))} className={cn(inputClass, config.autoIpGps && 'opacity-60 bg-muted/20 cursor-not-allowed')} />
          </FormItem>
          <FormItem label="Latitude" description="Vĩ độ."><input type="text" readOnly={config.autoIpGps} value={config.autoIpGps ? 'Auto IP' : String(config.latitude)} onChange={(e) => setConfig(p => ({ ...p, latitude: parseFloat(e.target.value) || 0 }))} className={cn(inputClass, config.autoIpGps && 'opacity-60 bg-muted/20 cursor-not-allowed')} /></FormItem>
          <FormItem label="Accuracy (m)" description="Độ chính xác GPS."><NativeCombobox value={String(config.accuracy)} options={ACCURACY_OPTS} onChange={(v) => setConfig(p => ({ ...p, accuracy: parseFloat(v) }))} /></FormItem>
        </div>
      </FormSection>

      <FormSection title="08. Canvas & Media" description="Đồ họa và âm thanh." icon={Monitor} isUnlocked={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormItem label="Canvas Noise Seed" description="Canvas fingerprint."><NativeCombobox value={String(config.canvasNoiseSeed)} options={CANVAS_OPTS} onChange={(v) => setConfig(p => ({ ...p, canvasNoiseSeed: parseInt(v) }))} /></FormItem>
          <FormItem label="Audio Context" description="Sample rate."><NativeCombobox value={String(config.audioSampleRate)} options={AUDIO_OPTS} onChange={(v) => setConfig(p => ({ ...p, audioSampleRate: parseInt(v) }))} /></FormItem>
          <FormItem label="Fonts (JSON)" description="Danh sách font."><NativeCombobox value={config.canvasFonts} options={FONT_OPTS} onChange={(v) => setConfig(p => ({ ...p, canvasFonts: v }))} /></FormItem>
          <FormItem label="Max Channel Count" description="Kênh âm thanh."><NativeCombobox value={String(config.audioMaxChannelCount)} options={CHANNEL_OPTS} onChange={(v) => setConfig(p => ({ ...p, audioMaxChannelCount: parseInt(v) }))} /></FormItem>
        </div>
      </FormSection>

      <FormSection title="09. Browser Metadata" description="Thông số bảo mật." icon={Globe} isUnlocked={true}>
        <div className="grid grid-cols-1 gap-8">
          <FormItem label="Vendor" description="navigator.vendor."><NativeCombobox value={config.vendor} options={VENDOR_OPTS} onChange={(v) => setConfig(p => ({ ...p, vendor: v }))} /></FormItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormItem label="Product Sub" description="navigator.productSub."><NativeCombobox value={config.productSub} options={PROD_OPTS} onChange={(v) => setConfig(p => ({ ...p, productSub: v }))} /></FormItem>
            <FormItem label="Do Not Track" description="DNT."><NativeCombobox value={config.doNotTrack} options={DNT_OPTS} onChange={(v) => setConfig(p => ({ ...p, doNotTrack: v }))} /></FormItem>
          </div>
        </div>
      </FormSection>

      {/* Save Modal */}
      {isSaveDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSaveDrawerOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border/50">
              <h3 className="text-sm font-black uppercase tracking-[0.25em] text-foreground">Save Fingerprint</h3>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Set identity for your profile</p>
            </div>
            <div className="px-6 py-4 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">Name</label>
                  <button onClick={() => { const ua = USER_AGENTS.find(u => u.value === config.ua); if (ua) setConfig(p => ({ ...p, profileName: ua.label })); }}
                    className="px-3.5 h-7 rounded-t-xl bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/30 border-b-0">Use UA as name</button>
                </div>
                <input type="text" placeholder="e.g. Chrome Windows 11" value={config.profileName || ''} onChange={(e) => setConfig(p => ({ ...p, profileName: e.target.value }))}
                  className="w-full h-12 px-5 rounded-xl bg-input-background border border-border font-bold placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[{ label: 'OS', value: config.os },{ label: 'CPU', value: `${config.hardwareConcurrency} Cores` },{ label: 'RAM', value: `${config.deviceMemory}GB` },{ label: 'Res', value: `${config.width}x${config.height}` }].map(s => (
                    <button key={s.label} onClick={() => setConfig(p => ({ ...p, profileName: (p.profileName ? p.profileName + ' - ' : '') + s.value }))}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-primary/10 border border-white/5 text-[10px] font-bold text-muted-foreground hover:text-primary transition-all">{s.label}: {s.value}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">Description</label>
                <textarea placeholder="Enter short description..." value={config.profileDescription || ''} onChange={(e) => setConfig(p => ({ ...p, profileDescription: e.target.value }))}
                  className="w-full bg-input-background border border-border rounded-xl px-5 py-3 font-bold placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 min-h-[80px] resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border/50 flex gap-4">
              <button onClick={() => setIsSaveDrawerOpen(false)} className="flex-1 h-12 rounded-xl bg-muted/10 text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted/20 transition-all border border-border/10">Cancel</button>
              <button onClick={async () => {
                setSaveLoading(true);
                try {
                  const id = presetId && !presetId.startsWith('new-') ? presetId : crypto.randomUUID();
                  // @ts-ignore
                  await window.electron.ipcRenderer.invoke('sqlite:run', 'REPLACE INTO fingerprints (id, name, description, ua, os, os_version, config_json) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, config.profileName, config.profileDescription, config.ua, config.os, config.osVersion, JSON.stringify(config)]);
                  window.dispatchEvent(new CustomEvent('zentri:fingerprints-updated'));
                  setIsSaveDrawerOpen(false);
                } catch (error) { console.error('Failed to save fingerprint:', error); alert('Error saving configuration.'); }
                finally { setSaveLoading(false); }
              }}
                className="flex-[2] h-12 rounded-xl bg-primary/20 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.25em] hover:bg-primary/30 transition-all flex items-center justify-center gap-3">
                {saveLoading ? <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin" /> : <><CheckCircle2 className="w-5 h-5" />Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};