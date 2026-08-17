import { FC, useState } from 'react';
import {
  CheckCircle2,
  Globe,
  Monitor,
  Layout,
  HelpCircle,
  ChevronDown,
  Check,
  Cpu,
  Wifi,
  Battery,
  Database,
  Palette,
  Eye,
  Shield,
  FileText,
  MapPin,
  Sliders,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Tooltip } from '../../../../../components/ui/Tooltip';
import ModalHeader from '../../../../../components/ui/Modal/ModalHeader';
import Button from '../../../../../components/ui/Button/Button';
import Dropdown from '../../../../../components/ui/Dropdown/Dropdown';
import { DropdownTrigger } from '../../../../../components/ui/Dropdown/DropdownTrigger';
import { DropdownContent } from '../../../../../components/ui/Dropdown/DropdownContent';
import { DropdownItem } from '../../../../../components/ui/Dropdown/DropdownItem';
import { DropdownLabel } from '../../../../../components/ui/Dropdown/DropdownLabel';
import { Fingerprint, FingerprintConfig } from '../../../../../types/fingerprint-profile';

// ── Colors per section ────────────────────────────────────────────────
const STEP_COLORS: Record<string, string> = {
  '01. User-Agent': '#8b5cf6',
  '02. Hardware': '#10b981',
  '03. Screen': '#f59e0b',
  '04. Window': '#ef4444',
  '05. Language & Location': '#06b6d4',
  '06. Browser Metadata': '#64748b',
  '07. Canvas & Media': '#ec4899',
  '08. Preferences': '#84cc16',
  '09. Color & HDR': '#f97316',
  '10. Storage': '#14b8a6',
  '11. Battery': '#eab308',
  '12. Plugins & Fonts': '#a855f7',
  '13. Network': '#3b82f6',
};

const inputClass =
  'w-full h-9 px-3 rounded-md bg-muted/30 border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-colors';

// ── Options ───────────────────────────────────────────────────────────

const PLATFORM_DESKTOP = [
  'Win32',
  'Win64',
  'Linux x86_64',
  'Linux i686',
  'Linux armv8l',
  'MacIntel',
  'CrOS x86_64',
];
const PLATFORM_MOBILE = [
  'Android 9',
  'Android 10',
  'Android 11',
  'Android 12',
  'Android 13',
  'Android 14',
  'iPhone',
  'iPad',
];

// ── Platform → Version mapping ────────────────────────────────────────
const PLATFORM_VERSION_MAP: Record<string, string[]> = {
  'Win32': ['10.0.0', '14.0.0'],
  'Win64': ['10.0.0', '14.0.0'],
  'Linux x86_64': ['6.5.0', '6.8.0', '5.15.0'],
  'Linux i686': ['6.5.0', '5.15.0'],
  'Linux armv8l': ['6.5.0', '5.15.0'],
  'MacIntel': ['14.5.0', '15.0.0', '14.0.0', '13.6.0', '12.7.0'],
  'CrOS x86_64': ['14541.0.0', '15236.0.0', '16002.0.0'],
  'Android 9': ['9.0.0'],
  'Android 10': ['10.0.0'],
  'Android 11': ['11.0.0'],
  'Android 12': ['12.0.0'],
  'Android 13': ['13.0.0'],
  'Android 14': ['14.0.0'],
  'iPhone': ['18.0', '17.5.1', '17.0', '16.7.0'],
  'iPad': ['18.0', '17.5.1', '17.0', '16.7.0'],
};

const VENDOR_OPTIONS = [
  'Google Inc.',
  'Apple Computer, Inc.',
  'Apple Inc.',
  'Microsoft Corporation',
  '',
];

const OSCPU_OPTIONS = [
  'Windows NT 10.0; Win64; x64',
  'Windows NT 10.0; WOW64',
  'Intel Mac OS X 10_15_7',
  'Intel Mac OS X 10_15',
  'Linux x86_64',
  'Linux i686 on x86_64',
  'Android 14; arm64-v8a',
  'Android 13; armeabi-v7a',
  'iPhone; CPU iPhone OS 18_0 like Mac OS X',
  'iPhone; CPU iPhone OS 17_5 like Mac OS X',
  'iPad; CPU OS 18_0 like Mac OS X',
  '',
];

const BUILD_ID_OPTIONS = [
  '20250301000000',
  '20250215000000',
  '20250101000000',
  '20241201000000',
  '',
];

const BRAND_OPTIONS = [
  'Google Chrome',
  'Microsoft Edge',
  'Mozilla Firefox',
  'Brave',
  'Opera',
  'Chromium',
  '',
];

const BRAND_VERSION_OPTIONS = [
  '143',
  '140',
  '130',
  '120',
  '110',
  '100',
  '',
];

const LANGUAGE_OPTIONS = [
  'en-US',
  'vi-VN',
  'ja-JP',
  'zh-CN',
  'ko-KR',
  'fr-FR',
  'de-DE',
  'es-ES',
  'pt-BR',
  'ru-RU',
  'th-TH',
  'id-ID',
  'ar-SA',
  'hi-IN',
  '',
];

const TIMEZONE_OPTIONS = [
  'Asia/Ho_Chi_Minh',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Denver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
  '',
];

const SCREEN_SIZE_OPTIONS = [
  '1920×1080',
  '1366×768',
  '2560×1440',
  '1440×900',
  '1536×864',
  '390×844',
  '414×896',
  '360×800',
  '412×915',
  '375×812',
];

const BOOL_OPTIONS = ['true', 'false'];

const DNT_OPTIONS = ['1', '0', 'unspecified'];

const PREFERS_CONTRAST_OPTIONS = ['no-preference', 'more', 'less', 'custom'];

const CONNECTION_TYPE_OPTIONS = ['4g', '3g', '2g', 'slow-2g', 'ethernet', 'wifi', 'cellular'];

// ── Helpers ───────────────────────────────────────────────────────────

