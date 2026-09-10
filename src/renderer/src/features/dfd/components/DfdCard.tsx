import { memo, useState } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import type { DfdModel } from '../types';
import { ProblemStatementModal } from './ProblemStatementModal';

interface DfdCardProps {
  model: DfdModel;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Card representing a single DFD model in the sidebar
 * Styled with project tailwind tokens
 */
export const DfdCard = memo(({ model, isActive, onClick }: DfdCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const levelCount = Object.keys(model.levels).length;
  const processCount = Object.values(model.levels).filter((l) =>
    l.nodes.some((n) => n.type === 'process'),
  ).length;

  const hasProblemStatement = !!model.meta.problemStatement;

  const handleViewProblem = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          'p-3 rounded-md border cursor-pointer transition-colors',
          isActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card-background hover:border-primary/50',
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div
            className={cn(
              'text-[13px] font-semibold leading-snug',
              isActive ? 'text-primary' : 'text-text-primary',
            )}
          >
            {model.meta.modelName}
          </div>
          {hasProblemStatement && (
            <button
              onClick={handleViewProblem}
              className={cn(
                'p-1 rounded hover:bg-background/50 transition-colors',
                'text-text-tertiary hover:text-primary',
              )}
              title="Xem đề bài"
              aria-label="Xem đề bài"
            >
              <FileText size={14} />
            </button>
          )}
        </div>
        <div className="text-[10px] text-text-tertiary">
          {levelCount} mức · {processCount} tiến trình
        </div>
      </div>

      {hasProblemStatement && (
        <ProblemStatementModal
          modelName={model.meta.modelName}
          problemStatement={model.meta.problemStatement}
          notes={model.meta.notes}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
});

DfdCard.displayName = 'DfdCard';
