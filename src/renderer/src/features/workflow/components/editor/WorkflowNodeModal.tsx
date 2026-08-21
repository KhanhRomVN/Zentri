import { memo, useState, useEffect } from 'react';
import Modal from '../../../../components/ui/Modal/Modal';
import ModalHeader from '../../../../components/ui/Modal/ModalHeader';
import ModalBody from '../../../../components/ui/Modal/ModalBody';
import ModalFooter from '../../../../components/ui/Modal/ModalFooter';
import type { WorkflowNode } from '../../types';
import { CATEGORY_META } from '../../constants';

interface WorkflowNodeModalProps {
  node: WorkflowNode;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<WorkflowNode>) => void;
}

export const WorkflowNodeModal = memo(
  ({ node, isOpen, onClose, onUpdate }: WorkflowNodeModalProps) => {
    const [title, setTitle] = useState(node.title);
    const [subtitle, setSubtitle] = useState(node.subtitle);
    const [note, setNote] = useState(node.note || '');

    useEffect(() => {
      if (isOpen) {
        setTitle(node.title);
        setSubtitle(node.subtitle);
        setNote(node.note || '');
      }
    }, [isOpen, node]);

    const handleSave = () => {
      onUpdate(node.id, { title, subtitle, note });
      onClose();
    };

    const category = CATEGORY_META[node.category];
    const fieldLabel =
      node.category === 'timing'
        ? 'Duration (ms)'
        : node.category === 'logic'
          ? 'Condition Expression'
          : node.category === 'end' || node.category === 'trigger'
            ? 'Note'
            : 'Parameter';

    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg" hideCloseButton>
        <ModalHeader
          title="Edit Node"
          description={`${category.label} • ${node.type}`}
          onClose={onClose}
        />
        <ModalBody className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-primary">
              Step Name
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Enter step name..."
            />
          </div>

          {!node.pill && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-primary">
                  {fieldLabel}
                </label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder={`Enter ${fieldLabel.toLowerCase()}...`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-primary">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add internal notes..."
                  className="w-full resize-none rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Save Changes
          </button>
        </ModalFooter>
      </Modal>
    );
  },
);

WorkflowNodeModal.displayName = 'WorkflowNodeModal';
