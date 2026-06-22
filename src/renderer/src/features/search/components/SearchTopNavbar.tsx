import { FC } from 'react';
import { Search as SearchIcon, ChevronRight } from 'lucide-react';
import { SmartView } from '../types/search';

interface SearchTopNavbarProps {
  selectedView: SmartView | null;
  onReset: () => void;
}

const SearchTopNavbar: FC<SearchTopNavbarProps> = ({ selectedView, onReset }) => {
  return (
    <header className="h-[48px] shrink-0 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-2">
        <button onClick={onReset} className="text-text-primary hover:text-foreground transition-colors">
          <SearchIcon className="w-4 h-4 -mt-0.5" />
        </button>
        <ChevronRight className="w-3 h-3 text-text-primary" />
        <span className="text-text-primary text-sm">Search</span>
        {selectedView && (
          <>
            <ChevronRight className="w-3 h-3 text-text-secondary" />
            <span className="text-text-primary text-sm font-medium">
              {selectedView.name}
            </span>
          </>
        )}
      </div>
    </header>
  );
};

export default SearchTopNavbar;