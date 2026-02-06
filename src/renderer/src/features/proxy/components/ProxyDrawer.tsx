import React from 'react';
import { cn } from '../../../shared/lib/utils';
import { ProxyItem } from '../types/types';
import {
  X,
  Globe,
  Server,
  MapPin,
  Building2,
  Activity,
  Clock,
  ShieldCheck,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { Drawer } from '../../../shared/components/ui/drawer';

interface ProxyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  proxy: ProxyItem | null;
}

const ProxyDrawer: React.FC<ProxyDrawerProps> = ({ isOpen, onClose, proxy }) => {
  if (!proxy) return null;

  const details = proxy.details;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      direction="right"
      width={450}
      className="!bg-drawer-background flex flex-col"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Proxy Details</h3>
            <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
              {proxy.proxy}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Status</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  proxy.status === 'active' ? 'bg-emerald-500' : 'bg-red-500',
                )}
              />
              <span className="font-bold text-sm capitalize">{proxy.status}</span>
            </div>
          </div>
          <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Expired</span>
            </div>
            <span className="font-bold text-sm text-primary">{proxy.expired}</span>
          </div>
        </div>

        {/* Network Info */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Activity className="w-3 h-3" /> Network Intelligence
          </h4>

          <div className="bg-card/50 rounded-2xl border border-border divide-y divide-border">
            <InfoRow label="IP Address" value={details?.ip || 'Checking...'} icon={Server} isMono />
            <InfoRow label="ISP" value={details?.isp || '---'} icon={Building2} />
            <InfoRow
              label="Hostname"
              value={details?.hostname || '---'}
              icon={ExternalLink}
              isMono
            />
            <InfoRow label="ASN" value={details?.asn || '---'} icon={Cpu} isMono />
          </div>
        </div>

        {/* Location Info */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <MapPin className="w-3 h-3" /> Geographical Location
          </h4>

          <div className="bg-card/50 rounded-2xl border border-border divide-y divide-border">
            <InfoRow
              label="Country"
              value={
                <div className="flex items-center gap-2">
                  {proxy.countryCode && (
                    <img
                      src={`https://flagcdn.com/w20/${proxy.countryCode.toLowerCase()}.png`}
                      className="w-4 h-3 rounded-sm"
                    />
                  )}
                  <span>{proxy.country}</span>
                </div>
              }
              icon={Globe}
            />
            <InfoRow
              label="City / Region"
              value={`${details?.city || '---'}, ${details?.region || ''}`}
              icon={MapPin}
            />
            <InfoRow label="Timezone" value={details?.timezone || '---'} icon={Clock} />
          </div>
        </div>

        {/* Raw Data Section */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Activity className="w-3 h-3" /> Connection Type
          </h4>
          <div className="p-4 bg-muted/20 rounded-md border border-border/40 text-xs font-mono break-all text-muted-foreground">
            Usage Type: {details?.usageType || 'Residential / Business'}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex gap-3 shrink-0">
        <button className="flex-1 h-10 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-xs">
          Re-check Proxy
        </button>
        <button className="p-2.5 h-10 border border-border rounded-md hover:bg-muted text-muted-foreground transition-all">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </Drawer>
  );
};

const InfoRow = ({ label, value, icon: Icon, isMono = false }: any) => (
  <div className="flex items-center justify-between p-4">
    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
      <Icon className="w-4 h-4" />
      <span className="text-xs">{label}</span>
    </div>
    <div
      className={cn(
        'text-xs font-semibold text-foreground truncate ml-4',
        isMono ? 'font-mono' : '',
      )}
    >
      {value}
    </div>
  </div>
);

export default ProxyDrawer;
