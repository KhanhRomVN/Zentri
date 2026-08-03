import { FC } from 'react';
import { ArrowLeft, CheckCircle2, Globe, Monitor, Activity, Layout, HelpCircle } from 'lucide-react';
import { Tooltip } from '../../../../../components/ui/Tooltip';
import Modal from '../../../../../components/ui/Modal/Modal';
import Button from '../../../../../components/ui/Button/Button';
import { Fingerprint } from '../fingerprint';

// ── Colors per section (same as FingerprintDetail) ────────────────────
const STEP_COLORS: Record<string, string> = {
  '01. User-Agent': '#8b5cf6',
  '02. Hardware Properties': '#10b981',
  '03. Screen Properties': '#f59e0b',
  '04. Window Properties': '#ef4444',
  '05. Language & Location': '#06b6d4',
  '06. Canvas & Media': '#ec4899',
  '07. Browser Metadata': '#64748b',
};

const inputReadOnly = 'w-full h-9 px-3 rounded-md bg-muted/30 border border-border text-sm text-foreground opacity-80 cursor-not-allowed';

// ── Sub-components ────────────────────────────────────────────────────

const FormSection: FC<{
  title: string; description?: string; icon: any; children: React.ReactNode;
}> = ({ title, description, icon: Icon, children }) => {
  const stepColor = STEP_COLORS[title] || '#3b82f6';
  return (
    <div className="relative group">
      <div className="flex items-start gap-3 relative z-10">
        <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${stepColor}15`, color: stepColor }}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h2 className="text-[13px] font-black tracking-widest uppercase text-foreground">{title}</h2>
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
  label: string; description: string; children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5">
      <label className="text-[13px] font-bold text-foreground truncate">{label}</label>
      <Tooltip content={<p className="text-xs">{description}</p>} side="right">
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help shrink-0" />
      </Tooltip>
    </div>
    {children}
  </div>
);

const ReadonlyField: FC<{ value: string }> = ({ value }) => (
  <input type="text" readOnly value={value} className={inputReadOnly} />
);

// ── Detail View ───────────────────────────────────────────────────────

interface DetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  fingerprint: Fingerprint;
  onConfirm: () => void;
  onBack: () => void;
}

const DetailView: FC<DetailViewProps> = ({ isOpen, onClose, fingerprint, onConfirm, onBack }) => {
  const c = fingerprint.config;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <button onClick={onBack} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Fingerprint Details</p>
            <p className="text-[10px] text-secondary">{fingerprint.name}</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto custom-scrollbar px-5 py-4 space-y-4">
          {/* ── 01. User-Agent ──────────────────────────────────── */}
          <FormSection title="01. User-Agent" description="Trình duyệt và hệ điều hành." icon={Globe}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormItem label="Platform" description="Hệ điều hành.">
                <ReadonlyField value={c.platform || ''} />
              </FormItem>
              <FormItem label="Platform Version" description="Phiên bản OS.">
                <ReadonlyField value={c.platformVersion || ''} />
              </FormItem>
              <FormItem label="OS CPU" description="Kiến trúc CPU.">
                <ReadonlyField value={c.oscpu || ''} />
              </FormItem>
              <FormItem label="Build ID" description="Build trình duyệt.">
                <ReadonlyField value={c.buildID || ''} />
              </FormItem>
            </div>
            <div className="mt-3">
              <FormItem label="User Agent" description="Chuỗi User-Agent đầy đủ.">
                <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-lg break-all font-mono leading-relaxed">
                  {c.userAgent}
                </p>
              </FormItem>
            </div>
          </FormSection>

          {/* ── 02. Hardware Properties ─────────────────────────── */}
          <FormSection title="02. Hardware Properties" description="Thông số CPU và RAM." icon={Activity}>
            <div className="grid grid-cols-3 gap-3">
              <FormItem label="CPU Cores" description="Số lõi CPU logic.">
                <ReadonlyField value={String(c.hardwareConcurrency ?? '')} />
              </FormItem>
              <FormItem label="Touch Points" description="Điểm chạm tối đa.">
                <ReadonlyField value={String(c.maxTouchPoints ?? '')} />
              </FormItem>
              <FormItem label="RAM (GB)" description="Bộ nhớ thiết bị.">
                <ReadonlyField value={`${c.deviceMemory ?? ''} GB`} />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 03. Screen Properties ───────────────────────────── */}
          <FormSection title="03. Screen Properties" description="Kích thước hiển thị." icon={Monitor}>
            <div className="grid grid-cols-2 gap-3">
              <FormItem label="Resolution" description="Độ phân giải màn hình.">
                <ReadonlyField value={`${c.screenWidth}×${c.screenHeight}`} />
              </FormItem>
              <FormItem label="Available" description="Kích thước khả dụng.">
                <ReadonlyField value={`${c.screenAvailWidth}×${c.screenAvailHeight}`} />
              </FormItem>
              <FormItem label="Pixel Ratio" description="Tỷ lệ điểm ảnh.">
                <ReadonlyField value={String(c.devicePixelRatio ?? '')} />
              </FormItem>
              <FormItem label="Color Depth" description="Độ sâu màu.">
                <ReadonlyField value={`${c.screenColorDepth ?? 24}-bit`} />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 04. Window Properties ───────────────────────────── */}
          <FormSection title="04. Window Properties" description="Kích thước cửa sổ." icon={Layout}>
            <div className="grid grid-cols-3 gap-3">
              <FormItem label="Outer" description="Toàn bộ cửa sổ.">
                <ReadonlyField value={`${c.windowOuterWidth}×${c.windowOuterHeight}`} />
              </FormItem>
              <FormItem label="Inner" description="Viewport.">
                <ReadonlyField value={`${c.windowInnerWidth}×${c.windowInnerHeight}`} />
              </FormItem>
              <FormItem label="Position" description="Tọa độ cửa sổ.">
                <ReadonlyField value={`${c.screenX},${c.screenY}`} />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 05. Language & Location ─────────────────────────── */}
          <FormSection title="05. Language & Location" description="Ngôn ngữ và vị trí địa lý." icon={Globe}>
            <div className="grid grid-cols-2 gap-3">
              <FormItem label="Language" description="Ngôn ngữ chính.">
                <ReadonlyField value={c.language || ''} />
              </FormItem>
              <FormItem label="Languages" description="Danh sách ngôn ngữ.">
                <ReadonlyField value={Array.isArray(c.languages) ? c.languages.join(', ') : (c.languages || '')} />
              </FormItem>
              <FormItem label="Timezone" description="Múi giờ.">
                <ReadonlyField value={c.timezone || ''} />
              </FormItem>
              <FormItem label="Offset (min)" description="UTC offset.">
                <ReadonlyField value={String(c.timezoneOffset ?? '')} />
              </FormItem>
              <FormItem label="Latitude" description="Vĩ độ GPS.">
                <ReadonlyField value={String(c.latitude ?? '')} />
              </FormItem>
              <FormItem label="Longitude" description="Kinh độ GPS.">
                <ReadonlyField value={String(c.longitude ?? '')} />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 06. Canvas & Media ──────────────────────────────── */}
          <FormSection title="06. Canvas & Media" description="Đồ họa và âm thanh." icon={Monitor}>
            <div className="grid grid-cols-2 gap-3">
              <FormItem label="Canvas Seed" description="Canvas noise seed.">
                <ReadonlyField value={c.canvasNoiseSeed || ''} />
              </FormItem>
              <FormItem label="Audio Sample Rate" description="Tần số lấy mẫu.">
                <ReadonlyField value={`${c.audioSampleRate ?? ''} Hz`} />
              </FormItem>
              <FormItem label="WebGL Vendor" description="GPU vendor.">
                <ReadonlyField value={c.webglVendor?.split('(')[0]?.trim() || ''} />
              </FormItem>
              <FormItem label="WebGL Renderer" description="GPU renderer.">
                <ReadonlyField value={c.webglRenderer || ''} />
              </FormItem>
              <FormItem label="Max Channels" description="Kênh âm thanh.">
                <ReadonlyField value={String(c.audioMaxChannelCount ?? '')} />
              </FormItem>
              <FormItem label="Dark Mode" description="prefers-color-scheme.">
                <ReadonlyField value={c.prefersDarkMode ? 'Dark' : 'Light'} />
              </FormItem>
            </div>
          </FormSection>

          {/* ── 07. Browser Metadata ────────────────────────────── */}
          <FormSection title="07. Browser Metadata" description="Thông số trình duyệt." icon={Globe}>
            <div className="grid grid-cols-2 gap-3">
              <FormItem label="Vendor" description="navigator.vendor.">
                <ReadonlyField value={c.vendor || ''} />
              </FormItem>
              <FormItem label="Product Sub" description="navigator.productSub.">
                <ReadonlyField value={c.productSub || ''} />
              </FormItem>
              <FormItem label="Do Not Track" description="DNT header.">
                <ReadonlyField value={c.doNotTrack || ''} />
              </FormItem>
              <FormItem label="WebDriver" description="navigator.webdriver.">
                <ReadonlyField value={c.webdriver ? 'true' : 'false'} />
              </FormItem>
              <FormItem label="Cookies" description="Cookie enabled.">
                <ReadonlyField value={c.cookieEnabled ? 'Enabled' : 'Disabled'} />
              </FormItem>
              <FormItem label="PDF Viewer" description="PDF support.">
                <ReadonlyField value={c.pdfViewerEnabled ? 'Yes' : 'No'} />
              </FormItem>
            </div>
          </FormSection>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          <Button onClick={onConfirm} fullWidth>
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-black uppercase">Confirm Selection</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DetailView;