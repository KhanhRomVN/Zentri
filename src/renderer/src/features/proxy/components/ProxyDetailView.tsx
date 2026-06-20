import React, { FC } from 'react';
import { Proxy } from '../types';
import {
  Shield,
  Globe,
  Activity,
  CreditCard,
  Clock,
  Zap,
  Server,
  MapPin,
  Lock,
  Edit3,
  ExternalLink,
  History as HistoryIcon,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

interface ProxyDetailViewProps {
  proxy: Proxy;
  onEdit: () => void;
  onShowHistory: () => void;
  onClose: () => void;
}

const DetailItem: FC<{
  icon: any;
  label: string;
  value: string | number | React.ReactNode;
  className?: string;
  valueClassName?: string;
}> = ({ icon: Icon, label, value, className, valueClassName }) => (
  <div className={cn('flex flex-col gap-1.5 p-4 rounded-2xl bg-muted/5 border border-border/10 transition-all hover:bg-muted/10', className)}>
    <div className="flex items-center gap-2 text-muted-foreground/50">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className={cn('text-[13px] font-bold text-foreground/90 truncate', valueClassName)}>
      {value || 'N/A'}
    </div>
  </div>
);

const ProxyDetailView: FC<ProxyDetailViewProps> = ({ proxy, onEdit, onShowHistory, onClose }) => {
  const getDerivedStatus = (proxy: Proxy) => {
    if (proxy.status === 'trash' || proxy.status === 'disabled') return proxy.status;
    if (proxy.expiredAt) {
      const expiry = new Date(proxy.expiredAt).getTime();
      if (expiry <= Date.now()) return 'expired';
    }
    return proxy.status;
  };

  const status = getDerivedStatus(proxy);

  return (
    <div className="flex flex-col h-full bg-background/40 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative border-l border-border/50">
      {/* Header Area */}
      <div className="h-[75px] shrink-0 px-10 flex items-center justify-between border-b border-border/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Server className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/90 leading-none">
              Node Details
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-mono text-muted-foreground/60">
                {proxy.host}:{proxy.port}
              </span>
              <div className={cn(
                'w-1.5 h-1.5 rounded-full',
                status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
              )} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onShowHistory}
            className="flex items-center gap-2 px-4 h-10 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            View History
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 h-10 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Node
          </button>
          <button
            onClick={onClose}
            className="px-4 h-10 bg-muted/10 hover:bg-muted/20 text-muted-foreground text-[11px] font-black uppercase tracking-widest rounded-xl transition-all border border-border/10 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Section 1: Connection & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <Shield className="w-4 h-4 text-indigo-400" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/50">
                Registry Identity
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <DetailItem icon={Globe} label="Host Address" value={proxy.host} valueClassName="font-mono" />
              <DetailItem icon={Zap} label="Port" value={proxy.port} valueClassName="font-mono" />
              <DetailItem icon={Lock} label="Username" value={proxy.username || 'Anonymous'} valueClassName="font-mono" />
              <DetailItem icon={Lock} label="Password" value="••••••••" valueClassName="font-mono tracking-widest" />
            </div>
          </div>

          {/* Section 2: Network Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/50">
                Technical Profile
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <DetailItem icon={Activity} label="Protocol" value={proxy.protocol?.toUpperCase()} valueClassName="text-amber-400" />
              <DetailItem icon={Shield} label="Privacy Tier" value={proxy.proxyType === 'private' ? 'EXCLUSIVE' : 'SHARED'} valueClassName="text-indigo-400" />
              <DetailItem icon={Server} label="Node Origin" value={proxy.sourceType?.toUpperCase()} valueClassName="text-emerald-400" />
              <DetailItem icon={Zap} label="Routing Mode" value={proxy.rotationType === 'static' ? 'STATIC BOUND' : 'ACTIVE MESH'} valueClassName="text-slate-400" />
            </div>
          </div>

          {/* Section 3: Localization */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <MapPin className="w-4 h-4 text-rose-400" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/50">
                Localization Matrix
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <DetailItem icon={MapPin} label="Assigned Region" value={proxy.country || 'GLOBAL'} />
              <DetailItem icon={MapPin} label="Urban Hub" value={proxy.city || 'N/A'} />
              <DetailItem icon={Globe} label="ISP Provider" value={proxy.isp || 'N/A'} valueClassName="text-primary/80" />
            </div>
          </div>

          {/* Section 4: Commercial Terms */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/50">
                Commercial Matrix
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <DetailItem icon={CreditCard} label="Billing Model" value={proxy.pricingType === 'time' ? 'TIME-BASED' : 'DATA-BASED'} />
              <DetailItem icon={CreditCard} label="Unit Price" value={`${proxy.price || 0} ${proxy.metadata?.currency || 'USD'}`} />
              <DetailItem 
                icon={Clock} 
                label="Provisioning Quota" 
                value={proxy.pricingType === 'time' ? `${proxy.durationDays || 0} DAYS` : `${proxy.bandwidthGb || 0} GB`} 
                valueClassName="text-emerald-400"
              />
              <DetailItem 
                icon={Clock} 
                label="Expiration Date" 
                value={proxy.expiredAt ? new Date(proxy.expiredAt).toLocaleDateString() : 'NEVER'} 
                valueClassName={cn(status === 'expired' ? 'text-rose-400' : 'text-amber-400')}
              />
            </div>
          </div>

          {/* Purchase URL if available */}
          {proxy.purchaseUrl && (
            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Subscription Portal</span>
                  <span className="text-sm font-bold text-foreground/80 truncate max-w-md">{proxy.purchaseUrl}</span>
                </div>
              </div>
              <a 
                href={proxy.purchaseUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 h-10 bg-primary text-white hover:bg-primary/90 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                Open Portal
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProxyDetailView;
