import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '../shared/lib/utils';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string) => void;
  initialTitle?: string;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  initialTitle = '',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setDescription('');
    }
  }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h3 className="text-sm font-bold text-foreground">Create Category</h3>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Category title..."
              className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
              className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-semibold border border-border text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className={cn(
              'px-4 py-2 rounded-lg transition-all font-semibold text-xs flex items-center gap-1.5',
              !title.trim()
                ? 'bg-card-background text-text-secondary cursor-not-allowed'
                : 'bg-primary/30 text-primary hover:bg-primary/40 shadow-lg shadow-primary/10',
            )}
          >
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryModal;