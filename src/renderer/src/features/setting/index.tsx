import { useEffect, useState } from 'react';
import { Settings, Database, Plus, LayoutGrid } from 'lucide-react';
import { GeneralSettings } from './components/GeneralSettings';
import { ServiceManager } from './components/ServiceManager';
import { cn } from '../../shared/lib/utils';
import { Breadcrumb, BreadcrumbItem } from '../../shared/components/ui/breadcumb';

type Tab = 'general' | 'services';

const SettingPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleCount = (e: any) => setPendingCount(e.detail.count);
    window.addEventListener('zentri:services-pending-count', handleCount);
    return () => window.removeEventListener('zentri:services-pending-count', handleCount);
  }, []);

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
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Unified Header */}
      <header className="h-14 px-4 border-b border-border/50 flex items-center justify-between shrink-0 bg-card/50 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <LayoutGrid className="w-5 h-5 text-muted-foreground/50" />
          <Breadcrumb className="mb-0.5">
            <BreadcrumbItem text="Setting" />
            <BreadcrumbItem text={tabs.find((t) => t.id === activeTab)?.label || ''} />
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'services' && (
            <>
              {/* Optional: Add a state/effect to index.tsx to share pending count if needed, 
                  but for now we'll rely on the ServiceManager to handle its own detection button 
                  if we move it there, or just placeholder it here if it's header-wide */}
              <button
                className={cn(
                  'flex items-center gap-2.5 px-4 h-9 rounded-xl border transition-all group overflow-hidden relative',
                  pendingCount > 0
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-muted/30 text-muted-foreground border-border/50 opacity-50 cursor-not-allowed',
                )}
                disabled={pendingCount === 0}
                onClick={() => {
                  const event = new CustomEvent('detect-services-click');
                  window.dispatchEvent(event);
                }}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {pendingCount > 0 ? `Found ${pendingCount} services to sync` : 'Chrome Sync'}
                  </span>
                </div>
                {pendingCount > 0 && (
                  <div className="absolute inset-0 bg-emerald-500/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                )}
              </button>

              <button
                onClick={() => {
                  const event = new CustomEvent('add-service-click');
                  window.dispatchEvent(event);
                }}
                className="w-9 h-9 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors border border-primary/20"
                title="Add Service"
              >
                <Plus size={18} />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar */}
        <aside className="w-[280px] border-r border-border bg-card/10 flex flex-col shrink-0">
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
    </div>
  );
};

export default SettingPage;
