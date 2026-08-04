import { FC } from 'react';
import { Shield, Check, ChevronDown, Globe, MapPin, Clock, Monitor } from 'lucide-react';
import { cn } from '../../../../../shared/lib/utils';
import ModalHeader from '../../../../../components/ui/Modal/ModalHeader';
import ModalBody from '../../../../../components/ui/Modal/ModalBody';
import ModalFooter from '../../../../../components/ui/Modal/ModalFooter';
import Input from '../../../../../components/ui/Input/Input';
import Dropdown from '../../../../../components/ui/Dropdown/Dropdown';
import { DropdownTrigger } from '../../../../../components/ui/Dropdown/DropdownTrigger';
import { DropdownContent } from '../../../../../components/ui/Dropdown/DropdownContent';
import { DropdownItem } from '../../../../../components/ui/Dropdown/DropdownItem';
import Button from '../../../../../components/ui/Button/Button';
import { IpApiResponse } from '../fingerprint-generator';
import { Fingerprint } from '../fingerprint';
import { OS_ICONS } from './types';

interface LaunchConfigProps {
  onClose: () => void;
  email: string;
  targetUrl?: string;
  targetTitle?: string;
  ipData: IpApiResponse | null;
  isLoadingIp: boolean;
  ipError: string;
  fingerprints: Fingerprint[];
  selectedFingerprintId: string | undefined;
  selectedFingerprint: Fingerprint | undefined;
  proxies: any[];
  selectedProxyId: string | undefined;
  selectedProxy: any;
  proxySearch: string;
  proxyHistory: any[];
  filteredProxies: any[];
  onProxySearchChange: (v: string) => void;
  onSelectProxy: (id?: string) => void;
  onOpenPicker: () => void;
  onLaunch: () => void;
}

const LaunchConfig: FC<LaunchConfigProps> = ({
  onClose,
  email,
  targetUrl,
  targetTitle,
  ipData,
  isLoadingIp,
  ipError,
  fingerprints,
  selectedFingerprint,
  selectedProxyId,
  selectedProxy,
  proxySearch,
  proxyHistory,
  filteredProxies,
  onProxySearchChange,
  onSelectProxy,
  onOpenPicker,
  onLaunch,
}) => {
  return (
    <>
      <ModalHeader title="Browser Configuration" description={email} onClose={onClose} />
      <ModalBody className="space-y-5 py-4">
        {targetUrl && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center p-1.5 border border-border shadow-sm shrink-0">
              <img
                src={`https://www.google.com/s2/favicons?domain=${targetUrl}&sz=64`}
                className="w-full h-full object-contain"
                alt=""
                onError={(e: any) => (e.target.style.display = 'none')}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {targetTitle || targetUrl}
              </p>
              <p className="text-xs text-muted-foreground/60 truncate font-mono">{targetUrl}</p>
            </div>
          </div>
        )}

        {isLoadingIp && (
          <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-xl animate-pulse">
            <Globe className="w-4 h-4 text-secondary" />
            <span className="text-xs text-secondary">Detecting IP location...</span>
          </div>
        )}
        {ipError && (
          <div className="flex items-center gap-2 p-3 bg-danger/5 border border-danger/20 rounded-xl">
            <Globe className="w-4 h-4 text-danger shrink-0" />
            <span className="text-xs text-danger">{ipError}</span>
          </div>
        )}
        {ipData && !isLoadingIp && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-bold text-primary">{ipData.query}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-secondary shrink-0" />
                <span className="text-xs text-foreground">
                  {ipData.city}, {ipData.country}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-secondary shrink-0" />
                <span className="text-xs text-foreground">{ipData.timezone}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <span className="text-[10px] text-secondary truncate">
                  {ipData.isp} • {ipData.org}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary">Proxy Connection</label>
          <Dropdown
            open={proxySearch !== '' || !!selectedProxyId}
            onOpenChange={(open) => {
              if (!open) onProxySearchChange('');
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
                onChange={(e) => onProxySearchChange(e.target.value)}
                className="w-full"
                inputClassName={cn('cursor-pointer', selectedProxyId && 'font-bold text-primary')}
                rightIcon={<ChevronDown className="w-4 h-4 text-secondary" />}
              />
            </DropdownTrigger>
            <DropdownContent className="min-w-[300px] max-h-[300px] overflow-auto custom-scrollbar bg-dropdown-background border border-border rounded-xl shadow-2xl p-1">
              <DropdownItem
                onClick={() => onSelectProxy(undefined)}
                icon={!selectedProxyId ? <Check className="w-3.5 h-3.5 text-success" /> : undefined}
                closeOnSelect
              >
                <span className="italic">Default (System)</span>
              </DropdownItem>
              {filteredProxies.map((px) => (
                <DropdownItem
                  key={px.id}
                  onClick={() => onSelectProxy(px.id)}
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
                <Shield className="w-3.5 h-3.5" /> Usage History Warning
              </div>
              <div className="space-y-1">
                {proxyHistory.slice(0, 3).map((h, i) => (
                  <p key={i} className="text-[10px] text-secondary">
                    • Used for <span className="text-primary font-bold">{h.email_address}</span>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-secondary">Fingerprint</label>
            <span className="text-[10px] text-success font-bold">
              {fingerprints.length} variants
            </span>
          </div>
          <div
            onClick={onOpenPicker}
            className={cn(
              'p-3 border rounded-xl cursor-pointer transition-all duration-200',
              'hover:border-primary/40 hover:bg-primary/5',
              selectedFingerprint ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20',
            )}
          >
            {selectedFingerprint ? (
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {OS_ICONS[selectedFingerprint.group || 'Other'] || '💻'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {selectedFingerprint.name}
                  </p>
                  <p className="text-[10px] text-secondary truncate">
                    {selectedFingerprint.description}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-secondary" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-secondary" />
                <div className="flex-1">
                  <p className="text-sm text-secondary">Select a fingerprint</p>
                  <p className="text-[10px] text-muted-foreground/50">
                    Auto-generated based on your IP location
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-secondary" />
              </div>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="soft" onClick={onLaunch} fullWidth>
          <span className="text-xs font-black uppercase">Launch</span>
        </Button>
      </ModalFooter>
    </>
  );
};

export default LaunchConfig;
