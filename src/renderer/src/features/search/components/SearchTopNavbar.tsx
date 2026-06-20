import { FC } from 'react';
import { Search as SearchIcon, Table, LayoutGrid } from 'lucide-react';
import { SmartView } from '../types/search';

interface SearchTopNavbarProps {
  selectedView: SmartView | null;
  onReset: () => void;
}

const SearchTopNavbar: FC<SearchTopNavbarProps> = ({ selectedView, onReset }) => {
  return (
    <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs font-bold mb-0">
          <button
            onClick={onReset}
            className="hover:text-foreground text-muted-foreground/50 transition-colors"
          >
            <SearchIcon className="w-4 h-4" />
          </button>
          <span className="text-muted-foreground/40 select-none">/</span>
          <button
            onClick={onReset}
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            Search
          </button>
          {selectedView && (
            <>
              <span className="text-muted-foreground/40 select-none">/</span>
              <span className="flex items-center gap-1.5 text-foreground/80">
                {!selectedView.domain && <Table className="w-3.5 h-3.5" />}
                {selectedView.name}
              </span>
            </>
          )}
          {!selectedView && (
            <>
              <span className="text-muted-foreground/40 select-none">/</span>
              <span className="flex items-center gap-1.5 text-muted-foreground/50">
                <LayoutGrid className="w-3.5 h-3.5" />
                Smart Views
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default SearchTopNavbar;
