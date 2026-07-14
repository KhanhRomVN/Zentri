import { FC, useState, useEffect } from 'react';
import { Shield, Check, ChevronDown } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
import Modal from '../../../../components/ui/Modal/Modal';
import ModalHeader from '../../../../components/ui/Modal/ModalHeader';
import ModalBody from '../../../../components/ui/Modal/ModalBody';
import ModalFooter from '../../../../components/ui/Modal/ModalFooter';
import Input from '../../../../components/ui/Input/Input';
import Dropdown from '../../../../components/ui/Dropdown/Dropdown';
import { DropdownTrigger } from '../../../../components/ui/Dropdown/DropdownTrigger';
import { DropdownContent } from '../../../../components/ui/Dropdown/DropdownContent';
import { DropdownItem } from '../../../../components/ui/Dropdown/DropdownItem';
import Button from '../../../../components/ui/Button/Button';

interface ProfileLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  accountId: string;
  onLaunch: (config: { fingerprintId?: string; proxyId?: string }) => void;
}

const ProfileLaunchModal: FC<ProfileLaunchModalProps> = ({
  isOpen,
  onClose,
  email,
  accountId,
  onLaunch,
}) => {
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
          const fps = await window.electron.ipcRenderer.invoke(
            'sqlite:all',
            'SELECT id, name, description FROM fingerprints ORDER BY created_at DESC',
          );
          setFingerprints(fps || []);

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
          const history = await window.electron.ipcRenderer.invoke(
            'proxy:get-history',
            selectedProxyId,
          );
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

  const selectedProxy = proxies.find((p) => p.id === selectedProxyId);
  const selectedFingerprint = fingerprints.find((f) => f.id === selectedFingerprintId);

  const filteredProxies = proxies.filter((p) => {
    const s = proxySearch.toLowerCase();
    return (
      p.host.toLowerCase().includes(s) ||
      p.country?.toLowerCase().includes(s) ||
      p.city?.toLowerCase().includes(s) ||
      p.isp?.toLowerCase().includes(s)
    );
  });

  const filteredFingerprints = fingerprints.filter((f) =>
    f.name.toLowerCase().includes(fingerprintSearch.toLowerCase()),
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader
        title="Wayfern Browser Configuration"
        description={email}
        onClose={onClose}
      />
      <ModalBody className="space-y-6 py-4">
        {/* Proxy Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-secondary uppercase tracking-widest">
              Proxy Connection
            </label>
            {isLoadingProxies && (
              <span className="text-[10px] text-secondary font-bold uppercase animate-pulse">
                Loading...
              </span>
            )}
          </div>

          <Dropdown
            open={proxySearch !== '' || !!selectedProxyId}
            onOpenChange={(open) => {
              if (!open) {
                setProxySearch('');
              }
            }}
            align="start"
            side="bottom"
            strategy="fixed"
            className="w-full"
          >
            <DropdownTrigger>
              <Input
                placeholder="Default (System)"
                value={
                  proxySearch !== ''
                    ? proxySearch
                    : selectedProxyId && selectedProxy
                      ? `${selectedProxy.host}:${selectedProxy.port}`
                      : ''
                }
                onChange={(e) => {
                  setProxySearch(e.target.value);
                }}
                className="w-full"
                inputClassName={cn(
                  'cursor-pointer',
                  selectedProxyId && 'font-bold text-primary',
                )}
                rightIcon={<ChevronDown className="w-4 h-4 text-secondary" />}
              />
            </DropdownTrigger>
            <DropdownContent className="min-w-[300px] max-h-[300px] overflow-auto custom-scrollbar bg-dropdown-background border border-border rounded-xl shadow-2xl p-1">
              <DropdownItem
                onClick={() => {
                  setSelectedProxyId(undefined);
                  setProxySearch('');
                }}
                icon={!selectedProxyId ? <Check className="w-3.5 h-3.5 text-success" /> : undefined}
                closeOnSelect
              >
                <span className="italic">Default (System)</span>
              </DropdownItem>
              {filteredProxies.map((px) => (
                <DropdownItem
                  key={px.id}
                  onClick={() => {
                    setSelectedProxyId(px.id);
                    setProxySearch('');
                  }}
                  icon={
                    selectedProxyId === px.id ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : undefined
                  }
                  closeOnSelect
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
                    <div className="text-[10px] text-secondary flex items-center gap-1.5 italic">
                      <span>{px.country || 'N/A'}</span>
                      {px.city && <span>• {px.city}</span>}
                      {px.isp && <span>• {px.isp}</span>}
                    </div>
                  </div>
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>

          {selectedProxyId && proxyHistory.length > 0 && (
            <div className="p-3 bg-warn/5 border border-warn/10 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 text-warn font-bold text-[10px] uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                Usage History Warning
              </div>
              <div className="space-y-1">
                {proxyHistory.slice(0, 3).map((h, i) => (
                  <p key={i} className="text-[10px] text-secondary">
                    • Used for{' '}
                    <span className="text-primary font-bold">{h.email_address}</span>
                    {h.target_site && (
                      <>
                        {' '}
                        on <span className="text-primary font-bold">{h.target_site}</span>
                      </>
                    )}
                    <span className="text-secondary ml-2">
                      ({new Date(h.used_at).toLocaleDateString()})
                    </span>
                  </p>
                ))}
                {proxyHistory.length > 3 && (
                  <p className="text-[9px] text-secondary italic pl-3">
                    ... and {proxyHistory.length - 3} other uses.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fingerprint Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-secondary uppercase tracking-widest">
              Fingerprint
            </label>
            {isLoadingFingerprints && (
              <span className="text-[10px] text-secondary font-bold uppercase animate-pulse">
                Loading...
              </span>
            )}
          </div>

          <Dropdown
            open={fingerprintSearch !== '' || !!selectedFingerprintId}
            onOpenChange={(open) => {
              if (!open) {
                setFingerprintSearch('');
              }
            }}
            align="start"
            side="bottom"
            strategy="fixed"
            className="w-full"
          >
            <DropdownTrigger>
              <Input
                placeholder="Default (Auto-generated)"
                value={
                  fingerprintSearch !== ''
                    ? fingerprintSearch
                    : selectedFingerprintId && selectedFingerprint
                      ? selectedFingerprint.name
                      : ''
                }
                onChange={(e) => {
                  setFingerprintSearch(e.target.value);
                }}
                className="w-full"
                inputClassName={cn(
                  'cursor-pointer',
                  selectedFingerprintId && 'font-bold text-primary',
                )}
                rightIcon={<ChevronDown className="w-4 h-4 text-secondary" />}
              />
            </DropdownTrigger>
            <DropdownContent className="min-w-[300px] max-h-[300px] overflow-auto custom-scrollbar bg-dropdown-background border border-border rounded-xl shadow-2xl p-1">
              <DropdownItem
                onClick={() => {
                  setSelectedFingerprintId(undefined);
                  setFingerprintSearch('');
                }}
                icon={
                  !selectedFingerprintId ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : undefined
                }
                closeOnSelect
              >
                <span className="italic">Default (Auto-generated)</span>
              </DropdownItem>
              {fingerprints.length > 0 && <div className="h-px bg-border my-1 mx-2" />}
              {filteredFingerprints.map((fp) => (
                <DropdownItem
                  key={fp.id}
                  onClick={() => {
                    setSelectedFingerprintId(fp.id);
                    setFingerprintSearch('');
                  }}
                  icon={
                    selectedFingerprintId === fp.id ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : undefined
                  }
                  closeOnSelect
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{fp.name}</span>
                    {fp.description && (
                      <span className="text-[10px] text-secondary truncate max-w-[250px]">
                        {fp.description}
                      </span>
                    )}
                  </div>
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="soft"
          onClick={() =>
            onLaunch({ fingerprintId: selectedFingerprintId, proxyId: selectedProxyId })
          }
          fullWidth
        >
          <span className="text-xs font-black uppercase">Launch</span>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ProfileLaunchModal;