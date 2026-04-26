import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Zap, X, ChevronDown, Settings2, Fingerprint, Network } from 'lucide-react';
import Portal from '../../../../shared/components/ui/Portal';
import { Switch } from '../../../../shared/components/ui/Switch';
import { cn } from '../../../../shared/lib/utils';

interface ProfileLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onLaunch: (config: { checkHealth: boolean }) => void;
}

const ProfileLaunchModal: FC<ProfileLaunchModalProps> = ({ isOpen, onClose, email, onLaunch }) => {
  const { t } = useTranslation();
  const [checkHealth, setCheckHealth] = useState(true);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={onClose} />

        {/* Modal Content */}
        <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-white">
                  Cấu hình Donut Browser
                </h2>
                <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">
                  {email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Proxy Section (Disabled) */}
            <div className="space-y-2.5 opacity-50 grayscale select-none">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Network className="w-3.5 h-3.5" />
                  Proxy kết nối
                </label>
                <span className="text-[8px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase">
                  Sắp ra mắt
                </span>
              </div>
              <div className="h-11 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 flex items-center justify-between cursor-not-allowed">
                <span className="text-xs text-zinc-500 italic">Mặc định (Hệ thống)</span>
                <ChevronDown className="w-4 h-4 text-zinc-700" />
              </div>
            </div>

            {/* Fingerprint Section (Disabled) */}
            <div className="space-y-2.5 opacity-50 grayscale select-none">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Fingerprint className="w-3.5 h-3.5" />
                  Dấu vân tay (Fingerprint)
                </label>
                <span className="text-[8px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase">
                  Sắp ra mắt
                </span>
              </div>
              <div className="h-11 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 flex items-center justify-between cursor-not-allowed">
                <span className="text-xs text-zinc-500 italic">Mặc định (Tự động tạo)</span>
                <ChevronDown className="w-4 h-4 text-zinc-700" />
              </div>
            </div>

            <div className="h-px bg-zinc-800/50" />

            {/* Health Check Toggle */}
            <div className="flex items-center justify-between p-4 bg-zinc-950/30 rounded-2xl border border-zinc-800/50 hover:bg-zinc-950/50 transition-all group">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                    checkHealth
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700',
                  )}
                >
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">Kiểm tra an toàn</h3>
                  <p className="text-[10px] text-zinc-500 italic">
                    Tự động chẩn đoán Proxy/Fingerprint trước khi mở
                  </p>
                </div>
              </div>
              <Switch checked={checkHealth} onCheckedChange={setCheckHealth} />
            </div>

            {/* Launch Button */}
            <button
              onClick={() => onLaunch({ checkHealth })}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <span className="text-sm font-black uppercase tracking-[0.2em]">Khởi chạy Donut</span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ProfileLaunchModal;
