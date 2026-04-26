import React, { useState, useEffect } from 'react';
import {
  Globe,
  Monitor,
  Activity,
  Layout,
  MapPin,
  CheckCircle2,
  Settings2,
  Zap,
  Lock as LockIcon,
  Shield,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import Input from '../../../shared/components/ui/input/Input';
import Combobox from '../../../shared/components/ui/combobox/Combobox';
import { Drawer } from '../../../shared/components/ui/drawer';

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
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {showTooltip && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowTooltip(false)} />
          <div className="absolute z-50 left-0 top-10 w-80 p-4 rounded-2xl bg-[#121214] border border-border/50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-[12px] leading-relaxed text-muted-foreground">
              {tooltip || help}
            </div>
            <div className="absolute -top-1 left-4 w-2 h-2 bg-[#121214] border-t border-l border-border/50 transform rotate-45" />
          </div>
        </>
      )}

      <div className="pt-1">{children}</div>
    </div>
  );
};

const parseUserAgent = (ua: string) => {
  const uaLower = ua.toLowerCase();
  let os = 'Win32';
  let osVersion = '10.0.0';

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

  return { os, osVersion };
};

import { FingerprintConfig } from './FingerprintPresets';
import { USER_AGENTS } from '../constants/userAgents';

export const FingerprintSettings = ({
  config,
  setConfig,
}: {
  config: FingerprintConfig;
  setConfig: React.Dispatch<React.SetStateAction<FingerprintConfig>>;
}) => {
  const [activeStep, setActiveStep] = useState(1);
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
  const [viewportPopoverOpen, setViewportPopoverOpen] = useState(false);
  const [langPopoverOpen, setLangPopoverOpen] = useState(false);
  const [dntPopoverOpen, setDntPopoverOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [canvasPopoverOpen, setCanvasPopoverOpen] = useState(false);
  const [audioPopoverOpen, setAudioPopoverOpen] = useState(false);
  const [vendorPopoverOpen, setVendorPopoverOpen] = useState(false);
  const [prodSubPopoverOpen, setProdSubPopoverOpen] = useState(false);

  const [osVersionSearchQuery, setOsVersionSearchQuery] = useState('');
  const [resSearchQuery, setResSearchQuery] = useState('');
  const [viewportSearchQuery, setViewportSearchQuery] = useState('');
  const [canvasSearchQuery, setCanvasSearchQuery] = useState('');
  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [prodSubSearchQuery, setProdSubSearchQuery] = useState('');

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

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <FormSection
        title="01. User Agent"
        description="Định dạng cốt lõi xác định danh tính thiết bị của bạn."
        icon={Globe}
        isUnlocked={activeStep === 1}
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
              value={config.ua}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                const { os, osVersion } = parseUserAgent(val);
                setConfig((prev) => ({ ...prev, ua: val, os, osVersion }));
                setUaSearchQuery(val);
              }}
              popoverOpen={uaPopoverOpen}
              onPopoverOpenChange={setUaPopoverOpen}
              popoverContent={
                <Combobox
                  value={config.ua}
                  options={USER_AGENTS}
                  searchQuery={uaSearchQuery}
                  onChange={(val) => {
                    const { os, osVersion } = parseUserAgent(val);
                    setConfig((prev) => ({ ...prev, ua: val, os, osVersion }));
                    setUaSearchQuery('');
                    setUaPopoverOpen(false);
                  }}
                />
              }
              className="bg-input-background border-border rounded-xl font-bold font-mono"
            />
          </FormItem>
        </div>
        {activeStep === 1 && (
          <StepNavigation step={1} onPrev={() => {}} onNext={() => setActiveStep(2)} />
        )}
      </FormSection>

      <FormSection
        title="02. Platform & OS Version"
        description="Đồng bộ hóa hệ điều hành và phiên bản tương ứng."
        icon={Monitor}
        isUnlocked={activeStep === 2}
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
        </div>
        {activeStep === 2 && (
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
        isUnlocked={activeStep === 3}
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
        {activeStep === 3 && (
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
        isUnlocked={activeStep === 4}
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
              onChange={(e: any) => {
                const val = e.target.value;
                if (val.includes('x')) {
                  const [w, h] = val.split('x');
                  setConfig((prev) => ({
                    ...prev,
                    width: parseInt(w) || 0,
                    height: parseInt(h) || 0,
                  }));
                }
                setResSearchQuery(val);
              }}
              popoverOpen={resPopoverOpen}
              onPopoverOpenChange={setResPopoverOpen}
              popoverContent={
                <Combobox
                  value={`${config.width}x${config.height}`}
                  options={COMMON_RESOLUTIONS}
                  searchQuery={resSearchQuery}
                  onChange={(val) => {
                    const [w, h] = val.split('x');
                    setConfig((prev) => ({ ...prev, width: parseInt(w), height: parseInt(h) }));
                    setResPopoverOpen(false);
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
        </div>
        {activeStep === 4 && (
          <StepNavigation
            step={4}
            onPrev={() => setActiveStep(3)}
            onNext={() => setActiveStep(5)}
          />
        )}
      </FormSection>

      <FormSection
        title="05. Window Properties"
        description="Thiết lập liên quan đến kích thước cửa sổ trình duyệt."
        icon={Layout}
        isUnlocked={activeStep === 5}
        showHelp
      >
        <FormItem
          label="Viewport Size"
          description="Kích thước vùng nội dung hiển thị."
          tooltip="Kích thước thực tế navigator.innerWidth/innerHeight. Đây là thông số quan trọng để website tối ưu hóa giao diện và phát hiện các dấu hiệu tự động hóa qua sai lệch viewport."
        >
          <Input
            type="combobox"
            value={`${config.innerWidth}x${config.innerHeight}`}
            onChange={(e: any) => {
              const val = e.target.value;
              if (val.includes('x')) {
                const [w, h] = val.split('x').map((v: string) => parseInt(v));
                setConfig((prev) => ({ ...prev, innerWidth: w || 0, innerHeight: h || 0 }));
              }
              setViewportSearchQuery(val);
            }}
            popoverOpen={viewportPopoverOpen}
            onPopoverOpenChange={setViewportPopoverOpen}
            popoverContent={
              <Combobox
                value={`${config.innerWidth}x${config.innerHeight}`}
                options={COMMON_RESOLUTIONS}
                searchQuery={viewportSearchQuery}
                onChange={(val) => {
                  const [w, h] = val.split('x').map((v: string) => parseInt(v));
                  setConfig((prev) => ({ ...prev, innerWidth: w, innerHeight: h }));
                  setViewportPopoverOpen(false);
                }}
              />
            }
            className="bg-input-background border-border rounded-xl font-bold font-mono"
          />
        </FormItem>
        {activeStep === 5 && (
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
        isUnlocked={activeStep === 6}
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
                  'flex items-center gap-2 px-3 h-7 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all',
                  config.autoIpLanguage
                    ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]'
                    : 'bg-muted/5 text-muted-foreground/40 border-border/10 hover:bg-muted/10',
                )}
              >
                <Globe className="w-2.5 h-2.5" />
                {config.autoIpLanguage ? 'ON Auto IP' : 'Dựa trên IP'}
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
        </div>
        {activeStep === 6 && (
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
        isUnlocked={activeStep === 7}
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
                  'flex items-center gap-2 px-3 h-7 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all',
                  config.autoIpTimezone
                    ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]'
                    : 'bg-muted/5 text-muted-foreground/40 border-border/10 hover:bg-muted/10',
                )}
              >
                <Globe className="w-2.5 h-2.5" />
                {config.autoIpTimezone ? 'ON Auto IP' : 'Timezone theo IP'}
              </button>
            }
          >
            <Input
              value={config.autoIpTimezone ? 'Tự động dựa vào IP' : config.timezone}
              readOnly
              className="bg-muted/10 border-border/50 text-muted-foreground/60 rounded-xl opacity-80"
            />
          </FormItem>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <FormItem
              label="Longitude"
              description="Kinh độ địa lý."
              tooltip="Tọa độ navigator.geolocation. Đồng bộ GPS với IP giúp hồ sơ của bạn vượt qua các bài kiểm tra vị trí địa lý của Google/Facebook/Amazon."
              action={
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, autoIpGps: !prev.autoIpGps }))}
                  className={cn(
                    'flex items-center gap-2 px-3 h-7 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all',
                    config.autoIpGps
                      ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]'
                      : 'bg-muted/5 text-muted-foreground/40 border-border/10 hover:bg-muted/10',
                  )}
                >
                  <MapPin className="w-2.5 h-2.5" />
                  {config.autoIpGps ? 'ON Auto GPS' : 'GPS theo IP'}
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
          </div>
        </div>
        {activeStep === 7 && (
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
        isUnlocked={activeStep === 8}
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
              className="bg-input-background border-border rounded-xl font-bold font-mono"
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
        </div>
        {activeStep === 8 && (
          <StepNavigation
            step={8}
            onPrev={() => setActiveStep(7)}
            onNext={() => setActiveStep(9)}
          />
        )}
      </FormSection>

      <FormSection
        title="09. Browser Metadata"
        description="Các thông số bảo mật và định danh nâng cao."
        icon={Globe}
        isUnlocked={activeStep === 9}
        showHelp
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          <FormItem
            label="Product Sub"
            description="navigator.productSub"
            tooltip="Hằng số định danh build của Engine trình duyệt. Giá trị 20030107 là tiêu chuẩn cho Chromium/WebKit, trong khi 20100101 dành riêng cho Gecko (Firefox)."
          >
            <Input
              type="combobox"
              placeholder="Chọn Product Sub..."
              value={config.productSub}
              onChange={(e: any) => setConfig((prev) => ({ ...prev, productSub: e.target.value }))}
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
              onChange={(e: any) => setConfig((prev) => ({ ...prev, doNotTrack: e.target.value }))}
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
        {activeStep === 9 && (
          <StepNavigation step={9} onPrev={() => setActiveStep(8)} onNext={() => {}} isLast />
        )}
      </FormSection>

      <Drawer
        isOpen={isSaveDrawerOpen}
        onClose={() => setIsSaveDrawerOpen(false)}
        title="SAVE CUSTOM FINGERPRINT"
        subtitle="Finalize your fingerprint profile identity"
        width={700}
        showCloseButton={false}
      >
        <div className="flex flex-col h-screen bg-background/50 overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12 pb-32">
            {/* Identity Group */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                <h3 className="text-sm font-black uppercase tracking-[0.25em] text-foreground">
                  Profile Identity
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-1">
                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                    <Settings2 className="w-3.5 h-3.5 text-primary" />
                    Profile Name
                  </label>
                  <Input
                    placeholder="e.g. Chrome Windows 11 - Gaming Profile"
                    value={config.profileName || ''}
                    onChange={(e: any) =>
                      setConfig((prev) => ({ ...prev, profileName: e.target.value }))
                    }
                    className="bg-input-background border-border rounded-2xl h-14 text-sm font-bold pl-5"
                  />
                </div>
                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    Description
                  </label>
                  <Input
                    placeholder="Optional description about this configuration..."
                    value={config.profileDescription || ''}
                    onChange={(e: any) =>
                      setConfig((prev) => ({ ...prev, profileDescription: e.target.value }))
                    }
                    className="bg-input-background border-border rounded-2xl h-14 text-sm font-bold pl-5"
                  />
                </div>
              </div>
            </div>

            {/* Comprehensive Summary Grid */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <h3 className="text-sm font-black uppercase tracking-[0.25em] text-foreground">
                  Complete Configuration Summary
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: 'OS', value: config.os, icon: <Monitor /> },
                  { label: 'OS Version', value: config.osVersion, icon: <Settings2 /> },
                  {
                    label: 'Resolution',
                    value: `${config.width}x${config.height}`,
                    icon: <Monitor />,
                  },
                  {
                    label: 'Viewport',
                    value: `${config.innerWidth}x${config.innerHeight}`,
                    icon: <Layout />,
                  },
                  { label: 'Memory', value: `${config.deviceMemory} GB`, icon: <Activity /> },
                  {
                    label: 'CPU Cores',
                    value: `${config.hardwareConcurrency}`,
                    icon: <Activity />,
                  },
                  { label: 'Touch Points', value: `${config.maxTouchPoints}`, icon: <Zap /> },
                  { label: 'DPR', value: config.devicePixelRatio, icon: <Monitor /> },
                  { label: 'Timezone', value: config.timezone, icon: <Globe /> },
                  { label: 'Primary Language', value: config.primaryLanguage, icon: <Globe /> },
                  { label: 'Languages', value: config.languages, icon: <Globe /> },
                  { label: 'WebGL Vendor', value: config.webglVendor, icon: <Layout /> },
                  { label: 'WebGL Renderer', value: config.webglRenderer, icon: <Layout /> },
                  { label: 'Canvas Seed', value: config.canvasNoiseSeed, icon: <Zap /> },
                  { label: 'Audio Rate', value: `${config.audioSampleRate}Hz`, icon: <Activity /> },
                  { label: 'Product Sub', value: config.productSub, icon: <Settings2 /> },
                  { label: 'Vendor', value: config.vendor, icon: <Settings2 /> },
                  {
                    label: 'Webdriver',
                    value: config.webdriver ? 'Active' : 'Hidden',
                    icon: <LockIcon />,
                  },
                  {
                    label: 'DNT',
                    value: config.doNotTrack === '1' ? 'Enabled' : 'Disabled',
                    icon: <Shield />,
                  },
                  {
                    label: 'Battery',
                    value: `${(config.batteryLevel * 100).toFixed(0)}%`,
                    icon: <Zap />,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-5 rounded-3xl bg-card/40 border border-border/40 flex flex-col gap-3 relative overflow-hidden group hover:border-primary/30 transition-all hover:bg-card hover:-translate-y-1"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-muted/5 group-hover:bg-primary/40 transition-colors" />
                    <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 group-hover:text-primary/60 transition-colors">
                      {React.isValidElement(item.icon) &&
                        React.cloneElement(item.icon as React.ReactElement, {
                          className: 'w-3.5 h-3.5',
                        })}
                      {item.label}
                    </div>
                    <div className="text-[12px] font-black text-foreground/90 truncate pl-1">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full UA Preview */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                <h3 className="text-sm font-black uppercase tracking-[0.25em] text-foreground">
                  Full User Agent Preview
                </h3>
              </div>
              <div className="p-6 rounded-[2rem] bg-card/30 border border-border/30 font-mono text-[10px] text-muted-foreground/50 leading-relaxed text-left relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent pointer-events-none" />
                <p className="relative z-10 break-all">{config.ua}</p>
              </div>
            </div>
          </div>

          {/* Sticky Drawer Footer */}
          <div className="absolute bottom-0 left-0 right-0 h-28 px-10 border-t border-border/50 bg-background/90 backdrop-blur-3xl flex items-center gap-6 shadow-2xl">
            <button
              onClick={() => setIsSaveDrawerOpen(false)}
              className="flex-1 h-14 rounded-2xl bg-muted/10 text-muted-foreground font-black text-[11px] uppercase tracking-widest hover:bg-muted/20 transition-all border border-border/10 hover:text-foreground active:scale-95"
            >
              Cancel & Edit
            </button>
            <button
              onClick={() => {
                setSaveLoading(true);
                setTimeout(() => {
                  setSaveLoading(false);
                  setIsSaveDrawerOpen(false);
                }, 1500);
              }}
              className="flex-[2] h-14 rounded-2xl bg-primary text-button-bgText font-black text-[11px] uppercase tracking-[0.25em] hover:brightness-110 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {saveLoading ? (
                <div className="w-5 h-5 border-3 border-button-bgText border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Finalize & Register Profile
                </>
              )}
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
