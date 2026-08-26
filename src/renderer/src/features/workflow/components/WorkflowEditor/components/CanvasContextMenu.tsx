import { StickyNote, Plus, Grid3x3, Clipboard } from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '../../../../../components/ui/Dropdown';
import { Kbd } from '../../../../../components/ui/Kbd/Kbd';

interface CanvasContextMenuProps {
  open: boolean;
  position: { top: number; left: number };
  onOpenChange: (open: boolean) => void;
  onPaste: () => void;
  onAddNote: () => void;
  onAddNode: () => void;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (v: boolean) => void;
  snapObject: boolean;
  setSnapObject: (v: boolean) => void;
  hasCopiedNode: boolean;
}

export const CanvasContextMenu = ({
  open,
  position,
  onOpenChange,
  onPaste,
  onAddNote,
  onAddNode,
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  snapObject,
  setSnapObject,
  hasCopiedNode,
}: CanvasContextMenuProps) => {
  return (
    <Dropdown open={open} onOpenChange={onOpenChange} strategy="fixed" position={position}>
      <DropdownTrigger>
        <div />
      </DropdownTrigger>
      <DropdownContent className="min-w-[200px]">
        <DropdownItem
          icon={<Clipboard className="h-3.5 w-3.5" />}
          onClick={onPaste}
          disabled={!hasCopiedNode}
        >
          Paste <Kbd className="ml-auto">Ctrl+V</Kbd>
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem icon={<StickyNote className="h-3.5 w-3.5" />} onClick={onAddNote}>
          Add sticky note
        </DropdownItem>
        <DropdownItem icon={<Plus className="h-3.5 w-3.5" />} onClick={onAddNode}>
          Add node
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          icon={<Grid3x3 className="h-3.5 w-3.5" />}
          onClick={() => setShowGrid(!showGrid)}
          className={showGrid ? 'bg-primary/10 text-primary' : ''}
        >
          Show grid <Kbd className="ml-auto">G</Kbd>
        </DropdownItem>
        <DropdownItem
          icon={<Grid3x3 className="h-3.5 w-3.5" />}
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={snapToGrid ? 'bg-primary/10 text-primary' : ''}
        >
          Snap to grid
        </DropdownItem>
        <DropdownItem
          icon={<Grid3x3 className="h-3.5 w-3.5" />}
          onClick={() => setSnapObject(!snapObject)}
          className={snapObject ? 'bg-primary/10 text-primary' : ''}
        >
          Snap object
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
};