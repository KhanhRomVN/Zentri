import { FC } from 'react';
import { Search, RefreshCw, Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { cn } from '../../../../shared/lib/utils';

interface WorkspacePanelBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onAddDevice: () => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

const WorkspacePanelBar: FC<WorkspacePanelBarProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  onAddDevice,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="flex items-stretch gap-3 px-4 py-2 h-[56px] border-b border-border bg-background/80 backdrop-blur-xl shrink-0">
      <h1 className="font-display text-[15px] font-semibold text-text-primary self-center">Devices</h1>

      <div className="ml-auto w-80 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search by name, IP, platform, group..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-full pl-9 pr-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-text-tertiary outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex items-stretch gap-2">
        <Button variant="outline" size="sm" className="h-full py-0" onClick={onRefresh} title="Refresh">
          <RefreshCw className="size-3.5" />
        </Button>
        <Button variant="solid" size="sm" className="h-full py-0" onClick={onAddDevice} title="Add Device">
          <Plus className="size-3.5" />
        </Button>

        <div className="flex items-stretch rounded-md border border-border overflow-hidden">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'px-2.5 h-full flex items-center justify-center transition-colors',
              viewMode === 'grid'
                ? 'bg-primary/20 text-primary'
                : 'bg-panel text-text-secondary hover:text-text-primary',
            )}
            title="Grid view"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={cn(
              'px-2.5 h-full flex items-center justify-center transition-colors',
              viewMode === 'table'
                ? 'bg-primary/20 text-primary'
                : 'bg-panel text-text-secondary hover:text-text-primary',
            )}
            title="Table view"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePanelBar;