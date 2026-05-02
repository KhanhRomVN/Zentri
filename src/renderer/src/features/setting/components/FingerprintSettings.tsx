import React, { useState, useEffect } from 'react';
import { Globe, Monitor, Activity, Layout, MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import Input from '../../../shared/components/ui/input/Input';
import Combobox from '../../../shared/components/ui/combobox/Combobox';
import Modal from '../../../shared/components/ui/modal/Modal';
import Textarea from '../../../shared/components/ui/textarea/Textarea';

const HelpIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const STEP_COLORS: Record<string, string> = {
  '01. User Agent': '#3b82f6', // Blue
  '02. Platform & OS Version': '#8b5cf6', // Violet
  '03. Hardware Properties': '#10b981', // Emerald
  '04. Screen Properties': '#f59e0b', // Amber
  '05. Window Properties': '#ef4444', // Red
  '06. Language & Locale': '#06b6d4', // Cyan
  '07. Timezone & GPS': '#f97316', // Orange
  '08. Canvas & Media': '#ec4899', // Pink
  '09. Browser Metadata': '#64748b', // Slate
};

const FormSection = ({
  title,
  description,
  icon: Icon,
  showHelp = false,
  isUnlocked = true,
  children,
}: {
  title: string;
  description?: string;
  icon: any;
  showHelp?: boolean;
  isUnlocked?: boolean;
  children: React.ReactNode;
}) => {
  const stepColor = STEP_COLORS[title] || '#3b82f6';
  const isLocked = !isUnlocked;

  return (
    <div
      className={cn(
        'relative group transition-all duration-500',
        isLocked && 'opacity-40 grayscale pointer-events-none',
      )}
    >
      <div className="flex items-start gap-6 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-500"
          style={{ backgroundColor: `${stepColor}15`, color: stepColor }}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-[14px] font-black tracking-widest uppercase text-foreground">
              {title}
            </h2>
            {showHelp && (
              <div className="group/help relative">
                <HelpIcon className="w-4 h-4 text-muted-foreground/30 hover:text-primary transition-colors cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-4 rounded-2xl bg-card border border-border shadow-2xl opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-300 z-50">
                  <p className="text-[10px] font-bold text-foreground leading-relaxed uppercase tracking-wider">
                    {description}
                  </p>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-3 bg-card border-r border-b border-border rotate-45 -mt-1.5" />
                </div>
              </div>
            )}
          </div>
          <p className="text-[11px] font-bold text-muted-foreground/40 leading-relaxed uppercase tracking-widest truncate">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-[19px] transition-all duration-500">
        <div className="space-y-10">{children}</div>
      </div>
      <div className="h-px bg-border/40 mt-4 w-full opacity-50" />
    </div>
  );
};

const StepNavigation = ({
  step,
  onPrev,
  onNext,
  isLast = false,
}: {
  step: number;
  onPrev: () => void;
  onNext: () => void;
  isLast?: boolean;
}) => (
  <div className="flex justify-end gap-3 mt-6">
    {step > 1 && (
      <button
        onClick={onPrev}
        className="px-6 h-10 rounded-xl bg-muted/10 text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-muted/20 transition-all border border-border/10 flex items-center justify-center leading-none active:scale-95"
      >
        Quay lại
      </button>
    )}
    {!isLast && (
      <button
        onClick={onNext}
        className="px-10 h-10 rounded-xl bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.25em] hover:bg-primary/30 transition-all flex items-center justify-center gap-2 leading-none active:scale-95"
      >
        Bước tiếp theo
      </button>
    )}
  </div>
);

const FormItem = ({
  label,
  description,
  tooltip,
  help,
  action,
  children,
}: {
  label: string;
  description: string;
  tooltip?: React.ReactNode;
  help?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="space-y-2 relative">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 focus-within:text-primary transition-colors">
            <label className="text-[13px] font-bold text-foreground truncate">{label}</label>
            <button
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              className={cn(
                'p-0.5 rounded-full transition-colors shrink-0',
                showTooltip
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground/40 hover:text-primary hover:bg-primary/5',
              )}
            >
              <HelpIcon className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-1">
            {description}
          </p>
        </div>
      </div>

      {showTooltip && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowTooltip(false)} />
          <div className="absolute z-50 left-0 top-10 w-80 p-4 rounded-2xl bg-[#121214] border border-border/50 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="text-[12px] leading-relaxed text-muted-foreground">
              {tooltip || help}
            </div>
            <div className="absolute -top-1 left-4 w-2 h-2 bg-[#121214] border-t border-l border-border/50 transform rotate-45" />
          </div>
        </>
      )}

      <div className="pt-1 relative group/item">
        {action && (
          <div className="absolute -top-8 right-5 z-20 translate-y-1 group-focus-within/item:translate-y-0 transition-transform">
            {action}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

const parseUserAgent = (ua: string) => {
  const uaLower = ua.toLowerCase();
  let os = 'Win32';
  let osVersion = '10.0.0';
  let brand = 'Google Chrome';
  let brandVersion = '131';

  if (uaLower.includes('windows nt 10.0')) {
    os = 'Win32';
    osVersion = '10.0.0';
  } else if (uaLower.includes('windows nt 6.1')) {
    os = 'Win32';
    osVersion = '6.1.0';
  } else if (uaLower.includes('macintosh')) {
    os = 'MacIntel';
    osVersion = '14.5.0';
  } else if (uaLower.includes('iphone')) {
    os = 'iPhone';
    const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
    osVersion = match ? `${match[1]}.${match[2]}.${match[3] || '0'}` : '17.5.1';
  } else if (uaLower.includes('ipad')) {
    os = 'iPad';
    osVersion = '17.5.1';
  } else if (uaLower.includes('android')) {
    os = 'Linux armv8l';
    const match = ua.match(/Android (\d+)/);
    osVersion = match ? `${match[1]}.0.0` : '14.0.0';
  } else if (uaLower.includes('linux')) {
    os = 'Linux x86_64';
    osVersion = '6.5.0';
  }

  // Brand detection
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/(\d+)/);
    brand = 'Microsoft Edge';
    brandVersion = match ? match[1] : '146';
  } else if (ua.includes('OPR/')) {
    const match = ua.match(/OPR\/(\d+)/);
    brand = 'Opera';
    brandVersion = match ? match[1] : '113';
  } else if (ua.includes('CocCoc/')) {
    const match = ua.match(/CocCoc\/(\d+)/);
    brand = 'CocCoc';
    brandVersion = match ? match[1] : '114';
  } else if (ua.includes('SamsungBrowser/')) {
    const match = ua.match(/SamsungBrowser\/(\d+)/);
    brand = 'Samsung Browser';
    brandVersion = match ? match[1] : '23';
  } else if (ua.includes('Chrome/')) {
    const match = ua.match(/Chrome\/(\d+)/);
    brand = 'Google Chrome';
    brandVersion = match ? match[1] : '131';
  } else if (ua.includes('CriOS/')) {
    const match = ua.match(/CriOS\/(\d+)/);
    brand = 'Google Chrome';
    brandVersion = match ? match[1] : '135';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    const match = ua.match(/Version\/(\d+)/);
    brand = 'Safari';
    brandVersion = match ? match[1] : '17';
  } else if (ua.includes('Firefox/') || ua.includes('FxiOS/')) {
    const match = ua.match(/(?:Firefox|FxiOS)\/(\d+)/);
    brand = 'Firefox';
    brandVersion = match ? match[1] : '120';
  }

  return { os, osVersion, brand, brandVersion };
};

import { FingerprintConfig } from './FingerprintPresets';
import { USER_AGENTS } from '../constants/userAgents';

export const FingerprintSettings = ({
  config,
  setConfig,
  presetId,
  activeStep,
  setActiveStep,
  isEditMode,
}: {
  config: FingerprintConfig;
  setConfig: React.Dispatch<React.SetStateAction<FingerprintConfig>>;
  presetId?: string | null;
  activeStep: number;
  setActiveStep: (step: number) => void;
  isEditMode: boolean;
}) => {
  useEffect(() => {
    const handleOpenSave = () => setIsSaveDrawerOpen(true);
    window.addEventListener('zentri:open-save-drawer', handleOpenSave);
    return () => window.removeEventListener('zentri:open-save-drawer', handleOpenSave);
  }, []);
  const [uaSearchQuery, setUaSearchQuery] = useState('');
  const [uaPopoverOpen, setUaPopoverOpen] = useState(false);
  const [osVersionPopoverOpen, setOsVersionPopoverOpen] = useState(false);
  const [hwConcurrencyPopoverOpen, setHwConcurrencyPopoverOpen] = useState(false);

  const [isSaveDrawerOpen, setIsSaveDrawerOpen] = useState(false);
  const [maxTouchPopoverOpen, setMaxTouchPopoverOpen] = useState(false);
  const [memoryPopoverOpen, setMemoryPopoverOpen] = useState(false);
  const [resPopoverOpen, setResPopoverOpen] = useState(false);
  const [dprPopoverOpen, setDprPopoverOpen] = useState(false);
  const [langPopoverOpen, setLangPopoverOpen] = useState(false);
  const [dntPopoverOpen, setDntPopoverOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [canvasPopoverOpen, setCanvasPopoverOpen] = useState(false);
  const [audioPopoverOpen, setAudioPopoverOpen] = useState(false);
  const [vendorPopoverOpen, setVendorPopoverOpen] = useState(false);
  const [prodSubPopoverOpen, setProdSubPopoverOpen] = useState(false);

  const [osVersionSearchQuery, setOsVersionSearchQuery] = useState('');
  const [resSearchQuery, setResSearchQuery] = useState('');
  const [availResSearchQuery, setAvailResSearchQuery] = useState('');
  const [outerResSearchQuery, setOuterResSearchQuery] = useState('');
  const [innerResSearchQuery, setInnerResSearchQuery] = useState('');
  const [positionSearchQuery, setPositionSearchQuery] = useState('');
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [langsSearchQuery, setLangsSearchQuery] = useState('');
  const [accuracySearchQuery, setAccuracySearchQuery] = useState('');
  const [fontsSearchQuery, setFontsSearchQuery] = useState('');
  const [webglVendorSearchQuery, setWebglVendorSearchQuery] = useState('');
  const [webglRendererSearchQuery, setWebglRendererSearchQuery] = useState('');
  const [webglParamsSearchQuery, setWebglParamsSearchQuery] = useState('');
  const [canvasSearchQuery, setCanvasSearchQuery] = useState('');
  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [prodSubSearchQuery, setProdSubSearchQuery] = useState('');

  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [availResPopoverOpen, setAvailResPopoverOpen] = useState(false);
  const [colorDepthPopoverOpen, setColorDepthPopoverOpen] = useState(false);
  const [outerResPopoverOpen, setOuterResPopoverOpen] = useState(false);
  const [innerResPopoverOpen, setInnerResPopoverOpen] = useState(false);
  const [positionPopoverOpen, setPositionPopoverOpen] = useState(false);
  const [langsPopoverOpen, setLangsPopoverOpen] = useState(false);
  const [accuracyPopoverOpen, setAccuracyPopoverOpen] = useState(false);
  const [fontsPopoverOpen, setFontsPopoverOpen] = useState(false);
  const [webglVendorPopoverOpen, setWebglVendorPopoverOpen] = useState(false);
  const [webglRendererPopoverOpen, setWebglRendererPopoverOpen] = useState(false);
  const [webglParamsPopoverOpen, setWebglParamsPopoverOpen] = useState(false);
  const [channelCountPopoverOpen, setChannelCountPopoverOpen] = useState(false);

  const OS_PLATFORMS = [
    { label: 'Windows (Win32)', value: 'Win32' },
    { label: 'macOS (MacIntel)', value: 'MacIntel' },
    { label: 'Linux (x86_64)', value: 'Linux x86_64' },
    { label: 'Linux (aarch64)', value: 'Linux aarch64' },
    { label: 'Android (Linux armv8l)', value: 'Linux armv8l' },
    { label: 'iPhone (iOS)', value: 'iPhone' },
    { label: 'iPad (iOS)', value: 'iPad' },
  ];

  const OS_VERSION_MAP: Record<string, string[]> = {
    Win32: ['10.0.0', '13.0.0'],
    MacIntel: ['14.5.0', '13.6.0', '12.7.0'],
    'Linux x86_64': ['6.5.0', '5.15.0'],
    'Linux aarch64': ['6.5.0', '5.15.0'],
    'Linux armv8l': ['14.0.0', '13.0.0', '12.0.0'],
    iPhone: ['17.5.1', '16.6.0', '15.7.0'],
    iPad: ['17.5.1', '16.6.0', '15.7.0'],
  };

  const isMobile = config.os === 'iPhone' || config.os === 'iPad' || config.os === 'Linux armv8l';

  const HW_CONCURRENCY_OPTIONS = [
    { label: '2', value: '2', description: 'Cấu hình tiêu chuẩn cho thiết bị văn phòng.' },
    { label: '4', value: '4', description: 'Hiệu năng tốt cho đa tác vụ thông thường.' },
    { label: '8', value: '8', description: 'Máy tính hiệu năng cao, render đồ họa.' },
    { label: '12', value: '12', description: 'Workstation hoặc Gaming PC cao cấp.' },
    { label: '16', value: '16', description: 'Server hoặc PC chuyên nghiệp.' },
    { label: '32', value: '32', description: 'Cấu hình cực mạnh cho tác vụ nặng.' },
  ].filter((o) => (isMobile ? parseInt(o.value) <= 8 : true));

  const MAX_TOUCH_OPTIONS = [
    { label: '0', value: '0', description: 'Không hỗ trợ chạm (PC thông thường).' },
    { label: '1', value: '1', description: 'Hỗ trợ 1 điểm chạm (Singe-touch).' },
    { label: '5', value: '5', description: 'Hỗ trợ đa điểm (Tablet/Large Phone).' },
    { label: '10', value: '10', description: 'Cấu hình chuẩn cho Smartphone cao cấp.' },
  ].filter((o) => (isMobile ? parseInt(o.value) >= 5 : true));

  const MEMORY_OPTIONS = [
    { label: '2', value: '2', description: '2 GB RAM - Cấu hình máy giá rẻ.' },
    { label: '4', value: '4', description: '4 GB RAM - Tiêu chuẩn phổ thông.' },
    { label: '8', value: '8', description: '8 GB RAM - Máy tính hiện đại.' },
    { label: '16', value: '16', description: '16 GB RAM - Chuyên gia đồ họa.' },
    { label: '32', value: '32', description: '32 GB RAM - High-end Workstation.' },
    { label: '64', value: '64', description: '64 GB RAM - Server Grade.' },
  ].filter((o) => (isMobile ? parseInt(o.value) <= 12 : true));

  const COMMON_RESOLUTIONS = [
    { label: '1920x1080', value: '1920x1080', description: 'Full HD 1080p - Tiêu chuẩn PC.' },
    { label: '2560x1440', value: '2560x1440', description: 'Quad HD 2K - Màn hình sắc nét.' },
    { label: '1366x768', value: '1366x768', description: 'HD Ready - Laptop phổ thông.' },
    { label: '1440x900', value: '1440x900', description: 'MacBook Air 13-inch (Legacy).' },
    { label: '1600x900', value: '1600x900', description: 'Độ phân giải HD+.' },
    { label: '412x915', value: '412x915', description: 'Pixel 7/8 - Android chuẩn.' },
    { label: '390x844', value: '390x844', description: 'iPhone 13/14 - Moble chuẩn.' },
    { label: '414x896', value: '414x896', description: 'iPhone XR/11 - Màn hình lớn.' },
    { label: '360x800', value: '360x800', description: 'Samsung S-series compact.' },
  ].filter((r) => {
    const isResMobile = parseInt(r.value.split('x')[0]) < 500;
    return isMobile ? isResMobile : !isResMobile;
  });

  const DPR_OPTIONS = [
    { label: '1.0', value: '1.0', description: 'Standard Display (Non-Retina).' },
    { label: '1.25', value: '1.25', description: 'Windows Scaling 125%.' },
    { label: '1.5', value: '1.5', description: 'Windows Scaling 150% (Laptop).' },
    { label: '2.0', value: '2.0', description: 'Apple Retina / Chrome High-DPI.' },
    { label: '3.0', value: '3.0', description: 'Ultra-High Density (iPhone/Pixel).' },
  ].filter((o) => (isMobile ? parseFloat(o.value) >= 2.0 : true));

  const LANGUAGE_OPTIONS = [
    { label: 'Vietnamese (vi-VN)', value: 'vi-VN', description: 'Tiếng Việt - Việt Nam.' },
    { label: 'English (en-US)', value: 'en-US', description: 'Tiếng Anh - Hoa Kỳ.' },
    { label: 'English (en-GB)', value: 'en-GB', description: 'Tiếng Anh - Vương quốc Anh.' },
    { label: 'Japanese (ja-JP)', value: 'ja-JP', description: 'Tiếng Nhật - Nhật Bản.' },
    { label: 'Korean (ko-KR)', value: 'ko-KR', description: 'Tiếng Hàn - Hàn Quốc.' },
    { label: 'Chinese (zh-CN)', value: 'zh-CN', description: 'Tiếng Trung (Giản thể).' },
    { label: 'French (fr-FR)', value: 'fr-FR', description: 'Tiếng Pháp - Pháp.' },
    { label: 'German (de-DE)', value: 'de-DE', description: 'Tiếng Đức - Đức.' },
    { label: 'Russian (ru-RU)', value: 'ru-RU', description: 'Tiếng Nga - Nga.' },
    { label: 'Spanish (es-ES)', value: 'es-ES', description: 'Tiếng Tây Ban Nha - Tây Ban Nha.' },
  ];

  const DNT_OPTIONS = [
    { label: '0 (Bình thường)', value: '0' },
    { label: '1 (Không theo dõi)', value: '1' },
  ];

  const CANVAS_SEED_OPTIONS = ['123456', '987654', '456789', '112233'];
  const AUDIO_RATE_OPTIONS = ['44100', '48000', '96000'];
  const VENDOR_OPTIONS = [
    {
      label: 'Google Inc.',
      value: 'Google Inc.',
      description: 'Sử dụng cho trình duyệt Chrome/Chromium.',
    },
    {
      label: 'Apple Computer, Inc.',
      value: 'Apple Computer, Inc.',
      description: 'Sử dụng cho trình duyệt Safari.',
    },
    {
      label: 'Mozilla',
      value: 'Mozilla',
      description: 'Để trống cho Firefox hoặc mô phỏng Gecko.',
    },
    { label: '', value: '', description: 'Bỏ trống (thường dùng cho các browser mã nguồn mở).' },
  ];
  const PRODUCT_SUB_OPTIONS = [
    { label: '20030107', value: '20030107', description: 'Chuẩn quốc tế cho Chrome/Safari/Edge.' },
    { label: '20100101', value: '20100101', description: 'Chuẩn định danh cho Mozilla Firefox.' },
  ];

  const COLOR_DEPTH_OPTIONS = [
    { label: '24', value: '24', description: 'Chuẩn phổ biến cho hầu hết màn hình.' },
    { label: '30', value: '30', description: 'Hỗ trợ HDR / Deep Color.' },
  ];

  const BRAND_OPTIONS = [
    { label: 'Google Chrome', value: 'Google Chrome' },
    { label: 'Microsoft Edge', value: 'Microsoft Edge' },
    { label: 'Opera', value: 'Opera' },
    { label: 'CocCoc', value: 'CocCoc' },
    { label: 'Safari', value: 'Safari' },
    { label: 'Firefox', value: 'Firefox' },
    { label: 'Brave Browser', value: 'Brave Browser' },
  ];

  const LANGS_OPTIONS = [
    { label: 'Vietnamese/English', value: '["vi-VN","vi","en-US","en"]' },
    { label: 'English US', value: '["en-US","en"]' },
    { label: 'English UK', value: '["en-GB","en"]' },
  ];

  const ACCURACY_OPTIONS = [
    { label: 'High (10m)', value: '10', description: 'Mô phỏng thiết bị di động có GPS.' },
    {
      label: 'Medium (150m)',
      value: '150',
      description: 'Mô phỏng thiết bị dùng Wifi Geolocation.',
    },
    {
      label: 'Low (1000m+)',
      value: '1000',
      description: 'Mô phỏng máy tính bàn dùng IP Geolocation.',
    },
  ];

  const FONT_OPTIONS = [
    {
      label: 'Windows Standard',
      value:
        '["Arial","Courier New","Georgia","MS Sans Serif","Segoe UI","Tahoma","Times New Roman","Verdana"]',
    },
    {
      label: 'macOS Standard',
      value:
        '["Arial","Courier","Geneva","Helvetica","Lucida Grande","Monaco","Palatino","Times","Verdana"]',
    },
    { label: 'Android Standard', value: '["Roboto","Noto Sans","Droid Sans","monospace"]' },
  ];

  const CHANNEL_COUNT_OPTIONS = [
    {
      label: 'Stereo (2)',
      value: '2',
      description: 'Hầu hết các thiết bị di động và loa thông thường.',
    },
    { label: 'Surround (6)', value: '6', description: 'Hệ thống 5.1.' },
    { label: 'Surround (8)', value: '8', description: 'Hệ thống 7.1 cao cấp.' },
  ];

  const WEBGL_RENDERER_OPTIONS = [
    {
      label: 'ANGLE (NVIDIA GeForce RTX 3060)',
      value: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    },
    {
      label: 'ANGLE (Intel UHD Graphics)',
      value: 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.9415)',
    },
    { label: 'Apple M1', value: 'Apple M1' },
    { label: 'Google SwiftShader', value: 'Google SwiftShader' },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <FormSection
        title="01. User Agent"
        description="Định dạng cốt lõi xác định danh tính thiết bị của bạn."
        icon={Globe}
        isUnlocked={isEditMode || activeStep >= 1}
        showHelp
      >
        <div className="md:col-span-2">
          <FormItem
            label="User Agent String"
            description="Chuỗi định danh trình duyệt gửi tới server."
            tooltip="Chuỗi định danh cốt lõi xác định loại trình duyệt, phiên bản và hệ điều hành. Website sử dụng thông số này để phân biệt giữa PC, Mobile và các trình duyệt như Chrome, Safari."
          >
            <Input
              type="combobox"
              placeholder="Tìm kiếm hoặc nhập User Agent..."
              value={uaPopoverOpen ? uaSearchQuery : config.ua}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setUaSearchQuery(e.target.value);
              }}
              popoverOpen={uaPopoverOpen}
              onPopoverOpenChange={(open) => {
                setUaPopoverOpen(open);
                if (!open) {
                  setUaSearchQuery('');
                }
              }}
              popoverContent={
                <Combobox
                  value={config.ua}
                  options={USER_AGENTS}
                  searchQuery={uaSearchQuery}
                  onChange={(val) => {
                    const { os, osVersion, brand, brandVersion } = parseUserAgent(val);
                    setConfig((prev) => ({
                      ...prev,
                      ua: val,
                      os,
                      osVersion,
                      brand,
                      brandVersion,
                    }));
                    setUaSearchQuery('');
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
        </div>
        {!isEditMode && activeStep === 1 && (
          <StepNavigation step={1} onPrev={() => {}} onNext={() => setActiveStep(2)} />
        )}
      </FormSection>

      <FormSection
        title="02. Platform & OS Version"
        description="Đồng bộ hóa hệ điều hành và phiên bản tương ứng."
        icon={Monitor}
        isUnlocked={isEditMode || activeStep >= 2}
        showHelp
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <FormItem
            label="Platform"
            description="Hệ điều hành hiển thị (navigator.platform)."
            tooltip="Cung cấp thông tin về kiến trúc hệ điều hành. Việc làm giả thông số này giúp đồng bộ hóa dữ liệu phần cứng với User Agent đã chọn, tránh sự mâu thuẫn hệ thống."
          >
            <Input
              readOnly
              value={OS_PLATFORMS.find((o) => o.value === config.os)?.label || config.os}
              className="bg-muted/30 border-border/50 rounded-xl font-bold opacity-80 cursor-not-allowed"
            />
          </FormItem>
          <FormItem
            label="Platform Version"
            description="Phiên bản chi tiết hệ điều hành."
            tooltip="Website có thể phát hiện sự mâu thuẫn nếu phiên bản Windows/MacOS không khớp với chuỗi User Agent đã khai báo. Cần đảm bảo tính đồng bộ tuyệt đối."
          >
            <Input
              type="combobox"
              placeholder="Chọn hoặc nhập phiên bản..."
              value={config.osVersion}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setConfig((prev) => ({ ...prev, osVersion: val }));
                setOsVersionSearchQuery(val);
              }}
              popoverOpen={osVersionPopoverOpen}
              onPopoverOpenChange={setOsVersionPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.osVersion}
                  options={(OS_VERSION_MAP[config.os] || []).map((v) => ({ label: v, value: v }))}
                  searchQuery={osVersionSearchQuery}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, osVersion: val }));
                    setOsVersionSearchQuery('');
                    setOsVersionPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Brand"
            description="Nhãn hiệu trình duyệt (UA-CH)."
            tooltip="Giá trị Brand trong User-Agent Client Hints. Cần khớp với tên trình duyệt trong User Agent string (VD: Google Chrome, Chromium)."
          >
            <Input
              type="combobox"
              placeholder="Chọn hoặc nhập nhãn hiệu..."
              value={brandPopoverOpen ? brandSearchQuery : config.brand}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setBrandSearchQuery(e.target.value);
              }}
              popoverOpen={brandPopoverOpen}
              onPopoverOpenChange={(open) => {
                setBrandPopoverOpen(open);
                if (!open) setBrandSearchQuery('');
              }}
              popoverContent={
                <Combobox
                  value={config.brand}
                  options={BRAND_OPTIONS}
                  searchQuery={brandSearchQuery}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, brand: val }));
                    setBrandSearchQuery('');
                    setBrandPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Brand Version"
            description="Phiên bản nhãn hiệu (Major)."
            tooltip="Phiên bản chính (Major version) của trình duyệt. Việc cung cấp thông số này giúp website xác định độ tin cậy của cấu hình Client Hints."
          >
            <Input
              value={config.brandVersion}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setConfig((prev) => ({ ...prev, brandVersion: val }));
              }}
              placeholder="Ví dụ: 131"
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
        </div>
        {!isEditMode && activeStep === 2 && (
          <StepNavigation
            step={2}
            onPrev={() => setActiveStep(1)}
            onNext={() => setActiveStep(3)}
          />
        )}
      </FormSection>

      <FormSection
        title="03. Hardware Properties"
        description="Thông số vật lý của CPU và bộ nhớ RAM."
        icon={Activity}
        isUnlocked={isEditMode || activeStep >= 3}
        showHelp
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <FormItem
            label="Hardware Concurrency"
            description="Số lõi CPU logic."
            tooltip="Giá trị navigator.hardwareConcurrency phản ánh số luồng xử lý. Làm giả giá trị này giúp hồ sơ giống như chạy trên cấu hình phần cứng đa dạng, tránh trùng lặp nhận diện."
          >
            <Input
              type="combobox"
              value={config.hardwareConcurrency.toString()}
              onChange={(e: any) =>
                setConfig((prev) => ({
                  ...prev,
                  hardwareConcurrency: parseInt(e.target.value) || 0,
                }))
              }
              popoverOpen={hwConcurrencyPopoverOpen}
              onPopoverOpenChange={setHwConcurrencyPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.hardwareConcurrency.toString()}
                  options={HW_CONCURRENCY_OPTIONS}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, hardwareConcurrency: parseInt(val) }));
                    setHwConcurrencyPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Max Touch Points"
            description="Số điểm chạm tối đa."
            tooltip="Số điểm chạm navigator.maxTouchPoints. Giá trị 0 thường là PC, trong khi 5 hoặc 10 là các thiết bị cảm ứng như Smartphone/Tablet hạng sang."
          >
            <Input
              type="combobox"
              value={config.maxTouchPoints.toString()}
              onChange={(e: any) =>
                setConfig((prev) => ({ ...prev, maxTouchPoints: parseInt(e.target.value) || 0 }))
              }
              popoverOpen={maxTouchPopoverOpen}
              onPopoverOpenChange={setMaxTouchPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.maxTouchPoints.toString()}
                  options={MAX_TOUCH_OPTIONS}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, maxTouchPoints: parseInt(val) }));
                    setMaxTouchPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Device Memory"
            description="Dung lượng RAM giả lập."
            tooltip="navigator.deviceMemory khai báo RAM ảo. Thông số này nên được làm tròn (2, 4, 8GB) để đảm bảo tính tự nhiên và đồng nhất với cấu hình CPU đã chọn."
          >
            <Input
              type="combobox"
              value={config.deviceMemory.toString()}
              onChange={(e: any) =>
                setConfig((prev) => ({ ...prev, deviceMemory: parseInt(e.target.value) || 0 }))
              }
              popoverOpen={memoryPopoverOpen}
              onPopoverOpenChange={setMemoryPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.deviceMemory.toString()}
                  options={MEMORY_OPTIONS}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, deviceMemory: parseInt(val) }));
                    setMemoryPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
        </div>
        {!isEditMode && activeStep === 3 && (
          <StepNavigation
            step={3}
            onPrev={() => setActiveStep(2)}
            onNext={() => setActiveStep(4)}
          />
        )}
      </FormSection>

      <FormSection
        title="04. Screen Properties"
        description="Kích thước và các thuộc tính hiển thị cơ bản."
        icon={Monitor}
        isUnlocked={isEditMode || activeStep >= 4}
        showHelp
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <FormItem
            label="Screen Resolution"
            description="Độ phân giải màn hình (Rộng x Cao)."
            tooltip="Độ phân giải hiển thị thực tế. Website sẽ kiểm tra sự logic giữa kích thước cửa sổ trình duyệt và độ phân giải màn hình để phát hiện các hành vi giả lập không khớp."
          >
            <Input
              type="combobox"
              value={`${config.width}x${config.height}`}
              popoverOpen={resPopoverOpen}
              onPopoverOpenChange={setResPopoverOpen}
              popoverContent={
                <Combobox
                  value={`${config.width}x${config.height}`}
                  options={COMMON_RESOLUTIONS}
                  searchQuery={resSearchQuery}
                  onChange={(val) => {
                    const [w, h] = val.split('x').map((v: string) => parseInt(v) || 0);
                    setConfig((prev) => {
                      const outerW = w;
                      const outerH = h - 40;
                      return {
                        ...prev,
                        width: w,
                        height: h,
                        availWidth: w,
                        availHeight: h - 40,
                        outerWidth: outerW,
                        outerHeight: outerH,
                        innerWidth: Math.max(0, outerW - 16),
                        innerHeight: Math.max(0, outerH - 72),
                      };
                    });
                    setResPopoverOpen(false);
                    setResSearchQuery('');
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Available Resolution"
            description="Kích thước khả dụng (Rộng x Cao)."
            tooltip="Diện tích màn hình thực tế có thể sử dụng (thường hụt đi do thanh taskbar). Website sử dụng thông số này để phân tích hành vi người dùng."
          >
            <Input
              type="combobox"
              value={
                availResPopoverOpen
                  ? availResSearchQuery
                  : `${config.availWidth}x${config.availHeight}`
              }
              onChange={(e: any) => {
                const val = e.target.value;
                if (val.includes('x')) {
                  const [w, h] = val.split('x').map((v: string) => parseInt(v) || 0);
                  setConfig((prev) => ({ ...prev, availWidth: w, availHeight: h }));
                }
                setAvailResSearchQuery(val);
              }}
              popoverOpen={availResPopoverOpen}
              onPopoverOpenChange={setAvailResPopoverOpen}
              popoverContent={
                <Combobox
                  value={`${config.availWidth}x${config.availHeight}`}
                  options={COMMON_RESOLUTIONS}
                  searchQuery={availResSearchQuery}
                  onChange={(val) => {
                    const [w, h] = val.split('x').map((v: string) => parseInt(v) || 0);
                    setConfig((prev) => ({ ...prev, availWidth: w, availHeight: h }));
                    setAvailResPopoverOpen(false);
                    setAvailResSearchQuery('');
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Device Pixel Ratio"
            description="Tỷ lệ điểm ảnh (DPR)."
            tooltip="Tỷ lệ điểm ảnh vật lý so với điểm ảnh CSS. Giá trị cao mang lại hình ảnh sắc nét trên các màn hình Retina hoặc High-DPI chuẩn Smartphone hiện đại."
          >
            <Input
              type="combobox"
              value={config.devicePixelRatio.toString()}
              onChange={(e: any) =>
                setConfig((prev) => ({
                  ...prev,
                  devicePixelRatio: parseFloat(e.target.value) || 0,
                }))
              }
              popoverOpen={dprPopoverOpen}
              onPopoverOpenChange={setDprPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.devicePixelRatio.toString()}
                  options={DPR_OPTIONS}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, devicePixelRatio: parseFloat(val) }));
                    setDprPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Color Depth"
            description="Độ sâu màu sắc (bit)."
            tooltip="Giá trị screen.colorDepth. Hầu hết các màn hình hiện đại sử dụng 24-bit hoặc 30-bit để hiển thị hình ảnh chuẩn xác."
          >
            <Input
              type="combobox"
              value={config.colorDepth.toString()}
              onChange={(e: any) => {
                const val = parseInt(e.target.value) || 0;
                setConfig((prev) => ({ ...prev, colorDepth: val }));
              }}
              popoverOpen={colorDepthPopoverOpen}
              onPopoverOpenChange={setColorDepthPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.colorDepth.toString()}
                  options={COLOR_DEPTH_OPTIONS}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, colorDepth: parseInt(val) }));
                    setColorDepthPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
        </div>
        {!isEditMode && activeStep === 4 && (
          <StepNavigation
            step={4}
            onPrev={() => setActiveStep(3)}
            onNext={() => setActiveStep(5)}
          />
        )}
      </FormSection>

      <FormSection
        title="05. Window Properties"
        description="Thiết lập chi tiết kích thước cửa sổ trình duyệt."
        icon={Layout}
        isUnlocked={isEditMode || activeStep >= 5}
        showHelp
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <FormItem
            label="Outer Resolution"
            description="Kích thước toàn bộ cửa sổ."
            tooltip="Giá trị window.outerWidth/outerHeight. Đây là kích thước tính cả thanh tiêu đề và khung viền trình duyệt. Phải lớn hơn hoặc bằng Inner Resolution."
          >
            <Input
              type="combobox"
              value={
                outerResPopoverOpen
                  ? outerResSearchQuery
                  : `${config.outerWidth}x${config.outerHeight}`
              }
              onChange={(e: any) => {
                const val = e.target.value;
                if (val.includes('x')) {
                  const [w, h] = val.split('x').map((v: string) => parseInt(v) || 0);
                  setConfig((prev) => ({
                    ...prev,
                    outerWidth: w,
                    outerHeight: h,
                    innerWidth: Math.max(0, w - 16), // Trừ lề ngang mặc định
                    innerHeight: Math.max(0, h - 72), // Trừ lề dọc (Address bar + Toolbar)
                  }));
                }
                setOuterResSearchQuery(val);
              }}
              popoverOpen={outerResPopoverOpen}
              onPopoverOpenChange={setOuterResPopoverOpen}
              popoverContent={
                <Combobox
                  value={`${config.outerWidth}x${config.outerHeight}`}
                  options={COMMON_RESOLUTIONS}
                  searchQuery={outerResSearchQuery}
                  onChange={(val) => {
                    const [w, h] = val.split('x').map((v: string) => parseInt(v) || 0);
                    setConfig((prev) => ({
                      ...prev,
                      outerWidth: w,
                      outerHeight: h,
                      innerWidth: Math.max(0, w - 16),
                      innerHeight: Math.max(0, h - 72),
                    }));
                    setOuterResPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Inner Resolution"
            description="Kích thước nội dung (Viewport)."
            tooltip="Giá trị window.innerWidth/innerHeight. Đây là vùng hiển thị website thực tế. Sai lệch giữa Outer và Inner giúp website nhận diện trình duyệt thật/giả."
          >
            <Input
              type="combobox"
              value={
                innerResPopoverOpen
                  ? innerResSearchQuery
                  : `${config.innerWidth}x${config.innerHeight}`
              }
              onChange={(e: any) => {
                const val = e.target.value;
                if (val.includes('x')) {
                  const [w, h] = val.split('x').map((v: string) => parseInt(v) || 0);
                  setConfig((prev) => ({ ...prev, innerWidth: w, innerHeight: h }));
                }
                setInnerResSearchQuery(val);
              }}
              popoverOpen={innerResPopoverOpen}
              onPopoverOpenChange={setInnerResPopoverOpen}
              popoverContent={
                <Combobox
                  value={`${config.innerWidth}x${config.innerHeight}`}
                  options={COMMON_RESOLUTIONS}
                  searchQuery={innerResSearchQuery}
                  onChange={(val) => {
                    const [w, h] = val.split('x').map((v: string) => parseInt(v) || 0);
                    setConfig((prev) => ({ ...prev, innerWidth: w, innerHeight: h }));
                    setInnerResPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Screen Position"
            description="Tọa độ cửa sổ (X, Y)."
            tooltip="Giá trị window.screenX/screenY. Vị trí ngẫu nhiên giúp hồ sơ trông tự nhiên hơn, tránh việc mọi hồ sơ đều nằm ở chính giữa màn hình (0,0)."
          >
            <Input
              type="combobox"
              value={
                positionPopoverOpen ? positionSearchQuery : `${config.screenX},${config.screenY}`
              }
              onChange={(e: any) => {
                const val = e.target.value;
                if (val.includes(',')) {
                  const [x, y] = val.split(',').map((v: string) => parseInt(v) || 0);
                  setConfig((prev) => ({ ...prev, screenX: x, screenY: y }));
                }
                setPositionSearchQuery(val);
              }}
              popoverOpen={positionPopoverOpen}
              onPopoverOpenChange={setPositionPopoverOpen}
              popoverContent={
                <Combobox
                  value={`${config.screenX},${config.screenY}`}
                  options={[
                    { label: 'Top Left (0,0)', value: '0,0' },
                    { label: 'Centered (100,100)', value: '100,100' },
                    { label: 'Random Offset (50,30)', value: '50,30' },
                  ]}
                  searchQuery={positionSearchQuery}
                  onChange={(val) => {
                    const [x, y] = val.split(',').map((v: string) => parseInt(v) || 0);
                    setConfig((prev) => ({ ...prev, screenX: x, screenY: y }));
                    setPositionPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
        </div>
        {!isEditMode && activeStep === 5 && (
          <StepNavigation
            step={5}
            onPrev={() => setActiveStep(4)}
            onNext={() => setActiveStep(6)}
          />
        )}
      </FormSection>

      <FormSection
        title="06. Language & Locale"
        description="Ngôn ngữ và định dạng khu vực của trình duyệt."
        icon={Globe}
        isUnlocked={isEditMode || activeStep >= 6}
        showHelp
      >
        <div className="w-full">
          <FormItem
            label="Primary Language"
            description="Ngôn ngữ chính (vi-VN, en-US...)."
            tooltip="Ngôn ngữ ưu tiên khai báo tới website (Accept-Language). Cấu hình này nên trùng khớp với địa chỉ IP để tạo ra một hồ sơ người dùng tự nhiên và uy tín nhất."
            action={
              <button
                onClick={() =>
                  setConfig((prev) => ({ ...prev, autoIpLanguage: !prev.autoIpLanguage }))
                }
                className={cn(
                  'flex items-center gap-2 px-3.5 h-8 rounded-t-xl rounded-b-none border border-b-0 text-[9px] font-black uppercase tracking-widest transition-all',
                  config.autoIpLanguage
                    ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                    : 'bg-muted/5 text-muted-foreground/40 border-border/10 hover:bg-muted/10',
                )}
              >
                <Globe className="w-2.5 h-2.5" />
                {config.autoIpLanguage ? 'ON AUTO IP (TỰ ĐỘNG)' : 'AUTO IP (DỰA TRÊN IP)'}
              </button>
            }
          >
            <Input
              type="combobox"
              value={config.autoIpLanguage ? 'Tự động dựa vào IP' : config.primaryLanguage}
              readOnly={config.autoIpLanguage}
              onChange={(e: any) =>
                setConfig((prev) => ({ ...prev, primaryLanguage: e.target.value }))
              }
              popoverOpen={!config.autoIpLanguage && langPopoverOpen}
              onPopoverOpenChange={setLangPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.primaryLanguage}
                  options={LANGUAGE_OPTIONS}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, primaryLanguage: val }));
                    setLangPopoverOpen(false);
                  }}
                />
              }
              className={cn(
                'bg-input-background border-border rounded-xl font-bold font-mono transition-all',
                config.autoIpLanguage && 'opacity-60 bg-muted/20 cursor-not-allowed',
              )}
            />
          </FormItem>
          <FormItem
            label="Languages (JSON array)"
            description="Danh sách ngôn ngữ ưu tiên (navigator.languages)."
            tooltip="Hệ thống website sẽ kiểm tra sự đồng nhất giữa ngôn ngữ chính và danh sách này. Định dạng phải là một mảng JSON (ví dụ: ['vi-VN', 'en-US'])."
          >
            <Input
              type="combobox"
              value={
                config.autoIpLanguage
                  ? 'Tự động dựa vào IP'
                  : langsPopoverOpen
                    ? langsSearchQuery
                    : config.languages
              }
              readOnly={config.autoIpLanguage}
              onChange={(e: any) => {
                setConfig((prev) => ({ ...prev, languages: e.target.value }));
                setLangsSearchQuery(e.target.value);
              }}
              popoverOpen={!config.autoIpLanguage && langsPopoverOpen}
              onPopoverOpenChange={setLangsPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.languages}
                  options={LANGS_OPTIONS}
                  searchQuery={langsSearchQuery}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, languages: val }));
                    setLangsSearchQuery('');
                    setLangsPopoverOpen(false);
                  }}
                />
              }
              className={cn(
                'bg-input-background border-border rounded-xl font-bold font-mono transition-all',
                config.autoIpLanguage && 'opacity-60 bg-muted/20 cursor-not-allowed',
              )}
            />
          </FormItem>
        </div>
        {!isEditMode && activeStep === 6 && (
          <StepNavigation
            step={6}
            onPrev={() => setActiveStep(5)}
            onNext={() => setActiveStep(7)}
          />
        )}
      </FormSection>

      <FormSection
        icon={MapPin}
        title="07. Timezone & GPS"
        description="Vị trí địa lý và múi giờ giả lập."
        isUnlocked={isEditMode || activeStep >= 7}
        showHelp
      >
        <div className="space-y-10">
          <FormItem
            label="Timezone"
            description="Múi giờ hệ thống."
            tooltip="Múi giờ Intl.DateTimeFormat khai báo tới website. Việc so khớp múi giờ với vị trí IP thực tế là bước then chốt để chứng minh hồ sơ là thật."
            action={
              <button
                onClick={() =>
                  setConfig((prev) => ({ ...prev, autoIpTimezone: !prev.autoIpTimezone }))
                }
                className={cn(
                  'flex items-center gap-2 px-3.5 h-8 rounded-t-xl rounded-b-none border border-b-0 text-[9px] font-black uppercase tracking-widest transition-all',
                  config.autoIpTimezone
                    ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                    : 'bg-muted/5 text-muted-foreground/40 border-border/10 hover:bg-muted/10',
                )}
              >
                <Globe className="w-2.5 h-2.5" />
                {config.autoIpTimezone ? 'ON AUTO IP (MÚI GIỜ)' : 'TIMEZONE THEO IP'}
              </button>
            }
          >
            <Input
              value={config.autoIpTimezone ? 'Tự động dựa vào IP' : config.timezone}
              readOnly
              className="bg-muted/10 border-border/50 text-muted-foreground/60 rounded-xl opacity-80"
            />
          </FormItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <FormItem
              label="Longitude"
              description="Kinh độ địa lý."
              tooltip="Tọa độ navigator.geolocation. Đồng bộ GPS với IP giúp hồ sơ của bạn vượt qua các bài kiểm tra vị trí địa lý của Google/Facebook/Amazon."
              action={
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, autoIpGps: !prev.autoIpGps }))}
                  className={cn(
                    'flex items-center gap-2 px-3.5 h-8 rounded-t-xl rounded-b-none border border-b-0 text-[9px] font-black uppercase tracking-widest transition-all',
                    config.autoIpGps
                      ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                      : 'bg-muted/5 text-muted-foreground/40 border-border/10 hover:bg-muted/10',
                  )}
                >
                  <MapPin className="w-2.5 h-2.5" />
                  {config.autoIpGps ? 'ON AUTO GPS (TỌA ĐỘ)' : 'GPS THEO IP'}
                </button>
              }
            >
              <Input
                value={config.autoIpGps ? 'Auto IP' : config.longitude.toString()}
                readOnly={config.autoIpGps}
                onChange={(e: any) =>
                  setConfig((prev) => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))
                }
                className={cn(
                  'bg-input-background border-border rounded-xl font-mono',
                  config.autoIpGps && 'opacity-60 bg-muted/20 cursor-not-allowed',
                )}
              />
            </FormItem>
            <FormItem
              label="Latitude"
              description="Vĩ độ địa lý."
              tooltip="Vĩ độ thực tế khai báo tới website. Phải luôn nằm trong bán kính sai lệch cho phép so với dải IP của nhà cung cấp mạng."
              action={
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, autoIpGps: !prev.autoIpGps }))}
                  className={cn(
                    'flex items-center gap-2 px-3.5 h-8 rounded-t-xl rounded-b-none border border-b-0 text-[9px] font-black uppercase tracking-widest transition-all',
                    config.autoIpGps
                      ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                      : 'bg-muted/5 text-muted-foreground/40 border-border/10 hover:bg-muted/10',
                  )}
                >
                  <MapPin className="w-2.5 h-2.5" />
                  {config.autoIpGps ? 'ON AUTO GPS (TỌA ĐỘ)' : 'GPS THEO IP'}
                </button>
              }
            >
              <Input
                value={config.autoIpGps ? 'Auto IP' : config.latitude.toString()}
                readOnly={config.autoIpGps}
                onChange={(e: any) =>
                  setConfig((prev) => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))
                }
                className={cn(
                  'bg-input-background border-border rounded-xl font-mono',
                  config.autoIpGps && 'opacity-60 bg-muted/20 cursor-not-allowed',
                )}
              />
            </FormItem>
            <FormItem
              label="Accuracy (meters)"
              description="Độ chính xác của tọa độ GPS."
              tooltip="Giá trị Accuracy trong Geolocation API. Thiết bị di động thường có độ chính xác cao (10-30m), máy tính bàn thường thấp hơn (1000m+)."
            >
              <Input
                type="combobox"
                value={accuracyPopoverOpen ? accuracySearchQuery : config.accuracy.toString()}
                onChange={(e: any) => {
                  const val = parseFloat(e.target.value) || 0;
                  setConfig((prev) => ({ ...prev, accuracy: val }));
                  setAccuracySearchQuery(e.target.value);
                }}
                popoverOpen={accuracyPopoverOpen}
                onPopoverOpenChange={setAccuracyPopoverOpen}
                popoverContent={
                  <Combobox
                    value={config.accuracy.toString()}
                    options={ACCURACY_OPTIONS}
                    searchQuery={accuracySearchQuery}
                    onChange={(val) => {
                      setConfig((prev) => ({ ...prev, accuracy: parseFloat(val) }));
                      setAccuracySearchQuery('');
                      setAccuracyPopoverOpen(false);
                    }}
                  />
                }
                className="bg-input-background border-border rounded-xl font-mono"
              />
            </FormItem>
          </div>
        </div>
        {!isEditMode && activeStep === 7 && (
          <StepNavigation
            step={7}
            onPrev={() => setActiveStep(6)}
            onNext={() => setActiveStep(8)}
          />
        )}
      </FormSection>

      <FormSection
        title="08. Canvas & Media"
        description="Cấu hình xử lý đồ họa và âm thanh."
        icon={Monitor}
        isUnlocked={isEditMode || activeStep >= 8}
        showHelp
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormItem
            label="Canvas Noise Seed"
            description="navigator.canvas"
            tooltip="Kỹ thuật thêm nhiễu vào tiến trình vẽ đồ họa Canvas. Điều này tạo ra một chữ ký đồ họa duy nhất cho mỗi hồ sơ, ngăn chặn websites liên kết các tài khoản với nhau qua GPU fingerprint."
          >
            <Input
              type="combobox"
              placeholder="Nhập hoặc chọn Seed..."
              value={config.canvasNoiseSeed.toString()}
              onChange={(e: any) =>
                setConfig((prev) => ({ ...prev, canvasNoiseSeed: parseInt(e.target.value) || 0 }))
              }
              popoverOpen={canvasPopoverOpen}
              onPopoverOpenChange={setCanvasPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.canvasNoiseSeed.toString()}
                  options={CANVAS_SEED_OPTIONS.map((v: string) => ({
                    label: v,
                    value: v,
                    description: `Mã nhiễu đồ họa số #${v}`,
                  }))}
                  searchQuery={canvasSearchQuery}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, canvasNoiseSeed: parseInt(val) }));
                    setCanvasPopoverOpen(false);
                    setCanvasSearchQuery('');
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono placeholder:text-muted-foreground/30"
            />
          </FormItem>
          <FormItem
            label="Audio Context"
            description="navigator.audio"
            tooltip="Tạo nhiễu trong xử lý tín hiệu âm thanh (AudioContext). websites có thể nhận diện thiết bị thông qua các sai số cực nhỏ trong quá trình xử lý sóng âm của driver âm thanh."
          >
            <Input
              type="combobox"
              placeholder="Chọn Sample Rate..."
              value={config.audioSampleRate.toString()}
              onChange={(e: any) =>
                setConfig((prev) => ({ ...prev, audioSampleRate: parseInt(e.target.value) || 0 }))
              }
              popoverOpen={audioPopoverOpen}
              onPopoverOpenChange={setAudioPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.audioSampleRate.toString()}
                  options={AUDIO_RATE_OPTIONS.map((v: string) => ({
                    label: v,
                    value: v,
                    description: `${v} Hz - Tốc độ lấy mẫu tiêu chuẩn.`,
                  }))}
                  searchQuery={audioSearchQuery}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, audioSampleRate: parseInt(val) }));
                    setAudioPopoverOpen(false);
                    setAudioSearchQuery('');
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Fonts (JSON array)"
            description="Danh sách phông chữ (navigator.fonts)."
            tooltip="Hệ thống phông chữ là vector định danh cực mạnh. Websites kiểm tra danh sách này để suy ra hệ điều hành. Định dạng: ['Arial', 'Tahoma']."
          >
            <Input
              type="combobox"
              value={fontsPopoverOpen ? fontsSearchQuery : config.canvasFonts}
              onChange={(e: any) => {
                setConfig((prev) => ({ ...prev, canvasFonts: e.target.value }));
                setFontsSearchQuery(e.target.value);
              }}
              popoverOpen={fontsPopoverOpen}
              onPopoverOpenChange={setFontsPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.canvasFonts}
                  options={FONT_OPTIONS}
                  searchQuery={fontsSearchQuery}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, canvasFonts: val }));
                    setFontsSearchQuery('');
                    setFontsPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="Max Channel Count"
            description="Số lượng kênh âm thanh tối đa."
            tooltip="Giá trị destination.maxChannelCount. Thông thường là 2 (Stereo) hoặc 6/8 cho âm thanh vòm."
          >
            <Input
              type="combobox"
              value={config.audioMaxChannelCount.toString()}
              onChange={(e: any) => {
                const val = parseInt(e.target.value) || 0;
                setConfig((prev) => ({ ...prev, audioMaxChannelCount: val }));
              }}
              popoverOpen={channelCountPopoverOpen}
              onPopoverOpenChange={setChannelCountPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.audioMaxChannelCount.toString()}
                  options={CHANNEL_COUNT_OPTIONS}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, audioMaxChannelCount: parseInt(val) }));
                    setChannelCountPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
        </div>
        {!isEditMode && activeStep === 8 && (
          <StepNavigation
            step={8}
            onPrev={() => setActiveStep(7)}
            onNext={() => setActiveStep(9)}
          />
        )}
      </FormSection>

      <FormSection
        title="09. WebGL Properties"
        description="Tham số đồ họa WebGL nâng cao."
        icon={Monitor}
        isUnlocked={isEditMode || activeStep >= 9}
        showHelp
      >
        <div className="grid grid-cols-1 gap-8">
          <FormItem
            label="WebGL Vendor"
            description="Nhà sản xuất GPU (Unmasked Vendor)."
            tooltip="Khai báo GPU của trình duyệt. Nên khớp với mục Vendor ở phần Metadata để đảm bảo tính đồng nhất."
          >
            <Input
              type="combobox"
              value={webglVendorPopoverOpen ? webglVendorSearchQuery : config.webglVendor}
              onChange={(e: any) => {
                setConfig((prev) => ({ ...prev, webglVendor: e.target.value }));
                setWebglVendorSearchQuery(e.target.value);
              }}
              popoverOpen={webglVendorPopoverOpen}
              onPopoverOpenChange={setWebglVendorPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.webglVendor}
                  options={[
                    { label: 'Google Inc. (NVIDIA)', value: 'Google Inc. (NVIDIA)' },
                    { label: 'Google Inc. (Intel)', value: 'Google Inc. (Intel)' },
                    { label: 'Apple Inc.', value: 'Apple Inc.' },
                  ]}
                  searchQuery={webglVendorSearchQuery}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, webglVendor: val }));
                    setWebglVendorSearchQuery('');
                    setWebglVendorPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="WebGL Renderer"
            description="Card đồ họa (Unmasked Renderer)."
            tooltip="Tên card đồ họa giả lập. Đây là một trong những thông số định danh thiết bị quan trọng nhất."
          >
            <Input
              type="combobox"
              value={webglRendererPopoverOpen ? webglRendererSearchQuery : config.webglRenderer}
              onChange={(e: any) => {
                setConfig((prev) => ({ ...prev, webglRenderer: e.target.value }));
                setWebglRendererSearchQuery(e.target.value);
              }}
              popoverOpen={webglRendererPopoverOpen}
              onPopoverOpenChange={setWebglRendererPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.webglRenderer}
                  options={WEBGL_RENDERER_OPTIONS}
                  searchQuery={webglRendererSearchQuery}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, webglRenderer: val }));
                    setWebglRendererSearchQuery('');
                    setWebglRendererPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <FormItem
            label="WebGL Parameters (JSON)"
            description="Cấu hình tham số mở rộng của WebGL."
            tooltip="Chứa các giới hạn phần cứng như MAX_TEXTURE_SIZE. Websites có thể sử dụng các giới hạn này để 'fingerprint' card đồ họa của bạn."
          >
            <Input
              type="combobox"
              value={webglParamsPopoverOpen ? webglParamsSearchQuery : config.webglParameters}
              onChange={(e: any) => {
                setConfig((prev) => ({ ...prev, webglParameters: e.target.value }));
                setWebglParamsSearchQuery(e.target.value);
              }}
              popoverOpen={webglParamsPopoverOpen}
              onPopoverOpenChange={setWebglParamsPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.webglParameters}
                  options={[
                    {
                      label: 'Standard High-End',
                      value: '{"MAX_TEXTURE_SIZE":16384,"MAX_VIEWPORT_DIMS":[16384,16384]}',
                    },
                    {
                      label: 'Mid-Range',
                      value: '{"MAX_TEXTURE_SIZE":8192,"MAX_VIEWPORT_DIMS":[8192,8192]}',
                    },
                  ]}
                  searchQuery={webglParamsSearchQuery}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, webglParameters: val }));
                    setWebglParamsSearchQuery('');
                    setWebglParamsPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
        </div>
        {!isEditMode && activeStep === 9 && (
          <StepNavigation
            step={9}
            onPrev={() => setActiveStep(8)}
            onNext={() => setActiveStep(10)}
          />
        )}
      </FormSection>

      <FormSection
        title="10. Browser Metadata"
        description="Các thông số bảo mật và định danh nâng cao."
        icon={Globe}
        isUnlocked={isEditMode || activeStep >= 10}
        showHelp
      >
        <div className="grid grid-cols-1 gap-8">
          <FormItem
            label="Vendor"
            description="navigator.vendor"
            tooltip="Thông tin nhà sản xuất Engine trình duyệt. Các giá trị này (như Google Inc. hay Apple Computer) phải luôn trùng khớp với loại Engine trình duyệt mà bạn đang mô phỏng."
          >
            <Input
              type="combobox"
              placeholder="Chọn Vendor..."
              value={config.vendor}
              onChange={(e: any) => setConfig((prev) => ({ ...prev, vendor: e.target.value }))}
              popoverOpen={vendorPopoverOpen}
              onPopoverOpenChange={setVendorPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.vendor}
                  options={VENDOR_OPTIONS.filter((o) => {
                    if (config.ua.includes('Version/') && config.ua.includes('Safari/'))
                      return o.value.includes('Apple');
                    if (config.ua.includes('Chrome/')) return o.value.includes('Google');
                    if (config.ua.includes('Firefox/')) return o.value === '';
                    return true;
                  })}
                  searchQuery={vendorSearchQuery}
                  onChange={(val) => {
                    setConfig((prev) => ({ ...prev, vendor: val }));
                    setVendorPopoverOpen(false);
                    setVendorSearchQuery('');
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormItem
              label="Product Sub"
              description="navigator.productSub"
              tooltip="Hằng số định danh build của Engine trình duyệt. Giá trị 20030107 là tiêu chuẩn cho Chromium/WebKit, trong khi 20100101 dành riêng cho Gecko (Firefox)."
            >
              <Input
                type="combobox"
                placeholder="Chọn Product Sub..."
                value={config.productSub}
                onChange={(e: any) =>
                  setConfig((prev) => ({ ...prev, productSub: e.target.value }))
                }
                popoverOpen={prodSubPopoverOpen}
                onPopoverOpenChange={setProdSubPopoverOpen}
                popoverContent={
                  <Combobox
                    value={config.productSub}
                    options={PRODUCT_SUB_OPTIONS}
                    searchQuery={prodSubSearchQuery}
                    onChange={(val) => {
                      setConfig((prev) => ({ ...prev, productSub: val }));
                      setProdSubPopoverOpen(false);
                      setProdSubSearchQuery('');
                    }}
                  />
                }
                className="bg-input-background border-border rounded-xl font-bold font-mono"
              />
            </FormItem>
            <FormItem
              label="Do Not Track"
              description="Yêu cầu không theo dõi (DNT)."
              tooltip="Cờ navigator.doNotTrack yêu cầu website không theo dõi hành vi người dùng. Mặc dù giúp bảo mật, nhưng việc bật thông số này đôi khi lại khiến profile trông ít tự nhiên hơn."
            >
              <Input
                type="combobox"
                value={config.doNotTrack}
                onChange={(e: any) =>
                  setConfig((prev) => ({ ...prev, doNotTrack: e.target.value }))
                }
                popoverOpen={dntPopoverOpen}
                onPopoverOpenChange={setDntPopoverOpen}
                popoverContent={
                  <Combobox
                    value={config.doNotTrack}
                    options={DNT_OPTIONS}
                    onChange={(val) => {
                      setConfig((prev) => ({ ...prev, doNotTrack: val }));
                      setDntPopoverOpen(false);
                    }}
                  />
                }
                className="bg-input-background border-border rounded-xl font-bold font-mono"
              />
            </FormItem>
          </div>
        </div>
        {!isEditMode && activeStep === 10 && (
          <StepNavigation step={10} onPrev={() => setActiveStep(9)} onNext={() => {}} isLast />
        )}
      </FormSection>

      <Modal
        open={isSaveDrawerOpen}
        onClose={() => setIsSaveDrawerOpen(false)}
        title={
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black uppercase tracking-[0.25em] text-foreground">
              Lưu cấu hình vân tay
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
              Xác định danh tính cho bộ hồ sơ của bạn
            </p>
          </div>
        }
        size="sm"
        showCloseButton={false}
        footer={
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSaveDrawerOpen(false)}
              className="flex-1 h-12 rounded-xl bg-muted/10 text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted/20 transition-all border border-border/10 hover:text-foreground active:scale-95"
            >
              Hủy & Chỉnh sửa
            </button>
            <button
              onClick={async () => {
                setSaveLoading(true);
                try {
                  const id =
                    presetId && !presetId.startsWith('new-') ? presetId : crypto.randomUUID();
                  const query = `
                    REPLACE INTO fingerprints (id, name, description, ua, os, os_version, config_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                  `;
                  const params = [
                    id,
                    config.profileName,
                    config.profileDescription,
                    config.ua,
                    config.os,
                    config.osVersion,
                    JSON.stringify(config),
                  ];

                  // @ts-ignore
                  await window.electron.ipcRenderer.invoke('sqlite:run', query, params);

                  // Trigger refresh of presets list
                  window.dispatchEvent(new CustomEvent('zentri:fingerprints-updated'));

                  setIsSaveDrawerOpen(false);
                } catch (error) {
                  console.error('Failed to save fingerprint:', error);
                  alert('Lỗi khi lưu cấu hình vân tay. Vui lòng thử lại.');
                } finally {
                  setSaveLoading(false);
                }
              }}
              className="flex-[2] h-12 rounded-xl bg-primary/20 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.25em] hover:bg-primary/30 transition-all shadow-2xl shadow-primary/5 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {saveLoading ? (
                <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Hoàn tất & Lưu Profile
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-8 py-2">
          <div className="space-y-0 text-left relative group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Tên
              </label>
              <button
                onClick={() => {
                  const selectedUA = USER_AGENTS.find((u) => u.value === config.ua);
                  if (selectedUA) {
                    setConfig((prev) => ({ ...prev, profileName: selectedUA.label }));
                  }
                }}
                className="flex items-center gap-2 px-3.5 h-7 rounded-t-xl bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest transition-all border border-primary/30 border-b-0 hover:bg-primary/30 hover:text-primary active:scale-95"
              >
                <Globe className="w-2.5 h-2.5 text-primary" />
                Dùng User Agent làm tên
              </button>
            </div>
            <Input
              placeholder={
                USER_AGENTS.find((u) => u.value === config.ua)
                  ? `Ví dụ: ${USER_AGENTS.find((u) => u.value === config.ua)?.label}`
                  : 'Ví dụ: Chrome Windows 11 - Gaming Profile'
              }
              value={config.profileName || ''}
              onChange={(e: any) => setConfig((prev) => ({ ...prev, profileName: e.target.value }))}
              className="bg-input-background border-border rounded-xl rounded-tr-none px-5 font-bold placeholder:text-muted-foreground/50"
              size="lg"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { label: 'OS', value: config.os },
                { label: 'CPU', value: `${config.hardwareConcurrency} Cores` },
                { label: 'RAM', value: `${config.deviceMemory}GB` },
                { label: 'Res', value: `${config.width}x${config.height}` },
                { label: 'Lang', value: config.primaryLanguage },
              ].map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => {
                    const current = config.profileName || '';
                    const newVal = current ? `${current} - ${suggestion.value}` : suggestion.value;
                    setConfig((prev) => ({ ...prev, profileName: newVal }));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/20 text-[10px] font-bold text-muted-foreground hover:text-primary transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span className="opacity-30 font-medium">{suggestion.label}:</span>
                  {suggestion.value}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 text-left">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Mô tả
            </label>
            <Textarea
              placeholder="Nhập mô tả ngắn gọn về cấu hình này..."
              value={config.profileDescription || ''}
              onChange={(val) => setConfig((prev) => ({ ...prev, profileDescription: val }))}
              className="bg-input-background border-border rounded-xl px-5 py-3 font-bold placeholder:text-muted-foreground/50"
              minRows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
