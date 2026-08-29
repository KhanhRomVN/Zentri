import { useEffect, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { DeviceType } from '../../../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../../components/ui/Modal';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../../components/ui/Dropdown';
import { getAllTags, SERVICES } from '@renderer/constants/services';

export interface CreateWorkflowInput {
  name: string;
  deviceType: DeviceType;
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
  const [deviceType, setDeviceType] = useState<DeviceType>('website');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [description, setDescription] = useState('');
  const [platformName, setPlatformName] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setDeviceType('website');
      setTags([]);
      setTagInput('');
      setDescription('');
      setPlatformName('');
    }
  }, [open]);

  const handleAddTag = () => {
    const value = tagInput.trim().replace(/^#/, '');
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
    }
    setTagInput('');
  };

  const handleAddTagFromDropdown = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), deviceType, tags, description: description.trim() });
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
        <Input
          label="Workflow Name"
          labelClassName="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-secondary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
          placeholder="e.g. Login to application"
        />

        <div className="space-y-2.5">
          <label className="text-sm font-semibold text-text-primary/80">Device</label>
          <Dropdown>
            <DropdownTrigger>
              <button className="w-full h-10 px-3 rounded-lg bg-input-background border border-border text-sm text-text-primary outline-none hover:border-primary/50 transition-colors flex items-center justify-between">
                {deviceType === 'website' ? 'Website' : 'Mobile'}
                <ChevronDown className="w-3.5 h-3.5 text-text-secondary/50" />
              </button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem onClick={() => setDeviceType('website')}>Website</DropdownItem>
              <DropdownItem onClick={() => setDeviceType('mobile')}>Mobile</DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-text-primary/80">Platform</label>
            <span className="text-[11px] font-bold text-primary">+ New service</span>
          </div>
          <Dropdown searchable>
            <DropdownTrigger>
              <button className="w-full h-10 px-3 rounded-lg bg-input-background border border-border text-sm text-text-primary outline-none hover:border-primary/50 transition-colors flex items-center justify-between">
                <span className={platformName ? '' : 'text-text-secondary/60'}>
                  {platformName || 'Select platform...'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-text-secondary/50" />
              </button>
            </DropdownTrigger>
            <DropdownContent className="min-w-[200px]">
              {SERVICES.map((service) => (
                <DropdownItem key={service.id} onClick={() => setPlatformName(service.name)}>
                  {service.name}
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>
        </div>

        <div className="space-y-2.5">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Tags
          </label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Type tag and press Enter..."
              containerClassName="flex-1"
            />
            <Dropdown searchable>
              <DropdownTrigger>
                <button className="h-10 px-3 rounded-lg bg-input-background border border-border text-sm text-text-primary outline-none hover:border-primary/50 transition-colors flex items-center gap-1.5">
                  <ChevronDown className="w-3.5 h-3.5 text-text-secondary/50" />
                </button>
              </DropdownTrigger>
              <DropdownContent className="min-w-[200px]">
                {getAllTags().map((tag) => (
                  <DropdownItem key={tag} onClick={() => handleAddTagFromDropdown(tag)}>
                    #{tag}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-text-secondary"
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
            </div>
          )}
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
        <Button variant="soft" onClick={handleCreate} disabled={!name.trim()}>
          Create & Open Canvas
        </Button>
      </ModalFooter>
    </Modal>
  );
};