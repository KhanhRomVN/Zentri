import { FC, useState } from 'react';
import { cn } from '../../../shared/lib/utils';
import { Search, Plus, Table, LayoutGrid } from 'lucide-react';
import { SmartView } from '../types/search';

interface SearchSidebarProps {
  selectedViewId: string | null;
  onSelectView: (id: string) => void;
  views: SmartView[];
  onOpenAddView: () => void;
}

const SearchSidebar: FC<SearchSidebarProps> = ({
  selectedViewId,
  onSelectView,
  views,
  onOpenAddView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredViews = views.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-[360px] shrink-0 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col relative z-20 transition-all duration-500">
      {/* Search and Action Header */}
      <div className="flex border-b border-border/50">
        <div className="flex-1 relative group bg-black/40 border-r border-border/50">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search smart views..."
            className="w-full h-14 pl-11 pr-4 bg-transparent text-sm focus:outline-none transition-all placeholder:text-muted-foreground/20"
          />
        </div>
        <button
          onClick={onOpenAddView}
          className="h-14 w-14 shrink-0 bg-black/40 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-center group"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
        </button>
      </div>

      {/* Views List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col">
          <button
            onClick={() => onSelectView('all')}
            className={cn(
              'w-full group relative flex items-center gap-4 py-3.5 px-5 transition-all duration-300 border-b border-border/20 outline-none text-left',
              selectedViewId === 'all'
                ? 'text-foreground bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/10',
            )}
          >
            <div className="w-8 h-8 shrink-0 rounded-[6px] overflow-hidden bg-white/5 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm border border-border/10">
              <LayoutGrid className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-[15px] font-bold tracking-tight truncate w-full">
                All Databases
              </span>
              <span className="text-[11px] font-medium text-muted-foreground/30 uppercase tracking-[0.15em] leading-none">
                Overview
              </span>
            </div>
          </button>

          {filteredViews.length === 0 && searchQuery && (
            <div className="flex flex-col items-center justify-center p-12 mt-10 opacity-20">
              <Search className="w-10 h-10 mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center">
                Unseen View
              </span>
            </div>
          )}

          {filteredViews.map((view) => (
            <button
              key={view.id}
              onClick={() => onSelectView(view.id)}
              className={cn(
                'w-full group relative flex items-center gap-4 py-3.5 px-5 transition-all duration-300 border-b border-border/20 outline-none text-left',
                selectedViewId === view.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/10',
              )}
              style={{
                background:
                  selectedViewId === view.id
                    ? `linear-gradient(to right, ${view.color}15, transparent)`
                    : undefined,
              }}
            >
              {selectedViewId === view.id && (
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  style={{ backgroundColor: view.color }}
                />
              )}

              {/* Icon / Favicon */}
              <div className="w-8 h-8 shrink-0 rounded-[6px] overflow-hidden bg-white/5 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm border border-border/10">
                {view.domain ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${view.domain}&sz=64`}
                    alt={view.name}
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <Table className="w-4 h-4" style={{ color: view.color }} />
                )}
              </div>

              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-[15px] font-bold tracking-tight truncate w-full">
                  {view.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground/30 uppercase tracking-[0.15em] leading-none">
                    Cols: {view.columns.length}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchSidebar;
