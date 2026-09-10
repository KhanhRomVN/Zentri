import { memo } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

interface ProblemStatementModalProps {
  modelName: string;
  problemStatement: string;
  notes?: string[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal để hiển thị đề bài của DFD model
 */
export const ProblemStatementModal = memo(
  ({ modelName, problemStatement, notes, isOpen, onClose }: ProblemStatementModalProps) => {
    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={cn(
              'bg-card-background border border-border rounded-lg shadow-xl',
              'w-full max-w-2xl max-h-[80vh] flex flex-col',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-base font-semibold text-text-primary">Đề bài: {modelName}</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-background/50 transition-colors text-text-secondary hover:text-text-primary"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Problem Statement */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">Đề bài</h3>
                <div className="prose prose-sm max-w-none text-text-secondary">
                  {problemStatement.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-3 leading-relaxed whitespace-pre-wrap">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {notes && notes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-amber-500" />
                    <h3 className="text-sm font-semibold text-text-primary">Lưu ý</h3>
                  </div>
                  <ul className="space-y-2">
                    {notes.map((note, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-text-secondary leading-relaxed pl-4 border-l-2 border-amber-500/30"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-border">
              <button
                onClick={onClose}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  'bg-primary text-white hover:bg-primary/90',
                  'transition-colors',
                )}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </>
    );
  },
);

ProblemStatementModal.displayName = 'ProblemStatementModal';
