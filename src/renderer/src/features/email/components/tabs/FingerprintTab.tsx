import { FC, useState, useEffect } from 'react';
import {
  Shield,
  Globe,
  MapPin,
  Monitor,
  Cpu,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import Drawer from '../../../../shared/components/ui/drawer/Drawer';

interface FingerprintTabProps {
  email: string;
}

const HealthStatusItem = ({
  title,
  status,
  value,
  subValue,
  icon,
  onDetailClick,
}: {
  title: string;
  status: 'success' | 'warning' | 'error';
  value: string;
  subValue: string;
  icon: any;
  onDetailClick?: () => void;
}) => {
  const colors = {
    success: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-500',
      label: 'text-emerald-400',
    },
    warning: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      icon: 'text-amber-500',
      label: 'text-amber-400',
    },
    error: {
      bg: 'bg-red-500/5',
      border: 'border-red-500/20',
      icon: 'text-red-500',
      label: 'text-red-400',
    },
  };

  const { bg, border, icon: iconColor, label } = colors[status];

  return (
    <div
      onClick={onDetailClick}
      className={`${bg} ${border} border rounded-2xl p-3.5 flex flex-col justify-between transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[95px] h-full shadow-lg shadow-black/20 group/item ${onDetailClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between w-full">
        <div
          className={`p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50 ${iconColor} shrink-0`}
        >
          {icon}
        </div>
        <div className="text-right ml-2 overflow-hidden flex flex-col items-end">
          <p className={`text-xs font-black font-mono ${label} truncate w-full`}>{value}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{title}</p>
            {onDetailClick && (
              <ChevronRight className="w-2.5 h-2.5 text-zinc-600 group-hover/item:text-[#8b5cf6] group-hover/item:translate-x-0.5 transition-all" />
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 border-t border-zinc-800/50 pt-2 flex items-center justify-between">
        <p className="text-[10px] text-zinc-400 leading-snug line-clamp-2 min-h-[1.5em] flex-1">
          {subValue}
        </p>
        {onDetailClick && (
          <span className="text-[8px] font-black uppercase text-[#8b5cf6]/50 group-hover/item:text-[#8b5cf6] transition-colors ml-2">
            Details
          </span>
        )}
      </div>
    </div>
  );
};

const FingerprintTab: FC<FingerprintTabProps> = ({ email }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRawDrawerOpen, setIsRawDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'ip' | 'webrtc' | 'js'>('ip');

  const openDrawer = (type: 'ip' | 'webrtc' | 'js') => {
    setDrawerType(type);
    setIsRawDrawerOpen(true);
  };

  const fetchFingerprint = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electron.ipcRenderer.invoke('email:get-fingerprint', { email });
      if (result.success) {
        setData(result);
        setLoading(false);
      } else if (result.error === 'FETCH_IN_PROGRESS') {
        return;
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch fingerprint');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFingerprint();
  }, [email]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <RefreshCw className="w-8 h-8 text-[#8b5cf6] animate-spin" />
        <p className="text-zinc-400 animate-pulse text-sm">Scanning browser fingerprint...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Shield className="w-12 h-12 text-zinc-600 mb-4" />
        <p className="text-red-400 mb-2 font-bold">Diagnostic Error</p>
        <p className="text-zinc-500 text-sm max-w-xs">{error || 'No diagnostic data available'}</p>
        <button
          onClick={fetchFingerprint}
          className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
        >
          Retry Scan
        </button>
      </div>
    );
  }

  const { fingerprint, geoData, webrtc, headers, health } = data;
  const { val: healthScore, reasons } = health || { val: 100, reasons: [] };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black/20">
      {/* Breadcrumb Header */}
      <div className="px-5 py-3 border-b border-zinc-800/50 flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 select-none">
        <span>Accounts</span>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300">{email}</span>
        <span className="text-zinc-700">/</span>
        <span className="text-[#8b5cf6]">Fingerprint Diagnostics</span>
      </div>

      <div className="flex-1 p-5 space-y-5 overflow-auto custom-scrollbar">
        {/* Compact Health Score Header */}
        <div
          className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-lg"
          id="section-overview"
        >
          <div className="flex items-center space-x-5">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90">
                <circle
                  className="text-zinc-800"
                  strokeWidth="5"
                  stroke="currentColor"
                  fill="transparent"
                  r="28"
                  cx="32"
                  cy="32"
                />
                <circle
                  className={`${healthScore > 80 ? 'text-emerald-500' : healthScore > 50 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000`}
                  strokeWidth="5"
                  strokeDasharray={176}
                  strokeDashoffset={176 - (176 * healthScore) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="28"
                  cx="32"
                  cy="32"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`text-lg font-black ${healthScore > 80 ? 'text-emerald-400' : healthScore > 50 ? 'text-amber-400' : 'text-red-400'}`}
                >
                  {healthScore}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Profile Trust Score</h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed mt-0.5 max-w-sm">
                {reasons.length > 0
                  ? `Security Warning: ${reasons.join(', ')}`
                  : 'Profile is highly secure. Browser fingerprints appear natural.'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchFingerprint}
            className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl text-zinc-100 transition-all hover:scale-105 active:scale-95 border border-zinc-700/50"
            title="REFRESH DIAGNOSTICS"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Diagnostics Column */}
          <div className="space-y-4 lg:col-span-7">
            <SectionHeader
              icon={<Shield className="w-3.5 h-3.5" />}
              title="Identity Protection & Network Health"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="section-health">
              <div id="section-ip">
                <HealthStatusItem
                  title="IP & Provider"
                  status={healthScore > 50 ? 'success' : 'warning'}
                  value={geoData.query}
                  subValue={geoData.isp}
                  icon={<Globe className="w-3.5 h-3.5" />}
                  onDetailClick={() => openDrawer('ip')}
                />
              </div>

              <HealthStatusItem
                title="Anonymity Level"
                status={geoData.usageType?.includes('Residential') ? 'success' : 'warning'}
                value={geoData.usageType || 'Detection Failed'}
                subValue={
                  geoData.usageType?.includes('Residential')
                    ? 'Residential IP (Clean)'
                    : 'Proxy/Data Center Detected'
                }
                icon={<Shield className="w-3.5 h-3.5" />}
              />

              <HealthStatusItem
                title="WebRTC Shield"
                status={
                  webrtc?.leak && webrtc.leak.includes('No Leak')
                    ? 'success'
                    : webrtc?.public || webrtc?.local
                      ? 'error'
                      : 'success'
                }
                value={webrtc?.leak || 'N/A'}
                subValue={
                  webrtc?.local && webrtc.local !== 'n/a'
                    ? `Local IP Leak: ${webrtc.local}`
                    : 'No WebRTC leaks detected'
                }
                icon={<Activity className="w-3.5 h-3.5" />}
                onDetailClick={() => openDrawer('webrtc')}
              />

              <HealthStatusItem
                title="DNS Security"
                status="success"
                value="Secure"
                subValue="No DNS leaks detected"
                icon={<Shield className="w-3.5 h-3.5" />}
              />
            </div>

            <SectionHeader
              icon={<Cpu className="w-3.5 h-3.5" />}
              title="Advanced Signatures (TLS / HTTP2)"
            />
            <div
              className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/30"
              id="section-signatures"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <DetailRow label="TLS Fingerprint (JA4)" value={fingerprint.ja4} />
                <DetailRow label="JA3 Hash" value={fingerprint.ja3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <DetailRow label="Akamai Hash" value={fingerprint.akamai} />
                <DetailRow label="TCP/IP Signature" value={fingerprint.tcp} />
              </div>
            </div>
          </div>

          {/* Secondary Data Column */}
          <div className="space-y-4 lg:col-span-5">
            <div id="section-location" className="space-y-4">
              <SectionHeader icon={<MapPin className="w-3.5 h-3.5" />} title="Location & Context" />
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <MapPin className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-100">
                      {geoData.city}, {geoData.region}
                    </p>
                    <p className="text-[10px] text-zinc-500">{geoData.country}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
                    <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Timezone</p>
                    <p className="text-[11px] text-zinc-300 truncate">{geoData.timezone}</p>
                  </div>
                  <div className="p-2.5 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
                    <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Local Time</p>
                    <p className="text-[11px] text-zinc-300 truncate">{geoData.localTime}</p>
                  </div>
                </div>

                <div className="aspect-video bg-zinc-950 rounded-xl overflow-hidden relative border border-zinc-800 group">
                  <img
                    src={`https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${geoData.lon},${geoData.lat}&z=10&l=map&size=450,300`}
                    className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                    alt="Scan Location"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-ping opacity-75" />
                    <div className="w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] font-mono text-zinc-400">
                    {geoData.lat}, {geoData.lon}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <SectionHeader
                icon={<Monitor className="w-3.5 h-3.5" />}
                title="Hardware Signatures"
              />
              <button
                onClick={() => openDrawer('js')}
                className="text-[9px] font-black uppercase text-[#8b5cf6] hover:text-[#a78bfa] transition-colors flex items-center gap-1 group/btn"
              >
                <span>Full JS Context</span>
                <ChevronRight className="w-2 h-2 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/30">
              <DetailRow label="User Agent" value={fingerprint.userAgent} />
              <DetailRow label="WebGL Engine" value={fingerprint.webglRenderer} />
              <DetailRow
                label="Canvas Hash"
                value={fingerprint.canvasHash.substring(0, 32) + '...'}
              />
            </div>
          </div>
        </div>
      </div>

      <Drawer
        isOpen={isRawDrawerOpen}
        onClose={() => setIsRawDrawerOpen(false)}
        title={
          drawerType === 'ip'
            ? 'IP Diagnostic Report'
            : drawerType === 'webrtc'
              ? 'WebRTC Safety Report'
              : 'JavaScript & Hardware Context'
        }
        subtitle={
          drawerType === 'ip'
            ? `Network analysis for ${geoData.query}`
            : drawerType === 'webrtc'
              ? 'Detailed WebRTC & Media Device Leak Test'
              : 'Comprehensive DOM & Hardware API diagnostics'
        }
        width="600px"
        className="!bg-[#0c0c0c] border-l border-zinc-800 shadow-2xl"
      >
        <div className="p-1">
          {drawerType === 'ip' ? (
            <RawDataViewer data={data.rawLeakData} />
          ) : drawerType === 'webrtc' ? (
            <WebRTCDiagnosticViewer data={webrtc} />
          ) : (
            <JSDiagnosticViewer data={fingerprint} />
          )}
        </div>
      </Drawer>
    </div>
  );
};

const WebRTCDiagnosticViewer = ({ data }: { data: any }) => {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 1. Status Overview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-y border-white/5">
          <div className="w-1.5 h-3 bg-blue-500 rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
            Safety Overview
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          <DetailRow
            label="Scanned Peer IPs"
            value={data.leak}
            color={data.leak?.includes('No Leak') ? 'text-emerald-400' : 'text-red-400'}
          />
          <DetailRow label="Public WebRTC IP" value={data.publicIp} />
          <DetailRow
            label="Local WebRTC IP"
            value={data.localIp}
            color={data.localIp && data.localIp !== 'n/a' ? 'text-amber-400' : ''}
          />
        </div>
      </div>

      {/* 2. Browser Features */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-y border-white/5">
          <div className="w-1.5 h-3 bg-emerald-500 rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
            Browser Support
          </h3>
        </div>
        <div className="grid grid-cols-2 divide-x divide-white/5">
          <div className="p-4 flex flex-col gap-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              RTCPeerConnection
            </span>
            <span className="text-xs text-zinc-200">{data.support?.peerConnection}</span>
          </div>
          <div className="p-4 flex flex-col gap-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              RTCDataChannel
            </span>
            <span className="text-xs text-zinc-200">{data.support?.dataChannel}</span>
          </div>
        </div>
      </div>

      {/* 3. Media Devices */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-y border-white/5">
          <div className="w-1.5 h-3 bg-amber-500 rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
            Media Devices & Permissions
          </h3>
        </div>
        <div className="p-4 bg-zinc-950/50">
          <pre className="text-[10px] text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">
            {data.devices || 'No devices enumerated.'}
          </pre>
        </div>
      </div>

      {/* 4. SDP Log */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-y border-white/5">
          <div className="w-1.5 h-3 bg-[#8b5cf6] rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b5cf6]">
            Session Description (SDP)
          </h3>
        </div>
        <div className="p-4">
          <div className="bg-black/40 rounded-xl border border-white/5 p-4 relative group">
            <pre className="text-[10px] text-zinc-500 font-mono leading-tight max-h-[400px] overflow-auto custom-scrollbar">
              {data.sdp || 'No SDP data found.'}
            </pre>
            <div className="absolute top-2 right-2 px-2 py-1 bg-[#8b5cf6]/10 rounded text-[8px] font-black uppercase text-[#8b5cf6] border border-[#8b5cf6]/20">
              RAW SDP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const JSDiagnosticViewer = ({ data }: { data: any }) => {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 1. Screen & Window Metrics */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-y border-white/5">
          <div className="w-1.5 h-3 bg-blue-500 rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
            Screen & Visual Metrics
          </h3>
        </div>
        <div className="grid grid-cols-2 divide-x divide-white/5">
          <div className="p-4 flex flex-col gap-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              Resolution
            </span>
            <span className="text-xs text-zinc-200">{data.screen?.resolution}</span>
          </div>
          <div className="p-4 flex flex-col gap-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              Pixel Ratio
            </span>
            <span className="text-xs text-zinc-200">{data.screen?.pixelRatio}x</span>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          <DetailRow label="Viewport Size" value={data.screen?.viewport} />
          <DetailRow
            label="Available Area"
            value={`${data.screen?.availWidth}x${data.screen?.availHeight}`}
          />
          <DetailRow label="Color Depth" value={`${data.screen?.colorDepth}-bit`} />
        </div>
      </div>

      {/* 2. Client Hints (High Entropy) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-y border-white/5">
          <div className="w-1.5 h-3 bg-[#8b5cf6] rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b5cf6]">
            UADATA (Client Hints)
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          <DetailRow label="Architecture" value={data.clientHints?.architecture} />
          <DetailRow label="Full UA Version" value={data.clientHints?.fullVersion} />
          <DetailRow
            label="Platform Specs"
            value={`${data.clientHints?.platform} (Bitness: ${data.clientHints?.bitness})`}
          />
          <div className="p-4 flex flex-col gap-1.5">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
              Brand Registry
            </span>
            <code className="text-[9px] text-zinc-400 bg-black/40 p-2 rounded border border-white/5 block overflow-auto whitespace-pre">
              {data.clientHints?.brands}
            </code>
          </div>
        </div>
      </div>

      {/* 3. Hardware & API Status */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-y border-white/5">
          <div className="w-1.5 h-3 bg-amber-500 rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
            Hardware & Network APIs
          </h3>
        </div>
        <div className="grid grid-cols-2 divide-x divide-white/5 bg-zinc-950/20">
          <div className="p-4 flex flex-col gap-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              Battery
            </span>
            <span className="text-xs text-zinc-200">
              {data.battery?.status} ({Math.round(parseFloat(data.battery?.level || '0') * 100)}%)
            </span>
          </div>
          <div className="p-4 flex flex-col gap-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              Network
            </span>
            <span className="text-xs text-zinc-200">
              {data.network?.type} (RTT: {data.network?.rtt}ms)
            </span>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          <DetailRow label="Cores" value={data.navigator?.hardwareConcurrency} />
          <DetailRow label="Memory" value={`${data.navigator?.deviceMemory} GB`} />
          <DetailRow label="Preferred Language" value={data.navigator?.languages} />
        </div>
      </div>

      {/* 4. Plugins & Mime Types */}
      <div className="space-y-2 pb-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-y border-white/5">
          <div className="w-1.5 h-3 bg-red-500 rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
            Plugins & Extensions
          </h3>
        </div>
        <div className="p-4 bg-zinc-950/50">
          <pre className="text-[10px] text-zinc-500 font-mono leading-relaxed whitespace-pre-wrap">
            {data.plugins || 'No plugins detected.'}
          </pre>
        </div>
      </div>
    </div>
  );
};

const RawDataViewer = ({ data }: { data: any }) => {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {Object.entries(data).map(([section, items]: [string, any]) => {
        if (!items || typeof items !== 'object') return null;

        return (
          <div key={section} className="space-y-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-y border-white/5">
              <div className="w-1.5 h-3 bg-[#8b5cf6] rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b5cf6]">
                {section.replace(/_/g, ' ')}
              </h3>
            </div>

            <div className="divide-y divide-white/5">
              {Object.entries(items).map(([key, value]: [string, any]) => (
                <div
                  key={key}
                  className="px-4 py-3 flex flex-col gap-1 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-zinc-200 font-mono break-all leading-relaxed">
                    {typeof value === 'boolean'
                      ? value
                        ? 'YES'
                        : 'NO'
                      : typeof value === 'object'
                        ? JSON.stringify(value)
                        : value?.toString() || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SectionHeader = ({ icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center space-x-2 text-zinc-400 px-1">
    <div className="p-1.5 bg-zinc-800 rounded-lg border border-zinc-700/50">{icon}</div>
    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{title}</span>
  </div>
);

const DetailRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="p-4 flex flex-col space-y-1.5 hover:bg-white/5 transition-colors">
    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{label}</span>
    <span className={`text-xs ${color || 'text-zinc-200'} break-all leading-relaxed`}>
      {value || 'N/A'}
    </span>
  </div>
);

export default FingerprintTab;
