import { useState } from 'react';
import { Settings } from 'lucide-react';
import { GeneralSettings } from './components/General';
import HeaderBar from './components/HeaderBar';
import { cn } from '../../shared/lib/utils';
import { useAccentColors } from '../../hooks/useAccentColors';

type Tab = 'general';

const Setting = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const { getColorByIndex, toRgba } = useAccentColors();

  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: Settings,
      description: 'Repository and storage settings',
      color: '#3b82f6',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden border-t border-r border-b border-border">
      <HeaderBar title="Setting" />
      <div className="flex flex-1 overflow-hidden">
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
                    !isActive &&
                      'text-muted-foreground hover:text-foreground hover:bg-sidebar-item-hover',
                    isActive && 'text-[--tab-color]',
                  )}
                  style={
                    {
                      '--tab-color': tabColor,
                      background: isActive ? toRgba(tabColor, 0.1) : undefined,
                    } as React.CSSProperties
                  }
                >
                  <tab.icon
                    className="w-5 h-5 flex-shrink-0 transition-colors"
                    style={{ color: isActive ? tabColor : undefined }}
                  />
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-background/50">
          <div className="flex-1 overflow-hidden">
            <div className="h-full">
              {activeTab === 'general' && (
                <div className="p-8 h-full overflow-auto">
                  <GeneralSettings />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Setting;
