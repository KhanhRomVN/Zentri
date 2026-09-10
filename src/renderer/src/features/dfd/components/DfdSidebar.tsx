import { memo } from 'react';
import type { DfdModel } from '../types';
import { DfdCard } from './DfdCard';

interface DfdSidebarProps {
  models: DfdModel[];
  activeModelId: string;
  onModelSelect: (model: DfdModel) => void;
}

/**
 * Left sidebar: list of DFD model cards
 * Styled with project tailwind tokens
 */
export const DfdSidebar = memo(
  ({ models, activeModelId, onModelSelect }: DfdSidebarProps) => {
    return (
      <div className="w-[264px] shrink-0 border-r border-border bg-card/50 overflow-y-auto p-3">
        <h4 className="text-[11px] font-semibold text-text-tertiary mb-2 pb-2 border-b border-border tracking-wide">
          DANH SÁCH DFD
        </h4>
        <div className="flex flex-col gap-2">
          {models.map((model) => (
            <DfdCard
              key={model.meta.modelName}
              model={model}
              isActive={model.meta.modelName === activeModelId}
              onClick={() => onModelSelect(model)}
            />
          ))}
        </div>
      </div>
    );
  },
);

DfdSidebar.displayName = 'DfdSidebar';