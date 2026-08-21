import { useEffect, useState } from 'react';
import { X, Globe, Smartphone } from 'lucide-react';
import type { Platform } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../shared/lib/utils';

export interface CreateWorkflowInput {
  name: string;
  platform: Platform;
  tags: string[];
  description: string;
}

interface CreateWorkflowModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateWorkflowInput) => void;
}

export const CreateWorkflowModal = ({ open, onClose, onCreate }: CreateWorkflowModalProps) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<Platform>('website');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setPlatform('website');
      setTags([]);
      setTagInput('');
      setDescription('');
    }
  }, [open]);

  const handleAddTag = () => {
    const value = tagInput.trim().replace(/^#/, '');
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), platform, tags, description: description.trim() });
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg" hideCloseButton>
      <ModalHeader
        title="Create Workflow"
        description="Define a new automated flow"
        onClose={onClose}
      />

      <ModalBody className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Workflow Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
            placeholder="e.g. Login to application"
            className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Platform
          </label>
          <div className="flex gap-2.5">
            <button
              onClick={() => setPlatform('website')}
              className={cn(
                'flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-xs font-bold transition-colors',
                platform === 'website'
                  ? 'border-yellow bg-yellow/10 text-yellow'
                  : 'border-border text-text-secondary hover:border-border-hover',
              )}
            >
              <Globe className="h-5 w-5" />
              Website
            </button>
            <button
              onClick={() => setPlatform('mobile')}
              className={cn(
                'flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-xs font-bold transition-colors',
                platform === 'mobile'
                  ? 'border-green bg-green/10 text-green'
                  : 'border-border text-text-secondary hover:border-border-hover',
              )}
            >
              <Smartphone className="h-5 w-5" />
              Mobile
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Tags
          </label>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-input-background px-2 py-2">
            {tags.map((tag, idx) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded bg-sidebar-item-hover px-2 py-0.5 text-xs text-text-secondary"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(idx)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Type tag and press Enter..."
              className="min-w-[80px] flex-1 bg-transparent px-1 py-0.5 text-xs text-text-primary outline-none placeholder:text-text-secondary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this workflow does..."
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary"
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="solid" onClick={handleCreate} disabled={!name.trim()}>
          Create & Open Canvas
        </Button>
      </ModalFooter>
    </Modal>
  );
};
