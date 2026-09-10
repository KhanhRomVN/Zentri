import { memo } from 'react';
import { cn } from '../../../shared/lib/utils';

interface HeaderBarProps {
  modelName: string;
  levelOptions: { id: string; label: string }[];
  currentLevelId: string;
  onLevelChange: (levelId: string) => void;
  nodeCount: number;
  flowCount: number;
}

/**
 * DFD HeaderBar — brand, model name, level tabs, node count
 * Styled with project tailwind tokens (same pattern as email HeaderBar)
 */
export const HeaderBar = memo(
  ({
    modelName,
    levelOptions,
    currentLevelId,
    onLevelChange,
    nodeCount,
    flowCount,
  }: HeaderBarProps) => {
    return (
      <header className="shrink-0 border-b border-border flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-text-primary text-sm font-semibold shrink-0">DFD</span>
          <div className="w-px h-5 bg-border shrink-0" />
          <span className="text-xs text-text-secondary truncate max-w-[240px]">
            {modelName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-card-background border border-border rounded-lg px-1 py-1">
            {levelOptions.map((opt) => {
              const isActive = opt.id === currentLevelId;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onLevelChange(opt.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <span className="text-[10px] text-text-tertiary border border-border rounded-full px-2.5 py-1 shrink-0">
            {nodeCount} node · {flowCount} luồng
          </span>
        </div>
      </header>
    );
  },
);

HeaderBar.displayName = 'HeaderBar';