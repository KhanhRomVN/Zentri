import { FC, useState, useEffect } from 'react';
import {
  Shield,
  Globe,
  MapPin,
  Activity,
  X,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import Portal from '../../../../shared/components/ui/Portal';

interface HealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  accountId: string;
  url?: string;
  provider?: string;
  onSuccess: () => void;
}

const HealthCheckModal: FC<HealthCheckModalProps> = ({ isOpen, onClose, email, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const performCheck = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    // Smooth progress simulation
    const timer = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.random() * 15 : prev));
    }, 200);

    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-fingerprint', { email });

      clearInterval(timer);
      setProgress(100);

      if (result.success) {
        setData(result);

        const score = result.health?.val || 0;
        if (score >= 90) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      } else {
        setError(result.error || 'Failed to diagnostic profile');
      }
    } catch (err) {
      clearInterval(timer);
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      performCheck();
    } else {
      setData(null);
      setLoading(true);
    }
  }, [isOpen, email]);

  if (!isOpen) return null;

  const score = data?.health?.val || 0;

  return (
    <Portal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
          onClick={loading ? undefined : onClose}
        />

        {/* Modal Content */}
        <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Scanning Header */}
          <div className="relative h-48 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden border-b border-zinc-800">
            {/* Animated Grid Background */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center">
                <Shield
                  className={`w-12 h-12 ${loading ? 'text-blue-500 animate-pulse' : error ? 'text-red-500' : 'text-emerald-500'}`}
                />
              </div>

              {loading && (
                <svg className="absolute -inset-2 w-28 h-28 -rotate-90">
                  <circle
                    className="text-blue-500/20"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                    r="52"
                    cx="56"
                    cy="56"
                  />
                  <circle
                    className="text-blue-500 transition-all duration-500"
                    strokeWidth="4"
                    strokeDasharray={326}
                    strokeDashoffset={326 - (326 * progress) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="52"
                    cx="56"
                    cy="56"
                  />
                </svg>
              )}
            </div>

            <h2 className="mt-6 text-lg font-bold tracking-tight text-white uppercase italic">
              {loading ? 'Analyzing Profile...' : error ? 'Diagnostic Failed' : 'System Secure'}
            </h2>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">
              {email}
            </p>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {loading ? (
              <div className="space-y-4">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-zinc-300 font-medium mb-1">Could not verify environment</p>
                <p className="text-zinc-500 text-xs mb-6">{error}</p>
                <button
                  onClick={performCheck}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Retry Diagnostics
                </button>
              </div>
            ) : (
              <>
                {/* Health Summary */}
                <div
                  className={`flex items-center justify-between p-4 ${score > 80 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'} border rounded-2xl`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full ${score > 80 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'} flex items-center justify-center border`}
                    >
                      <span
                        className={`text-lg font-black ${score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}
                      >
                        {score}
                      </span>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold ${score > 80 ? 'text-emerald-500' : 'text-amber-500'} uppercase tracking-wider`}
                      >
                        Cleanliness Score
                      </p>
                      <p className="text-[10px] text-zinc-500 italic">
                        {data.health?.reasons?.length > 0
                          ? data.health.reasons[0]
                          : 'Environment is healthy and safe for browsing.'}
                      </p>
                    </div>
                  </div>
                  {score > 80 ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <DiagnosticItem
                    icon={<Globe className="w-3.5 h-3.5" />}
                    label="IP Address"
                    value={data.geoData.query}
                    color="text-blue-400"
                  />
                  <DiagnosticItem
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    label="Location"
                    value={`${data.geoData.city}, ${data.geoData.country}`}
                    color="text-red-400"
                  />
                  <DiagnosticItem
                    icon={<Activity className="w-3.5 h-3.5" />}
                    label="Connection Type"
                    value={data.geoData.usageType}
                    color="text-emerald-400"
                  />
                  <DiagnosticItem
                    icon={<Shield className="w-3.5 h-3.5" />}
                    label="WebRTC Public"
                    value={data.webrtc.public}
                    color="text-amber-400"
                  />
                </div>

                {/* Footer Actions */}
                <div className="pt-6 flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all uppercase tracking-widest"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => {
                      onSuccess();
                      onClose();
                    }}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Anyway</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

const DiagnosticItem = ({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) => (
  <div className="space-y-1">
    <div className="flex items-center space-x-2 text-zinc-500">
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-tighter">{label}</span>
    </div>
    <p className={`text-xs font-mono font-bold truncate ${color}`}>{value}</p>
  </div>
);

const SkeletonRow = () => (
  <div className="space-y-2 animate-pulse">
    <div className="w-12 h-2 bg-zinc-800 rounded" />
    <div className="w-24 h-3 bg-zinc-800 rounded" />
  </div>
);

export default HealthCheckModal;
