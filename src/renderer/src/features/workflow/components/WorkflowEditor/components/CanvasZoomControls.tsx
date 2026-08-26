import { ZoomIn, ZoomOut, Home } from 'lucide-react';
import { Panel } from '@xyflow/react';
import { Tooltip } from '../../shared/Tooltip';

interface CanvasZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onGoToRoot: () => void;
}

export const CanvasZoomControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onGoToRoot,
}: CanvasZoomControlsProps) => {
  return (
    <Panel position="bottom-left">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card-background/95 px-3 py-2 shadow-lg backdrop-blur">
        <Tooltip content="Zoom out" side="top">
          <button
            onClick={onZoomOut}
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </Tooltip>
        <span className="min-w-[3rem] text-center text-xs font-semibold text-text-primary">
          {zoom}%
        </span>
        <Tooltip content="Zoom in" side="top">
          <button
            onClick={onZoomIn}
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </Tooltip>
        <div className="mx-1 h-4 w-px bg-border" />
        <Tooltip content="Go to root node" side="top">
          <button
            onClick={onGoToRoot}
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
          >
            <Home className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </Panel>
  );
};