import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Zap, X, ChevronDown, Settings2, Fingerprint, Network, Check, Search } from 'lucide-react';
import Portal from '../../../../shared/components/ui/Portal';
import { Switch } from '../../../../shared/components/ui/Switch';
import { cn } from '../../../../shared/lib/utils';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '../../../../shared/components/ui/dropdown';

interface ProfileLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  accountId: string;
  onLaunch: (config: { 
    fingerprintId?: string;
    proxyId?: string;
  }) => void;
}

const ProfileLaunchModal: FC<ProfileLaunchModalProps> = ({ isOpen, onClose, email, accountId, onLaunch }) => {
  const { t } = useTranslation();
  const [fingerprints, setFingerprints] = useState<any[]>([]);
  const [selectedFingerprintId, setSelectedFingerprintId] = useState<string | undefined>();
  const [isLoadingFingerprints, setIsLoadingFingerprints] = useState(false);

  const [proxies, setProxies] = useState<any[]>([]);
  const [selectedProxyId, setSelectedProxyId] = useState<string | undefined>();
  const [isLoadingProxies, setIsLoadingProxies] = useState(false);
  const [proxySearch, setProxySearch] = useState('');
  const [fingerprintSearch, setFingerprintSearch] = useState('');
  const [proxyHistory, setProxyHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingFingerprints(true);
        setIsLoadingProxies(true);
        try {
          // Fetch fingerprints
          const fps = await window.electron.ipcRenderer.invoke(
            'sqlite:all',
            'SELECT id, name, description FROM fingerprints ORDER BY created_at DESC',
          );
          setFingerprints(fps || []);

          // Fetch active proxies
          const pxs = await window.electron.ipcRenderer.invoke(
            'sqlite:all',
            "SELECT id, host, port, protocol, country, city, isp FROM proxies WHERE status = 'active' ORDER BY created_at DESC",
          );
          setProxies(pxs || []);
        } catch (error) {
          console.error('Failed to fetch modal data:', error);
        } finally {
          setIsLoadingFingerprints(false);
          setIsLoadingProxies(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProxyId) {
      const fetchHistory = async () => {
        try {
          const history = await window.electron.ipcRenderer.invoke('proxy:get-history', selectedProxyId);
          setProxyHistory(history || []);
        } catch (error) {
          console.error('Failed to fetch proxy history:', error);
        }
      };
      fetchHistory();
    } else {
      setProxyHistory([]);
    }
  }, [selectedProxyId]);

  const selectedFingerprint = fingerprints.find((f) => f.id === selectedFingerprintId);

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
                  Cấu hình Wayfern Browser
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
            {/* Proxy Section */}
            <div className="space-y-2.5 group">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  Proxy kết nối
                </label>
                {isLoadingProxies && (
                  <span className="text-[8px] text-zinc-500 font-bold uppercase animate-pulse">
                    Đang tải...
                  </span>
                )}
              </div>

              <Dropdown className="w-full">
                <DropdownTrigger className="w-full">
                  <div className="relative w-full">
                    <input
                      className={cn(
                        'w-full h-11 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 pr-10 text-xs transition-all focus:outline-none focus:border-zinc-700',
                        selectedProxyId ? 'text-zinc-200 font-bold' : 'text-zinc-500 italic',
                      )}
                      placeholder="Mặc định (Hệ thống)"
                      value={
                        proxySearch !== '' 
                          ? proxySearch 
                          : selectedProxyId 
                            ? `${proxies.find((p) => p.id === selectedProxyId)?.host}:${proxies.find((p) => p.id === selectedProxyId)?.port}`
                            : ''
                      }
                      onChange={(e) => setProxySearch(e.target.value)}
                    />
                    <ChevronDown className="w-4 h-4 text-zinc-700 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </DropdownTrigger>
                <DropdownContent
                  className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-[1100] max-h-[300px] overflow-auto custom-scrollbar"
                  minWidth="100%"
                >

                  <DropdownItem
                    className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedProxyId(undefined);
                      setProxySearch('');
                    }}
                  >
                    <span className="italic">Mặc định (Hệ thống)</span>
                    {!selectedProxyId && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </DropdownItem>

                  {proxies
                    .filter((p) => {
                      const s = proxySearch.toLowerCase();
                      return (
                        p.host.toLowerCase().includes(s) ||
                        p.country?.toLowerCase().includes(s) ||
                        p.city?.toLowerCase().includes(s) ||
                        p.isp?.toLowerCase().includes(s)
                      );
                    })
                    .map((px) => (
                      <DropdownItem
                        key={px.id}
                        className="flex items-center justify-between px-3 py-2.5 text-xs text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedProxyId(px.id);
                          setProxySearch('');
                        }}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono">
                              {px.host}:{px.port}
                            </span>
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">
                              {px.protocol}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 italic">
                            <span>{px.country || 'N/A'}</span>
                            {px.city && <span>• {px.city}</span>}
                            {px.isp && <span>• {px.isp}</span>}
                          </div>
                        </div>
                        {selectedProxyId === px.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </DropdownItem>
                    ))}
                </DropdownContent>
              </Dropdown>

              {/* Proxy Usage Warning */}
              {selectedProxyId && proxyHistory.length > 0 && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    Cảnh báo lịch sử sử dụng
                  </div>
                  <div className="space-y-1">
                    {proxyHistory.slice(0, 3).map((h, i) => (
                      <p key={i} className="text-[10px] text-zinc-400">
                        • Đã dùng cho <span className="text-zinc-200 font-bold">{h.email_address}</span>
                        {h.target_site && (
                          <> trên <span className="text-zinc-200 font-bold">{h.target_site}</span></>
                        )}
                        <span className="text-zinc-500 ml-2">({new Date(h.used_at).toLocaleDateString()})</span>
                      </p>
                    ))}
                    {proxyHistory.length > 3 && (
                      <p className="text-[9px] text-zinc-500 italic pl-3">
                        ... và {proxyHistory.length - 3} lần sử dụng khác.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Fingerprint Section */}
            <div className="space-y-2.5 group">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  Dấu vân tay (Fingerprint)
                </label>
                {isLoadingFingerprints && (
                  <span className="text-[8px] text-zinc-500 font-bold uppercase animate-pulse">
                    Đang tải...
                  </span>
                )}
              </div>

              <Dropdown className="w-full">
                <DropdownTrigger className="w-full">
                  <div className="relative w-full">
                    <input
                      className={cn(
                        'w-full h-11 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 pr-10 text-xs transition-all focus:outline-none focus:border-zinc-700',
                        selectedFingerprint ? 'text-zinc-200 font-bold' : 'text-zinc-500 italic',
                      )}
                      placeholder="Mặc định (Tự động tạo)"
                      value={
                        fingerprintSearch !== ''
                          ? fingerprintSearch
                          : selectedFingerprint
                            ? selectedFingerprint.name
                            : ''
                      }
                      onChange={(e) => setFingerprintSearch(e.target.value)}
                    />
                    <ChevronDown className="w-4 h-4 text-zinc-700 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </DropdownTrigger>
                <DropdownContent
                  className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-[1100] max-h-[300px] overflow-auto custom-scrollbar"
                  minWidth="100%"
                >
                  <DropdownItem
                    className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedFingerprintId(undefined);
                      setFingerprintSearch('');
                    }}
                  >
                    <span className="italic">Mặc định (Tự động tạo)</span>
                    {!selectedFingerprintId && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </DropdownItem>

                  {fingerprints.length > 0 && <div className="h-px bg-zinc-800 my-1 mx-2" />}

                  {fingerprints
                    .filter((f) => f.name.toLowerCase().includes(fingerprintSearch.toLowerCase()))
                    .map((fp) => (
                      <DropdownItem
                        key={fp.id}
                        className="flex items-center justify-between px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedFingerprintId(fp.id);
                          setFingerprintSearch('');
                        }}
                      >
                      <div className="flex flex-col">
                        <span className="font-bold">{fp.name}</span>
                        {fp.description && (
                          <span className="text-[10px] text-zinc-500 truncate max-w-[250px]">
                            {fp.description}
                          </span>
                        )}
                      </div>
                      {selectedFingerprintId === fp.id && (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </DropdownItem>
                  ))}
                </DropdownContent>
              </Dropdown>
            </div>

            <div className="h-px bg-zinc-800/50" />

            {/* Launch Button */}
            <button
              onClick={() => onLaunch({ 
                fingerprintId: selectedFingerprintId,
                proxyId: selectedProxyId 
              })}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 group"
            >
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                Khởi chạy
              </span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ProfileLaunchModal;
