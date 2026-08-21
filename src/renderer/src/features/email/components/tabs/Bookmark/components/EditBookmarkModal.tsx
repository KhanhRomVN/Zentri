import { FC, useState, useEffect } from 'react';
import Modal from '../../../../../../components/ui/Modal/Modal';
import ModalHeader from '../../../../../../components/ui/Modal/ModalHeader';
import ModalBody from '../../../../../../components/ui/Modal/ModalBody';
import ModalFooter from '../../../../../../components/ui/Modal/ModalFooter';
import Button from '../../../../../../components/ui/Button/Button';
import Input from '../../../../../../components/ui/Input/Input';
import type { BookmarkNode } from '../types';

interface EditBookmarkModalProps {
  isOpen: boolean;
  bookmark: BookmarkNode | null;
  onClose: () => void;
  onSave: (bookmark: BookmarkNode, newName: string, newUrl: string) => void;
  isProfileRunning?: boolean;
}

const EditBookmarkModal: FC<EditBookmarkModalProps> = ({
  isOpen,
  bookmark,
  onClose,
  onSave,
  isProfileRunning,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (bookmark) {
      setName(bookmark.name || '');
      setUrl(bookmark.url || '');
    }
  }, [bookmark]);

  const handleSave = () => {
    if (!bookmark) return;
    onSave(bookmark, name.trim() || bookmark.name, url.trim() || bookmark.url || '');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideCloseButton>
      <ModalHeader title="Edit Bookmark" onClose={onClose} />
      <ModalBody className="space-y-4 py-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bookmark name"
            className="w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            URL
          </label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full"
          />
        </div>
        {isProfileRunning && (
          <div className="text-[10px] text-amber-400 font-semibold bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
            Profile is running. Changes will be applied after the browser is closed.
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditBookmarkModal;