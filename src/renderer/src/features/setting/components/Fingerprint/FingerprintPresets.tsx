import { cn } from '@renderer/shared/lib/utils';
import { Plus, Shield } from 'lucide-react';
import React, { FC } from 'react';

export interface FingerprintConfig {
  // Identity
  profileName: string;
  profileDescription: string;
  // Platform
  os: string;
  osVersion: string;
  // User Agent
  ua: string;
  brand: string;
  brandVersion: string;
  // Hardware
  hardwareConcurrency: number;
  deviceMemory: number;
  maxTouchPoints: number;
  // Screen
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  devicePixelRatio: number;
  colorDepth: number;
  // Window
  outerWidth: number;
  outerHeight: number;
  innerWidth: number;
  innerHeight: number;
  screenX: number;
  screenY: number;
  // Locale
  primaryLanguage: string;
  languages: string;
  doNotTrack: string;
  // Location
  timezone: string;
  longitude: number;
  latitude: number;
  accuracy: number;
  // WebGL
  webglVendor: string;
  webglRenderer: string;
  webglParameters: string;
  // Canvas
  canvasNoiseSeed: number;
  canvasFonts: string;
  // Audio
  audioSampleRate: number;
  audioMaxChannelCount: number;
  // Battery
  batteryLevel: number;
  // Metadata
  vendor: string;
  vendorSub: string;
  productSub: string;
  // Navigator
  webdriver: boolean;
  // Automation
  autoIpTimezone?: boolean;
  autoIpGps?: boolean;
  autoIpLanguage?: boolean;
}

export const INITIAL_CONFIG: FingerprintConfig = {
  profileName: '',
  profileDescription: '',
  os: 'Windows',
  osVersion: '10.0.0',
  ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  brand: 'Google Chrome',
  brandVersion: '131',
  hardwareConcurrency: 16,
  deviceMemory: 8,
  maxTouchPoints: 0,
  width: 1920,
  height: 1080,
  availWidth: 1920,
  availHeight: 1040,
  devicePixelRatio: 1,
  colorDepth: 24,
  outerWidth: 1920,
  outerHeight: 1080,
  innerWidth: 1920,
  innerHeight: 1080,
  screenX: 0,
  screenY: 0,
  primaryLanguage: 'vi-VN',
  languages: '["vi-VN", "vi", "en-US", "en"]',
  doNotTrack: '0',
  timezone: 'Asia/Ho_Chi_Minh',
  longitude: 106.6297,
  latitude: 10.8231,
  accuracy: 10,
  webglVendor: 'Google Inc. (NVIDIA)',
  webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  webglParameters: '{}',
  canvasNoiseSeed: 123456,
  canvasFonts: '["Arial", "Verdana"]',
  audioSampleRate: 48000,
  audioMaxChannelCount: 2,
  batteryLevel: 1,
  vendor: 'Google Inc.',
  vendorSub: '',
  productSub: '20030107',
  webdriver: false,
  autoIpTimezone: true,
  autoIpGps: true,
  autoIpLanguage: true,
};

export const PRESETS: {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  config: FingerprintConfig;
}[] = [];

interface FingerprintPresetsProps {
  currentId?: string;
  onSelect: (config: FingerprintConfig, id: string) => void;
  onAdd?: () => void;
}

export const FingerprintPresets: FC<FingerprintPresetsProps> = ({ currentId, onSelect, onAdd }) => {
  const [dbPresets, setDbPresets] = React.useState<any[]>([]);

  const loadPresets = async () => {
    try {
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        'SELECT * FROM fingerprints ORDER BY created_at DESC',
      );
      setDbPresets(
        rows.map((r: { id: any; name: any; description: any; config_json: string }) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          config: JSON.parse(r.config_json),
          icon: Shield,
          color: '#4f46e5', // Default primary color
        })),
      );
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  React.useEffect(() => {
    loadPresets();

    const handleUpdate = () => loadPresets();
    window.addEventListener('zentri:fingerprints-updated', handleUpdate);
    return () => window.removeEventListener('zentri:fingerprints-updated', handleUpdate);
  }, []);

  const allPresets = [...PRESETS, ...dbPresets];

  return (
    <aside className="w-[340px] border-r border-border bg-card/10 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-5 border-b border-border/50 sticky top-0 bg-background/50 backdrop-blur-xl z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground">
            Fingerprint Presets
          </h3>
          <button
            onClick={onAdd}
            className="w-10 h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95 border border-primary/20 flex items-center justify-center group shadow-lg shadow-primary/5"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col p-3 space-y-2 relative">
        {allPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.config, preset.id)}
            className={cn(
              'w-full flex items-start gap-4 p-4 rounded-2xl transition-all border group relative overflow-hidden',
              currentId === preset.id
                ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5'
                : 'bg-transparent border-transparent hover:bg-muted/30 hover:border-border/50',
            )}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
              style={{ backgroundColor: `${preset.color}15`, color: preset.color }}
            >
              <preset.icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start min-w-0 pr-2">
              <span className="text-[13px] font-black text-foreground tracking-tight truncate w-full text-left">
                {preset.name}
              </span>
              <span className="text-[10px] text-muted-foreground/40 font-bold line-clamp-1 mt-1 text-left uppercase tracking-wider">
                {preset.description}
              </span>
            </div>
            {currentId === preset.id && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}

        {allPresets.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 pb-32 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-card to-background border border-border/50 flex items-center justify-center shadow-2xl">
                <Shield className="w-10 h-10 text-primary/40" />
              </div>
              <div className="absolute -right-2 -bottom-2 w-10 h-10 rounded-2xl bg-background border border-border flex items-center justify-center shadow-lg animate-bounce">
                <Plus className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="space-y-3 max-w-[220px]">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground/80">
                Sẵn sàng khởi tạo
              </h4>
              <p className="text-[10px] font-bold text-muted-foreground/30 leading-relaxed uppercase tracking-wider">
                Nhấn nút cộng phía trên để bắt đầu tạo profile vân tay đầu tiên của bạn
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
