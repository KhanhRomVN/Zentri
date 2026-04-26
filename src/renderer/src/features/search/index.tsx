import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SearchSidebar from './components/SearchSidebar';
import SearchTopNavbar from './components/SearchTopNavbar';
import SearchContentView from './components/SearchContentView';
import { SmartView } from './types/search';
import { Drawer } from '../../shared/components/ui/drawer';
import SmartViewBuilder from './components/SmartViewBuilder';

const DEFAULT_VIEWS: SmartView[] = [
  {
    id: 'claude',
    name: 'Claude.ai Profiles',
    domain: 'claude.ai',
    color: '#D97757',
    description: 'Email profiles prioritized for Claude.ai usage',
    columns: [
      {
        id: 'email',
        label: 'Email',
        type: 'email',
        isVisible: true,
        isSortable: true,
        isFilterable: true,
      },
      {
        id: 'last_used',
        label: 'Last Used',
        type: 'date',
        isVisible: true,
        isSortable: true,
        isFilterable: false,
      },
      {
        id: 'status',
        label: 'Status',
        type: 'status',
        isVisible: true,
        isSortable: true,
        isFilterable: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SearchManager = () => {
  const [views, setViews] = useState<SmartView[]>(DEFAULT_VIEWS);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const selectedView = views.find((v) => v.id === selectedViewId) || null;

  const handleCreateView = (newView: SmartView) => {
    setViews([...views, newView]);
    setIsBuilderOpen(false);
  };

  const resetSelection = () => {
    setSelectedViewId(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative selection:bg-primary/10">
      <SearchTopNavbar selectedView={selectedView} onReset={resetSelection} />

      <div className="flex-1 flex overflow-hidden">
        <SearchSidebar
          views={views}
          selectedViewId={selectedViewId}
          onSelectView={(id) => setSelectedViewId(id === 'all' ? null : id)}
          onOpenAddView={() => setIsBuilderOpen(true)}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-card/5 backdrop-blur-sm relative z-10 transition-all duration-500">
          <main className="flex-1 overflow-hidden relative text-foreground flex flex-col">
            <AnimatePresence mode="wait">
              <SearchContentView
                key={selectedViewId || 'empty'}
                selectedView={selectedView}
                onOpenAddView={() => setIsBuilderOpen(true)}
              />
            </AnimatePresence>
          </main>
        </div>
      </div>

      <SmartViewBuilder
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={handleCreateView}
      />
    </div>
  );
};

export default SearchManager;
