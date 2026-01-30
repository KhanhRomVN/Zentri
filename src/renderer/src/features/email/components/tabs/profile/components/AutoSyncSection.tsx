import { Settings2, Zap, Clock } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
const SectionHeader = ({ label, icon: Icon }: { label: string; icon: any }) => (
  <div className="flex items-center gap-2 text-foreground/80 pb-4 border-b border-border/50 mb-6">
    <Icon className="w-5 h-5 text-primary" />
    <span className="text-base font-semibold tracking-tight">{label}</span>
  </div>
);

interface AutoSyncSectionProps {
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  syncInterval: string;
  setSyncInterval: (interval: string) => void;
  smartSyncEnabled: boolean;
  setSmartSyncEnabled: (enabled: boolean) => void;
}

export const AutoSyncSection = ({
  autoSyncEnabled,
  setAutoSyncEnabled,
  syncInterval,
  setSyncInterval,
  smartSyncEnabled,
  setSmartSyncEnabled,
}: AutoSyncSectionProps) => {
  return (
    <section className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
      <SectionHeader label="Maintenance & Auto-Sync" icon={Settings2} />
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Background Sync
            </h3>
            <p className="text-xs text-muted-foreground">Keep sessions alive automatically</p>
          </div>
          <button
            onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
            className={cn(
              'w-11 h-6 rounded-full transition-all duration-300 relative px-1 flex items-center',
              autoSyncEnabled ? 'bg-primary' : 'bg-muted',
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300',
                autoSyncEnabled ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="space-y-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              Smart Expiration Watch
            </h3>
            <p className="text-xs text-muted-foreground">Sync when tokens are expiring soon</p>
          </div>
          <button
            onClick={() => setSmartSyncEnabled(!smartSyncEnabled)}
            disabled={!autoSyncEnabled}
            className={cn(
              'w-11 h-6 rounded-full transition-all duration-300 relative px-1 flex items-center',
              smartSyncEnabled && autoSyncEnabled ? 'bg-emerald-500' : 'bg-muted',
              !autoSyncEnabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300',
                smartSyncEnabled && autoSyncEnabled ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="space-y-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Sync Interval
            </h3>
            <p className="text-xs text-muted-foreground">How often to refresh data</p>
          </div>
          <select
            value={syncInterval}
            onChange={(e) => setSyncInterval(e.target.value)}
            disabled={!autoSyncEnabled}
            className="bg-transparent border border-border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 hover:bg-muted/50 transition-colors cursor-pointer text-foreground"
          >
            <option value="6" className="bg-popover text-popover-foreground">
              Every 6 hrs
            </option>
            <option value="12" className="bg-popover text-popover-foreground">
              Every 12 hrs
            </option>
            <option value="24" className="bg-popover text-popover-foreground">
              Every 24 hrs
            </option>
          </select>
        </div>
      </div>
    </section>
  );
};
