import { FC } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../../../../../../components/ui/Modal/Modal';
import ModalHeader from '../../../../../../components/ui/Modal/ModalHeader';
import ModalBody from '../../../../../../components/ui/Modal/ModalBody';
import ModalFooter from '../../../../../../components/ui/Modal/ModalFooter';
import Button from '../../../../../../components/ui/Button/Button';
import type { BookmarkNode } from '../types';

interface DeleteBookmarkModalProps {
  isOpen: boolean;
  bookmark: BookmarkNode | null;
  onClose: () => void;
  onConfirm: (bookmark: BookmarkNode) => void;
}

const DeleteBookmarkModal: FC<DeleteBookmarkModalProps> = ({
  isOpen,
  bookmark,
  onClose,
  onConfirm,
}) => {
  const handleDelete = () => {
    if (!bookmark) return;
    onConfirm(bookmark);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideCloseButton>
      <ModalHeader title="Delete Bookmark" onClose={onClose} />
      <ModalBody className="py-4 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-destructive/70" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground/80">
            Delete this bookmark?
          </p>
          {bookmark && (
            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[280px] mx-auto">
              {bookmark.name}
            </p>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground/50">
          This action cannot be undone.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="solid-error" onClick={handleDelete}>
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteBookmarkModal;