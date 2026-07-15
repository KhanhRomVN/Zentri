import { FC } from 'react';
import { LayoutDashboard, ChevronRight, Search, Plus } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

interface SettingHeaderProps {
  tabs: Tab[];
  activeTab: string;
  serviceSearch: string;
  onServiceSearchChange: (value: string) => void;
  fingerprintSearch: string;
  onFingerprintSearchChange: (value: string) => void;
  onAddService: () => void;
  onAddFingerprint: () => void;
}

export const SettingHeader: FC<SettingHeaderProps> = ({
  tabs,
  activeTab,
  serviceSearch,
  onServiceSearchChange,
  fingerprintSearch,
  onFingerprintSearchChange,
  onAddService,
  onAddFingerprint,
}) => {
  const currentTabLabel = tabs.find((t) => t.id === activeTab)?.label || '';

  return (
    <header className="h-[40px] flex items-center justify-between px-4 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-500">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="w-4 h-4 text-text-primary -mt-0.5" />
        <ChevronRight className="w-3 h-3 text-text-primary" />
        <span className="text-text-primary text-sm">Setting</span>
        <ChevronRight className="w-3 h-3 text-text-secondary" />
        <span className="text-text-primary text-sm font-medium">{currentTabLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        {activeTab === 'services' && (
          <>
            <div className="w-80 flex items-center transition-all duration-500">
              <div className="relative flex items-center w-full h-7 bg-input-background border border-border rounded-md transition-all duration-300">
                <Search className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={serviceSearch}
                  onChange={(e) => onServiceSearchChange(e.target.value)}
                  className="w-full h-full pl-10 pr-3 bg-transparent text-sm text-foreground placeholder:text-text-secondary outline-none rounded-md"
                />
              </div>
            </div>
            <button
              onClick={onAddService}
              className="w-7 h-7 flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-primary hover:bg-primary/30 transition-all active:scale-90 border border-border group"
              title="Add Service"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" />
            </button>
          </>
        )}
        {activeTab === 'fingerprint' && (
          <>
            <div className="w-80 flex items-center transition-all duration-500">
              <div className="relative flex items-center w-full h-7 bg-input-background border border-border rounded-md transition-all duration-300">
                <Search className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search fingerprints..."
                  value={fingerprintSearch}
                  onChange={(e) => onFingerprintSearchChange(e.target.value)}
                  className="w-full h-full pl-10 pr-3 bg-transparent text-sm text-foreground placeholder:text-text-secondary outline-none rounded-md"
                />
              </div>
            </div>
            <button
              onClick={onAddFingerprint}
              className="w-7 h-7 flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-primary hover:bg-primary/30 transition-all active:scale-90 border border-border group"
              title="Add Fingerprint"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default SettingHeader;
