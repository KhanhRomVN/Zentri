import { useState } from 'react';
import { Settings, Database, Plus } from 'lucide-react';
import { GeneralSettings } from './components/GeneralSettings';
import { ServiceManager } from './components/ServiceManager';
import { cn } from '../../shared/lib/utils';

type Tab = 'general' | 'services';

const SettingPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: Settings,
      description: 'Repository and storage settings',
      color: '#3b82f6', // blue-500
    },
    {
      id: 'services',
      label: 'Services',
      icon: Database,
      description: 'Manage custom service providers',
      color: '#f59e0b', // amber-500
    },
  ];

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Settings Sidebar */}
      <aside className="w-[280px] border-r border-border bg-card/50 backdrop-blur-xl flex flex-col">
        <div className="h-16 px-4 border-b border-border/50 flex items-center shrink-0">
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        </div>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                'flex items-center gap-3 py-3 px-4 mb-1 text-sm font-medium rounded-none transition-all relative group w-full',
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={{
                background:
                  activeTab === tab.id
                    ? `linear-gradient(to right, ${tab.color}15, transparent)`
                    : undefined,
              }}
            >
              {activeTab === tab.id && (
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-lg"
                  style={{ backgroundColor: tab.color }}
                />
              )}
              <tab.icon
                className="w-5 h-5 flex-shrink-0 transition-colors"
                style={{ color: activeTab === tab.id ? tab.color : undefined }}
              />
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Settings Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background/50">
        {/* Content Header */}
        <div className="h-16 px-4 border-b border-border/50 flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-foreground/80">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
          {activeTab === 'services' && (
            <button
              onClick={() => {
                // This will be passed to ServiceManager via props or context
                const event = new CustomEvent('add-service-click');
                window.dispatchEvent(event);
              }}
              className="p-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
              title="Add Service"
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full">
            {activeTab === 'general' && (
              <div className="p-8 h-full overflow-auto">
                <GeneralSettings />
              </div>
            )}
            {activeTab === 'services' && <ServiceManager />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingPage;