function toDisplayValue(v: unknown): string {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function parseValue(raw: string, original: unknown): unknown {
  if (typeof original === 'number') {
    const n = Number(raw);
    return isNaN(n) ? original : n;
  }
  if (typeof original === 'boolean') {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return original;
  }
  if (Array.isArray(original)) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return raw;
}

// ── Sub-components ────────────────────────────────────────────────────

const FormSection: FC<{
  title: string;
  description?: string;
  icon: any;
  children: React.ReactNode;
}> = ({ title, description, icon: Icon, children }) => {
  const stepColor = STEP_COLORS[title] || '#3b82f6';
  return (
    <div className="relative group">
      <div className="flex items-start gap-3 relative z-10">
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${stepColor}15`, color: stepColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h2 className="text-[13px] font-black tracking-widest uppercase text-foreground">
            {title}
          </h2>
          <p className="text-[11px] text-secondary leading-relaxed truncate">{description}</p>
        </div>
      </div>
      <div className="mt-[19px]">
        <div className="space-y-6">{children}</div>
      </div>
      <div className="h-px bg-border/40 mt-4 w-full opacity-50" />
    </div>
  );
};

const FormItem: FC<{
  label: string;
  description: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5">
      <label className="text-[13px] font-bold text-foreground truncate">{label}</label>
      <Tooltip
        content={<p className="text-xs max-w-[320px] leading-relaxed">{description}</p>}
        side="right"
      >
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help shrink-0" />
      </Tooltip>
    </div>
    {children}
  </div>
);

/** Text input field */
const TextField: FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={inputClass}
  />
);

/** Textarea field */
const TextareaField: FC<{ value: string; onChange: (v: string) => void; rows?: number }> = ({
  value,
  onChange,
  rows = 3,
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={rows}
    className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-xs text-foreground font-mono resize-none focus:outline-none focus:border-primary/50 focus:bg-background transition-colors"
  />
);

/** Dropdown select field */
const SelectField: FC<{
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ value, options, onChange }) => (
  <Dropdown align="start" side="bottom" strategy="fixed" className="w-full">
    <DropdownTrigger>
      <div className="flex items-center w-full h-9 px-3 rounded-md bg-muted/30 border border-border text-sm text-foreground cursor-pointer hover:border-primary/40 transition-colors">
        <span className="flex-1 truncate">{value || '—'}</span>
        <ChevronDown className="w-4 h-4 text-secondary shrink-0 ml-2" />
      </div>
    </DropdownTrigger>
    <DropdownContent className="min-w-[200px] max-h-[250px] overflow-auto custom-scrollbar bg-dropdown-background border border-border rounded-xl shadow-2xl p-1">
      {options.map((opt) => (
        <DropdownItem key={opt} onClick={() => onChange(opt)} closeOnSelect>
          <div className="flex items-center gap-2">
            <span className={value === opt ? 'font-bold text-primary' : ''}>
              {opt || '(empty)'}
            </span>
            {value === opt && <Check className="w-3.5 h-3.5 text-success shrink-0 ml-auto" />}
          </div>
        </DropdownItem>
      ))}
    </DropdownContent>
  </Dropdown>
);

/** Platform dropdown with Desktop/Mobile groups */
const PlatformSelect: FC<{ value: string; onChange: (v: string) => void }> = ({
  value,
  onChange,
}) => (
  <Dropdown align="start" side="bottom" strategy="fixed" className="w-full">
    <DropdownTrigger>
      <div className="flex items-center w-full h-9 px-3 rounded-md bg-muted/30 border border-border text-sm text-foreground cursor-pointer hover:border-primary/40 transition-colors">
        <span className="flex-1 truncate">{value || '—'}</span>
        <ChevronDown className="w-4 h-4 text-secondary shrink-0 ml-2" />
      </div>
    </DropdownTrigger>
    <DropdownContent className="min-w-[200px] max-h-[300px] overflow-auto custom-scrollbar bg-dropdown-background border border-border rounded-xl shadow-2xl p-1">
      <DropdownLabel>Desktop</DropdownLabel>
      {PLATFORM_DESKTOP.map((opt) => (
        <DropdownItem key={opt} onClick={() => onChange(opt)} closeOnSelect>
          <span className={value === opt ? 'font-bold text-primary' : ''}>{opt}</span>
          {value === opt && <Check className="w-3.5 h-3.5 text-success shrink-0 ml-auto" />}
        </DropdownItem>
      ))}
      <DropdownLabel>Mobile</DropdownLabel>
      {PLATFORM_MOBILE.map((opt) => (
        <DropdownItem key={opt} onClick={() => onChange(opt)} closeOnSelect>
          <span className={value === opt ? 'font-bold text-primary' : ''}>{opt}</span>
          {value === opt && <Check className="w-3.5 h-3.5 text-success shrink-0 ml-auto" />}
        </DropdownItem>
      ))}
    </DropdownContent>
  </Dropdown>
);

/** Platform Version dropdown — options depend on selected platform */
const PlatformVersionSelect: FC<{
  value: string;
  platform: string;
  onChange: (v: string) => void;
}> = ({ value, platform, onChange }) => {
  const versions = PLATFORM_VERSION_MAP[platform] || [];
  return (
    <Dropdown align="start" side="bottom" strategy="fixed" className="w-full">
      <DropdownTrigger>
        <div className="flex items-center w-full h-9 px-3 rounded-md bg-muted/30 border border-border text-sm text-foreground cursor-pointer hover:border-primary/40 transition-colors">
          <span className="flex-1 truncate">{value || '—'}</span>
          <ChevronDown className="w-4 h-4 text-secondary shrink-0 ml-2" />
        </div>
      </DropdownTrigger>
      <DropdownContent className="min-w-[200px] max-h-[250px] overflow-auto custom-scrollbar bg-dropdown-background border border-border rounded-xl shadow-2xl p-1">
        {versions.length === 0 && (
          <DropdownLabel>Select a platform first</DropdownLabel>
        )}
        {versions.map((opt) => (
          <DropdownItem key={opt} onClick={() => onChange(opt)} closeOnSelect>
            <span className={value === opt ? 'font-bold text-primary' : ''}>{opt}</span>
            {value === opt && <Check className="w-3.5 h-3.5 text-success shrink-0 ml-auto" />}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
};

/** Paired Width x Height dropdown — parses "WIDTHxHEIGHT" into two fields */
const PairSelectField: FC<{
  valueW: string;
  valueH: string;
  options: string[];
  onChangeW: (v: string) => void;
  onChangeH: (v: string) => void;
}> = ({ valueW, valueH, options, onChangeW, onChangeH }) => {
  const displayValue = valueW && valueH ? `${valueW}x${valueH}` : '';
  return (
    <Dropdown align="start" side="bottom" strategy="fixed" className="w-full">
      <DropdownTrigger>
        <div className="flex items-center w-full h-9 px-3 rounded-md bg-muted/30 border border-border text-sm text-foreground cursor-pointer hover:border-primary/40 transition-colors">
          <span className="flex-1 truncate">{displayValue || '—'}</span>
          <ChevronDown className="w-4 h-4 text-secondary shrink-0 ml-2" />
        </div>
      </DropdownTrigger>
      <DropdownContent className="min-w-[200px] max-h-[250px] overflow-auto custom-scrollbar bg-dropdown-background border border-border rounded-xl shadow-2xl p-1">
        {options.map((opt) => {
          const parts = opt.split('x');
          const w = parts[0]?.trim() || '';
          const h = parts[1]?.trim() || '';
          const selected = valueW === w && valueH === h;
          return (
            <DropdownItem
              key={opt}
              onClick={() => {
                onChangeW(w);
                onChangeH(h);
              }}
              closeOnSelect
            >
              <span className={selected ? 'font-bold text-primary' : ''}>{opt}</span>
              {selected && <Check className="w-3.5 h-3.5 text-success shrink-0 ml-auto" />}
            </DropdownItem>
          );
        })}
      </DropdownContent>
    </Dropdown>
  );
};

// ── Fingerprint Detail ─────────────────────────────────────────────────

interface FingerprintDetailProps {
  onClose: () => void;
  onBack: () => void;
  fingerprint: Fingerprint;
  onConfirm: (config: FingerprintConfig) => void;
}

const FingerprintDetail: FC<FingerprintDetailProps> = ({
  onClose,
  onBack,
  fingerprint,
  onConfirm,
}) => {
  const original = fingerprint.config;
  const [edited, setEdited] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const [k, v] of Object.entries(original)) {
      init[k] = toDisplayValue(v);
    }
    return init;
  });

  const set = (key: string, value: string) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    const merged: FingerprintConfig = { ...original };
    for (const [k, v] of Object.entries(edited)) {
      (merged as any)[k] = parseValue(v, (original as any)[k]);
    }
    onConfirm(merged);
  };

  return (
    <>
      <ModalHeader
        title="Fingerprint Details"
        description={fingerprint.name}
        onBack={onBack}
        onClose={onClose}
      />
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar px-5 py-4 space-y-4">
          {/* ── 01. User-Agent ──────────────────────────────────── */}
          <FormSection
            title="01. User-Agent"
            description="Chuỗi định danh trình duyệt và hệ điều hành — đây là fingerprint quan trọng nhất, được gửi trong mọi HTTP request."
            icon={Globe}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormItem
                label="Platform"
                description={`navigator.platform — chuỗi xác định nền tảng OS mà trình duyệt chạy trên đó. Đây là một trong những tín hiệu lâu đời nhất để fingerprint OS. Trang web thường dùng giá trị này để quyết định tải bản binary phù hợp (Windows .exe vs macOS .dmg).\n\n⚠️ Mẹo: Nếu platform là "Win32" nhưng các tín hiệu khác (font, WebGL, timezone) lại khớp với macOS → red flag lớn. Luôn đảm bảo platform nhất quán với oscpu, vendor, và WebGL vendor.\n\nGiá trị phổ biến: Win32 (Windows), MacIntel (macOS), Linux x86_64 (Linux desktop), iPhone/iPad (iOS), Linux armv8l (Android).`}
              >
                <PlatformSelect
                  value={edited.platform || ''}
                  onChange={(v) => set('platform', v)}
                />
              </FormItem>
              <FormItem
                label="Platform Version"
                description={`Phiên bản của hệ điều hành dưới dạng số. Với Windows: "10.0.0" = Windows 10, "14.0.0" = Windows 11. Với macOS: "14.5.0" = Sonoma 14.5. Với Android: "13.0.0" = Android 13.\n\n⚠️ Mẹo: Đảm bảo phiên bản platform khớp với thời điểm hiện tại và các tính năng CSS/JS mà OS đó hỗ trợ. Ví dụ: Windows 11 (14.0.0) mới có HDR support tốt, nếu platformVersion là 10.0.0 nhưng hdrSupport=true → mâu thuẫn.`}
              >
                <PlatformVersionSelect
                  value={edited.platformVersion || ''}
                  platform={edited.platform || ''}
                  onChange={(v) => set('platformVersion', v)}
                />
              </FormItem>
              <FormItem
                label="OS CPU"
                description={`navigator.oscpu — chuỗi mô tả kiến trúc CPU + OS. Định dạng: "Windows NT 10.0; Win64; x64" hoặc "Intel Mac OS X 10_15_7". Đây là một fingerprinting vector mạnh vì nó tiết lộ chính xác kiến trúc CPU (x64, arm64, x86).\n\n⚠️ Mẹo: oscpu phải khớp với platform và userAgent. Nếu platform="MacIntel" nhưng oscpu lại nhắc đến "Windows" → inconsistency. Trên Apple Silicon Mac chạy Rosetta, oscpu vẫn báo "Intel Mac OS X" dù CPU là ARM — đây là hành vi đúng của Chrome.`}
              >
                <SelectField
                  value={edited.oscpu || ''}
                  options={OSCPU_OPTIONS}
                  onChange={(v) => set('oscpu', v)}
                />
              </FormItem>
              <FormItem
                label="Build ID"
                description={`Mã build nội bộ của trình duyệt. Firefox dùng định dạng "YYYYMMDDHHMMSS" (vd: "20250301000000"). Chrome/Edge thường để undefined.\n\n⚠️ Mẹo: Chỉ set buildID nếu bạn đang giả làm Firefox. Nếu buildID có giá trị nhưng UA là Chrome → red flag ngay lập tức.`}
              >
                <SelectField
                  value={edited.buildID || ''}
                  options={BUILD_ID_OPTIONS}
                  onChange={(v) => set('buildID', v)}
                />
              </FormItem>
              <FormItem
                label="Brand"
                description={`Tên thương hiệu trình duyệt từ navigator.userAgentData.brands (nếu có). Ví dụ: "Google Chrome", "Microsoft Edge", "Mozilla Firefox". Đây là API mới thay thế dần navigator.userAgent.\n\n⚠️ Mẹo: Brand phải khớp với UA string và vendor. Nếu brand="Google Chrome" nhưng vendor="Apple Computer, Inc." → bị phát hiện ngay.`}
              >
                <SelectField
                  value={edited.brand || ''}
                  options={BRAND_OPTIONS}
                  onChange={(v) => set('brand', v)}
                />
              </FormItem>
              <FormItem
                label="Brand Version"
                description={`Phiên bản của brand từ navigator.userAgentData.brands. Ví dụ: "143", "140", "130". Thường khớp với major version trong UA.\n\n⚠️ Mẹo: Brand version phải khớp với phiên bản Chrome/Engine trong UA. Các site anti-bot thường kiểm tra chéo giữa userAgent, brand version, và engine version.`}
              >
                <SelectField
                  value={edited.brandVersion || ''}
                  options={BRAND_VERSION_OPTIONS}
                  onChange={(v) => set('brandVersion', v)}
                />
              </FormItem>
            </div>
            <div className="mt-3">
              <FormItem
                label="App Version"
                description={`navigator.appVersion — phiên bản ứng dụng, thường có định dạng "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/...". Đây là một thuộc tính cũ, ít được dùng để fingerprint nhưng vẫn nên nhất quán với UA.\n\n⚠️ Mẹo: Đối với Firefox, appVersion bắt đầu bằng "5.0 (". Đối với Chrome/Edge, thường bao gồm cả AppleWebKit. Nếu appVersion rỗng hoặc sai format → đáng ngờ.`}
              >
                <input
                  type="text"
                  value={edited.appVersion || ''}
                  onChange={(e) => set('appVersion', e.target.value)}
                  className={inputClass}
                />
              </FormItem>
            </div>
            <div className="mt-3">
              <FormItem
                label="User Agent"
                description={`navigator.userAgent — chuỗi User-Agent đầy đủ, fingerprint quan trọng bậc nhất. Mỗi request HTTP đều gửi kèm chuỗi này. Định dạng: "Mozilla/5.0 ([platform]; [cpu]) AppleWebKit/... (KHTML, like Gecko) [browser]/[version] Safari/...".\n\n⚠️ Kỹ thuật anti-detect:\n• UA phải tương thích với OS group: Chrome/Edge dùng chung format cho mọi OS; Safari chỉ có trên macOS/iOS; Firefox có format riêng "Gecko/20100101".\n• Không dùng Chrome UA giả mạo trên mobile nếu các API chỉ có trên desktop (như 'navigator.bluetooth').\n• Không dùng phiên bản quá cũ (vd: Chrome 80 năm 2025) — các site kiểm tra version freshness qua các API mới.\n• HeadlessChrome trong UA = bot bị phát hiện ngay.`}
              >
                <TextareaField
                  value={edited.userAgent || ''}
                  onChange={(v) => set('userAgent', v)}
                  rows={4}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 02. Hardware ────────────────────────────────────── */}
          <FormSection
            title="02. Hardware"
            description="Thông số CPU, RAM, và cảm ứng — các fingerprint tĩnh, ít thay đổi."
            icon={Cpu}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormItem
                label="CPU Cores"
                description={`navigator.hardwareConcurrency — số lõi CPU logic mà trình duyệt nhìn thấy. Đây là fingerprint rất ổn định (không thay đổi giữa các lần mở trình duyệt).\n\n⚠️ Mẹo:\n• Desktop phổ thông: 4-16 cores.\n• Smartphone: thường 6-8 cores (big.LITTLE).\n• Giá trị quá cao (32+) trên mobile → đáng ngờ.\n• Nếu bạn chạy VM/proxy, hardwareConcurrency của máy ảo thường thấp hơn máy thật.`}
              >
                <TextField
                  value={edited.hardwareConcurrency || ''}
                  onChange={(v) => set('hardwareConcurrency', v)}
                />
              </FormItem>
              <FormItem
                label="Touch Points"
                description={`navigator.maxTouchPoints — số điểm chạm đồng thời tối đa mà màn hình hỗ trợ. Desktop không có touch screen → 0. Laptop touch screen → 5-10. Smartphone/tablet → 5.\n\n⚠️ Mẹo: Nếu platform="Win32" nhưng maxTouchPoints=5 (có touch screen) → hợp lệ với laptop cảm ứng. Nhưng nếu platform="iPhone" mà maxTouchPoints=0 → red flag. Một số site anti-bot kiểm tra chéo với touch event API.`}
              >
                <TextField
                  value={edited.maxTouchPoints || ''}
                  onChange={(v) => set('maxTouchPoints', v)}
                />
              </FormItem>
              <FormItem
                label="Perf. Memory (MB)"
                description={`performance.memory?.usedJSHeapSize / jsHeapSizeLimit — lượng JS heap memory đang dùng. Chỉ khả dụng trên Chrome (non-standard API).\n\n⚠️ Mẹo: Giá trị này động, thay đổi theo từng phiên. Nên để giá trị hợp lý (~50-200 MB cho trang web bình thường). Nếu giá trị static giữa các lần load → đáng ngờ (bot).`}
              >
                <TextField
                  value={edited.performanceMemory || ''}
                  onChange={(v) => set('performanceMemory', v)}
                />
              </FormItem>
              <FormItem
                label="RAM (GB)"
                description={`navigator.deviceMemory — dung lượng RAM thiết bị (GB), chỉ có trên Chrome. Các giá trị: 0.25, 0.5, 1, 2, 4, 8, 16, 32.\n\n⚠️ Mẹo:\n• Desktop hiện đại: 8-32 GB.\n• Mobile: 4-8 GB phổ biến, 2-4 GB cho máy giá rẻ.\n• Apple Silicon Mac: deviceMemory thường không được expose (undefined) trên Safari. Nếu để 32GB trên iPhone → impossible.\n• Giá trị này bị làm tròn về lũy thừa của 2 gần nhất.`}
              >
                <TextField
                  value={edited.deviceMemory || ''}
                  onChange={(v) => set('deviceMemory', v)}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 03. Screen ──────────────────────────────────────── */}
          <FormSection
            title="03. Screen"
            description="Độ phân giải và khả năng hiển thị màn hình — ảnh hưởng trực tiếp đến canvas fingerprint."
            icon={Monitor}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormItem
                label="Resolution (W×H)"
                description={`screen.width × screen.height — độ phân giải màn hình. Desktop phổ biến: 1920×1080, 1366×768, 2560×1440. Mobile: 390×844, 414×896. Giá trị phải nhất quán với devicePixelRatio và screenAvailWidth.\n\n⚠️ Mẹo: Nếu screenWidth=1920 và dpr=3 → đây là màn hình 5760px vật lý (rất hiếm).`}
              >
                <PairSelectField
                  valueW={edited.screenWidth || ''}
                  valueH={edited.screenHeight || ''}
                  options={SCREEN_SIZE_OPTIONS}
                  onChangeW={(v) => set('screenWidth', v)}
                  onChangeH={(v) => set('screenHeight', v)}
                />
              </FormItem>
              <FormItem
                label="Avail (W×H)"
                description={`screen.availWidth × screen.availHeight — kích thước khả dụng (trừ taskbar/dock). Desktop: thường = screenWidth/Height trừ taskbar (~40px). Mobile: trừ status bar (~60px).\n\n⚠️ Mẹo: Đây là fingerprint vector mạnh — tổ hợp availHeight + screenHeight + windowOuterHeight tạo signature đặc trưng cho từng OS/DE.`}
              >
                <PairSelectField
                  valueW={edited.screenAvailWidth || ''}
                  valueH={edited.screenAvailHeight || ''}
                  options={SCREEN_SIZE_OPTIONS}
                  onChangeW={(v) => set('screenAvailWidth', v)}
                  onChangeH={(v) => set('screenAvailHeight', v)}
                />
              </FormItem>
              <FormItem
                label="Pixel Ratio"
                description={`window.devicePixelRatio — tỉ lệ giữa pixel vật lý và CSS pixel. Desktop thường = 1, MacBook Retina = 2, smartphone = 2-3.5.\n\n⚠️ Mẹo:\n• DPR 1 → màn hình non-Retina (phần lớn desktop Windows/Linux).\n• DPR 2 → MacBook Retina, 1 số laptop Windows cao cấp.\n• DPR 3+ → smartphone flagship.\n• DPR không phải số nguyên (vd: 2.75) thường là do Android scaling.`}
              >
                <TextField
                  value={edited.devicePixelRatio || ''}
                  onChange={(v) => set('devicePixelRatio', v)}
                />
              </FormItem>
              <FormItem
                label="Color Depth"
                description={`screen.colorDepth — độ sâu màu (bit). Hầu như luôn là 24-bit (true color) trên mọi thiết bị hiện đại. Giá trị 30-bit hoặc 48-bit rất hiếm (màn hình chuyên nghiệp).\n\n⚠️ Mẹo: Để 24 là an toàn nhất. Nếu để 8 hoặc 16 → thiết bị quá cũ hoặc máy ảo cấu hình thấp.`}
              >
                <TextField
                  value={edited.screenColorDepth || ''}
                  onChange={(v) => set('screenColorDepth', v)}
                />
              </FormItem>
              <FormItem
                label="Pixel Depth"
                description={`screen.pixelDepth — giống colorDepth, hầu như luôn = 24. Khác biệt giữa colorDepth và pixelDepth là một tín hiệu bất thường (thường chúng bằng nhau).\n\n⚠️ Mẹo: Luôn để pixelDepth = colorDepth (24). Nếu khác nhau → có thể là dấu hiệu của máy ảo hoặc cấu hình đồ họa lạ.`}
              >
                <TextField
                  value={edited.screenPixelDepth || ''}
                  onChange={(v) => set('screenPixelDepth', v)}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 04. Window ──────────────────────────────────────── */}
          <FormSection
            title="04. Window"
            description="Kích thước và vị trí cửa sổ trình duyệt — fingerprint động, thay đổi theo thói quen người dùng."
            icon={Layout}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormItem
                label="Outer (W×H)"
                description={`window.outerWidth × window.outerHeight — kích thước toàn bộ cửa sổ trình duyệt (bao gồm border, toolbar). Thường = screenWidth/Height trên cửa sổ maximize.\n\n⚠️ Mẹo: outerHeight phải ≤ screenAvailHeight (nếu có taskbar). outerHeight > screenHeight → impossible, red flag.`}
              >
                <PairSelectField
                  valueW={edited.windowOuterWidth || ''}
                  valueH={edited.windowOuterHeight || ''}
                  options={SCREEN_SIZE_OPTIONS}
                  onChangeW={(v) => set('windowOuterWidth', v)}
                  onChangeH={(v) => set('windowOuterHeight', v)}
                />
              </FormItem>
              <FormItem
                label="Inner (W×H)"
                description={`window.innerWidth × window.innerHeight — kích thước viewport (không bao gồm scrollbar, border). Đây là kích thước CSS media queries sử dụng.\n\n⚠️ Mẹo: innerWidth < outerWidth (thường nhỏ hơn ~16px). innerHeight < outerHeight (trừ toolbar ~80-120px).`}
              >
                <PairSelectField
                  valueW={edited.windowInnerWidth || ''}
                  valueH={edited.windowInnerHeight || ''}
                  options={SCREEN_SIZE_OPTIONS}
                  onChangeW={(v) => set('windowInnerWidth', v)}
                  onChangeH={(v) => set('windowInnerHeight', v)}
                />
              </FormItem>
              <FormItem
                label="Screen X"
                description={`window.screenX — tọa độ X của cửa sổ trên màn hình. Giá trị âm nếu cửa sổ bị kéo 1 phần ra ngoài màn hình trái.\n\n⚠️ Mẹo: Bot thường để screenX=0, screenY=0 (cửa sổ ở góc trái trên cùng). Người dùng thật hiếm khi để cửa sổ ở đúng vị trí này. Để giá trị ngẫu nhiên nhỏ (0-100) sẽ tự nhiên hơn.`}
              >
                <TextField
                  value={edited.screenX || ''}
                  onChange={(v) => set('screenX', v)}
                />
              </FormItem>
              <FormItem
                label="Screen Y"
                description={`window.screenY — tọa độ Y của cửa sổ.\n\n⚠️ Mẹo: Tương tự screenX, screenY=0 là suspicious. Để giá trị > 0 (vd: 30-50) sẽ giống người dùng thật hơn. Trên macOS, screenY thường ≥ 25 do menu bar.`}
              >
                <TextField
                  value={edited.screenY || ''}
                  onChange={(v) => set('screenY', v)}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 05. Language & Location ─────────────────────────── */}
          <FormSection
            title="05. Language & Location"
            description="Ngôn ngữ, múi giờ và vị trí địa lý — phải nhất quán với IP."
            icon={MapPin}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormItem
                label="Language"
                description={`navigator.language — ngôn ngữ chính của trình duyệt (vd: "en-US", "vi-VN"). Đây là Accept-Language header trong HTTP request.\n\n⚠️ Mẹo:\n• Language phải khớp với country của IP. IP Việt Nam + language="en-US" → có thể (người dùng cài tiếng Anh), nhưng IP Việt Nam + language="ru-RU" → đáng ngờ.\n• Định dạng: mã ISO 639-1 + mã ISO 3166-1 (vi-VN, ja-JP, fr-FR).\n• Trên iOS, language có thể khác với region setting.`}
              >
                <SelectField
                  value={edited.language || ''}
                  options={LANGUAGE_OPTIONS}
                  onChange={(v) => set('language', v)}
                />
              </FormItem>
              <FormItem
                label="Languages"
                description={`navigator.languages — danh sách ngôn ngữ ưu tiên (vd: "vi-VN, vi, en-US, en"). Trình duyệt gửi danh sách này trong Accept-Language header, theo thứ tự ưu tiên giảm dần.\n\n⚠️ Mẹo:\n• Luôn có ít nhất 2 ngôn ngữ (primary + fallback English).\n• Ngôn ngữ chính phải trùng với navigator.language.\n• Danh sách quá nhiều ngôn ngữ (5+) → có thể là dấu hiệu của công cụ tự động.`}
              >
                <TextField
                  value={edited.languages || ''}
                  onChange={(v) => set('languages', v)}
                />
              </FormItem>
              <FormItem
                label="Timezone"
                description={`Intl.DateTimeFormat().resolvedOptions().timeZone — múi giờ IANA (vd: "Asia/Ho_Chi_Minh", "America/New_York"). Fingerprint cực kỳ quan trọng.\n\n⚠️ Kỹ thuật:\n• Timezone PHẢI khớp với IP geolocation. Đây là check phổ biến nhất của Cloudflare/DataDome.\n• Không dùng UTC trừ khi IP thực sự ở vùng UTC+0 (Anh, Bồ Đào Nha, Iceland...).\n• Timezone không khớp → bị block ngay lập tức trên các site bảo mật cao.\n• Một số VPN/proxy không spoof timezone → lộ IP thật.`}
              >
                <SelectField
                  value={edited.timezone || ''}
                  options={TIMEZONE_OPTIONS}
                  onChange={(v) => set('timezone', v)}
                />
              </FormItem>
              <FormItem
                label="Offset (min)"
                description={`new Date().getTimezoneOffset() — UTC offset tính bằng phút. Giá trị = -(giờ UTC). Ví dụ: Việt Nam UTC+7 → offset = -420.\n\n⚠️ Kỹ thuật:\n• Offset phải khớp với timezone. Nếu timezone="Asia/Ho_Chi_Minh" nhưng offset=-480 (UTC+8) → mâu thuẫn.\n• Offset thay đổi theo DST (daylight saving time). Nếu timezone có DST (vd: America/New_York) thì offset khác nhau giữa mùa hè và mùa đông.\n• Một số anti-bot tool tính offset từ Date object thay vì hỏi timezone name.`}
              >
                <TextField
                  value={edited.timezoneOffset || ''}
                  onChange={(v) => set('timezoneOffset', v)}
                />
              </FormItem>
              <FormItem
                label="Latitude"
                description={`Geolocation API latitude — vĩ độ GPS. Phải khớp với IP location. Thường được lấy từ navigator.geolocation.getCurrentPosition().\n\n⚠️ Mẹo:\n• Vĩ độ phải nằm trong khoảng [-90, 90].\n• Độ chính xác thường ~100m với GPS, ~1000m với IP-based.\n• Không để vĩ độ = 0 (xích đạo) trừ khi IP thực sự ở gần xích đạo.`}
              >
                <TextField
                  value={edited.latitude || ''}
                  onChange={(v) => set('latitude', v)}
                />
              </FormItem>
              <FormItem
                label="Longitude"
                description={`Geolocation API longitude — kinh độ GPS. Phải khớp với IP location và latitude.\n\n⚠️ Mẹo:\n• Kinh độ phải nằm trong khoảng [-180, 180].\n• Cặp (lat, lon) phải nằm trên đất liền nếu IP là residential, hoặc gần bờ biển nếu là mobile.\n• Tọa độ (0, 0) ngoài khơi châu Phi → red flag cực lớn.`}
              >
                <TextField
                  value={edited.longitude || ''}
                  onChange={(v) => set('longitude', v)}
                />
              </FormItem>
              <FormItem
                label="Accuracy (m)"
                description={`Geolocation API accuracy — độ chính xác của GPS (mét). Giá trị càng nhỏ càng chính xác. GPS thật: 5-50m. IP-based: 100-5000m.\n\n⚠️ Mẹo: Nếu accuracy=5m nhưng bạn đang dùng IP từ datacenter → đáng ngờ (datacenter không có GPS). Để accuracy cao (100-1000m) sẽ realistic hơn cho IP-based location.`}
              >
                <TextField
                  value={edited.accuracy || ''}
                  onChange={(v) => set('accuracy', v)}
                />
              </FormItem>
            </div>
            {edited.latitude && edited.longitude && !isNaN(parseFloat(edited.latitude)) && !isNaN(parseFloat(edited.longitude)) && (
              <div className="mt-3 rounded-lg overflow-hidden border border-border" style={{ height: 200 }}>
                <MapContainer
                  center={[parseFloat(edited.latitude), parseFloat(edited.longitude)]}
                  zoom={13}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[parseFloat(edited.latitude), parseFloat(edited.longitude)]} />
                </MapContainer>
              </div>
            )}
          </FormSection>

          {/* ── 06. Browser Metadata ────────────────────────────── */}
          <FormSection
            title="06. Browser Metadata"
            description="Các thuộc tính trình duyệt bổ sung — kiểm tra tính xác thực của browser identity."
            icon={Shield}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormItem
                label="Vendor"
                description={`navigator.vendor — tên vendor trình duyệt. Chrome → "Google Inc.", Safari → "Apple Computer, Inc.", Firefox → "" (empty string).\n\n⚠️ Kỹ thuật:\n• Vendor phải khớp với OS và browser: Apple OS + Chrome → vendor="Google Inc." (đúng), không phải "Apple Computer, Inc.".\n• Firefox để vendor="" là đúng spec. Nếu vendor="Google Inc." trên Firefox → bị phát hiện.\n• Một số site check vendor như 1 phần của browser validation.`}
              >
                <SelectField
                  value={edited.vendor || ''}
                  options={VENDOR_OPTIONS}
                  onChange={(v) => set('vendor', v)}
                />
              </FormItem>
              <FormItem
                label="Vendor Sub"
                description={`navigator.vendorSub — vendor phụ, thường là empty string trên hầu hết trình duyệt. Chỉ Apple WebKit cũ từng set giá trị này.\n\n⚠️ Mẹo: Để "" (rỗng) là an toàn nhất. Nếu có giá trị lạ → có thể trigger heuristic check.`}
              >
                <TextField
                  value={edited.vendorSub || ''}
                  onChange={(v) => set('vendorSub', v)}
                />
              </FormItem>
              <FormItem
                label="Product Sub"
                description={`navigator.productSub — phiên bản build của engine. Chrome thường set "20030107" (build date). Firefox: "20100101". Safari: "20030107".\n\n⚠️ Mẹo: productSub="20030107" là giá trị hard-coded trong Chromium từ năm 2003. Nếu thay đổi → đáng ngờ. Firefox dùng "20100101". Sai browser mà dùng sai productSub → bị phát hiện.`}
              >
                <TextField
                  value={edited.productSub || ''}
                  onChange={(v) => set('productSub', v)}
                />
              </FormItem>
              <FormItem
                label="Do Not Track"
                description={`navigator.doNotTrack — tín hiệu DNT header. "1" = bật, "0" = tắt, "unspecified" = không set. Đa số người dùng để unspecified.\n\n⚠️ Mẹo: DNT="1" từng phổ biến (2013-2019) nhưng hiện nay ít người bật. Nếu tỉ lệ DNT="1" quá cao trong traffic → suspicious pattern.`}
              >
                <SelectField
                  value={edited.doNotTrack || ''}
                  options={DNT_OPTIONS}
                  onChange={(v) => set('doNotTrack', v)}
                />
              </FormItem>
              <FormItem
                label="Cookie Enabled"
                description={`navigator.cookieEnabled — trình duyệt có bật cookie không. Hầu như luôn true, trừ khi người dùng cố ý tắt.\n\n⚠️ Mẹo: Nếu cookieEnabled=false nhưng site vẫn set được cookie (có JSESSION/PHPSESSID) → mâu thuẫn, bị phát hiện là bot đang cố ẩn.`}
              >
                <SelectField
                  value={edited.cookieEnabled || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('cookieEnabled', v)}
                />
              </FormItem>
              <FormItem
                label="WebDriver"
                description={`navigator.webdriver — cờ tự động hóa. true = đang chạy trong Selenium/Puppeteer/Playwright. PHẢI LUÔN = false cho fingerprint thật.\n\n⚠️ CẢNH BÁO: Đây là flag quan trọng nhất mà mọi anti-bot system kiểm tra. Nếu webdriver=true → bị block ngay lập tức trên 100% các site. Không bao giờ set true.`}
              >
                <SelectField
                  value={edited.webdriver || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('webdriver', v)}
                />
              </FormItem>
              <FormItem
                label="PDF Viewer"
                description={`navigator.pdfViewerEnabled — trình duyệt có hỗ trợ xem PDF không. Chrome/Edge/Firefox: true. Safari: true. Hầu hết browser hiện đại: true.\n\n⚠️ Mẹo: Để true là an toàn. Nếu false trên Chrome → có thể là custom build hoặc flag đặc biệt.`}
              >
                <SelectField
                  value={edited.pdfViewerEnabled || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('pdfViewerEnabled', v)}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 07. Canvas & Media ──────────────────────────────── */}
          <FormSection
            title="07. Canvas & Media"
            description="WebGL, Canvas, Audio — fingerprint active, tạo hash duy nhất từ cách GPU/CPU render."
            icon={Palette}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormItem
                label="Canvas Seed"
                description={`Canvas noise seed — chuỗi ngẫu nhiên dùng để thêm noise vào canvas fingerprint. Mỗi lần render canvas, seed này tạo ra pixel noise khác nhau → canvas hash thay đổi → không bị fingerprint ổn định.\n\n⚠️ Kỹ thuật:\n• Seed phải đủ dài (≥10 ký tự) và thực sự ngẫu nhiên.\n• KHÔNG dùng seed cố định — các site anti-bot lấy nhiều canvas hash và so sánh, nếu noise pattern lặp → bot.\n• Nên dùng crypto.randomUUID() hoặc Math.random() chất lượng cao.`}
              >
                <TextField
                  value={edited.canvasNoiseSeed || ''}
                  onChange={(v) => set('canvasNoiseSeed', v)}
                />
              </FormItem>
              <FormItem
                label="Audio Sample Rate"
                description={`AudioContext.sampleRate — tần số lấy mẫu âm thanh (Hz). Desktop Windows/Linux: 48000 Hz. macOS/iOS: 44100 Hz (chuẩn Apple).\n\n⚠️ Kỹ thuật:\n• Đây là fingerprint OS-specific rất mạnh. macOS luôn 44100, Windows luôn 48000.\n• Nếu platform="MacIntel" mà sampleRate=48000 → red flag ngay lập tức.\n• Một số Linux distro cũng dùng 44100, nhưng phần lớn là 48000.`}
              >
                <TextField
                  value={edited.audioSampleRate || ''}
                  onChange={(v) => set('audioSampleRate', v)}
                />
              </FormItem>
              <FormItem
                label="Max Channels"
                description={`AudioContext.destination.maxChannelCount — số kênh âm thanh tối đa. Desktop: thường 2 (stereo). Laptop có loa surround: 6-8.\n\n⚠️ Mẹo: Giá trị phổ biến nhất là 2. Nếu maxChannelCount=2 trên mọi thiết bị → an toàn. Giá trị cao (6+) hiếm gặp, có thể trigger attention.`}
              >
                <TextField
                  value={edited.audioMaxChannelCount || ''}
                  onChange={(v) => set('audioMaxChannelCount', v)}
                />
              </FormItem>
              <FormItem
                label="WebGL Vendor"
                description={`WEBGL_debug_renderer_info — tên vendor GPU. VD: "Google Inc. (Intel)", "Apple Inc.", "Qualcomm".\n\n⚠️ Kỹ thuật:\n• Vendor phải khớp với OS: Apple OS → "Apple Inc.", Windows → "Google Inc. (Intel/NVIDIA/AMD)", Android → "Qualcomm" hoặc "ARM".\n• Nếu vendor="Apple Inc." trên Windows → impossible (Apple không sản xuất GPU cho Windows).\n• Một số anti-bot tool parse vendor string để detect VM (VirtualBox, VMware thường có vendor khác).`}
              >
                <TextField
                  value={edited.webglVendor || ''}
                  onChange={(v) => set('webglVendor', v)}
                />
              </FormItem>
              <FormItem
                label="WebGL Renderer"
                description={`WEBGL_debug_renderer_info — tên GPU renderer. VD: "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)".\n\n⚠️ Kỹ thuật:\n• Renderer phải chứa tên GPU cụ thể (không generic như "Google SwiftShader" — đó là software renderer = bot).\n• ANGLE là translation layer của Chromium (OpenGL→DirectX trên Windows), nên string thường có "ANGLE (...)".\n• Trên macOS, renderer thường là "ANGLE (Apple, Apple M1, OpenGL 4.1)".`}
              >
                <TextField
                  value={edited.webglRenderer || ''}
                  onChange={(v) => set('webglRenderer', v)}
                />
              </FormItem>
              <FormItem
                label="WebGL Version"
                description={`WebGL 1.0 / 2.0 version string. Hầu hết trình duyệt hiện đại: "WebGL 1.0 (OpenGL ES 2.0 Chromium)" và "WebGL 2.0 (OpenGL ES 3.0 Chromium)".\n\n⚠️ Mẹo: Nếu WebGL version không chứa "Chromium" trên Chrome → đáng ngờ. Nếu version là "WebGL 1.0 (OpenGL ES 2.0 Mesa)" → có thể là Linux software rendering.`}
              >
                <TextField
                  value={edited.webglVersion || ''}
                  onChange={(v) => set('webglVersion', v)}
                />
              </FormItem>
              <FormItem
                label="WebGL Shading Lang"
                description={`WebGL shading language version. WebGL 1.0 → "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)". WebGL 2.0 → "WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)".\n\n⚠️ Mẹo: Phải khớp với WebGL version. Nếu WebGL 1.0 nhưng shading language là GLSL ES 3.00 → mâu thuẫn.`}
              >
                <TextField
                  value={edited.webglShadingLanguageVersion || ''}
                  onChange={(v) => set('webglShadingLanguageVersion', v)}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 08. Preferences ─────────────────────────────────── */}
          <FormSection
            title="08. Preferences"
            description="Tùy chọn người dùng — prefers-reduced-motion, dark mode, contrast..."
            icon={Sliders}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormItem
                label="Reduced Motion"
                description={`prefers-reduced-motion — người dùng có yêu cầu giảm chuyển động không (accessibility). Đa số người dùng: false. Một số ít bật vì say tàu xe hoặc accessibility.\n\n⚠️ Mẹo: Để false là an toàn (90%+ người dùng). Nếu true → trang web sẽ tắt animation → fingerprint hơi khác biệt nhưng không đáng ngờ.`}
              >
                <SelectField
                  value={edited.prefersReducedMotion || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('prefersReducedMotion', v)}
                />
              </FormItem>
              <FormItem
                label="Dark Mode"
                description={`prefers-color-scheme: dark — người dùng có bật dark mode không. Đây là một fingerprinting vector phổ biến. MacBook/iOS người dùng thường bật dark mode hơn Windows.\n\n⚠️ Mẹo: Khoảng 30-40% người dùng bật dark mode. Tỉ lệ cao hơn trên macOS/iOS, thấp hơn trên Windows. Nếu dark mode=true nhưng color-gamut-p3=false và platform="Win32" → consistent với Windows user.`}
              >
                <SelectField
                  value={edited.prefersDarkMode || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('prefersDarkMode', v)}
                />
              </FormItem>
              <FormItem
                label="Contrast"
                description={`prefers-contrast — mức độ tương phản ưa thích. "no-preference" (mặc định), "more" (tương phản cao, accessibility), "less" (tương phản thấp).\n\n⚠️ Mẹo: 99% người dùng để "no-preference". Chỉ set "more" hoặc "less" nếu bạn muốn giả lập accessibility user.`}
              >
                <SelectField
                  value={edited.prefersContrast || ''}
                  options={PREFERS_CONTRAST_OPTIONS}
                  onChange={(v) => set('prefersContrast', v)}
                />
              </FormItem>
              <FormItem
                label="Reduced Data"
                description={`prefers-reduced-data — người dùng có muốn tiết kiệm data không (mobile). Chrome trên Android hỗ trợ, desktop thường false.\n\n⚠️ Mẹo: Chỉ để true nếu bạn giả lập mobile Android với Data Saver mode. Desktop + reducedData=true → đáng ngờ.`}
              >
                <SelectField
                  value={edited.prefersReducedData || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('prefersReducedData', v)}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 09. Color & HDR ─────────────────────────────────── */}
          <FormSection
            title="09. Color & HDR"
            description="Khả năng hiển thị màu sắc và HDR — phân biệt thiết bị cao cấp với phổ thông."
            icon={Eye}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormItem
                label="Color Gamut sRGB"
                description={`color-gamut: srgb — mọi màn hình hiện đại đều hỗ trợ sRGB. Luôn true.\n\n⚠️ Mẹo: Để true là bắt buộc. Nếu false → thiết bị quá cũ hoặc cấu hình sai.`}
              >
                <SelectField
                  value={edited.colorGamutSrgb || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('colorGamutSrgb', v)}
                />
              </FormItem>
              <FormItem
                label="Color Gamut P3"
                description={`color-gamut: p3 — hỗ trợ dải màu Display P3 (rộng hơn sRGB). MacBook/iPad Pro/iPhone: true. Hầu hết desktop Windows: false (trừ màn hình cao cấp).\n\n⚠️ Kỹ thuật: Đây là fingerprint phân biệt Apple vs non-Apple rất mạnh. P3=true trên Win32 → chỉ đúng nếu là màn hình chuyên nghiệp (hiếm). P3=false trên macOS → đáng ngờ.`}
              >
                <SelectField
                  value={edited.colorGamutP3 || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('colorGamutP3', v)}
                />
              </FormItem>
              <FormItem
                label="Color Gamut Rec2020"
                description={`color-gamut: rec2020 — hỗ trợ dải màu Rec.2020 (rộng nhất). Rất hiếm, chỉ có trên TV cao cấp và monitor chuyên nghiệp.\n\n⚠️ Mẹo: Để false là an toàn (99%+ thiết bị không hỗ trợ). Nếu true → bạn đang claim thiết bị cực kỳ cao cấp.`}
              >
                <SelectField
                  value={edited.colorGamutRec2020 || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('colorGamutRec2020', v)}
                />
              </FormItem>
              <FormItem
                label="HDR Support"
                description={`dynamic-range: high — hỗ trợ HDR (High Dynamic Range). MacBook Pro XDR, iPhone OLED, TV HDR: true. Desktop phổ thông: false.\n\n⚠️ Kỹ thuật: Tương tự P3, HDR là fingerprint phân biệt thiết bị. HDR=true trên Win32 + màn hình gaming → hợp lệ. HDR=true trên Win32 + GPU Intel UHD cũ → đáng ngờ.`}
              >
                <SelectField
                  value={edited.hdrSupport || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('hdrSupport', v)}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 10. Storage ─────────────────────────────────────── */}
          <FormSection
            title="10. Storage"
            description="Khả năng lưu trữ của trình duyệt — localStorage, sessionStorage, IndexedDB."
            icon={Database}
          >
            <div className="grid grid-cols-3 gap-3">
              <FormItem
                label="LocalStorage"
                description={`window.localStorage có khả dụng không. Hầu như luôn true trên browser hiện đại. false = private browsing mode (Safari cũ) hoặc cố ý tắt.\n\n⚠️ Mẹo: Nếu localStorage=false nhưng cookieEnabled=true → mâu thuẫn nhẹ. Một số anti-bot tool kiểm tra bằng cách thử ghi vào localStorage.`}
              >
                <SelectField
                  value={edited.localStorage || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('localStorage', v)}
                />
              </FormItem>
              <FormItem
                label="SessionStorage"
                description={`window.sessionStorage có khả dụng không. Tương tự localStorage, luôn true trên browser hiện đại.\n\n⚠️ Mẹo: Nếu sessionStorage=false → rất đáng ngờ (hầu như không ai tắt riêng sessionStorage mà vẫn để localStorage=true).`}
              >
                <SelectField
                  value={edited.sessionStorage || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('sessionStorage', v)}
                />
              </FormItem>
              <FormItem
                label="IndexedDB"
                description={`window.indexedDB có khả dụng không. true trên mọi browser hiện đại. false trên Firefox private mode hoặc Tor Browser.\n\n⚠️ Mẹo: indexedDB=false mà localStorage=true → dấu hiệu của Tor Browser hoặc anti-fingerprint browser. Nếu bạn đang giả lập browser thường → phải để true.`}
              >
                <SelectField
                  value={edited.indexedDb || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('indexedDb', v)}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 11. Battery ─────────────────────────────────────── */}
          <FormSection
            title="11. Battery"
            description="Pin thiết bị — phân biệt laptop/mobile với desktop."
            icon={Battery}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormItem
                label="Charging"
                description={`navigator.getBattery().charging — thiết bị đang sạc không. Desktop: luôn true (đang cắm điện). Laptop/mobile: true hoặc false tùy trạng thái.\n\n⚠️ Kỹ thuật:\n• Desktop không pin (PC) → charging=true, level=1.0.\n• Laptop → charging có thể true hoặc false, level < 1.0.\n• Mobile đang dùng → charging=false, level < 1.0 là bình thường.\n• Battery API đang bị deprecate trên 1 số browser vì privacy concerns, nhưng vẫn nên set giá trị hợp lý.`}
              >
                <SelectField
                  value={edited.batteryCharging || ''}
                  options={BOOL_OPTIONS}
                  onChange={(v) => set('batteryCharging', v)}
                />
              </FormItem>
              <FormItem
                label="Level (0-1)"
                description={`navigator.getBattery().level — mức pin (0.0 = cạn, 1.0 = đầy). Desktop: 1.0. Laptop/mobile: 0.2 - 0.95.\n\n⚠️ Mẹo: Không để level < 0 hoặc > 1. Để level ~0.7-0.9 là realistic cho laptop. Desktop không pin → level=1.0.`}
              >
                <TextField
                  value={edited.batteryLevel || ''}
                  onChange={(v) => set('batteryLevel', v)}
                />
              </FormItem>
              <FormItem
                label="Charging Time (s)"
                description={`navigator.getBattery().chargingTime — thời gian sạc đầy (giây). Nếu đang sạc: giá trị dương (vd: 1800 = 30 phút). Nếu không sạc: Infinity.\n\n⚠️ Mẹo: Desktop luôn sạc → chargingTime = 0 hoặc 1 giá trị nhỏ. Laptop đang sạc pin gần đầy → chargingTime nhỏ (~600s).`}
              >
                <TextField
                  value={edited.batteryChargingTime || ''}
                  onChange={(v) => set('batteryChargingTime', v)}
                />
              </FormItem>
              <FormItem
                label="Discharging Time (s)"
                description={`navigator.getBattery().dischargingTime — thời gian còn lại đến khi hết pin (giây). Nếu đang sạc: Infinity. Nếu không sạc: giá trị dương.\n\n⚠️ Mẹo: Laptop rút sạc ~70% pin → dischargingTime ~7200s (2h). Mobile → 3600-14400s tùy dung lượng.`}
              >
                <TextField
                  value={edited.batteryDischargingTime || ''}
                  onChange={(v) => set('batteryDischargingTime', v)}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 12. Plugins & Fonts ──────────────────────────────── */}
          <FormSection
            title="12. Plugins & Fonts"
            description="Plugins, MIME types, font chữ — fingerprint cực mạnh, gần như unique cho mỗi thiết bị."
            icon={FileText}
          >
            <div className="grid grid-cols-1 gap-3">
              <FormItem
                label="Fonts"
                description={`Danh sách font chữ cài trên hệ thống (JSON array). Đây là một trong những fingerprint mạnh nhất vì mỗi máy có bộ font khác nhau.\n\n⚠️ Kỹ thuật:\n• Font phải khớp với OS: Windows → có "Segoe UI", "Calibri", "Cambria". macOS → có "SF Pro", "Helvetica Neue", "Apple Color Emoji". Linux → có "Ubuntu", "DejaVu Sans".\n• Font Apple (SF Pro, Apple Color Emoji) trên Windows → red flag.\n• Font Segoe UI trên macOS → impossible.\n• Danh sách quá ngắn (dưới 5 fonts) → có thể là VM/minimal install.\n• Một số site dùng font enumeration để fingerprint.`}
              >
                <TextareaField
                  value={edited.fonts || ''}
                  onChange={(v) => set('fonts', v)}
                  rows={4}
                />
              </FormItem>
              <FormItem
                label="Plugins"
                description={`navigator.plugins — danh sách plugin trình duyệt (JSON). Chrome: PDF Viewer, Native Client. Firefox: PDF Viewer. Trình duyệt hiện đại có rất ít plugins (NPAPI đã bị loại bỏ).\n\n⚠️ Kỹ thuật:\n• Chrome/Edge: có "Chrome PDF Plugin" và "Native Client".\n• Firefox: chỉ có "PDF Viewer" với filename "internal-pdf-viewer".\n• Danh sách plugins quá dài (5+) → trình duyệt cũ (còn Flash, Java) → đáng ngờ.\n• Không có plugins nào → cũng đáng ngờ (có thể đã bị strip).`}
              >
                <TextareaField
                  value={edited.plugins || ''}
                  onChange={(v) => set('plugins', v)}
                  rows={3}
                />
              </FormItem>
              <FormItem
                label="MIME Types"
                description={`navigator.mimeTypes — danh sách MIME types được hỗ trợ (JSON). Thường bao gồm application/pdf, application/x-nacl, application/x-pnacl.\n\n⚠️ Mẹo: Danh sách MIME types phải nhất quán với plugins. Nếu có MIME "application/pdf" nhưng không có PDF plugin → mâu thuẫn.`}
              >
                <TextareaField
                  value={edited.mimeTypes || ''}
                  onChange={(v) => set('mimeTypes', v)}
                  rows={3}
                />
              </FormItem>
              <FormItem
                label="Voices"
                description={`speechSynthesis.getVoices() — danh sách giọng nói TTS (Text-to-Speech). Mỗi OS/browser có bộ voices khác nhau → fingerprint vector.\n\n⚠️ Mẹo: Đây là fingerprint ít bị chú ý nhưng rất mạnh. macOS có giọng "Samantha", "Daniel"; Windows có "Microsoft David", "Microsoft Zira". Nếu để rỗng → OK (không phải browser nào cũng load voices kịp).`}
              >
                <TextField
                  value={edited.voices || ''}
                  onChange={(v) => set('voices', v)}
                />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 13. Network ─────────────────────────────────────── */}
          <FormSection
            title="13. Network"
            description="Kết nối mạng — loại kết nối, băng thông, độ trễ."
            icon={Wifi}
          >
            <div className="grid grid-cols-3 gap-3">
              <FormItem
                label="Connection Type"
                description={`navigator.connection.effectiveType — loại kết nối hiệu quả. "4g" (broadband/WiFi), "3g", "2g" (mobile chậm). Desktop: thường "4g" hoặc "ethernet".\n\n⚠️ Mẹo: Desktop ở nhà → "4g" hoặc "ethernet". Mobile → "4g" hoặc "3g". "slow-2g" cực hiếm, chỉ cho testing.`}
              >
                <SelectField
                  value={edited.connectionEffectiveType || ''}
                  options={CONNECTION_TYPE_OPTIONS}
                  onChange={(v) => set('connectionEffectiveType', v)}
                />
              </FormItem>
              <FormItem
                label="Downlink (Mbps)"
                description={`navigator.connection.downlink — băng thông download ước tính (Mbps). Desktop WiFi: 10-100 Mbps. Mobile 4G: 5-20 Mbps.\n\n⚠️ Mẹo: Giá trị nên thực tế: desktop cáp quang ~50-100, WiFi ~20-50, 4G ~5-10. Nếu downlink=1000 (1 Gbps) mà connectionType="3g" → mâu thuẫn.`}
              >
                <TextField
                  value={edited.connectionDownlink || ''}
                  onChange={(v) => set('connectionDownlink', v)}
                />
              </FormItem>
              <FormItem
                label="RTT (ms)"
                description={`navigator.connection.rtt — round-trip time ước tính (ms). WiFi: 20-80ms. 4G: 50-150ms. 3G: 200-500ms.\n\n⚠️ Mẹo: Desktop broadband → 20-50ms. Mobile 4G → 70-100ms. Nếu RTT < 10ms → có thể là localhost/VPN nội bộ. Nếu RTT > 500ms mà connectionType="4g" → đáng ngờ.`}
              >
                <TextField
                  value={edited.connectionRtt || ''}
                  onChange={(v) => set('connectionRtt', v)}
                />
              </FormItem>
            </div>
          </FormSection>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          <Button onClick={handleConfirm} fullWidth>
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-black uppercase">Confirm Selection</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default FingerprintDetail;