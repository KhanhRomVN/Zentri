import { FC, useState, useEffect } from 'react';
import { Shield, Globe, MapPin, Monitor, Cpu, Activity, RefreshCw } from 'lucide-react';

interface FingerprintTabProps {
  email: string;
}

const FingerprintTab: FC<FingerprintTabProps> = ({ email }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFingerprint = async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-fingerprint', { email });
      if (result.success) {
        setData(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch fingerprint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFingerprint();
  }, [email]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-zinc-400 animate-pulse">Đang quét dấu vân tay trình duyệt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Shield className="w-12 h-12 text-zinc-600 mb-4" />
        <p className="text-red-400 mb-2">Lỗi chẩn đoán</p>
        <p className="text-zinc-500 text-sm max-w-xs">{error}</p>
        <button
          onClick={fetchFingerprint}
          className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { fingerprint, geoData } = data;

  return (
    <div className="p-6 space-y-6 overflow-auto custom-scrollbar h-full">
      {/* Header Health */}
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center relative">
            <span className="text-xl font-bold text-emerald-400">98</span>
            <Activity className="absolute -bottom-1 -right-1 w-5 h-5 text-emerald-500 bg-zinc-900 rounded-full p-0.5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-200">Độ sạch Profile (Cleanliness)</h3>
            <p className="text-zinc-400 text-sm">Profile hoạt động tốt, dấu vân tay tự nhiên.</p>
          </div>
        </div>
        <button
          onClick={fetchFingerprint}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
          title="Làm mới"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Fingerprint */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-zinc-400 mb-2">
            <Monitor className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Trình duyệt & Phần cứng
            </span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
            <DetailRow label="User Agent" value={fingerprint.userAgent} />
            <DetailRow label="Platform" value={fingerprint.platform} />
            <DetailRow
              label="Hardware Concurrency"
              value={fingerprint.hardwareConcurrency + ' Cores'}
            />
            <DetailRow label="Screen" value={fingerprint.screen} />
            <DetailRow label="WebGL Vendor" value={fingerprint.webglVendor} />
            <DetailRow label="WebGL Renderer" value={fingerprint.webglRenderer} />
            <DetailRow
              label="Canvas Hash"
              value={fingerprint.canvasHash.substring(0, 20) + '...'}
            />
          </div>
        </div>

        {/* Connectivity & Geo */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-zinc-400 mb-2">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Kết nối & Vị trí (Proxy)
            </span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase">Địa chỉ IP</p>
                <p className="text-blue-400 font-mono">{geoData.query || 'Chưa xác định'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase">Nhà mạng (ISP)</p>
                <p className="text-zinc-300 text-sm">{geoData.isp || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg">
              <MapPin className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm text-zinc-200">
                  {geoData.city}, {geoData.regionName}
                </p>
                <p className="text-xs text-zinc-500">
                  {geoData.country} ({geoData.countryCode})
                </p>
              </div>
            </div>

            {/* Static Map Placeholder */}
            <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden relative border border-zinc-700">
              <img
                src={`https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${geoData.lon},${geoData.lat}&z=10&l=map&size=450,250`}
                className="w-full h-full object-cover grayscale opacity-50"
                alt="Proxy Location Map"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                <div className="w-2 h-2 bg-red-500 rounded-full absolute" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 flex flex-col space-y-1">
    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">{label}</span>
    <span className="text-xs text-zinc-300 break-all leading-relaxed">{value}</span>
  </div>
);

export default FingerprintTab;
