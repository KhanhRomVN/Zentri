import {
  Monitor,
  Cpu,
  Globe,
  Wifi,
  MapPin,
  Clock,
  ShieldAlert,
  Fingerprint,
  Info,
} from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';

interface DetailItemProps {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  colorTheme?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan' | 'indigo' | 'gray';
}

const themeStyles = {
  blue: 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20',
  green: 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20',
  orange: 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20',
  pink: 'bg-pink-500/10 text-pink-500 group-hover:bg-pink-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500/20',
  gray: 'bg-muted text-muted-foreground group-hover:text-foreground',
};

const DetailItem = ({
  icon: Icon,
  label,
  value,
  subValue,
  colorTheme = 'gray',
}: DetailItemProps) => (
  <div className="flex items-start gap-3 p-3 rounded-md border border-border/40 bg-card/50 hover:bg-card hover:border-primary/20 transition-all group">
    <div
      className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
        themeStyles[colorTheme],
      )}
    >
      <Icon className="w-4.5 h-4.5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <div className="font-mono text-sm truncate text-foreground" title={value}>
        {value}
      </div>
      {subValue && <p className="text-[11px] text-muted-foreground mt-0.5">{subValue}</p>}
    </div>
  </div>
);

export const ProfileDetails = ({ account, profile }: { account: any; profile?: any }) => {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Technical Details
        </h3>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
          ID: {account.id}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DetailItem
          icon={Globe}
          label="User Agent"
          value={profile?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'}
          subValue="Chrome 120.0.0.0"
          colorTheme="blue"
        />
        <DetailItem
          icon={MapPin}
          label="IP Address"
          value={profile?.ip || '192.168.1.1'}
          subValue="Ho Chi Minh City, VN"
          colorTheme="cyan"
        />
        <DetailItem
          icon={Wifi}
          label="Proxy"
          value={profile?.proxy || 'Direct Connection'}
          colorTheme="orange"
        />
        <DetailItem
          icon={Clock}
          label="Timezone"
          value={profile?.timezone || 'Asia/Ho_Chi_Minh'}
          subValue="GMT+07:00"
          colorTheme="purple"
        />
        <DetailItem
          icon={Monitor}
          label="Screen Resolution"
          value="1920x1080"
          subValue="24-bit color depth"
          colorTheme="indigo"
        />
        <DetailItem
          icon={Cpu}
          label="Hardware Concurrency"
          value="8 Logical Cores"
          subValue="16GB Device Memory"
          colorTheme="pink"
        />
        <DetailItem
          icon={Fingerprint}
          label="Canvas Fingerprint"
          value="2394820394"
          subValue="Consistent"
          colorTheme="green"
        />
        <DetailItem
          icon={ShieldAlert}
          label="WebRTC Policy"
          value="Disable Non-Proxied UDP"
          subValue="Protected"
          colorTheme="blue"
        />
      </div>
    </div>
  );
};
