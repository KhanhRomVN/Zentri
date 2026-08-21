import { memo } from 'react';
import { Plus, Trash2, Lock, Unlock } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';

interface EdgeToolbarProps {
  edgeId: string;
  position: { x: number; y: number };
  locked?: boolean;
  onInsert: (edgeId: string) => void;
  onDelete: (edgeId: string) => void;
  onLockToggle: (edgeId: string) => void;
}

export const EdgeToolbar = memo(
  ({ edgeId, position, locked, onInsert, onDelete, onLockToggle }: EdgeToolbarProps) => {
    return (
      <div
        className="absolute z-50 flex items-center gap-1 bg-card-background border border-border rounded-lg p-1 shadow-lg"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInsert(edgeId);
          }}
          className="p-1.5 rounded hover:bg-sidebar-item-hover text-text-secondary hover:text-text-primary transition-colors"
          title="Insert node"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(edgeId);
          }}
          className="p-1.5 rounded hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLockToggle(edgeId);
          }}
          className="p-1.5 rounded hover:bg-sidebar-item-hover text-text-secondary hover:text-text-primary transition-colors"
          title={locked ? 'Unlock' : 'Lock'}
        >
          {locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
        </button>
      </div>
    );
  },
);

EdgeToolbar.displayName = 'EdgeToolbar';
