import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';

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

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <ModalHeader title="Create Category" onClose={onClose} />
      <ModalBody className="space-y-4">
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
        </div>
      </ModalBody>
      <ModalFooter className="justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="soft" disabled={!title.trim()} onClick={handleCreate}>
          <Plus className="w-3.5 h-3.5" /> Create
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateCategoryModal;
