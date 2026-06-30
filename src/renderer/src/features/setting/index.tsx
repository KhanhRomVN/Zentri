import { useState } from 'react';
import { Settings, Database, Plus, Search, LayoutDashboard, ChevronRight, Shield } from 'lucide-react';
import { GeneralSettings } from './components/General';
import { ServiceManager } from './components/Service';
import { FingerprintSettings } from './components/Fingerprint';
import { cn } from '../../shared/lib/utils';
import { useAccentColors } from '../../hooks/useAccentColors';

type Tab = 'general' | 'services' | 'fingerprint';

const SettingPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [serviceSearch, setServiceSearch] = useState('');
  const { getColorByIndex, toRgba } = useAccentColors();

  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: Settings,
      description: 'Repository and storage settings',
      color: '#3b82f6',
    },
    {
      id: 'services',
      label: 'Services',
      icon: Database,
      description: 'Manage custom service providers',
      color: '#f59e0b',
    },
    {
      id: 'fingerprint',
      label: 'Fingerprint',
      icon: Shield,
      description: 'Global browser fingerprint templates',
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Unified Header */}
      <header className="h-[48px] flex items-center justify-between px-4 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-500">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-text-primary -mt-0.5" />
          <ChevronRight className="w-3 h-3 text-text-primary" />
          <span className="text-text-primary text-sm">Setting</span>
          <ChevronRight className="w-3 h-3 text-text-secondary" />
          <span className="text-text-primary text-sm font-medium">
            {tabs.find((t) => t.id === activeTab)?.label || ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'services' && (
            <>
              <div className="w-80 flex items-center transition-all duration-500">
                <div className="relative flex items-center w-full h-9 bg-input-background border border-border rounded-md transition-all duration-300">
                  <Search className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full h-full pl-10 pr-3 bg-transparent text-sm text-foreground placeholder:text-text-secondary outline-none rounded-md"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const event = new CustomEvent('add-service-click');
                  window.dispatchEvent(event);
                }}
                className="w-9 h-9 flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-primary hover:bg-primary/30 transition-all active:scale-90 border border-border group"
                title="Add Service"
              >
                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" />
              </button>
            </>
          )}
          {activeTab === 'fingerprint' && (
            <>
              <div className="w-80 flex items-center transition-all duration-500">
                <div className="relative flex items-center w-full h-9 bg-input-background border border-border rounded-md transition-all duration-300">
                  <Search className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    placeholder="Search fingerprints..."
                    className="w-full h-full pl-10 pr-3 bg-transparent text-sm text-foreground placeholder:text-text-secondary outline-none rounded-md"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const event = new CustomEvent('add-fingerprint-click');
                  window.dispatchEvent(event);
                }}
                className="w-9 h-9 flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-primary hover:bg-primary/30 transition-all active:scale-90 border border-border group"
                title="Add Fingerprint"
              >
                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar */}
        <aside className="w-[280px] border-r border-border bg-card/10 flex flex-col shrink-0">
          <nav className="flex-1 py-4 space-y-1 overflow-y-auto custom-scrollbar px-2">
            {tabs.map((tab, index) => {
              const tabColor = getColorByIndex(index);
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={cn(
                    'group relative w-full flex items-center gap-3 px-3 py-2 transition-all duration-200 rounded-lg',
                    'text-[13px] font-semibold',
                    !isActive && 'text-muted-foreground hover:text-foreground hover:bg-sidebar-item-hover',
                    isActive && 'text-[--tab-color]',
                  )}
                  style={{
                    '--tab-color': tabColor,
                    background: isActive ? toRgba(tabColor, 0.1) : undefined,
                  } as React.CSSProperties}
                >
                  <tab.icon
                    className="w-5 h-5 flex-shrink-0 transition-colors"
                    style={{ color: isActive ? tabColor : undefined }}
                  />
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Settings Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background/50">
          <div className="flex-1 overflow-hidden">
            <div className="h-full">
              {activeTab === 'general' && (
                <div className="p-8 h-full overflow-auto">
                  <GeneralSettings />
                </div>
              )}
              {activeTab === 'services' && <ServiceManager serviceSearch={serviceSearch} setServiceSearch={setServiceSearch} />}
              {activeTab === 'fingerprint' && <FingerprintSettings />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingPage;